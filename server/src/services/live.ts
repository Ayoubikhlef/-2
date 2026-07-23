import { Server as SocketServer } from 'socket.io';

let io: SocketServer | null = null;

export function initLive(httpServer: any) {
  const allowedOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173,https://aos-tech-store.vercel.app').split(',');
  io = new SocketServer(httpServer, {
    cors: {
      origin: (origin, cb) => {
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
          cb(null, true);
        } else {
          cb(null, false);
        }
      },
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log(`[Live] Client connected: ${socket.id}`);

    socket.on('join-admin', () => {
      socket.join('admin-room');
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
