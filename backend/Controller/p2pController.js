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

	if (!roomId) {
		return res.status(400).json({ message: 'roomId is required' });
	}

	try {
		const messages = await db.getP2PMessagesQuery(roomId);
		res.status(200).json({
			messages: messages || [],
		});
	} catch (error) {
		console.error('getMessages error:', error);
		res.status(500).json({ error: 'Could not load message history' });
	}
}

module.exports = { getOrCreateChatroom, getMessages };