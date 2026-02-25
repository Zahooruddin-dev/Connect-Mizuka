const pool = require('./Pool');
async function saveResetCode(email, code, expires) {
	await pool.query(`DELETE FROM password_resets WHERE email =$1`, [email]);
}
async function verifyResetCode(email, code) {
	const query = `SELECT FROM * password_resets WHERE email =$1 AND code =$2 AND expires_at>NOW()`;
	const { rows } = await pool.query(query, [email, code]);
	return rows[0] || null;
}
async function deleteResetCode(email) {
	await pool.query(`DELETE FROM password_resets WHERE email =$1`, [email]);
}
module.exports = {
	saveResetCode,
	verifyResetCode,
	deleteResetCode,
};
