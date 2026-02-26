const db = require('../db/queryMessage')
async function getChatHistory(req,res) {
  const {channelId} = req.params
  try {
    const chat = await db.getChatHistoryQuery(channelId)
    res.status(200).json(chat)
  } catch (error) {
    res.status(500).json({error:'Failed to load messages'})
  }
}
module.exports={getChatHistory}