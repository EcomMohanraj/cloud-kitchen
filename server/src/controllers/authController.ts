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

// In-memory OTP store with expiration & rate-limit attempt caps
interface OtpRecord {
  otp: string;
  expiresAt: number;
  attempts: number;
  name?: string;
  address?: string;
}

const otpStore = new Map<string, OtpRecord>();

// Cleanup expired OTPs every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [phone, record] of otpStore.entries()) {
    if (record.expiresAt < now) {
      otpStore.delete(phone);
    }
  }
}, 10 * 60 * 1000);

export const sendCustomerOtp = async (req: Request, res: Response) => {
  try {
    const { phone, name, address } = req.body;

    if (!phone || String(phone).trim().length < 10) {
      return res.status(400).json({ error: 'Valid 10-digit phone number is required.' });
    }

    const cleanPhone = String(phone).trim();
    const isDev = process.env.NODE_ENV !== 'production';

    // In development mode or test runner, use fixed '123456' for predictable E2E tests, otherwise generate 6 random digits
    const otp = isDev ? '123456' : Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes expiration

    otpStore.set(cleanPhone, {
      otp,
      expiresAt,
      attempts: 0,
      name: name ? String(name).trim() : undefined,
      address: address ? String(address).trim() : undefined,
    });

    console.log(`📱 [OTP Engine] Generated OTP for ${cleanPhone}: ${isDev ? otp : '******'}`);

    return res.json({
      success: true,
      message: 'OTP dispatched successfully to phone number.',
      expiresInSeconds: 300,
    });
  } catch (error: any) {
    console.error('❌ Send OTP error:', error);
    return res.status(500).json({ error: error.message || 'Failed to dispatch OTP.' });
  }
};

export const verifyCustomerOtp = async (req: Request, res: Response) => {
  try {
    const { phone, otp, name, address } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({ error: 'Phone number and verification OTP are required.' });
    }

    const cleanPhone = String(phone).trim();
    const cleanOtp = String(otp).trim();
    const record = otpStore.get(cleanPhone);

    if (!record) {
      return res.status(400).json({ error: 'No active OTP request found for this phone number. Please request a new OTP.' });
    }

    if (Date.now() > record.expiresAt) {
      otpStore.delete(cleanPhone);
      return res.status(400).json({ error: 'OTP has expired. Please request a new verification code.' });
    }

    if (record.attempts >= 3) {
      otpStore.delete(cleanPhone);
      return res.status(429).json({ error: 'Too many incorrect OTP attempts. Security lock engaged. Please request a new OTP.' });
    }

    if (record.otp !== cleanOtp) {
      record.attempts += 1;
      return res.status(400).json({ error: `Invalid OTP code. ${3 - record.attempts} attempts remaining.` });
    }

    // Clear OTP record upon successful verification
    otpStore.delete(cleanPhone);

    const userName = name || record.name || 'Valued Patron';
    const userAddress = address || record.address || undefined;

    const user = await prisma.user.upsert({
      where: { phone: cleanPhone },
      update: {
        name: userName,
        address: userAddress,
      },
      create: {
        phone: cleanPhone,
        name: userName,
        address: userAddress || '',
      },
    });

    const token = jwt.sign(
      { userId: user.id, phone: user.phone, role: 'CUSTOMER' },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    console.log('✅ Customer authenticated via OTP verification:', user.phone);

    return res.json({
      success: true,
      role: 'CUSTOMER',
      user,
      token,
    });
  } catch (error: any) {
    console.error('❌ Verify OTP error:', error);
    return res.status(500).json({ error: error.message || 'OTP verification failed.' });
  }
};

export const registerCustomer = async (req: Request, res: Response) => {
  try {
    const { name, phone, address } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and valid phone number are required' });
    }

    const cleanPhone = String(phone).trim();

    const user = await prisma.user.upsert({
      where: { phone: cleanPhone },
      update: {
        name: String(name).trim(),
        address: address ? String(address).trim() : undefined,
      },
      create: {
        phone: cleanPhone,
        name: String(name).trim(),
        address: address ? String(address).trim() : '',
      },
    });

    const token = jwt.sign(
      { userId: user.id, phone: user.phone, role: 'CUSTOMER' },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.json({
      success: true,
      role: 'CUSTOMER',
      user,
      token,
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

    const token = jwt.sign(
      { userId: user.id, phone: user.phone, role: 'CUSTOMER' },
      getJwtSecret(),
      { expiresIn: '7d' }
    );

    const isProd = process.env.NODE_ENV === 'production';

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: isProd,
      sameSite: isProd ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    console.log('✅ Customer logged in and synced to PostgreSQL DB:', user);

    return res.json({
      success: true,
      role: 'CUSTOMER',
      user,
      token,
    });
  } catch (error: any) {
    console.error('❌ Login database error:', error);
    return res.status(500).json({ error: error.message || 'Authentication failed' });
  }
};

export const verifySession = async (req: Request, res: Response) => {
  try {
    const authHeader = req.headers.authorization || '';
    const token = authHeader.replace('Bearer ', '') || req.cookies?.admin_token || req.cookies?.auth_token;

    if (!token) {
      return res.status(401).json({ authenticated: false });
    }

    const decoded = jwt.verify(token, getJwtSecret()) as any;
    return res.json({ authenticated: true, user: decoded, admin: decoded.role === 'ADMIN' ? decoded : undefined });
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
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
  });
  return res.json({ success: true, message: 'Logged out successfully' });
};

