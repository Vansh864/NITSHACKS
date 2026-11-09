import { createAccessEvent, createAlert, getAppById, updateAppScore, readPermissionRows } from '../db/repository.js';
import { buildRecommendations } from './recommendationEngine.js';
import { calculateTrustScore } from './trustEngine.js';

export function createSimulationScenario(step = 'normal') {
  const appIds = ['app_1', 'app_3', 'app_7'];
  const records = [];

  for (const id of appIds) {
    const app = getAppById(id);
    const permissions = readPermissionRows(id);
    if (id === 'app_3' && step !== 'normal') {
      const suspicious = createAccessEvent({
        appId: id,
        resource: 'Location',
        purpose: 'Background location ping during idle time',
        background: true,
        itemCount: 35,
        count: 35,
        outcome: 'granted',
        reason: 'Background location access triggered during sleep hours',
        suspicious: 1,
      });
      const alert = createAlert({
        appId: id,
        type: 'background-access',
        severity: 'HIGH',
        message: 'FitPulse Tracker accessed location in the background while the user was asleep.',
        evidence: { count: 35, itemCount: 35 },
        status: 'open',
        appName: app?.name || 'FitPulse Tracker',
      });
      records.push({ suspicious, alert });
    }
  }

  return records;
}

export function runSimulation(appId, permissionName = 'Contacts') {
  const app = getAppById(appId);
  const permissionRows = readPermissionRows(appId);
  const event = createAccessEvent({
    appId,
    resource: permissionName,
    purpose: 'Secret contact access from background activity',
    background: true,
    itemCount: 35,
    count: 35,
    outcome: 'granted',
    reason: 'Background access while app was minimized',
    suspicious: 1,
  });

  const alert = createAlert({
    appId,
    type: 'frequency-spike',
    severity: 'HIGH',
    message: 'The app performed a suspicious burst of contacts reads in the background.',
    evidence: { itemCount: 35, count: 35 },
    status: 'open',
    appName: app?.name || 'Unknown app',
  });

  const newScore = calculateTrustScore(app?.appRecord || { category: 'Social Network' }, permissionRows, [event], [alert]);
  updateAppScore(appId, newScore.score, newScore.status);

  const recs = buildRecommendations(app?.appRecord || { category: 'Social Network' }, permissionRows, [alert]);
  return {
    appId,
    alert,
    score: newScore.score,
    recommendations: recs,
  };
}
