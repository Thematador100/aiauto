import React, { useState, useEffect } from 'react';
import { InspectionState, CompletedReport, ReportSection, ReportSectionItem, InspectionSection, VehicleGrade, DamageAssessment } from '../types';
import { getVehicleHistory } from '../services/vehicleHistoryService';
import { getSafetyRecalls, getTheftAndSalvageRecord } from '../services/vehicleExtraDataService';
import { generateReportSummary } from '../services/geminiService';
import { offlineService } from '../services/offlineService';
import { predictiveMaintenanceService } from '../services/predictiveMaintenanceService';
import { LoadingSpinner } from './LoadingSpinner';

/** Categories containing exterior photos suitable for AI damage analysis */
const EXTERIOR_CATEGORIES = [
  'Exterior & Body', 'Body & Paint', 'Coach Exterior', 'Cab Exterior',
  'Frame & Undercarriage', 'Frame, Wheels & Tires',
];

/**
 * Calculate overall vehicle grade from inspection results
 */
const calculateVehicleGrade = (
  sections: ReportSection[],
  complianceSections: ReportSection[],
  hasAccident: boolean,
  recallCount: number,
  isSalvage: boolean
): VehicleGrade => {
  const allSections = [...sections, ...complianceSections];
  const passCount = allSections.reduce((sum, s) => sum + s.items.filter(i => i.status === 'Pass').length, 0);
  const failCount = allSections.reduce((sum, s) => sum + s.items.filter(i => i.status === 'Fail').length, 0);
  const concernCount = allSections.reduce((sum, s) => sum + s.items.filter(i => i.status === 'Concern').length, 0);
  const checkedItems = passCount + failCount + concernCount;

  let score = checkedItems > 0 ? Math.round((passCount / checkedItems) * 100) : 50;

  if (hasAccident) score -= 10;
  if (isSalvage) score -= 20;
  score -= Math.min(recallCount * 3, 15);
  score -= failCount * 2;
  score -= Math.floor(concernCount * 0.5);
  score = Math.max(0, Math.min(100, score));

  let letter: string;
  let buyRecommendation: string;
  if (score >= 90) { letter = 'A'; buyRecommendation = 'Strong Buy'; }
  else if (score >= 80) { letter = 'B'; buyRecommendation = 'Buy with Confidence'; }
  else if (score >= 65) { letter = 'C'; buyRecommendation = 'Buy with Caution - Negotiate Repairs'; }
  else if (score >= 50) { letter = 'D'; buyRecommendation = 'Significant Issues - Negotiate Hard or Walk Away'; }
  else { letter = 'F'; buyRecommendation = 'Walk Away - Too Many Issues'; }

  const avgRepairPerFail = 350;
  const avgRepairPerConcern = 120;
  const estimatedCost = (failCount * avgRepairPerFail) + (concernCount * avgRepairPerConcern);
  const estimatedRepairCost = estimatedCost > 0 ? `$${estimatedCost.toLocaleString()} - $${Math.round(estimatedCost * 1.5).toLocaleString()}` : 'None expected';

  return { letter, score, buyRecommendation, estimatedRepairCost };
};

interface FinalizeScreenProps {
  inspectionState: InspectionState;
  onReportComplete: (report: CompletedReport) => void;
}

