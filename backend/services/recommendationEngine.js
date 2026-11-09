export function buildRecommendations(app, permissions = [], alerts = []) {
  const recommendations = [];

  const expected = {
    'Phone Cleaner & Booster': ['Photos & Files', 'Camera'],
    'Social Network': ['Camera', 'Photos & Files', 'Microphone'],
    'Fitness & Health': ['Location', 'Physical Activity'],
    'Online Shopping': ['Location', 'Photos & Files'],
    'News & Magazines': ['Location', 'Photos & Files'],
    'Banking & Finance': ['SMS', 'Camera'],
    'Productivity & Notes': ['Photos & Files'],
  };

  const appExpected = expected[app.category] || [];

  for (const permission of permissions) {
    if (permission.status === 'allowed' && permission.risk === 'HIGH' && !appExpected.includes(permission.name)) {
      recommendations.push({
        permissionName: permission.name,
        suggestedAction: 'restrict',
        reason: `This permission is unusually risky for a ${app.category.toLowerCase()} app.`,
        priority: 95,
      });
    }

    if (permission.status === 'allowed' && permission.name === 'Contacts' && app.category !== 'Social Network') {
      recommendations.push({
        permissionName: permission.name,
        suggestedAction: 'restrict',
        reason: 'Contacts access is unnecessary for this app category and increases risk.',
        priority: 90,
      });
    }
  }

  if (alerts.some((alert) => alert.type === 'background-access' || alert.type === 'frequency-spike')) {
    recommendations.push({
      permissionName: 'Location',
      suggestedAction: 'restrict',
      reason: 'Recent suspicious background usage suggests this permission should be restricted.',
      priority: 85,
    });
  }

  return recommendations.slice(0, 4);
}
