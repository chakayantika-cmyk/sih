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
    html: `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background-color:#0f172a;font-family:Arial,Helvetica,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background-color:#0f172a;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="500" cellpadding="0" cellspacing="0" role="presentation"
               style="background-color:#1e293b;border-radius:16px;overflow:hidden;
                      border:1px solid #334155;">

          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#1d4ed8,#2563eb);
                        padding:28px 32px;text-align:center;">
              <p style="margin:0;font-size:28px;">🔐</p>
              <h1 style="margin:8px 0 0;color:#ffffff;font-size:20px;
                          font-weight:700;letter-spacing:0.5px;">
                Security Portal
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px;">
              <p style="margin:0 0 8px;color:#94a3b8;font-size:15px;">
                Hello, <strong style="color:#f1f5f9;">${name}</strong>
              </p>
              <p style="margin:0 0 28px;color:#94a3b8;font-size:15px;">
                Here is your One-Time Password to log in:
              </p>

              <!-- OTP Box -->
              <div style="background:#0f172a;border:2px solid #3b82f6;
                           border-radius:12px;padding:24px;text-align:center;
                           margin-bottom:28px;">
                <span style="font-size:56px;font-weight:800;color:#60a5fa;
                              letter-spacing:20px;font-family:'Courier New',monospace;">
                  ${otp}
                </span>
              </div>

              <p style="margin:0;color:#64748b;font-size:13px;text-align:center;">
                ⏱ This OTP expires in <strong style="color:#94a3b8;">10 minutes</strong>.
                Do not share it with anyone.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px;border-top:1px solid #334155;text-align:center;">
              <p style="margin:0;color:#475569;font-size:12px;">
                If you didn't request this OTP, you can safely ignore this email.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });
}
