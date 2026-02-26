const express = require('express');
const router = express.Router();
const messageController = require('../Controller/messageController');
router.get('/:channelId', messageController.getChatHistory);
module.exports = router;
