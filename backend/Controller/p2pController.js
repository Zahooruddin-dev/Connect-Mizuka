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
	const { roomId } = req.params;
	const { userId } = req.query;

	if (!roomId || !userId) {
		return res.status(400).json({ message: 'roomId nad userId is required' });
	}

	try {
		const messages = await db.deleteP2PMessagesQuery(roomId);

		if (userId) {
			await db.markMessagesAsRead(roomId, userId);
		}

		res.status(200).json({ messages: messages || [] });
	} catch (error) {
		console.error('deleteMsg error:', error);
		res.status(500).json({ error: 'Could not load message to delete' });
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

module.exports = { getOrCreateChatroom, getMessages, getUnreadCounts, markRoomAsRead,deleteMsg };