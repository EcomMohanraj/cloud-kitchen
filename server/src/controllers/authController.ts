import { Request, Response } from 'express';
import { prisma } from '../config/db';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { sendPasswordResetEmail } from '../services/emailService';

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
      { expiresIn: '1d' }
    );

    const isProd = process.env.NODE_ENV === 'production';
    const host = req.headers.host || '';
    const isCustomDomain = host.includes('yazhisaicloudkitchen.in');
    const isSecure = isProd && isCustomDomain;

    res.cookie('admin_token', token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      ...(isCustomDomain && { domain: '.yazhisaicloudkitchen.in' }),
    });

    return res.json({
      success: true,
      role: 'ADMIN',
      user: { id: admin.id, email: admin.email, role: 'ADMIN' },
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
      { expiresIn: '1d' }
    );

    const isProd = process.env.NODE_ENV === 'production';
    const host = req.headers.host || '';
    const isCustomDomain = host.includes('yazhisaicloudkitchen.in');
    const isSecure = isProd && isCustomDomain;

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      ...(isCustomDomain && { domain: '.yazhisaicloudkitchen.in' }),
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
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

export const registerCustomer = async (req: Request, res: Response) => {
  try {
    const { name, phone, email, password, address } = req.body;

    if (!name || String(name).trim().length === 0) {
      return res.status(400).json({ error: 'Please enter your full name.' });
    }

    const cleanEmail = email ? String(email).trim().toLowerCase() : null;
    const cleanPhone = phone && String(phone).trim() !== '' ? String(phone).trim() : null;

    if (!cleanEmail && !cleanPhone) {
      return res.status(400).json({ error: 'Please provide an email address or phone number to register.' });
    }

    // 1. Explicit duplicate checks before database insertion
    if (cleanEmail) {
      const existingEmailUser = await prisma.user.findFirst({ where: { email: cleanEmail } });
      if (existingEmailUser) {
        return res.status(409).json({ error: 'An account with this email already exists. Please sign in instead.' });
      }
    }

    if (cleanPhone) {
      const existingPhoneUser = await prisma.user.findUnique({ where: { phone: cleanPhone } });
      if (existingPhoneUser) {
        return res.status(409).json({ error: 'This phone number is already registered with another account.' });
      }
    }

    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;

    let user;
    try {
      user = await prisma.user.create({
        data: {
          name: String(name).trim(),
          email: cleanEmail,
          phone: cleanPhone,
          password: hashedPassword,
          address: address ? String(address).trim() : null,
        },
      });
    } catch (dbError: any) {
      if (dbError.code === 'P2002') {
        const target = JSON.stringify(dbError.meta?.target || '');
        if (target.includes('email')) {
          return res.status(409).json({ error: 'An account with this email already exists. Please sign in instead.' });
        }
        if (target.includes('phone')) {
          return res.status(409).json({ error: 'This phone number is already registered with another account.' });
        }
      }
      throw dbError;
    }

    const token = jwt.sign(
      { userId: user.id, phone: user.phone, role: 'CUSTOMER' },
      getJwtSecret(),
      { expiresIn: '1d' }
    );

    const isProd = process.env.NODE_ENV === 'production';
    const host = req.headers.host || '';
    const isCustomDomain = host.includes('yazhisaicloudkitchen.in');
    const isSecure = isProd && isCustomDomain;

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      ...(isCustomDomain && { domain: '.yazhisaicloudkitchen.in' }),
    });

    return res.json({
      success: true,
      role: 'CUSTOMER',
      user,
      token,
    });
  } catch (error: any) {
    console.error('❌ Customer registration error:', error);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
};

