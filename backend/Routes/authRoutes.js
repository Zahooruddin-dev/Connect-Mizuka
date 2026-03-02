const express = require('express');
const router = express.Router();
const authController = require('../Controller/AuthController');
const resetController = require('../Controller/ResetController');
router.post('/login', authController.Login);
router.post('/register', authController.Register);
router.post('/delete', authController.deleteUser);
router.post('/link-to-institute', authController.linkToInstitute);
// membership listing used by frontend to populate institute list
router.get('/my-memberships/:userId', authController.myMemberships);
router.post('/request-reset', resetController.requestPasswordReset);
router.post('/reset-password', resetController.resetPassword);
module.exports = router;
