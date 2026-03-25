const express = require('express');
const router = express.Router();
const p2pController = require('../Controller/p2pController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.post('/room', p2pController.getOrCreateChatroom);
router.post('/messages/search', p2pController.searchAllP2PMessages);
router.get('/rooms', p2pController.getUserChatrooms);
// fetch single p2p message (used for reply preview)
router.get('/message/:messageId', p2pController.getSingleP2PMessage);
router.get('/messages/:roomId', p2pController.getMessages);
router.get('/messages/:roomId/search', p2pController.searchP2PMessages);
router.patch('/messages/:messageId/delete', p2pController.deleteMsg);
router.patch('/messages/:messageId/edit', p2pController.editMsg);
router.get('/unread-counts', p2pController.getUnreadCounts);
router.post('/read/:roomId', p2pController.markRoomAsRead);

module.exports = router;