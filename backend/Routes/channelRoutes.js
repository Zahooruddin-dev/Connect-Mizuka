const express = require('express');
const router = express.Router();
const channelController = require('../Controller/channelController');
router.post('/create', channelController.createChannel);

module.exports = router;
