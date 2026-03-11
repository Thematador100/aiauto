import React, { useState, useEffect } from 'react';
import { User, CompletedReport } from '../types';
import { offlineService } from '../services/offlineService';
import { LoadingSpinner } from './LoadingSpinner';
import { printReport } from '../services/pdfGenerator';

interface CustomerDashboardProps {
  user: User;
  onNewInspection: () => void;
  onViewReport?: (report: CompletedReport) => void;
}

const GRADE_COLORS: Record<string, string> = {
  A: 'bg-green-600 text-white',
  B: 'bg-blue-600 text-white',
  C: 'bg-yellow-600 text-white',
  D: 'bg-orange-600 text-white',
  F: 'bg-red-600 text-white',
};

const VEHICLE_ICONS: Record<string, string> = {
  Standard: '🚗', Truck: '🛻', EV: '⚡', Commercial: '🚛', RV: '🏕️', Classic: '🏎️', Motorcycle: '🏍️',
};

// ─── Email Modal ────────────────────────────────────────────────────────────
const EmailModal: React.FC<{ report: CompletedReport; onClose: () => void }> = ({ report, onClose }) => {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://auto.srv1171019.hstgr.cloud';
    setSending(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/reports/email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({
          reportId: report.id,
          recipientEmail: fd.get('email'),
          recipientName: fd.get('name'),
          message: fd.get('message'),
          report,
        }),
      });
      if (res.ok) {
        setSent(true);
        setTimeout(onClose, 2000);
      } else {
        const err = await res.json();
        alert(`Failed to send: ${err.error || 'Unknown error'}`);
      }
    } catch {
      alert('Failed to send email. Please check your connection.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div
        className="bg-dark-card border border-dark-border rounded-2xl p-6 w-full max-w-md shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-light-text font-bold text-xl">📧 Email Report</h2>
            <p className="text-medium-text text-xs mt-0.5">
              {report.vehicle.year} {report.vehicle.make} {report.vehicle.model}
            </p>
          </div>
          <button onClick={onClose} className="text-medium-text hover:text-light-text p-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {sent ? (
          <div className="text-center py-8">
            <div className="text-5xl mb-3">✅</div>
            <p className="text-green-400 font-bold text-lg">Report Sent!</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-light-text font-semibold text-sm mb-1.5">Client Name</label>
              <input
                type="text"
                name="name"
                required
                placeholder="e.g. John Smith"
                className="w-full bg-dark-bg border border-dark-border text-light-text rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition"
              />
            </div>
            <div>
              <label className="block text-light-text font-semibold text-sm mb-1.5">Client Email Address</label>
              <input
                type="email"
                name="email"
                required
                placeholder="client@email.com"
                className="w-full bg-dark-bg border border-dark-border text-light-text rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition"
              />
            </div>
            <div>
              <label className="block text-light-text font-semibold text-sm mb-1.5">Personal Message <span className="text-medium-text font-normal">(optional)</span></label>
              <textarea
                name="message"
                rows={3}
                placeholder="Add a note to your client..."
                className="w-full bg-dark-bg border border-dark-border text-light-text rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition resize-none"
              />
            </div>
            <div className="flex gap-3 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 bg-dark-bg border border-dark-border hover:border-medium-text text-medium-text font-semibold py-3 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={sending}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {sending ? <><LoadingSpinner /> Sending...</> : '📤 Send Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// ─── Report Card ────────────────────────────────────────────────────────────
const ReportCard: React.FC<{
  report: CompletedReport;
  onView: () => void;
  onEmail: () => void;
}> = ({ report, onView, onEmail }) => {
  const grade = report.vehicleGrade;
  const gradeClass = grade ? GRADE_COLORS[grade.letter] || GRADE_COLORS.C : null;
  const vehicleIcon = VEHICLE_ICONS[report.vehicleType || 'Standard'] || '🚗';
  const totalPhotos = [...(report.sections || []), ...(report.complianceSections || [])].reduce(
    (sum, s) => sum + s.items.reduce((si, item) => si + (item.photos?.length || 0), 0), 0
  );
  const failCount = (report.sections || []).reduce((sum, s) => sum + s.items.filter(i => i.status === 'Fail').length, 0);
  const concernCount = (report.sections || []).reduce((sum, s) => sum + s.items.filter(i => i.status === 'Concern').length, 0);

  return (
    <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden hover:border-primary/40 transition-colors">
      {/* Card Header */}
      <div className="p-4 flex items-start gap-3">
        <div className="text-3xl flex-shrink-0 mt-0.5">{vehicleIcon}</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-light-text font-bold text-base leading-tight">
                {report.vehicle.year} {report.vehicle.make} {report.vehicle.model}
              </p>
              <p className="text-medium-text text-xs font-mono mt-0.5">{report.vehicle.vin}</p>
            </div>
            {grade && gradeClass && (
              <span className={`flex-shrink-0 ${gradeClass} font-black text-lg w-10 h-10 rounded-xl flex items-center justify-center`}>
                {grade.letter}
              </span>
            )}
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            <span className="text-medium-text text-xs bg-dark-bg px-2 py-0.5 rounded-full">
              📅 {new Date(report.date).toLocaleDateString()}
            </span>
            {totalPhotos > 0 && (
              <span className="text-blue-400 text-xs bg-blue-950/40 px-2 py-0.5 rounded-full">
                📷 {totalPhotos} photos
              </span>
            )}
            {failCount > 0 && (
              <span className="text-red-400 text-xs bg-red-950/40 px-2 py-0.5 rounded-full">
                ⛔ {failCount} fail{failCount !== 1 ? 's' : ''}
              </span>
            )}
            {concernCount > 0 && (
              <span className="text-yellow-400 text-xs bg-yellow-950/40 px-2 py-0.5 rounded-full">
                ⚠️ {concernCount} concern{concernCount !== 1 ? 's' : ''}
              </span>
            )}
            {failCount === 0 && concernCount === 0 && (
              <span className="text-green-400 text-xs bg-green-950/40 px-2 py-0.5 rounded-full">
                ✅ All clear
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="border-t border-dark-border grid grid-cols-3 divide-x divide-dark-border">
        <button
          onClick={onView}
          className="flex flex-col items-center justify-center gap-1 py-3 text-blue-400 hover:bg-blue-950/30 active:bg-blue-950/50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className="text-xs font-semibold">View</span>
        </button>
        <button
          onClick={onEmail}
          className="flex flex-col items-center justify-center gap-1 py-3 text-green-400 hover:bg-green-950/30 active:bg-green-950/50 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="text-xs font-semibold">Email</span>
        </button>
        <button
          onClick={() => printReport()}
          className="flex flex-col items-center justify-center gap-1 py-3 text-gray-400 hover:bg-gray-800/40 active:bg-gray-800/60 transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span className="text-xs font-semibold">Print</span>
        </button>
      </div>
    </div>
  );
};

// ─── Main CustomerDashboard ─────────────────────────────────────────────────
export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ user, onNewInspection, onViewReport }) => {
  const [reports, setReports] = useState<CompletedReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [emailReport, setEmailReport] = useState<CompletedReport | null>(null);

  useEffect(() => {
    const loadReports = async () => {
      setIsLoading(true);
      const localReports = await offlineService.getReports();
      setReports(localReports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      setIsLoading(false);
    };
    loadReports();
  }, []);

  return (
    <div className="space-y-6">

      {/* Email Modal */}
      {emailReport && (
        <EmailModal report={emailReport} onClose={() => setEmailReport(null)} />
      )}

      {/* Welcome + New Inspection */}
      <div className="bg-dark-card p-5 rounded-2xl border border-dark-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-light-text">Welcome back</h1>
          <p className="text-medium-text text-sm mt-0.5">
            Plan: <span className="font-semibold text-primary">{user.plan}</span>
            {reports.length > 0 && <span className="ml-3 text-medium-text">· {reports.length} inspection{reports.length !== 1 ? 's' : ''} completed</span>}
          </p>
        </div>
        <button
          onClick={onNewInspection}
          className="bg-primary hover:bg-primary-light text-white font-bold py-3 px-6 rounded-xl transition-colors shadow-md text-sm whitespace-nowrap"
        >
          + New Inspection
        </button>
      </div>

      {/* EV-Ready Badge */}
      <div className="bg-gradient-to-r from-green-900/60 to-blue-900/60 p-4 rounded-2xl border border-green-700/40">
        <div className="flex items-center gap-3">
          <span className="text-3xl">⚡</span>
          <div>
            <h3 className="text-white font-bold text-sm">EV-Ready Platform</h3>
            <p className="text-green-200/80 text-xs mt-0.5">Full OBD2 diagnostics for EVs, battery health analysis, and EV-specific fraud detection.</p>
          </div>
        </div>
      </div>

      {/* Reports Section */}
      <div>
        <h2 className="text-xl font-bold text-light-text mb-4">Your Inspection Reports</h2>

        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <LoadingSpinner />
          </div>
        ) : reports.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onView={() => onViewReport?.(report)}
                onEmail={() => setEmailReport(report)}
              />
            ))}
          </div>
        ) : (
          <div className="bg-dark-card border border-dark-border rounded-2xl text-center py-16 px-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-14 w-14 text-medium-text/40 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-lg font-bold text-light-text mb-1">No reports yet</h3>
            <p className="text-medium-text text-sm mb-6">Start your first inspection to see reports here.</p>
            <button
              onClick={onNewInspection}
              className="bg-primary hover:bg-primary-light text-white font-bold py-3 px-8 rounded-xl transition-colors"
            >
              Start First Inspection
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
