function getValidDate(timestamp) {
	if (!timestamp) return null;
	if (typeof timestamp === 'number') return new Date(timestamp);

	let s = String(timestamp);

	if (!s.includes('T') && s.includes(' ')) {
		s = s.replace(' ', 'T');
	}

	// Truncate microseconds to milliseconds — JS Date only handles 3 decimal digits
	s = s.replace(/(\.\d{3})\d+/, '$1');

	if (!s.endsWith('Z') && !s.includes('+') && !s.includes('-', 10)) {
		s = s + 'Z';
	}

	const d = new Date(s);
	return isNaN(d.getTime()) ? null : d;
}

export function resolveTimestamp(msg) {
	return msg.created_at || msg.createdAt || msg.timestamp || null;
}

export function formatTime(timestamp) {
	const d = getValidDate(timestamp);
	if (!d) return '';
	return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(timestamp) {
	const d = getValidDate(timestamp);
	if (!d) return '';

	const today     = new Date();
	const yesterday = new Date(today);
	yesterday.setDate(today.getDate() - 1);

	if (d.toDateString() === today.toDateString())     return 'Today';
	if (d.toDateString() === yesterday.toDateString()) return 'Yesterday';
	return d.toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' });
}

export function isSameDay(a, b) {
	const da = getValidDate(a);
	const db = getValidDate(b);
	if (!da || !db) return false;
	return da.toDateString() === db.toDateString();
}