const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
	cors: { origin: '*' },
});

const authRoutes = require('./Routes/authRoutes');
const messageRoutes = require('./Routes/messageRoutes');
const instituteRoutes = require('./Routes/instituteRoutes');
const channelRoutes = require('./Routes/channelRoutes');
const p2pRoutes = require('./Routes/p2pRoutes');
const socketController = require('./Socket-Controllers/messageController');
const p2pSocketController = require('./Socket-Controllers/P2psocketcontroller');

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/institute', instituteRoutes);
app.use('/api/channel', channelRoutes);
app.use('/api/p2p', p2pRoutes);

const onlineUsers = new Map();

io.on('connection', (socket) => {
	socket.on('user_online', (userId) => {
		if (!userId) return;
		const uid = String(userId);
		onlineUsers.set(uid, socket.id);
		socket.userId = uid;
		io.emit('update_user_status', { userId: uid, status: 'online' });
	});

	socket.on('disconnect', () => {
		if (socket.userId) {
			onlineUsers.delete(socket.userId);
			io.emit('update_user_status', { userId: socket.userId, status: 'offline' });
		}
	});

	socket.on('get_online_users', () => {
		socket.emit('online_users_list', Array.from(onlineUsers.keys()));
	});

	socket.on('join_institute_room', (instituteId) => {
		socket.join(instituteId);
		console.log(`[Server] socket ${socket.id} joined institute room: ${instituteId}`);
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
		console.log(`[Server] socket ${socket.id} joined P2P room: ${roomId}`);
	});

	socket.on('leave_p2p', (roomId) => {
		socket.leave(roomId);
	});

	socket.on('send_p2p_message', (data) => {
		p2pSocketController.handleSendP2PMessage(socket, io, data);
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

	socket.on('mark_as_read', (data) => {
		p2pSocketController.handleMarkAsRead(socket, io, data);
	});
});

httpServer.listen(PORT, '0.0.0.0', () => {
	console.log(`Mizuka Engine Live on Port ${PORT}`);
});

module.exports = app;