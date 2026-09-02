import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Protect all /admin routes except /admin/login
  if (path.startsWith('/admin') && path !== '/admin/login') {
    const adminToken = request.cookies.get('yazhisai_admin_token')?.value;
    const sessionCookie =
      request.cookies.get('sb-access-token')?.value ||
      request.cookies.get('supabase-auth-token')?.value ||
      request.cookies.get('yazhisai_customer')?.value;

    // Allow access if admin token or session cookie exists
    if (!adminToken && !sessionCookie) {
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', path);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
