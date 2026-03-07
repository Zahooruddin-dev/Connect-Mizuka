const db = require('../db/queryP2P');

async function handleSendP2PMessage(socket, io, data) {
	const { chatroom_id, message, sender_id, username } = data;

	if (!chatroom_id || !message || !sender_id || !username) {
		console.error('Invalid P2P message payload:', data);
		return;
	}

	try {
		const savedMessage = await db.saveP2PMessage(chatroom_id, sender_id, message);

		const messagePayload = {
			id: savedMessage.id,
			chatroom_id: savedMessage.chatroom_id,
			content: savedMessage.content,
			sender_id: savedMessage.sender_id,
			username: username,
			created_at: savedMessage.created_at,
			is_read: false,
		};

		io.to(chatroom_id).emit('receive_p2p_message', messagePayload);
		console.log(`[Server] P2P message sent in room ${chatroom_id} by ${username}`);
	} catch (error) {
		console.error('handleSendP2PMessage error:', error);
	}
}

async function handleMarkAsRead(socket, io, data) {
	const { chatroom_id, reader_id } = data;

	if (!chatroom_id || !reader_id) {
		console.error('Invalid mark_as_read payload:', data);
		return;
	}

	try {
		const updatedIds = await db.markMessagesAsRead(chatroom_id, reader_id);

		if (updatedIds.length === 0) return;

		io.to(chatroom_id).emit('messages_read', {
			chatroom_id,
			reader_id,
			message_ids: updatedIds,
		});

		console.log(`[Server] ${updatedIds.length} message(s) marked as read in room ${chatroom_id} by user ${reader_id}`);
	} catch (error) {
		console.error('handleMarkAsRead error:', error);
	}
}

module.exports = { handleSendP2PMessage, handleMarkAsRead };