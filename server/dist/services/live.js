"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initLive = initLive;
exports.emitNewOrder = emitNewOrder;
exports.emitStatsUpdate = emitStatsUpdate;
exports.emitActivity = emitActivity;
const socket_io_1 = require("socket.io");
const jwt_1 = require("../utils/jwt");
const cors_1 = require("../utils/cors");
let io = null;
function initLive(httpServer) {
    io = new socket_io_1.Server(httpServer, {
        cors: {
            origin: (origin, cb) => {
                if ((0, cors_1.isOriginAllowed)(origin)) {
                    cb(null, true);
                }
                else {
                    cb(null, false);
                }
            },
            credentials: true,
        },
    });
    io.use((socket, next) => {
        const token = socket.handshake.auth?.token || socket.handshake.query?.token;
        if (!token)
            return next(new Error('No token provided'));
        try {
            const payload = (0, jwt_1.verifyAccessToken)(token);
            socket.userId = payload.userId;
            socket.userRole = payload.role;
            next();
        }
        catch {
            next(new Error('Invalid token'));
        }
    });
    io.on('connection', (socket) => {
        console.log(`[Live] Client connected: ${socket.id}`);
        socket.on('join-admin', () => {
            const role = socket.userRole;
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
function emitNewOrder(order) {
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
function emitStatsUpdate(stats) {
    if (io) {
        io.to('admin-room').emit('stats-update', stats);
    }
}
function emitActivity(activity) {
    if (io) {
        io.to('admin-room').emit('activity', {
            message: activity,
            timestamp: new Date().toISOString(),
        });
    }
}
//# sourceMappingURL=live.js.map