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
    `INSERT INTO user_institutes (user_id, institute_id, role) 
     VALUES ($1, $2, $3) 
     RETURNING *`,
    [adminId, newInstituteId, 'admin']
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
    SELECT role FROM user_institutes WHERE user_id = $1 AND institute_id = $2 AND role = 'admin'`,
		[adminId, instituteId],
	);
	return rows[0] || null;
}
async function getAdminInstitutes(adminId) {
	const { rows } = await pool.query(
		`
    SELECT i.id, i.name,ui.role 
    FROM institutes i 
    JOIN user_institutes ui 
    ON i.id = ui.institute_id 
    WHERE ui.user_id = $1 AND ui.role = 'admin'`,
		[adminId],
	);
	return rows;
}
async function searchInstituteMembers(instituteId, userId, searchTerm) {
	const { rows } = await pool.query(
		`SELECT u.id, u.username,u.email,u.role
		FROM users u
		JOIN user_institutes ui ON u.id = ui.user_id
		WHERE ui.institute_id = $1
		AND u.id !=$2
		AND u.username ILIKE $3 
		LIMIT 15`,
		[instituteId, userId, searchTerm],
	);
	return rows ;
}
async function getInstituteMembersQuery(instituteId) {
  const { rows } = await pool.query(
    `SELECT u.id, u.username, u.email, ui.role
     FROM users u
     JOIN user_institutes ui ON u.id = ui.user_id
     WHERE ui.institute_id = $1
     ORDER BY u.username ASC`,
    [instituteId]
  );
  return rows;
}

module.exports = {
	createInstituteQuery,
	createDefaultChannelQuery,
	linkToAdminQuery,
	getInstituteByIdQuery,
	verifyAdminOfInstitute,
  getAdminInstitutes,
		searchInstituteMembers,
		getInstituteMembersQuery

};
