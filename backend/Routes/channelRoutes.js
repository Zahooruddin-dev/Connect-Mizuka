const express = require('express');
const router = express.Router();
const channelController = require('../Controller/channelController');

router.post('/create', channelController.createChannel);
router.get('/institute/:instituteId', channelController.getChannelsForInstitute);
router.get('/:channelId', channelController.getChannelById);
router.put('/:channelId', channelController.updateChannel);
router.delete('/:channelId', channelController.deleteChannelById);

module.exports = router;
