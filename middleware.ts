import { NextRequest, NextResponse } from 'next/server';

/**
 * Route protection middleware.
 *
 * /admin/dashboard  → requires admin_auth=1 cookie  → else redirect /admin/login
 * /user/success     → requires user_verified cookie  → else redirect /user/login
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect admin dashboard
  if (pathname.startsWith('/admin/dashboard')) {
    const adminAuth = req.cookies.get('admin_auth')?.value;
    if (adminAuth !== '1') {
      const loginUrl = new URL('/admin/login', req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect user success page
  if (pathname.startsWith('/user/success')) {
    const userVerified = req.cookies.get('user_verified')?.value;
    if (!userVerified) {
      const loginUrl = new URL('/user/login', req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/dashboard/:path*', '/user/success/:path*'],
};
