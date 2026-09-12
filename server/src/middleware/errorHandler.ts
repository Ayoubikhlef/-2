import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { ZodError } from 'zod';

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({ error: err.message });
  }

  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Validation failed', details: err.errors });
  }

  console.error('[AOS Critical Error]:', {
    message: err?.message || 'Unknown error',
    stack: err?.stack,
    name: err?.name,
  });

  return res.status(500).json({
    error: 'Internal server error',
    details: process.env.NODE_ENV === 'development' ? err?.message : undefined
  });
}
