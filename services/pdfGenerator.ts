// @ts-ignore - jsPDF loaded from CDN
declare const jsPDF: any;
// @ts-ignore - html2canvas loaded from CDN
declare const html2canvas: any;
import { CompletedReport, ReportSection } from '../types';

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  Standard: 'Standard Vehicle (Car / SUV)',
  Truck: 'Pickup / Light-Duty Truck',
  EV: 'Electric Vehicle',
  Commercial: 'Commercial / 18-Wheeler',
  RV: 'RV / Motorhome',
  Classic: 'Classic / Vintage',
  Motorcycle: 'Motorcycle',
};

const COMPLIANCE_LABELS: Record<string, string> = {
  Commercial: 'DOT / FMCSA Compliance',
  RV: 'Habitability & Safety Systems',
  Classic: 'Authenticity & Provenance',
  Truck: 'Towing & Bed Equipment',
};

/**
 * Generates a professional PDF from a completed inspection report
 * @param report The completed report data
 * @param elementId Optional - ID of HTML element to convert (for styled reports)
 */
export const generatePDF = async (report: CompletedReport, elementId?: string): Promise<void> => {
  try {
    if (elementId) {
      await generatePDFFromHTML(report, elementId);
    } else {
      await generatePDFProgrammatic(report);
    }
  } catch (error) {
    console.error('[PDFGenerator] Error generating PDF:', error);
    throw new Error('Failed to generate PDF');
  }
};

/**
 * Generate PDF by converting HTML element (preserves visual styling)
 */
const generatePDFFromHTML = async (report: CompletedReport, elementId: string): Promise<void> => {
  const element = document.getElementById(elementId);
  if (!element) {
    throw new Error(`Element with ID ${elementId} not found`);
  }

  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    logging: false,
    backgroundColor: '#1a1a1a'
  });

  const imgData = canvas.toDataURL('image/png');
  const pdf = new jsPDF('p', 'mm', 'a4');

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = pdf.internal.pageSize.getHeight();
  const imgWidth = canvas.width;
  const imgHeight = canvas.height;
  const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight);
  const imgX = (pdfWidth - imgWidth * ratio) / 2;
  const imgY = 0;

  pdf.addImage(imgData, 'PNG', imgX, imgY, imgWidth * ratio, imgHeight * ratio);

  const filename = `Inspection_Report_${report.vehicle.year}_${report.vehicle.make}_${report.vehicle.model}_${report.id}.pdf`;
  pdf.save(filename);
};

/**
 * Generate PDF programmatically with custom formatting
 */
