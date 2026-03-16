const express = require('express');
const router = express.Router();
const channelController = require('../Controller/channelController');
const { verifyToken } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateRequest');
const { createChannelSchema, updateChannelSchema } = require('../validations/channelValidation');

router.use(verifyToken);

router.post('/create', validate(createChannelSchema), channelController.createChannel);
router.put('/:channelId', validate(updateChannelSchema), channelController.updateChannel);
router.delete('/:channelId', channelController.deleteChannelById);

router.get('/institute/:instituteId', channelController.getChannelsForInstitute);
router.get('/:channelId', channelController.getChannelById);
router.get('/:channelId/search-messages', channelController.searchChannelMessages);

module.exports = router;