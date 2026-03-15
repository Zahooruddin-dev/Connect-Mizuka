const db = require('../db/querySocketMessage');

async function handleSendMessage(socket, io, data) {
  const { channel_id, sender_id, message } = data;
  try {
    const savedMessage = await db.saveSentMessages(channel_id, sender_id, message);

    io.to(channel_id).emit('receive_message', {
      id: savedMessage.id,
      text: savedMessage.content,
      from: savedMessage.sender_id,
      username: savedMessage.username,   
      timestamp: new Date(savedMessage.created_at || Date.now()).toISOString(),
      channel_id,                        
    });

    console.log(`Message saved and sent to room: ${channel_id}`);
  } catch (error) {
    console.error('DB insert error:', error.message);
    socket.emit('error', { message: 'Failed to send message' });
  }
}

module.exports = { handleSendMessage };