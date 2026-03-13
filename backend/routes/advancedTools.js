/**
 * Advanced Tools API Routes
 * ─────────────────────────────────────────────────────────────────────────────
 * Optional premium inspection tools. Each route is fully independent.
 * A failure in any route does NOT affect the rest of the application.
 *
 * Routes:
 *   POST /api/advanced/analyze-paint-thickness   — Paint depth meter AI analysis
 *   POST /api/advanced/analyze-battery           — Battery CCA + charging system analysis
 *   POST /api/advanced/analyze-brake-fluid       — Brake fluid moisture/boil-point analysis
 *   POST /api/advanced/analyze-borescope         — Engine cylinder borescope photo analysis
 *   POST /api/advanced/check-nmvtis              — NMVTIS / auction total-loss history check
 */

import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import { analyzeImage } from '../config/aiProviders.js';

const router = express.Router();

// ─── Factory spec paint thickness ranges (microns) ──────────────────────────
const FACTORY_PAINT_SPEC = {
  min: 90,
  max: 190,
  repaintThreshold: 220,   // above this = likely repainted
  fillerThreshold: 400,    // above this = body filler present
};

/**
 * POST /api/advanced/analyze-paint-thickness
 * Accepts per-panel micron readings + optional photo.
 * Returns AI interpretation: factory / repainted / filler detected.
 */
router.post('/analyze-paint-thickness', authenticateToken, async (req, res) => {
  try {
    const { panels, vehicleType, photoBase64 } = req.body;

    if (!panels || !Array.isArray(panels) || panels.length === 0) {
      return res.status(400).json({ error: 'Panel readings array is required' });
    }

    // Classify each panel reading
    const panelResults = panels.map(p => {
      const reading = Number(p.reading);
      let status, interpretation, repairEstimate;

      if (isNaN(reading) || reading === 0) {
        status = 'SKIPPED';
        interpretation = 'No reading recorded';
        repairEstimate = null;
      } else if (reading <= FACTORY_PAINT_SPEC.max) {
        status = 'PASS';
        interpretation = `Factory paint (${reading} µm — within OEM spec of ${FACTORY_PAINT_SPEC.min}–${FACTORY_PAINT_SPEC.max} µm)`;
        repairEstimate = null;
      } else if (reading <= FACTORY_PAINT_SPEC.repaintThreshold) {
        status = 'CONCERN';
        interpretation = `Slightly above factory spec (${reading} µm). Possible clear coat respray or touch-up. Verify visually.`;
        repairEstimate = null;
      } else if (reading <= FACTORY_PAINT_SPEC.fillerThreshold) {
        status = 'FAIL';
        interpretation = `Repaint detected (${reading} µm — ${reading - FACTORY_PAINT_SPEC.max} µm above OEM max). Panel was repainted after a repair event. Inspect for underlying damage.`;
        repairEstimate = { min: 800, max: 2500, note: 'Depends on extent of underlying damage' };
      } else {
        status = 'FAIL';
        interpretation = `Body filler detected (${reading} µm — significantly above OEM spec). Substantial accident repair concealed. Structural inspection required.`;
        repairEstimate = { min: 2000, max: 8000, note: 'Filler removal, panel repair/replacement, repaint' };
      }

      return {
        panel: p.panel,
        reading,
        status,
        interpretation,
        repairEstimate,
      };
    });

    const failedPanels = panelResults.filter(p => p.status === 'FAIL');
    const concernPanels = panelResults.filter(p => p.status === 'CONCERN');
    const passedPanels = panelResults.filter(p => p.status === 'PASS');

    let overallVerdict, overallInterpretation;
    if (failedPanels.length >= 3) {
      overallVerdict = 'FAIL';
      overallInterpretation = `${failedPanels.length} panels show repaint or body filler. This vehicle has had significant undisclosed accident repairs. Negotiate accordingly or walk away.`;
    } else if (failedPanels.length > 0) {
      overallVerdict = 'FAIL';
      overallInterpretation = `${failedPanels.length} panel(s) show repaint or body filler: ${failedPanels.map(p => p.panel).join(', ')}. Prior accident repair confirmed. Disclose to buyer.`;
    } else if (concernPanels.length > 0) {
      overallVerdict = 'CONCERN';
      overallInterpretation = `${concernPanels.length} panel(s) slightly above factory spec. May indicate minor touch-up or respray. Verify visually.`;
    } else {
      overallVerdict = 'PASS';
      overallInterpretation = `All ${passedPanels.length} panels within OEM factory paint spec. No evidence of repaint or body filler.`;
    }

    // If a photo was provided, run AI visual cross-check
    let aiVisualNote = null;
    if (photoBase64) {
      try {
        const aiPrompt = `You are an expert automotive paint inspector. A paint thickness meter has flagged potential repaint or body filler on this vehicle. 
Examine this photo for: 1) Color match inconsistencies between panels, 2) Orange peel texture differences, 3) Overspray on trim/rubber seals, 4) Paint edge blending at panel seams, 5) Any visible filler cracking or surface irregularities.
Provide a brief 2-3 sentence visual assessment that either confirms or contradicts the meter readings.`;
        aiVisualNote = await analyzeImage(photoBase64, aiPrompt);
      } catch (e) {
        aiVisualNote = 'AI visual cross-check unavailable — rely on meter readings.';
      }
    }

    // Calculate total estimated repair cost
    const totalRepairMin = failedPanels.reduce((sum, p) => sum + (p.repairEstimate?.min || 0), 0);
    const totalRepairMax = failedPanels.reduce((sum, p) => sum + (p.repairEstimate?.max || 0), 0);

    res.json({
      overallVerdict,
      overallInterpretation,
      panelResults,
      summary: {
        totalPanelsTested: panelResults.filter(p => p.status !== 'SKIPPED').length,
        passed: passedPanels.length,
        concerns: concernPanels.length,
        failed: failedPanels.length,
        failedPanelNames: failedPanels.map(p => p.panel),
      },
      repairEstimate: totalRepairMin > 0
        ? { min: totalRepairMin, max: totalRepairMax, currency: 'USD' }
        : null,
      aiVisualNote,
      factorySpec: FACTORY_PAINT_SPEC,
      toolNote: 'Readings taken with calibrated paint thickness gauge. Factory spec: 90–190 µm. Repaint threshold: >220 µm. Filler threshold: >400 µm.',
    });

  } catch (error) {
    console.error('[AdvancedTools] Paint thickness error:', error);
    res.status(500).json({ error: 'Paint thickness analysis failed', details: error.message });
  }
});

