import React, { useState } from 'react';
import { User, InspectionState, CompletedReport } from '../types';
import { Header } from './Header';
import { Footer } from './Footer';
import { CustomerDashboard } from './CustomerDashboard';
import { InspectionForm } from './InspectionForm';
import { DiagnosticsTool } from './DiagnosticsTool';
import { ChatBot } from './ChatBot';
import { FinalizeScreen } from './FinalizeScreen';
import { ReportView } from './ReportView';
import { UserProfile } from './UserProfile';
import { ManualPage } from './ManualPage';
import { ReferralDashboard } from './ReferralDashboard';
import InspectionWizard from './InspectionWizard';
import { RentalFleetModule } from './RentalFleetModule';
import { ResellerDashboard } from './ResellerDashboard';
import LanguageToggle from './LanguageToggle';
import { CertificationCenter } from './CertificationCenter';

type View = 'Dashboard' | 'Inspection' | 'Wizard' | 'Diagnostics' | 'Assistant' | 'Profile' | 'Manual' | 'Finalize' | 'Report' | 'Referral' | 'Fleet' | 'Reseller' | 'Certification';

interface MainAppProps {
  user: User;
  onLogout: () => void;
}

export const MainApp: React.FC<MainAppProps> = ({ user, onLogout }) => {
  const [view, setView] = useState<View>('Dashboard');
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [inspectionState, setInspectionState] = useState<InspectionState | null>(null);
  const [completedReport, setCompletedReport] = useState<CompletedReport | null>(null);

  const [useWizard, setUseWizard] = useState(true);

  const handleNewInspection = () => {
    setInspectionState(null);
    setCompletedReport(null);
    setView(useWizard ? 'Wizard' : 'Inspection');
    setActiveTab('Inspection');
  };

  const handleFinalize = (state: InspectionState) => {
    setInspectionState(state);
    setView('Finalize');
  };

  const handleReportComplete = (report: CompletedReport) => {
    setCompletedReport(report);
    setView('Report');
  };

  const handleTabChange = (tab: View | string) => {
    setActiveTab(tab);

    // Only reset inspection state when going to Dashboard or starting a new inspection
    // Preserve inspectionState when going to Diagnostics so vehicleType is available
    if (tab === 'Dashboard') {
      setInspectionState(null);
      setCompletedReport(null);
      setView('Dashboard');
    } else if (tab === 'Diagnostics' || tab === 'Assistant' || tab === 'Profile' || tab === 'Manual' || tab === 'Referral' || tab === 'Fleet' || tab === 'Reseller' || tab === 'Certification') {
      // Do NOT clear inspectionState — Diagnostics needs vehicleType from current inspection
      setView(tab as View);
    } else if (tab === 'Inspection') {
      handleNewInspection();
    }
  };

  const renderContent = () => {
    switch (view) {
      case 'Dashboard':
        return <CustomerDashboard user={user} onNewInspection={handleNewInspection} onViewReport={(r) => { setCompletedReport(r); setView('Report'); }} />;
      case 'Inspection':
        return <InspectionForm onFinalize={handleFinalize} />;
      case 'Wizard':
        return (
          <InspectionWizard
            onComplete={(data) => {
              // Convert wizard data into InspectionState and go to Finalize
              const sections: any[] = [];
              // Build checklist sections from wizard data
              if (data.checklist && Object.keys(data.checklist).length > 0) {
                const items = Object.entries(data.checklist).map(([name, status]) => ({
                  id: name.toLowerCase().replace(/\s+/g, '_'),
                  name,
                  status: status as 'pass' | 'fail' | 'na' | 'concern',
                  photos: [],
                  notes: data.notes?.[name] || '',
                }));
                sections.push({ name: 'Inspection', items });
              }
              const state: any = {
                vehicle: data.vehicle,
                vehicleType: data.vehicle.vehicleType || 'Standard',
                checklist: { sections },
                complianceChecklist: { sections: [] },
                overallNotes: '',
                odometer: data.vehicle.odometer || '',
                obdData: data.obdCodes?.length > 0 ? {
                  dtcCodes: data.obdCodes.map((code: string) => ({ code, description: 'DTC fault code' })),
                  liveData: data.obdLiveData || {},
                  connected: data.obdConnected || false,
                  deviceName: data.obdDeviceName || 'OBDLink MX+',
                } : undefined,
              };
              setInspectionState(state);
              setView('Finalize');
              setActiveTab('Inspection');
            }}
            onCancel={() => { setView('Dashboard'); setActiveTab('Dashboard'); }}
          />
        );
      case 'Finalize':
        if (!inspectionState) {
          setTimeout(() => {
            setView('Dashboard');
            setActiveTab('Dashboard');
          }, 0);
          return (
            <div className="flex items-center justify-center min-h-[60vh]">
              <p className="text-medium-text">Redirecting to dashboard...</p>
            </div>
          );
        }
        return <FinalizeScreen inspectionState={inspectionState} onReportComplete={handleReportComplete} />;
      case 'Report':
        if (!completedReport) {
          setTimeout(() => {
            setView('Dashboard');
            setActiveTab('Dashboard');
          }, 0);
          return (
            <div className="flex items-center justify-center min-h-[60vh]">
              <p className="text-medium-text">Redirecting to dashboard...</p>
            </div>
          );
        }
        return <ReportView report={completedReport} />;
      case 'Diagnostics':
        return <DiagnosticsTool vehicleType={inspectionState?.vehicleType} />;
      case 'Assistant':
        return <ChatBot />;
      case 'Profile':
        return <UserProfile user={user} onLogout={onLogout} />;
      case 'Manual':
        return <ManualPage onBack={() => { setView('Dashboard'); setActiveTab('Dashboard'); }} />;
      case 'Fleet':
        return <RentalFleetModule />;
      case 'Reseller':
        return <ResellerDashboard token={token || ''} />;
      case 'Referral':
        return <ReferralDashboard />;
      case 'Certification':
        return <CertificationCenter onClose={() => { setView('Dashboard'); setActiveTab('Dashboard'); }} onCertified={() => { /* badge stored in localStorage by CertificationCenter */ }} />;
      default:
        return <CustomerDashboard user={user} onNewInspection={handleNewInspection} onViewReport={(r) => { setCompletedReport(r); setView('Report'); }} />;
    }
  };

  return (
    <div className="min-h-screen bg-dark-bg text-light-text font-sans">
      {view === 'Wizard' ? (
        renderContent()
      ) : (
        <>
          <Header user={user} currentTab={activeTab} onTabChange={handleTabChange} onLogout={onLogout} extraControls={<LanguageToggle />} />
          <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
            {renderContent()}
          </main>
          <Footer />
        </>
      )}
    </div>
  );
};
