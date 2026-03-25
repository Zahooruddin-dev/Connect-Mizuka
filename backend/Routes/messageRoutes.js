const express = require('express');
const router = express.Router();
const messageController = require('../Controller/messageController');
const {
	verifyToken,
	restrictToAdmin,
} = require('../middleware/authMiddleware');
const uploadAudio = require('../middleware/audioUploadMiddleware');
router.use(verifyToken);

router.post(
	'/upload-audio',
	uploadAudio.single('audio'),
	messageController.uploadAudioFile,
);

// Fetch single message by id (used for resolving reply previews)
router.get('/message/:messageId', messageController.getSingleMessage);

router.get('/:channelId', messageController.getChatHistory);
router.delete('/message/:messageId', messageController.deleteMessage);
router.delete(
	'/channel/:channelId',
	restrictToAdmin,
	messageController.deleteChannel,
);

module.exports = router;
