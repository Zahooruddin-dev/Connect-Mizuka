const pool = require('./Pool');
async function saveResetCode(email, code, expires) {
	await pool.query(`DELETE FROM password_resets WHERE email =$1`, [email]);

	const query = `INSERT INTO password_resets (email,code,expires_at) VALUES ($1,$2,$3)`;

	await pool.query(query, [email, code, expires]);
}
async function verifyResetCode(email, code) {
	const query = `SELECT * FROM password_resets WHERE email =$1 AND code =$2 AND expires_at>NOW()`;

	const { rows } = await pool.query(query, [email, code]);

	return rows[0] || null;
}
async function deleteResetCode(email) {
	await pool.query(`DELETE FROM password_resets WHERE email =$1`, [email]);
}
async function updateUserPassword(email, hashedPassword) {
	await pool.query(`UPDATE users SET password_hash = $1 WHERE email = $2`, [
		hashedPassword,
		email,
	]);
}
module.exports = {
	saveResetCode,
	verifyResetCode,
	deleteResetCode,
	updateUserPassword,
};
