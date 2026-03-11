import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { analyzeImage } from '../config/aiProviders.js';
import { query } from '../config/database.js';

const router = express.Router();

/**
 * POST /api/fraud/analyze-odometer
 * Analyze photos for odometer fraud detection
 * Compares wear patterns against claimed mileage
 */
router.post('/analyze-odometer', authenticateToken, async (req, res) => {
  try {
    const {
      inspectionId,
      claimedMileage,
      pedalPhotoBase64,
      steeringPhotoBase64,
      seatPhotoBase64,
      carfaxLastMileage,
      carfaxLastDate
    } = req.body;

    if (!claimedMileage || !pedalPhotoBase64) {
      return res.status(400).json({ error: 'Claimed mileage and pedal photo are required' });
    }

    console.log(`[Fraud] Analyzing odometer fraud for inspection ${inspectionId}`);

    // Analyze pedal wear
    const pedalAnalysis = await analyzeImage(
      pedalPhotoBase64,
      `Analyze the wear on these vehicle pedals. Rate the wear severity as 'light', 'moderate', 'severe', or 'extreme'.
      Based on the wear pattern, estimate how many miles this vehicle likely has. Consider:
      - Rubber wear depth
      - Surface smoothness
      - Pattern visibility
      - Edge condition

      Provide: 1) Wear severity 2) Estimated mileage range 3) Brief explanation.
      Format: WEAR: [severity] | ESTIMATED_MILES: [range] | REASON: [explanation]`
    );

    // Analyze steering wheel wear if provided
    let steeringAnalysis = null;
    if (steeringPhotoBase64) {
      steeringAnalysis = await analyzeImage(
        steeringPhotoBase64,
        `Analyze steering wheel wear. Rate as 'light', 'moderate', 'severe', or 'extreme'.
        Estimate mileage based on:
        - Leather/material wear
        - Grip area smoothness
        - Discoloration
        - Shine/patina

        Format: WEAR: [severity] | ESTIMATED_MILES: [range] | REASON: [explanation]`
      );
    }

    // Analyze seat wear if provided
    let seatAnalysis = null;
    if (seatPhotoBase64) {
      seatAnalysis = await analyzeImage(
        seatPhotoBase64,
        `Analyze driver's seat wear. Rate as 'light', 'moderate', 'severe', or 'extreme'.
        Estimate mileage based on:
        - Bolster wear
        - Seat cushion compression
        - Material condition
        - Wrinkles/creases

        Format: WEAR: [severity] | ESTIMATED_MILES: [range] | REASON: [explanation]`
      );
    }

    // Parse AI responses
    const parsePedalWear = (text) => {
      const wearMatch = text.match(/WEAR:\s*(\w+)/i);
      const milesMatch = text.match(/ESTIMATED_MILES:\s*([\d,\-k\s]+)/i);
      const reasonMatch = text.match(/REASON:\s*(.+)/i);

      return {
        severity: wearMatch ? wearMatch[1].toLowerCase() : 'unknown',
        estimatedMiles: milesMatch ? milesMatch[1].trim() : 'unknown',
        reason: reasonMatch ? reasonMatch[1].trim() : text
      };
    };

    const pedalData = parsePedalWear(pedalAnalysis);
    const steeringData = steeringAnalysis ? parsePedalWear(steeringAnalysis) : null;
    const seatData = seatAnalysis ? parsePedalWear(seatAnalysis) : null;

    // Calculate estimated mileage (extract number from range)
    const extractMileage = (str) => {
      if (!str || str === 'unknown') return null;
      const match = str.match(/(\d+)/);
      return match ? parseInt(match[1]) * (str.includes('k') ? 1000 : 1) : null;
    };

    const pedalEstimate = extractMileage(pedalData.estimatedMiles);
    const steeringEstimate = steeringData ? extractMileage(steeringData.estimatedMiles) : null;
    const seatEstimate = seatData ? extractMileage(seatData.estimatedMiles) : null;

    // Average estimates
    const estimates = [pedalEstimate, steeringEstimate, seatEstimate].filter(e => e !== null);
    const avgEstimate = estimates.length > 0
      ? Math.round(estimates.reduce((a, b) => a + b, 0) / estimates.length)
      : null;

    // Calculate discrepancy
    const mileageDiscrepancy = avgEstimate ? avgEstimate - claimedMileage : 0;

    // Calculate fraud probability
    let fraudProbability = 0;
    if (mileageDiscrepancy > 100000) fraudProbability = 0.95;
    else if (mileageDiscrepancy > 75000) fraudProbability = 0.85;
    else if (mileageDiscrepancy > 50000) fraudProbability = 0.70;
    else if (mileageDiscrepancy > 30000) fraudProbability = 0.50;
    else if (mileageDiscrepancy > 15000) fraudProbability = 0.30;
    else fraudProbability = 0.10;

    // Check Carfax discrepancy
    if (carfaxLastMileage && claimedMileage < carfaxLastMileage) {
      fraudProbability = Math.max(fraudProbability, 0.95); // Odometer rollback confirmed
    }

    // Compile full analysis
    const fullAnalysis = `
ODOMETER FRAUD ANALYSIS

Claimed Mileage: ${claimedMileage.toLocaleString()} miles
Estimated Mileage: ${avgEstimate ? avgEstimate.toLocaleString() : 'Unknown'} miles
Discrepancy: ${mileageDiscrepancy > 0 ? '+' : ''}${mileageDiscrepancy.toLocaleString()} miles

PEDAL WEAR:
- Severity: ${pedalData.severity}
- ${pedalData.reason}

${steeringData ? `STEERING WHEEL WEAR:
- Severity: ${steeringData.severity}
- ${steeringData.reason}
` : ''}

${seatData ? `SEAT WEAR:
- Severity: ${seatData.severity}
- ${seatData.reason}
` : ''}

${carfaxLastMileage ? `CARFAX DATA:
- Last reported: ${carfaxLastMileage.toLocaleString()} miles on ${carfaxLastDate || 'unknown date'}
- Current claim: ${claimedMileage.toLocaleString()} miles
${claimedMileage < carfaxLastMileage ? '⚠️ WARNING: Odometer shows LESS than previous report (ROLLBACK)' : ''}
` : ''}

FRAUD PROBABILITY: ${(fraudProbability * 100).toFixed(0)}%

${fraudProbability > 0.7 ? '🚨 HIGH RISK: Strong indicators of odometer tampering' :
  fraudProbability > 0.4 ? '⚠️ MODERATE RISK: Some indicators present, further inspection recommended' :
  '✅ LOW RISK: Wear patterns generally consistent with claimed mileage'}
    `.trim();

    // Save to database if inspectionId provided
    if (inspectionId) {
      await query(
        `INSERT INTO odometer_fraud_indicators (
          inspection_id, claimed_mileage, pedal_wear_severity,
          steering_wear_severity, seat_wear_severity,
          carfax_last_mileage, carfax_last_date,
          mileage_discrepancy, fraud_probability, ai_analysis
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          inspectionId,
          claimedMileage,
          pedalData.severity,
          steeringData?.severity || null,
          seatData?.severity || null,
          carfaxLastMileage || null,
          carfaxLastDate || null,
          mileageDiscrepancy,
          fraudProbability,
          fullAnalysis
        ]
      );
    }

    res.json({
      fraudProbability,
      mileageDiscrepancy,
      estimatedMileage: avgEstimate,
      claimedMileage,
      pedalWear: pedalData,
      steeringWear: steeringData,
      seatWear: seatData,
      analysis: fullAnalysis,
      riskLevel: fraudProbability > 0.7 ? 'HIGH' : fraudProbability > 0.4 ? 'MODERATE' : 'LOW'
    });

  } catch (error) {
    console.error('[Fraud] Odometer analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze odometer fraud', details: error.message });
  }
});

/**
 * POST /api/fraud/analyze-flood
 * Analyze for flood damage indicators
 */
router.post('/analyze-flood', authenticateToken, async (req, res) => {
  try {
    const {
      inspectionId,
      vin,
      mustySmell,
      waterStains,
      waterStainLocations,
      rustUnusual,
      foggyLights,
      carpetReplaced,
      electricalCorrosion,
      carpetPhotoBase64,
      engineBayPhotoBase64
    } = req.body;

    console.log(`[Fraud] Analyzing flood damage for VIN ${vin}`);

    let floodProbability = 0;
    const indicators = [];

    // Physical indicators
    if (mustySmell) { floodProbability += 0.25; indicators.push('Musty smell detected'); }
    if (waterStains) { floodProbability += 0.30; indicators.push('Water stains found'); }
    if (rustUnusual) { floodProbability += 0.20; indicators.push('Rust in unusual places'); }
    if (foggyLights) { floodProbability += 0.15; indicators.push('Foggy headlights/taillights'); }
    if (carpetReplaced) { floodProbability += 0.20; indicators.push('Carpet recently replaced'); }
    if (electricalCorrosion) { floodProbability += 0.30; indicators.push('Electrical corrosion present'); }

    // AI photo analysis
    let carpetAnalysis = null;
    if (carpetPhotoBase64) {
      carpetAnalysis = await analyzeImage(
        carpetPhotoBase64,
        `Analyze this vehicle carpet/interior for flood damage signs:
        - Water stains or discoloration
        - Mold or mildew
        - Silt or mud residue
        - New carpet installation
        - Moisture damage

        Respond: FLOOD_SIGNS: [yes/no] | CONFIDENCE: [low/medium/high] | DETAILS: [explanation]`
      );

      if (carpetAnalysis.toLowerCase().includes('flood_signs: yes')) {
        floodProbability += 0.25;
        indicators.push('AI detected flood signs in carpet');
      }
    }

    let engineBayAnalysis = null;
    if (engineBayPhotoBase64) {
      engineBayAnalysis = await analyzeImage(
        engineBayPhotoBase64,
        `Analyze engine bay for flood damage:
        - Water lines or staining
        - Mud/silt in crevices
        - Corrosion on electrical connectors
        - Rust on metal components

        Respond: FLOOD_SIGNS: [yes/no] | CONFIDENCE: [low/medium/high] | DETAILS: [explanation]`
      );

      if (engineBayAnalysis.toLowerCase().includes('flood_signs: yes')) {
        floodProbability += 0.20;
        indicators.push('AI detected flood signs in engine bay');
      }
    }

    // Cap at 1.0
    floodProbability = Math.min(floodProbability, 1.0);

    // TODO: Check NICB flood database (requires API key)
    const nicbFloodRecord = false;

    const fullAnalysis = `
FLOOD DAMAGE ANALYSIS

VIN: ${vin}

PHYSICAL INDICATORS (${indicators.length}):
${indicators.map(i => `- ${i}`).join('\n') || '- None detected'}

${carpetAnalysis ? `CARPET/INTERIOR ANALYSIS:
${carpetAnalysis}
` : ''}

${engineBayAnalysis ? `ENGINE BAY ANALYSIS:
${engineBayAnalysis}
` : ''}

FLOOD PROBABILITY: ${(floodProbability * 100).toFixed(0)}%

${floodProbability > 0.6 ? '🚨 HIGH RISK: Multiple flood damage indicators present' :
  floodProbability > 0.3 ? '⚠️ MODERATE RISK: Some flood damage signs detected' :
  '✅ LOW RISK: No significant flood damage indicators'}

${waterStainLocations && waterStainLocations.length > 0 ? `
Water Stain Locations:
${waterStainLocations.map(l => `- ${l}`).join('\n')}
` : ''}
    `.trim();

    // Save to database
    if (inspectionId) {
      await query(
        `INSERT INTO flood_damage_indicators (
          inspection_id, musty_smell_detected, water_stains_found,
          water_stain_locations, rust_in_unusual_places, foggy_lights,
          carpet_replaced, electrical_corrosion, nicb_flood_record,
          flood_probability, ai_analysis
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          inspectionId,
          mustySmell || false,
          waterStains || false,
          waterStainLocations || [],
          rustUnusual || false,
          foggyLights || false,
          carpetReplaced || false,
          electricalCorrosion || false,
          nicbFloodRecord,
          floodProbability,
          fullAnalysis
        ]
      );
    }

    res.json({
      floodProbability,
      indicators,
      nicbFloodRecord,
      carpetAnalysis,
      engineBayAnalysis,
      analysis: fullAnalysis,
      riskLevel: floodProbability > 0.6 ? 'HIGH' : floodProbability > 0.3 ? 'MODERATE' : 'LOW'
    });

  } catch (error) {
    console.error('[Fraud] Flood analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze flood damage', details: error.message });
  }
});

