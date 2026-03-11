import { vehicleImages } from '../vehicleImages';
import { vehicleImages } from '../vehicleImages';
import React, { useState, useEffect, useRef } from 'react';
import { SalesChatWidget } from './SalesChatWidget';
import { LiveActivityTicker } from './LiveActivityTicker';

// ── Demo Vehicle Data ─────────────────────────────────────────────────────
const DEMO_VEHICLES = [
  {
    vin: '1HGCM82633A004352',
    make: 'Honda', model: 'Accord', year: 2003, vehicleType: 'Sedan',
    mileage: 142000, color: 'Silver', image: vehicleImages['v-car-suv'],
    score: 22,
    scoreLabel: 'DANGER — DO NOT BUY',
    scoreColor: '#ef4444',
    scoreBg: 'border-red-500/50 bg-red-950/20',
    flags: ['Odometer rollback confirmed', 'Flood damage markers', 'Louisiana title history'],
    findings: [
      { severity: 'critical', text: 'ODOMETER ROLLBACK CONFIRMED: Service records show 187,000 miles at last oil change. Current reading is 142,000. Someone rolled back 45,000 miles.' },
      { severity: 'critical', text: 'FLOOD DAMAGE: Corrosion pattern on ECU connectors is consistent with full submersion. Musty odor indicators in interior lining. This car was underwater.' },
      { severity: 'critical', text: 'TITLE WASHING: Vehicle was registered in Louisiana (Katrina flood zone) then re-titled in Nevada. Classic title washing pattern.' },
      { severity: 'warning', text: 'FRAME DAMAGE: Minor unibody repair detected at left front rail. Not disclosed in listing. Airbag deployment likely.' },
      { severity: 'info', text: 'Engine: No active DTC codes. Compression within spec — but flood damage to electronics will cause failures within 12–18 months.' },
    ],
    recommendation: 'DO NOT BUY. Walk away immediately. This vehicle has been fraudulently misrepresented. The seller knows about the odometer rollback and the flood damage. Report to your state DMV.',
    recommendationColor: '#ef4444',
    dealerTrick: 'The "Louisiana to Nevada" title wash is one of the most common flood car schemes after major hurricanes. Dealers buy flooded cars at auction for $800, dry them out, re-title in a dry state, and sell for $12,000.',
    repairCost: '$18,000–$25,000 in hidden repairs',
    negotiationLeverage: 'N/A — walk away',
  },
  {
    vin: '1FTFW1ET5DFC10312',
    make: 'Ford', model: 'F-150', year: 2013, vehicleType: 'Pickup Truck',
    mileage: 89000, color: 'Blue', image: vehicleImages['v-pickup'],
    score: 87,
    scoreLabel: 'SAFE TO BUY',
    scoreColor: '#22c55e',
    scoreBg: 'border-green-500/50 bg-green-950/20',
    flags: [],
    findings: [
      { severity: 'info', text: 'ODOMETER: Clean. Mileage consistent with service history across 4 registered states. No anomalies detected.' },
      { severity: 'info', text: 'TITLE: Clean title. No flood, fire, salvage, or lemon law markers in any state database.' },
      { severity: 'warning', text: 'REAR DIFFERENTIAL: Minor seepage noted at pinion seal. Budget $300–$500 for service within 6 months. Use as negotiation leverage.' },
      { severity: 'info', text: 'FRAME: Structural integrity confirmed. No collision repair detected. No welds or filler on frame rails.' },
      { severity: 'info', text: 'ENGINE: 2 historical DTCs (P0420 catalyst efficiency, P0171 lean — both resolved). No active codes. Common on high-mileage 5.0L.' },
    ],
    recommendation: 'SAFE TO BUY. Negotiate $400–$600 off asking price using the rear differential seepage. This is a solid truck at a fair price.',
    recommendationColor: '#22c55e',
    dealerTrick: 'Dealer may claim "just serviced" — ask for the actual service records. The two historical DTCs suggest deferred maintenance. Verify the catalytic converter was actually replaced, not just the code cleared.',
    repairCost: '$300–$500 (rear differential seal)',
    negotiationLeverage: '$400–$600 off asking price',
  },
  {
    vin: '3VWFE21C04M000001',
    make: 'Peterbilt', model: '389 Semi Tractor', year: 2018, vehicleType: 'Commercial Truck',
    mileage: 412000, color: 'White', image: vehicleImages['v-fleet'],
    score: 61,
    scoreLabel: 'PROCEED WITH CAUTION',
    scoreColor: '#eab308',
    scoreBg: 'border-yellow-500/50 bg-yellow-950/20',
    flags: ['DEF system fault codes', 'EGR buildup', 'Deferred maintenance stack'],
    findings: [
      { severity: 'warning', text: 'DEF SYSTEM: J1939 fault SPN 4334 FMI 31 — DEF quality sensor failure. $800–$1,200 to repair. Will trigger derate (power reduction) if ignored.' },
      { severity: 'warning', text: 'EGR VALVE: Soot buildup consistent with 400k+ miles of deferred cleaning. Cleaning $400, replacement $1,800. Common at this mileage.' },
      { severity: 'critical', text: 'DEFERRED MAINTENANCE STACK: DEF + EGR + injector service all overdue simultaneously. This is a $4,200 deferred maintenance bill the seller is passing to you.' },
      { severity: 'info', text: 'FRAME: No cracks or welds detected on main rails or crossmembers. Structural integrity confirmed.' },
      { severity: 'info', text: 'TRANSMISSION: Shift pattern normal. No slippage detected. Eaton Fuller 18-speed appears serviceable.' },
    ],
    recommendation: 'NEGOTIATE DOWN HARD. Use the DEF fault, EGR buildup, and deferred maintenance stack as documented leverage. Estimated $4,200 in immediate repairs. Demand $5,000–$6,000 off asking price or walk.',
    recommendationColor: '#eab308',
    dealerTrick: 'Truck sellers often clear fault codes 24–48 hours before showing the vehicle. The DEF sensor fault will return within 100 miles of driving. Always request a J1939 diagnostic scan before purchase — not just a visual inspection.',
    repairCost: '$4,200 in deferred repairs',
    negotiationLeverage: '$5,000–$6,000 off asking price',
  },
  {
    vin: '5YJSA1E26MF123456',
    make: 'Tesla', model: 'Model S', year: 2021, vehicleType: 'Electric Vehicle',
    mileage: 67000, color: 'Midnight Silver', image: vehicleImages['v-ev'],
    score: 74,
    scoreLabel: 'GOOD BUY — VERIFY BATTERY',
    scoreColor: '#3b82f6',
    scoreBg: 'border-blue-500/50 bg-blue-950/20',
    flags: ['Battery degradation above average', 'Supercharger session count elevated'],
    findings: [
      { severity: 'warning', text: 'BATTERY DEGRADATION: Estimated 91.2% state of health at 67k miles. Average for this model is 94%. Above-average degradation suggests frequent DC fast charging.' },
      { severity: 'warning', text: 'SUPERCHARGER SESSIONS: 847 sessions logged — extremely high. Frequent DC fast charging accelerates battery degradation. This battery has been abused.' },
      { severity: 'info', text: 'AUTOPILOT: No collision events in Autopilot history. All 8 cameras functional. Radar calibrated.' },
      { severity: 'info', text: 'TITLE: Clean. No salvage, rebuilt, or lemon law markers.' },
      { severity: 'info', text: 'RANGE: Current estimated range 285 miles (new: 405 miles). 30% range loss. Factor into purchase decision.' },
    ],
    recommendation: 'GOOD BUY but negotiate hard on battery health. At 91.2% SOH with 847 supercharger sessions, this battery will need replacement in 3–5 years. Battery replacement cost: $12,000–$20,000. Negotiate $4,000–$6,000 off asking price.',
    recommendationColor: '#3b82f6',
    dealerTrick: 'EV sellers rarely disclose supercharger session counts. A car with 800+ DC fast charge sessions has been treated like a rental. The battery will degrade faster than a vehicle charged primarily at home on Level 2.',
    repairCost: '$12,000–$20,000 (battery, 3–5 years)',
    negotiationLeverage: '$4,000–$6,000 off asking price',
  },
  {
    vin: '1G1YY22G965100001',
    make: 'Chevrolet', model: 'Corvette C5', year: 1996, vehicleType: 'Classic / Vintage',
    mileage: 38000, color: 'Torch Red', image: vehicleImages['v-classic'],
    score: 91,
    scoreLabel: 'EXCELLENT — COLLECTOR QUALITY',
    scoreColor: '#a855f7',
    scoreBg: 'border-purple-500/50 bg-purple-950/20',
    flags: [],
    findings: [
      { severity: 'info', text: 'ORIGINALITY: All VIN stampings match. Engine block casting number matches factory records for this VIN. Numbers-matching.' },
      { severity: 'info', text: 'PAINT: Spectral analysis confirms original factory paint on all panels. No repaints detected. Torch Red code WA9075 confirmed.' },
      { severity: 'info', text: 'ODOMETER: 38,000 miles. Consistent with service history. No rollback indicators. Garage-kept vehicle.' },
      { severity: 'warning', text: 'TIMING BELT: Due for replacement at 40,000 miles per factory schedule. Budget $600–$900. Use as minor negotiation point.' },
      { severity: 'info', text: 'TITLE: Clean. Single owner. No liens. Stored in climate-controlled garage per service records.' },
    ],
    recommendation: 'EXCELLENT PURCHASE. This is a numbers-matching, single-owner C5 with original paint and documented history. At current market values, this car is priced fairly. Buy it before someone else does.',
    recommendationColor: '#a855f7',
    dealerTrick: 'Classic car sellers often claim "numbers matching" without documentation. AI Auto Pro cross-references VIN stampings, engine casting numbers, and factory color codes to verify authenticity — something a visual inspection cannot do.',
    repairCost: '$600–$900 (timing belt service)',
    negotiationLeverage: '$500–$800 off for timing belt service',
  },
  {
    vin: '2C4RC1BG8JR123456',
    make: 'Chrysler', model: 'Pacifica (RV Conversion)', year: 2018, vehicleType: 'RV / Motorhome',
    mileage: 156000, color: 'Bright White', image: vehicleImages['v-rv'],
    score: 48,
    scoreLabel: 'HIGH RISK — MAJOR ISSUES',
    scoreColor: '#f97316',
    scoreBg: 'border-orange-500/50 bg-orange-950/20',
    flags: ['Transmission failure imminent', 'Roof seal failure', 'Hidden water damage'],
    findings: [
      { severity: 'critical', text: 'TRANSMISSION: CVT transmission showing characteristic failure pattern. Shudder at 35–45 mph. Chrysler CVT failure rate at 150k+ miles is extremely high. Replacement: $3,500–$5,000.' },
      { severity: 'critical', text: 'WATER INTRUSION: Moisture readings in rear cargo area 340% above baseline. Roof seal failure allowing water into walls. Mold risk. This is a health hazard.' },
      { severity: 'warning', text: 'TIRES: All four tires showing sidewall cracking consistent with UV exposure and age. Replace immediately. $600–$900.' },
      { severity: 'warning', text: 'GENERATOR: Last service 3 years ago. Carbon buildup on spark plugs. Service before use.' },
      { severity: 'info', text: 'ENGINE: 3.6L Pentastar runs clean. No active codes. This engine is reliable — the rest of the vehicle is not.' },
    ],
    recommendation: 'WALK AWAY or negotiate aggressively. The CVT transmission failure and water intrusion together represent $6,000–$9,000 in immediate repairs. This RV is being sold because the owner knows it is failing.',
    recommendationColor: '#f97316',
    dealerTrick: 'RV sellers park vehicles on level ground to hide transmission shudder. Always test drive on a highway at 35–45 mph. The CVT shudder on Chrysler minivan-based RVs is unmistakable once you know what to feel for.',
    repairCost: '$6,000–$9,000 immediate',
    negotiationLeverage: '$7,000–$10,000 off or walk',
  },
];

