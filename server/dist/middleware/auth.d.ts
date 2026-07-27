import { Request, Response, NextFunction } from 'express';
export interface AuthRequest extends Request {
    userId?: string;
    userRole?: string;
}
export declare function requireAuth(req: AuthRequest, _res: Response, next: NextFunction): Promise<void>;
export declare function requireRole(...roles: string[]): (req: AuthRequest, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=auth.d.ts.map