export declare class AppError extends Error {
    statusCode: number;
    constructor(statusCode: number, message: string);
}
export declare class BadRequest extends AppError {
    constructor(message?: string);
}
export declare class Unauthorized extends AppError {
    constructor(message?: string);
}
export declare class NotFound extends AppError {
    constructor(message?: string);
}
export declare class Conflict extends AppError {
    constructor(message?: string);
}
//# sourceMappingURL=errors.d.ts.map