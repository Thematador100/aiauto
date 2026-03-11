import express from 'express';
import { generateText, analyzeImage, analyzeAudio } from '../config/aiProviders.js';

const router = express.Router();

/**
 * POST /api/analyze-dtc
 * Analyze Diagnostic Trouble Codes using AI
 * Requires authentication
 */
router.post('/analyze-dtc', async (req, res) => {
  try {
    const { codes, vehicleType } = req.body;

    if (!codes || !Array.isArray(codes) || codes.length === 0) {
      return res.status(400).json({ error: 'Codes array is required' });
    }

    console.log(`[AI] Analyzing ${codes.length} DTC codes for user ${req.user.email} (type: ${vehicleType || 'Standard'})`);

    // Detect if these are J1939 SPN/FMI codes (commercial trucks) or standard OBD-II DTCs
    const isJ1939 = vehicleType === 'Commercial' || codes.some(c =>
      c.code && (c.code.startsWith('SPN') || c.code.includes('FMI') || /^\d{2,5}\s*\/\s*\d{1,2}$/.test(c.code))
    );

    // Format codes for AI
    const codesList = codes.map(c => `${c.code}: ${c.description || 'No description'}`).join('\n');

    let prompt;
    if (isJ1939) {
      prompt = `You are an expert heavy-duty commercial vehicle diagnostic technician certified in SAE J1939 CAN bus diagnostics. You specialize in Class 6-8 trucks, semi-tractors, and commercial fleet vehicles.

Analyze these J1939 SPN/FMI fault codes and provide:

1. **Fault Summary**: What these SPN/FMI codes indicate about the vehicle's condition
2. **Root Cause Analysis**: The most likely underlying causes, considering how these faults may be interrelated on a heavy-duty diesel platform
3. **FMCSA/DOT Impact**: Whether any of these faults would result in an Out-of-Service (OOS) order during a roadside DOT inspection per FMCSR Part 396
4. **Repair Priority**: Recommended repair actions prioritized by safety severity (critical safety / derate risk / monitor)
5. **Fleet Impact**: Estimated downtime and whether the truck can safely continue operating or needs immediate shop attention
6. **Related Systems**: Identify if faults span multiple ECUs (engine, transmission, ABS, aftertreatment) and how they may be connected

J1939 Fault Codes (SPN/FMI format):
${codesList}

Provide a professional fleet-grade analysis. Reference specific SAE J1939 SPN definitions and FMI failure modes. Flag any codes that indicate imminent derate or shutdown conditions.`;
    } else {
      prompt = `You are an expert automotive diagnostic technician. Analyze these OBD-II trouble codes and provide:

1. A summary of what these codes indicate
2. The likely root causes
3. Recommended repair actions (prioritized)
4. Estimated severity (critical/moderate/minor)
5. Whether these issues are related

Diagnostic Trouble Codes:
${codesList}

Provide a professional analysis that a vehicle inspector can share with their client.`;
    }

    const analysis = await generateText(prompt, { temperature: 0.5, maxTokens: 2000 });

    res.json({
      analysis,
      codesAnalyzed: codes.length,
      codeFormat: isJ1939 ? 'J1939 SPN/FMI' : 'OBD-II DTC',
      provider: 'AI (Gemini/DeepSeek/OpenAI)'
    });
  } catch (error) {
    console.error('[AI] DTC analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze DTC codes', details: error.message });
  }
});

// Vehicle-type-specific system instructions for AI report generation
const VEHICLE_TYPE_PROMPTS = {
  Commercial: `You are a certified FMCSA commercial vehicle inspector generating a DOT-compliant inspection report for an 18-wheeler / commercial truck.
Focus on Federal Motor Carrier Safety Regulations compliance. Flag any items that would result in an Out-of-Service (OOS) order.
Include sections for: Air brake system integrity, tire/wheel compliance (steer >4/32", drive >2/32"), DOT lighting and reflective tape, fifth wheel coupling, frame integrity, and safety equipment.
Reference FMCSR Part 396 (Inspection, Repair, and Maintenance) standards where applicable.`,

  Truck: `You are a professional automotive inspector generating a comprehensive pre-purchase or condition inspection report for a pickup truck or light-duty truck.
Focus on truck-specific concerns including: frame integrity (check for bends, cracks, or prior accident repair), tow package condition and rated capacity, 4WD/AWD system operation (engage both High and Low range), truck bed condition (rust, damage, liner integrity), differential and transfer case fluid levels, and any evidence of overloading or towing abuse.
Note the tow/payload capacity sticker and compare to evidence of use. Flag any safety concerns with the hitch, trailer wiring, or brake controller.`,

  RV: `You are a certified RV inspector generating a comprehensive habitability and mechanical inspection report for a recreational vehicle (motorhome or travel trailer).
Focus on both roadworthiness AND livability. RV-specific concerns include: LP gas system safety (leak testing, regulator condition), water system integrity (freshwater, gray, black tanks), electrical systems (shore power, inverter/converter, GFCI), roof and sidewall condition (delamination, water intrusion), slide-out mechanisms, and all safety detectors (smoke, CO, LP).
Reference NFPA 1192 (Standard on Recreational Vehicles) and RVIA standards where applicable.`,

  Classic: `You are a certified classic/vintage vehicle appraiser generating a detailed condition and authenticity report for a collector car.
Focus on: Numbers matching verification (VIN, engine, transmission casting numbers), originality assessment (paint, interior, drivetrain components), rust and body integrity (hidden rust behind panels, bondo/filler detection), and provenance documentation (chain of ownership, build sheets, restoration records).
Use standard collector car grading where applicable (Condition 1-6 scale or Excellent/Good/Fair/Poor). Note any deviations from factory specifications.`,

  Standard: `You are a professional automotive inspector generating a comprehensive pre-purchase or condition inspection report for a standard passenger vehicle.`,

  EV: `You are a professional EV inspector generating a comprehensive inspection report for an electric vehicle. Focus on battery State of Health (SoH), charging system, thermal management, regenerative braking, and ADAS systems.`,

  Motorcycle: `You are a professional motorcycle inspector generating a comprehensive inspection report. Focus on frame integrity, tire condition and age, brake system, chain/belt/shaft drive, and electrical systems.`,
};