/**
 * POST /api/advanced/analyze-battery
 * Accepts: measuredCCA, ratedCCA, restingVoltage, alternatorVoltage, engineRunning,
 *          batteryAge, vehicleType, dualBattery (for RV/Commercial)
 * Returns: battery health verdict, charging system verdict, recommendations
 */
router.post('/analyze-battery', authenticateToken, async (req, res) => {
  try {
    const {
      measuredCCA,
      ratedCCA,
      restingVoltage,
      alternatorVoltage,
      engineRunning,
      batteryAge,
      vehicleType,
      dualBattery,
      houseBankVoltage,   // RV house battery bank
      houseBankCapacity,  // RV house bank Ah
    } = req.body;

    const results = [];

    // ── Battery CCA Health ──────────────────────────────────────────────────
    if (measuredCCA && ratedCCA) {
      const ccaPercent = Math.round((Number(measuredCCA) / Number(ratedCCA)) * 100);
      let batteryStatus, batteryNote, batteryRepair;

      if (ccaPercent >= 80) {
        batteryStatus = 'PASS';
        batteryNote = `Battery healthy at ${ccaPercent}% of rated CCA (${measuredCCA}/${ratedCCA} CCA). No replacement needed.`;
        batteryRepair = null;
      } else if (ccaPercent >= 60) {
        batteryStatus = 'CONCERN';
        batteryNote = `Battery weakening at ${ccaPercent}% of rated CCA (${measuredCCA}/${ratedCCA} CCA). Replacement recommended within 6 months. May struggle in cold weather.`;
        batteryRepair = { min: 120, max: 280, note: 'Battery replacement (varies by group size)' };
      } else {
        batteryStatus = 'FAIL';
        batteryNote = `Battery failing at ${ccaPercent}% of rated CCA (${measuredCCA}/${ratedCCA} CCA). Immediate replacement required. Risk of no-start within weeks.`;
        batteryRepair = { min: 120, max: 280, note: 'Immediate battery replacement required' };
      }

      results.push({
        test: 'Battery CCA Load Test',
        status: batteryStatus,
        reading: `${measuredCCA} CCA measured / ${ratedCCA} CCA rated (${ccaPercent}%)`,
        interpretation: batteryNote,
        repairEstimate: batteryRepair,
      });
    }

    // ── Resting Voltage ─────────────────────────────────────────────────────
    if (restingVoltage) {
      const v = Number(restingVoltage);
      let vStatus, vNote;
      if (v >= 12.6) { vStatus = 'PASS'; vNote = `${v}V — fully charged`; }
      else if (v >= 12.4) { vStatus = 'CONCERN'; vNote = `${v}V — 75% charge. Battery may be discharging or have a parasitic drain.`; }
      else if (v >= 12.0) { vStatus = 'CONCERN'; vNote = `${v}V — 50% charge. Battery needs charging and load testing.`; }
      else { vStatus = 'FAIL'; vNote = `${v}V — critically discharged or dead cell. Replace battery.`; }

      results.push({
        test: 'Battery Resting Voltage',
        status: vStatus,
        reading: `${v}V`,
        interpretation: vNote,
        repairEstimate: vStatus === 'FAIL' ? { min: 120, max: 280, note: 'Battery replacement' } : null,
      });
    }

    // ── Alternator / Charging System ────────────────────────────────────────
    if (alternatorVoltage && engineRunning) {
      const av = Number(alternatorVoltage);
      let altStatus, altNote, altRepair;

      if (av >= 13.8 && av <= 14.8) {
        altStatus = 'PASS';
        altNote = `${av}V — alternator charging normally (spec: 13.8–14.8V at idle with accessories on).`;
        altRepair = null;
      } else if (av >= 13.5 && av < 13.8) {
        altStatus = 'CONCERN';
        altNote = `${av}V — slightly below optimal charging voltage. Monitor for battery drain. May indicate a weak alternator or high accessory load.`;
        altRepair = { min: 200, max: 600, note: 'Alternator inspection/replacement' };
      } else if (av > 14.8) {
        altStatus = 'CONCERN';
        altNote = `${av}V — overcharging. Can damage battery and electrical components. Check voltage regulator.`;
        altRepair = { min: 150, max: 400, note: 'Voltage regulator replacement' };
      } else {
        altStatus = 'FAIL';
        altNote = `${av}V — alternator not charging properly (below 13.5V with engine running). Battery will drain. Alternator replacement likely required.`;
        altRepair = { min: 300, max: 900, note: 'Alternator replacement + labor' };
      }

      results.push({
        test: 'Alternator / Charging System',
        status: altStatus,
        reading: `${av}V (engine running)`,
        interpretation: altNote,
        repairEstimate: altRepair,
      });
    }

    // ── RV House Battery Bank ───────────────────────────────────────────────
    if (houseBankVoltage && vehicleType === 'RV') {
      const hv = Number(houseBankVoltage);
      let hvStatus, hvNote;
      // 12V house bank: 12.6V = 100%, 12.0V = 50%, 11.8V = 20%
      if (hv >= 12.5) { hvStatus = 'PASS'; hvNote = `${hv}V — house battery bank well charged (≥80% state of charge).`; }
      else if (hv >= 12.2) { hvStatus = 'CONCERN'; hvNote = `${hv}V — house battery bank at ~50% charge. May indicate aging batteries or recent heavy use.`; }
      else { hvStatus = 'FAIL'; hvNote = `${hv}V — house battery bank critically low. Batteries may be sulfated or failing. Test each battery individually.`; }

      results.push({
        test: 'RV House Battery Bank',
        status: hvStatus,
        reading: `${hv}V${houseBankCapacity ? ` / ${houseBankCapacity}Ah rated capacity` : ''}`,
        interpretation: hvNote,
        repairEstimate: hvStatus === 'FAIL' ? { min: 400, max: 1800, note: 'House battery bank replacement (varies by Ah capacity and chemistry)' } : null,
      });
    }

    // ── Overall Verdict ─────────────────────────────────────────────────────
    const hasFail = results.some(r => r.status === 'FAIL');
    const hasConcern = results.some(r => r.status === 'CONCERN');
    const overallVerdict = hasFail ? 'FAIL' : hasConcern ? 'CONCERN' : 'PASS';

    const totalRepairMin = results.reduce((s, r) => s + (r.repairEstimate?.min || 0), 0);
    const totalRepairMax = results.reduce((s, r) => s + (r.repairEstimate?.max || 0), 0);

    res.json({
      overallVerdict,
      results,
      repairEstimate: totalRepairMin > 0 ? { min: totalRepairMin, max: totalRepairMax, currency: 'USD' } : null,
      toolNote: 'Battery load test performed with dedicated CCA tester (Midtronics/ANCEL). OBD-II voltage readings are supplementary — not a substitute for a proper load test.',
    });

  } catch (error) {
    console.error('[AdvancedTools] Battery test error:', error);
    res.status(500).json({ error: 'Battery analysis failed', details: error.message });
  }
});