const parseSummary = (summaryText: string) => {
    const overallConditionMatch = summaryText.match(/### 1\. Overall Condition Assessment\s*([\s\S]*?)(?=### 2\.|$)/);
    const keyFindingsMatch = summaryText.match(/### 2\. Key Findings\s*([\s\S]*?)(?=### 3\.|$)/);
    const recommendationsMatch = summaryText.match(/### 3\. Recommendations\s*([\s\S]*)/);

    const parseList = (text: string | undefined) => text ? text.trim().split('\n').map(s => s.replace(/^- \s*/, '').trim()).filter(Boolean) : [];

    return {
        overallCondition: overallConditionMatch ? overallConditionMatch[1].trim() : "Summary could not be generated.",
        keyFindings: keyFindingsMatch ? parseList(keyFindingsMatch[1]) : [],
        recommendations: recommendationsMatch ? parseList(recommendationsMatch[1]) : []
    };
};

const buildReportSections = (checklist: InspectionSection): ReportSection[] => {
  const sections: ReportSection[] = [];

  for (const [category, items] of Object.entries(checklist)) {
    if (!Array.isArray(items) || items.length === 0) continue;

    const reportItems: ReportSectionItem[] = items.map((item) => {
      let status: 'Pass' | 'Fail' | 'Concern' | 'N/A';
      switch (item.condition) {
        case 'pass': status = 'Pass'; break;
        case 'fail': status = 'Fail'; break;
        case 'concern': status = 'Concern'; break;
        case 'na': status = 'N/A'; break;
        default:
          status = item.checked ? 'Pass' : 'N/A';
      }

      return {
        check: item.item,
        status,
        details: item.notes || '',
        photos: item.photos.map(p => ({
          category: p.category,
          url: `data:${p.mimeType};base64,${p.base64}`,
          notes: p.notes,
        })),
      };
    });

    const failCount = reportItems.filter(i => i.status === 'Fail').length;
    const concernCount = reportItems.filter(i => i.status === 'Concern').length;
    const passCount = reportItems.filter(i => i.status === 'Pass').length;
    const parts: string[] = [];
    if (passCount > 0) parts.push(`${passCount} passed`);
    if (failCount > 0) parts.push(`${failCount} failed`);
    if (concernCount > 0) parts.push(`${concernCount} concerns`);

    sections.push({
      title: category,
      notes: parts.length > 0 ? parts.join(', ') : 'Not inspected',
      items: reportItems,
    });
  }

  return sections;
};

export const FinalizeScreen: React.FC<FinalizeScreenProps> = ({ inspectionState, onReportComplete }) => {
  const [status, setStatus] = useState('Starting...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const generateReport = async () => {
      try {
        const startTime = new Date().toISOString();
        let gpsLocation: { lat: number; lng: number; address?: string } | undefined;
        try {
          const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
            navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 })
          );
          gpsLocation = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          try {
            const geo = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${gpsLocation.lat}&lon=${gpsLocation.lng}&format=json`);
            const geoData = await geo.json();
            gpsLocation.address = geoData.display_name?.split(',').slice(0, 3).join(',') || undefined;
          } catch { /* GPS without address is fine */ }
        } catch { /* GPS not available */ }
        setStatus('Fetching vehicle history...');
        const historyPromise = getVehicleHistory(inspectionState.vehicle.vin);

        setStatus('Checking for safety recalls...');
        const recallsPromise = getSafetyRecalls(inspectionState.vehicle.vin);

        setStatus('Checking for theft & salvage records...');
        const theftPromise = getTheftAndSalvageRecord(inspectionState.vehicle.vin);

        setStatus('Generating AI summary...');
        const summaryPromise = generateReportSummary(inspectionState);

        // Collect exterior photos for AI damage detection
        setStatus('Scanning for body damage...');
        const damagePromise = (async (): Promise<DamageAssessment | null> => {
          try {
            const allItems = [
              ...Object.entries(inspectionState.checklist),
              ...Object.entries(inspectionState.complianceChecklist),
            ];
            const exteriorPhotos: string[] = [];
            for (const [category, items] of allItems) {
              if (!Array.isArray(items)) continue;
              const isExterior = EXTERIOR_CATEGORIES.some(c => category.toLowerCase().includes(c.toLowerCase()));
              if (!isExterior) continue;
              for (const item of items) {
                for (const photo of item.photos) {
                  if (exteriorPhotos.length < 8) {
                    exteriorPhotos.push(photo.base64);
                  }
                }
              }
            }
            if (exteriorPhotos.length === 0) return null;

            const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://auto.srv1171019.hstgr.cloud';
            const response = await fetch(`${BACKEND_URL}/api/fraud/analyze-damage`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`,
              },
              body: JSON.stringify({
                photos: exteriorPhotos.map(b64 => ({ base64: b64 })),
                vehicleType: inspectionState.vehicleType,
                vin: inspectionState.vehicle.vin,
              }),
            });
            if (!response.ok) return null;
            const result = await response.json();
            return {
              overallSeverity: result.overallSeverity,
              accidentLikelihood: result.accidentLikelihood,
              findings: result.findings || [],
            };
          } catch {
            return null; // Don't block report generation if damage detection fails
          }
        })();

        setStatus('Running predictive maintenance analysis...');
        const maintenancePromise = (async () => {
          try {
            const odometerNum = parseInt(inspectionState.odometer?.replace(/[^0-9]/g, '') || '0');
            const dtcCodes = inspectionState.obdData?.dtcCodes?.map((d: any) => d.code) || [];
            return await predictiveMaintenanceService.predictMaintenance({
              year: parseInt(inspectionState.vehicle.year || '2000'),
              make: inspectionState.vehicle.make || '',
              model: inspectionState.vehicle.model || '',
              odometer: odometerNum,
              dtcCodes,
              liveData: inspectionState.obdData?.liveData,
            });
          } catch { return null; }
        })();
        const [history, recalls, theftRecord, summaryText, damageAssessment, maintenanceResult] = await Promise.all([historyPromise, recallsPromise, theftPromise, summaryPromise, damagePromise, maintenancePromise]);

        setStatus('Compiling final report...');
        const summary = parseSummary(summaryText);
        const sections = buildReportSections(inspectionState.checklist);
        const complianceSections = buildReportSections(inspectionState.complianceChecklist);

        setStatus('Calculating vehicle grade...');
        const vehicleGrade = calculateVehicleGrade(
          sections,
          complianceSections,
          history.hasAccident,
          recalls.length,
          theftRecord.isSalvage
        );

        // Inspector info from logged-in user
        const userEmail = localStorage.getItem('userEmail') || sessionStorage.getItem('userEmail') || '';
        const userName = localStorage.getItem('userName') || sessionStorage.getItem('userName') || userEmail.split('@')[0] || 'Inspector';
        const userCompany = localStorage.getItem('userCompany') || sessionStorage.getItem('userCompany') || '';

        const newReport: CompletedReport = {
          id: `rep-${Date.now()}`,
          date: new Date().toISOString(),
          vehicle: inspectionState.vehicle,
          vehicleType: inspectionState.vehicleType,
          odometer: inspectionState.odometer,
          summary,
          vehicleGrade,
          inspectorInfo: {
            name: userName,
            company: userCompany || undefined,
          },
          damageAssessment: damageAssessment || undefined,
          sections,
          complianceSections,
          vehicleHistory: history,
          safetyRecalls: recalls,
          theftAndSalvage: theftRecord,
          obdData: inspectionState.obdData,
          predictiveMaintenance: maintenanceResult ? {
            overallHealthScore: maintenanceResult.overall,
            predictions: maintenanceResult.predictions,
          } : undefined,
          inspectionMeta: {
            startTime,
            endTime: new Date().toISOString(),
            durationMinutes: Math.round((Date.now() - new Date(startTime).getTime()) / 60000),
            gpsLocation,
            inspectionMode: (inspectionState as any).inspectionMode || 'standard',
          },
        };

        setStatus('Saving report...');
        await offlineService.saveReport(newReport);

        setStatus('Done!');
        onReportComplete(newReport);
      } catch (err) {
        console.error("Failed to generate report:", err);
        const message = err instanceof Error ? err.message : "An unexpected error occurred.";
        setError(`Report generation failed: ${message}`);
      }
    };

    generateReport();
  }, [inspectionState, onReportComplete]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <div className="bg-dark-card p-8 rounded-lg border border-dark-border text-center max-w-lg w-full">
            <h1 className="text-2xl font-bold text-light-text mb-4">Generating Your Report</h1>
            <p className="text-medium-text mb-6">Please wait a moment while we compile the data and generate the AI-powered summary.</p>

            <div className="flex justify-center items-center h-20">
                <LoadingSpinner />
            </div>

            <p className="text-sm text-primary font-semibold">{status}</p>

            {error && (
                <div className="mt-6 bg-red-900/50 border border-red-700 text-red-300 p-4 rounded-md text-left">
                    <h3 className="font-bold">An Error Occurred</h3>
                    <p className="text-sm mt-1">{error}</p>
                </div>
            )}
        </div>
    </div>
  );
};
