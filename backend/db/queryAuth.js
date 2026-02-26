const pool = require('./Pool');
async function getUserByEmail(email) {
	const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [
		email,
	]);
	return rows[0] || null;
}
async function deleteUserQuery(email) {
	const { rows } = await pool.query(
		'DELETE FROM users WHERE email = $1 RETURNING id',
		[email],
	);
	return rows[0] || null;
}
async function updateUserPassword(email, hashedPassword) {
	await pool.query(`UPDATE users SET password_hash = $1 WHERE email = $2`, [
		hashedPassword,
		email,
	]);
}
async function registerQuery(
	username,
	email,
	password_hash,
	role = 'student',
	institute_id,
) {
	const { rows } = await pool.query(
		`
		INSERT INTO users (username,email,password_hash,role,institute_id) VALUES ($1,$2,$3,$4,$5) RETURNING id, username, email, role,institute_id`,
		[username, email, password_hash, role, institute_id],
	);
	return rows[0];
}
async function getUserById(userId) {
	const { rows } = await pool.query('SELECT role FROM users WHERE id =$1', [
		userId,
	]);
	return rows[0] || null;
}
module.exports = {
	registerQuery,
	getUserByEmail,
	deleteUserQuery,
	updateUserPassword,
	getUserById,
};
