import { Server as SocketIOServer, Socket } from "socket.io";

const userSockets = new Map<string, Set<string>>(); // username -> socketIds

export const setupWebSocket = (io: SocketIOServer) => {
  io.on("connect", (socket: Socket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.on("identify_user", (data: { username: string }) => {
      // multi connections
      if (!userSockets.has(data.username)) {
        userSockets.set(data.username, new Set());
      }

      userSockets.get(data.username)!.add(socket.id);
      socket.data.username = data.username;
      socket.join(`user_${data.username}`);
    });

    socket.on("disconnect", () => {
      if (socket.data.username) {
        const userSet = userSockets.get(socket.data.username);
        if (userSet) {
          userSet.delete(socket.id);
          if (userSet.size === 0) {
            userSockets.delete(socket.data.username);
          }
        }
      }
      console.log(`Socket disconnected: ${socket.id}`);
    });
  });
};

// Export helper to check if user is online
export const isUserOnline = (username: string): boolean => {
  return userSockets.has(username);
};

// Export helper to get user's socket ID
export const getUserSocketId = (username: string): Set<string> | undefined => {
  return userSockets.get(username);
};
