const express = require('express');
const router = express.Router();
const messageController = require('../Controller/messageController');
const channelController = require('../Controller/channelController');
router.get('/:channelId', messageController.getChatHistory);
router.delete('/channel/:channelId', channelController.deleteChannelById);
router.delete('/message/:messageId', messageController.deleteMessage);

module.exports = router;
