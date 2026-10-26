import nodemailer from 'nodemailer';

let transporter;

function getTransporter() {
  if (!process.env.SMTP_HOST) throw new Error('SMTP_HOST is not configured');
  transporter ??= nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  return transporter;
}

function send(user, subject, action, path, token, expiry) {
  const base = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');
  const url = `${base}${path}?token=${encodeURIComponent(token)}`;
  return getTransporter().sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: user.email,
    subject,
    text: `Hi ${user.username},\n\n${action} by opening this link:\n${url}\n\n`
      + `This link expires in ${expiry}. If you didn't request this, ignore this email.`,
  });
}

export function sendVerificationEmail(user, token) {
  return send(user, 'Verify your email', 'Confirm your email address', '/verify-email', token, '24 hours');
}

export function sendResetEmail(user, token) {
  return send(user, 'Reset your password', 'Reset your password', '/reset-password', token, '1 hour');
}
