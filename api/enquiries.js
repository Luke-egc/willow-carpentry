import { Resend } from 'resend';
import { createClient } from '@supabase/supabase-js';

const resend = new Resend(process.env.RESEND_API_KEY);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── Helpers ──────────────────────────────────────────────────────────────────

function sanitise(str) {
  if (typeof str !== 'string') return '';
  return str.trim().slice(0, 2000);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const SERVICE_LABELS = {
  deck: 'Deck Building',
  pergola: 'Pergola / Outdoor Living',
  renovation: 'Renovation',
  multiple: 'Multiple Services',
  other: 'Other Carpentry',
};

// ── Email HTML ────────────────────────────────────────────────────────────────

function buildEmailHtml({ fname, lname, phone, email, suburb, service, message, submittedAt }) {
  const serviceLabel = SERVICE_LABELS[service] || service;
  const row = (label, value) =>
    value
      ? `<tr>
          <td style="padding:10px 16px;font-size:13px;color:#6b7280;font-weight:600;white-space:nowrap;vertical-align:top;width:130px;">${label}</td>
          <td style="padding:10px 16px;font-size:14px;color:#111827;vertical-align:top;border-left:1px solid #e5e7eb;">${value}</td>
         </tr>`
      : '';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>New Quote Request — Willow Carpentry</title>
</head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px;">
    <tr><td align="center">
      <table width="100%" cellpadding="0" cellspacing="0" style="max-width:580px;">

        <!-- Header -->
        <tr><td style="background:#1c1f24;border-radius:12px 12px 0 0;padding:28px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <p style="margin:0 0 4px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#e05c1a;">Willow Carpentry &amp; Construction</p>
                <h1 style="margin:0;font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">New Quote Request</h1>
              </td>
              <td align="right">
                <span style="display:inline-block;background:#e05c1a;color:#fff;font-size:12px;font-weight:700;padding:6px 14px;border-radius:20px;">ACTION REQUIRED</span>
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- Sub-header -->
        <tr><td style="background:#e05c1a;padding:12px 32px;">
          <p style="margin:0;font-size:13px;color:#fff;font-weight:500;">
            Submitted ${submittedAt} &nbsp;·&nbsp; Respond within 24 hours
          </p>
        </td></tr>

        <!-- Body -->
        <tr><td style="background:#ffffff;border-radius:0 0 12px 12px;padding:32px;">

          <!-- Contact details table -->
          <p style="margin:0 0 12px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9ca3af;">Contact Details</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:8px;border-collapse:collapse;overflow:hidden;">
            <tbody>
              ${row('Name', `${fname} ${lname}`)}
              ${row('Phone', `<a href="tel:${phone.replace(/\s/g, '')}" style="color:#e05c1a;text-decoration:none;font-weight:600;">${phone}</a>`)}
              ${email ? row('Email', `<a href="mailto:${email}" style="color:#e05c1a;text-decoration:none;">${email}</a>`) : ''}
              ${row('Suburb', suburb)}
              ${row('Service', `<span style="display:inline-block;background:#fef3eb;color:#c2410c;font-size:12px;font-weight:700;padding:3px 10px;border-radius:12px;">${serviceLabel}</span>`)}
            </tbody>
          </table>

          <!-- Message -->
          ${message ? `
          <p style="margin:24px 0 12px;font-size:11px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#9ca3af;">Project Details</p>
          <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:8px;padding:16px 20px;">
            <p style="margin:0;font-size:14px;color:#374151;line-height:1.7;">${message.replace(/\n/g, '<br/>')}</p>
          </div>` : ''}

          <!-- CTA buttons -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:28px;">
            <tr>
              <td style="padding-right:8px;">
                <a href="tel:${phone.replace(/\s/g, '')}" style="display:block;text-align:center;background:#e05c1a;color:#fff;font-size:14px;font-weight:700;padding:14px 20px;border-radius:8px;text-decoration:none;">
                  📞 Call ${fname}
                </a>
              </td>
              ${email ? `<td style="padding-left:8px;">
                <a href="mailto:${email}" style="display:block;text-align:center;background:#1c1f24;color:#fff;font-size:14px;font-weight:700;padding:14px 20px;border-radius:8px;text-decoration:none;">
                  ✉️ Email ${fname}
                </a>
              </td>` : ''}
            </tr>
          </table>

        </td></tr>

        <!-- Footer -->
        <tr><td style="padding:20px 0 0;text-align:center;">
          <p style="margin:0;font-size:12px;color:#9ca3af;">Willow Carpentry &amp; Construction &nbsp;·&nbsp; Canberra, ACT &nbsp;·&nbsp; ABN 17 338 760 337</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Handler ───────────────────────────────────────────────────────────────────

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Parse & validate ────────────────────────────────────────────────────────
  const {
    fname: rawFname,
    lname: rawLname,
    phone: rawPhone,
    email: rawEmail,
    suburb: rawSuburb,
    service: rawService,
    message: rawMessage,
  } = req.body || {};

  const fname   = sanitise(rawFname);
  const lname   = sanitise(rawLname);
  const phone   = sanitise(rawPhone);
  const email   = sanitise(rawEmail);
  const suburb  = sanitise(rawSuburb);
  const service = sanitise(rawService);
  const message = sanitise(rawMessage);

  const errors = [];
  if (!fname)   errors.push('First name is required.');
  if (!lname)   errors.push('Last name is required.');
  if (!phone)   errors.push('Phone number is required.');
  if (!suburb)  errors.push('Suburb is required.');
  if (!service) errors.push('Service selection is required.');
  if (email && !isValidEmail(email)) errors.push('Email address is invalid.');

  if (errors.length) {
    return res.status(400).json({ error: errors.join(' ') });
  }

  const submittedAt = new Date().toLocaleString('en-AU', {
    timeZone: 'Australia/Sydney',
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  // ── Save to Supabase ────────────────────────────────────────────────────────
  try {
    const { error: dbError } = await supabase
      .from('enquiries')
      .insert([{ fname, lname, phone, email: email || null, suburb, service, message: message || null }]);

    if (dbError) {
      console.error('Supabase insert error:', dbError);
      // Don't fail the whole request — still send the email
    }
  } catch (err) {
    console.error('Supabase unexpected error:', err);
  }

  // ── Send email via Resend ───────────────────────────────────────────────────
  const subject = `New Quote Request — ${fname} ${lname} (${SERVICE_LABELS[service] || service})`;
  const htmlBody = buildEmailHtml({ fname, lname, phone, email, suburb, service, message, submittedAt });

  const recipients = [
    process.env.ENQUIRY_TO_CLIENT,
    process.env.ENQUIRY_TO_AGENCY,
  ].filter(Boolean);

  try {
    await resend.emails.send({
      from: process.env.ENQUIRY_FROM_EMAIL,
      to: recipients,
      reply_to: email || undefined,
      subject,
      html: htmlBody,
    });
  } catch (err) {
    console.error('Resend error:', err);
    return res.status(500).json({ error: 'Failed to send notification email. Please call us directly on 0434 459 704.' });
  }

  return res.status(200).json({ success: true });
}
