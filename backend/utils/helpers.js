export function toTitleCase(value = '') {
  return value
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

export function formatDisplayTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

export function formatRelativeTime(date) {
  const diffMs = Date.now() - new Date(date).getTime();
  const diffHours = Math.max(1, Math.round(diffMs / (1000 * 60 * 60)));
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

export function toIsoString(value) {
  return new Date(value).toISOString();
}

export function getStatusFromScore(score) {
  if (score < 50) return 'Dangerous';
  if (score < 80) return 'Caution';
  return 'Safe';
}

export function getStatusColor(status) {
  if (status === 'Dangerous') return 'red';
  if (status === 'Caution') return 'amber';
  if (status === 'Needs Review') return 'purple';
  return 'green';
}
