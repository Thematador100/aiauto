import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

/**
 * Email configuration for sending inspection reports
 * Priority order:
 * 1. Mailgun HTTP API (MAILGUN_API_KEY + MAILGUN_DOMAIN)
 * 2. Gmail (EMAIL_SERVICE=gmail)
 * 3. SendGrid (EMAIL_SERVICE=sendgrid)
 * 4. Mailgun SMTP (EMAIL_SERVICE=mailgun + MAILGUN_USER + MAILGUN_PASSWORD)
 * 5. Custom SMTP (SMTP_HOST)
 * 6. Ethereal test mode (fallback)
 */

let transporter = null;
let useMailgunApi = false;

// ── 1. Mailgun HTTP API (preferred — uses API key directly) ──────────────────
if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_DOMAIN) {
  useMailgunApi = true;
  console.log(`✅ Email configured: Mailgun HTTP API (domain: ${process.env.MAILGUN_DOMAIN})`);

// ── 2. Gmail ─────────────────────────────────────────────────────────────────
} else if (process.env.EMAIL_SERVICE === 'gmail') {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  console.log('✅ Email configured: Gmail');

// ── 3. SendGrid ───────────────────────────────────────────────────────────────
} else if (process.env.EMAIL_SERVICE === 'sendgrid') {
  transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    auth: {
      user: 'apikey',
      pass: process.env.SENDGRID_API_KEY
    }
  });
  console.log('✅ Email configured: SendGrid');

// ── 4. Mailgun SMTP ───────────────────────────────────────────────────────────
} else if (process.env.EMAIL_SERVICE === 'mailgun') {
  transporter = nodemailer.createTransport({
    host: 'smtp.mailgun.org',
    port: 587,
    auth: {
      user: process.env.MAILGUN_USER,
      pass: process.env.MAILGUN_PASSWORD
    }
  });
  console.log('✅ Email configured: Mailgun SMTP');

// ── 5. Custom SMTP ────────────────────────────────────────────────────────────
} else if (process.env.SMTP_HOST) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
  console.log(`✅ Email configured: Custom SMTP (${process.env.SMTP_HOST})`);

// ── 6. Ethereal fallback ──────────────────────────────────────────────────────
} else {
  console.warn('⚠️  No email service configured. Using Ethereal (test mode — emails will NOT be delivered)');
}

/**
 * Send email via Mailgun HTTP API
 */
