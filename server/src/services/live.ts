import { Server as SocketServer } from 'socket.io';
import { verifyAccessToken } from '../utils/jwt';

let io: SocketServer | null = null;

export function initLive(httpServer: any) {
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,https://aostech.vercel.app').split(',');
  io = new SocketServer(httpServer, {
    cors: {
      origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin)) {
          cb(null, true);
        } else {
          cb(null, false);
        }
      },
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token;
    if (!token) return next(new Error('No token provided'));
    try {
      const payload = verifyAccessToken(token as string);
      (socket as any).userId = payload.userId;
      (socket as any).userRole = payload.role;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`[Live] Client connected: ${socket.id}`);

    socket.on('join-admin', () => {
      const role = (socket as any).userRole;
      if (role === 'SUPER_ADMIN' || role === 'ADMIN') {
        socket.join('admin-room');
      }
    });

    socket.on('disconnect', () => {
      console.log(`[Live] Client disconnected: ${socket.id}`);
    });
  });

  return io;
}

export function emitNewOrder(order: any) {
  if (io) {
    io.to('admin-room').emit('new-order', {
      id: order.id,
      customer: order.customer,
      phone: order.phone,
      total: order.total,
      status: order.status,
      createdAt: order.createdAt,
    });
  }
}

export function emitStatsUpdate(stats: any) {
  if (io) {
    io.to('admin-room').emit('stats-update', stats);
  }
}

export function emitActivity(activity: string) {
  if (io) {
    io.to('admin-room').emit('activity', {
      message: activity,
      timestamp: new Date().toISOString(),
    });
  }
}
