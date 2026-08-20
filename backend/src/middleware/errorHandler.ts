import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export const errorHandler = (err: Error, req: Request, res: Response, next: NextFunction) => {
  logger.error(err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
    });
  }

  // Handle other errors
  if (process.env.NODE_ENV === 'development') {
    return res.status(500).json({
      status: 'error',
      message: err.message,
      stack: err.stack,
    });
  }

  return res.status(500).json({
    status: 'error',
    message: 'An unexpected error occurred',
  });
};
