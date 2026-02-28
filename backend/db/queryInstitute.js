const pool = require('./Pool');
async function createInstitute(name) {
	const { rows } = await pool.query(
		`
    INSERT INTO institutes (name) VALUES ($1) RETURNING id,name`,
		[name],
	);
	return rows[0];
}
async function createDefaultChannel(newInstituteId) {
	const { rows } = await pool.query(
		`
    INSERT INTO channels (name,institute_id, is_private) VALUES ($1,$2,$3) `,
		['General Hallway', newInstituteId, false],
	);
	return rows[0];
}
module.exports = { createInstitute, createDefaultChannel };
