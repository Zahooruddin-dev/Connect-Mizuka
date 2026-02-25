const express = require('express');
const router = express.Router();
const authController = require('../Controller/AuthController');
const resetController = require('../Controller/ResetController');
router.post('/login', authController.Login);
router.post('/register', authController.Register);
router.post('/request-reset', resetController.requestPasswordReset);
router.post('/reset-password', resetController.resetPassword);
module.exports = router;
