import React, { useState, useEffect } from 'react';

interface CertificationCenterProps {
  onClose: () => void;
  onCertified?: () => void;
}

interface Module {
  id: string;
  title: string;
  icon: string;
  duration: string;
  description: string;
  lessons: Lesson[];
}

interface Lesson {
  id: string;
  title: string;
  content: string;
  quiz?: QuizQuestion[];
}

interface QuizQuestion {
  q: string;
  options: string[];
  correct: number;
  explanation: string;
}

const MODULES: Module[] = [
  {
    id: 'intro',
    title: 'Introduction to Professional Vehicle Inspection',
    icon: '🎓',
    duration: '20 min',
    description: 'Learn the fundamentals of professional pre-purchase inspection, inspector ethics, and how AI Auto Pro works.',
    lessons: [
      {
        id: 'intro-1',
        title: 'The Inspector\'s Role',
        content: `As an AI Auto Pro certified inspector, your job is to be the buyer's advocate — a neutral, professional third party who documents the true condition of a vehicle with no financial stake in the outcome.

**Your three core responsibilities:**

1. **Document accurately** — every defect, every concern, every pass. Nothing is too minor to note.
2. **Communicate clearly** — your report must be understandable to someone who knows nothing about cars.
3. **Protect the buyer** — your inspection is often the only thing standing between a buyer and a costly mistake.

**What makes a great inspector:**
- Methodical — you follow the same process every time, on every vehicle
- Thorough — you never skip a step because you're in a hurry
- Honest — you report what you find, not what the seller wants to hear
- Professional — you arrive on time, you're prepared, and you communicate promptly`,
        quiz: [
          {
            q: 'What is the inspector\'s primary role?',
            options: [
              'To help the seller get the best price',
              'To be the buyer\'s neutral advocate and document the vehicle\'s true condition',
              'To negotiate the sale price',
              'To approve or reject the sale',
            ],
            correct: 1,
            explanation: 'The inspector is a neutral third party who documents the vehicle\'s true condition for the buyer. You have no stake in whether the sale happens.',
          },
        ],
      },
      {
        id: 'intro-2',
        title: 'How AI Auto Pro Works',
        content: `AI Auto Pro is a 7-step guided inspection system. Each step is designed so that you cannot miss anything important.

**The 7 Steps:**

| Step | What You Do |
|------|------------|
| 1. Vehicle ID | Enter VIN, auto-decode vehicle details, confirm type |
| 2. Exterior | Walk around the vehicle, mark every panel and component |
| 3. Interior | Inspect cabin, electronics, all controls |
| 4. Mechanical | Engine bay, fluids, undercarriage |
| 5. OBD Diagnostics | Connect OBDLink MX+, read live data and fault codes |
| 6. Fraud & AI Detection | Upload photos for AI analysis, run advanced tools |
| 7. Report | Review, enter customer details, generate and send PDF |

**The AI does the analysis — you do the inspection.** Your job is to take good photos and mark every item accurately. The AI handles the fraud detection, damage assessment, and report writing.`,
        quiz: [
          {
            q: 'In which step do you connect the OBDLink MX+ adapter?',
            options: ['Step 2 — Exterior', 'Step 4 — Mechanical', 'Step 5 — OBD Diagnostics', 'Step 6 — Fraud Detection'],
            correct: 2,
            explanation: 'Step 5 is dedicated to OBD diagnostics. You connect the OBDLink MX+ to the vehicle\'s OBD-II port and the app reads live data and fault codes.',
          },
        ],
      },
    ],
  },
  {
    id: 'exterior',
    title: 'Exterior Inspection Mastery',
    icon: '🔍',
    duration: '30 min',
    description: 'Learn the professional method for inspecting every exterior panel, glass, lights, and body components.',
    lessons: [
      {
        id: 'ext-1',
        title: 'The Walk-Around Method',
        content: `Always inspect the exterior in the same order — this prevents you from missing anything.

**The Professional Walk-Around Sequence:**

1. **Start at the driver's front corner** — look down the hood line from a low angle. Panel gaps and repaint are most visible from this angle.
2. **Front fascia & grille** — check for cracks, misalignment, fresh paint on plastic (sign of recent front-end collision).
3. **Hood** — open and inspect the underside. Fresh paint on the firewall or hood hinges = front-end damage.
4. **Driver's side** — walk slowly, looking for waves in the panels (sign of body filler), color mismatch, overspray on trim.
5. **Rear** — check bumper alignment, trunk seal, tail lights.
6. **Passenger side** — same as driver's side.
7. **Roof** — look for hail damage (small dimples), dents, rust bubbles at the drip rail.

**The 3-foot rule:** Stand 3 feet from each panel and look at the reflection. Waves in the reflection = body filler or poor repair.

**Pro tip:** Check the door jambs. Factory paint in the jambs = original paint. Painted jambs = the entire panel was repainted after a repair.`,
        quiz: [
          {
            q: 'What does a wavy reflection in a body panel indicate?',
            options: [
              'The panel is perfectly straight',
              'The panel has been repainted',
              'Body filler or a poor repair underneath the paint',
              'Normal factory variation',
            ],
            correct: 2,
            explanation: 'Waves in the reflection of a body panel indicate body filler or a poor repair underneath. Factory panels are perfectly straight and produce a smooth, undistorted reflection.',
          },
        ],
      },
      {
        id: 'ext-2',
        title: 'Paint Thickness & Repaint Detection',
        content: `**Why paint thickness matters:**

Factory paint is applied in a controlled environment to precise specifications. When a panel is repainted after a collision, the new paint is almost always thicker than factory spec — and body filler is much thicker.

**Factory paint thickness by manufacturer:**
- Japanese brands (Toyota, Honda, Nissan): 90–140 microns
- German brands (BMW, Mercedes, VW): 110–160 microns
- American brands (Ford, GM, Chrysler): 100–180 microns

**What the readings mean:**
- **Under 80 µm:** Paint has been sanded or stripped — possible repaint
- **80–200 µm:** Normal factory range — PASS
- **200–400 µm:** Repainted panel — flag as CONCERN, note in report
- **400+ µm:** Heavy body filler present — flag as FAIL, major concern

**How to use the paint thickness meter:**
1. Turn on the meter and calibrate on bare metal (use the calibration plate)
2. Take 3 readings per panel — top, middle, bottom
3. Enter readings into the Advanced Tools section of the app
4. The AI will flag any panels outside factory spec and estimate repair costs

**Panels to always check:** Hood, all four doors, both fenders, trunk lid, both quarter panels.`,
        quiz: [
          {
            q: 'A paint thickness reading of 650 microns on a door panel indicates:',
            options: [
              'Normal factory paint',
              'A light repaint',
              'Heavy body filler — major concern',
              'The panel has been stripped',
            ],
            correct: 2,
            explanation: '650 microns is far above the factory range of 80–200 µm. This indicates heavy body filler, which means significant collision damage was repaired. This should be flagged as FAIL in the report.',
          },
        ],
      },
    ],
  },
  {
    id: 'mechanical',
    title: 'Mechanical & Engine Inspection',
    icon: '🔧',
    duration: '35 min',
    description: 'Master the engine bay inspection, fluid analysis, and undercarriage check.',
    lessons: [
      {
        id: 'mech-1',
        title: 'Engine Bay Inspection',
        content: `The engine bay tells the story of how a vehicle was maintained — and whether it was in a collision.

**What to look for:**

**Signs of poor maintenance:**
- Dirty, dark oil on the dipstick (should be amber/honey colored for fresh oil)
- Low coolant level or brown/rusty coolant (should be bright green, orange, or pink)
- Cracked or brittle belts and hoses
- Corrosion on battery terminals
- Dirty air filter

**Signs of collision damage:**
- Fresh paint on the firewall, hood hinges, or radiator support
- Misaligned hood — one side sits higher than the other
- Crumpled or bent radiator support
- Replaced bolts that don't match the surrounding hardware (bright silver bolts in a rusty engine bay = recently replaced)
- Overspray on rubber hoses or wiring harness

**Signs of oil leaks:**
- Dark residue on the valve cover, oil pan, or rear main seal area
- Oil on the underside of the engine
- UV dye visible under black light (use your UV light here)

**Always check:**
1. Oil level and condition
2. Coolant level and color
3. Brake fluid level and color (should be clear/light yellow — dark brown = needs flush)
4. Power steering fluid (if applicable)
5. Transmission fluid (if accessible dipstick)
6. Belt condition — cracks, fraying, glazing`,
        quiz: [
          {
            q: 'Fresh paint on the firewall and hood hinges in the engine bay most likely indicates:',
            options: [
              'The owner recently detailed the engine',
              'Front-end collision damage that was repaired',
              'Normal factory variation',
              'The engine was recently replaced',
            ],
            correct: 1,
            explanation: 'Fresh paint on the firewall and hood hinges is a classic sign of front-end collision repair. The body shop painted these areas when repairing the front of the vehicle.',
          },
        ],
      },
      {
        id: 'mech-2',
        title: 'OBD Diagnostics — What the Codes Mean',
        content: `**OBD-II (On-Board Diagnostics) is your most powerful tool.** Every vehicle made after 1996 has an OBD-II port. Connecting the OBDLink MX+ takes 30 seconds and gives you data that no visual inspection can provide.

**Understanding DTC (Diagnostic Trouble Code) categories:**

| Code Prefix | System | Example |
|------------|--------|---------|
| P | Powertrain (engine, transmission) | P0300 — Random misfire |
| C | Chassis (ABS, traction control) | C0031 — Left front wheel speed sensor |
| B | Body (airbags, windows, locks) | B0001 — Driver airbag circuit |
| U | Network (communication) | U0100 — Lost communication with ECM |

**The most important codes to flag:**

- **P0300–P0308:** Cylinder misfires — can indicate worn plugs, bad injectors, or head gasket issues
- **P0420/P0430:** Catalytic converter efficiency — expensive repair ($800–$2,500)
- **P0700:** Transmission control system — serious
- **B codes (airbag):** Indicates airbag deployment history — the vehicle was in a serious collision
- **U codes:** Communication failures — can indicate water damage or wiring issues

**Cleared codes:** If the vehicle has very low "readiness monitors" (less than 7 of 8 complete), the seller may have recently cleared the codes to hide problems. Flag this in the report.`,
        quiz: [
          {
            q: 'A vehicle shows only 3 of 8 OBD readiness monitors complete. What does this most likely mean?',
            options: [
              'The vehicle is brand new',
              'The battery was recently replaced',
              'The fault codes were recently cleared to hide problems',
              'The OBD system is malfunctioning',
            ],
            correct: 2,
            explanation: 'When fault codes are cleared, the readiness monitors reset to "incomplete." It takes several drive cycles for them to complete. Very few completed monitors (especially combined with a vehicle being offered for sale) is a strong indicator that codes were cleared to hide problems.',
          },
        ],
      },
    ],
  },
  {
    id: 'commercial',
    title: 'Commercial Vehicle & 18-Wheeler Inspection',
    icon: '🚛',
    duration: '45 min',
    description: 'Specialized training for semi-trucks, box trucks, and heavy commercial vehicles. Includes DOT/FMCSA compliance and J1939 diagnostics.',
    lessons: [
      {
        id: 'comm-1',
        title: 'DOT/FMCSA Compliance Basics',
        content: `Commercial vehicle inspections are governed by federal law. The Federal Motor Carrier Safety Administration (FMCSA) sets the standards under 49 CFR Parts 390–399.

**Documents to verify:**
- USDOT number (must be displayed on both sides of the cab)
- MC (Motor Carrier) authority number
- Current annual inspection sticker (must not be expired)
- IFTA fuel tax decals (if operating interstate)
- Current registration and insurance

**Out-of-Service (OOS) conditions — these ground the truck immediately:**
- Brake adjustment out of spec (most common OOS violation)
- Tire with less than 2/32" tread depth (steer axle) or 1/32" (drive/trailer)
- Cracked or broken frame member
- Inoperative headlights, brake lights, or turn signals
- Air brake system failure
- Steering play exceeding 2 inches at the wheel rim

**The annual inspection sticker:** Every commercial vehicle must have a current annual inspection performed by a certified inspector. Check the sticker on the driver's door jamb. If it's expired, the truck cannot legally operate.

**Why this matters for your inspection:** If you find an OOS condition, you must clearly flag it in the report. A buyer who purchases a truck with an OOS condition faces immediate DOT enforcement and potential fines.`,
        quiz: [
          {
            q: 'A commercial truck\'s annual inspection sticker expired 3 months ago. What should you do?',
            options: [
              'Ignore it — it\'s the buyer\'s problem',
              'Note it as a minor concern',
              'Flag it as a FAIL — the truck cannot legally operate without a current inspection',
              'Ask the seller to renew it before the inspection',
            ],
            correct: 2,
            explanation: 'An expired annual inspection sticker is a federal compliance violation. The truck cannot legally operate on public roads. This must be flagged as FAIL in the report with a clear explanation.',
          },
        ],
      },
      {
        id: 'comm-2',
        title: 'Air Brake System Testing',
        content: `Air brakes are the most critical safety system on a commercial vehicle. A failed air brake test is an automatic Out-of-Service condition.

**The 4-step air brake test — perform in this exact order:**

**Step 1: Build-up test**
- Start the engine and let air pressure build
- Pressure should rise from 50 PSI to governor cut-out (typically 120–135 PSI) within 3 minutes
- If it takes longer: air compressor is weak or leaking

**Step 2: Governor cut-out/cut-in test**
- At governor cut-out (~125 PSI), note the pressure
- Fan the brakes to drop pressure to ~100 PSI
- Compressor should kick back on (cut-in) at 100–115 PSI
- If cut-in is below 85 PSI: governor is out of adjustment

**Step 3: Low air warning test**
- Fan the brakes to drop pressure below 60 PSI
- Low air warning light AND buzzer must activate at or above 60 PSI
- If warning doesn't activate: FAIL — OOS condition

**Step 4: Parking brake test**
- With pressure above 90 PSI, apply the parking brake (yellow diamond knob)
- Try to drive the truck — it should not move
- Release the parking brake — the truck should move freely

**Static leak test:**
- With engine off and pressure at governor cut-out, apply full service brakes
- Pressure should not drop more than 3 PSI in 1 minute (single vehicle) or 4 PSI (combination)`,
        quiz: [
          {
            q: 'During the low air warning test, the warning light activates at 45 PSI instead of 60 PSI. This means:',
            options: [
              'The system is working correctly',
              'The warning system is out of adjustment — flag as FAIL',
              'The air pressure is too low',
              'The test was performed incorrectly',
            ],
            correct: 1,
            explanation: 'Federal regulations require the low air warning to activate at or above 60 PSI. A warning that activates at 45 PSI means the driver would not be warned until the brakes are dangerously close to failure. This is a FAIL and an OOS condition.',
          },
        ],
      },
    ],
  },
  {
    id: 'rv',
    title: 'RV & Motorhome Inspection',
    icon: '🏕️',
    duration: '40 min',
    description: 'Specialized training for Class A, B, and C motorhomes. Covers water intrusion, LP gas, electrical systems, and slideout inspection.',
    lessons: [
      {
        id: 'rv-1',
        title: 'Water Intrusion — The #1 RV Killer',
        content: `Water intrusion is the single most expensive problem in any RV. A small leak that goes undetected for one season can cause $15,000–$40,000 in structural damage.

**Where water gets in:**
1. **Roof seams and vents** — the most common entry point. Every roof penetration (vent, A/C unit, antenna) is a potential leak.
2. **Slideout seals** — the rubber seals around slideouts compress over time and crack. Water runs in along the slideout frame.
3. **Rear cap seam** — where the rear fiberglass cap meets the sidewall. This seam is under constant stress from road flex.
4. **Window and door frames** — the sealant around windows dries out and cracks.
5. **Underbelly** — water can enter from below through plumbing penetrations.

**How to find water damage:**

**Visual signs:**
- Soft or spongy floor (especially near slideouts and entry door)
- Delamination — the outer fiberglass skin separates from the wall substrate, creating a bubbled or wavy appearance
- Stains on the ceiling or walls
- Musty smell
- Rust on metal components inside cabinets

**Moisture meter test:**
- Normal reading: 0–15%
- Elevated: 16–25% — monitor, may be drying out
- Wet: 26%+ — active moisture, structural damage likely

**Thermal imaging:**
- Cold spots in walls = wet insulation
- Dark areas on the ceiling = water pooling above the headliner
- Check all four walls, the ceiling, and the floor around slideouts

**The most important areas to test:**
1. All four corners of every slideout
2. Around every roof vent and A/C unit
3. The rear cap seam (inside and outside)
4. The floor in the bathroom and kitchen
5. Under the entry door`,
        quiz: [
          {
            q: 'A moisture meter reading of 35% in the wall next to a slideout indicates:',
            options: [
              'Normal humidity levels',
              'The wall was recently cleaned',
              'Active moisture — likely structural damage to the wall substrate',
              'The moisture meter is malfunctioning',
            ],
            correct: 2,
            explanation: 'A reading of 35% is well above the 25% threshold that indicates active moisture. At this level, the wall substrate (typically lauan plywood or OSB) is likely rotting. This is a serious finding that should be flagged as FAIL with an estimated repair cost.',
          },
        ],
      },
    ],
  },
  {
    id: 'classic',
    title: 'Classic & Vintage Vehicle Inspection',
    icon: '🏎️',
    duration: '35 min',
    description: 'Specialized training for pre-1996 vehicles, collector cars, and muscle cars. Covers numbers matching, VIN verification, and rust assessment.',
    lessons: [
      {
        id: 'classic-1',
        title: 'Numbers Matching & VIN Verification',
        content: `For classic and collector vehicles, "numbers matching" is often the difference between a $30,000 car and a $100,000 car. A numbers-matching vehicle has its original engine, transmission, and other major components — verified by the VIN and production codes stamped on each part.

**Where to find the VINs and stamps:**

**Primary VIN locations (varies by manufacturer and year):**
- Dashboard (driver's side, visible through windshield) — post-1969
- Driver's door jamb sticker
- Firewall (stamped or riveted plate)

**Engine stamp:**
- On the engine block — typically on a pad near the front of the block
- The stamp should match the last 6–8 digits of the VIN plus a production code
- A mismatched or absent engine stamp = engine replacement

**Transmission tag:**
- Attached to the transmission case
- Should show the model code and a date code that matches the vehicle's production date

**Rear axle:**
- Tag on the differential housing
- Should show the axle ratio and a date code

**Why this matters:**
- A "matching numbers" classic is worth 2–5x more than a "driver" with replaced components
- Fraudsters replace engine stamps, create fake documentation, and misrepresent vehicles
- Your AI Auto Pro report documents all VIN and stamp locations — protecting the buyer`,
        quiz: [
          {
            q: 'A 1969 Chevelle SS has a clean engine bay and fresh paint, but the engine stamp is absent. What does this indicate?',
            options: [
              'Normal for this year — not all engines were stamped',
              'The engine has been replaced — this is not a numbers-matching vehicle',
              'The stamp was removed for cleaning',
              'The stamp is in a different location',
            ],
            correct: 1,
            explanation: 'All GM engines from this era were stamped with a partial VIN. An absent stamp means the engine block was replaced. This significantly affects the vehicle\'s value and must be clearly disclosed in the report.',
          },
        ],
      },
    ],
  },
];

