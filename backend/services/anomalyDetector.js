export function detectAnomalies(appId, resource, purpose, background, itemCount, count, permissions = []) {
  const alerts = [];
  const permissionNames = permissions.map((p) => p.name);

  if (resource && permissions.length && !permissionNames.includes(resource) && resource !== 'Contacts') {
    alerts.push({
      type: 'new-permission-request',
      severity: 'HIGH',
      message: `Access to ${resource} was requested without a matching permission grant.`,
      evidence: { resource, background, itemCount, count },
    });
  }

  if (background && (resource === 'Contacts' || resource === 'Location')) {
    alerts.push({
      type: 'background-access',
      severity: 'HIGH',
      message: `The app accessed ${resource} in the background while not in use.`,
      evidence: { resource, background, itemCount, count },
    });
  }

  if (count > 20 || itemCount > 40) {
    alerts.push({
      type: 'frequency-spike',
      severity: 'HIGH',
      message: `The app hit a suspicious access spike with ${count} reads and ${itemCount} items touched.`,
      evidence: { count, itemCount },
    });
  }

  if (resource === 'Contacts' && permissionNames.includes('Contacts') && background) {
    alerts.push({
      type: 'risky-combination',
      severity: 'MEDIUM',
      message: 'A risky contact + background access pattern was detected.',
      evidence: { resource, background },
    });
  }

  return alerts;
}

export function detectBlockedRetry(appId, permissionRows, resource, outcome) {
  if (outcome !== 'blocked') return null;
  const permission = permissionRows.find((entry) => entry.name === resource || entry.name === 'Contacts');
  if (!permission || permission.status !== 'restricted') return null;
  return {
    type: 'blocked-access-retry',
    severity: 'MEDIUM',
    message: `Blocked access retry to ${resource} was detected and recorded.`,
    evidence: { resource, permissionName: permission.name },
  };
}