/**
 * POST /api/fraud/analyze-damage
 * AI-powered body damage and accident detection from vehicle photos
 * Uses Gemini Vision to detect: dents, paint inconsistencies, panel gaps,
 * repair evidence, frame damage indicators - similar to rental car scan technology
 */
router.post('/analyze-damage', authenticateToken, async (req, res) => {
  try {
    const { photos, vehicleType, vin } = req.body;

    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return res.status(400).json({ error: 'At least one photo is required' });
    }

    console.log(`[Fraud] Analyzing ${photos.length} photos for body damage (VIN: ${vin || 'unknown'})`);

    const findings = [];
    let hasRepairEvidence = false;
    let hasPanelGaps = false;
    let hasPaintMismatch = false;

    // Analyze each photo for damage
    for (const photo of photos.slice(0, 8)) { // Limit to 8 photos for API cost control
      const imageData = photo.base64 || photo.url?.replace(/^data:[^;]+;base64,/, '');
      if (!imageData) continue;

      const analysis = await analyzeImage(
        imageData,
        `You are an expert automotive body damage inspector using AI-powered visual analysis (similar to rental car damage detection systems).

Analyze this vehicle photo for ANY of the following:

1. BODY DAMAGE: Dents, dings, scratches, cracked bumpers, broken lights, missing trim
2. PAINT CONDITION: Color mismatches between panels, orange peel texture (repaint), overspray on trim/rubber, fading, clear coat failure
3. PANEL GAPS: Uneven gaps between doors/fenders/hood/trunk that indicate collision repair or frame damage
4. REPAIR EVIDENCE: Bondo/filler (look for waviness), welding marks, mismatched bolt patterns, non-OEM parts
5. STRUCTURAL DAMAGE: Bent frame rails visible, crumple zone deformation, uneven ride height
6. RUST/CORROSION: Surface rust, structural rust, bubble rust under paint

For EACH issue found, respond in this exact format (one per line):
AREA: [specific location] | SEVERITY: [Minor/Moderate/Severe] | DESCRIPTION: [what you see]

If the photo shows NO damage issues, respond with:
CLEAN: No damage detected in this view

Also include a final line:
ACCIDENT_SIGNS: [Yes/No] | REPAINT_SIGNS: [Yes/No] | PANEL_GAP_ISSUES: [Yes/No]`
      );

      // Parse AI response into structured findings
      const lines = analysis.split('\n').filter(l => l.trim());
      for (const line of lines) {
        const match = line.match(/^AREA:\s*(.+?)\s*\|\s*SEVERITY:\s*(.+?)\s*\|\s*DESCRIPTION:\s*(.+)/i);
        if (match) {
          findings.push({
            area: match[1].trim(),
            severity: match[2].trim(),
            description: match[3].trim(),
          });
        }

        const signsMatch = line.match(/ACCIDENT_SIGNS:\s*(Yes|No)\s*\|\s*REPAINT_SIGNS:\s*(Yes|No)\s*\|\s*PANEL_GAP_ISSUES:\s*(Yes|No)/i);
        if (signsMatch) {
          if (signsMatch[1].toLowerCase() === 'yes') hasRepairEvidence = true;
          if (signsMatch[2].toLowerCase() === 'yes') hasPaintMismatch = true;
          if (signsMatch[3].toLowerCase() === 'yes') hasPanelGaps = true;
        }
      }
    }

    // Calculate overall severity
    const severeCount = findings.filter(f => f.severity === 'Severe').length;
    const moderateCount = findings.filter(f => f.severity === 'Moderate').length;
    let overallSeverity = 'None';
    if (severeCount > 0) overallSeverity = 'Severe';
    else if (moderateCount > 1) overallSeverity = 'Moderate';
    else if (findings.length > 0) overallSeverity = 'Minor';

    // Determine accident likelihood
    let accidentLikelihood = 'Unlikely';
    if (hasRepairEvidence && hasPanelGaps) accidentLikelihood = 'Likely';
    else if (hasRepairEvidence || hasPanelGaps || hasPaintMismatch) accidentLikelihood = 'Possible';
    if (severeCount > 1) accidentLikelihood = 'Likely';

    console.log(`[Fraud] Damage analysis complete: ${findings.length} issues found, severity: ${overallSeverity}, accident: ${accidentLikelihood}`);

    res.json({
      overallSeverity,
      accidentLikelihood,
      findings,
      repaintDetected: hasPaintMismatch,
      panelGapIssues: hasPanelGaps,
      repairEvidence: hasRepairEvidence,
      photosAnalyzed: Math.min(photos.length, 8),
    });

  } catch (error) {
    console.error('[Fraud] Damage analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze damage', details: error.message });
  }
});

