import { Request, Response } from 'express';
import { prisma } from '../config/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('FATAL SECURITY ERROR: JWT_SECRET environment variable is missing.');
  }
  return secret;
}

export const loginAdmin = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const admin = await prisma.admin.findUnique({
      where: { email: String(email).trim().toLowerCase() },
    });

    if (!admin) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: admin.id, email: admin.email, role: 'ADMIN' },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      role: 'ADMIN',
      user: { id: admin.id, email: admin.email, role: 'ADMIN' },
      token,
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Authentication failed' });
  }
};

export const registerCustomer = async (req: Request, res: Response) => {
  try {
    const { name, phone, email, address } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and valid phone number are required' });
    }

    const user = await prisma.user.upsert({
      where: { phone: String(phone).trim() },
      update: {
        name: String(name).trim(),
        address: address ? String(address).trim() : undefined,
      },
      create: {
        phone: String(phone).trim(),
        name: String(name).trim(),
        address: address ? String(address).trim() : '',
      },
    });

    console.log('✅ Customer account created/updated in PostgreSQL DB:', user);

    return res.json({
      success: true,
      role: 'CUSTOMER',
      user,
    });
  } catch (error: any) {
    console.error('❌ Customer registration database error:', error);
    return res.status(500).json({ error: error.message || 'Customer registration failed' });
  }
};

export const loginCustomer = async (req: Request, res: Response) => {
  try {
    const { email, password, phone, name } = req.body;

    if (!phone && !email) {
      return res.status(400).json({ error: 'Phone number or email is required' });
    }

    // 1. First check if email matches an entry in the Admin table
    if (email && String(email).trim()) {
      const cleanEmail = String(email).trim().toLowerCase();
      const admin = await prisma.admin.findUnique({
        where: { email: cleanEmail },
      });

      if (admin) {
        if (!password) {
          return res.status(400).json({ error: 'Password is required for admin login' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
          { userId: admin.id, email: admin.email, role: 'ADMIN' },
          getJwtSecret(),
          { expiresIn: '7d' }
        );

        const isProd = process.env.NODE_ENV === 'production';

        res.cookie('admin_token', token, {
          httpOnly: true,
          secure: isProd,
          sameSite: isProd ? 'none' : 'lax',
          maxAge: 7 * 24 * 60 * 60 * 1000,
        });

        console.log('✅ Admin logged in via unified login:', admin.email);

        return res.json({
          success: true,
          role: 'ADMIN',
          user: { id: admin.id, email: admin.email, role: 'ADMIN' },
          token,
        });
      }
    }

    // 2. If no Admin match, check User (customer) table as normal
    const userPhone = phone ? String(phone).trim() : '9876543210';
    const userName = name || (email ? String(email).split('@')[0] : 'Valued Patron');

    const user = await prisma.user.upsert({
      where: { phone: userPhone },
      update: {
        name: userName,
      },
      create: {
        phone: userPhone,
        name: userName,
      },
    });

    console.log('✅ Customer logged in and synced to PostgreSQL DB:', user);

    return res.json({
      success: true,
      role: 'CUSTOMER',
      user,
    });
  } catch (error: any) {
    console.error('❌ Login database error:', error);
    return res.status(500).json({ error: error.message || 'Authentication failed' });
  }
};

export const verifySession = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '') || req.cookies?.admin_token;

    if (!token) {
      return res.status(401).json({ authenticated: false });
    }

    const decoded = jwt.verify(token, getJwtSecret());
    return res.json({ authenticated: true, admin: decoded });
  } catch (error) {
    return res.status(401).json({ authenticated: false });
  }
};

export const logoutAdmin = async (req: Request, res: Response) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('admin_token', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
  });
  return res.json({ success: true, message: 'Logged out successfully' });
};
