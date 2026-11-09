import { categoryExpectations } from '../db/schema.js';
import { clamp, getStatusFromScore } from '../utils/helpers.js';

export function calculateTrustScore(app, permissionRows = [], recentEvents = [], alerts = []) {
  const permissions = permissionRows || [];
  let score = 100;
  const breakdown = [];

  const riskCost = {
    LOW: 2,
    MEDIUM: 8,
    HIGH: 20,
  };

  for (const permission of permissions) {
    if (permission.status === 'allowed') {
      score -= riskCost[permission.risk] || 0;
      breakdown.push({ type: 'permission-risk', label: `${permission.name} allowed`, amount: -(riskCost[permission.risk] || 0) });
    }
  }

  const expected = categoryExpectations[app.category] || [];
  const extraPermissions = permissions.filter((permission) => permission.status === 'allowed' && !expected.includes(permission.name));
  for (const extra of extraPermissions) {
    const penalty = 10;
    score -= penalty;
    breakdown.push({ type: 'category-mismatch', label: `${extra.name} not expected for ${app.category}`, amount: -penalty });
  }

  const suspiciousAlerts = alerts.filter((alert) => alert.status !== 'resolved');
  if (suspiciousAlerts.length > 0) {
    const penalty = suspiciousAlerts.reduce((total, alert) => total + (alert.severity === 'HIGH' ? 20 : alert.severity === 'MEDIUM' ? 12 : 6), 0);
    score -= penalty;
    breakdown.push({ type: 'behaviour', label: `${suspiciousAlerts.length} open suspicious alerts`, amount: -penalty });
  }

  const recentCount = recentEvents.filter((event) => {
    const ts = new Date(event.timestamp || event.created_at).getTime();
    return Date.now() - ts < 1000 * 60 * 60 * 24 * 7;
  }).length;
  if (recentCount > 30) {
    score -= Math.min(18, recentCount / 3);
    breakdown.push({ type: 'behaviour', label: 'Elevated recent activity volume', amount: -Math.min(18, recentCount / 3) });
  }

  const restrictedHighRisk = permissions.filter((permission) => permission.status === 'restricted' && permission.risk === 'HIGH');
  for (const permission of restrictedHighRisk) {
    score += 5;
    breakdown.push({ type: 'bonus', label: `${permission.name} restricted`, amount: 5 });
  }

  const cleanWindow = recentEvents.filter((event) => event.outcome !== 'blocked' && !event.suspicious).length;
  if (cleanWindow > 10) {
    score += 6;
    breakdown.push({ type: 'bonus', label: 'Long clean usage history', amount: 6 });
  }

  score = clamp(Math.round(score), 0, 100);
  const finalStatus = score < 50 ? 'Dangerous' : score < 80 ? 'Caution' : 'Safe';
  if (suspiciousAlerts.some((alert) => alert.status === 'open') && finalStatus !== 'Dangerous') {
    return {
      score,
      status: 'Needs Review',
      breakdown,
    };
  }
  return {
    score,
    status: finalStatus,
    breakdown,
  };
}

export function syncAppScore(appId, appRecord, permissions, accessEvents, alerts, repository) {
  const computed = calculateTrustScore(appRecord, permissions, accessEvents, alerts);
  const finalStatus = computed.status;
  repository.updateAppScore(appId, computed.score, finalStatus);
  repository.recordTrustHistory(appId, computed.score, finalStatus, computed.breakdown);
  return {
    ...computed,
    appId,
  };
}

export function buildAppStatus(score, hasOpenAlert) {
  if (hasOpenAlert && score >= 50 && score < 80) return 'Needs Review';
  return getStatusFromScore(score);
}
