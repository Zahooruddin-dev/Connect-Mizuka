const pool = require('./Pool');
async function createChannelQuery(name, institute_id, is_private = false) {
	const { rows } = await pool.query(
		`
    INSERT INTO channels (name,institute_id,is_private) 
    VALUES ($1,$2,$3)
    RETURNING id,name,is_private,institute_id
    `,
		[name, institute_id, is_private],
	);
	return rows[0];
}
async function updateChannelQuery(channelId, { name, is_private }) {
	const { rows } = await pool.query(
		`UPDATE channels
     SET name = $1, is_private = $2
     WHERE id = $3
     RETURNING id, name, is_private, institute_id`,
		[name, is_private, channelId],
	);
	return rows[0] || null;
}

async function getChannelsByInstitute(institute_id) {
	const { rows } = await pool.query(
		`SELECT id, name, is_private, institute_id
     FROM channels
     WHERE institute_id = $1`,
		[institute_id],
	);
	return rows || [];
}

async function getChannelById(channelId) {
	const { rows } = await pool.query(`SELECT * FROM channels WHERE id = $1`, [
		channelId,
	]);
	return rows[0] || null;
}

async function deleteChannelQuery(channelId) {
	const query = `DELETE FROM channels WHERE id = $1 RETURNING *`;
	const { rows } = await pool.query(query, [channelId]);
	return rows[0] || null;
}

module.exports = {
	createChannelQuery,
	getChannelsByInstitute,
	getChannelById,
	deleteChannelQuery,
  updateChannelQuery
};
