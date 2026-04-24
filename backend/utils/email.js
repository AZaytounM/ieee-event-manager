require('dotenv').config();
const nodemailer = require('nodemailer');

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

function buildEmailHTML(participant, event) {
  const eventDate = event.date ? new Date(event.date).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  }) : 'TBD';

  const customBody = event.email_body
    ? event.email_body.replace('{name}', participant.full_name).replace('{event}', event.name)
    : `We are pleased to confirm your registration for <strong>${event.name}</strong>. Please present your unique QR code at the entrance.`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0;padding:0;background-color:#f4f7fb;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7fb;padding:40px 20px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

<!-- Header -->
<tr><td style="background:linear-gradient(135deg,#003865 0%,#00629B 50%,#0085CA 100%);border-radius:12px 12px 0 0;padding:40px 40px 30px;text-align:center;">
  <div style="display:inline-block;background:rgba(255,255,255,0.15);border:1px solid rgba(255,255,255,0.3);border-radius:6px;padding:8px 20px;margin-bottom:16px;">
    <span style="color:#ffffff;font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:600;">IEEE</span>
  </div>
  <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">${event.name}</h1>
  ${event.date ? `<p style="color:rgba(255,255,255,0.8);margin:10px 0 0;font-size:14px;">${eventDate}</p>` : ''}
  ${event.location ? `<p style="color:rgba(255,255,255,0.7);margin:6px 0 0;font-size:13px;">📍 ${event.location}</p>` : ''}
</td></tr>

<!-- Body -->
<tr><td style="background:#ffffff;padding:40px;">
  <p style="color:#1a3a5c;font-size:22px;font-weight:600;margin:0 0 8px;">Hello, ${participant.full_name}! 👋</p>
  <div style="width:50px;height:3px;background:linear-gradient(90deg,#00629B,#0085CA);border-radius:2px;margin-bottom:24px;"></div>
  <p style="color:#444;font-size:15px;line-height:1.7;margin:0 0 24px;">${customBody}</p>

  <!-- QR Code notice -->
  <div style="background:linear-gradient(135deg,#f8fafc,#eef4ff);border:2px solid #00629B;border-radius:12px;padding:32px;text-align:center;margin:32px 0;">
    <p style="color:#00629B;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;margin:0 0 16px;">Your Personal QR Code</p>
    <div style="font-size:64px;margin:16px 0;">📎</div>
    <p style="color:#1a3a5c;font-size:16px;font-weight:600;margin:0 0 8px;">Your QR code is attached to this email</p>
    <p style="color:#666;font-size:13px;margin:0;line-height:1.6;">Open the attached image file named<br><strong>qr-${participant.full_name.replace(/\s+/g, '-')}.png</strong><br>and present it at the event entrance for check-in</p>
  </div>

  <!-- Info -->
  <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
    <tr>
      <td width="50%" style="padding:0 8px 0 0;">
        <div style="background:#f8fafc;border-left:3px solid #00629B;border-radius:0 8px 8px 0;padding:16px;">
          <p style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Attendee</p>
          <p style="color:#1a3a5c;font-size:14px;font-weight:600;margin:0;">${participant.full_name}</p>
        </div>
      </td>
      <td width="50%" style="padding:0 0 0 8px;">
        <div style="background:#f8fafc;border-left:3px solid #0085CA;border-radius:0 8px 8px 0;padding:16px;">
          <p style="color:#888;font-size:11px;text-transform:uppercase;letter-spacing:1px;margin:0 0 4px;">Email</p>
          <p style="color:#1a3a5c;font-size:14px;font-weight:600;margin:0;word-break:break-all;">${participant.email}</p>
        </div>
      </td>
    </tr>
  </table>

  <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:8px;padding:16px;margin:24px 0;">
    <p style="color:#f57c00;font-size:13px;margin:0;"><strong>⚠️ Important:</strong> This QR code is unique to you. Please do not share it with others. Save this email for your records.</p>
  </div>
</td></tr>

<!-- Footer -->
<tr><td style="background:linear-gradient(135deg,#003865,#00629B);border-radius:0 0 12px 12px;padding:28px 40px;text-align:center;">
  <p style="color:rgba(255,255,255,0.7);font-size:12px;margin:0 0 8px;">Institute of Electrical and Electronics Engineers</p>
  <p style="color:rgba(255,255,255,0.5);font-size:11px;margin:0;line-height:1.6;">
    This is an automated message. Please do not reply to this email.
  </p>
</td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

async function sendQREmail(participant, event, qrBase64) {
  const transporter = createTransporter();
  const subject = (event.email_subject || 'Your QR Code for {event}').replace('{event}', event.name);

  // Convert base64 data URL to buffer
  const base64Data = qrBase64.replace(/^data:image\/png;base64,/, '');
  const qrBuffer = Buffer.from(base64Data, 'base64');

  await transporter.sendMail({
    from: `"${process.env.EMAIL_FROM_NAME || 'IEEE Event Manager'}" <${process.env.SMTP_USER}>`,
    to: participant.email,
    subject,
    html: buildEmailHTML(participant, event),
    attachments: [{
      filename: `qr-${participant.full_name.replace(/\s+/g, '-')}.png`,
      content: qrBuffer,
      contentType: 'image/png'
    }]
  });
}

async function sendBulkEmails(participants, event, onProgress) {
  const results = { sent: 0, failed: 0, errors: [] };
  const { generateQRCodeBase64 } = require('./qrcode');

  for (let i = 0; i < participants.length; i++) {
    const p = participants[i];
    try {
      const qrBase64 = await generateQRCodeBase64(p.qr_token);
      await sendQREmail(p, event, qrBase64);
      results.sent++;
      if (onProgress) onProgress(i + 1, participants.length, p.email, null);
    } catch (err) {
      results.failed++;
      results.errors.push({ email: p.email, error: err.message });
      if (onProgress) onProgress(i + 1, participants.length, p.email, err.message);
    }
    if (i < participants.length - 1) await new Promise(r => setTimeout(r, 300));
  }

  return results;
}

module.exports = { sendQREmail, sendBulkEmails, buildEmailHTML };