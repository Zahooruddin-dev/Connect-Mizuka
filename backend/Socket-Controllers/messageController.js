const db = require('../db/querySocketMessage');
const pool = require('../db/Pool');
const isDev = process.env.NODE_ENV !== 'production';

async function handleSendMessage(socket, io, data) {
	const { channel_id, sender_id, message, type, reply_to } = data;
	if (isDev) {
		console.log('[handleSendMessage] Received:', {
			channel_id,
			sender_id,
			message: message?.slice?.(0, 50),
			type,
			reply_to,
		});
	}
	try {
		const savedMessage = await db.saveSentMessages(channel_id, sender_id, message, type, reply_to);

		if (!savedMessage) {
			console.error('[handleSendMessage] saveSentMessages returned null');
			socket.emit('error', { message: 'Failed to send message' });
			return;
		}

		const { rows } = await pool.query(
			'SELECT profile_picture FROM users WHERE id = $1',
			[sender_id],
		);
		const profile_picture = rows[0]?.profile_picture || null;

		const payload = {
			id: savedMessage.id,
			content: savedMessage.content,
			sender_id: savedMessage.sender_id,
			username: savedMessage.username,
			type: savedMessage.type || type || 'text',
			reply_to: savedMessage.reply_to || null,
			reply_to_message: null,
			profile_picture,
			created_at: new Date(savedMessage.created_at || Date.now()).toISOString(),
			channel_id,
		};

		// If there's a reply_to reference, fetch a small preview of the referenced message
		if (savedMessage.reply_to) {
			try {
				const { rows: refRows } = await pool.query(
					`SELECT m.id, m.content, m.type, u.username
					 FROM messages m
					 JOIN users u ON m.sender_id = u.id
					 WHERE m.id = $1`,
					[savedMessage.reply_to],
				);
				if (refRows && refRows[0]) {
					payload.reply_to_message = {
						id: refRows[0].id,
						content: refRows[0].content,
						type: refRows[0].type,
						username: refRows[0].username,
					};
				}
			} catch (err) {
				console.error('[handleSendMessage] Failed to load reply_to message:', err);
			}
		}

		if (isDev) {
			console.log('[handleSendMessage] Broadcasting to channel:', channel_id, payload);
		}
		io.to(channel_id).emit('receive_message', payload);
		if (isDev) {
			console.log(`[handleSendMessage] Message saved and sent to room: ${channel_id}`);
		}
	} catch (error) {
		console.error('[handleSendMessage] error:', error.message, error.stack);
		socket.emit('error', { message: 'Failed to send message' });
	}
}

module.exports = { handleSendMessage };