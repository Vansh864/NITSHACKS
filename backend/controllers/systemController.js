import { initialApps } from '../db/schema.js';
import { seedDatabase, getSummary, getAppById, listAlerts, updateAlertStatus, getAllHistory, createAccessEvent, createAlert, updateAppScore, recordTrustHistory, readPermissionRows } from '../db/repository.js';
import { calculateTrustScore } from '../services/trustEngine.js';

export async function healthCheck(req, res) {
  res.json({ ok: true, service: 'E.D.I.T.H.', timestamp: new Date().toISOString() });
}

export async function resetDatabase(req, res) {
  seedDatabase(initialApps);
  res.json({ success: true, message: 'Database reset to seeded demo state.' });
}

export async function summary(req, res) {
  res.json(getSummary());
}

export async function listAlertsController(req, res) {
  const alerts = listAlerts({
    status: req.query.status,
    severity: req.query.severity,
    appId: req.query.appId,
  });
  res.json(alerts);
}

export async function patchAlert(req, res) {
  const { id } = req.params;
  const { status } = req.body;
  res.json(updateAlertStatus(Number(id), status));
}

export async function history(req, res) {
  const { appId, type, severity, startDate, endDate, limit = 50, offset = 0 } = req.query;
  res.json(getAllHistory({ appId, type, severity, startDate, endDate, limit: Number(limit), offset: Number(offset) }));
}

export async function mainScenario(req, res) {
  const step = req.query.step || 'normal';
  const normalApps = ['app_6', 'app_3', 'app_7'];

  for (const appId of normalApps) {
    const app = getAppById(appId);
    if (!app) continue;
    createAccessEvent({
      appId,
      resource: appId === 'app_6' ? 'SMS' : appId === 'app_3' ? 'Physical Activity' : 'Photos & Files',
      purpose: 'Normal app activity',
      background: false,
      itemCount: 1,
      count: 1,
      outcome: 'granted',
      reason: 'Routine user-triggered access',
      suspicious: 0,
    });
  }

  if (step === 'escalate' || step === 'all') {
    const target = getAppById('app_3');
    const permissions = readPermissionRows('app_3');
    const suspiciousEvent = createAccessEvent({
      appId: 'app_3',
      resource: 'Location',
      purpose: 'Background location read during sleep hours',
      background: true,
      itemCount: 35,
      count: 35,
      outcome: 'granted',
      reason: 'Background GPS read while the user was sleeping',
      suspicious: 1,
    });

    const alert = createAlert({
      appId: 'app_3',
      type: 'frequency-spike',
      severity: 'HIGH',
      message: 'FitPulse Tracker accessed your location 35 times in the background while you were asleep.',
      evidence: { resource: 'Location', itemCount: 35, count: 35 },
      status: 'open',
      appName: target.name,
    });

    const scoreResult = calculateTrustScore(target.appRecord || target, permissions, [suspiciousEvent], [alert]);
    updateAppScore('app_3', scoreResult.score, scoreResult.status);
    recordTrustHistory('app_3', scoreResult.score, scoreResult.status, scoreResult.breakdown);

    res.json({
      success: true,
      step,
      alert,
      appId: 'app_3',
      score: scoreResult.score,
      status: scoreResult.status,
      affectedApps: [target.name],
    });
    return;
  }

  res.json({
    success: true,
    step,
    summary: { apps: normalApps.length, affected: [] },
  });
}
