"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const errors_1 = require("../utils/errors");
const zod_1 = require("zod");
function errorHandler(err, _req, res, _next) {
    if (err instanceof errors_1.AppError) {
        return res.status(err.statusCode).json({ error: err.message });
    }
    if (err instanceof zod_1.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('[AOS Error]', err);
    return res.status(500).json({ error: 'Internal server error' });
}
//# sourceMappingURL=errorHandler.js.map