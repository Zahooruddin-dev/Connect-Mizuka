const onlineUsers = require('../stores/onlineUsers');

module.exports = (io) => {
	io.on('connection', (socket) => {
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
