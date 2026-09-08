import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/db';

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
  customer?: any;
  user?: any;
  file?: Express.Multer.File;
}

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '') || req.cookies?.admin_token;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized admin access. Token missing.' });
    }

    const decoded = jwt.verify(token, getJwtSecret()) as any;
    if (decoded.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Forbidden. Admin access required.' });
    }

    req.admin = decoded;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired admin token.' });
  }
};

export const requireRider = async (req: AuthRequest, res: Response, next: NextFunction) => {
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

    // Verify rider account is active in DB
    const riderId = decoded.deliveryPartnerId;
    if (riderId) {
      const partner = await prisma.deliveryPartner.findUnique({
        where: { id: riderId },
        select: { id: true, isActive: true },
      });

      if (!partner || !partner.isActive) {
        return res.status(403).json({ error: 'Rider account has been deactivated. Access denied.' });
      }
    }

    req.rider = decoded;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired rider token.' });
  }
};

export const requireCustomer = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '') || req.cookies?.auth_token || req.cookies?.customer_token;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized. Customer token missing.' });
    }

    const decoded = jwt.verify(token, getJwtSecret()) as any;
    if (decoded.role !== 'CUSTOMER') {
      return res.status(403).json({ error: 'Forbidden. Access restricted to customers.' });
    }

    req.customer = decoded;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired customer authentication token.' });
  }
};

export const requireAuthOrCustomer = (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '') || req.cookies?.admin_token || req.cookies?.rider_token || req.cookies?.auth_token || req.cookies?.customer_token;

    if (!token) {
      return res.status(401).json({ error: 'Authentication token missing. Please sign in to view orders.' });
    }

    const decoded = jwt.verify(token, getJwtSecret()) as any;
    req.user = decoded;

    if (decoded.role === 'ADMIN') {
      req.admin = decoded;
    } else if (decoded.role === 'RIDER') {
      req.rider = decoded;
    } else if (decoded.role === 'CUSTOMER') {
      req.customer = decoded;
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
};