/**
 * POST /api/fraud/analyze-tires
 * AI tire wear pattern analysis — detects alignment, suspension, and safety issues
 */
router.post('/analyze-tires', authenticateToken, async (req, res) => {
  try {
    const { photos, vehicleType, vin } = req.body;

    if (!photos || photos.length === 0) {
      return res.status(400).json({ error: 'At least one tire photo required' });
    }

    console.log(`[Fraud] Analyzing tire wear patterns for VIN: ${vin || 'unknown'}`);

    const tireFindings = [];

    for (const photo of photos.slice(0, 4)) {
      const imageData = photo.base64 || photo.url?.replace(/^data:[^;]+;base64,/, '');
      if (!imageData) continue;

      const analysis = await analyzeImage(
        imageData,
        `You are a master tire and alignment technician analyzing tire wear patterns.

Analyze this tire photo and identify:
1. WEAR PATTERN: Even, inner edge, outer edge, center, cupping/scalloping, feathering, one-sided
2. TREAD DEPTH: Deep (>6mm), Adequate (4-6mm), Low (2-4mm), Critical (<2mm), Bald
3. CAUSE: What mechanical issue caused this wear pattern (alignment, camber, toe, pressure, suspension)
4. SAFETY: Safe, Monitor, Replace Soon, Replace Immediately
5. ESTIMATED REMAINING LIFE: miles or months

Respond in this exact format:
PATTERN: [wear type] | DEPTH: [depth level] | CAUSE: [mechanical cause] | SAFETY: [safety level] | LIFE: [remaining life]
DETAILS: [2-3 sentence explanation of what you see and what it means for the vehicle]`
      );

      const patternMatch = analysis.match(/PATTERN:\s*(.+?)\s*\|\s*DEPTH:\s*(.+?)\s*\|\s*CAUSE:\s*(.+?)\s*\|\s*SAFETY:\s*(.+?)\s*\|\s*LIFE:\s*(.+)/i);
      const detailsMatch = analysis.match(/DETAILS:\s*(.+)/is);

      if (patternMatch) {
        tireFindings.push({
          pattern: patternMatch[1].trim(),
          depth: patternMatch[2].trim(),
          cause: patternMatch[3].trim(),
          safety: patternMatch[4].trim(),
          remainingLife: patternMatch[5].trim(),
          details: detailsMatch ? detailsMatch[1].trim() : analysis,
        });
      } else {
        tireFindings.push({ raw: analysis });
      }
    }

    // Determine overall safety
    const hasCritical = tireFindings.some(f => f.safety?.toLowerCase().includes('immediately'));
    const hasConcern = tireFindings.some(f => f.safety?.toLowerCase().includes('soon') || f.safety?.toLowerCase().includes('monitor'));
    const overallSafety = hasCritical ? 'REPLACE IMMEDIATELY' : hasConcern ? 'ATTENTION NEEDED' : 'ACCEPTABLE';

    res.json({
      tireFindings,
      overallSafety,
      photosAnalyzed: Math.min(photos.length, 4),
      recommendation: hasCritical
        ? 'One or more tires require immediate replacement. Do not drive until replaced.'
        : hasConcern
        ? 'Tire wear indicates alignment or suspension issues. Schedule service soon.'
        : 'Tire wear patterns appear normal. Continue regular monitoring.',
    });

  } catch (error) {
    console.error('[Fraud] Tire analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze tire wear', details: error.message });
  }
});

