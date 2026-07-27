"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.requireRole = requireRole;
const jwt_1 = require("../utils/jwt");
const prisma_1 = require("../utils/prisma");
const errors_1 = require("../utils/errors");
async function requireAuth(req, _res, next) {
    try {
        const header = req.headers.authorization;
        if (!header?.startsWith('Bearer '))
            return next(new errors_1.Unauthorized('No token provided'));
        const payload = (0, jwt_1.verifyAccessToken)(header.slice(7));
        const user = await prisma_1.prisma.user.findUnique({ where: { id: payload.userId }, select: { isActive: true } });
        if (!user || !user.isActive)
            return next(new errors_1.Unauthorized('Account is deactivated'));
        req.userId = payload.userId;
        req.userRole = payload.role;
        next();
    }
    catch {
        next(new errors_1.Unauthorized('Invalid or expired token'));
    }
}
function requireRole(...roles) {
    return (req, _res, next) => {
        if (!req.userRole || !roles.includes(req.userRole)) {
            return next(new errors_1.Unauthorized('Insufficient permissions'));
        }
        next();
    };
}
//# sourceMappingURL=auth.js.map