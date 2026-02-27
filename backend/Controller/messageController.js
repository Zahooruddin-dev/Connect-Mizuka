const db = require('../db/queryMessage');
const dbAuth = require('../db/queryAuth');
async function getChatHistory(req, res) {
	const { channelId } = req.params;
  const limit = parseInt(req.query.limit) || 20
  const offset = parseInt(req.query.offset) || 0
	try {
		const chat = await db.getChatHistoryQuery(channelId,limit,offset);
		res.status(200).json(chat);
	} catch (error) {
		res.status(500).json({ error: 'Failed to load messages' });
	}
}
async function getSingleMessage(req, res) {
	const { messageId } = req.params;
	try {
		const message = await db.getSingleMessageQuery(messageId);
		if (!chat) {
			return res.status(404).json({ error: 'Not found' });
		}
		res.status(200).json(message);
	} catch (error) {
		res.status(500).json({ error: 'Failed to load messages' });
	}
}
async function deleteMessage(req, res) {
	const { messageId } = req.params;
	const { userId } = req.body;
	try {
		const result = await db.deleteMessageQuery(messageId, userId);
		if (!result) {
			return res
				.status(403)
				.json({ error: 'Unauthorized or message not found' });
		}
		res.status(200).json({ message: 'Message deleted successfully' });
	} catch (error) {
		res.status(500).json({ error: 'Failed to load messages' });
	}
}
async function deleteChannel(req, res) {
	const { channelId } = req.params;
	const { userId } = req.body;
	try {
		const user = await dbAuth.getUserById(userId);
    console.log("DEBUG: User object from DB:", user);
		if (!user || user.role !== 'admin') {
			return res
				.status(403)
				.json({ error: 'Access denied. Admin role required.' });
		}
		const result = await db.deleteChannelQuery(channelId, userId);
		if (!result) {
			return res
				.status(403)
				.json({ error: 'Unauthorized or channel not found' });
		}
		res.status(200).json({ message: 'Channel deleted successfully' });
	} catch (error) {
		res.status(500).json({ error: 'Failed to load channel' });
	}
}

module.exports = {
	getChatHistory,
	getSingleMessage,
	deleteMessage,
	deleteChannel,
};
