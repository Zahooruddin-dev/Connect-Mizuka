const db = require('../db/querySocketMessage');
const pool = require('../db/Pool');

async function handleSendMessage(socket, io, data) {
	const { channel_id, sender_id, message,type } = data;
	try {
		const savedMessage = await db.saveSentMessages(channel_id, sender_id, message,type);

		const { rows } = await pool.query(
			'SELECT profile_picture FROM users WHERE id = $1',
			[sender_id],
		);
		const profile_picture = rows[0]?.profile_picture || null;

		io.to(channel_id).emit('receive_message', {
			id: savedMessage.id,
			text: savedMessage.content,
			from: savedMessage.sender_id,
			username: savedMessage.username,
			type:type,
			profile_picture,
			timestamp: new Date(savedMessage.created_at || Date.now()).toISOString(),
			channel_id,
		});

		console.log(`Message saved and sent to room: ${channel_id}`);
	} catch (error) {
		console.error('DB insert error:', error.message);
		socket.emit('error', { message: 'Failed to send message' });
	}
}

module.exports = { handleSendMessage };