const SEVERITY_STYLES: Record<string, string> = {
  critical: 'bg-red-950/40 border-l-4 border-red-500 text-red-100',
  warning:  'bg-yellow-950/30 border-l-4 border-yellow-500 text-yellow-100',
  info:     'bg-slate-800/50 border-l-4 border-slate-600 text-slate-200',
};
const SEVERITY_ICONS: Record<string, string> = {
  critical: '🚨',
  warning:  '⚠️',
  info:     '✓',
};
const SEVERITY_LABELS: Record<string, string> = {
  critical: 'CRITICAL',
  warning: 'WARNING',
  info: 'CLEAR',
};

// ── Typing animation ───────────────────────────────────────────────────────
function useTypingEffect(text: string, speed = 15, trigger = 0) {
  const [displayed, setDisplayed] = useState('');
  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const interval = setInterval(() => {
      if (i < text.length) { setDisplayed(text.slice(0, ++i)); }
      else clearInterval(interval);
    }, speed);
    return () => clearInterval(interval);
  }, [text, trigger]);
  return displayed;
}

// ── Animated Score Meter ──────────────────────────────────────────────────
function ScoreMeter({ score, color, label }: { score: number; color: string; label: string }) {
  const [animatedScore, setAnimatedScore] = useState(0);
  const circumference = 2 * Math.PI * 54;

  useEffect(() => {
    setAnimatedScore(0);
    const timer = setTimeout(() => {
      let current = 0;
      const step = score / 60;
      const interval = setInterval(() => {
        current += step;
        if (current >= score) {
          setAnimatedScore(score);
          clearInterval(interval);
        } else {
          setAnimatedScore(Math.round(current));
        }
      }, 16);
      return () => clearInterval(interval);
    }, 200);
    return () => clearTimeout(timer);
  }, [score]);

  const dashOffset = circumference - (animatedScore / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-36">
        <svg className="w-36 h-36 -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="54" fill="none" stroke="#1e293b" strokeWidth="10" />
          <circle
            cx="60" cy="60" r="54" fill="none"
            stroke={color}
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.05s linear' }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-extrabold" style={{ color }}>{animatedScore}</span>
          <span className="text-xs text-slate-400">/ 100</span>
        </div>
      </div>
      <span className="mt-2 text-sm font-bold" style={{ color }}>{label}</span>
    </div>
  );
}

