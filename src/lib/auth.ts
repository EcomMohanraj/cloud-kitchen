import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'cloud-kitchen-super-secret-jwt-key-2026';

export interface AdminPayload {
  userId: number;
  email: string;
  role: string;
}

export function signAdminToken(payload: AdminPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyAdminToken(token: string): AdminPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AdminPayload;
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

  // In development mode, allow session access if cookie exists or bypass for local testing
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }

  return false;
}
