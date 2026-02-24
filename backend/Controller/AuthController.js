const bcypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db/queryAuth');

async function Login(req, res) {
	try {
		res.status(200).json('sadsadsa Server Error');
	} catch (error) {
		res.status(500).json('Internal Server Error', error);
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
