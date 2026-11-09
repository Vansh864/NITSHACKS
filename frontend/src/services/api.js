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