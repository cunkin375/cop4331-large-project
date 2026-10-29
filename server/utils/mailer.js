async function send(user, subject, action, path, token, expiry) {
  const base = (process.env.CLIENT_URL || 'http://localhost:5173').replace(/\/+$/, '');
  const url = `${base}${path}?token=${encodeURIComponent(token)}`;
  const key = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN || process.env.SMTP_USER?.split('@')[1];
  const from = process.env.MAIL_FROM || process.env.SMTP_USER;
  if (!key) throw new Error('MAILGUN_API_KEY is not configured');
  if (!domain) throw new Error('MAILGUN_DOMAIN is not configured');
  if (!from) throw new Error('MAIL_FROM is not configured');
  const api = process.env.MAILGUN_API_URL || 'https://api.mailgun.net';
  if (!['https://api.mailgun.net', 'https://api.eu.mailgun.net'].includes(api)) {
    throw new Error('MAILGUN_API_URL must be a Mailgun HTTPS endpoint');
  }
  const fields = {
    from,
    to: user.email,
    subject,
    text: `Hi ${user.username},\n\n${action} by opening this link:\n${url}\n\n`
      + `This link expires in ${expiry}. If you didn't request this, ignore this email.`,
  };
  const body = new FormData();
  for (const [name, value] of Object.entries(fields)) body.set(name, value);
  const response = await fetch(`${api}/v3/${encodeURIComponent(domain)}/messages`, {
    method: 'POST',
    headers: { Authorization: `Basic ${Buffer.from(`api:${key}`).toString('base64')}` },
    body,
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) {
    // Do not include provider responses, tokens, or credentials in errors.
    const error = new Error(`Mailgun request failed (HTTP ${response.status})`);
    error.name = `MailgunHTTP${response.status}Error`;
    throw error;
  }
  return response.json();
}

export function sendVerificationEmail(user, token) {
  return send(user, 'Verify your email', 'Confirm your email address', '/verify-email', token, '24 hours');
}

export function sendResetEmail(user, token) {
  return send(user, 'Reset your password', 'Reset your password', '/reset-password', token, '1 hour');
}