export const loginCustomer = async (req: Request, res: Response) => {
  try {
    const { email, password, phone } = req.body;

    const cleanEmail = email ? String(email).trim().toLowerCase() : null;
    const cleanPhone = phone && String(phone).trim() !== '' ? String(phone).trim() : null;

    if (!cleanEmail && !cleanPhone) {
      return res.status(400).json({ error: 'Please enter your email or phone number to sign in.' });
    }

    // 1. Check if email matches Admin table
    if (cleanEmail) {
      const admin = await prisma.admin.findUnique({
        where: { email: cleanEmail },
      });

      if (admin) {
        if (!password) {
          return res.status(400).json({ error: 'Password is required for admin login.' });
        }

        const isMatch = await bcrypt.compare(password, admin.password);
        if (!isMatch) {
          return res.status(401).json({ error: 'Incorrect password. Please try again.' });
        }

        const token = jwt.sign(
          { userId: admin.id, email: admin.email, role: 'ADMIN' },
          getJwtSecret(),
          { expiresIn: '1d' }
        );

        const isProd = process.env.NODE_ENV === 'production';
        const host = req.headers.host || '';
        const isCustomDomain = host.includes('yazhisaicloudkitchen.in');
        const isSecure = isProd && isCustomDomain;

        res.cookie('admin_token', token, {
          httpOnly: true,
          secure: isSecure,
          sameSite: 'lax',
          maxAge: 24 * 60 * 60 * 1000,
          ...(isCustomDomain && { domain: '.yazhisaicloudkitchen.in' }),
        });

        console.log('✅ Admin logged in via unified login:', admin.email);

        return res.json({
          success: true,
          role: 'ADMIN',
          user: { id: admin.id, email: admin.email, role: 'ADMIN' },
        });
      }
    }

    // 2. Customer table check
    let user: any = null;
    if (cleanEmail) {
      user = await prisma.user.findFirst({ where: { email: cleanEmail } });
    } else if (cleanPhone) {
      user = await prisma.user.findUnique({ where: { phone: cleanPhone } });
    }

    if (!user) {
      if (cleanEmail) {
        return res.status(404).json({ error: 'No account found with this email. Please sign up first.' });
      } else {
        return res.status(404).json({ error: 'No account found with this phone number. Please sign up first.' });
      }
    }

    if (!password) {
      return res.status(400).json({ error: 'Password is required to sign in.' });
    }

    if (!user.password) {
      return res.status(401).json({ error: 'No password set for this account. Please sign in via OTP or Reset Password.' });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({ error: 'Incorrect password. Please try again.' });
    }

    const token = jwt.sign(
      { userId: user.id, phone: user.phone, role: 'CUSTOMER' },
      getJwtSecret(),
      { expiresIn: '1d' }
    );

    const isProd = process.env.NODE_ENV === 'production';
    const host = req.headers.host || '';
    const isCustomDomain = host.includes('yazhisaicloudkitchen.in');
    const isSecure = isProd && isCustomDomain;

    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 24 * 60 * 60 * 1000,
      ...(isCustomDomain && { domain: '.yazhisaicloudkitchen.in' }),
    });

    return res.json({
      success: true,
      role: 'CUSTOMER',
      user,
      token,
    });
  } catch (error: any) {
    console.error('❌ Customer login error:', error);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
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
  const cookieOpts = {
    httpOnly: true,
    secure: isProd,
    sameSite: (isProd ? 'none' : 'lax') as 'none' | 'lax',
  };
  res.clearCookie('admin_token', cookieOpts);
  res.clearCookie('auth_token', cookieOpts);
  res.clearCookie('customer_token', cookieOpts);
  res.clearCookie('chef_token', cookieOpts);
  res.clearCookie('rider_token', cookieOpts);
  return res.json({ success: true, message: 'Logged out successfully' });
};

// ─── Customer Forgot Password & Reset Flow ──────────────────────────────────
export const forgotPasswordCustomer = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    const GENERIC_RESPONSE = {
      success: true,
      message: 'If an account exists with this email address, a 6-digit password reset code has been sent.',
    };

    if (!email || typeof email !== 'string' || !email.includes('@')) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    const cleanEmail = email.trim().toLowerCase();

    // Check if customer exists by email
    const user = await prisma.user.findFirst({
      where: { email: cleanEmail },
    });

    // SECURITY: Always return generic response even if email is not found to prevent email enumeration attacks
    if (!user) {
      console.log(`ℹ️ [Forgot Password] Email ${cleanEmail} not found in database. Returning generic response.`);
      return res.json(GENERIC_RESPONSE);
    }

    // Generate 6-digit numeric OTP and set 10-minute expiry
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetOtp: otp,
        resetOtpExpires: expiresAt,
      },
    });

    // Email dispatch (Resend API or Console Fallback)
    await sendPasswordResetEmail(cleanEmail, otp, user.name || undefined);

    return res.json(GENERIC_RESPONSE);
  } catch (error: any) {
    console.error('❌ Forgot password controller error:', error);
    return res.status(500).json({ error: 'Failed to process request. Please try again.' });
  }
};

export const resetPasswordCustomer = async (req: Request, res: Response) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({ error: 'Email, verification code, and new password are required.' });
    }

    const cleanEmail = String(email).trim().toLowerCase();
    const cleanOtp = String(otp).trim();

    if (cleanOtp.length !== 6 || !/^\d{6}$/.test(cleanOtp)) {
      return res.status(400).json({ error: 'Please enter the complete 6-digit verification code.' });
    }

    if (typeof newPassword !== 'string' || newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters long.' });
    }

    const user = await prisma.user.findFirst({
      where: { email: cleanEmail },
    });

    if (!user || !user.resetOtp || !user.resetOtpExpires) {
      return res.status(400).json({ error: 'Invalid or expired verification code.' });
    }

    if (user.resetOtp !== cleanOtp) {
      return res.status(400).json({ error: 'Invalid verification code. Please check your email and try again.' });
    }

    if (user.resetOtpExpires < new Date()) {
      return res.status(400).json({ error: 'Verification code has expired. Please request a new code.' });
    }

    // Hash the new password using bcrypt
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and invalidate the reset OTP
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetOtp: null,
        resetOtpExpires: null,
      },
    });

    console.log(`✅ Password reset successfully for customer: ${cleanEmail}`);

    return res.json({
      success: true,
      message: 'Password reset successful. You can now sign in with your new password.',
    });
  } catch (error: any) {
    console.error('❌ Reset password controller error:', error);
    return res.status(500).json({ error: 'Failed to reset password. Please try again.' });
  }
};

