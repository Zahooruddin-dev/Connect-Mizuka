const express = require('express');
const router = express.Router();
const instituteController = require('../Controller/instituteController');
router.post('/create', instituteController.createInstitute);
router.get('/key/:adminId', instituteController.getGlobalKey);

module.exports = router;
