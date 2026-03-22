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

async function getChatHistoryQuery(channel_id, limit, offset) {
	const { rows } = await pool.query(
		`SELECT m.id, m.content, m.type, m.created_at, m.sender_id,
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
