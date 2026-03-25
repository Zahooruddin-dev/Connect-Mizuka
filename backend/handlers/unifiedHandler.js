const socketController = require('../Socket-Controllers/messageController');
const p2pSocketController = require('../Socket-Controllers/P2psocketcontroller');
const onlineUsers = new Map();

module.exports = (io) => {
	io.on('connection', (socket) => {
		console.log(`[Server] New socket connection: ${socket.id}`);

		socket.on('user_online', (userId) => {
			if (!userId) return;
			const uid = String(userId);
			onlineUsers.set(uid, socket.id);
			socket.userId = uid;
			console.log(`[user_online] User ${uid} online, socket ${socket.id}`);
			io.emit('update_user_status', { userId: uid, status: 'online' });
		});

		socket.on('disconnect', () => {
			if (socket.userId) {
				onlineUsers.delete(socket.userId);
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

		socket.on(
			'call:user',
			({ toUserId, offer, callType, callerUsername, callerId }) => {
				const targetSocketId = onlineUsers.get(String(toUserId));
				if (!targetSocketId) {
					socket.emit('call:user_offline');
					return;
				}
				io.to(targetSocketId).emit('call:incoming', {
					from: socket.id,
					fromUserId: String(callerId),
					callerUsername,
					callType,
					offer,
				});
			},
		);

		socket.on('call:cancel', ({ toUserId }) => {
			const targetSocketId = onlineUsers.get(String(toUserId));
			if (targetSocketId) {
				io.to(targetSocketId).emit('call:cancelled');
			}
		});

		socket.on('call:accepted', ({ to, answer, callType }) => {
			socket
				.to(to)
				.emit('call:answered', { from: socket.id, answer, callType });
		});

		socket.on('call:rejected', ({ to }) => {
			socket.to(to).emit('call:rejected');
		});

		socket.on('ice-candidate', ({ to, candidate }) => {
			socket.to(to).emit('ice-candidate', { candidate });
		});

		socket.on('call:end', ({ to }) => {
			socket.to(to).emit('call:ended');
		});
	});
};
