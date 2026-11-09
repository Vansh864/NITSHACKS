import { setAppStatus } from '../db/repository.js';

export function enforceAccessPolicy(appRecord, permissionRows = [], action, permissionName) {
  if (!appRecord) throw new Error('App not found');

  if (action === 'suspend') {
    setAppStatus(appRecord.id, 'Dangerous');
    return { effect: 'suspended' };
  }

  if (action === 'revoke') {
    for (const row of permissionRows) {
      row.status = 'restricted';
    }
    setAppStatus(appRecord.id, 'Dangerous');
    return { effect: 'revoked-all' };
  }

  if (action === 'approve') {
    if (permissionName) {
      const target = permissionRows.find((item) => item.name === permissionName);
      if (target) target.status = 'allowed';
    }
    return { effect: 'approved' };
  }

  if (action === 'restrict') {
    const target = permissionRows.find((item) => item.name === permissionName);
    if (target) target.status = 'restricted';
    return { effect: 'restricted' };
  }

  return { effect: 'noop' };
}
