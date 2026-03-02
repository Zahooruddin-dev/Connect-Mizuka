import { io } from 'socket.io-client'

// connect to backend socket.io server (default backend port 3000)
const SOCKET_URL ='http://localhost:3000'

const socket = io(SOCKET_URL, {
  transports: ['websocket', 'polling'],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  autoConnect: true,
})

export default socket