const db = require('../db/queryP2P')
async function getOrCreateChatroom(req,res) {
  const {user1 , user2 } = req.body
  const [u1,u2] = [user1,user2].sort()
}
module.exports= {getOrCreateChatroom}