import { io } from 'socket.io-client'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
const socket = io(SOCKET_URL, {
  withCredentials: true, 
  transports: ['websocket', 'polling'], 
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  autoConnect: true,
});
if (import.meta.env.DEV) {
  socket.on('connect_error', (err) => console.error('❌ Socket Error:', err.message));
}
export default socket