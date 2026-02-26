const express = require('express');
const router = express.Router();
const messageController = require('../Controller/messageController');
router.post('/:channelId', messageController.getChatHistory);
module.exports = router;