/**
 * POST /api/fraud/analyze-vin-clone
 * VIN cloning and title washing detection
 * Checks for physical VIN plate inconsistencies and cross-references
 */
router.post('/analyze-vin-clone', authenticateToken, async (req, res) => {
  try {
    const {
      vin,
      vinPlatePhotoBase64,
      doorJambPhotoBase64,
      dashPhotoBase64,
      stateOfSale,
      stateOnTitle,
      titleBrands,
      previousStates,
      claimedYear,
      claimedMake,
      claimedModel,
      vehicleType
    } = req.body;

    if (!vin) return res.status(400).json({ error: 'VIN is required' });

    console.log(`[Fraud] VIN clone/title wash analysis for VIN: ${vin}`);

    const riskFactors = [];
    let cloneRisk = 0;
    let titleWashRisk = 0;

    // Title washing red flags
    if (titleBrands && titleBrands.length > 0) {
      titleWashRisk += 0.4;
      riskFactors.push(`Title brands present: ${titleBrands.join(', ')}`);
    }
    if (previousStates && previousStates.length > 2) {
      titleWashRisk += 0.25;
      riskFactors.push(`Vehicle registered in ${previousStates.length} states — title washing risk`);
    }
    if (stateOfSale && stateOnTitle && stateOfSale !== stateOnTitle) {
      titleWashRisk += 0.15;
      riskFactors.push(`Sale state (${stateOfSale}) differs from title state (${stateOnTitle})`);
    }

    // AI VIN plate analysis
    let vinPlateAnalysis = null;
    if (vinPlatePhotoBase64) {
      vinPlateAnalysis = await analyzeImage(
        vinPlatePhotoBase64,
        `You are a forensic VIN plate authentication expert.

Analyze this VIN plate photo for signs of tampering or cloning:
1. RIVETS: Are they original factory rivets or show signs of removal/replacement?
2. FONT: Is the VIN font consistent, properly stamped, or does it show signs of alteration?
3. ALIGNMENT: Are characters evenly spaced and aligned as factory-stamped?
4. PLATE CONDITION: Any scratches, dents, or marks inconsistent with vehicle age?
5. ADHESIVE/ATTACHMENT: Signs of plate being removed and reattached?

Respond:
TAMPER_SIGNS: [Yes/No] | CONFIDENCE: [Low/Medium/High] | RIVET_STATUS: [Original/Replaced/Unknown]
DETAILS: [specific observations]`
      );

      if (vinPlateAnalysis.toLowerCase().includes('tamper_signs: yes')) {
        cloneRisk += 0.5;
        riskFactors.push('AI detected VIN plate tampering signs');
      }
    }

    let doorJambAnalysis = null;
    if (doorJambPhotoBase64) {
      doorJambAnalysis = await analyzeImage(
        doorJambPhotoBase64,
        `Analyze this door jamb VIN sticker/plate for authenticity:
1. Does the VIN match what would be expected for the vehicle?
2. Is the sticker original or replaced (look for adhesive residue, misalignment, wrong font)?
3. Are the safety certification markings present and correct?
4. Is the manufacture date label present and consistent?

Respond:
AUTHENTIC: [Yes/No/Uncertain] | STICKER_REPLACED: [Yes/No/Unknown]
DETAILS: [specific observations]`
      );

      if (doorJambAnalysis && doorJambAnalysis.toLowerCase().includes('authentic: no')) {
        cloneRisk += 0.4;
        riskFactors.push('Door jamb VIN sticker appears non-authentic');
      }
    }

    // Cap risks
    cloneRisk = Math.min(cloneRisk, 1.0);
    titleWashRisk = Math.min(titleWashRisk, 1.0);
    const overallRisk = Math.max(cloneRisk, titleWashRisk);

    const analysis = `
VIN CLONE & TITLE WASH ANALYSIS

VIN: ${vin}

CLONE RISK: ${(cloneRisk * 100).toFixed(0)}%
TITLE WASH RISK: ${(titleWashRisk * 100).toFixed(0)}%
OVERALL RISK: ${(overallRisk * 100).toFixed(0)}%

RISK FACTORS DETECTED:
${riskFactors.length > 0 ? riskFactors.map(f => `- ${f}`).join('\n') : '- None detected'}

${vinPlateAnalysis ? `VIN PLATE ANALYSIS:\n${vinPlateAnalysis}` : ''}
${doorJambAnalysis ? `\nDOOR JAMB ANALYSIS:\n${doorJambAnalysis}` : ''}

${overallRisk > 0.6 ? '🚨 HIGH RISK: Significant indicators of VIN cloning or title washing. Do NOT purchase without thorough verification.' :
  overallRisk > 0.3 ? '⚠️ MODERATE RISK: Some concerning factors. Obtain independent title history report.' :
  '✅ LOW RISK: No significant VIN or title fraud indicators detected.'}
    `.trim();

    res.json({
      cloneRisk,
      titleWashRisk,
      overallRisk,
      riskFactors,
      vinPlateAnalysis,
      doorJambAnalysis,
      analysis,
      riskLevel: overallRisk > 0.6 ? 'HIGH' : overallRisk > 0.3 ? 'MODERATE' : 'LOW',
    });

  } catch (error) {
    console.error('[Fraud] VIN clone analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze VIN clone risk', details: error.message });
  }
});

