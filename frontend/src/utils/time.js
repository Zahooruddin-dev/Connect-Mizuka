function parseTimestamp(timestamp) {
	if (!timestamp) return null;
	if (typeof timestamp === 'number') return new Date(timestamp);

	let s = String(timestamp);

	if (!s.includes('T') && s.includes(' ')) {
		s = s.replace(' ', 'T');
	}

	// Trim microseconds down to milliseconds (JS only handles 3 decimal digits)
	s = s.replace(/(\.\d{3})\d+/, '$1');

	if (!s.endsWith('Z') && !s.includes('+') && !s.includes('-', 10)) {
		s = s + 'Z';
	}

	const d = new Date(s);
	return isNaN(d.getTime()) ? null : d;
}

export function formatTime(timestamp) {
	const d = parseTimestamp(timestamp);
	if (!d) return '';
	return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}