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
			created_at: new Date(savedMessage.created_at || Date.now()).toISOString(),
			is_read: false,
		};

		io.to(chatroom_id).emit('receive_p2p_message', messagePayload);

		const members = await db.getChatroomMembers(chatroom_id);
		members.forEach((member) => {
			if (String(member.user_id) !== String(sender_id)) {
				io.to(`user_${member.user_id}`).emit('receive_p2p_message', messagePayload);
			}
		});

		console.log(`[Server] P2P message sent in room ${chatroom_id} by ${username}`);
	} catch (error) {
		console.error('handleSendP2PMessage error:', error);
	}
}

module.exports = { handleSendP2PMessage };