/**
 * POST /api/generate-report
 * Generate comprehensive vehicle inspection report using AI
 * Requires authentication
 */
router.post('/generate-report', async (req, res) => {
  try {
    const { inspectionState } = req.body;

    if (!inspectionState) {
      return res.status(400).json({ error: 'Inspection state data is required' });
    }

    console.log(`[AI] Generating inspection report for user ${req.user.email}`);

    // Support both field naming conventions (vehicle or vehicleInfo)
    const vehicle = inspectionState.vehicle || inspectionState.vehicleInfo || {};
    const vehicleType = inspectionState.vehicleType || vehicle.vehicleType || 'Standard';
    const checklist = inspectionState.checklist;
    const complianceChecklist = inspectionState.complianceChecklist;
    const odometer = inspectionState.odometer;
    const overallNotes = inspectionState.overallNotes;

    // Get vehicle-type-specific system prompt
    const systemInstruction = VEHICLE_TYPE_PROMPTS[vehicleType] || VEHICLE_TYPE_PROMPTS.Standard;

    // Build structured prompt
    let prompt = `${systemInstruction}

Generate a comprehensive inspection report based on the following data:

**Vehicle Information:**
- Year: ${vehicle.year || 'Unknown'}
- Make: ${vehicle.make || 'Unknown'}
- Model: ${vehicle.model || 'Unknown'}
- VIN: ${vehicle.vin || 'Not provided'}
- Vehicle Type: ${vehicleType}
- Odometer: ${odometer || 'Not recorded'} miles

**Inspection Findings:**
`;

    // Process main checklist data - handle both field naming conventions
    const processChecklist = (checklistData, sectionLabel) => {
      if (!checklistData || typeof checklistData !== 'object') return;

      if (sectionLabel) {
        prompt += `\n--- ${sectionLabel} ---\n`;
      }

      for (const [category, items] of Object.entries(checklistData)) {
        if (Array.isArray(items)) {
          prompt += `\n**${category}:**\n`;
          items.forEach(item => {
            // Support both naming conventions: item.item or item.name, item.condition or item.status
            const itemName = item.item || item.name || 'Unknown item';
            const condition = item.condition || item.status || (item.checked ? 'pass' : 'unchecked');
            const conditionLabel = condition === 'fail' ? 'FAILED' :
                                   condition === 'concern' ? 'CONCERN' :
                                   condition === 'pass' ? 'PASS' :
                                   condition === 'na' ? 'N/A' : 'NOT CHECKED';
            prompt += `- ${itemName}: ${conditionLabel}`;
            if (item.notes) prompt += ` — ${item.notes}`;
            prompt += '\n';
          });
        }
      }
    };

    processChecklist(checklist, null);
    if (complianceChecklist && Object.keys(complianceChecklist).length > 0) {
      const complianceLabel = vehicleType === 'Commercial' ? 'DOT / FMCSA Compliance Checks' :
                              vehicleType === 'RV' ? 'Habitability & Safety System Checks' :
                              vehicleType === 'Classic' ? 'Authenticity & Provenance Checks' :
                              'Additional Compliance Checks';
      processChecklist(complianceChecklist, complianceLabel);
    }

    if (overallNotes) {
      prompt += `\n**Inspector's Overall Notes:**\n${overallNotes}\n`;
    }

    prompt += `\n**Report Format Requirements:**
Please structure the report with these exact headers (use ### markdown headers):

### 1. Overall Condition Assessment
Provide a 2-3 sentence executive summary of the vehicle's overall condition.

### 2. Key Findings
List the most important findings as bullet points (use - prefix). Include all failures and concerns.

### 3. Recommendations
List prioritized repair/maintenance recommendations as bullet points (use - prefix). Order by urgency.`;

    if (vehicleType === 'Commercial') {
      prompt += `\n\nAlso include a DOT Compliance Summary noting any items that would trigger an Out-of-Service order, and air brake test results assessment.`;
    } else if (vehicleType === 'RV') {
      prompt += `\n\nAlso include a Habitability Assessment covering LP gas safety, water system integrity, electrical system condition, and any water intrusion concerns.`;
    } else if (vehicleType === 'Classic') {
      prompt += `\n\nAlso include an Authenticity Score or Assessment indicating how original the vehicle is, note any non-original components, and provide a condition grade (1-6 scale where 1 is Concours/Perfect and 6 is Parts Car).`;
    }

    const report = await generateText(prompt, { temperature: 0.6, maxTokens: 3000 });

    res.json({
      summary: report,
      vehicleInfo: vehicle,
      vehicleType,
      odometer,
      generatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('[AI] Report generation error:', error);
    res.status(500).json({ error: 'Failed to generate report', details: error.message });
  }
});

/**
 * POST /api/detect-features
 * Detect vehicle features from an image using AI vision
 * Requires authentication
 */
router.post('/detect-features', async (req, res) => {
  try {
    const { image } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image data is required' });
    }

    if (!image.startsWith('data:image/')) {
      return res.status(400).json({ error: 'Invalid image format' });
    }

    console.log(`[AI] Detecting vehicle features for user ${req.user.email}`);

    const prompt = `Analyze this vehicle image and identify all visible features, components, and potential issues. List:
1. Vehicle type and body style
2. Visible exterior features (wheels, lights, trim, etc.)
3. Any visible damage or wear
4. Notable features or modifications
5. Approximate vehicle condition

Provide a concise, bulleted list of observations.`;

    const analysis = await analyzeImage(image, prompt);

    // Parse response into array of features
    const features = analysis
      .split('\n')
      .filter(line => line.trim().length > 0)
      .map(line => line.replace(/^[-*•]\s*/, '').trim());

    res.json({
      features,
      rawAnalysis: analysis
    });
  } catch (error) {
    console.error('[AI] Feature detection error:', error);
    res.status(500).json({ error: 'Failed to detect features', details: error.message });
  }
});

/**
 * POST /api/chat
 * Simple chat endpoint for AI assistant
 * Uses multi-provider fallback (Gemini → DeepSeek → OpenAI)
 */
router.post('/chat', async (req, res) => {
  try {
    const { message, conversationHistory = [] } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Message is required' });
    }

    console.log('[AI] Chat request from user', req.user.email);

    // Build conversation context
    let prompt = 'You are a helpful automotive expert assistant. You help with vehicle maintenance, repairs, diagnostics, and finding local services.\n\nUser question: ' + message;

    // Include recent conversation history for context
    if (conversationHistory.length > 0) {
      const recentHistory = conversationHistory.slice(-5);
      const historyText = recentHistory
        .map(msg => (msg.role === 'user' ? 'User' : 'Assistant') + ': ' + msg.content)
        .join('\n');
      prompt = 'Previous conversation:\n' + historyText + '\n\n' + prompt;
    }

    // Use AI provider with automatic fallback
    const response = await generateText(prompt, {
      temperature: 0.8,
      maxTokens: 1000
    });

    res.json({
      response,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[AI] Chat error:', error);

    // Self-healing fallback - never leave user stranded
    res.json({
      response: "I'm having trouble connecting to my AI services right now. However, I can still help! For vehicle issues, I recommend:\n\n1. Check your owner's manual for basic troubleshooting\n2. Use OBD-II scanner for diagnostic codes\n3. Contact a certified mechanic for complex issues\n\nPlease try again in a moment, or feel free to use the inspection tools in the app.",
      fallback: true,
      error: error.message
    });
  }
});

/**
 * POST /api/analyze-audio
 * Analyze engine/vehicle audio using AI
 * Accepts audio description text (from Whisper transcription or manual input)
 * Uses DeepSeek (preferred) → OpenAI → Gemini
 */
router.post('/analyze-audio', async (req, res) => {
  try {
    const { audioDescription, vehicleInfo = {} } = req.body;

    if (!audioDescription || typeof audioDescription !== 'string' || audioDescription.trim().length < 5) {
      return res.status(400).json({ error: 'audioDescription is required (minimum 5 characters)' });
    }

    console.log(`[AI] Engine audio analysis for user ${req.user.email}`);

    const analysis = await analyzeAudio(audioDescription.trim(), vehicleInfo);

    res.json({
      analysis,
      vehicleInfo,
      provider: 'AI (DeepSeek/OpenAI/Gemini)',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('[AI] Audio analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze audio', details: error.message });
  }
});

export default router;

