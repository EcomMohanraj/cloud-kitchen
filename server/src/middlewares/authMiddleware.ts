import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'yazhisai-cloud-kitchen-jwt-secret-2026';

export interface AuthRequest extends Request {
  admin?: any;
}

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '') || req.cookies?.admin_token;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized admin access. Token missing.' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.admin = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired admin token.' });
  }
};
