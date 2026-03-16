const express = require('express');
const router = express.Router();
const instituteController = require('../Controller/instituteController');
const { verifyToken, restrictToAdmin } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateRequest');
const { createInstituteSchema } = require('../validations/instituteValidation');

router.use(verifyToken);

router.post('/create', restrictToAdmin, validate(createInstituteSchema), instituteController.createInstitute);
router.get('/dashboard', restrictToAdmin, instituteController.getAdminDashboard);
router.get('/key/:instituteId', restrictToAdmin, instituteController.getGlobalKey);

router.get('/:instituteId/search-members', instituteController.searchMembers);
router.get('/:instituteId/institute-members', instituteController.getInstituteMembers);

module.exports = router;