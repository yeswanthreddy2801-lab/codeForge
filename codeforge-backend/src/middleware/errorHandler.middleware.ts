import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';
import { JsonWebTokenError } from 'jsonwebtoken';
import { error } from '../shared/utils/response.util';
import { env } from '../config/env';

export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction) => {
  // Log error in development or if it's a 500
  if (env.NODE_ENV === 'development' || !err.statusCode) {
    console.error('Error Handler caught:', err);
  }

  if (err instanceof ZodError) {
    return error(res, 'Validation Error', 400, err.errors);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      return error(res, 'Resource already exists (conflict)', 409, err.meta);
    }
    if (err.code === 'P2025') {
      return error(res, 'Resource not found', 404, err.meta);
    }
  }

  if (err instanceof JsonWebTokenError) {
    return error(res, 'Invalid token', 401);
  }

  // Handle generic errors
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';
  const details = env.NODE_ENV === 'development' ? err.stack : undefined;

  return error(res, message, statusCode, details);
};
