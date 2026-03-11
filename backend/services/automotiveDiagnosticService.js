// Automotive Diagnostic Service using Google Gemini Multimodal AI
// Analyzes engine sounds (audio) + parts inspection (visual) for accurate diagnosis
// Powered by Gemini 2.0 Flash with multimodal understanding

import { GoogleGenerativeAI } from '@google/generative-ai';
import fs from 'fs';
import path from 'path';

const geminiClient = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Analyze engine audio to diagnose mechanical issues
 * Can detect knocking, misfires, belt issues, bearing failures, etc.
 */
export const analyzeEngineSound = async (audioFile) => {
  try {
    console.log('[Diagnostic] Analyzing engine sound...');
    
    const model = geminiClient.getGenerativeModel({ 
      model: 'gemini-2.0-flash' // Supports audio + multimodal
    });

    // Read audio file
    const audioData = fs.readFileSync(audioFile);
    const audioBase64 = audioData.toString('base64');

    const prompt = `You are an expert automotive diagnostic technician with 30+ years of experience.

Analyze this engine audio recording and provide:

1. **Sound Identification**: What specific sounds do you hear? (knocking, ticking, whining, grinding, etc.)
2. **Problem Diagnosis**: What mechanical issues are indicated by these sounds?
3. **Severity Level**: Rate the urgency (Critical/High/Medium/Low)
4. **Root Cause**: What are the most likely underlying causes?
5. **Recommended Actions**: What repairs or inspections are needed?
6. **Parts Likely Needed**: List potential replacement parts
7. **Estimated Labor Time**: How long will the repair take?
8. **Cost Estimate Range**: Approximate repair cost (parts + labor)
9. **Timestamps**: If multiple issues, provide timestamps (MM:SS format)

Be specific and practical. Include technical details that would help a mechanic diagnose and fix the issue.`;

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: 'audio/wav', // Support wav, mp3, m4a, etc.
              data: audioBase64
            }
          }
        ]
      }]
    });

    const diagnosis = result.response.text();
    console.log('[Diagnostic] Engine sound analysis complete');
    
    return {
      success: true,
      diagnosis,
      analysisType: 'audio',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('[Diagnostic] Audio analysis failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Analyze part photos to identify defects, wear, damage
 * Can inspect brake pads, rotors, belts, hoses, engines, etc.
 */
export const analyzePartVisual = async (imageBase64, partDescription = '') => {
  try {
    console.log('[Diagnostic] Analyzing part visual...');
    
    const model = geminiClient.getGenerativeModel({ 
      model: 'gemini-2.0-flash'
    });

    // Remove data URI prefix if present
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');

    const prompt = `You are an expert automotive technician performing a detailed visual inspection.

${partDescription ? `Part being inspected: ${partDescription}` : 'Identify the automotive part in this image and inspect it.'}

Provide a comprehensive inspection report:

1. **Part Identification**: What part(s) are visible in the image?
2. **Condition Assessment**: Rate the condition (Excellent/Good/Fair/Poor/Failed)
3. **Defects Found**: List any visible defects, wear, cracks, corrosion, leaks
4. **Measurements**: Estimate remaining life/thickness where applicable (e.g., brake pad mm)
5. **Safety Concerns**: Any immediate safety hazards?
6. **Replacement Recommendation**: Does this part need replacement? (Immediate/Soon/Monitor/OK)
7. **Related Components**: What other parts should be inspected?
8. **Prognostication**: Estimated remaining lifespan
9. **Cost Estimate**: Approximate replacement cost (part + labor)

Be thorough and technical. Highlight areas of concern visually if possible.`;

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts: [
          { text: prompt },
          {
            inlineData: {
              mimeType: 'image/jpeg',
              data: base64Data
            }
          }
        ]
      }]
    });

    const inspection = result.response.text();
    console.log('[Diagnostic] Visual inspection complete');
    
    return {
      success: true,
      inspection,
      analysisType: 'visual',
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('[Diagnostic] Visual analysis failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Combined multimodal analysis - audio + visual + description
 * Most comprehensive diagnostic approach
 */
export const analyzeMultimodal = async ({
  audioFile = null,
  images = [],
  symptomDescription = '',
  vehicleInfo = {}
}) => {
  try {
    console.log('[Diagnostic] Performing multimodal analysis...');
    
    const model = geminiClient.getGenerativeModel({ 
      model: 'gemini-2.0-flash'
    });

    const parts = [];

    // Build comprehensive diagnostic prompt
    let prompt = `You are a master automotive diagnostic technician analyzing a vehicle issue.

**Vehicle Information:**
${vehicleInfo.year ? `Year: ${vehicleInfo.year}` : ''}
${vehicleInfo.make ? `Make: ${vehicleInfo.make}` : ''}
${vehicleInfo.model ? `Model: ${vehicleInfo.model}` : ''}
${vehicleInfo.mileage ? `Mileage: ${vehicleInfo.mileage}` : ''}

**Customer Description:**
${symptomDescription || 'No description provided'}

**Analysis Includes:**
${audioFile ? '- Engine/vehicle audio recording' : ''}
${images.length > 0 ? `- ${images.length} visual inspection photo(s)` : ''}

Provide a comprehensive diagnostic report:

1. **Primary Diagnosis**: What is the main issue?
2. **Supporting Evidence**: What in the audio/images confirms this?
3. **Differential Diagnosis**: What else could it be?
4. **Root Cause Analysis**: Why did this happen?
5. **Repair Plan**: Step-by-step fix procedure
6. **Parts Required**: Complete list with part numbers if possible
7. **Labor Time**: Estimated hours
8. **Total Cost Estimate**: Parts + labor breakdown
9. **Preventive Recommendations**: How to avoid future issues
10. **Urgency**: Can the vehicle be driven safely?

Be thorough, accurate, and practical.`;

    parts.push({ text: prompt });

    // Add audio if provided
    if (audioFile && fs.existsSync(audioFile)) {
      const audioData = fs.readFileSync(audioFile);
      parts.push({
        inlineData: {
          mimeType: 'audio/wav',
          data: audioData.toString('base64')
        }
      });
    }

    // Add images if provided
    for (const imageData of images) {
      const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: 'image/jpeg',
          data: base64Data
        }
      });
    }

    const result = await model.generateContent({
      contents: [{
        role: 'user',
        parts
      }]
    });

    const fullDiagnosis = result.response.text();
    console.log('[Diagnostic] Multimodal analysis complete');
    
    return {
      success: true,
      diagnosis: fullDiagnosis,
      analysisType: 'multimodal',
      inputsProcessed: {
        audio: !!audioFile,
        images: images.length,
        description: !!symptomDescription
      },
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('[Diagnostic] Multimodal analysis failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

/**
 * Get repair guidance with web search for latest TSBs and recalls
 */
export const getRepairGuidance = async (vehicleInfo, issue) => {
  try {
    console.log('[Diagnostic] Fetching repair guidance...');
    
    const model = geminiClient.getGenerativeModel({ 
      model: 'gemini-2.0-flash',
      tools: [{ googleSearchRetrieval: {} }] // Enable web search
    });

    const prompt = `Search for the latest information about:

Vehicle: ${vehicleInfo.year} ${vehicleInfo.make} ${vehicleInfo.model}
Issue: ${issue}

Find:
1. Technical Service Bulletins (TSBs)
2. Recall information  
3. Common problems for this vehicle
4. Repair procedures and best practices
5. OEM recommendations
6. Parts availability and alternatives

Provide current, accurate information with sources.`;

    const result = await model.generateContent(prompt);
    
    return {
      success: true,
      guidance: result.response.text(),
      timestamp: new Date().toISOString()
    };

  } catch (error) {
    console.error('[Diagnostic] Repair guidance failed:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

export default {
  analyzeEngineSound,
  analyzePartVisual,
  analyzeMultimodal,
  getRepairGuidance
};