/**
 * POST /api/advanced/analyze-brake-fluid
 * Accepts: moisturePercent (from digital tester) or stripResult ('good'|'fair'|'poor')
 * Returns: boiling point estimate, replacement recommendation, safety risk level
 */
router.post('/analyze-brake-fluid', authenticateToken, async (req, res) => {
  try {
    const { moisturePercent, stripResult, dotRating, vehicleType } = req.body;

    if (!moisturePercent && !stripResult) {
      return res.status(400).json({ error: 'Either moisturePercent or stripResult is required' });
    }

    let status, boilingPoint, safetyRisk, recommendation, repairEstimate;

    if (moisturePercent !== undefined) {
      const pct = Number(moisturePercent);

      if (pct < 1.0) {
        status = 'PASS';
        boilingPoint = dotRating === 'DOT 5.1' ? '≥270°C (518°F)' : dotRating === 'DOT 4' ? '≥230°C (446°F)' : '≥205°C (401°F)';
        safetyRisk = 'LOW';
        recommendation = `Brake fluid in excellent condition (${pct}% moisture). No service needed.`;
        repairEstimate = null;
      } else if (pct < 2.0) {
        status = 'CONCERN';
        boilingPoint = '~170°C (338°F) estimated — reduced from new';
        safetyRisk = 'MODERATE';
        recommendation = `Brake fluid at ${pct}% moisture. Boiling point reduced. Recommend flush within 12 months or before track/towing use.`;
        repairEstimate = { min: 80, max: 180, note: 'Brake fluid flush (all 4 corners)' };
      } else if (pct < 3.5) {
        status = 'FAIL';
        boilingPoint = '~140°C (284°F) estimated — significantly degraded';
        safetyRisk = 'HIGH';
        recommendation = `Brake fluid at ${pct}% moisture — REPLACE BEFORE DELIVERY. At this level, aggressive braking (towing, mountain driving, panic stop) can cause vapor lock and complete brake failure.`;
        repairEstimate = { min: 80, max: 180, note: 'Immediate brake fluid flush required' };
      } else {
        status = 'FAIL';
        boilingPoint = '<120°C (248°F) estimated — dangerously degraded';
        safetyRisk = 'CRITICAL';
        recommendation = `Brake fluid at ${pct}% moisture — SAFETY HAZARD. Brake fade and vapor lock risk under normal driving conditions. Immediate flush required. Do not operate vehicle in current condition.`;
        repairEstimate = { min: 80, max: 200, note: 'Immediate brake fluid flush + brake system inspection' };
      }
    } else {
      // Strip result fallback
      const stripMap = {
        good: { status: 'PASS', safetyRisk: 'LOW', recommendation: 'Brake fluid test strip indicates good condition. No service needed.' },
        fair: { status: 'CONCERN', safetyRisk: 'MODERATE', recommendation: 'Brake fluid test strip indicates marginal condition. Recommend flush within 12 months.' },
        poor: { status: 'FAIL', safetyRisk: 'HIGH', recommendation: 'Brake fluid test strip indicates degraded fluid. Flush recommended before purchase/delivery.' },
      };
      const mapped = stripMap[stripResult] || stripMap.fair;
      status = mapped.status;
      safetyRisk = mapped.safetyRisk;
      recommendation = mapped.recommendation;
      boilingPoint = 'Not measured (strip test only)';
      repairEstimate = status === 'FAIL' ? { min: 80, max: 180, note: 'Brake fluid flush' } : null;
    }

    res.json({
      status,
      safetyRisk,
      boilingPoint,
      recommendation,
      repairEstimate,
      dotRating: dotRating || 'Unknown',
      testMethod: moisturePercent !== undefined ? 'Digital moisture tester' : 'Test strip',
      toolNote: 'Brake fluid moisture above 2% significantly reduces boiling point. Most manufacturers recommend replacement every 2 years regardless of moisture level.',
    });

  } catch (error) {
    console.error('[AdvancedTools] Brake fluid error:', error);
    res.status(500).json({ error: 'Brake fluid analysis failed', details: error.message });
  }
});