/**
 * POST /api/fraud/analyze-frame
 * AI frame and structural integrity analysis
 * Detects unibody damage, frame rail bends, collision repair evidence
 */
router.post('/analyze-frame', authenticateToken, async (req, res) => {
  try {
    const { photos, vehicleType, measurements, vin } = req.body;

    if (!photos || photos.length === 0) {
      return res.status(400).json({ error: 'At least one undercarriage or frame photo required' });
    }

    console.log(`[Fraud] Frame/structural analysis for VIN: ${vin || 'unknown'}`);

    const frameFindings = [];

    for (const photo of photos.slice(0, 6)) {
      const imageData = photo.base64 || photo.url?.replace(/^data:[^;]+;base64,/, '');
      if (!imageData) continue;

      const prompt = vehicleType === 'Commercial'
        ? `You are a CDL-certified heavy truck frame inspector analyzing an 18-wheeler or commercial vehicle.

Analyze this frame/chassis photo for:
1. FRAME RAILS: Cracks, bends, welds, corrosion, section loss
2. CROSSMEMBERS: Damage, missing bolts, cracks
3. SUSPENSION MOUNTS: Cracks, wear, improper repairs
4. FIFTH WHEEL AREA: Plate condition, kingpin wear, mounting integrity
5. PREVIOUS REPAIRS: Non-OEM welds, patches, improper repairs

FMCSA COMPLIANCE: Note any violations of 49 CFR 393.201 (frame) or 393.207 (suspension)

Respond:
STRUCTURAL_INTEGRITY: [Pass/Fail/Marginal] | FMCSA_VIOLATIONS: [Yes/No] | SEVERITY: [None/Minor/Major/Critical]
FINDINGS: [specific observations, one per line starting with -]`
        : `You are a structural damage expert analyzing vehicle frame/unibody integrity.

Analyze this photo for:
1. FRAME DAMAGE: Bent rails, kinks, cracks, improper welds
2. UNIBODY DAMAGE: Crumple zone deformation, floor pan damage, firewall damage
3. REPAIR EVIDENCE: Non-factory welds, patches, straightening marks, heat damage
4. RUST/CORROSION: Surface vs structural rust, perforation
5. ALIGNMENT INDICATORS: Asymmetric wear patterns suggesting frame twist

Respond:
STRUCTURAL_INTEGRITY: [Pass/Fail/Marginal] | PRIOR_COLLISION: [Yes/No/Possible] | SEVERITY: [None/Minor/Major/Critical]
FINDINGS: [specific observations, one per line starting with -]`;

      const analysis = await analyzeImage(imageData, prompt);

      const integrityMatch = analysis.match(/STRUCTURAL_INTEGRITY:\s*(\w+)/i);
      const severityMatch = analysis.match(/SEVERITY:\s*(\w+)/i);
      const findingsMatch = analysis.match(/FINDINGS:\s*([\s\S]+)/i);

      frameFindings.push({
        structuralIntegrity: integrityMatch ? integrityMatch[1].trim() : 'Unknown',
        severity: severityMatch ? severityMatch[1].trim() : 'Unknown',
        findings: findingsMatch ? findingsMatch[1].trim() : analysis,
        raw: analysis,
      });
    }

    const hasCritical = frameFindings.some(f => f.severity?.toLowerCase() === 'critical');
    const hasMajor = frameFindings.some(f => f.severity?.toLowerCase() === 'major');
    const hasFail = frameFindings.some(f => f.structuralIntegrity?.toLowerCase() === 'fail');

    const overallVerdict = hasCritical || hasFail ? 'FAIL' : hasMajor ? 'MARGINAL' : 'PASS';

    res.json({
      overallVerdict,
      frameFindings,
      photosAnalyzed: Math.min(photos.length, 6),
      recommendation: overallVerdict === 'FAIL'
        ? 'Critical structural damage detected. Vehicle is unsafe. Do not purchase or operate.'
        : overallVerdict === 'MARGINAL'
        ? 'Significant frame/structural concerns found. Require professional frame shop inspection before purchase.'
        : 'No critical structural damage detected. Continue with standard inspection.',
      fmcsaNote: vehicleType === 'Commercial'
        ? 'Ensure all findings are reviewed against FMCSA 49 CFR Part 393 before returning vehicle to service.'
        : null,
    });

  } catch (error) {
    console.error('[Fraud] Frame analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze frame/structural integrity', details: error.message });
  }
});

