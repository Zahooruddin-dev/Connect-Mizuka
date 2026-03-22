const pool = require('./Pool');

async function saveSentMessages(channel_id, sender_id, message, type = 'text') {
	const { rows } = await pool.query(
		`INSERT INTO messages (channel_id, sender_id, content, type)
		 VALUES ($1, $2, $3, $4)
		 RETURNING id, channel_id, sender_id, content, type, created_at`,
		[channel_id, sender_id, message, type],
	);
	if (!rows[0]) return null;
	const { rows: userRows } = await pool.query(
		`SELECT username, profile_picture FROM users WHERE id = $1`,
		[sender_id],
	);
	return { ...rows[0], ...userRows[0] };
}

module.exports = { saveSentMessages };