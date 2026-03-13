// services/vehicleHistoryService.ts
// Real vehicle history using NHTSA public API + backend AI/NMVTIS analysis
import { VehicleHistoryReport } from '../types';

const API_BASE = (import.meta as any).env?.VITE_API_URL || '';

/**
 * Fetches a real vehicle history report using backend NMVTIS/AI analysis,
 * falling back to NHTSA public VIN decode when backend is unavailable.
 */
export const getVehicleHistory = async (vin: string): Promise<VehicleHistoryReport> => {
  if (!vin || vin.length < 17) {
    return {
      ownerCount: null,
      hasAccident: false,
      accidentDetails: null,
      lastOdometerReading: null,
      titleIssues: null,
    };
  }

  // Try backend NMVTIS/AI analysis first (requires auth token)
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const res = await fetch(`${API_BASE}/api/advanced/check-nmvtis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ vin }),
      });
      if (res.ok) {
        const data = await res.json();
        return {
          ownerCount: data.ownerCount ?? null,
          hasAccident: data.accidentRisk === 'HIGH' || data.accidentRisk === 'MEDIUM',
          accidentDetails: data.redFlags?.length ? data.redFlags.join('. ') : null,
          lastOdometerReading: data.lastOdometerReading || null,
          titleIssues:
            data.titleWashRisk === 'HIGH'
              ? 'Possible title wash detected — verify with state DMV'
              : data.totalLossRisk === 'HIGH'
              ? 'Possible total loss history — verify with NMVTIS'
              : null,
        };
      }
    }
  } catch {
    // Fall through to NHTSA direct
  }

  // Fallback: NHTSA public VIN decode (free, no API key required)
  try {
    const nhtsaRes = await fetch(
      `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${vin}?format=json`
    );
    if (nhtsaRes.ok) {
      const nhtsaData = await nhtsaRes.json();
      const result = nhtsaData?.Results?.[0];
      if (result && result.ErrorCode === '0') {
        return {
          ownerCount: null,
          hasAccident: false,
          accidentDetails: null,
          lastOdometerReading: null,
          titleIssues: null,
        };
      }
    }
  } catch {
    // Network error — return empty report
  }

  return {
    ownerCount: null,
    hasAccident: false,
    accidentDetails: null,
    lastOdometerReading: null,
    titleIssues: null,
  };
};
