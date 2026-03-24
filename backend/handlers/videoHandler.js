module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);
    
    socket.on('call:user', ({ to, offer }) => {
      socket.to(to).emit('call:incoming', { from: socket.id, offer });
    });
    
    socket.on('call:accepted', ({ to, offer }) => {
      socket.to(to).emit('call:answered', { from: socket.id, offer });
    });
    
    socket.on('ice-candidate', ({ to, candidate }) => {
      socket.to(to).emit('ice-candidate', { from: socket.id, candidate });
    });
    
    socket.on('call:end', ({ to }) => {
      socket.to(to).emit('call:ended');
    });
  });
};