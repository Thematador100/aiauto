import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import dotenv from 'dotenv';
dotenv.config();

// Initialize AI providers
let geminiClient = null;
let deepseekClient = null;
let openaiClient = null;

// Gemini setup
if (process.env.GEMINI_API_KEY) {
  geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  console.log('✅ Gemini API initialized');
} else {
  console.warn('⚠️  GEMINI_API_KEY not configured - image analysis will use OpenAI Vision');
}

// DeepSeek setup (uses OpenAI-compatible API)
if (process.env.DEEPSEEK_API_KEY) {
  deepseekClient = new OpenAI({
    apiKey: process.env.DEEPSEEK_API_KEY,
    baseURL: 'https://api.deepseek.com/v1'
  });
  console.log('✅ DeepSeek API initialized');
} else {
  console.warn('⚠️  DEEPSEEK_API_KEY not configured');
}

// OpenAI setup
if (process.env.OPENAI_API_KEY) {
  openaiClient = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
  });
  console.log('✅ OpenAI API initialized');
} else {
  console.warn('⚠️  OPENAI_API_KEY not configured');
}

// Get preferred provider from environment
const PREFERRED_PROVIDER = (process.env.PREFERRED_AI_PROVIDER || 'deepseek').toLowerCase();
console.log(`🎯 Preferred AI Provider: ${PREFERRED_PROVIDER}`);

/**
 * Generate text using AI with automatic fallback
 * Respects PREFERRED_AI_PROVIDER environment variable
 * Falls back to other providers if preferred one fails
 * Priority: DeepSeek → OpenAI → Gemini
 */
export const generateText = async (prompt, options = {}) => {
  const { temperature = 0.7, maxTokens = 2000 } = options;
  const errors = [];

  const tryGemini = async () => {
    if (!geminiClient) throw new Error('Gemini not configured');
    console.log('[AI] Attempting with Gemini...');
    const model = geminiClient.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { temperature, maxOutputTokens: maxTokens }
    });
    return result.response.text();
  };

  const tryDeepSeek = async () => {
    if (!deepseekClient) throw new Error('DeepSeek not configured');
    console.log('[AI] Attempting with DeepSeek...');
    const completion = await deepseekClient.chat.completions.create({
      model: 'deepseek-chat',
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: maxTokens
    });
    return completion.choices[0].message.content;
  };

  const tryOpenAI = async () => {
    if (!openaiClient) throw new Error('OpenAI not configured');
    console.log('[AI] Attempting with OpenAI...');
    const completion = await openaiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature,
      max_tokens: maxTokens
    });
    return completion.choices[0].message.content;
  };

  const providers = { gemini: tryGemini, google: tryGemini, deepseek: tryDeepSeek, openai: tryOpenAI };

  if (providers[PREFERRED_PROVIDER]) {
    try {
      return await providers[PREFERRED_PROVIDER]();
    } catch (error) {
      errors.push(`${PREFERRED_PROVIDER}: ${error.message}`);
      console.error(`[AI] ${PREFERRED_PROVIDER} failed:`, error.message);
    }
  }

  // Cost-effective fallback order: DeepSeek (cheapest) → Gemini (free tier) → OpenAI
  const fallbackOrder = ['deepseek', 'gemini', 'openai'].filter(p => p !== PREFERRED_PROVIDER);
  for (const providerName of fallbackOrder) {
    if (providers[providerName]) {
      try {
        return await providers[providerName]();
      } catch (error) {
        errors.push(`${providerName}: ${error.message}`);
        console.error(`[AI] ${providerName} failed:`, error.message);
      }
    }
  }

  throw new Error(`All AI providers failed: ${errors.join('; ')}`);
};

/**
 * Analyze an image using AI vision models
 * Primary: Gemini Vision (free tier, cost-effective)
 * Fallback: OpenAI GPT-4o Vision
 */
