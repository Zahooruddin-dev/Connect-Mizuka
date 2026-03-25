const pool = require('./Pool');

async function saveSentMessages(channel_id, sender_id, message, type = 'text', reply_to = null) {
	console.log('[saveSentMessages] called with:', { channel_id, sender_id, message: message?.slice?.(0,30), type, reply_to });
	const { rows } = await pool.query(
		`INSERT INTO messages (channel_id, sender_id, content, type, reply_to)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, channel_id, sender_id, content, type, reply_to, created_at`,
		[channel_id, sender_id, message, type, reply_to],
	);
	console.log('[saveSentMessages] inserted row:', rows[0]?.id);
	if (!rows[0]) return null;
	const { rows: userRows } = await pool.query(
		`SELECT username, profile_picture FROM users WHERE id = $1`,
		[sender_id],
	);
	return { ...rows[0], ...userRows[0] };
}

module.exports = { saveSentMessages };