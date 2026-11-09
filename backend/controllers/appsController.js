import { createAccessEvent, createAlert, getAllApps, getAppById, getRecommendations, getTrustHistory, readPermissionRows, recordTrustHistory, seedDatabase, setAppStatus, updateAppScore, upsertPermission, upsertRecommendation } from '../db/repository.js';
import { buildRecommendations } from '../services/recommendationEngine.js';
import { calculateTrustScore } from '../services/trustEngine.js';
import { detectAnomalies, detectBlockedRetry } from '../services/anomalyDetector.js';
import { enforceAccessPolicy } from '../services/accessControl.js';
import { initialApps } from '../db/schema.js';

function normalizeAppEntry(app) {
  const hasOpenAlert = Array.isArray(app.openAlerts) && app.openAlerts.some((alert) => alert.status === 'open');
  const appState = {
    ...app,
    trustScore: app.trustScore,
    status: hasOpenAlert && app.trustScore >= 50 && app.trustScore < 80 ? 'Needs Review' : app.status,
  };
  return appState;
}

export async function listApps(req, res, next) {
  try {
    const apps = getAllApps();
    const filtered = apps
      .filter((app) => {
        const query = (req.query.q || '').trim().toLowerCase();
        const status = (req.query.status || '').trim().toLowerCase();
        const matchesQuery = !query || app.name.toLowerCase().includes(query) || app.category.toLowerCase().includes(query);
        const matchesStatus = !status || app.status.toLowerCase().replace(/\s+/g, '') === status.replace(/\s+/g, '');
        return matchesQuery && matchesStatus;
      })
      .map((app) => normalizeAppEntry(app));
    res.json(filtered);
  } catch (error) {
    next(error);
  }
}

export async function getApp(req, res, next) {
  try {
    const { id } = req.params;
    const app = getAppById(id);
    if (!app) {
      const error = new Error('App not found');
      error.statusCode = 404;
      error.code = 'APP_NOT_FOUND';
      throw error;
    }

    const permissions = readPermissionRows(id);
    const alerts = app.openAlerts || [];
    const recommendationSet = buildRecommendations(app.appRecord || app, permissions, alerts);
    const appData = normalizeAppEntry({ ...app, recommendations: recommendationSet });
    res.json({
      ...appData,
      recommendations: recommendationSet,
      openAlerts: alerts,
      trustBreakdown: calculateTrustScore(app.appRecord || app, permissions, (app.timeline || []), alerts).breakdown,
    });
  } catch (error) {
    next(error);
  }
}

export async function patchPermission(req, res, next) {
  try {
    const { id } = req.params;
    const { permissionName, status } = req.body;
    const appRecord = getAppById(id);
    if (!appRecord) {
      const error = new Error('App not found');
      error.statusCode = 404;
      error.code = 'APP_NOT_FOUND';
      throw error;
    }

    upsertPermission(id, permissionName, status, 'user');
    const permissions = readPermissionRows(id);
    const alerts = appRecord.openAlerts || [];
    const recentEvents = appRecord.timeline || [];
    const computed = calculateTrustScore(appRecord.appRecord || appRecord, permissions, recentEvents, alerts);
    updateAppScore(id, computed.score, computed.status);
    recordTrustHistory(id, computed.score, computed.status, computed.breakdown);

    const updatedApp = normalizeAppEntry({ ...getAppById(id), trustScore: computed.score, status: computed.status, recommendations: buildRecommendations(appRecord.appRecord || appRecord, permissions, alerts) });
    res.json(updatedApp);
  } catch (error) {
    next(error);
  }
}

