const pool = require('./Pool');
async function createInstitute(name,adminId) {
  const {rows} = await pool.query(`
    INSERT INTO institutes (name) VALUES ($1) RETURNING id,name`,[name])
    return rows[0]
}
module.exports={createInstitute}