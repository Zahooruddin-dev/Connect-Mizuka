const express = require('express');
const router = express.Router();
const p2pController = require('../Controller/p2pController');

router.post('/room', p2pController.getOrCreateChatroom);
router.get('/messages/:roomId', p2pController.getMessages);
router.get('/unread/:userId', p2pController.getUnreadCounts);
router.post('/read/:roomId', p2pController.markRoomAsRead);

module.exports = router;