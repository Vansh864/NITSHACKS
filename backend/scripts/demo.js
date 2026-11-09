import { setTimeout as delay } from 'node:timers/promises';

const baseUrl = 'http://localhost:5000/api';

async function fetchJson(path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  const text = await response.text();
  return { status: response.status, ok: response.ok, data: text ? JSON.parse(text) : null };
}

async function main() {
  console.log('Resetting database...');
  await fetchJson('/reset', { method: 'POST' });

  const before = await fetchJson('/apps');
  console.table(before.data.map((app) => ({ name: app.name, score: app.trustScore, status: app.status })));

  console.log('\nRunning challenge scenario...');
  const scenario = await fetchJson('/simulation/scenario?step=all', { method: 'POST' });
  console.log(scenario.data);

  await delay(200);
  const after = await fetchJson('/apps');
  console.log('\nAfter scenario:');
  console.table(after.data.map((app) => ({ name: app.name, score: app.trustScore, status: app.status })));
}

main().catch((error) => {
  console.error('Demo failed:', error);
  process.exit(1);
});