// ── Scan Steps ─────────────────────────────────────────────────────────────
const SCAN_STEPS = [
  { label: 'Decoding VIN with NHTSA federal database...', icon: '🔍' },
  { label: 'Cross-referencing title history across 50 states...', icon: '📋' },
  { label: 'Analyzing odometer patterns and service records...', icon: '🔢' },
  { label: 'Scanning for flood, fire, and hail damage markers...', icon: '💧' },
  { label: 'Running AI fraud detection algorithms...', icon: '🤖' },
  { label: 'Checking for dealer tricks and hidden defects...', icon: '🕵️' },
  { label: 'Analyzing engine audio signature...', icon: '🎙️' },
  { label: 'Generating AI inspection report...', icon: '📄' },
];

interface PublicDemoProps {
  onGetLicense?: () => void;
}

export const PublicDemo: React.FC<PublicDemoProps> = ({ onGetLicense }) => {
  const [step, setStep] = useState<'vin' | 'scanning' | 'results'>('vin');
  const [selectedVehicle, setSelectedVehicle] = useState(0);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [activeTab, setActiveTab] = useState<'findings' | 'dealer' | 'recommendation'>('findings');
  const [nhtsaData, setNhtsaData] = useState<any>(null);
  const [nhtsaLoading, setNhtsaLoading] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);
  const scanRef = useRef<HTMLDivElement>(null);

  const vehicle = DEMO_VEHICLES[selectedVehicle];

  const recommendation = useTypingEffect(
    step === 'results' ? vehicle.recommendation : '',
    18,
    selectedVehicle
  );

  // Fetch real NHTSA data when VIN is shown
  useEffect(() => {
    const fetchNHTSA = async () => {
      setNhtsaLoading(true);
      try {
        const res = await fetch(
          `https://vpic.nhtsa.dot.gov/api/vehicles/decodevinvalues/${vehicle.vin}?format=json`
        );
        const data = await res.json();
        if (data.Results && data.Results[0]) {
          setNhtsaData(data.Results[0]);
        }
      } catch {
        setNhtsaData(null);
      } finally {
        setNhtsaLoading(false);
      }
    };
    fetchNHTSA();
  }, [selectedVehicle]);

  const runScan = () => {
    setStep('scanning');
    setScanProgress(0);
    setScanStepIndex(0);
    setCompletedSteps([]);
    setTimeout(() => scanRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);

    let stepIndex = 0;
    const interval = setInterval(() => {
      setCompletedSteps(prev => [...prev, stepIndex]);
      stepIndex++;
      setScanStepIndex(stepIndex);
      setScanProgress(Math.round((stepIndex / SCAN_STEPS.length) * 100));
      if (stepIndex >= SCAN_STEPS.length) {
        clearInterval(interval);
        setTimeout(() => {
          setStep('results');
          setActiveTab('findings');
          setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
        }, 500);
      }
    }, 500);
  };

  const reset = (vehicleIndex: number) => {
    setSelectedVehicle(vehicleIndex);
    setStep('vin');
    setScanProgress(0);
    setCompletedSteps([]);
  };

  return (
    <div className="min-h-screen bg-dark-bg text-light-text">

      {/* ── HERO ── */}
      <div
        className="relative bg-cover bg-center border-b border-dark-border"
        style={{ backgroundImage: `url(${vehicleImages['hero-car-lot']})` }}
      >
        <div className="absolute inset-0 bg-dark-bg/80" />
        <div className="relative max-w-5xl mx-auto px-4 py-20 text-center">
          <div className="inline-block bg-primary/20 border border-primary/40 rounded-full px-4 py-1.5 text-xs font-bold text-primary mb-6 uppercase tracking-widest">
            Live Interactive Demo — No Login Required
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-4 leading-tight">
            The AI That Catches<br />
            <span className="text-primary">What Dealers Don't Want You to Know</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
            Odometer rollback. Flood damage. VIN cloning. Title washing. Battery degradation. Engine faults.
            Pick a vehicle below and watch the AI expose everything — in real time.
          </p>
          <div className="flex flex-wrap gap-2 justify-center text-sm">
            {['Car / SUV', 'Pickup Truck', 'RV / Motorhome', '18-Wheeler', 'EV', 'Classic / Vintage', 'Motorcycle', 'Fleet'].map(v => (
              <span key={v} className="bg-white/10 border border-white/20 rounded-full px-3 py-1 text-white/80 text-xs">{v}</span>
            ))}
          </div>
        </div>
      </div>

      {/* ── DEMO SECTION ── */}
      <div className="max-w-5xl mx-auto px-4 py-12">

        {/* Vehicle selector */}
        <div className="mb-8">
          <p className="text-sm text-slate-400 mb-4 text-center font-medium uppercase tracking-wider">Choose a vehicle to inspect:</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {DEMO_VEHICLES.map((v, i) => (
              <button
                key={i}
                onClick={() => reset(i)}
                className={`relative overflow-hidden rounded-xl border text-left transition-all group ${
                  selectedVehicle === i
                    ? 'border-primary shadow-lg shadow-primary/20'
                    : 'border-slate-700 hover:border-primary/50'
                }`}
              >
                <div className="h-24 bg-cover bg-center relative" style={{ backgroundImage: `url('${v.image}?v=8')` }}>
                  <div className="absolute inset-0 bg-dark-bg/50" />
                  <div className="absolute bottom-0 left-0 right-0 p-2">
                    <div className="font-bold text-xs text-white">{v.year} {v.make} {v.model}</div>
                    <div className="text-xs text-slate-300">{v.vehicleType}</div>
                  </div>
                </div>
                <div className={`px-3 py-2 flex items-center justify-between ${selectedVehicle === i ? 'bg-primary/10' : 'bg-slate-900'}`}>
                  <span className="text-xs text-slate-400">{v.mileage.toLocaleString()} mi</span>
                  <span className="text-xs font-bold" style={{ color: v.scoreColor }}>{v.scoreLabel.split(' ')[0]}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* VIN Entry Step */}
        {step === 'vin' && (
          <div className="bg-slate-900 rounded-2xl border border-slate-700 overflow-hidden">
            {/* Vehicle header image */}
            <div className="h-48 bg-cover bg-center relative" style={{ backgroundImage: `url('${vehicle.image}?v=8')` }}>
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent" />
              <div className="absolute bottom-4 left-6">
                <h2 className="text-2xl font-extrabold text-white">{vehicle.year} {vehicle.make} {vehicle.model}</h2>
                <p className="text-slate-300 text-sm">{vehicle.vehicleType} · {vehicle.mileage.toLocaleString()} miles · {vehicle.color}</p>
              </div>
            </div>

            <div className="p-8">
              {/* NHTSA live decode */}
              <div className="mb-6 p-4 bg-slate-800 rounded-xl border border-slate-600">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                  <span className="text-xs font-bold text-green-400 uppercase tracking-wider">NHTSA Federal Database — Live Decode</span>
                </div>
                {nhtsaLoading ? (
                  <div className="text-sm text-slate-400 animate-pulse">Connecting to NHTSA database...</div>
                ) : nhtsaData ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    {[
                      { label: 'Make', value: nhtsaData.Make || vehicle.make },
                      { label: 'Model', value: nhtsaData.Model || vehicle.model },
                      { label: 'Year', value: nhtsaData.ModelYear || vehicle.year },
                      { label: 'Body Type', value: nhtsaData.BodyClass || vehicle.vehicleType },
                      { label: 'Engine', value: nhtsaData.DisplacementL ? `${nhtsaData.DisplacementL}L ${nhtsaData.FuelTypePrimary || ''}` : 'N/A' },
                      { label: 'Drive Type', value: nhtsaData.DriveType || 'N/A' },
                      { label: 'Doors', value: nhtsaData.Doors || 'N/A' },
                      { label: 'Plant Country', value: nhtsaData.PlantCountry || 'N/A' },
                    ].map(item => (
                      <div key={item.label} className="bg-slate-900/50 rounded-lg p-2">
                        <div className="text-slate-500 mb-0.5">{item.label}</div>
                        <div className="text-white font-medium truncate">{item.value}</div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-slate-400">VIN decode data unavailable</div>
                )}
              </div>

              <div className="text-center">
                <p className="text-slate-400 text-sm mb-4">VIN pre-loaded — click to run the full AI inspection</p>
                <div className="flex gap-2 max-w-md mx-auto mb-6">
                  <input
                    type="text"
                    readOnly
                    value={vehicle.vin}
                    className="flex-1 bg-slate-800 border border-slate-600 rounded-lg px-4 py-3 font-mono text-sm text-white focus:outline-none focus:border-primary"
                  />
                  <button
                    onClick={runScan}
                    className="bg-primary hover:bg-primary/90 text-white font-bold px-6 py-3 rounded-lg transition-all shadow-lg shadow-primary/30 whitespace-nowrap"
                  >
                    Run AI Inspection →
                  </button>
                </div>
                <div className="flex flex-wrap gap-4 justify-center text-xs text-slate-400">
                  <span className="flex items-center gap-1"><span className="text-green-400">✓</span> NHTSA VIN Decode (Live)</span>
                  <span className="flex items-center gap-1"><span className="text-green-400">✓</span> AI Fraud Detection</span>
                  <span className="flex items-center gap-1"><span className="text-green-400">✓</span> Engine Audio Analysis</span>
                  <span className="flex items-center gap-1"><span className="text-green-400">✓</span> Dealer Tricks Exposure</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Scanning Step */}
        {step === 'scanning' && (
          <div ref={scanRef} className="bg-slate-900 rounded-2xl border border-slate-700 p-8">
            <div className="text-center mb-8">
              <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-white mb-1">AI Analysis Running</h2>
              <p className="text-slate-400 text-sm">{vehicle.year} {vehicle.make} {vehicle.model}</p>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-800 rounded-full h-3 overflow-hidden mb-6">
              <div
                className="h-full bg-gradient-to-r from-primary to-purple-500 rounded-full transition-all duration-500"
                style={{ width: `${scanProgress}%` }}
              />
            </div>
            <p className="text-center text-xs text-slate-400 mb-8">{scanProgress}% complete</p>

            {/* Step list */}
            <div className="space-y-3 max-w-lg mx-auto">
              {SCAN_STEPS.map((s, i) => (
                <div
                  key={i}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-300 ${
                    completedSteps.includes(i)
                      ? 'bg-green-950/30 border border-green-800/40'
                      : i === scanStepIndex
                      ? 'bg-primary/10 border border-primary/30'
                      : 'bg-slate-800/30 border border-slate-700/30 opacity-40'
                  }`}
                >
                  <span className="text-lg shrink-0">
                    {completedSteps.includes(i) ? '✅' : i === scanStepIndex ? '⏳' : s.icon}
                  </span>
                  <span className={`text-sm font-mono ${
                    completedSteps.includes(i) ? 'text-green-300' :
                    i === scanStepIndex ? 'text-primary' : 'text-slate-500'
                  }`}>
                    {completedSteps.includes(i) ? s.label.replace('...', ' — COMPLETE') : s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Results Step */}
        {step === 'results' && (
          <div ref={resultsRef} className="space-y-5">

            {/* Score card + vehicle info */}
            <div className={`rounded-2xl border p-6 ${vehicle.scoreBg}`}>
              <div className="flex items-center justify-between flex-wrap gap-6">
                <ScoreMeter score={vehicle.score} color={vehicle.scoreColor} label={vehicle.scoreLabel} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Inspected Vehicle</span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-white mb-1">{vehicle.year} {vehicle.make} {vehicle.model}</h3>
                  <p className="text-sm text-slate-400 mb-3">VIN: <span className="font-mono text-slate-300">{vehicle.vin}</span> · {vehicle.mileage.toLocaleString()} miles · {vehicle.vehicleType}</p>
                  {vehicle.flags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {vehicle.flags.map(f => (
                        <span key={f} className="text-xs bg-red-950/60 text-red-300 border border-red-700/40 rounded-full px-3 py-1">🚩 {f}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 gap-2 text-right">
                  <div className="bg-slate-800/60 rounded-lg px-4 py-2">
                    <div className="text-xs text-slate-500 mb-0.5">Estimated Repair Cost</div>
                    <div className="text-sm font-bold text-red-400">{vehicle.repairCost}</div>
                  </div>
                  <div className="bg-slate-800/60 rounded-lg px-4 py-2">
                    <div className="text-xs text-slate-500 mb-0.5">Negotiation Leverage</div>
                    <div className="text-sm font-bold text-green-400">{vehicle.negotiationLeverage}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 bg-slate-900 rounded-xl border border-slate-700 p-1">
              {([
                { key: 'findings', label: `🔍 ${vehicle.findings.length} Findings` },
                { key: 'dealer', label: '🕵️ Dealer Trick' },
                { key: 'recommendation', label: '🤖 AI Verdict' },
              ] as const).map(t => (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === t.key ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Findings */}
            {activeTab === 'findings' && (
              <div className="space-y-3">
                {vehicle.findings.map((f, i) => (
                  <div key={i} className={`rounded-xl p-4 ${SEVERITY_STYLES[f.severity]}`}>
                    <div className="flex items-start gap-3">
                      <span className="text-lg shrink-0 mt-0.5">{SEVERITY_ICONS[f.severity]}</span>
                      <div>
                        <span className={`text-xs font-bold uppercase tracking-wider mr-2 ${
                          f.severity === 'critical' ? 'text-red-400' :
                          f.severity === 'warning' ? 'text-yellow-400' : 'text-slate-400'
                        }`}>{SEVERITY_LABELS[f.severity]}</span>
                        <p className="text-sm leading-relaxed mt-1">{f.text}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Dealer Trick */}
            {activeTab === 'dealer' && (
              <div className="bg-amber-950/30 rounded-xl border border-amber-700/40 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🕵️</span>
                  <div>
                    <h3 className="font-bold text-white">Dealer Trick Exposed</h3>
                    <p className="text-xs text-amber-400">What the seller doesn't want you to know</p>
                  </div>
                </div>
                <p className="text-sm text-amber-100 leading-relaxed">{vehicle.dealerTrick}</p>
                <div className="mt-4 p-3 bg-amber-900/20 rounded-lg border border-amber-700/30">
                  <p className="text-xs text-amber-300 font-medium">
                    💡 AI Auto Pro exposes this trick automatically on every inspection — no experience required.
                  </p>
                </div>
              </div>
            )}

            {/* AI Recommendation */}
            {activeTab === 'recommendation' && (
              <div className="bg-slate-900 rounded-xl border border-slate-700 p-6">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-2xl">🤖</span>
                  <div>
                    <h3 className="font-bold text-white">AI Verdict</h3>
                    <p className="text-xs text-slate-400">Powered by AI Auto Pro</p>
                  </div>
                </div>
                <p className="text-lg font-extrabold leading-relaxed min-h-[3rem]" style={{ color: vehicle.scoreColor }}>
                  {recommendation}
                  <span className="animate-pulse opacity-70">|</span>
                </p>
              </div>
            )}

            {/* Reset + CTA */}
            <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
              <button
                onClick={() => setStep('vin')}
                className="text-sm text-slate-400 hover:text-white transition-colors"
              >
                ← Try another vehicle
              </button>
              <div className="flex-1" />
              <button
                onClick={onGetLicense}
                className="bg-primary hover:bg-primary/90 text-white font-extrabold px-8 py-3 rounded-xl transition-all shadow-lg shadow-primary/30"
              >
                Get Your License — $997 →
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── INCOME OPPORTUNITY ── */}
      <div className="bg-slate-900 border-t border-slate-700">
        <div className="max-w-5xl mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <div className="inline-block bg-yellow-500/10 border border-yellow-500/30 rounded-full px-4 py-1.5 text-xs font-bold text-yellow-400 mb-4 uppercase tracking-widest">
              The Business Opportunity
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
              What You Just Saw?<br />
              <span className="text-primary">You Can Sell This.</span>
            </h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">
              License the full platform. Run inspections at $150–$500 each. Keep 100% of every dollar.
              The AI does the analysis. You deliver the report. You get paid.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {[
              {
                icon: '🔧',
                title: 'Independent Inspector',
                desc: 'Run 2–3 inspections per day at $150–$250 each. That\'s $300–$750/day, $6k–$15k/month working your own schedule.',
                color: 'border-blue-500/40 bg-blue-950/10',
                highlight: '$6k–$15k/month',
              },
              {
                icon: '🚛',
                title: 'Commercial Fleet Specialist',
                desc: 'Fleet operators and trucking companies pay $300–$800 per commercial vehicle inspection. One fleet contract = $10k–$50k/year.',
                color: 'border-yellow-500/40 bg-yellow-950/10',
                highlight: '$10k–$50k/year per fleet',
              },
              {
                icon: '🏆',
                title: 'Classic Car Authenticator',
                desc: 'Vintage collectors and auction houses pay $300–$500 per inspection. Numbers-matching verification is a premium service.',
                color: 'border-purple-500/40 bg-purple-950/10',
                highlight: '$300–$500 per inspection',
              },
            ].map(card => (
              <div key={card.title} className={`rounded-xl border ${card.color} p-6`}>
                <div className="text-3xl mb-3">{card.icon}</div>
                <h3 className="font-bold text-white mb-1">{card.title}</h3>
                <p className="text-xs font-bold text-primary mb-3">{card.highlight}</p>
                <p className="text-sm text-slate-400 leading-relaxed">{card.desc}</p>
              </div>
            ))}
          </div>

          <div className="text-center">
            <button
              onClick={onGetLicense}
              className="bg-primary hover:bg-primary/90 text-white font-extrabold text-lg px-12 py-4 rounded-xl transition-all shadow-lg shadow-primary/30 hover:shadow-primary/50"
            >
              Claim Your Territory — $997 →
            </button>
            <p className="text-xs text-slate-500 mt-3">
              Limited to 5 licenses per market area. Once your territory is claimed, it's gone.
            </p>
          </div>
        </div>
      </div>

      {/* ── COMPETITOR COMPARISON ── */}
      <div className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-2xl font-bold text-white text-center mb-2">
          Why Nothing Else Comes Close
        </h2>
        <p className="text-slate-400 text-center text-sm mb-8">CarFax pulls a database. Lemon Squad sends a human with a checklist. Neither one does what you just saw.</p>
        <div className="overflow-x-auto rounded-xl border border-slate-700">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-900 border-b border-slate-700">
                <th className="p-4 text-left text-slate-400 font-medium">Feature</th>
                <th className="p-4 text-center text-primary font-bold">AI Auto Pro</th>
                <th className="p-4 text-center text-slate-400 font-medium">Lemon Squad</th>
                <th className="p-4 text-center text-slate-400 font-medium">CARFAX</th>
              </tr>
            </thead>
            <tbody>
              {[
                ['AI-generated inspection report', true, false, false],
                ['AI engine audio analysis', true, false, false],
                ['Optical damage detection (photos)', true, false, false],
                ['Odometer rollback AI', true, false, 'partial'],
                ['VIN clone / title washing detection', true, false, 'partial'],
                ['18-Wheeler / J1939 diagnostics', true, false, false],
                ['EV battery health analysis', true, false, false],
                ['Classic / vintage authenticity', true, false, false],
                ['Dealer tricks exposure', true, false, false],
                ['You own the business & 100% revenue', true, false, false],
              ].map(([feat, us, lemon, carfax]) => (
                <tr key={feat as string} className="border-b border-slate-700/50 hover:bg-slate-800/30 transition-colors">
                  <td className="p-4 text-slate-300">{feat}</td>
                  {[us, lemon, carfax].map((val, i) => (
                    <td key={i} className="p-4 text-center">
                      {val === true ? <span className="text-green-400 font-bold text-lg">✓</span>
                        : val === 'partial' ? <span className="text-yellow-400 text-xs font-medium">partial</span>
                        : <span className="text-slate-600 text-lg">✗</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <SalesChatWidget />
      <LiveActivityTicker />
     </div>
  );
};
export default PublicDemo;
