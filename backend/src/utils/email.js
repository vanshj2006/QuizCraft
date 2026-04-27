import nodemailer from 'nodemailer';

const createTransporter = () => {
  const port = Number(process.env.EMAIL_PORT) || 587;
  const isGmail = (process.env.EMAIL_HOST || '').includes('gmail');

  // Gmail: use the built-in 'gmail' service config which handles OAuth/TLS correctly
  if (isGmail) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // must be a Gmail App Password, not your account password
      },
    });
  }

  // Any other SMTP provider (Mailtrap, Resend, SendGrid, etc.)
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port,
    secure: port === 465, // true for 465 (SSL), false for 587 (STARTTLS)
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    tls: {
      rejectUnauthorized: false, // allows self-signed certs in dev
    },
  });
};

const baseTemplate = (content) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background-color: #060e20; font-family: 'Segoe UI', Arial, sans-serif; padding: 40px 16px; }
    .wrapper { max-width: 520px; margin: 0 auto; }
    .card { background: #0f1829; border-radius: 20px; overflow: hidden; border: 1px solid #1e2d4a; }
    .header { background: linear-gradient(135deg, #0052cc 0%, #0066ff 60%, #0080ff 100%); padding: 36px 32px; text-align: center; }
    .logo-row { display: inline-flex; align-items: center; gap: 10px; }
    .logo-text { color: #fff; font-size: 22px; font-weight: 800; letter-spacing: -0.5px; }
    .body { padding: 36px 32px; }
    .greeting { color: #dae2fd; font-size: 16px; margin-bottom: 8px; }
    .greeting strong { color: #fff; }
    .divider { height: 1px; background: #1e2d4a; margin: 24px 0; }
    .message { color: #8fa3c8; font-size: 15px; line-height: 1.7; margin-bottom: 28px; }
    .btn-wrap { text-align: center; margin-bottom: 28px; }
    .btn { display: inline-block; background: #0066ff; color: #ffffff !important; text-decoration: none; font-weight: 700; font-size: 15px; padding: 14px 40px; border-radius: 12px; letter-spacing: 0.2px; }
    .link-box { background: #0a1628; border: 1px solid #1e2d4a; border-radius: 10px; padding: 14px 16px; margin-bottom: 24px; }
    .link-label { color: #5a7099; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 6px; }
    .link-url { color: #4d9fff; font-size: 12px; word-break: break-all; text-decoration: none; }
    .expiry { color: #5a7099; font-size: 13px; text-align: center; }
    .expiry span { color: #f59e0b; font-weight: 600; }
    .footer { padding: 20px 32px; border-top: 1px solid #1e2d4a; text-align: center; }
    .footer p { color: #3d5070; font-size: 12px; line-height: 1.6; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <div class="header">
        <div class="logo-row">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M13 2L4.5 13.5H11L10 22L20.5 9.5H14L13 2Z" fill="#ffffff" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/>
          </svg>
          <span class="logo-text">Quiz Craft</span>
        </div>
      </div>
      <div class="body">
        ${content}
      </div>
      <div class="footer">
        <p>© ${new Date().getFullYear()} Quiz Craft. All rights reserved.<br/>
        If you did not request this, you can safely ignore this email.</p>
      </div>
    </div>
  </div>
</body>
</html>`;

export const sendVerificationEmail = async (email, name, token) => {
  const verifyUrl = `${process.env.CLIENT_URL}/verify-email?token=${token}`;
  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Verify your Quiz Craft email',
    html: baseTemplate(`
      <p class="greeting">Hey <strong>${name}</strong>,</p>
      <div class="divider"></div>
      <p class="message">
        Thanks for joining Quiz Craft! Click the button below to verify your email address and fully secure your account.
      </p>
      <div class="btn-wrap">
        <a class="btn" href="${verifyUrl}">Verify Email Address</a>
      </div>
      <div class="link-box">
        <div class="link-label">Or copy this link</div>
        <a class="link-url" href="${verifyUrl}">${verifyUrl}</a>
      </div>
      <p class="expiry">This link expires in <span>24 hours</span>.</p>
    `),
  });
};

export const sendPasswordResetEmail = async (email, name, token) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${token}`;
  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Reset your Quiz Craft password',
    html: baseTemplate(`
      <p class="greeting">Hey <strong>${name}</strong>,</p>
      <div class="divider"></div>
      <p class="message">
        We received a request to reset your password. Click the button below to choose a new one.
        If you didn't request this, you can safely ignore this email.
      </p>
      <div class="btn-wrap">
        <a class="btn" href="${resetUrl}">Reset Password</a>
      </div>
      <div class="link-box">
        <div class="link-label">Or copy this link</div>
        <a class="link-url" href="${resetUrl}">${resetUrl}</a>
      </div>
      <p class="expiry">This link expires in <span>1 hour</span>.</p>
    `),
  });
};

export const sendPasswordChangedEmail = async (email, name) => {
  const resetUrl = `${process.env.CLIENT_URL}/forgot-password`;
  const transporter = createTransporter();
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: 'Your Quiz Craft password was changed',
    html: baseTemplate(`
      <p class="greeting">Hey <strong>${name}</strong>,</p>
      <div class="divider"></div>
      <p class="message">
        Your account password was successfully changed. If you made this change, no further action is needed.
      </p>
      <p class="message">
        If you did not change your password, your account may be compromised. Reset it immediately using the button below.
      </p>
      <div class="btn-wrap">
        <a class="btn" href="${resetUrl}" style="background:#dc2626;">Reset Password Now</a>
      </div>
      <p class="expiry">If this was you, you can safely ignore this email.</p>
    `),
  });
};