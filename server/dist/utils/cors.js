"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAllowedOrigins = getAllowedOrigins;
exports.isOriginAllowed = isOriginAllowed;
function getAllowedOrigins() {
    const raw = process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:4173,https://aostech.vercel.app';
    return raw
        .split(',')
        .map(origin => origin.trim())
        .filter(Boolean);
}
function isOriginAllowed(origin) {
    if (!origin)
        return true;
    const allowedOrigins = getAllowedOrigins();
    return allowedOrigins.includes(origin);
}
//# sourceMappingURL=cors.js.map