/**
 * POST /api/advanced/analyze-borescope
 * Accepts: photos (base64 array), cylinderCount, engineType, mileage
 * Returns: per-cylinder AI findings, overall engine internal condition verdict
 */
router.post('/analyze-borescope', authenticateToken, async (req, res) => {
  try {
    const { photos, cylinderCount, engineType, mileage, vehicleType } = req.body;

    if (!photos || !Array.isArray(photos) || photos.length === 0) {
      return res.status(400).json({ error: 'At least one borescope photo is required' });
    }

    const cylinderFindings = [];
    let criticalCount = 0;
    let concernCount = 0;

    for (let i = 0; i < Math.min(photos.length, cylinderCount || 8); i++) {
      const photo = photos[i];
      if (!photo) continue;

      const prompt = `You are an expert engine borescope inspector analyzing cylinder ${i + 1} of a ${engineType || 'gasoline'} engine with ${mileage || 'unknown'} miles.

Examine this borescope image for:
1. CYLINDER WALL: Scoring, scratches, glazing, or excessive wear
2. PISTON CROWN: Carbon buildup, burning, cracks, or damage
3. VALVES (if visible): Carbon deposits, burning, pitting, or damage
4. COOLANT INTRUSION: White/grey deposits indicating head gasket leak
5. OIL CONSUMPTION: Excessive oil fouling or wet oil on piston crown
6. OVERALL CONDITION: Rate as EXCELLENT / GOOD / CONCERN / CRITICAL

Respond in this exact format:
CYLINDER: ${i + 1}
CONDITION: [EXCELLENT/GOOD/CONCERN/CRITICAL]
WALL_CONDITION: [description]
PISTON_CONDITION: [description]
COOLANT_INTRUSION: [YES/NO/POSSIBLE]
OIL_FOULING: [NONE/MINOR/MODERATE/SEVERE]
FINDINGS: [2-3 sentence summary]
REPAIR_NEEDED: [YES/NO]
REPAIR_ESTIMATE: [cost range or NONE]`;

      try {
        const aiResult = await analyzeImage(photo, prompt);

        const conditionMatch = aiResult.match(/CONDITION:\s*(EXCELLENT|GOOD|CONCERN|CRITICAL)/i);
        const coolantMatch = aiResult.match(/COOLANT_INTRUSION:\s*(YES|NO|POSSIBLE)/i);
        const repairMatch = aiResult.match(/REPAIR_NEEDED:\s*(YES|NO)/i);
        const findingsMatch = aiResult.match(/FINDINGS:\s*(.+?)(?=\n[A-Z_]+:|$)/is);
        const estimateMatch = aiResult.match(/REPAIR_ESTIMATE:\s*(.+?)(?=\n|$)/i);

        const condition = conditionMatch?.[1]?.toUpperCase() || 'UNKNOWN';
        if (condition === 'CRITICAL') criticalCount++;
        else if (condition === 'CONCERN') concernCount++;

        cylinderFindings.push({
          cylinder: i + 1,
          condition,
          coolantIntrusion: coolantMatch?.[1] || 'UNKNOWN',
          repairNeeded: repairMatch?.[1] === 'YES',
          findings: findingsMatch?.[1]?.trim() || aiResult.substring(0, 200),
          repairEstimate: estimateMatch?.[1]?.trim() || null,
        });
      } catch (e) {
        cylinderFindings.push({
          cylinder: i + 1,
          condition: 'ANALYSIS_FAILED',
          findings: 'AI analysis failed for this cylinder. Review photo manually.',
          repairNeeded: false,
          repairEstimate: null,
        });
      }
    }

    const overallVerdict = criticalCount > 0 ? 'CRITICAL'
      : concernCount >= 2 ? 'FAIL'
      : concernCount > 0 ? 'CONCERN'
      : 'PASS';

    const overallNote = overallVerdict === 'CRITICAL'
      ? `${criticalCount} cylinder(s) show critical damage. Engine rebuild or replacement likely required. Do not purchase without professional engine shop evaluation.`
      : overallVerdict === 'FAIL'
      ? `${concernCount} cylinders show significant wear or damage. Engine has reduced service life. Factor repair costs into negotiation.`
      : overallVerdict === 'CONCERN'
      ? `${concernCount} cylinder(s) show minor concerns. Monitor oil consumption and compression. May need attention within 12–24 months.`
      : `All ${cylinderFindings.length} cylinders inspected show normal wear for mileage. Engine internals in good condition.`;

    res.json({
      overallVerdict,
      overallNote,
      cylinderFindings,
      cylindersInspected: cylinderFindings.length,
      criticalCylinders: criticalCount,
      concernCylinders: concernCount,
      toolNote: 'Borescope inspection performed through spark plug ports. Provides visual assessment of cylinder walls, piston crowns, and valve condition without engine disassembly.',
    });

  } catch (error) {
    console.error('[AdvancedTools] Borescope error:', error);
    res.status(500).json({ error: 'Borescope analysis failed', details: error.message });
  }
});

