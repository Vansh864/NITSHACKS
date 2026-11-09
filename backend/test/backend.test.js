import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from '../server.js';

let server;
let baseUrl;

function createUrl(pathname) {
  return new URL(pathname, baseUrl);
}

function jsonFetch(pathname, options = {}) {
  const { headers: customHeaders = {}, ...rest } = options;
  return fetch(createUrl(pathname), {
    ...rest,
    headers: { 'Content-Type': 'application/json', ...customHeaders },
  }).then(async (res) => {
    const text = await res.text();
    const json = text ? JSON.parse(text) : null;
    return { ok: res.ok, status: res.status, json };
  });
}

test.before(async () => {
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const port = server.address().port;
  baseUrl = `http://127.0.0.1:${port}`;
});

test.after(async () => {
  await new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
});

test('seed counts and contract shape', async () => {
  const res = await jsonFetch('/api/reset', { method: 'POST' });
  assert.equal(res.ok, true);

  const appsRes = await jsonFetch('/api/apps');
  assert.equal(appsRes.ok, true);
  assert.equal(appsRes.json.length, 7);

  const first = appsRes.json[0];
  assert.ok(first.id);
  assert.ok(first.name);
  assert.ok(Array.isArray(first.permissions));
  assert.ok(Array.isArray(first.timeline));
  assert.ok(first.trustScore >= 0 && first.trustScore <= 100);
  assert.ok(['Safe', 'Caution', 'Dangerous', 'Needs Review'].includes(first.status));
});

test('PATCH permission changes score and status', async () => {
  await jsonFetch('/api/reset', { method: 'POST' });
  const before = await jsonFetch('/api/apps/app_1');
  const beforeScore = before.json.trustScore;

  const patch = await jsonFetch('/api/apps/app_1/permissions', {
    method: 'PATCH',
    body: JSON.stringify({ permissionName: 'Contacts', status: 'restricted' }),
  });

  assert.equal(patch.ok, true);
  assert.ok(typeof patch.json.trustScore === 'number');
  assert.ok(patch.json.trustScore >= 0 && patch.json.trustScore <= 100);

  const app = await jsonFetch('/api/apps/app_1');
  assert.equal(app.json.permissions.find((p) => p.name === 'Contacts').status, 'restricted');
});

test('blocked access on restricted permission', async () => {
  await jsonFetch('/api/reset', { method: 'POST' });
  await jsonFetch('/api/apps/app_4/permissions', {
    method: 'PATCH',
    body: JSON.stringify({ permissionName: 'Contacts', status: 'restricted' }),
  });

  const access = await jsonFetch('/api/apps/app_4/access', {
    method: 'POST',
    body: JSON.stringify({ resource: 'Contacts', purpose: 'Attempted access', background: false, itemCount: 5, count: 2 }),
  });

  assert.equal(access.ok, true);
  assert.equal(access.json.outcome, 'blocked');
  assert.equal(access.json.alerts.length > 0, true);
});

test('spike and escalation detection', async () => {
  await jsonFetch('/api/reset', { method: 'POST' });

  const spike = await jsonFetch('/api/apps/app_3/access', {
    method: 'POST',
    body: JSON.stringify({ resource: 'Location', purpose: 'High-frequency background checks', background: true, itemCount: 40, count: 30 }),
  });
  assert.equal(spike.ok, true);
  assert.equal(spike.json.alerts.length > 0, true);

  const escalate = await jsonFetch('/api/apps/app_2/permissions/request', {
    method: 'POST',
    body: JSON.stringify({ permissionName: 'Location', purpose: 'New access' }),
  });
  assert.equal(escalate.ok, true);
  assert.equal(escalate.json.alert.type, 'privilege-escalation');
});

test('suspend and revoke role rules', async () => {
  await jsonFetch('/api/reset', { method: 'POST' });

  const userBlock = await jsonFetch('/api/apps/app_1/action', {
    method: 'POST',
    headers: { 'x-role': 'user' },
    body: JSON.stringify({ action: 'suspend' }),
  });
  assert.equal(userBlock.status, 403);

  const adminAllow = await jsonFetch('/api/apps/app_1/action', {
    method: 'POST',
    headers: { 'x-role': 'admin' },
    body: JSON.stringify({ action: 'suspend' }),
  });
  assert.equal(adminAllow.ok, true);
});

test('recommendations and history filters work', async () => {
  await jsonFetch('/api/reset', { method: 'POST' });
  const recs = await jsonFetch('/api/apps/app_1/recommendations');
  assert.ok(Array.isArray(recs.json.recommendations));
  assert.ok(recs.json.recommendations.length > 0);

  const history = await jsonFetch('/api/history?appId=app_1&type=access&limit=5');
  assert.equal(history.ok, true);
  assert.ok(Array.isArray(history.json));
});

test('challenge scenario drops FitPulse score and leaves normal apps unchanged', async () => {
  await jsonFetch('/api/reset', { method: 'POST' });
  const before = await jsonFetch('/api/apps/app_3');
  const bankBefore = await jsonFetch('/api/apps/app_6');
  const notesBefore = await jsonFetch('/api/apps/app_7');

  const scenario = await jsonFetch('/api/simulation/scenario?step=all', { method: 'POST' });
  assert.equal(scenario.ok, true);

  const after = await jsonFetch('/api/apps/app_3');
  assert.ok(after.json.trustScore <= before.json.trustScore - 20, 'FitPulse score should drop by at least 20 points');

  const alerts = await jsonFetch('/api/alerts?appId=app_3&status=open');
  assert.ok(alerts.json.some((alert) => alert.app_id === 'app_3'));

  const recs = await jsonFetch('/api/apps/app_3/recommendations');
  assert.ok(recs.json.recommendations.length > 0);

  const bankAfter = await jsonFetch('/api/apps/app_6');
  const notesAfter = await jsonFetch('/api/apps/app_7');
  assert.equal(bankAfter.json.trustScore, bankBefore.json.trustScore);
  assert.equal(notesAfter.json.trustScore, notesBefore.json.trustScore);
});