export const analyzeImage = async (imageBase64, prompt) => {
  // Try Gemini Vision first (free tier - most cost-effective)
  if (geminiClient) {
    try {
      console.log('[AI] Analyzing image with Gemini Vision (gemini-1.5-flash)...');
      const model = geminiClient.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [
            { text: prompt },
            { inlineData: { mimeType: 'image/jpeg', data: base64Data } }
          ]
        }]
      });
      return result.response.text();
    } catch (error) {
      console.error('[AI] Gemini Vision failed:', error.message);
    }
  }

  // Fallback: OpenAI GPT-4o Vision
  if (openaiClient) {
    try {
      console.log('[AI] Analyzing image with OpenAI Vision (gpt-4o) [fallback]...');
      const base64Data = imageBase64.startsWith('data:') ? imageBase64 : `data:image/jpeg;base64,${imageBase64}`;
      const completion = await openaiClient.chat.completions.create({
        model: 'gpt-4o',
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { type: 'image_url', image_url: { url: base64Data, detail: 'high' } }
          ]
        }],
        max_tokens: 2000
      });
      return completion.choices[0].message.content;
    } catch (error) {
      console.error('[AI] OpenAI Vision failed:', error.message);
    }
  }

  throw new Error('No vision-capable AI provider available. Please configure GEMINI_API_KEY or OPENAI_API_KEY.');
};

/**
 * Analyze engine/vehicle audio using AI
 * Accepts a text description of audio symptoms (from Whisper transcription or user input)
 * Uses DeepSeek (preferred) → OpenAI → Gemini
 * 
 * @param {string} audioDescription - Text description of the audio (transcription or symptoms)
 * @param {object} vehicleInfo - Optional vehicle context { year, make, model, mileage, vehicleType }
 */
export const analyzeAudio = async (audioDescription, vehicleInfo = {}) => {
  const { year = '', make = '', model = '', mileage = '', vehicleType = 'Standard' } = vehicleInfo;
  const vehicleContext = [year, make, model].filter(Boolean).join(' ');

  const isCommercial = vehicleType === 'Commercial';

  const prompt = isCommercial
    ? `You are a certified heavy-duty diesel engine diagnostic specialist with expertise in Class 6-8 commercial trucks, Cummins, Detroit Diesel, PACCAR, and Volvo powertrains.

A vehicle inspector has recorded engine/drivetrain audio from a commercial vehicle${vehicleContext ? ` (${vehicleContext}${mileage ? `, ${mileage} miles` : ''})` : ''}.

Audio description / transcription:
"${audioDescription}"

Provide a professional diagnostic assessment:

## 🔊 Engine Audio Analysis

### Identified Sound Patterns
List each distinct sound pattern detected and what it indicates.

### Probable Causes
For each sound, list the most likely mechanical causes in order of probability.

### Severity Assessment
- **Critical (OOS Risk):** Issues that may cause Out-of-Service under FMCSR Part 396
- **High Priority:** Requires immediate attention before next dispatch
- **Monitor:** Track but not immediately dangerous

### Recommended Actions
Specific repair or inspection steps the technician should take.

### Estimated Repair Cost Range
Provide realistic cost ranges for the identified issues.

### Inspector Notes for Report
A concise, professional paragraph suitable for inclusion in the inspection report.`
    : `You are a master automotive technician with 20+ years of experience diagnosing engine and drivetrain issues by sound.

A vehicle inspector has recorded engine/drivetrain audio from a vehicle${vehicleContext ? ` (${vehicleContext}${mileage ? `, ${mileage} miles` : ''})` : ''}.

Audio description / transcription:
"${audioDescription}"

Provide a professional diagnostic assessment:

## 🔊 Engine Audio Analysis

### Identified Sound Patterns
List each distinct sound pattern detected and what it indicates.

### Probable Causes
For each sound, list the most likely mechanical causes in order of probability.

### Severity Assessment
- **🔴 Critical:** Safety risk or imminent failure — do not purchase/drive
- **🟠 High Priority:** Significant repair needed, factor into price negotiation
- **🟡 Moderate:** Should be addressed soon, minor negotiating point
- **🟢 Minor:** Normal wear, informational only

### Recommended Actions
Specific repair or inspection steps the technician should take next.

### Estimated Repair Cost Range
Provide realistic cost ranges for the identified issues.

### Red Flags for Buyer
Any sounds that suggest the seller may be masking problems (e.g., fresh oil to quiet lifters, seafoam treatment, etc.).

### Inspector Notes for Report
A concise, professional paragraph suitable for inclusion in the inspection report.`;

  return await generateText(prompt, { temperature: 0.4, maxTokens: 2500 });
};

export default { generateText, analyzeImage, analyzeAudio };