const sendViaMailgunApi = async (options) => {
  const apiKey = process.env.MAILGUN_API_KEY;
  const domain = process.env.MAILGUN_DOMAIN;
  const fromEmail = process.env.FROM_EMAIL || `noreply@${domain}`;
  const fromName = process.env.FROM_NAME || 'AI Auto Pro';

  const formData = new URLSearchParams();
  formData.append('from', `${fromName} <${fromEmail}>`);
  formData.append('to', options.to);
  formData.append('subject', options.subject);
  if (options.text) formData.append('text', options.text);
  if (options.html) formData.append('html', options.html);

  // Determine Mailgun API base URL (US vs EU)
  const baseUrl = domain.includes('.eu') 
    ? `https://api.eu.mailgun.net/v3/${domain}/messages`
    : `https://api.mailgun.net/v3/${domain}/messages`;

  const credentials = Buffer.from(`api:${apiKey}`).toString('base64');

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: formData.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Mailgun API error ${response.status}: ${errorText}`);
  }

  const result = await response.json();
  console.log(`[Email] Mailgun sent: ${result.id}`);
  return { success: true, messageId: result.id };
};

/**
 * Send an email
 */
export const sendEmail = async (options) => {
  const fromEmail = process.env.FROM_EMAIL || 'noreply@aiautopro.com';
  const fromName = process.env.FROM_NAME || 'AI Auto Pro';

  try {
    // Use Mailgun HTTP API if configured
    if (useMailgunApi) {
      return await sendViaMailgunApi(options);
    }

    // Use nodemailer transporter
    if (!transporter) {
      // Create Ethereal test account on demand
      const testAccount = await nodemailer.createTestAccount();
      transporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
      console.warn('[Email] Using Ethereal test account — emails will NOT be delivered to real inboxes');
    }

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html,
      attachments: options.attachments || []
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] Message sent: ${info.messageId}`);
    if (nodemailer.getTestMessageUrl(info)) {
      console.log(`[Email] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }
    return { success: true, messageId: info.messageId, preview: nodemailer.getTestMessageUrl(info) };

  } catch (error) {
    console.error('[Email] Error sending email:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
};

/**
 * Generate email template for inspection report
 */
export const generateReportEmailHTML = (report, recipientName, customMessage) => {
  const vehicleInfo = `${report.vehicle.year} ${report.vehicle.make} ${report.vehicle.model}`;
  const date = new Date(report.date).toLocaleDateString();
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%); color: white; padding: 30px 20px; text-align: center; border-radius: 8px 8px 0 0; }
    .header h1 { margin: 0 0 8px; font-size: 24px; }
    .header p { margin: 0; opacity: 0.85; font-size: 16px; }
    .content { background: #f9f9f9; padding: 30px 20px; border: 1px solid #ddd; }
    .info-box { background: white; padding: 15px; margin: 15px 0; border-left: 4px solid #3498db; border-radius: 4px; }
    .info-box strong { color: #2980b9; }
    .findings { background: white; padding: 15px; margin: 15px 0; border-radius: 4px; border: 1px solid #eee; }
    .findings ul { margin: 10px 0; padding-left: 20px; }
    .findings li { margin: 5px 0; }
    .recalls { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; margin: 15px 0; border-radius: 4px; }
    .recalls h3 { color: #856404; margin-top: 0; }
    .footer { background: #1a1a2e; color: #aaa; padding: 20px; text-align: center; font-size: 0.85em; border-radius: 0 0 8px 8px; }
    .footer strong { color: white; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🔍 Vehicle Inspection Report</h1>
    <p>${vehicleInfo}</p>
  </div>
  <div class="content">
    <p>Dear ${recipientName},</p>
    ${customMessage ? `<p>${customMessage}</p>` : ''}
    <p>Your vehicle inspection has been completed. Here is a summary of the findings.</p>
    <div class="info-box">
      <strong>Vehicle:</strong> ${vehicleInfo}<br>
      <strong>VIN:</strong> ${report.vehicle.vin || 'N/A'}<br>
      <strong>Inspection Date:</strong> ${date}<br>
      <strong>Report ID:</strong> ${report.id}
    </div>
    ${report.summary ? `
    <div class="findings">
      <h3>Overall Condition:</h3>
      <p>${report.summary.overallCondition || 'See attached report'}</p>
      ${report.summary.keyFindings && report.summary.keyFindings.length > 0 ? `
        <h3>Key Findings:</h3>
        <ul>${report.summary.keyFindings.map(f => `<li>${f}</li>`).join('')}</ul>
      ` : ''}
      ${report.summary.recommendations && report.summary.recommendations.length > 0 ? `
        <h3>Recommendations:</h3>
        <ul>${report.summary.recommendations.map(r => `<li>${r}</li>`).join('')}</ul>
      ` : ''}
    </div>
    ` : ''}
    ${report.safetyRecalls && report.safetyRecalls.length > 0 ? `
      <div class="recalls">
        <h3>⚠️ Open Safety Recalls (${report.safetyRecalls.length})</h3>
        <ul>${report.safetyRecalls.map(r => `<li><strong>${r.component}:</strong> ${r.summary}</li>`).join('')}</ul>
        <p><em>Contact your local dealer to schedule free recall repairs.</em></p>
      </div>
    ` : `
      <div class="info-box">✅ <strong>No open safety recalls</strong> found for this vehicle.</div>
    `}
    <p>If you have any questions about this report, please contact your inspector directly.</p>
    <p>Best regards,<br><strong>AI Auto Pro Inspection Team</strong></p>
  </div>
  <div class="footer">
    <strong>AI Auto Pro</strong> — Professional Vehicle Inspections Powered by AI<br>
    <span style="font-size:0.8em;">This is an automated message. Please do not reply directly.</span>
  </div>
</body>
</html>`;
};

export default { sendEmail, generateReportEmailHTML };
