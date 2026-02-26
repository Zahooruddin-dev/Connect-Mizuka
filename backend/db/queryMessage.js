const pool = require('./Pool');
async function getChatHistoryQuery(channel_id) {
	const query = `SELECT m.id, m.content,u.username,m.sender_id
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.channel_id = $1
    ORDER BY m.created_at ASC
  `;
	const { rows } = await pool.query(query, [channel_id]);
	return rows || null;
}

async function getSingleMessageQuery(messageId) {
	const query = `SELECT m.* u.username FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.id = $1`;
	const { rows } = await pool.query(query, [messageId]);
	return rows[0] || null;
}

async function deleteMessageQuery(messageId, userId) {
	const query = `DELETE FROM messages WHERE id =$1 AND sender_id =$2
  RETURNING *`;
	const { rows } = await pool.query(query, [messageId, userId]);
	return rows || null;
}
async function deleteChannelQuery(channelId) {
	const query = `DELETE FROM channels WHERE id = $1`;
	const { rows } = await pool.query(query, [channelId]);
	return rows || null;
}

module.exports = {
	getChatHistoryQuery,
	getSingleMessageQuery,
	deleteMessageQuery,
	deleteChannelQuery,
};
