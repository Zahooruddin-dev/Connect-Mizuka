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
  socket.on('connect', () => console.log('✅ Socket connected:', socket.id));
  socket.on('disconnect', () => console.log('❌ Socket disconnected'));
  socket.on('connect_error', (err) => console.error('❌ Socket Error:', err.message));
  socket.on('test_response', (data) => console.log('✅ Test response from backend:', data));
  
  // Add window method for manual testing
  window.testSocket = () => {
    console.log('[testSocket] Sending test event...');
    socket.emit('test_emit');
  };
}

export default socket