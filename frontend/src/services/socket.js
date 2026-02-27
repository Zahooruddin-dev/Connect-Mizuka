import { io } from 'socket.io-client'

const socket = io('http://localhost:5173', {
  transports: ['websocket'],
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
})

export default socket