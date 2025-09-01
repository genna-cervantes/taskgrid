import { createContext, useContext, useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

type Ctx = { socket: Socket | null; isConnected: boolean;  notifications: {title: string, message: string}[] };
const SocketCtx = createContext<Ctx>({ socket: null, isConnected: false, notifications: [] });

export function SocketNotificationsProvider({
  username,
  children,
}: {
  username: string | null;
  children: React.ReactNode;
}) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notifications, setNotifications] = useState<{title: string, message: string}[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!username) return;

    const newSocket = io("http://localhost:3000", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on("connect", () => {
      setIsConnected(true);
      console.log("Connected to WebSocket");

      // Identify user
      newSocket.emit("identify_user", { username });
    });

    newSocket.on("disconnect", () => {
      setIsConnected(false);
      console.log("Disconnected from WebSocket");
    });

    newSocket.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    newSocket.on("notification", (payload: {context: {title: string, message: string}}) => {
      // not really sure what to do here
      // first opt add to indexeddb to be pulled referenced by notifs page

      setNotifications((prev) => [...prev, payload.context])
      console.log("notification alert: ", payload.context);
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, [username]);

  return (
    <SocketCtx.Provider value={{ socket, isConnected, notifications }}>
      {children}
    </SocketCtx.Provider>
  );
}

export const useNotificationsSocket = () => useContext(SocketCtx);