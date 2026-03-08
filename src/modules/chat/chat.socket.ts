import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export function getChatSocket(token: string): Socket {
  if (socket && socket.connected) return socket;
  if (socket) socket.disconnect();

  const baseUrl = import.meta.env.VITE_API_BASE_URL as string ?? "http://localhost:3000";

  socket = io(baseUrl, {
    auth: { token },
    transports: ["websocket"],
    reconnectionAttempts: 5,
    extraHeaders: { "ngrok-skip-browser-warning": "1" },
  });

  return socket;
}

export function disconnectChatSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
