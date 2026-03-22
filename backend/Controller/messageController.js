const db = require('../db/queryMessage');
const dbInstitute = require('../db/queryInstitute');
async function getChatHistoryQuery(channel_id, limit, offset) {
    const { rows } = await pool.query(
        `SELECT * FROM (
            SELECT m.id, m.content, m.type, m.created_at, m.sender_id,
                   u.username, u.profile_picture
            FROM messages m
            JOIN users u ON m.sender_id = u.id
            WHERE m.channel_id = $1
            ORDER BY m.created_at DESC
            LIMIT $2 OFFSET $3
        ) sub
        ORDER BY created_at ASC`,
        [channel_id, limit, offset],
    );
    return rows || [];
}

async function deleteMessage(req, res) {
	const { messageId } = req.params;
	const userId = req.user.id;
	try {
		const result = await db.deleteMessageQuery(messageId, userId);
		if (!result || result.length === 0) {
			return res.status(403).json({ error: 'Unauthorized: You can only delete your own messages' });
		}
		res.status(200).json({ message: 'Message deleted successfully' });
	} catch (error) {
		res.status(500).json({ error: 'Internal server error during deletion' });
	}
}

async function deleteChannel(req, res) {
	const { channelId } = req.params;
	const adminId = req.user.id;
	try {
		const channel = await db.getChannelById(channelId);
		if (!channel) return res.status(404).json({ error: 'Channel not found' });

		const isAdminHere = await dbInstitute.verifyAdminOfInstitute(adminId, channel.institute_id);
		if (!isAdminHere) {
			return res.status(403).json({ error: 'Not authorized for this institute' });
		}

		await db.deleteChannelQuery(channelId);
		res.status(200).json({ message: 'Channel deleted successfully' });
	} catch (error) {
		res.status(500).json({ error: 'Failed to delete channel' });
	}
}

async function uploadAudioFile(req, res) {
	try {
		if (!req.file) {
			return res.status(400).json({ error: 'No audio file provided' });
		}
		res.status(200).json({ url: req.file.path });
	} catch (error) {
		res.status(500).json({ message: 'Failed to upload audio file' });
	}
}

module.exports = {
	getChatHistory,
	deleteMessage,
	deleteChannel,
	uploadAudioFile,
};