function getValidDate(timestamp) {
  if (!timestamp) return null;
  let safeTimestamp = timestamp;
  if (typeof timestamp === 'string' && !timestamp.endsWith('Z') && !timestamp.includes('T')) {
    // convert SQL datetime to ISO format
    safeTimestamp = timestamp.replace(' ', 'T') + 'Z';
  }

  const date = new Date(safeTimestamp);
  return isNaN(date.getTime()) ? null : date;
}

export function formatTime(timestamp) {
  const date = getValidDate(timestamp);
  if (!date) return '';
  
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(timestamp) {
  const date = getValidDate(timestamp);
  if (!date) return '';

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  
  return date.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
}

export function isSameDay(a, b) {
  const da = getValidDate(a);
  const db = getValidDate(b);
  if (!da || !db) return false;
  
  return da.toDateString() === db.toDateString();
}