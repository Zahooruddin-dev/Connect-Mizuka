const socketController = require('../Socket-Controllers/messageController');
const p2pSocketController = require('../Socket-Controllers/P2psocketcontroller');
const onlineUsers = new Map();        // userId -> socketId
const socketToUser = new Map();       // socketId -> userId (optional, but helpful)
const activeCalls = new Map();        // userId -> { with, startTime, roomId }
const callTimeouts = new Map();       // userId -> timeoutId

const db = require('../db/queryP2P');

module.exports = (io) => {
  async function getOrCreateRoom(userOne, userTwo) {
    if (!userOne || !userTwo) return null;
    let room = await db.findExistingRoomQuery(userOne, userTwo);
    if (!room) {
      room = await db.createNewRoom(userOne, userTwo);
    }
    return room;
  }

  io.on('connection', (socket) => {
    console.log(`[Server] New socket connection: ${socket.id}`);

    socket.on('user_online', (userId) => {
      if (!userId) return;
      const uid = String(userId);
      onlineUsers.set(uid, socket.id);
      socketToUser.set(socket.id, uid);
      socket.userId = uid;
      console.log(`[user_online] User ${uid} online, socket ${socket.id}`);
      io.emit('update_user_status', { userId: uid, status: 'online' });
    });

    socket.on('disconnect', () => {
      if (socket.userId) {
        onlineUsers.delete(socket.userId);
        socketToUser.delete(socket.id);
        // Clean up any active calls involving this user
        if (activeCalls.has(socket.userId)) {
          const call = activeCalls.get(socket.userId);
          const otherUserId = call.with;
          activeCalls.delete(socket.userId);
          activeCalls.delete(otherUserId);
          const timeoutId = callTimeouts.get(socket.userId);
          if (timeoutId) clearTimeout(timeoutId);
          callTimeouts.delete(socket.userId);
          callTimeouts.delete(otherUserId);
        }
        io.emit('update_user_status', {
          userId: socket.userId,
          status: 'offline',
        });
      }
    });

    socket.on('get_online_users', () => {
      socket.emit('online_users_list', Array.from(onlineUsers.keys()));
    });

    socket.on('join_institute_room', (instituteId) => {
      socket.join(instituteId);
    });

    socket.on('join_institute', (channelId) => {
      socket.join(channelId);
    });

    socket.on('leave_institute', (channelId) => {
      socket.leave(channelId);
    });

    socket.on('send_message', (data) => {
      socketController.handleSendMessage(socket, io, data);
    });

    socket.on('channel_deleted', ({ channelId, instituteId }) => {
      io.to(instituteId).emit('channel_deleted', { channelId });
    });

    socket.on('channel_renamed', ({ channel, instituteId }) => {
      io.to(instituteId).emit('channel_renamed', { channel });
    });

    socket.on('channel_created', ({ channel, instituteId }) => {
      io.to(instituteId).emit('channel_created', { channel });
    });

    socket.on('join_user_room', (userId) => {
      if (!userId) return;
      socket.join(`user_${userId}`);
    });

    socket.on('typing', (data) => {
      socket.to(data.channel_id).emit('Display_typing', {
        username: data.username,
        channel_id: data.channel_id,
      });
    });

    socket.on('stop_typing', (data) => {
      socket.to(data.channel_id).emit('hide_typing', {
        channel_id: data.channel_id,
      });
    });

    socket.on('join_p2p', (roomId) => {
      socket.join(roomId);
    });

    socket.on('leave_p2p', (roomId) => {
      socket.leave(roomId);
    });

    socket.on('send_p2p_message', (data) => {
      p2pSocketController.handleSendP2PMessage(socket, io, data);
    });

    socket.on('delete_p2p_message', async (data) => {
      io.to(data.roomId).emit('p2p_message_deleted', {
        messageId: data.messageId,
        newContent: 'This message was deleted',
      });
      const members = await require('../db/queryP2P').getChatroomMembers(
        data.roomId,
      );
      members.forEach((member) => {
        io.to(`user_${member.user_id}`).emit('p2p_message_deleted', {
          messageId: data.messageId,
          newContent: 'This message was deleted',
        });
      });
    });

    socket.on('edit_p2p_message', async (data) => {
      io.to(data.roomId).emit('p2p_message_edited', {
        messageId: data.messageId,
        newContent: data.content,
      });
      const members = await require('../db/queryP2P').getChatroomMembers(
        data.roomId,
      );
      members.forEach((member) => {
        io.to(`user_${member.user_id}`).emit('p2p_message_edited', {
          messageId: data.messageId,
          newContent: data.content,
        });
      });
    });

    socket.on('typing_p2p', (data) => {
      socket.to(data.room_id).emit('Display_p2p_typing', {
        username: data.username,
        room_id: data.room_id,
      });
    });

    socket.on('stop_typing_p2p', (data) => {
      socket.to(data.room_id).emit('hide_p2p_typing', {
        room_id: data.room_id,
      });
    });

    // ---------- CALL EVENTS (FIXED) ----------
    socket.on(
      'call:user',
      async ({ toUserId, offer, callType, callerUsername }) => {
        const callerId = socket.userId; // 🔒 secure
        if (!callerId || !toUserId) return;

        const targetSocketId = onlineUsers.get(String(toUserId));

        // 🟡 If user offline → missed call
        if (!targetSocketId) {
          const room = await getOrCreateRoom(callerId, toUserId);
          await db.saveP2PMessage(
            room.id,
            callerId,
            'Missed call',
            'call_missed'
          );
          socket.emit('call:user_offline');
          return;
        }

        // 🟢 Store active call (by userId)
        activeCalls.set(String(callerId), {
          with: String(toUserId),
          startTime: null,
          roomId: null,
        });
        activeCalls.set(String(toUserId), {
          with: String(callerId),
          startTime: null,
          roomId: null,
        });

        // 📞 Send incoming call
        io.to(targetSocketId).emit('call:incoming', {
          from: socket.id,
          fromUserId: String(callerId),
          callerUsername,
          callType,
          offer,
        });

        // ⏳ Set timeout (30 sec) and store its ID
        const timeoutId = setTimeout(async () => {
          const call = activeCalls.get(String(callerId));
          if (call && !call.startTime) {
            const room = await getOrCreateRoom(callerId, toUserId);
            await db.saveP2PMessage(
              room.id,
              callerId,
              'Missed call',
              'call_missed'
            );
            // Clean up active calls and timeout
            activeCalls.delete(String(callerId));
            activeCalls.delete(String(toUserId));
            callTimeouts.delete(String(callerId));
            callTimeouts.delete(String(toUserId));
            socket.emit('call:no_answer');
            if (targetSocketId) {
              io.to(targetSocketId).emit('call:ended');
            }
          }
        }, 30000);
        callTimeouts.set(String(callerId), timeoutId);
        // Also store timeout for the other user (not strictly needed but consistent)
        callTimeouts.set(String(toUserId), timeoutId);
      }
    );

    socket.on('call:cancel', async ({ toUserId }) => {
      const callerId = socket.userId;
      if (!callerId || !toUserId) return;

      const room = await getOrCreateRoom(callerId, toUserId);
      await db.saveP2PMessage(room.id, callerId, 'Missed call', 'call_missed');

      const targetSocketId = onlineUsers.get(String(toUserId));
      if (targetSocketId) {
        io.to(targetSocketId).emit('call:cancelled');
      }

      // Clean up active calls and timeout
      activeCalls.delete(String(callerId));
      activeCalls.delete(String(toUserId));
      const timeoutId = callTimeouts.get(String(callerId));
      if (timeoutId) clearTimeout(timeoutId);
      callTimeouts.delete(String(callerId));
      callTimeouts.delete(String(toUserId));
    });

    socket.on('call:accepted', async ({ to, answer, callType, roomId: clientRoomId }) => {
      const receiverId = socket.userId; // current user (the one answering)
      // Find callerId from the target socketId (to)
      let callerId = null;
      for (const [uid, sid] of onlineUsers.entries()) {
        if (sid === to) {
          callerId = uid;
          break;
        }
      }
      if (!callerId) {
        console.error(`[call:accepted] Could not find callerId for socket ${to}`);
        return;
      }

      // Ensure the room exists (use callerId and receiverId)
      const room = await getOrCreateRoom(callerId, receiverId);
      if (!room) {
        console.error('[call:accepted] Failed to get/create room');
        return;
      }

      // Update active calls with startTime and roomId
      const now = Date.now();
      activeCalls.set(String(callerId), {
        with: String(receiverId),
        startTime: now,
        roomId: room.id,
      });
      activeCalls.set(String(receiverId), {
        with: String(callerId),
        startTime: now,
        roomId: room.id,
      });

      // Clear the timeout for this call
      const timeoutId = callTimeouts.get(String(callerId));
      if (timeoutId) clearTimeout(timeoutId);
      callTimeouts.delete(String(callerId));
      callTimeouts.delete(String(receiverId));

      // Notify the caller that the call was answered
      socket.to(to).emit('call:answered', {
        from: socket.id,
        answer,
        callType,
      });
    });

    socket.on('call:rejected', async ({ to, toUserId }) => {
      const callerId = socket.userId;
      if (!callerId || !toUserId) return;

      const room = await getOrCreateRoom(callerId, toUserId);
      await db.saveP2PMessage(
        room.id,
        callerId,
        'Call declined',
        'call_rejected'
      );

      // Clean up active calls and timeout
      activeCalls.delete(String(callerId));
      activeCalls.delete(String(toUserId));
      const timeoutId = callTimeouts.get(String(callerId));
      if (timeoutId) clearTimeout(timeoutId);
      callTimeouts.delete(String(callerId));
      callTimeouts.delete(String(toUserId));

      socket.to(to).emit('call:rejected');
    });

    socket.on('ice-candidate', ({ to, candidate }) => {
      socket.to(to).emit('ice-candidate', { candidate });
    });

    socket.on('call:end', async ({ toUserId }) => {
      const callerId = socket.userId;
      if (!callerId || !toUserId) return;

      const callData = activeCalls.get(String(callerId));
      const room = await getOrCreateRoom(callerId, toUserId);
      let messageType = 'call_ended';
      let messageContent = 'Call ended';

      if (callData && callData.startTime) {
        const durationMs = Date.now() - callData.startTime;
        const seconds = Math.floor(durationMs / 1000);
        const minutes = Math.floor(seconds / 60);
        messageContent = minutes > 0
          ? `Call lasted ${minutes}m ${seconds % 60}s`
          : `Call lasted ${seconds}s`;
        messageType = 'call_accepted';
      }

      await db.saveP2PMessage(room.id, callerId, messageContent, messageType);

      const targetSocketId = onlineUsers.get(String(toUserId));
      if (targetSocketId) {
        io.to(targetSocketId).emit('call:ended');
      }

      // Clean up active calls and timeout (if any)
      activeCalls.delete(String(callerId));
      activeCalls.delete(String(toUserId));
      const timeoutId = callTimeouts.get(String(callerId));
      if (timeoutId) clearTimeout(timeoutId);
      callTimeouts.delete(String(callerId));
      callTimeouts.delete(String(toUserId));
    });
  });
};