// ─── Progress Tracker ─────────────────────────────────────────────────────────
const STORAGE_KEY = 'aiauto_cert_progress';

const loadProgress = (): Record<string, boolean> => {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); }
  catch { return {}; }
};

const saveProgress = (progress: Record<string, boolean>) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
};

// ─── Quiz Component ───────────────────────────────────────────────────────────
const QuizBlock: React.FC<{ question: QuizQuestion; onPass: () => void }> = ({ question, onPass }) => {
  const [selected, setSelected] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = () => {
    if (selected === null) return;
    setSubmitted(true);
    if (selected === question.correct) setTimeout(onPass, 1500);
  };

  return (
    <div className="bg-dark-bg border border-dark-border rounded-xl p-4 mt-4">
      <p className="text-light-text font-bold text-sm mb-3">📝 Knowledge Check</p>
      <p className="text-light-text text-sm mb-3">{question.q}</p>
      <div className="space-y-2 mb-4">
        {question.options.map((opt, i) => (
          <button
            key={i}
            onClick={() => !submitted && setSelected(i)}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium border transition-all ${
              submitted
                ? i === question.correct
                  ? 'bg-green-900/40 border-green-600 text-green-300'
                  : i === selected && selected !== question.correct
                    ? 'bg-red-900/40 border-red-600 text-red-300'
                    : 'bg-dark-card border-dark-border text-medium-text'
                : selected === i
                  ? 'bg-primary/20 border-primary text-light-text'
                  : 'bg-dark-card border-dark-border text-medium-text hover:border-primary/50'
            }`}
          >
            {String.fromCharCode(65 + i)}. {opt}
          </button>
        ))}
      </div>
      {submitted ? (
        <div className={`rounded-xl p-3 text-sm ${selected === question.correct ? 'bg-green-900/30 text-green-300' : 'bg-red-900/30 text-red-300'}`}>
          {selected === question.correct ? '✅ Correct! ' : '❌ Incorrect. '}
          {question.explanation}
        </div>
      ) : (
        <button
          onClick={handleSubmit}
          disabled={selected === null}
          className="w-full py-2.5 bg-primary hover:bg-primary-light disabled:bg-gray-700 disabled:text-gray-500 text-white font-bold rounded-xl text-sm transition-colors"
        >
          Submit Answer
        </button>
      )}
    </div>
  );
};

// ─── Main CertificationCenter ─────────────────────────────────────────────────
export const CertificationCenter: React.FC<CertificationCenterProps> = ({ onClose, onCertified }) => {
  const [progress, setProgress] = useState<Record<string, boolean>>(loadProgress);
  const [activeModule, setActiveModule] = useState<Module | null>(null);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);
  const [quizPassed, setQuizPassed] = useState<Record<string, boolean>>({});

  const totalLessons = MODULES.reduce((sum, m) => sum + m.lessons.length, 0);
  const completedLessons = Object.values(progress).filter(Boolean).length;
  const pct = Math.round((completedLessons / totalLessons) * 100);
  const isCertified = pct === 100;

  const markComplete = (lessonId: string) => {
    const updated = { ...progress, [lessonId]: true };
    setProgress(updated);
    saveProgress(updated);
    if (Object.values(updated).filter(Boolean).length === totalLessons) {
      onCertified?.();
    }
  };

  if (activeLesson && activeModule) {
    const lessonIdx = activeModule.lessons.findIndex(l => l.id === activeLesson.id);
    const isComplete = progress[activeLesson.id];
    const quiz = activeLesson.quiz?.[0];
    const qKey = `q_${activeLesson.id}`;

    return (
      <div className="fixed inset-0 bg-dark-bg z-50 flex flex-col">
        {/* Header */}
        <div className="bg-dark-card border-b border-dark-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => setActiveLesson(null)} className="text-medium-text hover:text-light-text p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1 min-w-0">
            <p className="text-medium-text text-xs">{activeModule.title}</p>
            <p className="text-light-text font-bold text-sm truncate">{activeLesson.title}</p>
          </div>
          {isComplete && <span className="text-green-400 text-xs font-bold bg-green-900/30 px-2 py-1 rounded-full">✓ Complete</span>}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          <div className="max-w-2xl mx-auto">
            <div
              className="prose prose-invert prose-sm max-w-none text-light-text leading-relaxed"
              style={{ whiteSpace: 'pre-wrap' }}
              dangerouslySetInnerHTML={{
                __html: activeLesson.content
                  .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\n\n/g, '</p><p class="mb-3">')
                  .replace(/^/, '<p class="mb-3">')
                  .replace(/$/, '</p>')
                  .replace(/\| (.*?) \|/g, (m) => m)
              }}
            />
            <div className="mt-4 text-light-text text-sm leading-relaxed whitespace-pre-wrap">
              {activeLesson.content}
            </div>

            {quiz && (
              <QuizBlock
                question={quiz}
                onPass={() => {
                  setQuizPassed(prev => ({ ...prev, [qKey]: true }));
                  markComplete(activeLesson.id);
                }}
              />
            )}

            {!quiz && !isComplete && (
              <button
                onClick={() => markComplete(activeLesson.id)}
                className="w-full mt-6 py-3 bg-green-600 hover:bg-green-700 text-white font-bold rounded-xl transition-colors"
              >
                ✓ Mark as Complete
              </button>
            )}

            {isComplete && lessonIdx < activeModule.lessons.length - 1 && (
              <button
                onClick={() => setActiveLesson(activeModule.lessons[lessonIdx + 1])}
                className="w-full mt-6 py-3 bg-primary hover:bg-primary-light text-white font-bold rounded-xl transition-colors"
              >
                Next Lesson →
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (activeModule) {
    const moduleComplete = activeModule.lessons.every(l => progress[l.id]);

    return (
      <div className="fixed inset-0 bg-dark-bg z-50 flex flex-col">
        <div className="bg-dark-card border-b border-dark-border px-4 py-3 flex items-center gap-3">
          <button onClick={() => setActiveModule(null)} className="text-medium-text hover:text-light-text p-1">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div className="flex-1">
            <p className="text-light-text font-bold">{activeModule.icon} {activeModule.title}</p>
            <p className="text-medium-text text-xs">{activeModule.duration} · {activeModule.lessons.length} lessons</p>
          </div>
          {moduleComplete && <span className="text-green-400 text-xs font-bold bg-green-900/30 px-2 py-1 rounded-full">✓ Done</span>}
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          <p className="text-medium-text text-sm mb-4">{activeModule.description}</p>
          <div className="space-y-3">
            {activeModule.lessons.map((lesson, idx) => {
              const done = progress[lesson.id];
              return (
                <button
                  key={lesson.id}
                  onClick={() => setActiveLesson(lesson)}
                  className="w-full flex items-center gap-4 p-4 bg-dark-card border border-dark-border rounded-xl hover:border-primary/50 transition-all text-left"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm ${done ? 'bg-green-600 text-white' : 'bg-dark-bg border border-dark-border text-medium-text'}`}>
                    {done ? '✓' : idx + 1}
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold text-sm ${done ? 'text-green-400' : 'text-light-text'}`}>{lesson.title}</p>
                    {lesson.quiz && <p className="text-medium-text text-xs mt-0.5">Includes knowledge check</p>}
                  </div>
                  <svg className="w-4 h-4 text-medium-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-dark-bg z-50 flex flex-col">
      {/* Header */}
      <div className="bg-dark-card border-b border-dark-border px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-light-text font-black text-lg">🎓 Certification Center</h1>
          <p className="text-medium-text text-xs">AI Auto Pro Inspector Certification Program</p>
        </div>
        <button onClick={onClose} className="text-medium-text hover:text-light-text p-1">
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {/* Progress */}
        <div className={`rounded-2xl p-5 mb-5 ${isCertified ? 'bg-gradient-to-r from-yellow-900/40 to-orange-900/40 border border-yellow-600/40' : 'bg-dark-card border border-dark-border'}`}>
          {isCertified ? (
            <div className="text-center">
              <div className="text-5xl mb-2">🏆</div>
              <h2 className="text-yellow-300 font-black text-xl">Certified Inspector</h2>
              <p className="text-yellow-200/70 text-sm mt-1">AI Auto Pro Certification Complete</p>
              <p className="text-yellow-400 text-xs mt-2 font-semibold">Your certification badge now appears on all reports</p>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-2">
                <p className="text-light-text font-bold text-sm">Overall Progress</p>
                <p className="text-primary font-black">{pct}%</p>
              </div>
              <div className="h-3 bg-dark-bg rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-medium-text text-xs mt-2">{completedLessons} of {totalLessons} lessons complete</p>
            </>
          )}
        </div>

        {/* Modules */}
        <div className="space-y-3">
          {MODULES.map(module => {
            const done = module.lessons.filter(l => progress[l.id]).length;
            const total = module.lessons.length;
            const complete = done === total;

            return (
              <button
                key={module.id}
                onClick={() => setActiveModule(module)}
                className="w-full flex items-start gap-4 p-4 bg-dark-card border border-dark-border rounded-2xl hover:border-primary/50 transition-all text-left"
              >
                <span className="text-3xl flex-shrink-0">{module.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="font-bold text-light-text text-sm leading-tight">{module.title}</p>
                    {complete && <span className="flex-shrink-0 text-green-400 text-xs font-bold bg-green-900/30 px-2 py-0.5 rounded-full">✓ Done</span>}
                  </div>
                  <p className="text-medium-text text-xs mb-2">{module.duration} · {total} lessons</p>
                  <div className="h-1.5 bg-dark-bg rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${(done / total) * 100}%` }} />
                  </div>
                  <p className="text-medium-text text-xs mt-1">{done}/{total} complete</p>
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-6 bg-dark-card border border-dark-border rounded-2xl p-4 text-center">
          <p className="text-medium-text text-sm">Complete all modules to earn your</p>
          <p className="text-primary font-black text-lg">AI Auto Pro Certified Inspector Badge</p>
          <p className="text-medium-text text-xs mt-1">Badge appears on your profile and on every report you generate</p>
        </div>
      </div>
    </div>
  );
};

export default CertificationCenter;
