const pool = require('./Pool');

async function findExistingRoomQuery(u1, u2) {
	try {
		const { rows } = await pool.query(
			`SELECT * FROM p2p_chatrooms 
			 WHERE (user_one_id = $1 AND user_two_id = $2) 
			 OR (user_one_id = $2 AND user_two_id = $1)`,
			[u1, u2],
		);
		return rows[0] || null;
	} catch (error) {
		console.error('findExistingRoomQuery error:', error);
		throw error;
	}
}

async function createNewRoom(u1, u2) {
	try {
		const { rows } = await pool.query(
			`INSERT INTO p2p_chatrooms (user_one_id, user_two_id, created_at) 
			 VALUES ($1, $2, NOW()) 
			 RETURNING *`,
			[u1, u2],
		);
		return rows[0] || null;
	} catch (error) {
		console.error('createNewRoom error:', error);
		throw error;
	}
}

async function getP2PMessagesQuery(roomId) {
	try {
		const { rows } = await pool.query(
			`SELECT * FROM p2p_messages 
			 WHERE chatroom_id = $1 
			 ORDER BY created_at ASC`,
			[roomId],
		);
		return rows;
	} catch (error) {
		console.error('getP2PMessagesQuery error:', error);
		throw error;
	}
}

async function saveP2PMessage(chatroom_id, sender_id, content) {
	try {
		const { rows } = await pool.query(
			`INSERT INTO p2p_messages (chatroom_id, sender_id, content, is_read, created_at) 
			 VALUES ($1, $2, $3, FALSE, NOW()) 
			 RETURNING *`,
			[chatroom_id, sender_id, content],
		);
		return rows[0] || null;
	} catch (error) {
		console.error('saveP2PMessage error:', error);
		throw error;
	}
}

async function markMessagesAsRead(chatroom_id, reader_id) {
	try {
		console.log('Executing markMessagesAsRead query:', chatroom_id, reader_id);
		const { rows } = await pool.query(
			`UPDATE p2p_messages
			 SET is_read = TRUE
			 WHERE chatroom_id = $1
			   AND sender_id != $2
			   AND is_read = FALSE
			 RETURNING id`,
			[chatroom_id, reader_id],
		);
		console.log('Query result rows:', rows.length);
		return rows.map((r) => r.id);
	} catch (error) {
		console.error('markMessagesAsRead error:', error);
		throw error;
	}
}

async function getUnreadCountsForUser(userId) {
	try {
		const { rows } = await pool.query(
			`SELECT m.chatroom_id, COUNT(*) AS unread_count
			 FROM p2p_messages m
			 JOIN p2p_chatrooms c ON c.id = m.chatroom_id
			 WHERE (c.user_one_id = $1 OR c.user_two_id = $1)
			   AND m.sender_id != $1
			   AND m.is_read = FALSE
			 GROUP BY m.chatroom_id`,
			[userId],
		);
		return rows;
	} catch (error) {
		console.error('getUnreadCountsForUser error:', error);
		throw error;
	}
}

module.exports = {
	findExistingRoomQuery,
	createNewRoom,
	getP2PMessagesQuery,
	saveP2PMessage,
	markMessagesAsRead,
	getUnreadCountsForUser,
};