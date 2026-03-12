const express = require('express');
const router = express.Router();
const channelController = require('../Controller/channelController');
const { verifyToken, restrictToAdmin } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.post('/create', restrictToAdmin, channelController.createChannel);
router.put('/:channelId', restrictToAdmin, channelController.updateChannel);
router.delete('/:channelId', restrictToAdmin, channelController.deleteChannelById);

router.get('/institute/:instituteId', channelController.getChannelsForInstitute);
router.get('/:channelId', channelController.getChannelById);
router.get('/:channelId/search-messages', channelController.searchChannelMessages);

module.exports = router;