const pool = require('./Pool');
async function findExistingRoomQuery({ u1, u2 }) {
	await pool.query(
		`SELECT * FROM p2p_chatrooms WHERE (user_one_id = $1 AND user_two_id =$2)`,
		[u1, u2],
	);
}
async function createNewRoom({ u1, u2 }) {
	await pool.query(
		`INSERT INTO p2p_chatrooms (user_one_id, user_two_id) VALUES ($1,$2) RETURNING *`,
		[u1, u2]
	);
}
module.exports = { findExistingRoomQuery, createNewRoom };
