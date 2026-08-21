import { NextRequest, NextResponse } from 'next/server';
import { getUsers, getOtp, deleteOtp, addLog } from '@/lib/storage';

// POST /api/user/verify-otp
// Body: { email: string, otp: string }
// Validates the OTP, deletes it on success, logs the login event,
// and sets a user-session cookie.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, otp } = body;

  if (!email || !otp) {
    return NextResponse.json(
      { error: 'Email and OTP are required.' },
      { status: 400 }
    );
  }

  const normalizedEmail = email.toLowerCase().trim();
  const users = await getUsers();
  const user = users[normalizedEmail];

  if (!user) {
    return NextResponse.json({ error: 'Email not registered.' }, { status: 404 });
  }

  const storedOtp = await getOtp(normalizedEmail);

  if (!storedOtp) {
    return NextResponse.json(
      {
        error:
          'OTP has expired or was not found. Please request a new one.',
      },
      { status: 400 }
    );
  }

  // Upstash Redis automatically parses numeric strings into actual Numbers.
  // We must convert it back to a string before using strict inequality (!==).
  if (String(storedOtp) !== String(otp)) {
    return NextResponse.json(
      { error: 'Incorrect OTP. Please try again.' },
      { status: 400 }
    );
  }

  // ── OTP is valid ────────────────────────────────────────────────────────
  // 1. Consume the OTP (one-time use)
  await deleteOtp(normalizedEmail);

  // 2. Record the login event
  const now = new Date();
  const time = now.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
  const date = now.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  await addLog({ username: user.name, email: normalizedEmail, time, date });

  // 3. Set a short-lived session cookie for the user
  const response = NextResponse.json({ success: true });
  response.cookies.set('user_verified', normalizedEmail, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60, // 1 hour
    path: '/',
  });

  return response;
}
