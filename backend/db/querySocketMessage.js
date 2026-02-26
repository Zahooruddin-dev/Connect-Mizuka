const pool = require('./Pool');
async function saveSentMessages(channel_id, sender_id, message) {
	const query = `INSERT INTO messages (channel_id,sender_id,content) VALUES ($1,$2,$3) RETURNING *`;
	const values = [channel_id, sender_id, message];
	const { rows } = await pool.query(query, values);
	return rows[0] || null;
}
module.exports = { saveSentMessages };
