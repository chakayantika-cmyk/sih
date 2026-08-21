import { NextRequest, NextResponse } from 'next/server';
import { getUsers, setOtp } from '@/lib/storage';
import { sendOtpEmail } from '@/lib/email';

// POST /api/user/request-otp
// Body: { email: string }
// Checks if email is registered, generates a 3-digit OTP, stores it
// with a 10-minute TTL, and sends the OTP via Gmail.
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email } = body;

  if (!email || typeof email !== 'string') {
    return NextResponse.json({ error: 'Email is required.' }, { status: 400 });
  }

  const normalizedEmail = email.toLowerCase().trim();
  const users = await getUsers();
  const user = users[normalizedEmail];

  // Only registered users can receive an OTP
  if (!user) {
    return NextResponse.json(
      { error: 'This email is not registered on our platform. Please contact the admin.' },
      { status: 404 }
    );
  }

  // Generate a 3-digit OTP (100–999)
  const otp = String(Math.floor(100 + Math.random() * 900));

  // Persist OTP with 10-minute TTL
  await setOtp(normalizedEmail, otp);

  // Send the OTP email
  try {
    await sendOtpEmail(normalizedEmail, user.name, otp);
  } catch (err) {
    console.error('[OTP Email Error]', err);
    return NextResponse.json(
      { error: 'Failed to send OTP email. Please try again in a moment.' },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    message: `OTP sent successfully to ${normalizedEmail}. Please check your inbox (valid for 10 minutes).`,
  });
}
