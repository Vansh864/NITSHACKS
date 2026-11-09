import { initialApps } from '../data/appsData';

const BASE_URL = 'http://localhost:5000/api';

// Fetch all apps: tries live backend first, falls back to local data gracefully
export const fetchAppsData = async () => {
  try {
    const res = await fetch(`${BASE_URL}/apps`);
    if (!res.ok) throw new Error('Network error');
    return await res.json();
  } catch (err) {
    console.warn('Backend server offline. Using local frontend data.', err.message);
    return initialApps;
  }
};

export const resetAppsData = async () => {
  try {
    const res = await fetch(`${BASE_URL}/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Reset failed');
    return await res.json();
  } catch (err) {
    console.warn('Backend offline. Reset skipped.', err.message);
    return null;
  }
};

export const applyRecommendationFixes = async (appId) => {
  try {
    const res = await fetch(`${BASE_URL}/apps/${appId}/apply-recommendations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Apply recommendations failed');
    return await res.json();
  } catch (err) {
    console.warn('Backend offline. Risky permissions kept locally.', err.message);
    return null;
  }
};

export const simulateApp = async (appId) => {
  try {
    const res = await fetch(`${BASE_URL}/apps/${appId}/simulate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!res.ok) throw new Error('Simulate failed');
    return await res.json();
  } catch (err) {
    console.warn('Backend offline. Simulation skipped.', err.message);
    return null;
  }
};

// Send permission updates to backend
export const updateAppPermission = async (appId, permissionName, status) => {
  try {
    const res = await fetch(`${BASE_URL}/apps/${appId}/permissions`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ permissionName, status }),
    });
    return await res.json();
  } catch (err) {
    console.warn('Backend offline. Permission updated locally.');
  }
};