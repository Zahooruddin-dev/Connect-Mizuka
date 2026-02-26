const express = require('express');
const router = express.Router();
const messageController = require('../Controller/messageController');
router.get('/:channelId', messageController.getChatHistory);
router.delete('/channel/:channelId', messageController.deleteChannel);
router.delete('/message/:messageId', messageController.deleteMessage);

module.exports = router;
