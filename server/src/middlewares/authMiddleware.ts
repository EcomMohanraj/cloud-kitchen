import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('FATAL SECURITY ERROR: JWT_SECRET environment variable is missing.');
  }
  return secret;
}

export interface AuthRequest extends Request {
  admin?: any;
  rider?: any;
}

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '') || req.cookies?.admin_token;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized admin access. Token missing.' });
    }

    const decoded = jwt.verify(token, getJwtSecret());
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired admin token.' });
  }
};

export const requireRider = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '') || req.cookies?.rider_token;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized rider access. Token missing.' });
    }

    const decoded = jwt.verify(token, getJwtSecret()) as any;
    if (decoded.role !== 'RIDER') {
      return res.status(403).json({ error: 'Forbidden. Access restricted to delivery partners.' });
    }

    req.rider = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired rider token.' });
  }
};
