import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Protect all /admin routes except /admin/login
  if (path.startsWith('/admin') && path !== '/admin/login') {
    const adminToken =
      request.cookies.get('admin_token')?.value ||
      request.cookies.get('yazhisai_admin_jwt')?.value ||
      request.cookies.get('yazhisai_admin_token')?.value;

    if (!adminToken) {
      console.log(`[MIDDLEWARE REDIRECT] Path: ${path} | adminToken missing -> redirecting to /admin/login`);
      const loginUrl = new URL('/admin/login', request.url);
      loginUrl.searchParams.set('redirect', path);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect all /rider routes except /rider/login
  if (path.startsWith('/rider') && path !== '/rider/login') {
    const riderToken = request.cookies.get('rider_token')?.value;

    if (!riderToken) {
      console.log(`[MIDDLEWARE REDIRECT] Path: ${path} | riderToken missing -> redirecting to /rider/login`);
      const loginUrl = new URL('/rider/login', request.url);
      loginUrl.searchParams.set('redirect', path);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect all /chef routes except /chef/login
  if (path.startsWith('/chef') && path !== '/chef/login') {
    const chefToken = request.cookies.get('chef_token')?.value;

    if (!chefToken) {
      console.log(`[MIDDLEWARE REDIRECT] Path: ${path} | chefToken missing -> redirecting to /chef/login`);
      const loginUrl = new URL('/chef/login', request.url);
      loginUrl.searchParams.set('redirect', path);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/rider/:path*', '/chef/:path*'],
};

