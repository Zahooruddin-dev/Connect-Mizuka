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
const socketController = require('./Socket-Controllers/messageController');

const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/institute', instituteRoutes);
app.use('/api/channel', channelRoutes);

io.on('connection', (socket) => {
	socket.on('join_institute_room', (instituteId) => {
		socket.join(instituteId);
		console.log(`[Server] socket ${socket.id} joined institute room: ${instituteId}`)
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
		const roomD = io.sockets.adapter.rooms.get(instituteId)
		console.log(`[Server] channel_deleted | instituteId: ${instituteId} | room members: ${roomD ? [...roomD].join(', ') : 'EMPTY'}`)
		io.to(instituteId).emit('channel_deleted', { channelId });
	});

	socket.on('channel_renamed', ({ channel, instituteId }) => {
		const roomR = io.sockets.adapter.rooms.get(instituteId)
		console.log(`[Server] channel_renamed | instituteId: ${instituteId} | room members: ${roomR ? [...roomR].join(', ') : 'EMPTY'}`)
		io.to(instituteId).emit('channel_renamed', { channel });
	});

	socket.on('channel_created', ({ channel, instituteId }) => {
		const roomC = io.sockets.adapter.rooms.get(instituteId)
		console.log(`[Server] channel_created | instituteId: ${instituteId} | channel: ${channel.name} | room members: ${roomC ? [...roomC].join(', ') : 'EMPTY'}`)
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
});

httpServer.listen(PORT, '0.0.0.0', () => {
	console.log(`Mizuka Engine Live on Port ${PORT}`);
});

module.exports = app;