import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';

let io: SocketIOServer | null = null;

export const initSocket = (httpServer: HTTPServer): SocketIOServer => {
  const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

  const defaultAdditionalOrigins = [
    'https://yazhisaicloudkitchen.in',
    'https://www.yazhisaicloudkitchen.in',
  ];

  const envAdditionalOrigins = process.env.ADDITIONAL_ALLOWED_ORIGINS
    ? process.env.ADDITIONAL_ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : [];

  const rawOrigins = [
    CLIENT_URL,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    ...defaultAdditionalOrigins,
    ...envAdditionalOrigins,
  ].filter(Boolean);

  const allowedOrigins = Array.from(
    new Set(rawOrigins.flatMap((o) => [o, o.replace(/\/$/, '')]))
  );

  io = new SocketIOServer(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (!origin) return callback(null, true);
        if (
          allowedOrigins.includes(origin) ||
          origin.endsWith('.vercel.app') ||
          (CLIENT_URL && origin.startsWith(CLIENT_URL))
        ) {
          return callback(null, true);
        }
        return callback(null, true);
      },
      methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  io.on('connection', (socket: Socket) => {
    console.log(`⚡ [Socket.io Server] Client connected: ${socket.id}`);

    // Admin joins admin-room
    socket.on('join-admin-room', () => {
      socket.join('admin-room');
      console.log(`👨‍🍳 [Socket.io Server] Socket ${socket.id} joined admin-room`);
    });

    // Customer joins specific order room
    socket.on('join-order-room', (orderId: string) => {
      if (orderId) {
        const room = `order-${orderId}`;
        socket.join(room);
        console.log(`📦 [Socket.io Server] Socket ${socket.id} joined room ${room}`);
      }
    });

    // Customer leaves specific order room
    socket.on('leave-order-room', (orderId: string) => {
      if (orderId) {
        const room = `order-${orderId}`;
        socket.leave(room);
        console.log(`📦 [Socket.io Server] Socket ${socket.id} left room ${room}`);
      }
    });

    // Rider emits live GPS location update
    socket.on('rider-location-update', async (data: { deliveryPartnerId: string; orderId?: string; latitude: number; longitude: number }) => {
      const { deliveryPartnerId, orderId, latitude, longitude } = data || {};
      if (!deliveryPartnerId || latitude == null || longitude == null) return;

      try {
        const { PrismaClient } = require('@prisma/client');
        const prismaClient = new PrismaClient();

        await prismaClient.driverLocation.upsert({
          where: { deliveryPartnerId },
          update: { orderId: orderId || null, latitude, longitude },
          create: { deliveryPartnerId, orderId: orderId || null, latitude, longitude },
        });
        await prismaClient.$disconnect();

        if (orderId && io) {
          const room = `order-${orderId}`;
          console.log(`📍 [Socket.io Server] Emitting rider-location-update for order ${orderId} (${latitude}, ${longitude}) to ${room}`);
          io.to(room).emit('rider-location-update', {
            deliveryPartnerId,
            orderId,
            latitude,
            longitude,
            updatedAt: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error('Error handling rider-location-update:', err);
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`⚡ [Socket.io Server] Client disconnected: ${socket.id} (${reason})`);
    });
  });

  console.log('🚀 [Socket.io Server] Initialized & listening for realtime events');
  return io;
};

export const getIO = (): SocketIOServer => {
  if (!io) {
    throw new Error('Socket.io has not been initialized!');
  }
  return io;
};

export const emitNewOrder = (order: any) => {
  if (io) {
    console.log(`📢 [Socket.io Server] Emitting new-order event for order ${order.orderNumber || order.id} to admin-room`);
    io.to('admin-room').emit('new-order', { order });
  }
};

export const emitOrderStatusUpdated = (order: any) => {
  if (io) {
    const orderRoom = `order-${order.id}`;
    console.log(`📢 [Socket.io Server] Emitting order-status-updated event for order ${order.id} (${order.orderStatus}) to ${orderRoom} & admin-room`);
    io.to('admin-room').emit('order-status-updated', { order });
    io.to(orderRoom).emit('order-status-updated', { order });
    io.emit('order-status-updated', { order });
  }
};

export const emitOrderAssigned = (order: any) => {
  if (io) {
    console.log(`📢 [Socket.io Server] Emitting order-assigned event for order ${order.id} to admin-room & listeners`);
    io.to('admin-room').emit('order-assigned', { order });
    io.emit('order-assigned', { order });
  }
};
