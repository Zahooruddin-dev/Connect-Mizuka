const onlineUsers = require('../stores/onlineUsers');

module.exports = (io) => {
	io.on('connection', (socket) => {
		console.log(`[Server] New socket connection: ${socket.id}`);

		socket.on('user_online', (userId) => {
			const uid = String(userId);
			console.log(`[video auth] User ${uid} authenticated with socket ${socket.id}`);
			onlineUsers.set(uid, socket.id);
			console.log(
				`[video onlineUsers] Now contains:`,
				Array.from(onlineUsers.entries()),
			);
		});

		socket.on('disconnect', (reason) => {
			console.log(`[disconnect] Socket ${socket.id} disconnected: ${reason}`);

			for (let [userId, socketId] of onlineUsers.entries()) {
				if (socketId === socket.id) {
					console.log(`[cleanup] Removing user ${userId} from onlineUsers`);
					onlineUsers.delete(userId);
					break;
				}
			}
		});

		socket.on(
			'call:user',
			({ toUserId, offer, callType, callerUsername, callerId }) => {
				const targetSocketId = onlineUsers.get(String(toUserId));

				if (!targetSocketId) {
					console.warn(
						`[call:user] Target ${toUserId} not online. Store:`,
						Array.from(onlineUsers.entries()),
					);
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