/**
 * POST /api/advanced/check-nmvtis
 * Checks VIN against NMVTIS database and Copart/IAAI auction records.
 * Uses NHTSA public API (free) + AI analysis of title history.
 * Full NMVTIS requires a paid API key — this provides the framework and
 * falls back to NHTSA + AI pattern analysis.
 */
router.post('/check-nmvtis', authenticateToken, async (req, res) => {
  try {
    const { vin, stateHistory, titleBrands, previousOwners, mileageHistory } = req.body;

    if (!vin || vin.length !== 17) {
      return res.status(400).json({ error: 'Valid 17-character VIN is required' });
    }

    // Fetch NHTSA recall data (free public API) as a baseline
    let nhtsaData = null;
    try {
      const nhtsaRes = await fetch(`https://api.nhtsa.gov/complaints/complaintsByVehicle?make=&model=&modelYear=`);
      // Use VIN decode endpoint
      const vinRes = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${vin}?format=json`);
      if (vinRes.ok) {
        nhtsaData = await vinRes.json();
      }
    } catch (e) {
      // NHTSA unavailable — continue with AI analysis
    }

    // AI analysis of provided history data
    const historyPrompt = `You are an expert vehicle title fraud investigator specializing in NMVTIS title washing and total loss fraud.

Analyze this vehicle history for red flags:
VIN: ${vin}
State Registration History: ${stateHistory ? stateHistory.join(' → ') : 'Not provided'}
Title Brands Reported: ${titleBrands || 'None reported'}
Previous Owners: ${previousOwners || 'Unknown'}
Mileage History: ${mileageHistory ? JSON.stringify(mileageHistory) : 'Not provided'}

Check for these specific fraud patterns:
1. TITLE WASHING: Vehicle registered in 3+ states in short period (common washing route: TX→MS→TN or FL→GA→SC)
2. TOTAL LOSS HIDING: Gap in ownership history + state change = possible rebuilt title concealment
3. ODOMETER ROLLBACK: Non-sequential mileage in history
4. NMVTIS GAPS: Periods with no reported activity (vehicle may have been totaled and not reported)
5. AUCTION HISTORY INDICATORS: Multiple short-term ownerships (dealers flipping rebuilt titles)

Respond with:
TITLE_WASH_RISK: [LOW/MEDIUM/HIGH/CRITICAL]
TOTAL_LOSS_RISK: [LOW/MEDIUM/HIGH/CRITICAL]  
ODOMETER_RISK: [LOW/MEDIUM/HIGH]
RED_FLAGS: [list any specific concerns, or NONE]
RECOMMENDATION: [2-3 sentence buyer guidance]
SUGGESTED_CHECKS: [specific additional checks recommended]`;

    let aiAnalysis = null;
    let titleWashRisk = 'UNKNOWN';
    let totalLossRisk = 'UNKNOWN';
    let redFlags = [];
    let recommendation = '';
    let suggestedChecks = '';

    try {
      aiAnalysis = await analyzeImage(null, historyPrompt, true); // text-only mode
      const washMatch = aiAnalysis.match(/TITLE_WASH_RISK:\s*(LOW|MEDIUM|HIGH|CRITICAL)/i);
      const lossMatch = aiAnalysis.match(/TOTAL_LOSS_RISK:\s*(LOW|MEDIUM|HIGH|CRITICAL)/i);
      const flagsMatch = aiAnalysis.match(/RED_FLAGS:\s*(.+?)(?=\n[A-Z_]+:|$)/is);
      const recMatch = aiAnalysis.match(/RECOMMENDATION:\s*(.+?)(?=\n[A-Z_]+:|$)/is);
      const checksMatch = aiAnalysis.match(/SUGGESTED_CHECKS:\s*(.+?)(?=\n[A-Z_]+:|$)/is);

      titleWashRisk = washMatch?.[1]?.toUpperCase() || 'UNKNOWN';
      totalLossRisk = lossMatch?.[1]?.toUpperCase() || 'UNKNOWN';
      const flagText = flagsMatch?.[1]?.trim() || '';
      redFlags = flagText === 'NONE' ? [] : flagText.split('\n').filter(f => f.trim());
      recommendation = recMatch?.[1]?.trim() || '';
      suggestedChecks = checksMatch?.[1]?.trim() || '';
    } catch (e) {
      recommendation = 'AI analysis unavailable. Manually check VIN on Copart.com, IAAI.com, and NMVTIS.gov before purchase.';
    }

    const overallRisk = ['CRITICAL', 'HIGH'].includes(titleWashRisk) || ['CRITICAL', 'HIGH'].includes(totalLossRisk)
      ? 'HIGH'
      : ['MEDIUM'].includes(titleWashRisk) || ['MEDIUM'].includes(totalLossRisk)
      ? 'MEDIUM'
      : 'LOW';

    res.json({
      vin,
      overallRisk,
      titleWashRisk,
      totalLossRisk,
      redFlags,
      recommendation,
      suggestedChecks,
      manualCheckLinks: [
        { name: 'Copart Auction History', url: `https://www.copart.com/lot/search/#?query=${vin}` },
        { name: 'IAAI Auction History', url: `https://www.iaai.com/Search?SearchText=${vin}` },
        { name: 'NMVTIS Official Check', url: `https://vehiclehistory.bja.ojp.gov/` },
        { name: 'NHTSA VIN Decoder', url: `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${vin}?format=json` },
      ],
      toolNote: 'NMVTIS check uses AI pattern analysis of provided history data. For a certified NMVTIS report, use vehiclehistory.bja.ojp.gov ($2–5 fee). Always cross-check VIN on Copart and IAAI directly.',
    });

  } catch (error) {
    console.error('[AdvancedTools] NMVTIS check error:', error);
    res.status(500).json({ error: 'NMVTIS check failed', details: error.message });
  }
});

export default router;
