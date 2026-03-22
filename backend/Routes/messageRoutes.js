const express = require('express');
const router = express.Router();
const messageController = require('../Controller/messageController');
const { verifyToken, restrictToAdmin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
router.use(verifyToken);

router.post('/upload-audio', upload.single('audio'), messageController.uploadAudioFile);
router.get('/:channelId', messageController.getChatHistory);
router.delete('/message/:messageId', messageController.deleteMessage);
router.delete('/channel/:channelId', restrictToAdmin, messageController.deleteChannel);

module.exports = router;