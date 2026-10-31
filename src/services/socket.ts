import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

const DEFAULT_BACKEND_URL = 'https://quizzo-backend-6jvx.onrender.com';

function resolveSocketUrl(): string {
  const envUrl = 
    (import.meta as any).env?.VITE_SOCKET_URL || 
    (import.meta as any).env?.VITE_API_URL || 
    (import.meta as any).env?.VITE_URL_API ||
    (import.meta as any).env?.VITE_BACKEND_URL;

  if (envUrl && typeof envUrl === 'string' && envUrl.trim()) {
    return envUrl.trim().replace(/\/api\/v1\/?$/, '').replace(/\/$/, '');
  }

  if (typeof window !== 'undefined' && window.location) {
    const isLocalhost = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1' || 
                        window.location.hostname.endsWith('.local');
    if (!isLocalhost) {
      return DEFAULT_BACKEND_URL;
    }
  }

  return window.location.origin;
}

export function getSocket(): Socket {
  if (!socket) {
    const url = resolveSocketUrl();
    console.log('⚡ Initializing Quizzo Socket.IO connection to:', url);

    socket = io(url, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnectionAttempts: 15,
      reconnectionDelay: 1000,
      timeout: 20000
    });

    socket.on('connect', () => {
      console.log('⚡ Socket connected to Quizzo server:', socket?.id);
    });

    socket.on('disconnect', (reason) => {
      console.log('⚡ Socket disconnected:', reason);
    });

    socket.on('connect_error', (err) => {
      console.warn('Socket connection error:', err.message);
    });
  }

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
