// Universal AI Service - Supports DeepSeek and Gemini
import { DTCCode } from '../types';

// AI Provider Configuration
const DEEPSEEK_API_KEY = import.meta.env.VITE_DEEPSEEK_API_KEY;
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Determine which provider to use (Gemini is cheaper for this use case!)
const AI_PROVIDER = GEMINI_API_KEY ? 'gemini' : DEEPSEEK_API_KEY ? 'deepseek' : null;

if (!AI_PROVIDER) {
  console.warn('No AI provider configured. Please set VITE_DEEPSEEK_API_KEY or VITE_GEMINI_API_KEY');
}

/**
 * Call AI API with OpenAI-compatible interface
 */
async function callAI(prompt: string, systemPrompt?: string): Promise<string> {
  if (AI_PROVIDER === 'deepseek') {
    return callDeepSeek(prompt, systemPrompt);
  } else if (AI_PROVIDER === 'gemini') {
    return callGemini(prompt, systemPrompt);
  } else {
    throw new Error('No AI provider configured');
  }
}

/**
 * Call DeepSeek API (OpenAI-compatible)
 */
async function callDeepSeek(prompt: string, systemPrompt?: string): Promise<string> {
  const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        ...(systemPrompt ? [{ role: 'system', content: systemPrompt }] : []),
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 2000,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DeepSeek API error: ${error}`);
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

/**
 * Call Gemini API
 */
async function callGemini(prompt: string, systemPrompt?: string): Promise<string> {
  const fullPrompt = systemPrompt ? `${systemPrompt}\n\n${prompt}` : prompt;
  
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: fullPrompt }]
        }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 2000,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${error}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

/**
 * Analyzes Diagnostic Trouble Codes (DTCs)
 */
export const analyzeDTCCodes = async (codes: DTCCode[]): Promise<string> => {
  const codeList = codes.map(c => c.code).join(', ');
  
  const systemPrompt = 'You are an expert automotive diagnostic AI with deep knowledge of vehicle systems, diagnostic trouble codes, and repair procedures.';
  
  const prompt = `
Analyze the following Diagnostic Trouble Codes (DTCs): ${codeList}

For each code, provide:
1. A clear, concise definition of what the code means
2. Common symptoms associated with the code
3. Most likely causes, ordered from most probable to least probable
4. Step-by-step diagnostic and repair plan for a qualified mechanic

If multiple codes are present that are likely related (e.g., a system lean code with multiple cylinder misfires), explain the relationship and suggest a prioritized diagnostic approach.

Format the response in clear, easy-to-read Markdown. Use headings for each code and bold text for emphasis.
  `;

  try {
    return await callAI(prompt, systemPrompt);
  } catch (error) {
    console.error('Error analyzing DTC codes:', error);
    throw new Error('Failed to analyze DTC codes. The AI service may be temporarily unavailable.');
  }
};

/**
 * Generates a comprehensive vehicle inspection report
 */
export const generateInspectionReport = async (
  inspectionData: any,
  vehicleInfo: any
): Promise<string> => {
  const systemPrompt = 'You are a professional vehicle inspector creating detailed inspection reports.';
  
  const prompt = `
Generate a comprehensive vehicle inspection report for the following vehicle:

**Vehicle Information:**
- Year: ${vehicleInfo.year}
- Make: ${vehicleInfo.make}
- Model: ${vehicleInfo.model}
- VIN: ${vehicleInfo.vin}
- Odometer: ${vehicleInfo.odometer} miles

**Inspection Findings:**
${JSON.stringify(inspectionData, null, 2)}

Create a professional report that includes:
1. Executive Summary
2. Vehicle Overview
3. Detailed Findings (organized by system)
4. Safety Concerns (if any)
5. Recommended Repairs (prioritized by urgency)
6. Overall Assessment

Format in professional Markdown suitable for PDF export.
  `;

  try {
    return await callAI(prompt, systemPrompt);
  } catch (error) {
    console.error('Error generating report:', error);
    throw new Error('Failed to generate inspection report.');
  }
};

/**
 * Chat assistant for vehicle questions
 */
export const chatWithAI = async (
  message: string,
  conversationHistory?: Array<{ role: string; content: string }>
): Promise<string> => {
  const systemPrompt = `You are an expert automotive assistant helping with vehicle inspections, diagnostics, and repairs. 
Provide accurate, helpful information about vehicles, maintenance, and common issues.`;

  try {
    if (AI_PROVIDER === 'deepseek') {
      // DeepSeek supports conversation history
      const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'deepseek-chat',
          messages: [
            { role: 'system', content: systemPrompt },
            ...(conversationHistory || []),
            { role: 'user', content: message },
          ],
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      return data.choices[0].message.content;
    } else {
      // Gemini - simple call
      return await callAI(message, systemPrompt);
    }
  } catch (error) {
    console.error('Error in chat:', error);
    throw new Error('Failed to get AI response.');
  }
};

/**
 * Get current AI provider info
 */
export const getAIProviderInfo = () => {
  return {
    provider: AI_PROVIDER,
    available: !!AI_PROVIDER,
    name: AI_PROVIDER === 'deepseek' ? 'DeepSeek' : AI_PROVIDER === 'gemini' ? 'Google Gemini' : 'None',
  };
};