export async function requestPermission(req, res, next) {
  try {
    const { id } = req.params;
    const { permissionName, purpose = 'Requested access' } = req.body;
    const app = getAppById(id);
    if (!app) throw Object.assign(new Error('App not found'), { statusCode: 404, code: 'APP_NOT_FOUND' });

    const permissionRows = readPermissionRows(id);
    const permission = permissionRows.find((row) => row.name === permissionName);
    const alert = {
      app_id: id,
      type: 'privilege-escalation',
      severity: 'HIGH',
      message: `A new permission request for ${permissionName} was logged for ${app.name}.`,
      evidence: { permissionName, purpose },
      status: 'open',
      app_name: app.name,
    };
    const created = createAlert(alert);
    const event = createAccessEvent({
      appId: id,
      resource: permissionName,
      purpose,
      background: false,
      itemCount: 1,
      count: 1,
      outcome: 'granted',
      reason: 'Requested by app',
      suspicious: 1,
    });

    if (permission) permission.status = 'allowed';
    const updated = getAppById(id);
    const computed = calculateTrustScore(updated.appRecord || updated, readPermissionRows(id), updated.timeline || [], [created]);
    updateAppScore(id, computed.score, computed.status);
    res.json({ success: true, alert: created, event, app: normalizeAppEntry({ ...updated, trustScore: computed.score, status: computed.status }) });
  } catch (error) {
    next(error);
  }
}

export async function recordAccess(req, res, next) {
  try {
    const { id } = req.params;
    const { resource, purpose, background = false, itemCount = 0, count = 1 } = req.body;
    const app = getAppById(id);
    if (!app) throw Object.assign(new Error('App not found'), { statusCode: 404, code: 'APP_NOT_FOUND' });

    const permissionRows = readPermissionRows(id);
    const appPermission = permissionRows.find((permission) => permission.name.toLowerCase() === resource.toLowerCase());
    const outcome = appPermission?.status === 'restricted' || appPermission === undefined || app.appRecord?.status === 'Dangerous' ? 'blocked' : 'granted';
    const anomalies = detectAnomalies(id, resource, purpose, background, itemCount, count, permissionRows);
    const blockedRetry = detectBlockedRetry(id, permissionRows, resource, outcome);
    const allAlerts = [...anomalies, ...(blockedRetry ? [blockedRetry] : [])];

    const event = createAccessEvent({
      appId: id,
      resource,
      purpose,
      background,
      itemCount,
      count,
      outcome,
      reason: purpose,
      suspicious: allAlerts.length > 0 || outcome === 'blocked' ? 1 : 0,
    });

    for (const alert of allAlerts) {
      createAlert({
        appId: id,
        type: alert.type,
        severity: alert.severity,
        message: alert.message,
        evidence: alert.evidence,
        status: 'open',
        appName: app.name,
      });
    }

    const freshApp = getAppById(id);
    const permissions = readPermissionRows(id);
    const alerts = (freshApp.openAlerts || []).concat(allAlerts.map((alert) => ({ app_id: id, ...alert, created_at: new Date().toISOString(), status: 'open' })));
    const computed = calculateTrustScore(freshApp.appRecord || freshApp, permissions, [...(freshApp.timeline || []), event], alerts);
    updateAppScore(id, computed.score, computed.status);
    recordTrustHistory(id, computed.score, computed.status, computed.breakdown);

    res.json({
      event,
      outcome,
      score: computed.score,
      status: computed.status,
      alerts: allAlerts,
      app: normalizeAppEntry({ ...freshApp, trustScore: computed.score, status: computed.status, recommendations: buildRecommendations(freshApp.appRecord || freshApp, permissions, alerts) }),
    });
  } catch (error) {
    next(error);
  }
}

export async function applyAction(req, res, next) {
  try {
    const { id } = req.params;
    const { action, permissionName } = req.body;
    const role = req.headers['x-role'] || 'user';
    const app = getAppById(id);
    if (!app) throw Object.assign(new Error('App not found'), { statusCode: 404, code: 'APP_NOT_FOUND' });
    if ((action === 'suspend' || action === 'revoke') && role !== 'admin') {
      const error = new Error('Only admins can suspend or revoke app access');
      error.statusCode = 403;
      error.code = 'FORBIDDEN';
      throw error;
    }

    const permissionRows = readPermissionRows(id);
    const result = enforceAccessPolicy(app.appRecord || app, permissionRows, action, permissionName);
    const alerts = app.openAlerts || [];
    const computed = calculateTrustScore(app.appRecord || app, permissionRows, app.timeline || [], alerts);
    updateAppScore(id, computed.score, computed.status);
    res.json({ success: true, effect: result.effect, app: normalizeAppEntry({ ...app, trustScore: computed.score, status: computed.status }) });
  } catch (error) {
    next(error);
  }
}

