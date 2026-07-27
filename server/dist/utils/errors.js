"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Conflict = exports.NotFound = exports.Unauthorized = exports.BadRequest = exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
        this.name = 'AppError';
    }
}
exports.AppError = AppError;
class BadRequest extends AppError {
    constructor(message = 'Bad request') {
        super(400, message);
    }
}
exports.BadRequest = BadRequest;
class Unauthorized extends AppError {
    constructor(message = 'Unauthorized') {
        super(401, message);
    }
}
exports.Unauthorized = Unauthorized;
class NotFound extends AppError {
    constructor(message = 'Not found') {
        super(404, message);
    }
}
exports.NotFound = NotFound;
class Conflict extends AppError {
    constructor(message = 'Conflict') {
        super(409, message);
    }
}
exports.Conflict = Conflict;
//# sourceMappingURL=errors.js.map