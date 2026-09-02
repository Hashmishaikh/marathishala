let ioInstance = null;

function initSocket(io) {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log(`🔌 Socket connected: ${socket.id}`);

    // Join match room
    socket.on('join_match', (matchId) => {
      if (matchId) {
        socket.join(`match_${matchId}`);
        console.log(`Socket ${socket.id} joined room: match_${matchId}`);
      }
    });

    // Leave match room
    socket.on('leave_match', (matchId) => {
      if (matchId) {
        socket.leave(`match_${matchId}`);
        console.log(`Socket ${socket.id} left room: match_${matchId}`);
      }
    });

    socket.on('disconnect', () => {
      console.log(`🔌 Socket disconnected: ${socket.id}`);
    });
  });
}

function broadcastMatchUpdate(matchId, event, data) {
  if (ioInstance && matchId) {
    ioInstance.to(`match_${matchId}`).emit(event, data);
    // Also emit general live feed update
    ioInstance.emit('global_match_update', { matchId, event, data });
  }
}

function getIO() {
  return ioInstance;
}

module.exports = {
  initSocket,
  broadcastMatchUpdate,
  getIO
};
