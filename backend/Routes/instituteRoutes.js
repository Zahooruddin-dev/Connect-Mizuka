const express = require('express');
const router = express.Router();
const instituteController = require('../Controller/instituteController');
const { verifyToken } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.post('/create', instituteController.createInstitute);
router.get('/dashboard', instituteController.getAdminDashboard); 
router.get('/key/:instituteId', instituteController.getGlobalKey); 
router.get('/:instituteId/search-members', instituteController.searchMembers);
router.get('/:instituteId/institute-members', instituteController.getInstituteMembers);

module.exports = router;