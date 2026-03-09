const db = require('../db/queryP2P');

async function getOrCreateChatroom(req, res) {
	const { user1, user2 } = req.body;

	if (!user1 || !user2) {
		return res.status(400).json({ message: 'user1 and user2 are required' });
	}

	if (user1 === user2) {
		return res.status(400).json({ message: 'Cannot chat with self' });
	}

	const [u1, u2] = [user1, user2].sort();

	try {
		const existingRoom = await db.findExistingRoomQuery(u1, u2);

		if (existingRoom) {
			return res.json({ chatroom: existingRoom, isNew: false });
		}

		const newRoom = await db.createNewRoom(u1, u2);
		res.status(201).json({ chatroom: newRoom, isNew: true });
	} catch (error) {
		console.error('getOrCreateChatroom error:', error);
		res.status(500).json({ error: error.message });
	}
}

async function getMessages(req, res) {
	const { roomId } = req.params;
	const { userId } = req.query;

	if (!roomId) {
		return res.status(400).json({ message: 'roomId is required' });
	}

	try {
		const messages = await db.getP2PMessagesQuery(roomId);

		if (userId) {
			await db.markMessagesAsRead(roomId, userId);
		}

		res.status(200).json({ messages: messages || [] });
	} catch (error) {
		console.error('getMessages error:', error);
		res.status(500).json({ error: 'Could not load message history' });
	}
}
async function deleteMsg(req, res) {
	const { messageId } = req.params;
	const { userId } = req.body;
	if (!messageId || !userId) {
		return res
			.status(400)
			.json({ message: 'messageId nad userId is required' });
	}
	try {
		const deletedIds = await db.deleteP2PMessagesQuery(messageId, userId);
		if (!deletedIds || deletedIds.length === 0) {
			return res
				.status(404)
				.json({ error: 'Message not found or unauthorized' });
		}
		return res.status(200).json({ success: true, deletedId: deletedIds[0] });
	} catch (error) {
		console.error('deleteMsg error:', error);
		res.status(500).json({ error: 'Could not load message to delete' });
	}
}
async function editMsg(req, res) {
	const { messageId } = req.params;
	const { userId, content } = req.body;
	console.log(
		`[Backend] Attempting to edit message: ${messageId} for user: ${userId} content :${content}`,
	);
	if (!messageId || !userId || !content) {
		return res
			.status(400)
			.json({ message: 'messageId, userId and content is required' });
	}

	try {
		console.log(
			`[Backend] Attempting to edit message: ${messageId} for user: ${userId} content :${content}`,
		);
		const editIds = await db.editP2PMessagesQuery(
			messageId,
			userId,
			content,
		);

		if (!editIds || editIds.length === 0) {
			console.log(
				`[Backend] Failed: Message not found, or user ${userId} is not the sender.`,
			);
			return res
				.status(404)
				.json({ error: 'Message not found or unauthorized' });
		}

		console.log(
			`[Backend] Success! Marked message ${editIds[0]} as edit.`,
		);
		return res.status(200).json({ success: true, deletedId: editIds[0] });
	} catch (error) {
		console.error('editmesage error:', error);
		res.status(500).json({ error: 'Could not load message to edit' });
	}
}

async function getUnreadCounts(req, res) {
	const { userId } = req.params;

	if (!userId) {
		return res.status(400).json({ message: 'userId is required' });
	}

	try {
		const counts = await db.getUnreadCountsForUser(userId);
		res.status(200).json({ unreadCounts: counts || [] });
	} catch (error) {
		console.error('getUnreadCounts error:', error);
		res.status(500).json({ error: error.message });
	}
}

async function markRoomAsRead(req, res) {
	const { roomId } = req.params;
	const { userId } = req.body;

	if (!roomId || !userId) {
		return res.status(400).json({ message: 'roomId and userId are required' });
	}

	try {
		await db.markMessagesAsRead(roomId, userId);
		res.status(200).json({ success: true });
	} catch (error) {
		console.error('markRoomAsRead error:', error);
		res.status(500).json({ error: error.message });
	}
}

module.exports = {
	getOrCreateChatroom,
	getMessages,
	getUnreadCounts,
	markRoomAsRead,
	deleteMsg,
	editMsg
};
