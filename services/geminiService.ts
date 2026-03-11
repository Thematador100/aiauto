import { GoogleGenAI, GenerateContentResponse, Chat, GroundingChunk } from '@google/genai';
import { DTCCode, GroundingSource, InspectionState } from '../types';
import { backendService } from './backendService';

/**
 * IMPORTANT: This service now proxies all AI requests through the Railway backend.
 * API keys are stored securely on the backend - NEVER in the frontend!
 *
 * Legacy direct API calls have been replaced with backend service calls.
 */

/**
 * Analyzes a list of Diagnostic Trouble Codes (DTCs) via backend AI service
 * Backend handles API keys securely (Gemini/DeepSeek/OpenAI with automatic fallback)
 * @param codes An array of DTC codes.
 * @returns A formatted string with analysis and repair suggestions.
 */
export const analyzeDTCCodes = async (codes: DTCCode[]): Promise<string> => {
  console.log('[GeminiService] Proxying DTC analysis through Railway backend');
  return await backendService.analyzeDTCCodes(codes);
};

/**
 * Send a chat message to the AI assistant via backend
 * Backend uses multi-provider fallback (Gemini → DeepSeek → OpenAI)
 * Includes self-healing: returns helpful fallback response if AI fails
 */
export const sendChatMessage = async (
  message: string,
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }> = []
): Promise<{ response: string; fallback?: boolean }> => {
  console.log('[GeminiService] Sending chat message through backend');

  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://auto.srv1171019.hstgr.cloud';

    const response = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({ message, conversationHistory }),
    });

    if (!response.ok) {
      throw new Error(`Backend responded with ${response.status}`);
    }

    const data = await response.json();
    return {
      response: data.response,
      fallback: data.fallback || false
    };
  } catch (error) {
    console.error('[GeminiService] Chat error:', error);
    // Self-healing: return helpful fallback even if backend is down
    return {
      response: "I'm experiencing connection issues. Please check:\n\n1. Your internet connection\n2. That you're logged in\n3. Try refreshing the page\n\nIn the meantime, you can use the inspection tools, OBD scanner, and other features in the app.",
      fallback: true
    };
  }
};

// Legacy function - kept for compatibility but deprecated
export const createChatSession = (location: { latitude: number; longitude: number } | null): any => {
  console.warn('[GeminiService] createChatSession is deprecated. Use sendChatMessage instead.');
  return null;
};

/**
 * Extracts grounding sources from a Gemini API response.
 * @param response The GenerateContentResponse from the API.
 * @returns An array of formatted GroundingSource objects.
 */
export const extractGroundingSources = (response: GenerateContentResponse): GroundingSource[] => {
    const groundingMetadata = response.candidates?.[0]?.groundingMetadata;
    if (!groundingMetadata?.groundingChunks) {
        return [];
    }

    return groundingMetadata.groundingChunks.map((chunk: GroundingChunk) => {
        if (chunk.web) {
            return { uri: chunk.web.uri, title: chunk.web.title };
        }
        if (chunk.maps) {
            return { uri: chunk.maps.uri, title: chunk.maps.title };
        }
        return null;
    }).filter((source): source is { uri: string; title: string } => source !== null && source.title !== undefined) as GroundingSource[];
};


/**
 * Generates a comprehensive vehicle inspection report summary via backend AI service
 * Backend handles API keys securely (Gemini/DeepSeek/OpenAI with automatic fallback)
 * @param inspectionState The collected data from the inspection form.
 * @returns A string containing the formatted report summary.
 */
export const generateReportSummary = async (inspectionState: InspectionState): Promise<string> => {
  console.log('[GeminiService] Proxying report generation through Railway backend');
  return await backendService.generateReportSummary(inspectionState);
};
