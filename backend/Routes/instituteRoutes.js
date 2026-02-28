const express = require('express');
const router = express.Router();
const instituteController = require('../Controller/instituteController');
router.post('/', instituteController.createInstitute);

module.exports = router;
