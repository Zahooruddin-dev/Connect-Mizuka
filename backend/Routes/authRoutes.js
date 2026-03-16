const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/authMiddleware');
const validate = require('../middleware/validateRequest');
const upload = require('../middleware/uploadMiddleware');
const {
	registerSchema,
	loginSchema,
	resetPassordSchema,
	requestPasswordResetSchema,
	deleteSchema,
} = require('../validations/authValidation');
const authController = require('../Controller/AuthController');
const resetController = require('../Controller/ResetController');

// Public
router.post('/login', validate(loginSchema), authController.Login);
router.post('/register', validate(registerSchema), authController.Register);
router.post(
	'/request-reset',
	validate(requestPasswordResetSchema),
	resetController.requestPasswordReset,
);
router.post(
	'/reset-password',
	validate(resetPassordSchema),
	resetController.resetPassword,
);

// Protected routes
router.get('/my-memberships', verifyToken, authController.myMemberships);
router.get('/user-info', verifyToken, authController.getUserInfo);
router.put(
	'/update-profile',
	verifyToken,
	upload.single('profile_picture'),
	authController.updateProfile,
);
router.patch('/change-password', verifyToken, authController.changePassword);
router.post('/link-to-institute', verifyToken, authController.linkToInstitute);

// For viewing others profiles

router.get('/user-profile/:userId', verifyToken, authController.getUserProfile);

// Delete requires and email/pass
router.post(
	'/delete',
	verifyToken,
	validate(deleteSchema),
	authController.deleteUser,
);

module.exports = router;
