import { Request, Response, NextFunction } from 'express';

// Middleware to attach IP to request for easy access
export const ipTracker = (req: Request, res: Response, next: NextFunction) => {
  const forwarded = req.headers['x-forwarded-for'];
  let ip = req.ip;

  if (forwarded) {
    ip = typeof forwarded === 'string' ? forwarded.split(',')[0] : forwarded[0];
  }

  // Handle local IPv6 to IPv4 translation for cleanliness
  if (ip === '::1') ip = '127.0.0.1';

  // Attach to the request object
  (req as any).clientIp = ip;

  next();
};

export default ipTracker;
