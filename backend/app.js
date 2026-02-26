const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const httpServer = createServer(app); // Wraps Express to handle WebSockets
const io = new Server(httpServer, {
  cors: {
    origin: '*', // Allows all origins for development
  },
});

const authRoutes = require('./Routes/authRoutes');
const socketController = require('./Socket-Controllers/messageController')
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);

io.on('connection', (socket) => {
  console.log(`✅ Device Connected: ${socket.id}`);

  socket.on('join_institute', (channel_id) => {
    socket.join(channel_id);
    console.log(`📍 User ${socket.id} joined room: ${channel_id}`);
  });

  socket.on('send_message', (data) => {
		socketController.handleSendMessage(socket,io,data)
  });

  socket.on('disconnect', () => {
    console.log(`❌ Device Disconnected: ${socket.id}`);
  });
});

httpServer.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Mizuka Engine Live on Port ${PORT}`);
});

module.exports = app;