export async function applyRecommendations(req, res, next) {
  try {
    const { id } = req.params;
    const app = getAppById(id);
    if (!app) throw Object.assign(new Error('App not found'), { statusCode: 404, code: 'APP_NOT_FOUND' });
    const permissions = readPermissionRows(id);
    const recommendations = buildRecommendations(app.appRecord || app, permissions, app.openAlerts || []);
    for (const recommendation of recommendations) {
      const matchingPermission = permissions.find((item) => item.name === recommendation.permissionName);
      if (matchingPermission) {
        matchingPermission.status = 'restricted';
        upsertPermission(id, matchingPermission.name, 'restricted', 'system');
      }
      upsertRecommendation(id, recommendation.permissionName, recommendation.suggestedAction, recommendation.reason, recommendation.priority);
    }

    const updated = getAppById(id);
    const finalPermissions = readPermissionRows(id);
    const computed = calculateTrustScore(updated.appRecord || updated, finalPermissions, updated.timeline || [], updated.openAlerts || []);
    updateAppScore(id, computed.score, computed.status);
    res.json({
      success: true,
      recommendations,
      app: normalizeAppEntry({ ...updated, trustScore: computed.score, status: computed.status }),
    });
  } catch (error) {
    next(error);
  }
}

export async function getAppRecommendations(req, res, next) {
  try {
    const { id } = req.params;
    const app = getAppById(id);
    if (!app) throw Object.assign(new Error('App not found'), { statusCode: 404, code: 'APP_NOT_FOUND' });
    const recommendations = getRecommendations(id);
    const appPermissions = readPermissionRows(id);
    const alerts = app.openAlerts || [];
    const computed = buildRecommendations(app.appRecord || app, appPermissions, alerts);
    res.json({ appId: id, recommendations: recommendations.length ? recommendations : computed });
  } catch (error) {
    next(error);
  }
}

export async function getTrustHistoryEndpoint(req, res, next) {
  try {
    const { id } = req.params;
    const records = getTrustHistory(id);
    res.json(records);
  } catch (error) {
    next(error);
  }
}

export async function simulateApp(req, res, next) {
  try {
    const { id } = req.params;
    const app = getAppById(id);
    if (!app) throw Object.assign(new Error('App not found'), { statusCode: 404, code: 'APP_NOT_FOUND' });
    const permissionRows = readPermissionRows(id);
    const suspicious = createAccessEvent({
      appId: id,
      resource: 'Contacts',
      purpose: 'Secret contact read from background activity',
      background: true,
      itemCount: 35,
      count: 35,
      outcome: 'granted',
      reason: 'Background contact access without active user consent',
      suspicious: 1,
    });

    const alert = createAlert({
      appId: id,
      type: 'frequency-spike',
      severity: 'HIGH',
      message: 'The app unexpectedly read 35 private phone numbers from your contact book in the background.',
      evidence: { resource: 'Contacts', count: 35, itemCount: 35 },
      status: 'open',
      appName: app.name,
    });

    const computed = calculateTrustScore(app.appRecord || app, permissionRows, [suspicious], [alert]);
    updateAppScore(id, computed.score, computed.status);
    recordTrustHistory(id, computed.score, computed.status, computed.breakdown);
    res.json({
      app: normalizeAppEntry({ ...app, trustScore: computed.score, status: computed.status }),
      alert: { appId: id, appName: app.name, permissionName: 'Contacts', message: alert.message },
    });
  } catch (error) {
    next(error);
  }
}
