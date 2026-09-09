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

// ─── Startup Safety Check ───────────────────────────────────────────────────
// Warn loudly if DEV_OTP_BYPASS is left on in production.
// This runs once when the module is first imported (server startup).
if (process.env.DEV_OTP_BYPASS === 'true' && process.env.NODE_ENV === 'production') {
  console.warn(
    '\n' +
    '╔══════════════════════════════════════════════════════════════════╗\n' +
    '║  ⚠️  SECURITY WARNING: DEV_OTP_BYPASS=true IN PRODUCTION!       ║\n' +
    '║  OTP verification is DISABLED. Set DEV_OTP_BYPASS=false or      ║\n' +
    '║  remove it from your Render environment variables immediately.   ║\n' +
    '╚══════════════════════════════════════════════════════════════════╝\n'
  );
}

// In-memory OTP store with expiration, rate-limit attempt caps, and send cooldown
interface OtpRecord {
  otp: string;
  expiresAt: number;
  attempts: number;
  lastSentAt: number; // tracks per-phone cooldown (prevents credit drain from same number)
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

// ─── Fast2SMS OTP Dispatcher ─────────────────────────────────────────────────
// Sends a 6-digit OTP via Fast2SMS's OTP route (no DLT required for OTP route).
// Endpoint: GET https://www.fast2sms.com/dev/bulkV2?authorization=...&variables_values=OTP&route=otp&numbers=PHONE
//
// Returns { success: true } on successful dispatch,
//         { success: false, error: string } on any failure.
async function dispatchSmsOtp(
  phone: string,
  otp: string
): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.FAST2SMS_API_KEY;

  if (!apiKey) {
    console.error('❌ [Fast2SMS] FAST2SMS_API_KEY environment variable is not set.');
    return { success: false, error: 'SMS service is not configured. Please contact support.' };
  }

  const url =
    `https://www.fast2sms.com/dev/bulkV2` +
    `?authorization=${encodeURIComponent(apiKey)}` +
    `&variables_values=${encodeURIComponent(otp)}` +
    `&route=otp` +
    `&numbers=${encodeURIComponent(phone)}`;

  console.log(`📤 [Fast2SMS] Dispatching OTP to +91 ${phone} via Fast2SMS OTP route ...`);

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'cache-control': 'no-cache',
      },
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const json = await response.json() as any;

    if (response.ok && json.return === true) {
      console.log(`✅ [Fast2SMS] OTP dispatched successfully to +91 ${phone}. Request ID: ${json.request_id || 'N/A'}`);
      return { success: true };
    }

    // Fast2SMS returns HTTP 200 even on some errors — check json.return
    const errMsg = Array.isArray(json.message)
      ? json.message.join(', ')
      : (json.message || json.error || 'Unknown SMS gateway error');

    console.error(`❌ [Fast2SMS] API error for +91 ${phone}:`, json);
    return { success: false, error: `SMS delivery failed: ${errMsg}` };

  } catch (err: any) {
    clearTimeout(timeout);
    if (err.name === 'AbortError') {
      console.error(`❌ [Fast2SMS] Request timed out for +91 ${phone}`);
      return { success: false, error: 'SMS gateway timed out. Please try again.' };
    }
    console.error(`❌ [Fast2SMS] Network error for +91 ${phone}:`, err.message);
    return { success: false, error: 'Could not reach SMS gateway. Check your network and try again.' };
  }
}

export const sendCustomerOtp = async (req: Request, res: Response) => {
  try {
    const { phone, name, address } = req.body;

    if (!phone || !/^[6-9]\d{9}$/.test(String(phone).trim())) {
      return res.status(400).json({ error: 'Valid 10-digit Indian mobile number is required.' });
    }

    const cleanPhone = String(phone).trim();
    const isDevBypass = process.env.DEV_OTP_BYPASS === 'true';
    const isProduction = process.env.NODE_ENV === 'production';

    // ── Startup-level misconfiguration guard (also logged per-request in bypass mode) ──
    if (isDevBypass && isProduction) {
      console.warn(
        `⚠️  [OTP Security] DEV_OTP_BYPASS=true is active in PRODUCTION for request to +91 ${cleanPhone}. ` +
        `OTP verification is bypassed. Remove DEV_OTP_BYPASS from Render env vars immediately.`
      );
    }

    // ── Per-phone cooldown: prevent same number from being spammed ──
    // (IP-rate-limit on the route covers cross-number spam; this covers same-number repeat requests)
    const existing = otpStore.get(cleanPhone);
    const COOLDOWN_MS = 60 * 1000; // 60 seconds between OTP sends to the same number
    if (existing && Date.now() - existing.lastSentAt < COOLDOWN_MS) {
      const waitSeconds = Math.ceil((COOLDOWN_MS - (Date.now() - existing.lastSentAt)) / 1000);
      return res.status(429).json({
        error: `Please wait ${waitSeconds} seconds before requesting another OTP for this number.`,
      });
    }

    // ── Generate OTP ──
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes

    // Store OTP first (before sending) so verification works even if we're in bypass mode
    otpStore.set(cleanPhone, {
      otp,
      expiresAt,
      attempts: 0,
      lastSentAt: Date.now(),
      name: name ? String(name).trim() : undefined,
      address: address ? String(address).trim() : undefined,
    });

    // ── SMS Dispatch ──
    if (isDevBypass) {
      // DEV_OTP_BYPASS mode: skip real SMS. Log OTP to console for local testing.
      // In this mode the /verify-otp endpoint accepts the generated OTP (not any arbitrary value).
      console.log(
        `🔧 [OTP Engine] DEV_OTP_BYPASS active — skipping real SMS for +91 ${cleanPhone}. ` +
        `Generated OTP: ${otp} (check server logs to retrieve it during local testing)`
      );
    } else {
      // Production path: dispatch real SMS via Fast2SMS
      const smsResult = await dispatchSmsOtp(cleanPhone, otp);

      if (!smsResult.success) {
        // Roll back the OTP store entry so the user can retry immediately
        otpStore.delete(cleanPhone);
        return res.status(502).json({
          error: smsResult.error || 'Failed to send OTP. Please try again.',
        });
      }
    }

    return res.json({
      success: true,
      message: isDevBypass
        ? 'DEV mode: OTP generated and logged to server console (no SMS sent).'
        : 'OTP sent successfully to your mobile number.',
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

