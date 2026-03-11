import { CompletedReport } from '../types';
import { DTCCode, InspectionState } from '../types';

// Backend API URL from environment variables
const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://auto.srv1171019.hstgr.cloud';

/**
 * Backend API client for Railway backend
 * All API keys are stored securely on the backend
 */
export const backendService = {
  /**
   * Save a completed inspection report
   */
  async saveReport(report: CompletedReport): Promise<{ success: true; reportId: string }> {
    console.log('[Backend] Saving report to Railway backend:', BACKEND_URL);

    try {
      // Get auth token
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const response = await fetch(`${BACKEND_URL}/api/reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify(report),
      });

      if (!response.ok) {
        throw new Error(`Backend responded with ${response.status}`);
      }

      const data = await response.json();
      return { success: true, reportId: data.reportId || report.id };
    } catch (error) {
      console.error('[Backend] Error saving report:', error);
      // Fallback: Return success locally if backend is down
      return { success: true, reportId: report.id };
    }
  },

  /**
   * Get all reports from backend
   */
  async getReports(): Promise<CompletedReport[]> {
    console.log('[Backend] Fetching reports from Railway backend:', BACKEND_URL);

    try {
      // Get auth token
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const response = await fetch(`${BACKEND_URL}/api/reports`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      });

      if (!response.ok) {
        throw new Error(`Backend responded with ${response.status}`);
      }

      const data = await response.json();
      return data.reports || [];
    } catch (error) {
      console.error('[Backend] Error fetching reports:', error);
      return [];
    }
  },

  /**
   * Analyze DTC codes using backend AI service
   * Backend handles API keys securely (Gemini/DeepSeek/OpenAI)
   */
  async analyzeDTCCodes(codes: DTCCode[]): Promise<string> {
    console.log('[Backend] Analyzing DTC codes via Railway backend:', BACKEND_URL);

    try {
      // Get auth token
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const response = await fetch(`${BACKEND_URL}/api/analyze-dtc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ codes }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Backend responded with ${response.status}`);
      }

      const data = await response.json();
      return data.analysis;
    } catch (error) {
      console.error('[Backend] Error analyzing DTC codes:', error);
      throw new Error(`Failed to analyze DTC codes: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Generate inspection report summary using backend AI service
   * Backend handles API keys securely (Gemini/DeepSeek/OpenAI)
   */
  async generateReportSummary(inspectionState: InspectionState): Promise<string> {
    console.log('[Backend] Generating report summary via Railway backend:', BACKEND_URL);

    try {
      // Get auth token
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const response = await fetch(`${BACKEND_URL}/api/generate-report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ inspectionState }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Backend responded with ${response.status}`);
      }

      const data = await response.json();
      return data.summary;
    } catch (error) {
      console.error('[Backend] Error generating report summary:', error);
      throw new Error(`Failed to generate report: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },

  /**
   * Detect vehicle features from image using backend AI vision service
   * Backend handles API keys securely (Gemini)
   */
  async detectVehicleFeatures(imageBase64: string): Promise<string[]> {
    console.log('[Backend] Detecting vehicle features via Railway backend:', BACKEND_URL);

    try {
      // Get auth token
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');

      const response = await fetch(`${BACKEND_URL}/api/detect-features`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ image: imageBase64 }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errorData.error || `Backend responded with ${response.status}`);
      }

      const data = await response.json();
      return data.features || [];
    } catch (error) {
      console.error('[Backend] Error detecting features:', error);
      return ['Feature detection unavailable'];
    }
  },

  /**
   * Health check for backend
   */
  async healthCheck(): Promise<{ status: string; timestamp: number }> {
    try {
      const response = await fetch(`${BACKEND_URL}/api/health`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error(`Backend health check failed: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Backend] Health check passed:', data);
      return data;
    } catch (error) {
      console.error('[Backend] Health check failed:', error);
      return { status: 'offline', timestamp: Date.now() };
    }
  },
};
