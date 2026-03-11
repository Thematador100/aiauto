import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { sendEmail, generateReportEmailHTML } from '../config/email.js';

const router = express.Router();

/**
 * POST /api/reports/email
 * Email an inspection report to a customer
 * Requires authentication
 */
router.post('/email', authenticateToken, async (req, res) => {
  try {
    const { reportId, recipientEmail, recipientName, message, report } = req.body;

    // Validation
    if (!recipientEmail || !reportId || !report) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(recipientEmail)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    console.log(`[Reports] Emailing report ${reportId} to ${recipientEmail}`);

    // Generate email HTML
    const html = generateReportEmailHTML(report, recipientName || 'Valued Customer', message);

    // Plain text version
    const text = `
Vehicle Inspection Report

Dear ${recipientName || 'Valued Customer'},

${message ? message + '\n\n' : ''}

Your vehicle inspection has been completed for:
Vehicle: ${report.vehicle.year} ${report.vehicle.make} ${report.vehicle.model}
VIN: ${report.vehicle.vin}
Inspection Date: ${new Date(report.date).toLocaleDateString()}
Report ID: ${report.id}

Overall Condition:
${report.summary.overallCondition}

${report.summary.keyFindings.length > 0 ? `
Key Findings:
${report.summary.keyFindings.map(f => `- ${f}`).join('\n')}
` : ''}

${report.summary.recommendations.length > 0 ? `
Recommendations:
${report.summary.recommendations.map(r => `- ${r}`).join('\n')}
` : ''}

${report.safetyRecalls.length > 0 ? `
⚠️ OPEN SAFETY RECALLS (${report.safetyRecalls.length}):
${report.safetyRecalls.map(r => `- ${r.component}: ${r.summary}`).join('\n')}
Please contact your local dealer to schedule free recall repairs.
` : 'No open safety recalls were found for this vehicle.'}

For questions about this report, please contact your inspector.

Best regards,
AI Auto Pro Inspection Team
    `;

    // Send email
    const result = await sendEmail({
      to: recipientEmail,
      subject: `Vehicle Inspection Report - ${report.vehicle.year} ${report.vehicle.make} ${report.vehicle.model}`,
      html: html,
      text: text,
      // Note: In future, attach PDF file here
      // attachments: [{
      //   filename: `Inspection_Report_${reportId}.pdf`,
      //   content: pdfBuffer
      // }]
    });

    res.json({
      message: 'Report emailed successfully',
      emailId: result.messageId,
      recipient: recipientEmail,
      ...(result.preview && { previewUrl: result.preview }) // Only for test mode
    });

  } catch (error) {
    console.error('[Reports] Email error:', error);
    res.status(500).json({ error: 'Failed to send email', details: error.message });
  }
});

export default router;
