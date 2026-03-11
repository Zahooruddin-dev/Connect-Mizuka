const express = require('express');
const router = express.Router();
const instituteController = require('../Controller/instituteController');
router.post('/create', instituteController.createInstitute);
router.get('/key/:adminId', instituteController.getGlobalKey);
router.get('/dashboard/:adminId', instituteController.getAdminDashboard);
router.get('/:instituteId/search-members', instituteController.searchMembers);
router.get('/:instituteId/institute-members', instituteController.getInstituteMembers);

module.exports = router;