const generatePDFProgrammatic = async (report: CompletedReport): Promise<void> => {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  let yPosition = 20;
  const vehicleType = report.vehicleType || 'Standard';

  const checkNewPage = (neededSpace: number = 30) => {
    if (yPosition > pageHeight - neededSpace) {
      pdf.addPage();
      yPosition = 20;
    }
  };

  // Helper function to add text with wrapping
  const addText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10) => {
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(text, maxWidth);
    pdf.text(lines, x, y);
    return lines.length * (fontSize * 0.35);
  };

  // ===== HEADER =====
  // Vehicle-type-specific header colors
  const headerColors: Record<string, [number, number, number]> = {
    Commercial: [180, 60, 20],  // Deep orange-red
    RV: [34, 120, 80],          // Forest green
    Classic: [120, 80, 40],     // Warm brown
    Standard: [41, 128, 185],   // Blue
    Truck: [80, 60, 140],       // Purple
    EV: [0, 128, 128],          // Teal
    Motorcycle: [100, 100, 100], // Dark gray
  };
  const [r, g, b] = headerColors[vehicleType] || headerColors.Standard;
  pdf.setFillColor(r, g, b);
  pdf.rect(0, 0, pageWidth, 45, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(22);
  pdf.text('Vehicle Inspection Report', pageWidth / 2, 15, { align: 'center' });
  pdf.setFontSize(14);
  pdf.text(`${report.vehicle.year} ${report.vehicle.make} ${report.vehicle.model}`, pageWidth / 2, 25, { align: 'center' });
  pdf.setFontSize(10);
  pdf.text(VEHICLE_TYPE_LABELS[vehicleType] || vehicleType, pageWidth / 2, 33, { align: 'center' });
  if (report.odometer) {
    pdf.text(`Odometer: ${Number(report.odometer).toLocaleString()} miles`, pageWidth / 2, 40, { align: 'center' });
  }

  yPosition = 55;
  pdf.setTextColor(0, 0, 0);

  // ===== VEHICLE INFORMATION =====
  pdf.setFillColor(240, 240, 240);
  pdf.rect(10, yPosition, pageWidth - 20, 25, 'F');

  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Vehicle Information', 15, yPosition + 7);

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`VIN: ${report.vehicle.vin}`, 15, yPosition + 14);
  pdf.text(`Make: ${report.vehicle.make}`, 15, yPosition + 20);
  pdf.text(`Model: ${report.vehicle.model}`, 70, yPosition + 20);
  pdf.text(`Year: ${report.vehicle.year}`, 130, yPosition + 20);

  yPosition += 30;
  pdf.text(`Report ID: ${report.id}`, 15, yPosition);
  pdf.text(`Date: ${new Date(report.date).toLocaleDateString()}`, 130, yPosition);
  yPosition += 10;

  // ===== AI SUMMARY =====
  checkNewPage(40);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('AI-Powered Summary', 15, yPosition);
  yPosition += 7;

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Overall Condition:', 15, yPosition);
  yPosition += 5;

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  const conditionHeight = addText(report.summary.overallCondition, 15, yPosition, pageWidth - 30);
  yPosition += conditionHeight + 5;

  // Key Findings
  if (report.summary.keyFindings.length > 0) {
    checkNewPage();
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Key Findings:', 15, yPosition);
    yPosition += 5;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    report.summary.keyFindings.forEach((finding) => {
      checkNewPage(15);
      const height = addText(`• ${finding}`, 20, yPosition, pageWidth - 35);
      yPosition += height + 3;
    });
  }

  yPosition += 5;

  // Recommendations
  if (report.summary.recommendations.length > 0) {
    checkNewPage(40);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Recommendations:', 15, yPosition);
    yPosition += 5;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    report.summary.recommendations.forEach((rec) => {
      checkNewPage(15);
      const height = addText(`• ${rec}`, 20, yPosition, pageWidth - 35);
      yPosition += height + 3;
    });
  }

  yPosition += 10;

  // ===== DETAILED INSPECTION FINDINGS =====
  const renderSections = (sections: ReportSection[], sectionTitle: string) => {
    if (!sections || sections.length === 0) return;

    checkNewPage(40);
    pdf.setFillColor(r, g, b);
    pdf.rect(10, yPosition - 3, pageWidth - 20, 10, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(13);
    pdf.setFont('helvetica', 'bold');
    pdf.text(sectionTitle, 15, yPosition + 4);
    pdf.setTextColor(0, 0, 0);
    yPosition += 14;

    sections.forEach((section) => {
      checkNewPage(30);

      // Section header with summary
      pdf.setFillColor(245, 245, 245);
      pdf.rect(10, yPosition - 3, pageWidth - 20, 8, 'F');
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text(section.title, 15, yPosition + 2);

      // Summary counts on the right
      const failCount = section.items.filter(i => i.status === 'Fail').length;
      const concernCount = section.items.filter(i => i.status === 'Concern').length;
      const passCount = section.items.filter(i => i.status === 'Pass').length;
      let summaryText = '';
      if (failCount > 0) summaryText += `${failCount} Fail  `;
      if (concernCount > 0) summaryText += `${concernCount} Concern  `;
      summaryText += `${passCount} Pass`;
      pdf.setFontSize(8);
      pdf.setFont('helvetica', 'normal');
      pdf.text(summaryText.trim(), pageWidth - 15, yPosition + 2, { align: 'right' });

      yPosition += 10;

      // Items
      section.items.forEach((item) => {
        checkNewPage(12);

        // Status indicator
        const statusColors: Record<string, [number, number, number]> = {
          Pass: [46, 160, 67],
          Fail: [200, 40, 40],
          Concern: [200, 160, 30],
          'N/A': [140, 140, 140],
        };
        const [sr, sg, sb] = statusColors[item.status] || statusColors['N/A'];

        pdf.setFillColor(sr, sg, sb);
        pdf.roundedRect(15, yPosition - 2.5, 14, 5, 1, 1, 'F');
        pdf.setTextColor(255, 255, 255);
        pdf.setFontSize(6);
        pdf.setFont('helvetica', 'bold');
        pdf.text(item.status, 22, yPosition + 0.5, { align: 'center' });

        pdf.setTextColor(0, 0, 0);
        pdf.setFontSize(9);
        pdf.setFont('helvetica', 'normal');
        pdf.text(item.check, 32, yPosition + 0.5);

        yPosition += 5;

        if (item.details) {
          pdf.setFontSize(8);
          pdf.setTextColor(100, 100, 100);
          const detailHeight = addText(item.details, 32, yPosition, pageWidth - 50, 8);
          yPosition += detailHeight + 2;
          pdf.setTextColor(0, 0, 0);
        }
      });

      yPosition += 5;
    });
  };

  // Render main inspection sections
  renderSections(report.sections, 'Detailed Inspection Findings');

  // Render compliance sections
  if (report.complianceSections && report.complianceSections.length > 0) {
    const complianceTitle = COMPLIANCE_LABELS[vehicleType] || 'Additional Compliance Checks';
    renderSections(report.complianceSections, complianceTitle);
  }

  // ===== SAFETY RECALLS =====
  if (report.safetyRecalls.length > 0) {
    checkNewPage(40);

    pdf.setFillColor(255, 200, 200);
    pdf.rect(10, yPosition - 5, pageWidth - 20, 10, 'F');

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(200, 0, 0);
    pdf.text('Open Safety Recalls', 15, yPosition + 2);
    pdf.setTextColor(0, 0, 0);
    yPosition += 12;

    report.safetyRecalls.forEach((recall, index) => {
      checkNewPage(40);

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${index + 1}. ${recall.component}`, 15, yPosition);
      yPosition += 6;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);

      const summaryH = addText(`Summary: ${recall.summary}`, 20, yPosition, pageWidth - 35, 9);
      yPosition += summaryH + 3;

      const consequenceH = addText(`Consequence: ${recall.consequence}`, 20, yPosition, pageWidth - 35, 9);
      yPosition += consequenceH + 3;

      const remedyH = addText(`Remedy: ${recall.remedy}`, 20, yPosition, pageWidth - 35, 9);
      yPosition += remedyH + 8;
    });
  }

  yPosition += 5;

  // ===== VEHICLE HISTORY =====
  checkNewPage(40);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Vehicle History', 15, yPosition);
  yPosition += 7;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Previous Owners: ${report.vehicleHistory.ownerCount}`, 15, yPosition);
  yPosition += 6;
  pdf.text(`Accident Reported: ${report.vehicleHistory.hasAccident ? 'Yes' : 'No'}`, 15, yPosition);
  yPosition += 6;

  if (report.vehicleHistory.hasAccident) {
    const height = addText(`Details: ${report.vehicleHistory.accidentDetails}`, 20, yPosition, pageWidth - 35);
    yPosition += height + 3;
  }

  pdf.text(`Title Issues: ${report.vehicleHistory.titleIssues || 'Clean'}`, 15, yPosition);
  yPosition += 6;
  pdf.text(`Last Odometer: ${report.vehicleHistory.lastOdometerReading}`, 15, yPosition);
  yPosition += 10;

  // ===== THEFT & SALVAGE =====
  checkNewPage(30);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Theft & Salvage Record', 15, yPosition);
  yPosition += 7;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Stolen Status: ${report.theftAndSalvage.isStolen ? 'Reported Stolen' : 'Not Stolen'}`, 15, yPosition);
  yPosition += 6;
  pdf.text(`Salvage Status: ${report.theftAndSalvage.isSalvage ? 'Salvage Title' : 'Not Salvage'}`, 15, yPosition);
  yPosition += 6;
  const detailsHeight = addText(report.theftAndSalvage.details, 15, yPosition, pageWidth - 30);
  yPosition += detailsHeight + 10;

  // ===== FOOTER ON EVERY PAGE =====
  const totalPages = pdf.internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    const footerY = pageHeight - 10;
    pdf.setFontSize(8);
    pdf.setTextColor(128, 128, 128);
    pdf.text('This report was generated by AI Auto Pro', pageWidth / 2, footerY, { align: 'center' });
    pdf.text(`Generated on ${new Date().toLocaleString()} | Page ${i} of ${totalPages}`, pageWidth / 2, footerY + 4, { align: 'center' });
  }

  // Save the PDF
  const filename = `Inspection_Report_${report.vehicle.year}_${report.vehicle.make}_${report.vehicle.model}_${report.id}.pdf`;
  pdf.save(filename);
};

/**
 * Print the current report
 */
export const printReport = () => {
  window.print();
};
