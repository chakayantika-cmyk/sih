import { NextRequest, NextResponse } from 'next/server';

const ADMIN_NAME = 'adminSIH';
const ADMIN_PASSWORD = 'admin';

// POST /api/admin/login – Verify credentials and set session cookie
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { name, password } = body;

  if (name === ADMIN_NAME && password === ADMIN_PASSWORD) {
    const response = NextResponse.json({ success: true });
    response.cookies.set('admin_auth', '1', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/',
    });
    return response;
  }

  return NextResponse.json(
    { error: 'Invalid credentials. Check your name and password.' },
    { status: 401 }
  );
}

// DELETE /api/admin/login – Logout (clear session cookie)
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.set('admin_auth', '', {
    httpOnly: true,
    maxAge: 0,
    path: '/',
  });
  return response;
}
