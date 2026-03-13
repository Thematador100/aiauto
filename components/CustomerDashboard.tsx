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

interface DashboardStats {
  inspections: {
    today: number;
    thisWeek: number;
    thisMonth: number;
    allTime: number;
    byType: { commercial: number; rv: number; classic: number; ev: number };
  };
  earnings: {
    today: string;
    thisWeek: string;
    thisMonth: string;
    allTime: string;
  };
  recentInspections: Array<{
    id: string;
    vehicle_year: number;
    vehicle_make: string;
    vehicle_model: string;
    vehicle_type: string;
    created_at: string;
  }>;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://auto.srv1171019.hstgr.cloud';

const GRADE_COLORS: Record<string, string> = {
  A: 'bg-green-600 text-white',
  B: 'bg-blue-600 text-white',
  C: 'bg-yellow-600 text-white',
  D: 'bg-orange-600 text-white',
  F: 'bg-red-600 text-white',
};

const VEHICLE_TYPES = [
  { value: 'Standard',   label: 'Car / SUV',              icon: '🚗', desc: 'Sedan, coupe, crossover, SUV' },
  { value: 'Truck',      label: 'Pickup Truck',            icon: '🛻', desc: 'Half-ton, 3/4-ton, 1-ton' },
  { value: 'EV',         label: 'Electric Vehicle',        icon: '⚡', desc: 'Battery EV, plug-in hybrid' },
  { value: 'Commercial', label: '18-Wheeler / Commercial', icon: '🚛', desc: 'Semi, box truck, heavy duty' },
  { value: 'RV',         label: 'RV / Motorhome',          icon: '🏕️', desc: 'Class A, B, C, fifth wheel' },
  { value: 'Classic',    label: 'Classic / Vintage',       icon: '🏎️', desc: 'Pre-1996, collector, muscle' },
  { value: 'Motorcycle', label: 'Motorcycle',              icon: '🏍️', desc: 'Sport, cruiser, adventure' },
];

const VEHICLE_ICONS: Record<string, string> = {
  Standard: '🚗', Truck: '🛻', EV: '⚡', Commercial: '🚛', RV: '🏕️', Classic: '🏎️', Motorcycle: '🏍️',
};

// ─── Email Modal ─────────────────────────────────────────────────────────────
const EmailModal: React.FC<{ report: CompletedReport; onClose: () => void }> = ({ report, onClose }) => {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
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
      if (res.ok) { setSent(true); setTimeout(onClose, 2000); }
      else { const err = await res.json(); alert(`Failed to send: ${err.error || 'Unknown error'}`); }
    } catch { alert('Failed to send email. Please check your connection.'); }
    finally { setSending(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-dark-card border border-dark-border rounded-2xl p-6 w-full max-w-md shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-5">
          <div>
            <h2 className="text-light-text font-bold text-xl">📧 Email Report</h2>
            <p className="text-medium-text text-xs mt-0.5">{report.vehicle.year} {report.vehicle.make} {report.vehicle.model}</p>
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
              <input type="text" name="name" required placeholder="e.g. John Smith"
                className="w-full bg-dark-bg border border-dark-border text-light-text rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition" />
            </div>
            <div>
              <label className="block text-light-text font-semibold text-sm mb-1.5">Client Email Address</label>
              <input type="email" name="email" required placeholder="client@email.com"
                className="w-full bg-dark-bg border border-dark-border text-light-text rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition" />
            </div>
            <div>
              <label className="block text-light-text font-semibold text-sm mb-1.5">Personal Message <span className="text-medium-text font-normal">(optional)</span></label>
              <textarea name="message" rows={3} placeholder="Add a note to your client..."
                className="w-full bg-dark-bg border border-dark-border text-light-text rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary focus:border-primary transition resize-none" />
            </div>
            <div className="flex gap-3 pt-1">
              <button type="button" onClick={onClose}
                className="flex-1 bg-dark-bg border border-dark-border hover:border-medium-text text-medium-text font-semibold py-3 rounded-xl transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={sending}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {sending ? <><LoadingSpinner /> Sending...</> : '📤 Send Report'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard: React.FC<{ label: string; value: string | number; sub?: string; color?: string; icon: string }> = ({ label, value, sub, color = 'text-primary', icon }) => (
  <div className="bg-dark-card border border-dark-border rounded-2xl p-4 flex flex-col gap-1">
    <div className="flex items-center gap-2 text-medium-text text-xs font-medium uppercase tracking-wide">
      <span>{icon}</span>{label}
    </div>
    <div className={`text-2xl font-black ${color}`}>{value}</div>
    {sub && <div className="text-medium-text text-xs">{sub}</div>}
  </div>
);

// ─── Report Card ─────────────────────────────────────────────────────────────
const ReportCard: React.FC<{ report: CompletedReport; onView: () => void; onEmail: () => void }> = ({ report, onView, onEmail }) => {
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
            {totalPhotos > 0 && <span className="text-blue-400 text-xs bg-blue-950/40 px-2 py-0.5 rounded-full">📷 {totalPhotos} photos</span>}
            {failCount > 0 && <span className="text-red-400 text-xs bg-red-950/40 px-2 py-0.5 rounded-full">⛔ {failCount} fail{failCount !== 1 ? 's' : ''}</span>}
            {concernCount > 0 && <span className="text-yellow-400 text-xs bg-yellow-950/40 px-2 py-0.5 rounded-full">⚠️ {concernCount} concern{concernCount !== 1 ? 's' : ''}</span>}
            {failCount === 0 && concernCount === 0 && <span className="text-green-400 text-xs bg-green-950/40 px-2 py-0.5 rounded-full">✅ All clear</span>}
          </div>
        </div>
      </div>
      <div className="border-t border-dark-border grid grid-cols-3 divide-x divide-dark-border">
        <button onClick={onView} className="flex flex-col items-center justify-center gap-1 py-3 text-blue-400 hover:bg-blue-950/30 active:bg-blue-950/50 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
          </svg>
          <span className="text-xs font-semibold">View</span>
        </button>
        <button onClick={onEmail} className="flex flex-col items-center justify-center gap-1 py-3 text-green-400 hover:bg-green-950/30 active:bg-green-950/50 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="text-xs font-semibold">Email</span>
        </button>
        <button onClick={() => printReport()} className="flex flex-col items-center justify-center gap-1 py-3 text-gray-400 hover:bg-gray-800/40 active:bg-gray-800/60 transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
          </svg>
          <span className="text-xs font-semibold">Print</span>
        </button>
      </div>
    </div>
  );
};

// ─── Vehicle Type Picker Modal ────────────────────────────────────────────────
const VehicleTypePicker: React.FC<{ onSelect: () => void; onClose: () => void }> = ({ onSelect, onClose }) => (
  <div className="fixed inset-0 bg-black/80 flex items-end sm:items-center justify-center z-50 p-4" onClick={onClose}>
    <div className="bg-dark-card border border-dark-border rounded-2xl w-full max-w-lg shadow-2xl" onClick={e => e.stopPropagation()}>
      <div className="p-5 border-b border-dark-border">
        <h2 className="text-light-text font-bold text-xl">Select Vehicle Type</h2>
        <p className="text-medium-text text-sm mt-1">
          Choose the type of vehicle you are inspecting. The checklist and AI analysis will be customized automatically.
        </p>
      </div>
      <div className="p-4 grid grid-cols-1 gap-2 max-h-[60vh] overflow-y-auto">
        {VEHICLE_TYPES.map(vt => (
          <button
            key={vt.value}
            onClick={onSelect}
            className="flex items-center gap-4 p-4 rounded-xl border border-dark-border hover:border-primary hover:bg-primary/5 transition-all text-left group"
          >
            <span className="text-3xl">{vt.icon}</span>
            <div className="flex-1">
              <p className="font-bold text-light-text group-hover:text-primary transition-colors">{vt.label}</p>
              <p className="text-medium-text text-xs mt-0.5">{vt.desc}</p>
            </div>
            <svg className="w-5 h-5 text-medium-text group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        ))}
      </div>
      <div className="p-4 border-t border-dark-border">
        <button onClick={onClose} className="w-full py-3 bg-dark-bg border border-dark-border text-medium-text rounded-xl font-semibold hover:text-light-text transition-colors">
          Cancel
        </button>
      </div>
    </div>
  </div>
);

// ─── Main CustomerDashboard ───────────────────────────────────────────────────
export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ user, onNewInspection, onViewReport }) => {
  const [reports, setReports] = useState<CompletedReport[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [emailReport, setEmailReport] = useState<CompletedReport | null>(null);
  const [showVehiclePicker, setShowVehiclePicker] = useState(false);
  const [activeEarningsTab, setActiveEarningsTab] = useState<'today' | 'week' | 'month' | 'all'>('month');

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      const localReports = await offlineService.getReports();
      setReports(localReports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      try {
        const token = localStorage.getItem('token') || sessionStorage.getItem('token');
        const res = await fetch(`${BACKEND_URL}/api/inspections/stats/dashboard`, {
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (res.ok) setStats(await res.json());
      } catch { /* stats are optional */ }
      setIsLoading(false);
    };
    load();
  }, []);

  const isCertified = (user as any).certification_status === 'certified';
  const territory = (user as any).territory;

  const earningsValue = stats ? {
    today: `$${parseFloat(stats.earnings.today).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    week:  `$${parseFloat(stats.earnings.thisWeek).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    month: `$${parseFloat(stats.earnings.thisMonth).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    all:   `$${parseFloat(stats.earnings.allTime).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
  } : null;

  return (
    <div className="space-y-6 pb-8">
      {/* Modals */}
      {emailReport && <EmailModal report={emailReport} onClose={() => setEmailReport(null)} />}
      {showVehiclePicker && (
        <VehicleTypePicker
          onSelect={() => { setShowVehiclePicker(false); onNewInspection(); }}
          onClose={() => setShowVehiclePicker(false)}
        />
      )}

      {/* ── Hero: Welcome + Start Inspection ── */}
      <div className="bg-gradient-to-r from-primary/20 via-dark-card to-dark-card border border-primary/30 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-2xl font-black text-light-text">
                {user.name ? `Welcome back, ${user.name.split(' ')[0]}` : 'Inspector Dashboard'}
              </h1>
              {isCertified && (
                <span className="bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-xs font-bold px-2 py-0.5 rounded-full">
                  ✓ CERTIFIED
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 text-sm text-medium-text">
              <span>Plan: <span className="font-semibold text-primary capitalize">{user.plan}</span></span>
              {territory && <span>· Territory: <span className="font-semibold text-light-text">{territory}</span></span>}
              {stats && <span>· {stats.inspections.allTime} inspection{stats.inspections.allTime !== 1 ? 's' : ''} completed</span>}
            </div>
          </div>
          <button
            onClick={() => setShowVehiclePicker(true)}
            className="flex items-center justify-center gap-2 bg-primary hover:bg-primary-light text-white font-black py-4 px-8 rounded-2xl transition-all shadow-lg shadow-primary/30 text-base whitespace-nowrap active:scale-95"
          >
            <span className="text-xl">+</span> Start New Inspection
          </button>
        </div>
      </div>

      {/* ── Earnings & Stats ── */}
      {!isLoading && stats && (
        <>
          {/* Earnings Panel */}
          <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-dark-border flex items-center justify-between">
              <h2 className="font-bold text-light-text text-base">💰 Earnings</h2>
              <div className="flex gap-1 bg-dark-bg rounded-xl p-1">
                {(['today', 'week', 'month', 'all'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveEarningsTab(tab)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition-colors ${activeEarningsTab === tab ? 'bg-primary text-white' : 'text-medium-text hover:text-light-text'}`}
                  >
                    {tab === 'today' ? 'Today' : tab === 'week' ? 'Week' : tab === 'month' ? 'Month' : 'All Time'}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-5">
              <div className="text-4xl font-black text-primary mb-1">
                {earningsValue ? earningsValue[activeEarningsTab] : '$0.00'}
              </div>
              <p className="text-medium-text text-sm">
                {activeEarningsTab === 'today' ? `${stats.inspections.today} inspection${stats.inspections.today !== 1 ? 's' : ''} today`
                  : activeEarningsTab === 'week' ? `${stats.inspections.thisWeek} inspection${stats.inspections.thisWeek !== 1 ? 's' : ''} this week`
                  : activeEarningsTab === 'month' ? `${stats.inspections.thisMonth} inspection${stats.inspections.thisMonth !== 1 ? 's' : ''} this month`
                  : `${stats.inspections.allTime} total inspections`}
              </p>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard icon="📋" label="This Month" value={stats.inspections.thisMonth} sub="inspections" color="text-blue-400" />
            <StatCard icon="🚛" label="Commercial" value={stats.inspections.byType.commercial} sub="18-wheelers" color="text-orange-400" />
            <StatCard icon="🏕️" label="RV / Motorhome" value={stats.inspections.byType.rv} sub="inspections" color="text-green-400" />
            <StatCard icon="🏎️" label="Classic" value={stats.inspections.byType.classic} sub="inspections" color="text-yellow-400" />
          </div>
        </>
      )}

      {/* ── Quick Start: Vehicle Type Buttons ── */}
      <div className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-dark-border">
          <h2 className="font-bold text-light-text text-base">🚀 Quick Start — Select Vehicle Type</h2>
          <p className="text-medium-text text-xs mt-0.5">
            Tap a vehicle type to begin. The checklist and AI analysis will be customized automatically — no setup needed.
          </p>
        </div>
        <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-2">
          {VEHICLE_TYPES.map(vt => (
            <button
              key={vt.value}
              onClick={onNewInspection}
              className="flex flex-col items-center gap-2 p-3 rounded-xl border border-dark-border hover:border-primary hover:bg-primary/5 transition-all active:scale-95 group"
            >
              <span className="text-3xl">{vt.icon}</span>
              <span className="text-xs font-bold text-medium-text group-hover:text-primary transition-colors text-center leading-tight">{vt.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Certification Banner (if not certified) ── */}
      {!isCertified && (
        <div className="bg-gradient-to-r from-yellow-900/30 to-orange-900/30 border border-yellow-700/40 rounded-2xl p-4">
          <div className="flex items-start gap-3">
            <span className="text-3xl">🎓</span>
            <div className="flex-1">
              <h3 className="font-bold text-yellow-300 text-sm">Get AI Auto Pro Certified</h3>
              <p className="text-yellow-200/70 text-xs mt-0.5 mb-3">
                Certified inspectors earn more, display a badge on every report, and rank higher in the inspector directory. Certification is done entirely in-app and takes 2–4 hours.
              </p>
              <button className="bg-yellow-500 hover:bg-yellow-400 text-black font-bold py-2 px-4 rounded-lg text-xs transition-colors">
                Start Certification — Free
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Inspection Reports ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-light-text">Inspection Reports</h2>
          {reports.length > 0 && <span className="text-medium-text text-sm">{reports.length} total</span>}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-48"><LoadingSpinner /></div>
        ) : reports.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map(report => (
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
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-lg font-bold text-light-text mb-2">No Inspections Yet</h3>
            <p className="text-medium-text text-sm mb-6 max-w-sm mx-auto">
              Start your first inspection above. Select a vehicle type and the app will guide you through every step — nothing to memorize.
            </p>
            <button
              onClick={() => setShowVehiclePicker(true)}
              className="bg-primary hover:bg-primary-light text-white font-bold py-3 px-8 rounded-xl transition-colors shadow-lg shadow-primary/20"
            >
              Start First Inspection
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
