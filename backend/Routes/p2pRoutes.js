const express = require('express');
const router = express.Router();
const p2pController = require('../Controllers/p2pController');

router.post('/room', p2pController.getOrCreateChatroom);
router.get('/messages/:roomId', p2pController.getMessages);

module.exports = router;