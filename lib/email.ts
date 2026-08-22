/**
 * lib/email.ts
 *
 * Sends OTP emails via Gmail SMTP using Nodemailer.
 *
 * ✅ Works on Vercel serverless (Next.js API routes).
 * ✅ Uses Gmail App Password – no OAuth needed.
 * ✅ Port 465 with SSL for maximum reliability.
 *
 * Credentials are read from environment variables:
 *   GMAIL_USER            – e.g. arijitp203@gmail.com
 *   GMAIL_APP_PASSWORD    – 16-char app password (spaces are stripped automatically)
 */

import nodemailer from 'nodemailer';

// Lazily-created transporter – reused across invocations in the same warm instance
let _transporter: nodemailer.Transporter | null = null;

function getTransporter() {
  if (_transporter) return _transporter;

  // Strip spaces from App Password (Google displays it in groups of 4)
  const appPass = (process.env.GMAIL_APP_PASSWORD ?? '').replace(/\s+/g, '');

  _transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // SSL – most reliable on serverless
    auth: {
      user: process.env.GMAIL_USER,
      pass: appPass,
    },
  });

  return _transporter;
}

/**
 * Sends a branded OTP email to the user.
 *
 * @param to    Recipient email address
 * @param name  Recipient's display name (from the users database)
 * @param otp   3-digit one-time password string
 */
export async function sendOtpEmail(
  to: string,
  name: string,
  otp: string
): Promise<void> {
  const transporter = getTransporter();
  const domain = process.env.GMAIL_USER?.split('@')[1] || 'gmail.com';
  const messageId = `<${Date.now()}-${Math.random().toString(36).substring(2)}@${domain}>`;

  await transporter.sendMail({
    from: `"Security Portal" <${process.env.GMAIL_USER}>`,
    replyTo: process.env.GMAIL_USER,
    to,
    subject: `Your OTP is ${otp} - Security Portal`,
    messageId: messageId,
    headers: {
      'X-Priority': '1 (Highest)',
      'X-Mailer': 'Nodemailer',
    },
    // Plain-text fallback
    text: `Hello ${name},\n\nYour One-Time Password for Security Portal is: ${otp}\n\nThis OTP is valid for 10 minutes.\n\nIf you did not request this, please ignore this email.`,
    // HTML email
    html: `
      <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
        <div style="background-color: #1e3a8a; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 600;">Security Portal</h1>
        </div>
        <div style="padding: 32px;">
          <p style="color: #374151; font-size: 16px; margin-top: 0;">Hi <strong>${name}</strong>,</p>
          <p style="color: #4b5563; font-size: 15px; line-height: 1.5;">We received a request to log in to your account. Your One-Time Password (OTP) is below:</p>
          
          <div style="background-color: #f3f4f6; padding: 24px; margin: 32px 0; border-radius: 8px; text-align: center; border: 1px dashed #cbd5e1;">
            <span style="font-size: 36px; font-weight: 700; letter-spacing: 12px; color: #1e40af; font-family: monospace;">${otp}</span>
          </div>
          
          <p style="color: #4b5563; font-size: 14px; margin-bottom: 8px;">⏱️ This code is valid for <strong>10 minutes</strong>.</p>
          <p style="color: #ef4444; font-size: 14px; margin-top: 0;">If you didn't request this code, you can safely ignore this email.</p>
        </div>
        <div style="background-color: #f9fafb; padding: 16px; text-align: center; border-top: 1px solid #e5e7eb;">
          <p style="color: #9ca3af; font-size: 12px; margin: 0;">&copy; ${new Date().getFullYear()} Security Portal. All rights reserved.</p>
        </div>
      </div>
    `,
  });
}