/**
 * GET /api/fraud/inspection/:inspectionId
 * Get all fraud indicators for an inspection
 */
router.get('/inspection/:inspectionId', authenticateToken, async (req, res) => {
  try {
    const { inspectionId } = req.params;

    // Verify user owns this inspection
    const inspectionCheck = await query(
      'SELECT id, user_id FROM inspections WHERE id = $1',
      [inspectionId]
    );

    if (inspectionCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Inspection not found' });
    }

    if (inspectionCheck.rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Get all fraud indicators
    const odometer = await query(
      'SELECT * FROM odometer_fraud_indicators WHERE inspection_id = $1',
      [inspectionId]
    );

    const flood = await query(
      'SELECT * FROM flood_damage_indicators WHERE inspection_id = $1',
      [inspectionId]
    );

    const accident = await query(
      'SELECT * FROM accident_concealment_indicators WHERE inspection_id = $1',
      [inspectionId]
    );

    res.json({
      odometerFraud: odometer.rows[0] || null,
      floodDamage: flood.rows[0] || null,
      accidentConcealment: accident.rows[0] || null
    });

  } catch (error) {
    console.error('[Fraud] Get indicators error:', error);
    res.status(500).json({ error: 'Failed to retrieve fraud indicators' });
  }
});

export default router;
