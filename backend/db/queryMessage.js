const pool = require('./Pool')
async function getChatHistoryQuery(channel_id) {
  const query = `SELECT m.id, m.content,u.username,m.sender_id
    FROM messages m
    JOIN users u ON m.sender_id = u.id
    WHERE m.channel_id = $1
    ORDER BY m.created_at ASC
  `
  const {rows} = await pool.query(query,[channel_id])
  return rows || null 
}

module.exports = {getChatHistoryQuery}