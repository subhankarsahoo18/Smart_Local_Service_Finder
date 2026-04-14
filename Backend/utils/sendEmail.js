const nodemailer = require('nodemailer');

/**
 * Unified email sender.
 * Strategy 1: Brevo HTTP API (production — uses HTTPS port 443, NEVER blocked)
 * Strategy 2: Nodemailer SMTP fallback (works locally with Gmail)
 *
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.toName - Recipient name
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text body
 * @param {string} options.html - HTML body
 * @returns {Promise<boolean>} true if sent, false if all methods failed
 */
async function sendEmail({ to, toName, subject, text, html }) {

  // ── Strategy 1: Brevo HTTP API (recommended for production) ─────────────
  if (process.env.BREVO_API_KEY) {
    try {
      const senderEmail = process.env.BREVO_SENDER_EMAIL || process.env.EMAIL_USER;
      console.log(`[Email] Attempting Brevo HTTP API to ${to}...`);

      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'accept': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'SmartLocal', email: senderEmail },
          to: [{ email: to, name: toName || to }],
          subject,
          htmlContent: html || `<pre>${text}</pre>`,
          textContent: text,
        }),
      });

      if (!response.ok) {
        const errBody = await response.text();
        throw new Error(`Brevo API ${response.status}: ${errBody}`);
      }

      console.log(`[Email] ✅ Sent via Brevo to ${to}`);
      return true;
    } catch (err) {
      console.error(`[Email] ❌ Brevo failed for ${to}:`, err.message);
      // Fall through to SMTP fallback
    }
  }

  // ── Strategy 2: Nodemailer SMTP (local dev / fallback) ──────────────────
  try {
    const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
    const smtpPort = parseInt(process.env.SMTP_PORT || '465', 10);
    console.log(`[Email] Attempting SMTP to ${to} via ${smtpHost}:${smtpPort}...`);

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
      connectionTimeout: 15000,
      greetingTimeout: 10000,
      socketTimeout: 15000,
      tls: { rejectUnauthorized: false },
    });

    await transporter.sendMail({
      from: `"SmartLocal ⚡" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      text,
      html,
    });

    console.log(`[Email] ✅ Sent via SMTP to ${to}`);
    return true;
  } catch (err) {
    console.error(`[Email] ❌ SMTP also failed for ${to}:`, err.message);
    return false;
  }
}

module.exports = sendEmail;
