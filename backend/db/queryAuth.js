const pool = require('./Pool')
async function loginQuery(email) {
	const { rows } = await pool.query('SELECT * FROM users WHERE email = $1', [
		email,
	]);
	return rows[0] || null;
}
async function registerQuery(username, email, password_hash, role = 'student',institute_id) {
	const { rows } = await pool.query(
		`
		INSERT INTO users (username,email,password_hash,role,institute_id) VALUES ($1,$2,$3,$4,$5) RETURNING id, username, email, role,institute_id`,
		[username, email, password_hash, role,institute_id],
	);
	return rows[0];
}
module.exports = {
	loginQuery,
	registerQuery,
};
