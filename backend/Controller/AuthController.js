const bcypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db/queryAuth');

async function Login(req, res) {
	const { email, password } = req.body;

	try {
		const user = await db.loginQuery(email);
		if (!user) {
			res.status(401).json({ message: 'Invalid email or password' });
		}
		const match = await bcypt.compare(password, user.password_hash);
		if (!match) {
			res.status(401).json({ message: 'Invalid email or password' });
		}
		const token = jwt.sign(
			{
				id: user.id,
				email: user.role,
				username: user.username,
				createdAt: user.created_at,
				institute_id: user.institute_id,
			},
			process.env.JWT_SECRET,
			{ expiresIn: '1d' },
		);
		res.status(200).json({
			message: 'Login Successful',
			token,
			user: {
				id: user.id,
				email: user.role,
				username: user.username,
				createdAt: user.created_at,
				institute_id: user.institute_id,
			},
		});
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
}
async function Register(req, res) {
	const { username, email, password, role, institute_id } = req.body;
	try {
		const password_hash = await bcypt.hash(password, 10);
		const newUser = await db.registerQuery(
			username,
			email,
			password_hash,
			role,
			institute_id,
		);
		res.status(201).json({ message: 'New user registered', user: newUser });
	} catch (error) {
		if (error.code === '23505') {
			res.status(400).json('Email Already Registered');
		}
		res.status(500).json({ message: error.message });
	}
}
module.exports = {
	Login,
	Register,
};
