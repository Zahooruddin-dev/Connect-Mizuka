const pool = require('./Pool');

async function saveSentMessages(channel_id, sender_id, message, type = 'text') {
	const { rows } = await pool.query(
		`INSERT INTO messages (channel_id, sender_id, content, type)
		 VALUES ($1, $2, $3, $4)
		 RETURNING *`,
		[channel_id, sender_id, message, type],
	);
	return rows[0] || null;
}

module.exports = { saveSentMessages };