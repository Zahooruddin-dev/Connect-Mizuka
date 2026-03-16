const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db/queryAuth');

async function Login(req, res) {
	const { email, password } = req.body;

	try {
		const user = await db.getUserByEmail(email);
		if (!user) {
			return res.status(401).json({ message: 'Invalid email or password' });
		}
		const match = await bcrypt.compare(password, user.password_hash);
		if (!match) {
			return res.status(401).json({ message: 'Invalid email or password' });
		}

		const memberships = await db.getUserMemberships(user.id);

		const token = jwt.sign(
			{
				id: user.id,
				email: user.email,
				role: user.role,
				username: user.username,
				createdAt: user.created_at,
			},
			process.env.JWT_SECRET,
			{ expiresIn: '1d' },
		);

		res.status(200).json({
			message: 'Login Successful',
			token,
			user: {
				id: user.id,
				email: user.email,
				username: user.username,
				createdAt: user.created_at,
				role: user.role,
				memberships,
			},
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
}

async function Register(req, res) {
	const { username, email, password, role, institute_id } = req.body;
	const instId = institute_id === '' ? null : institute_id;
	try {
		const password_hash = await bcrypt.hash(password, 10);
		const newUser = await db.registerQuery(
			username,
			email,
			password_hash,
			role,
		);

		if (instId) {
			await db.linkToInstituteQuery(
				newUser.id,
				instId,
				role === 'admin' ? 'admin' : 'member',
			);
		}
		return res
			.status(201)
			.json({ message: 'New user registered', user: newUser });
	} catch (error) {
		if (error.code === '23505') {
			return res.status(400).json({ message: 'Email Already Registered' });
		}
		return res.status(500).json({ message: error.message });
	}
}
async function updateProfile(req, res) {
	const { userId } = req.params;
	const { username, email, currentPassword, newPassword } = req.body;
	const imagePath = req.file ? req.file.path : null;

	if (!username && !email && !newPassword) {
		return res.status(400).json({ message: 'Nothing to update' });
	}

	try {
		const user = await db.getUserById(userId);
		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}

		if (newPassword) {
			if (!currentPassword) {
				return res.status(400).json({
					message: 'Current password is required to set a new password',
				});
			}
			const match = await bcrypt.compare(currentPassword, user.password_hash);
			if (!match) {
				return res
					.status(401)
					.json({ message: 'Current password is incorrect' });
			}
		}

		const updatedUser = await db.updateProfileQuery(userId, {
			username: username ?? user.username,
			email: email ?? user.email,
			password_hash: newPassword
				? await bcrypt.hash(newPassword, 10)
				: undefined,
		});

		return res
			.status(200)
			.json({ message: 'Profile updated', user: updatedUser });
	} catch (error) {
		if (error.code === '23505') {
			return res.status(400).json({ message: 'Email already in use' });
		}
		return res.status(500).json({ message: error.message });
	}
}

async function deleteUser(req, res) {
	const { email, password } = req.body;
	try {
		const user = await db.getUserByEmail(email);
		if (!user) {
			return res.status(401).json({ message: 'Invalid Email or Password' });
		}
		const match = await bcrypt.compare(password, user.password_hash);
		if (!match) {
			return res.status(401).json({ message: 'Invalid Email or Password' });
		}
		const deleted = await db.deleteUserQuery(email);
		res.status(200).json({ message: 'User deleted', deleted });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
}

async function linkToInstitute(req, res) {
	const { userId, institute_id } = req.body;
	try {
		const link = await db.linkToInstituteQuery(userId, institute_id, 'member');
		res.status(200).json({
			message: 'Linked to institute',
			membership: link,
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
}

async function myMemberships(req, res) {
	const userId = req.user.id;
	try {
		const memberships = await db.getUserMemberships(userId);
		res.status(200).json({ memberships });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
}

async function getUserInfo(req, res) {
	const userId = req.user.id;
	try {
		const user = await db.getUserInfoQuery(userId);
		res.status(200).json({ user });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
}

async function getUserProfile(req, res) {
	const { userId } = req.params;
	try {
		const user = await db.getUserProfileForPopover(userId);
		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}
		res.status(200).json({ user });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
}
async function changePassword(req, res) {
	const userId = req.user.id;
	const { oldPassword, newPassword } = req.body;
	if (!oldPassword || !newPassword) {
		return res
			.status(400)
			.json({ message: 'Both old and new passwords are required' });
	}
	try {
		const user = await db.getUserInfoQuery(userId);
		if (!user) {
			return res.status(404).json({ message: 'User not found' });
		}

		const isMatch = await bcrypt.compare(oldPassword, user.password_hash);
		if (!isMatch) {
			return res.status(401).json({ message: 'Incorrect current password' });
		}
		const newPassword_hash = await bcrypt.hash(newPassword, 10);
		const updatedUser = await db.changePasswordQuery(userId, newPassword_hash);

		res.status(200).json({
			message: 'Password updated successfully',
			user: updatedUser,
		});
	} catch (error) {
		console.error('Change password error:', error);
		res.status(500).json({ message: 'Internal server error' });
	}
}

module.exports = {
	Login,
	Register,
	deleteUser,
	changePassword,
	linkToInstitute,
	myMemberships,
	getUserInfo,
	updateProfile,
	getUserProfile,
};
