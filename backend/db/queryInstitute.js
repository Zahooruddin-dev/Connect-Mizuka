const pool = require('./Pool');
async function createInstituteQuery(name) {
	const { rows } = await pool.query(
		`
    INSERT INTO institutes (name) VALUES ($1) RETURNING id,name`,
		[name],
	);
	return rows[0];
}
async function createDefaultChannelQuery(newInstituteId) {
	const { rows } = await pool.query(
		`
    INSERT INTO channels (name,institute_id, is_private) VALUES ($1,$2,$3) `,
		['General Hallway', newInstituteId, false],
	);
	return rows[0];
}
async function linkToAdminQuery(newInstituteId, adminId) {
	const { rows } = await pool.query(
		`
    UPDATE users SET institute_id = $1 WHERE id =$2`,
		[newInstituteId, adminId],
	);
	return rows[0];
}
async function getInstituteByIdQuery(instituteId) {
	const { rows } = await pool.query(
		`
    SELECT id,name FROM institutes WHERE id =$1`,
		[instituteId],
	);
	return rows[0];
}
async function verifyAdminOfInstitute(adminId, instituteId) {
	const { rows } = await pool.query(
		`
    SELECT role FROM user_institutes WHERE user_id = 1$ AND institute_id = $2 AND role = 'admin'`,
		[adminId, instituteId],
	);
	return rows[0];
}

module.exports = {
	createInstituteQuery,
	createDefaultChannelQuery,
	linkToAdminQuery,
	getInstituteByIdQuery,
  verifyAdminOfInstitute
};
