import { Request, Response, NextFunction } from 'express';
import { casualLogger } from './logger.js';

export const httpLogger = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    const clientIp = (req as any).clientIp || req.ip || '0.0.0.0';
    casualLogger.info(`${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms - IP: ${clientIp}`);
  });
  next();
};

export default httpLogger;
