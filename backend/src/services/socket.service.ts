import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface UserSocket {
  userId: string;
  socketId: string;
}

let io: Server;
const userSockets = new Map<string, string[]>(); // userId -> [socketId1, socketId2, ...]

export const initializeSocketIO = (socketServer: Server): void => {
  io = socketServer;

  io.on('connection', (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Authenticate socket connection
    const token = socket.handshake.auth.token;

    if (!token) {
      socket.disconnect();
      return;
    }

    try {
      const jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
      const decoded = jwt.verify(token, jwtSecret) as { userId: string };
      const userId = decoded.userId;

      // Store socket connection
      if (!userSockets.has(userId)) {
        userSockets.set(userId, []);
      }
      userSockets.get(userId)?.push(socket.id);

      console.log(`User ${userId} connected with socket ${socket.id}`);

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`Socket disconnected: ${socket.id}`);
        
        // Remove socket from user's socket list
        const sockets = userSockets.get(userId);
        if (sockets) {
          const index = sockets.indexOf(socket.id);
          if (index > -1) {
            sockets.splice(index, 1);
          }
          
          // Remove user entry if no more sockets
          if (sockets.length === 0) {
            userSockets.delete(userId);
          }
        }
      });
    } catch (error) {
      console.error('Socket authentication error:', error);
      socket.disconnect();
    }
  });
};

// Notify a specific user
export const notifyUser = (userId: string, event: string, data: any): void => {
  const sockets = userSockets.get(userId);
  
  if (sockets && sockets.length > 0) {
    sockets.forEach((socketId) => {
      io.to(socketId).emit(event, data);
    });
    console.log(`Sent ${event} to user ${userId}`);
  }
};

// Broadcast to all connected users
export const broadcastToAll = (event: string, data: any): void => {
  io.emit(event, data);
};

export { io };
