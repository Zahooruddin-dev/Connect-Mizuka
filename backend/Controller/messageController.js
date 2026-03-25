const db = require('../db/queryMessage');
const dbInstitute = require('../db/queryInstitute');
const cloudinary = require('cloudinary').v2;

async function getChatHistory(req, res) {
	const { channelId } = req.params;
	const limit = parseInt(req.query.limit) || 50;
	const offset = parseInt(req.query.offset) || 0;
	try {
		const messages = await db.getChatHistoryQuery(channelId, limit, offset);
		res.status(200).json(messages);
	} catch (error) {
		res.status(500).json({ error: 'Failed to load messages' });
	}
}
async function deleteMessage(req, res) {
	const { messageId } = req.params;
	const userId = req.user.id;

	try {
		const message = await db.getSingleMessageQuery(messageId);
		if (!message) {
			return res.status(404).json({ error: 'Message not found' });
		}
		if (String(message.sender_id) !== String(userId)) {
			return res
				.status(403)
				.json({ error: 'Unauthorized: You can only delete your own messages' });
		}

		if (message.type === 'audio') {
			try {
				const urlParts = message.content.split('/');
				const fileNameWithExtension = urlParts.pop();
				const folderName = urlParts.pop();
				const fileName = fileNameWithExtension.split('.')[0];

				const publicId = `${folderName}/${fileName}`;
				await cloudinary.uploader.destroy(publicId, { resource_type: 'video' });
				console.log(`Successfully deleted audio from cloud: ${publicId}`);
			} catch (cloudErr) {
				console.error(
					'Failed to delete from Cloudinary, proceeding with DB deletion:',
					cloudErr,
				);
			}
		}

		const result = await db.deleteMessageQuery(messageId, userId);

		if (!result || result.length === 0) {
			return res
				.status(400)
				.json({ error: 'Failed to delete message from database' });
		}
		res.status(200).json({ message: 'Message completely deleted' });
	} catch (error) {
		console.error('Delete error:', error);
		res.status(500).json({ error: 'Internal server error during deletion' });
	}
}

async function deleteChannel(req, res) {
	const { channelId } = req.params;
	const adminId = req.user.id;
	try {
		const channel = await db.getChannelById(channelId);
		if (!channel) return res.status(404).json({ error: 'Channel not found' });

		const isAdminHere = await dbInstitute.verifyAdminOfInstitute(
			adminId,
			channel.institute_id,
		);
		if (!isAdminHere) {
			return res
				.status(403)
				.json({ error: 'Not authorized for this institute' });
		}

		await db.deleteChannelQuery(channelId);
		res.status(200).json({ message: 'Channel deleted successfully' });
	} catch (error) {
		res.status(500).json({ error: 'Failed to delete channel' });
	}
}

async function uploadAudioFile(req, res) {
	const audioFile = !req.file;
	try {
		if (audioFile) {
			return res.status(400).json({ error: 'No audio file provided' });
		}
		res.status(200).json({ url: req.file.path });
	} catch (error) {
		res.status(500).json({ message: 'Failed to upload audio file' });
	}
}

async function getSingleMessage(req, res) {
	const { messageId } = req.params;
	try {
		const message = await db.getSingleMessageQuery(messageId);
		if (!message) return res.status(404).json({ error: 'Message not found' });
		res.status(200).json({ message });
	} catch (error) {
		res.status(500).json({ error: 'Failed to fetch message' });
	}
}

module.exports = {
	getChatHistory,
	deleteMessage,
	deleteChannel,
	uploadAudioFile,
	getSingleMessage,
};
