const db = require('../db');
const bcrypt = require('bcrypt');
async function resetPassword(req, res) {
	const { email, code, newPassword } = req.body;
	try {
		const resetEntry = await db.verifyResetCode(email, code);
		if (!resetEntry) {
			return res.status(400).json({ message: 'Invalid or expired code.' });
		}
		const salt = await bcrypt.genSalt(10);
		const hashedPassword = await bcrypt.hash(newPassword, salt);
		await db.updateUserPassword(email, hashedPassword);
		await db.deleteResetCode(email);
		return res.status(200).json({ message: 'reset password done' });
	} catch (error) {
		res.status(500).json({ message: error.message });
	}
}
