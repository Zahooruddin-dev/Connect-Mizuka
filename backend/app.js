const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();
const app = express();
const httpServer = createServer(app); //Wrappping our express with HTTP
const io = new Server(httpServer, {
	cors: {
		origin: '*',
	},
});
const authRoutes = require('./Routes/authRoutes');
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

io.on('connection', (socket) => {
	console.log('User connected', socket.id);

	socket.on('message Sent', (institute_id) => {
		socket.join(institute_id);
		console.log('User connected', socket.id, institute_id);
	});

	socket.on('Send_message', (data) => {
		console.log('Message for room', data.room);
		io.to(data.room).emit('Received messaged', data.message);
	});

	socket.on('Disconnected', () => {
		console.log('Connection diconnected');
	});
});

httpServer.listen(PORT, '0.0.0.0', () => {
	console.log(`Mizuka engine & socket Listening at ${PORT}`);
});
module.exports = app;
