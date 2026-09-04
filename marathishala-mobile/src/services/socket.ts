import { io, Socket } from 'socket.io-client';
import { getSocketUrl } from './api';

let socket: Socket | null = null;

export const initSocket = (): Socket => {
  if (!socket || !socket.connected) {
    const url = getSocketUrl();
    socket = io(url, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
  }
  return socket;
};

export const getSocket = (): Socket | null => {
  return socket;
};

export const joinMatchRoom = (matchId: string) => {
  const s = initSocket();
  if (s) {
    s.emit('join:match', matchId);
  }
};

export const leaveMatchRoom = (matchId: string) => {
  if (socket) {
    socket.emit('leave:match', matchId);
  }
};
