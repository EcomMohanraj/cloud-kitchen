import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export const getSocket = (): Socket => {
  if (!socket) {
    const rawApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const socketServerUrl = rawApiUrl.replace(/\/api\/?$/, '');

    console.log(`🔌 [Socket.io Client] Initializing connection to: ${socketServerUrl}`);

    socket = io(socketServerUrl, {
      transports: ['websocket', 'polling'],
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
    });

    socket.on('connect', () => {
      console.log(`⚡ [Socket.io Client] Connected with ID: ${socket?.id}`);
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 [Socket.io Client] Disconnected: ${reason}`);
    });

    socket.on('connect_error', (error) => {
      console.warn(`⚠️ [Socket.io Client] Connection error: ${error.message}`);
    });
  }

  if (!socket.connected) {
    socket.connect();
  }

  return socket;
};

export const joinAdminRoom = () => {
  const s = getSocket();
  if (s) {
    s.emit('join-admin-room');
    console.log('👨‍🍳 [Socket.io Client] Emitted join-admin-room event');
  }
};

export const joinOrderRoom = (orderId: string) => {
  const s = getSocket();
  if (s && orderId) {
    s.emit('join-order-room', orderId);
    console.log(`📦 [Socket.io Client] Emitted join-order-room for ${orderId}`);
  }
};

export const leaveOrderRoom = (orderId: string) => {
  const s = getSocket();
  if (s && orderId) {
    s.emit('leave-order-room', orderId);
    console.log(`📦 [Socket.io Client] Emitted leave-order-room for ${orderId}`);
  }
};
