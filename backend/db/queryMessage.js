const pool = require('./Pool');

async function saveSentMessages(channel_id, sender_id, message, type = 'text', reply_to = null) {
	const { rows } = await pool.query(
		`INSERT INTO messages (channel_id, sender_id, content, type, reply_to)
		 VALUES ($1, $2, $3, $4, $5)
		 RETURNING id, channel_id, sender_id, content, type, reply_to, created_at`,
		[channel_id, sender_id, message, type, reply_to],
	);
	return rows[0] || null;
}

async function getChatHistoryQuery(channel_id, limit, offset) {
	const { rows } = await pool.query(
		`SELECT m.id, m.content, m.type, m.created_at, m.sender_id, m.reply_to,
				u.username, u.profile_picture
		 FROM messages m
		 JOIN users u ON m.sender_id = u.id
		 WHERE m.channel_id = $1
		 ORDER BY m.created_at ASC
		 LIMIT $2 OFFSET $3`,
		[channel_id, limit, offset],
	);
	return rows || [];
}

async function getSingleMessageQuery(messageId) {
	const { rows } = await pool.query(
		`SELECT m.*, u.username
		 FROM messages m
		 JOIN users u ON m.sender_id = u.id
		 WHERE m.id = $1`,
		[messageId],
	);
	return rows[0] || null;
}

async function deleteMessageQuery(messageId, userId) {
	const { rows } = await pool.query(
		`DELETE FROM messages WHERE id = $1 AND sender_id = $2 RETURNING *`,
		[messageId, userId],
	);
	return rows || null;
}

async function deleteChannelQuery(channelId) {
	const { rows } = await pool.query(`DELETE FROM channels WHERE id = $1`, [
		channelId,
	]);
	return rows || null;
}

async function getChannelById(channelId) {
	const { rows } = await pool.query(`SELECT * FROM channels WHERE id = $1`, [
		channelId,
	]);
	return rows[0] || null;
}

module.exports = {
	saveSentMessages,
	getChatHistoryQuery,
	getSingleMessageQuery,
	deleteMessageQuery,
	deleteChannelQuery,
	getChannelById,
};
