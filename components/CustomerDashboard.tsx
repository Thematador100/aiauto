import React, { useState, useEffect } from 'react';
import { User, CompletedReport } from '../types';
import { offlineService } from '../services/offlineService';
import { LoadingSpinner } from './LoadingSpinner';

interface CustomerDashboardProps {
  user: User;
  onNewInspection: () => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ user, onNewInspection }) => {
  const [reports, setReports] = useState<CompletedReport[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadReports = async () => {
        setIsLoading(true);
        // Live-ready: Only fetch from the actual data source (offline/backend).
        const localReports = await offlineService.getReports();
        setReports(localReports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
        setIsLoading(false);
    };
    loadReports();
  }, []);

  return (
    <div className="space-y-6">
      {/* EV-Ready Badge */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 p-4 rounded-lg border border-green-500">
        <div className="flex items-center gap-3">
          <div className="text-3xl">⚡</div>
          <div>
            <h3 className="text-white font-bold text-lg">✅ EV-Ready Platform</h3>
            <p className="text-green-100 text-sm">Now supports electric vehicle inspections! Full OBD2 diagnostics for EVs, battery health analysis, and EV-specific fraud detection.</p>
          </div>
        </div>
      </div>

      <div className="bg-dark-card p-6 rounded-lg border border-dark-border flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-light-text">Welcome, {user.email}</h1>
          <p className="text-medium-text">You are on the <span className="font-semibold text-primary">{user.plan}</span> plan.</p>
        </div>
        <button onClick={onNewInspection} className="bg-primary hover:bg-primary-light text-white font-bold py-3 px-6 rounded-lg transition-colors">
          + New Inspection
        </button>
      </div>

      <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
        <h2 className="text-xl font-semibold text-light-text mb-4">Recent Reports</h2>
        {isLoading ? (
            <div className="flex justify-center items-center h-48"><LoadingSpinner/></div>
        ) : reports.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-dark-border">
              <thead className="bg-dark-bg">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-medium-text uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-medium-text uppercase tracking-wider">Vehicle</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-medium-text uppercase tracking-wider">VIN</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-medium-text uppercase tracking-wider">Report ID</th>
                </tr>
              </thead>
              <tbody className="bg-dark-card divide-y divide-dark-border">
                {reports.map((report) => (
                  <tr key={report.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text">{new Date(report.date).toLocaleDateString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-light-text">{report.vehicle.year} {report.vehicle.make} {report.vehicle.model}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-medium-text font-mono">{report.vehicle.vin}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-medium-text">{report.id}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-medium-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="mt-2 text-lg font-medium text-light-text">No reports yet</h3>
            <p className="mt-1 text-sm text-medium-text">Get started by creating your first inspection.</p>
            <div className="mt-6">
              <button onClick={onNewInspection} className="bg-primary hover:bg-primary-light text-white font-bold py-2 px-4 rounded-lg transition-colors">
                Start New Inspection
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};