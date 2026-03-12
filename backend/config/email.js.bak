import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Email configuration for sending inspection reports
 * Supports multiple email providers:
 * - Gmail
 * - SendGrid
 * - Mailgun
 * - Any SMTP server
 */

// Create email transporter
let transporter = null;

// Determine which email service to use based on environment variables
if (process.env.EMAIL_SERVICE === 'gmail') {
  // Gmail configuration
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD // Use App Password for Gmail
    }
  });
  console.log('✅ Email configured: Gmail');

} else if (process.env.EMAIL_SERVICE === 'sendgrid') {
  // SendGrid configuration
  transporter = nodemailer.createTransport({
    host: 'smtp.sendgrid.net',
    port: 587,
    auth: {
      user: 'apikey',
      pass: process.env.SENDGRID_API_KEY
    }
  });
  console.log('✅ Email configured: SendGrid');

} else if (process.env.EMAIL_SERVICE === 'mailgun') {
  // Mailgun configuration
  transporter = nodemailer.createTransport({
    host: 'smtp.mailgun.org',
    port: 587,
    auth: {
      user: process.env.MAILGUN_USER,
      pass: process.env.MAILGUN_PASSWORD
    }
  });
  console.log('✅ Email configured: Mailgun');

} else if (process.env.SMTP_HOST) {
  // Custom SMTP configuration
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASSWORD
    }
  });
  console.log(`✅ Email configured: Custom SMTP (${process.env.SMTP_HOST})`);

} else {
  // No email service configured - use ethereal.email for testing
  console.warn('⚠️  No email service configured. Using Ethereal (test mode)');
}

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.html - HTML content
 * @param {string} options.text - Plain text content
 * @param {Array} options.attachments - Email attachments
 */
export const sendEmail = async (options) => {
  if (!transporter) {
    // Create test account if no transporter configured
    const testAccount = await nodemailer.createTestAccount();
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
  }

  const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER || 'noreply@autoai.com';
  const fromName = process.env.EMAIL_FROM_NAME || 'AI Auto Pro';

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
    attachments: options.attachments || []
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[Email] Message sent: ${info.messageId}`);

    // If using Ethereal, log preview URL
    if (process.env.EMAIL_SERVICE === undefined && !process.env.SMTP_HOST) {
      console.log(`[Email] Preview URL: ${nodemailer.getTestMessageUrl(info)}`);
    }

    return {
      success: true,
      messageId: info.messageId,
      preview: nodemailer.getTestMessageUrl(info)
    };
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
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #2980b9 0%, #3498db 100%);
      color: white;
      padding: 30px 20px;
      text-align: center;
      border-radius: 8px 8px 0 0;
    }
    .content {
      background: #f9f9f9;
      padding: 30px 20px;
      border: 1px solid #ddd;
    }
    .info-box {
      background: white;
      padding: 15px;
      margin: 15px 0;
      border-left: 4px solid #3498db;
      border-radius: 4px;
    }
    .info-box strong {
      color: #2980b9;
    }
    .findings {
      background: white;
      padding: 15px;
      margin: 15px 0;
      border-radius: 4px;
    }
    .findings ul {
      margin: 10px 0;
      padding-left: 20px;
    }
    .findings li {
      margin: 5px 0;
    }
    .recalls {
      background: #fff3cd;
      border: 1px solid #ffc107;
      padding: 15px;
      margin: 15px 0;
      border-radius: 4px;
    }
    .recalls h3 {
      color: #856404;
      margin-top: 0;
    }
    .footer {
      background: #333;
      color: white;
      padding: 20px;
      text-align: center;
      font-size: 0.9em;
      border-radius: 0 0 8px 8px;
    }
    .button {
      display: inline-block;
      background: #3498db;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 5px;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>Vehicle Inspection Report</h1>
    <p>${vehicleInfo}</p>
  </div>

  <div class="content">
    <p>Dear ${recipientName},</p>

    ${customMessage ? `<p>${customMessage}</p>` : ''}

    <p>Your vehicle inspection has been completed. Please find the complete report attached to this email.</p>

    <div class="info-box">
      <strong>Vehicle:</strong> ${vehicleInfo}<br>
      <strong>VIN:</strong> ${report.vehicle.vin}<br>
      <strong>Inspection Date:</strong> ${date}<br>
      <strong>Report ID:</strong> ${report.id}
    </div>

    <div class="findings">
      <h3>Overall Condition:</h3>
      <p>${report.summary.overallCondition}</p>

      ${report.summary.keyFindings.length > 0 ? `
        <h3>Key Findings:</h3>
        <ul>
          ${report.summary.keyFindings.map(f => `<li>${f}</li>`).join('')}
        </ul>
      ` : ''}

      ${report.summary.recommendations.length > 0 ? `
        <h3>Recommendations:</h3>
        <ul>
          ${report.summary.recommendations.map(r => `<li>${r}</li>`).join('')}
        </ul>
      ` : ''}
    </div>

    ${report.safetyRecalls.length > 0 ? `
      <div class="recalls">
        <h3>⚠️ Open Safety Recalls (${report.safetyRecalls.length})</h3>
        <p>This vehicle has open safety recalls that should be addressed:</p>
        <ul>
          ${report.safetyRecalls.map(r => `<li><strong>${r.component}:</strong> ${r.summary}</li>`).join('')}
        </ul>
        <p><em>Contact your local dealer to schedule free recall repairs.</em></p>
      </div>
    ` : `
      <div class="info-box">
        <strong>✅ No open safety recalls</strong> were found for this vehicle.
      </div>
    `}

    <p>The complete inspection report with all details is attached as a PDF.</p>

    <p>If you have any questions about this report, please don't hesitate to reach out.</p>

    <p>Best regards,<br>
    <strong>AI Auto Pro Inspection Team</strong></p>
  </div>

  <div class="footer">
    <p>AI Auto Pro - Professional Vehicle Inspections Powered by AI</p>
    <p style="font-size: 0.8em; color: #999;">This is an automated email. Please do not reply directly to this message.</p>
  </div>
</body>
</html>
  `;
};

export default { sendEmail, generateReportEmailHTML };
