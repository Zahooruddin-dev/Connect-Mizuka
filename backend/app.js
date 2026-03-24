require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createServer } = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
	process.env.FRONTEND_URL,
	'http://localhost:5173',
	'http://localhost:3000',
].filter(Boolean);

const io = new Server(httpServer, {
	cors: {
		origin: allowedOrigins,
		methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
		credentials: true,
	},
});

const authRoutes = require('./Routes/authRoutes');
const messageRoutes = require('./Routes/messageRoutes');
const instituteRoutes = require('./Routes/instituteRoutes');
const channelRoutes = require('./Routes/channelRoutes');
const p2pRoutes = require('./Routes/p2pRoutes');
const socketController = require('./Socket-Controllers/messageController');
const p2pSocketController = require('./Socket-Controllers/P2psocketcontroller');
const { default: socket } = require('../frontend/src/services/socket');
const webRtcSignaling = require('./handlers/videoHandler');
const chatWebSocket = require('./handlers/chatHandler');
const PORT = process.env.PORT || 3000;

app.use(
	cors({
		origin: function (origin, callback) {
			if (!origin) return callback(null, true);
			if (allowedOrigins.indexOf(origin) === -1) {
				var msg =
					'The CORS policy for this site does not allow access from the specified Origin.';
				return callback(new Error(msg), false);
			}
			return callback(null, true);
		},
		credentials: true,
	}),
);

app.use(cors());
app.use(express.json());
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/institute', instituteRoutes);
app.use('/api/channel', channelRoutes);
app.use('/api/p2p', p2pRoutes);
app.get('/api/ping', (req, res) => res.sendStatus(200));

// WEB SOCKET CHAT && GENERAL
chatWebSocket(io);
// WEB RTC SIGNALING
webRtcSignaling(io);

httpServer.listen(PORT, '0.0.0.0', () => {
	console.log(`Mizuka Engine Live on Port ${PORT}`);
});

module.exports = app;
