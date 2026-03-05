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
			`INSERT INTO p2p_messages (chatroom_id, sender_id, content, created_at) 
			 VALUES ($1, $2, $3, NOW()) 
			 RETURNING *`,
			[chatroom_id, sender_id, content],
		);
		return rows[0] || null;
	} catch (error) {
		console.error('saveP2PMessage error:', error);
		throw error;
	}
}

module.exports = {
	findExistingRoomQuery,
	createNewRoom,
	getP2PMessagesQuery,
	saveP2PMessage,
};