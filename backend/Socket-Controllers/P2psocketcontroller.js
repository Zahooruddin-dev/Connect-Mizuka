const db = require('../db/queryP2P');
const pool = require('../db/Pool');
const isDev = process.env.NODE_ENV !== 'production';

async function handleSendP2PMessage(socket, io, data) {
	const { chatroom_id, message, sender_id, username, type, reply_to } = data;

	if (!chatroom_id || !message || !sender_id || !username) {
		console.error('Invalid P2P message payload:', data);
		return;
	}

	try {
		const savedMessage = await db.saveP2PMessage(
			chatroom_id,
			sender_id,
			message,
			type,
			reply_to,
		);

		const { rows } = await pool.query(
			'SELECT profile_picture FROM users WHERE id = $1',
			[sender_id],
		);
		const profile_picture = rows[0]?.profile_picture || null;

		const messagePayload = {
			id: savedMessage.id,
			chatroom_id: savedMessage.chatroom_id,
			content: savedMessage.content,
			sender_id: savedMessage.sender_id,
			username: username,
			type: type,
			reply_to: savedMessage.reply_to || null,
			reply_to_message: null,
			profile_picture,
			created_at: new Date(savedMessage.created_at || Date.now()).toISOString(),
			is_read: false,
		};

		if (savedMessage.reply_to) {
			try {
				const { rows: refRows } = await pool.query(
					`SELECT m.id, m.content, m.type, u.username
					 FROM p2p_messages m
					 JOIN users u ON m.sender_id = u.id
					 WHERE m.id = $1`,
					[savedMessage.reply_to],
				);
				if (refRows && refRows[0]) {
					messagePayload.reply_to_message = {
						id: refRows[0].id,
						content: refRows[0].content,
						type: refRows[0].type,
						username: refRows[0].username,
					};
				}
			} catch (err) {
				console.error('[handleSendP2PMessage] Failed to load reply_to message:', err);
			}
		}

		io.to(chatroom_id).emit('receive_p2p_message', messagePayload);

		const members = await db.getChatroomMembers(chatroom_id);
		members.forEach((member) => {
			if (String(member.user_id) !== String(sender_id)) {
				io.to(`user_${member.user_id}`).emit(
					'receive_p2p_message',
					messagePayload,
				);
			}
		});

		if (isDev) {
			console.log(
				`[Server] P2P message sent in room ${chatroom_id} by ${username}`,
			);
		}
	} catch (error) {
		console.error('handleSendP2PMessage error:', error);
	}
}

module.exports = { handleSendP2PMessage };
