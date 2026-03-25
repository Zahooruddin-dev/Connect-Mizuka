const pool = require('./Pool');

async function getRoomById(roomId) {
	try {
		const { rows } = await pool.query(
			`SELECT * FROM p2p_chatrooms WHERE id = $1`,
			[roomId],
		);
		return rows[0] || null;
	} catch (error) {
		console.error('getRoomById error:', error);
		throw error;
	}
}

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
			`SELECT m.*, m.reply_to, u.username, u.profile_picture
			 FROM p2p_messages m
			 JOIN users u ON m.sender_id = u.id
			 WHERE m.chatroom_id = $1
			 ORDER BY m.created_at ASC`,
			[roomId],
		);
		return rows;
	} catch (error) {
		console.error('getP2PMessagesQuery error:', error);
		throw error;
	}
}

async function searchP2PMessagesQuery(roomId, searchTerm) {
	try {
		const { rows } = await pool.query(
			`SELECT m.id, m.chatroom_id, m.sender_id, m.content, m.created_at, u.username 
			 FROM p2p_messages m
			 JOIN users u ON m.sender_id = u.id
			 WHERE m.chatroom_id = $1 AND m.content ILIKE $2
			 ORDER BY m.created_at DESC`,
			[roomId, `%${searchTerm}%`],
		);
		return rows;
	} catch (error) {
		console.error('searchP2PMessagesQuery error:', error);
		throw error;
	}
}
async function getSingleP2PMessageQuery(message_id) {
  const { rows } = await pool.query(
    `SELECT * FROM p2p_messages WHERE id = $1`,
    [message_id]
  );
  return rows[0] || null;
}

async function deleteP2PMessagesQuery(message_id, userId) {
	try {
		const { rows } = await pool.query(
			`UPDATE p2p_messages 
			 SET is_deleted = true, content = 'This message was deleted' , type = 'text' 
			 WHERE id = $1 AND sender_id = $2 
			 RETURNING id`,
			[message_id, userId],
		);
		return rows.length > 0 ? [rows[0].id] : null;
	} catch (error) {
		console.error('deleteP2PMessagesQuery error:', error);
		throw error;
	}
}

async function editP2PMessagesQuery(message_id, userId, content) {
	try {
		const { rows } = await pool.query(
			`UPDATE p2p_messages 
			 SET is_deleted = false, content = $1 
			 WHERE id = $2 AND sender_id = $3 
			 RETURNING id`,
			[content, message_id, userId],
		);
		return rows.length > 0 ? [rows[0].id] : null;
	} catch (error) {
		console.error('editP2PMessagesQuery error:', error);
		throw error;
	}
}
async function saveP2PMessage(chatroom_id, sender_id, content, type = 'text', reply_to = null) {
	try {
		const { rows } = await pool.query(
			`INSERT INTO p2p_messages (chatroom_id, sender_id, content, type, is_read, reply_to, created_at) 
	   VALUES ($1, $2, $3, $4, FALSE, $5, NOW()) 
	   RETURNING *`,
			[chatroom_id, sender_id, content, type, reply_to],
		);
		return rows[0] || null;
	} catch (error) {
		console.error('saveP2PMessage error:', error);
		throw error;
	}
}

async function markMessagesAsRead(chatroom_id, reader_id) {
	try {
		const { rows } = await pool.query(
			`UPDATE p2p_messages
			 SET is_read = TRUE
			 WHERE chatroom_id = $1
			   AND sender_id != $2
			   AND is_read = FALSE
			 RETURNING id`,
			[chatroom_id, reader_id],
		);
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
async function getUserChatrooms(userId) {
	try {
		const { rows } = await pool.query(
			`SELECT
				c.id AS room_id,
				c.created_at,
				CASE WHEN c.user_one_id = $1 THEN c.user_two_id ELSE c.user_one_id END AS other_user_id,
				u.username AS other_username,
				u.profile_picture AS other_profile_picture,
				u.role AS other_role,
				u.email AS other_email,
				(
					SELECT content FROM p2p_messages
					WHERE chatroom_id = c.id
					ORDER BY created_at DESC LIMIT 1
				) AS last_content,
				(
					SELECT type FROM p2p_messages
					WHERE chatroom_id = c.id
					ORDER BY created_at DESC LIMIT 1
				) AS last_type,
				(
					SELECT sender_id FROM p2p_messages
					WHERE chatroom_id = c.id
					ORDER BY created_at DESC LIMIT 1
				) AS last_sender_id,
				(
					SELECT created_at FROM p2p_messages
					WHERE chatroom_id = c.id
					ORDER BY created_at DESC LIMIT 1
				) AS last_created_at
			FROM p2p_chatrooms c
			JOIN users u ON u.id = CASE WHEN c.user_one_id = $1 THEN c.user_two_id ELSE c.user_one_id END
			WHERE c.user_one_id = $1 OR c.user_two_id = $1
			ORDER BY last_created_at DESC NULLS LAST`,
			[userId],
		);
		return rows;
	} catch (error) {
		console.error('getUserChatrooms error:', error);
		throw error;
	}
}
async function getChatroomMembers(chatroomId) {
	try {
		const { rows } = await pool.query(
			`SELECT user_one_id AS user_id FROM p2p_chatrooms WHERE id = $1
			 UNION
			 SELECT user_two_id AS user_id FROM p2p_chatrooms WHERE id = $1`,
			[chatroomId],
		);
		return rows;
	} catch (error) {
		console.error('getChatroomMembers error:', error);
		throw error;
	}
}
async function searchAllP2PMessagesQuery(roomIds, searchTerm, userId) {
	const { rows } = await pool.query(
		`SELECT m.id, m.chatroom_id AS room_id, m.content, m.created_at, u.username
     FROM p2p_messages m
     JOIN users u ON m.sender_id = u.id
     JOIN p2p_chatrooms c ON c.id = m.chatroom_id
     WHERE m.chatroom_id = ANY($1::uuid[])
       AND (c.user_one_id = $3 OR c.user_two_id = $3)
       AND m.content ILIKE $2
     ORDER BY m.created_at DESC
     LIMIT 50`,
		[roomIds, `%${searchTerm}%`, userId],
	);
	return rows;
}
module.exports = {
	getRoomById,
	findExistingRoomQuery,
	createNewRoom,
	getP2PMessagesQuery,
	saveP2PMessage,
	markMessagesAsRead,
	getUnreadCountsForUser,
	deleteP2PMessagesQuery,
	editP2PMessagesQuery,
	searchP2PMessagesQuery,
	getUserChatrooms,
	getChatroomMembers,
	searchAllP2PMessagesQuery,
	getSingleP2PMessageQuery
};
