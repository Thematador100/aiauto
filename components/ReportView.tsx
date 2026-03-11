import React, { useState } from 'react';
import { CompletedReport, SafetyRecall, ReportSection, ReportSectionItem } from '../types';
import { generatePDF, printReport } from '../services/pdfGenerator';

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

const GRADE_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  A: { bg: 'bg-green-600', text: 'text-green-400', border: 'border-green-500' },
  B: { bg: 'bg-blue-600', text: 'text-blue-400', border: 'border-blue-500' },
  C: { bg: 'bg-yellow-600', text: 'text-yellow-400', border: 'border-yellow-500' },
  D: { bg: 'bg-orange-600', text: 'text-orange-400', border: 'border-orange-500' },
  F: { bg: 'bg-red-600', text: 'text-red-400', border: 'border-red-500' },
};

const SectionCard: React.FC<{ title: string; children: React.ReactNode; accent?: string }> = ({ title, children, accent }) => (
  <div className={`bg-dark-card p-6 rounded-lg border ${accent ? `border-${accent}` : 'border-dark-border'}`}>
    <h2 className={`text-xl font-semibold border-b border-dark-border pb-3 mb-4 ${accent ? `text-${accent}` : 'text-light-text'}`}>{title}</h2>
    <div className="space-y-4">{children}</div>
  </div>
);

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const colors: Record<string, string> = {
    Pass: 'bg-green-600/20 text-green-400 border-green-600/30',
    Fail: 'bg-red-600/20 text-red-400 border-red-600/30',
    Concern: 'bg-yellow-600/20 text-yellow-400 border-yellow-600/30',
    'N/A': 'bg-gray-600/20 text-gray-400 border-gray-600/30',
  };
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded border ${colors[status] || colors['N/A']}`}>
      {status}
    </span>
  );
};

const PhotoGallery: React.FC<{ photos: ReportSectionItem['photos'] }> = ({ photos }) => {
  const [expandedPhoto, setExpandedPhoto] = useState<string | null>(null);
  if (!photos || photos.length === 0) return null;

  return (
    <>
      <div className="flex gap-2 mt-2 flex-wrap">
        {photos.map((photo, i) => (
          <button
            key={i}
            onClick={() => setExpandedPhoto(photo.url)}
            className="relative group rounded-md overflow-hidden border border-dark-border hover:border-primary transition-colors"
          >
            <img src={photo.url} alt={photo.category || 'Evidence'} className="w-16 h-16 object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
              </svg>
            </div>
          </button>
        ))}
      </div>
      {expandedPhoto && (
        <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4 print:hidden" onClick={() => setExpandedPhoto(null)}>
          <img src={expandedPhoto} alt="Full size" className="max-w-full max-h-[90vh] rounded-lg" />
          <button onClick={() => setExpandedPhoto(null)} className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2 hover:bg-black/70">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
      )}
    </>
  );
};

const InspectionSectionView: React.FC<{ section: ReportSection }> = ({ section }) => {
  const failCount = section.items.filter(i => i.status === 'Fail').length;
  const concernCount = section.items.filter(i => i.status === 'Concern').length;

  return (
    <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
      <div className="flex justify-between items-center border-b border-dark-border pb-3 mb-4">
        <h3 className="text-lg font-semibold text-light-text">{section.title}</h3>
        <div className="flex gap-2 text-xs">
          {failCount > 0 && <span className="text-red-400 font-semibold">{failCount} Failed</span>}
          {concernCount > 0 && <span className="text-yellow-400 font-semibold">{concernCount} Concerns</span>}
          {failCount === 0 && concernCount === 0 && <span className="text-green-400 font-semibold">All Clear</span>}
        </div>
      </div>
      <div className="space-y-3">
        {section.items.map((item, i) => (
          <div key={i} className={`py-2 ${i > 0 ? 'border-t border-dark-border/50' : ''}`}>
            <div className="flex flex-col sm:flex-row sm:items-start gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <StatusBadge status={item.status} />
                <span className="text-light-text text-sm">{item.check}</span>
              </div>
              {item.details && (
                <p className="text-xs text-medium-text sm:max-w-[40%] pl-6 sm:pl-0">{item.details}</p>
              )}
            </div>
            <PhotoGallery photos={item.photos} />
          </div>
        ))}
      </div>
    </div>
  );
};

const Recall: React.FC<{ recall: SafetyRecall }> = ({ recall }) => (
    <div className="p-4 rounded-md bg-dark-bg border border-dark-border">
        <h4 className="font-bold text-light-text">{recall.component}</h4>
        <p className="text-sm text-medium-text mt-1"><strong className="text-light-text">Summary:</strong> {recall.summary}</p>
        <p className="text-sm text-medium-text mt-1"><strong className="text-light-text">Consequence:</strong> {recall.consequence}</p>
        <p className="text-sm text-medium-text mt-1"><strong className="text-light-text">Remedy:</strong> {recall.remedy}</p>
    </div>
);

const InspectionScorecard: React.FC<{ sections: ReportSection[]; label: string }> = ({ sections, label }) => {
  const totalItems = sections.reduce((sum, s) => sum + s.items.length, 0);
  const passCount = sections.reduce((sum, s) => sum + s.items.filter(i => i.status === 'Pass').length, 0);
  const failCount = sections.reduce((sum, s) => sum + s.items.filter(i => i.status === 'Fail').length, 0);
  const concernCount = sections.reduce((sum, s) => sum + s.items.filter(i => i.status === 'Concern').length, 0);
  const naCount = totalItems - passCount - failCount - concernCount;
  if (totalItems === 0) return null;
  const passRate = Math.round((passCount / (totalItems - naCount)) * 100) || 0;

  return (
    <div className="bg-dark-card p-4 rounded-lg border border-dark-border">
      <h3 className="text-sm font-semibold text-medium-text mb-3">{label}</h3>
      <div className="flex items-center gap-4">
        <div className="text-3xl font-bold text-light-text">{passRate}%</div>
        <div className="flex-1">
          <div className="w-full h-2 bg-dark-bg rounded-full overflow-hidden flex">
            {passCount > 0 && <div className="bg-green-500 h-full" style={{ width: `${(passCount / totalItems) * 100}%` }} />}
            {concernCount > 0 && <div className="bg-yellow-500 h-full" style={{ width: `${(concernCount / totalItems) * 100}%` }} />}
            {failCount > 0 && <div className="bg-red-500 h-full" style={{ width: `${(failCount / totalItems) * 100}%` }} />}
            {naCount > 0 && <div className="bg-gray-600 h-full" style={{ width: `${(naCount / totalItems) * 100}%` }} />}
          </div>
          <div className="flex gap-3 mt-1 text-xs">
            <span className="text-green-400">{passCount} Pass</span>
            <span className="text-yellow-400">{concernCount} Concern</span>
            <span className="text-red-400">{failCount} Fail</span>
            <span className="text-gray-400">{naCount} N/A</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export const ReportView: React.FC<{ report: CompletedReport }> = ({ report }) => {
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);

  const handleDownloadPDF = async () => {
    try { setIsGeneratingPDF(true); await generatePDF(report); } catch (error) { console.error('PDF error:', error); alert('Failed to generate PDF.'); } finally { setIsGeneratingPDF(false); }
  };

  const vehicleType = report.vehicleType || 'Standard';
  const hasComplianceSections = report.complianceSections && report.complianceSections.length > 0;
  const complianceLabel = COMPLIANCE_LABELS[vehicleType] || 'Additional Checks';
  const grade = report.vehicleGrade;
  const gradeColor = grade ? GRADE_COLORS[grade.letter] || GRADE_COLORS.C : null;
  const totalPhotos = [...(report.sections || []), ...(report.complianceSections || [])].reduce(
    (sum, s) => sum + s.items.reduce((si, item) => si + (item.photos?.length || 0), 0), 0
  );

  return (
    <div className="space-y-6" id="report-content">
      {/* ─── Share Report Panel ─── */}
      <div className="bg-gradient-to-r from-blue-950/60 to-dark-card border-2 border-blue-700/50 rounded-2xl p-5 print:hidden">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">📤</span>
          <div>
            <h2 className="text-light-text font-bold text-lg">Share This Report</h2>
            <p className="text-medium-text text-xs">Send to the client, print for your records, or save as PDF</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Email to Client */}
          <button
            onClick={() => setShowEmailModal(true)}
            className="flex flex-col items-center justify-center gap-2 bg-green-600 hover:bg-green-700 active:bg-green-800 text-white font-bold py-5 px-4 rounded-xl transition-colors shadow-md text-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="text-base">Email to Client</span>
            <span className="text-green-200 text-xs font-normal">Just type their email — done</span>
          </button>

          {/* Download PDF */}
          <button
            onClick={handleDownloadPDF}
            disabled={isGeneratingPDF}
            className="flex flex-col items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-5 px-4 rounded-xl transition-colors shadow-md text-center disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="text-base">{isGeneratingPDF ? 'Generating...' : 'Download PDF'}</span>
            <span className="text-blue-200 text-xs font-normal">Save to phone or computer</span>
          </button>

          {/* Print */}
          <button
            onClick={() => printReport()}
            className="flex flex-col items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 active:bg-gray-800 text-white font-bold py-5 px-4 rounded-xl transition-colors shadow-md text-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            <span className="text-base">Print Report</span>
            <span className="text-gray-300 text-xs font-normal">Opens print dialog</span>
          </button>
        </div>
      </div>

      {/* Report Header */}
      <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-light-text">Inspection Report</h1>
            <p className="text-medium-text">{report.vehicle.year} {report.vehicle.make} {report.vehicle.model}</p>
            <p className="font-mono text-sm text-primary">{report.vehicle.vin}</p>
          </div>
          <div className="text-right">
            <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-primary/20 text-primary mb-2">{VEHICLE_TYPE_LABELS[vehicleType] || vehicleType}</span>
            <p className="text-medium-text text-sm">Report ID: {report.id}</p>
            <p className="text-medium-text text-sm">Date: {new Date(report.date).toLocaleDateString()}</p>
            {report.odometer && <p className="text-medium-text text-sm">Odometer: {Number(report.odometer).toLocaleString()} mi</p>}
          </div>
        </div>
        {report.inspectorInfo && (
          <div className="mt-4 pt-4 border-t border-dark-border flex justify-between items-center">
            <div className="text-sm">
              <span className="text-medium-text">Inspected by: </span>
              <span className="text-light-text font-semibold">{report.inspectorInfo.name}</span>
              {report.inspectorInfo.company && <span className="text-medium-text"> | {report.inspectorInfo.company}</span>}
            </div>
            {totalPhotos > 0 && <span className="text-xs text-medium-text">{totalPhotos} photos attached</span>}
          </div>
        )}
      </div>

      {/* Vehicle Grade Card */}
      {grade && gradeColor && (
        <div className={`bg-dark-card p-6 rounded-lg border-2 ${gradeColor.border}`}>
          <div className="flex items-center gap-6">
            <div className={`${gradeColor.bg} w-20 h-20 rounded-xl flex items-center justify-center flex-shrink-0`}>
              <span className="text-4xl font-black text-white">{grade.letter}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h2 className="text-2xl font-bold text-light-text">Vehicle Grade: {grade.letter}</h2>
                <span className="text-sm font-semibold px-3 py-1 rounded-full bg-dark-bg text-medium-text">{grade.score}/100</span>
              </div>
              <p className={`text-lg font-semibold ${gradeColor.text}`}>{grade.buyRecommendation}</p>
              {grade.estimatedRepairCost && (
                <p className="text-sm text-medium-text mt-1">
                  Estimated Repair Costs: <span className="text-light-text font-semibold">{grade.estimatedRepairCost}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scorecards */}
      <div className={`grid gap-4 ${hasComplianceSections ? 'grid-cols-1 lg:grid-cols-2' : 'grid-cols-1'}`}>
        {report.sections?.length > 0 && <InspectionScorecard sections={report.sections} label="Inspection Pass Rate" />}
        {hasComplianceSections && <InspectionScorecard sections={report.complianceSections} label={`${complianceLabel} Pass Rate`} />}
      </div>

      {/* AI Summary */}
      <SectionCard title="AI-Powered Summary">
        <div>
          <h3 className="text-lg font-semibold text-primary mb-2">Overall Condition Assessment</h3>
          <p className="text-light-text whitespace-pre-wrap">{report.summary.overallCondition}</p>
        </div>
        <div>
          <h3 className="text-lg font-semibold text-primary mb-2">Key Findings</h3>
          {report.summary.keyFindings.length > 0 ? (
            <ul className="list-disc list-inside space-y-1 text-light-text">{report.summary.keyFindings.map((f, i) => <li key={i}>{f}</li>)}</ul>
          ) : <p className="text-medium-text">No significant issues were found during the inspection.</p>}
        </div>
        <div>
          <h3 className="text-lg font-semibold text-primary mb-2">Recommendations</h3>
          {report.summary.recommendations.length > 0 ? (
            <ul className="list-disc list-inside space-y-1 text-light-text">{report.summary.recommendations.map((r, i) => <li key={i}>{r}</li>)}</ul>
          ) : <p className="text-medium-text">No immediate recommendations.</p>}
        </div>
      </SectionCard>

      {/* Damage Assessment */}
      {report.damageAssessment && (
        <div className="bg-dark-card p-6 rounded-lg border border-red-500/40">
          <h2 className="text-xl font-semibold text-red-400 border-b border-dark-border pb-3 mb-4">AI Damage Assessment</h2>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><span className="text-sm text-medium-text">Overall Severity:</span><p className="text-light-text font-semibold">{report.damageAssessment.overallSeverity}</p></div>
            <div><span className="text-sm text-medium-text">Prior Accident Likelihood:</span><p className="text-light-text font-semibold">{report.damageAssessment.accidentLikelihood}</p></div>
          </div>
          {report.damageAssessment.findings.length > 0 && (
            <div className="space-y-2">
              {report.damageAssessment.findings.map((f, i) => (
                <div key={i} className="flex items-start gap-3 p-3 bg-dark-bg rounded-lg">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded ${f.severity === 'Severe' ? 'bg-red-600/20 text-red-400' : f.severity === 'Moderate' ? 'bg-yellow-600/20 text-yellow-400' : 'bg-blue-600/20 text-blue-400'}`}>{f.severity}</span>
                  <div><span className="text-light-text font-semibold text-sm">{f.area}</span><p className="text-medium-text text-xs">{f.description}</p></div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Detailed Findings */}
      {report.sections?.length > 0 && (
        <>
          <h2 className="text-2xl font-bold text-light-text pt-2">Detailed Inspection Findings</h2>
          {report.sections.map((s, i) => <InspectionSectionView key={i} section={s} />)}
        </>
      )}

      {/* Compliance */}
      {hasComplianceSections && (
        <>
          <div className="bg-primary/10 border border-primary/30 p-4 rounded-lg mt-2">
            <h2 className="text-2xl font-bold text-primary">{complianceLabel}</h2>
            {vehicleType === 'Commercial' && <p className="text-medium-text text-sm mt-1">FMCSR Part 396 compliance checklist - Items marked Fail may trigger Out-of-Service orders</p>}
            {vehicleType === 'RV' && <p className="text-medium-text text-sm mt-1">NFPA 1192 / RVIA safety standards - LP gas, water, electrical, and emergency systems</p>}
            {vehicleType === 'Classic' && <p className="text-medium-text text-sm mt-1">Numbers matching, originality assessment, and provenance verification</p>}
          </div>
          {report.complianceSections.map((s, i) => <InspectionSectionView key={`c-${i}`} section={s} />)}
        </>
      )}

      {/* Vehicle History & Theft/Salvage */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectionCard title="Vehicle History">
          <div className="flex justify-between"><span className="text-medium-text">Previous Owners:</span><span className="font-semibold text-light-text">{report.vehicleHistory.ownerCount}</span></div>
          <div className="flex justify-between"><span className="text-medium-text">Accident Reported:</span><span className={`font-semibold ${report.vehicleHistory.hasAccident ? 'text-red-400' : 'text-green-400'}`}>{report.vehicleHistory.hasAccident ? 'Yes' : 'No'}</span></div>
          {report.vehicleHistory.hasAccident && <p className="text-sm text-medium-text border-t border-dark-border pt-2"><strong>Details:</strong> {report.vehicleHistory.accidentDetails}</p>}
          <div className="flex justify-between"><span className="text-medium-text">Title Issues:</span><span className={`font-semibold ${report.vehicleHistory.titleIssues ? 'text-red-400' : 'text-green-400'}`}>{report.vehicleHistory.titleIssues || 'Clean'}</span></div>
          <div className="flex justify-between"><span className="text-medium-text">Last Odometer Reading:</span><span className="font-semibold text-light-text">{report.vehicleHistory.lastOdometerReading}</span></div>
        </SectionCard>
        <SectionCard title="Theft & Salvage Record">
          <div className="flex justify-between"><span className="text-medium-text">Stolen Status:</span><span className={`font-semibold ${report.theftAndSalvage.isStolen ? 'text-red-400' : 'text-green-400'}`}>{report.theftAndSalvage.isStolen ? 'Reported Stolen' : 'Not Stolen'}</span></div>
          <div className="flex justify-between"><span className="text-medium-text">Salvage Status:</span><span className={`font-semibold ${report.theftAndSalvage.isSalvage ? 'text-red-400' : 'text-green-400'}`}>{report.theftAndSalvage.isSalvage ? 'Salvage Title Reported' : 'Not Salvage'}</span></div>
          <p className="text-sm text-medium-text border-t border-dark-border pt-2">{report.theftAndSalvage.details}</p>
        </SectionCard>
      </div>

      <SectionCard title="Open Safety Recalls">
        {report.safetyRecalls.length > 0 ? (
          <div className="space-y-4">{report.safetyRecalls.map((r, i) => <Recall key={i} recall={r} />)}</div>
        ) : <p className="text-medium-text">No open safety recalls found for this VIN.</p>}
      </SectionCard>

      {/* Report Footer */}
      <div className="bg-dark-card p-4 rounded-lg border border-dark-border text-center">
        <p className="text-xs text-medium-text">
          This report was generated by AI Auto Pro. Inspection findings are based on visual and diagnostic assessment at the time of inspection.
          This report does not guarantee the absence of hidden defects. Always consult a certified mechanic for major concerns.
        </p>
        {report.inspectorInfo && <p className="text-xs text-medium-text mt-2">Inspector: {report.inspectorInfo.name}{report.inspectorInfo.company ? ` | ${report.inspectorInfo.company}` : ''}</p>}
      </div>

      {/* Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 print:hidden">
          <div className="bg-dark-card p-6 rounded-lg border border-dark-border max-w-md w-full mx-4">
            <h2 className="text-2xl font-bold text-light-text mb-4">Email Report</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://auto.srv1171019.hstgr.cloud';
              try {
                const res = await fetch(`${BACKEND_URL}/api/reports/email`, {
                  method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
                  body: JSON.stringify({ reportId: report.id, recipientEmail: fd.get('email'), recipientName: fd.get('name'), message: fd.get('message'), report })
                });
                if (res.ok) { alert('Report emailed successfully!'); setShowEmailModal(false); }
                else { const err = await res.json(); alert(`Failed: ${err.error || 'Unknown error'}`); }
              } catch { alert('Failed to send email. Check your connection.'); }
            }}>
              <div className="space-y-4">
                <div><label className="block text-light-text font-semibold mb-2">Recipient Name</label><input type="text" name="name" required className="w-full bg-dark-bg border border-dark-border text-light-text rounded-lg px-4 py-2" placeholder="Customer name" /></div>
                <div><label className="block text-light-text font-semibold mb-2">Recipient Email</label><input type="email" name="email" required className="w-full bg-dark-bg border border-dark-border text-light-text rounded-lg px-4 py-2" placeholder="customer@example.com" /></div>
                <div><label className="block text-light-text font-semibold mb-2">Custom Message (Optional)</label><textarea name="message" rows={3} className="w-full bg-dark-bg border border-dark-border text-light-text rounded-lg px-4 py-2" placeholder="Add a personal message..." /></div>
                <div className="flex gap-3 justify-end">
                  <button type="button" onClick={() => setShowEmailModal(false)} className="bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg">Cancel</button>
                  <button type="submit" className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg">Send Email</button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
