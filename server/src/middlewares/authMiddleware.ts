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
  chef?: any;
  customer?: any;
  user?: any;
  file?: Express.Multer.File;
}

function maybeRefreshOnActivity(res: Response, decoded: any) {
  if (!decoded || !decoded.exp) return;
  const nowInSec = Math.floor(Date.now() / 1000);
  const remainingSec = decoded.exp - nowInSec;
  // If token has less than 4 hours remaining, issue a fresh 1d token in response header
  if (remainingSec > 0 && remainingSec < 4 * 60 * 60) {
    const payload = { ...decoded };
    delete payload.iat;
    delete payload.exp;
    delete payload.nbf;
    delete payload.jti;
    const newToken = jwt.sign(payload, getJwtSecret(), { expiresIn: '1d' });
    res.setHeader('X-New-Token', newToken);
  }
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

    maybeRefreshOnActivity(res, decoded);
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

    maybeRefreshOnActivity(res, decoded);
    req.rider = decoded;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired rider token.' });
  }
};

export const requireChef = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '') || req.cookies?.chef_token;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized chef access. Token missing.' });
    }

    const decoded = jwt.verify(token, getJwtSecret()) as any;
    if (decoded.role !== 'CHEF') {
      return res.status(403).json({ error: 'Forbidden. Access restricted to kitchen chefs.' });
    }

    // Verify chef account is active in DB
    const chefId = decoded.chefId;
    if (chefId) {
      const chef = await prisma.chef.findUnique({
        where: { id: chefId },
        select: { id: true, isActive: true },
      });

      if (!chef || !chef.isActive) {
        return res.status(403).json({ error: 'Chef account has been deactivated. Access denied.' });
      }
    }

    maybeRefreshOnActivity(res, decoded);
    req.chef = decoded;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired chef token.' });
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

    maybeRefreshOnActivity(res, decoded);
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
    const token = authHeader.replace('Bearer ', '') || req.cookies?.admin_token || req.cookies?.rider_token || req.cookies?.chef_token || req.cookies?.auth_token || req.cookies?.customer_token;

    if (!token) {
      return res.status(401).json({ error: 'Authentication token missing. Please sign in to view orders.' });
    }

    const decoded = jwt.verify(token, getJwtSecret()) as any;
    maybeRefreshOnActivity(res, decoded);
    req.user = decoded;

    if (decoded.role === 'ADMIN') {
      req.admin = decoded;
    } else if (decoded.role === 'RIDER') {
      req.rider = decoded;
    } else if (decoded.role === 'CHEF') {
      req.chef = decoded;
    } else if (decoded.role === 'CUSTOMER') {
      req.customer = decoded;
    }

    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
};


