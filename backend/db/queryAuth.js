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
async function updateProfileQuery(userId, { username, email, password_hash }) {
	const fields = [];
	const values = [];
	let idx = 1;

	if (username !== undefined) { fields.push(`username = $${idx++}`); values.push(username); }
	if (email !== undefined) { fields.push(`email = $${idx++}`); values.push(email); }
	if (password_hash !== undefined) { fields.push(`password_hash = $${idx++}`); values.push(password_hash); }

	values.push(userId);

	const { rows } = await pool.query(
		`UPDATE users SET ${fields.join(', ')} WHERE id = $${idx} RETURNING id, username, email, role, created_at`,
		values,
	);
	return rows[0] || null;
}

async function linkToInstituteQuery(userId, institute_id, role = 'member') {
	// insert a record into the junction table. role defaults to member.
	const { rows } = await pool.query(
		`INSERT INTO user_institutes (user_id, institute_id, role)
		 VALUES ($1, $2, $3) RETURNING *`,
		[userId, institute_id, role]
	);
	return rows[0] || null;
}
async function registerQuery(
	username,
	email,
	password_hash,
	role = 'member',
) {
	const { rows } = await pool.query(
		`
		INSERT INTO users (username,email,password_hash,role) VALUES ($1,$2,$3,$4) RETURNING id, username, email, role`,
		[username, email, password_hash, role],
	);
	return rows[0];
}
async function getUserById(userId) {
	const { rows } = await pool.query('SELECT role FROM users WHERE id =$1', [
		userId,
	]);
	return rows[0] || null;
}

async function getUserMemberships(userId) {
	const { rows } = await pool.query(
		`SELECT ui.institute_id AS id, i.name, ui.role
		 FROM user_institutes ui
		 JOIN institutes i ON i.id = ui.institute_id
		 WHERE ui.user_id = $1`,
		[userId],
	);
	return rows || [];
}
async function getUserInfoQuery(userId) {
	const { rows } = await pool.query(
		`SELECT * FROM users WHERE id=$1`,
		[userId],
	);
	return rows[0] || null;
}
module.exports = {
	registerQuery,
	getUserByEmail,
	deleteUserQuery,
	updateUserPassword,
	getUserById,
	linkToInstituteQuery,
	getUserMemberships,
	getUserInfoQuery,
	updateProfileQuery,
};
