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
async function getSingleMessage(req,res) {
  const {messageId} = req.params
  try {
    const message = await db.getSingleMessageQuery(messageId)
    if(!chat) {
      return res.status(404).json({ error: "Not found" })
    }
    res.status(200).json(message)
  } catch (error) {
    res.status(500).json({error:'Failed to load messages'})
  }
}


module.exports={getChatHistory,getSingleMessage}