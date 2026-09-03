import jwt from 'jsonwebtoken';

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('FATAL SECURITY ERROR: JWT_SECRET environment variable is missing.');
  }
  return secret;
}

export interface AdminPayload {
  userId: number;
  email: string;
  role: string;
}

export function signAdminToken(payload: AdminPayload): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: '7d' });
}

export function verifyAdminToken(token: string): AdminPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as AdminPayload;
    if (decoded && decoded.role === 'ADMIN') {
      return decoded;
    }
    return null;
  } catch (error) {
    return null;
  }
}

export function verifyAdminFromRequest(req: Request): boolean {
  const authHeader = req.headers.get('authorization') || '';
  const cookieHeader = req.headers.get('cookie') || '';
  const xToken = req.headers.get('x-admin-token') || '';

  let token = authHeader.replace('Bearer ', '').trim();

  if (!token && cookieHeader) {
    const match = cookieHeader.match(/admin_token=([^;]+)/);
    if (match) token = match[1];
  }

  if (!token && xToken) {
    token = xToken;
  }

  if (token && verifyAdminToken(token)) {
    return true;
  }

  return false;
}
