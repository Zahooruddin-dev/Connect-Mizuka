const db = require('../db/queryP2P');
async function getOrCreateChatroom(req, res) {
	const { user1, user2 } = req.body;
	const [u1, u2] = [user1, user2].sort();
	try {
		const existingRoom = await db.findExistingRoomQuery(u1, u2);
		if (existingRoom) {
			res.status(200).json({
				chatroom: existingRoom,
				isNew: false,
			});
		}
		const newRoom = await db.createNewRoom(u1, u2);
		return res.status(201).json({
			chatroom: newRoom,
			isNew: true,
		});
	} catch (error) {
		console.error('P2P Room Error:', err);
		res.status(500).json({ error: 'Could not initialize private chat' });
	}
}
async function getMessages(req, res) {
	const { roomId } = req.params;

	try {
		const messages = await db.getP2PMessagesQuery(roomId);
		res.status(200).json({
			messages: messages || [],
		});
	} catch (error) {
		console.error('Fetch P2P Messages Error:', error);
		res.status(500).json({ error: 'Could not load message history' });
	}
}

module.exports = { getOrCreateChatroom, getMessages };
