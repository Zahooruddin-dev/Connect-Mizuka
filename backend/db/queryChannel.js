const pool = require('./Pool')
async function createChannelQuery(name,institute_id,is_private=false) {
  const {rows} = await pool.query(`
    INSERT INTO channels (name,institute_id,is_private) 
    VALUES ($1,$2,$3)
    RETURNING id,name,is_private,institute_id
    `,[name,institute_id,is_private])
    return rows[0]
}
module.exports={createChannelQuery}