const db = require('../db/querySocketMessage');
const pool = require('../db/Pool');

async function handleSendMessage(socket, io, data) {
	const { channel_id, sender_id, message, type } = data;
	console.log('[handleSendMessage] Received:', { channel_id, sender_id, message: message?.slice?.(0, 50), type });
	try {
		const savedMessage = await db.saveSentMessages(channel_id, sender_id, message, type);

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
			profile_picture,
			created_at: new Date(savedMessage.created_at || Date.now()).toISOString(),
			channel_id,
		};

		console.log('[handleSendMessage] Broadcasting to channel:', channel_id, payload);
		io.to(channel_id).emit('receive_message', payload);
		console.log(`[handleSendMessage] Message saved and sent to room: ${channel_id}`);
	} catch (error) {
		console.error('[handleSendMessage] error:', error.message, error.stack);
		socket.emit('error', { message: 'Failed to send message' });
	}
}

module.exports = { handleSendMessage };