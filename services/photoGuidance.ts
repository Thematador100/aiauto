/**
 * AI-Guided Photo Instructions
 * 
 * For every checklist item across all vehicle types, this map provides:
 * - instruction: What to photograph and how (position, angle, distance)
 * - focus: What the AI is looking for in this photo
 * - required: Whether this photo is mandatory for AI analysis
 * - tip: Pro tip for catching fraud or hidden issues
 */

export interface PhotoGuidance {
  instruction: string;
  focus: string;
  required: boolean;
  tip?: string;
}

export const PHOTO_GUIDANCE: Record<string, PhotoGuidance> = {

  // ─── STANDARD / COMMON EXTERIOR ───────────────────────────────────────────

  'Body Panels for Dents/Scratches': {
    instruction: 'Walk to each panel (hood, doors, fenders, trunk). Crouch to eye level and shoot along the panel surface from a low angle — this reveals dents and waves invisible from above.',
    focus: 'AI scans for dents, creases, ripples, and uneven reflections indicating prior damage or repair.',
    required: true,
    tip: 'Shoot in bright light or shade — harsh direct sun hides dents. A low angle catches everything.',
  },
  'Paint Condition & Color Match': {
    instruction: 'Photograph each panel individually from 3 feet away. Then take a wide shot of the full side profile. Include door jambs — open each door and photograph the jamb edge.',
    focus: 'AI compares color tone and texture across panels to detect repainted sections, overspray, or mismatched paint indicating prior accident repair.',
    required: true,
    tip: 'Repainted panels often look slightly different in color or texture. Door jambs are rarely repainted — compare them to the outer panels.',
  },
  'Glass & Mirrors Condition': {
    instruction: 'Photograph windshield from outside (straight on, 6 feet back) and from inside looking out. Photograph each side mirror and rear glass.',
    focus: 'AI detects chips, cracks, stress fractures, and delamination that may not be visible in normal lighting.',
    required: true,
    tip: 'Photograph windshield with sunlight behind you — cracks become visible that are otherwise invisible.',
  },
  'Lights & Lenses Function': {
    instruction: 'With lights ON, photograph each headlight, taillight, brake light, and turn signal. Get close enough to see the lens clearly.',
    focus: 'AI checks for cracked lenses, moisture inside housings, mismatched bulb colors, and aftermarket replacements that may indicate front or rear collision.',
    required: true,
    tip: 'Moisture or condensation inside a headlight housing is a red flag for prior flood damage or collision.',
  },
  'Frame/Unibody Integrity': {
    instruction: 'Crouch down and photograph the frame rails from the front and rear. Photograph the firewall from the engine bay. Look for kinks, welds, or straightening marks.',
    focus: 'AI analyzes for bent frame rails, evidence of straightening (grind marks, fresh paint on metal), and structural compromise.',
    required: true,
    tip: 'Fresh undercoating or paint on frame rails in specific spots is a major red flag for accident repair.',
  },
  'Rust & Corrosion Check': {
    instruction: 'Photograph the rocker panels (under the doors), wheel wells, and any visible undercarriage from the wheel openings. Get as close as possible.',
    focus: 'AI assesses rust severity — surface rust vs. structural rust — and flags areas that may compromise safety.',
    required: true,
    tip: 'Bubbling paint on rocker panels means rust underneath. Poke gently — if it crumbles, it is structural.',
  },
  'Panel Gaps & Alignment': {
    instruction: 'Photograph the gaps between hood/fender, door/fender, door/door, and trunk/quarter panel. Stand back 4 feet and shoot straight at each gap.',
    focus: 'AI measures gap consistency — uneven gaps indicate prior collision repair or replacement panels.',
    required: true,
    tip: 'Gaps should be perfectly even. A gap wider on one side than the other almost always means the car was hit.',
  },
  'Windshield & Glass (No Cracks)': {
    instruction: 'Photograph the full windshield from outside (straight on) and from the driver seat looking forward. Include the VIN plate visible through the windshield.',
    focus: 'AI checks for cracks, chips, stress lines, and VIN plate visibility/authenticity.',
    required: true,
    tip: 'A replaced windshield may mean the car was in a rollover or severe accident. Check for non-factory adhesive lines.',
  },

  // ─── ENGINE BAY ────────────────────────────────────────────────────────────

  'Engine Oil Level & Condition': {
    instruction: 'Open the hood. Pull the oil dipstick, wipe it, reinsert, pull again. Photograph the dipstick showing the oil level and color against a white background or paper towel.',
    focus: 'AI analyzes oil color (black = overdue, milky = coolant contamination = head gasket failure) and level.',
    required: true,
    tip: 'Milky or frothy oil on the dipstick is a serious red flag — it means coolant is mixing with oil, indicating a blown head gasket.',
  },
  'Coolant Level & Condition': {
    instruction: 'Photograph the coolant reservoir (DO NOT open when hot). Show the level markings and the color of the coolant through the translucent tank.',
    focus: 'AI checks coolant level and color — brown/rusty coolant indicates neglect or internal corrosion.',
    required: true,
    tip: 'Never open the radiator cap when the engine is hot. Brown or oily coolant means serious engine issues.',
  },
  'Belts & Hoses Condition': {
    instruction: 'Photograph the serpentine belt from above showing the full length. Photograph each visible hose (radiator hoses top and bottom, heater hoses). Get close enough to see surface texture.',
    focus: 'AI looks for cracks, fraying, glazing on belts, and soft spots, bulges, or cracks on hoses.',
    required: true,
    tip: 'A cracked or glazed serpentine belt is a cheap fix but if ignored will leave the driver stranded. Use it as a negotiating point.',
  },
  'Battery Terminals & Health': {
    instruction: 'Photograph the battery from directly above showing both terminals. Include the battery label showing the date code (usually a sticker with month/year).',
    focus: 'AI checks for corrosion on terminals (white/blue buildup), battery age, and terminal condition.',
    required: true,
    tip: 'Heavy corrosion on terminals means the battery has been leaking — it may need replacement soon. Check the date code: most batteries last 3-5 years.',
  },
  'Visible Fluid Leaks': {
    instruction: 'Photograph the ground directly under the engine and transmission. Then photograph the engine bay from above looking for wet spots, stains, or residue on components.',
    focus: 'AI identifies leak locations and fluid types by color — oil (brown/black), coolant (green/orange/pink), transmission fluid (red), power steering fluid (red/brown).',
    required: true,
    tip: 'A freshly cleaned engine bay on an older vehicle can hide leaks. Look for new dirt accumulation on wet spots.',
  },
  'Engine Air Filter': {
    instruction: 'Open the air filter housing and photograph the filter element directly. Hold it up to light if possible.',
    focus: 'AI assesses filter condition — a severely clogged filter indicates neglected maintenance.',
    required: false,
    tip: 'A filthy air filter is a cheap fix but tells you a lot about how the owner maintained the vehicle overall.',
  },
  'Carburetor/Fuel Injection Condition': {
    instruction: 'Photograph the intake manifold and fuel injectors/carburetor from above. Look for fuel stains, cracks, or vacuum line deterioration.',
    focus: 'AI checks for fuel leaks, cracked vacuum lines, and signs of improper modification.',
    required: false,
    tip: 'Fuel stains around injectors or carb base mean a leak — a fire hazard and negotiating point.',
  },

  // ─── TIRES & BRAKES ────────────────────────────────────────────────────────

  'Tire Tread Depth & Condition (All 4 + Spare)': {
    instruction: 'Photograph each tire from the side showing the full tread surface. Then photograph the sidewall of each tire. Include a penny or quarter in the tread for scale.',
    focus: 'AI measures tread depth, checks for uneven wear patterns (alignment/suspension issues), sidewall cracking, and age indicators.',
    required: true,
    tip: 'Uneven wear on the inside or outside edge means alignment or suspension problems — expensive repairs. Diagonal wear means worn shocks.',
  },
  'Brake Pad Life (Visual)': {
    instruction: 'Look through the wheel spokes and photograph the brake caliper and rotor. Get as close as possible through the wheel opening. Do all 4 corners.',
    focus: 'AI estimates brake pad thickness and checks rotor condition — grooves, scoring, heat cracks, or rust.',
    required: true,
    tip: 'Deep grooves in the rotor mean the pads wore completely through — rotors will need replacement too, doubling the cost.',
  },
  'Rotors/Drums Condition': {
    instruction: 'Photograph each rotor through the wheel spokes showing the full rotor face. Look for a lip on the outer edge of the rotor.',
    focus: 'AI checks for excessive wear grooves, heat cracks (spider-web pattern), and rotor lip indicating worn-down rotors.',
    required: true,
    tip: 'A large lip on the rotor edge means it is worn thin and must be replaced. Use this as a negotiating point.',
  },
  'Brake Fluid Level & Color': {
    instruction: 'Photograph the brake fluid reservoir (usually near the firewall on the driver side). Show the level markings and the color of the fluid.',
    focus: 'AI checks fluid level and color — dark brown fluid indicates moisture contamination and reduced braking effectiveness.',
    required: false,
    tip: 'Brake fluid should be clear to light yellow. Dark brown fluid means it has absorbed moisture and should be flushed.',
  },
  'Emergency Brake Function': {
    instruction: 'Photograph the emergency/parking brake handle or pedal in both engaged and released positions.',
    focus: 'AI documents the parking brake mechanism for the report.',
    required: false,
  },

  // ─── INTERIOR ──────────────────────────────────────────────────────────────

  'Upholstery & Carpet Condition': {
    instruction: 'Photograph the driver seat, passenger seat, rear seats, and floor carpet. Open all doors and photograph the door panels. Lift floor mats to photograph the carpet underneath.',
    focus: 'AI checks for stains, tears, burns, excessive wear, and water damage/mold under mats.',
    required: true,
    tip: 'Lift the floor mats — water damage and mold hide underneath. A musty smell combined with stains under the mats is a flood indicator.',
  },
  'Dashboard & Controls Function': {
    instruction: 'Photograph the full dashboard with the ignition ON showing all warning lights. Then photograph with engine running showing no warning lights.',
    focus: 'AI documents all active warning lights and checks for missing or non-functional controls.',
    required: true,
    tip: 'Some sellers disconnect warning light bulbs or use code readers to temporarily clear codes before a sale. Check if any dashboard lights are missing.',
  },
  'Warning Lights on Dash': {
    instruction: 'Turn the key to ON position (engine off) — all warning lights should illuminate briefly. Photograph this. Then start the engine and photograph the dashboard — all lights should go out.',
    focus: 'AI identifies any persistent warning lights and cross-references with OBD data.',
    required: true,
    tip: 'If a warning light that should illuminate at key-on is missing, the bulb may have been removed to hide a problem.',
  },
  'HVAC System (Heat & A/C)': {
    instruction: 'Photograph the HVAC controls panel and all vents. Turn on A/C and heat — photograph the temperature display if available.',
    focus: 'AI documents HVAC control condition and any missing or damaged controls.',
    required: false,
  },
  'Odometer Reading': {
    instruction: 'Photograph the odometer display clearly with the engine running. Get close enough that the exact mileage is readable. Also photograph the door jamb sticker showing the original tire size and VIN.',
    focus: 'AI cross-references odometer reading with VIN history data to detect odometer rollback fraud.',
    required: true,
    tip: 'Compare the odometer reading to wear on the driver seat, pedals, and steering wheel. High wear with low miles is a red flag for rollback.',
  },
  'Odometer': {
    instruction: 'Photograph the odometer display clearly with the engine running. Get close enough that the exact mileage is readable.',
    focus: 'AI cross-references odometer reading with VIN history data to detect odometer rollback fraud.',
    required: true,
    tip: 'Compare the odometer reading to wear on the driver seat, pedals, and steering wheel. High wear with low miles is a red flag for rollback.',
  },

  // ─── VIN & DOCUMENTATION ───────────────────────────────────────────────────

  'Dashboard/VIN': {
    instruction: 'Photograph the VIN plate on the dashboard (visible through the windshield, driver side). Then photograph the VIN sticker on the driver door jamb. Both must be clearly readable.',
    focus: 'AI verifies VIN consistency across all locations to detect VIN cloning or plate swapping.',
    required: true,
    tip: 'A VIN that has been re-stamped or shows signs of tampering is a serious fraud indicator. Check all VIN locations match exactly.',
  },
  'VIN Plate/Data Tag': {
    instruction: 'Photograph the VIN plate on the dashboard, the door jamb sticker, the firewall stamp, and the engine block stamp if visible. All must be clearly readable.',
    focus: 'AI verifies VIN consistency and authenticity across all locations.',
    required: true,
    tip: 'On classic vehicles, matching numbers (engine, transmission, body) dramatically affect value. Document all number locations.',
  },

  // ─── UNDERCARRIAGE ─────────────────────────────────────────────────────────

  'Undercarriage': {
    instruction: 'Crouch at each wheel well and photograph as far under the vehicle as possible. Cover front, middle, and rear sections. Use your phone flashlight.',
    focus: 'AI checks for rust, frame damage, fluid leaks, and evidence of off-road damage or flood exposure.',
    required: true,
    tip: 'Mud packed into the undercarriage that has dried and cracked indicates the vehicle was driven through deep water or off-road.',
  },
  'Frame Rails (No Cracks/Bends)': {
    instruction: 'Photograph both frame rails from the front and rear of the vehicle. Use your phone flashlight. Look for kinks, bends, welds, or fresh paint.',
    focus: 'AI analyzes frame geometry for signs of collision damage, straightening, or welded repairs.',
    required: true,
    tip: 'Fresh paint or undercoating on specific sections of the frame means something was repaired there. Welded patches are a serious structural concern.',
  },

  // ─── TEST DRIVE ────────────────────────────────────────────────────────────

  'Engine Performance & Acceleration': {
    instruction: 'Record a short video of the engine bay while someone revs the engine. Photograph any smoke from the exhaust — white, blue, or black.',
    focus: 'AI analyzes exhaust smoke color for engine condition indicators.',
    required: false,
    tip: 'Blue smoke = burning oil (worn rings/seals). White smoke = coolant burning (head gasket). Black smoke = running rich (fuel system issue).',
  },
  'Transmission Shifting Smoothness (Auto/Manual)': {
    instruction: 'Photograph the transmission fluid dipstick (if accessible) showing color. For manual, photograph the clutch pedal and shifter.',
    focus: 'AI documents transmission fluid condition.',
    required: false,
    tip: 'Dark brown or burnt-smelling transmission fluid means the transmission has been stressed or is failing.',
  },

  // ─── TRUCK-SPECIFIC ────────────────────────────────────────────────────────

  'Bed/Cargo Area Condition': {
    instruction: 'Photograph the truck bed from all four corners and from above. Lift any bed liner to photograph the metal underneath.',
    focus: 'AI checks for rust, dents, cracks in the bed floor, and damage hidden under bed liners.',
    required: true,
    tip: 'Spray-in bed liners can hide significant rust and damage. Lift the edges to check underneath.',
  },
  'Hitch Condition & Rating': {
    instruction: 'Photograph the trailer hitch receiver from the rear and the hitch mounting points on the frame.',
    focus: 'AI checks for cracks, bends, and proper mounting of the hitch assembly.',
    required: false,
    tip: 'A bent or cracked hitch receiver indicates the vehicle has towed beyond its rated capacity.',
  },
  'Bed Tie-Down Anchors': {
    instruction: 'Photograph all four tie-down anchor points in the truck bed.',
    focus: 'AI documents anchor condition and presence.',
    required: false,
  },
  'Tow Package Components (If equipped)': {
    instruction: 'Photograph the trailer wiring connector (7-pin or 4-pin), the hitch ball, and any weight distribution equipment.',
    focus: 'AI documents towing equipment completeness and condition.',
    required: false,
  },
  '4WD/AWD System Operation': {
    instruction: 'Photograph the 4WD selector switch or dial. If accessible, photograph the transfer case.',
    focus: 'AI documents 4WD system type and condition of controls.',
    required: false,
  },
  'Transfer Case Fluid (4WD)': {
    instruction: 'Photograph the transfer case from underneath showing the fill and drain plugs. Look for leaks around the seals.',
    focus: 'AI checks for fluid leaks around the transfer case.',
    required: false,
  },

  // ─── EV-SPECIFIC ───────────────────────────────────────────────────────────

  'Charge Port Condition': {
    instruction: 'Open the charge port door and photograph the port from directly in front. Check for bent pins, damage, or burn marks.',
    focus: 'AI checks for damaged charge port pins, burn marks from improper charging, and physical damage.',
    required: true,
    tip: 'Burn marks or bent pins in the charge port can mean the vehicle was charged with a damaged cable — expensive to repair.',
  },
  'Charging Cable Included & Condition': {
    instruction: 'Photograph the included charging cable (Level 1 and/or Level 2) showing the connectors at both ends.',
    focus: 'AI documents cable condition and verifies proper charging equipment is included.',
    required: false,
    tip: 'A missing or damaged Level 2 charging cable can cost $300-$600 to replace. Verify it is included.',
  },
  'Thermal Management System (Visual)': {
    instruction: 'Photograph the battery cooling system components visible in the engine bay — coolant lines, heat exchanger, and any visible battery pack components.',
    focus: 'AI checks for coolant leaks in the battery thermal management system.',
    required: false,
    tip: 'Coolant leaks near the battery pack are a serious safety concern and very expensive to repair.',
  },
  'Frunk/Trunk': {
    instruction: 'Photograph the front trunk (frunk) and rear trunk with lids open, showing the full interior.',
    focus: 'AI checks for water intrusion, damage, and missing components.',
    required: false,
  },

  // ─── COMMERCIAL / 18-WHEELER ───────────────────────────────────────────────

  'Body Panels & Fairings': {
    instruction: 'Photograph all cab fairings, side skirts, and body panels. Walk the full length of the truck and trailer.',
    focus: 'AI checks for damage, missing fairings (fuel efficiency impact), and evidence of sideswipe accidents.',
    required: true,
  },
  'Entry Steps & Grab Handles': {
    instruction: 'Photograph the driver and passenger entry steps and grab handles on both sides.',
    focus: 'AI checks for bent, broken, or missing steps and handles — DOT safety violation.',
    required: true,
    tip: 'Broken or missing grab handles are a DOT violation and can result in an out-of-service order.',
  },
  'Tire Tread Depth (>4/32" Steer, >2/32" Other)': {
    instruction: 'Photograph each tire position (steer, drive, trailer) showing the tread. Use a tread depth gauge if available and photograph the reading.',
    focus: 'AI checks tread depth against DOT minimum requirements — steer tires require 4/32", others 2/32".',
    required: true,
    tip: 'Steer tires below 4/32" are an automatic DOT out-of-service violation. Check carefully.',
  },
  'Dual Tire Spacing & Condition': {
    instruction: 'Photograph the dual rear tires on each axle showing the spacing between them. Look for debris lodged between tires.',
    focus: 'AI checks for proper dual tire spacing and objects lodged between tires that cause blowouts.',
    required: true,
    tip: 'A rock or debris lodged between dual tires will cause a blowout. Always check between the duals.',
  },
  'Hub Oil Levels': {
    instruction: 'Photograph each hub oil sight glass showing the oil level.',
    focus: 'AI checks hub oil levels — low oil causes bearing failure and wheel-off incidents.',
    required: true,
    tip: 'A hub running low on oil will overheat and fail — potentially causing a wheel to come off at highway speed.',
  },
  'Air Brake System (Leaks, Hoses)': {
    instruction: 'Photograph the air brake hoses (glad hands), air tanks, and brake chambers on each axle.',
    focus: 'AI checks for cracked hoses, leaking fittings, and damaged brake chambers.',
    required: true,
    tip: 'Listen for air leaks with the engine off. A hissing sound means a leak — the brakes will fail when pressure drops below 60 PSI.',
  },
  'Fifth Wheel & Locking Jaw': {
    instruction: 'Photograph the fifth wheel plate from above and below. Show the locking jaw mechanism.',
    focus: 'AI checks for wear, cracks, and proper lubrication of the fifth wheel.',
    required: true,
    tip: 'A worn or cracked fifth wheel is a catastrophic failure risk. Look for cracks radiating from the kingpin hole.',
  },
  'DOT Stickers/Plates': {
    instruction: 'Photograph the USDOT number placard, MC number, IFTA sticker, and annual inspection sticker on the cab.',
    focus: 'AI verifies all required DOT markings are present and current.',
    required: true,
    tip: 'An expired annual inspection sticker is an automatic out-of-service violation.',
  },
  'Reflective Tape & Lights': {
    instruction: 'Photograph the reflective tape on the sides and rear of the trailer. Photograph all marker lights and clearance lights.',
    focus: 'AI checks for missing, damaged, or non-compliant reflective tape and lighting.',
    required: true,
  },

  // ─── RV-SPECIFIC ───────────────────────────────────────────────────────────

  'Roof Condition & Seals': {
    instruction: 'If safely accessible, photograph the full roof surface. Otherwise photograph the roof edges and seams from a ladder. Look for cracks, bubbles, or failed sealant.',
    focus: 'AI checks for roof membrane damage, failed seams, and areas of water infiltration.',
    required: true,
    tip: 'A cracked roof seal is the #1 cause of RV water damage. Even a small crack can cause tens of thousands in damage over time.',
  },
  'Sidewalls (Delamination Check)': {
    instruction: 'Press firmly on the sidewall panels and photograph any areas that feel soft or show bubbling/waviness.',
    focus: 'AI identifies delamination — separation of the outer fiberglass from the foam core — caused by water intrusion.',
    required: true,
    tip: 'Delamination feels soft and spongy when pressed. It means water has been inside the wall for a long time — very expensive to repair.',
  },
  'Awnings & Slide-Outs Operation': {
    instruction: 'Photograph each awning and slide-out in both retracted and extended positions. Look for tears, bent arms, and proper sealing.',
    focus: 'AI checks awning fabric condition and slide-out seal integrity.',
    required: true,
    tip: 'A torn awning is a $500-$2,000 repair. Check the fabric carefully for UV damage and tears.',
  },
  'Signs of Water Intrusion (Stains)': {
    instruction: 'Photograph the ceiling, walls, and floor around all windows, roof vents, and slide-out seals. Look for brown stains, soft spots, or discoloration.',
    focus: 'AI identifies water stain patterns and estimates severity of water damage.',
    required: true,
    tip: 'Water stains on the ceiling near roof vents or windows mean active or past leaks. Press the area — soft = rot.',
  },
  'Propane System (Leak Check)': {
    instruction: 'Photograph the propane tanks showing the regulator and lines. Photograph the LP detector inside the RV.',
    focus: 'AI documents propane system components for the inspection report.',
    required: true,
    tip: 'Apply soapy water to all propane connections and look for bubbles — this is the only reliable way to check for leaks.',
  },

  // ─── CLASSIC VEHICLE ───────────────────────────────────────────────────────

  'Paint Quality & Originality': {
    instruction: 'Photograph each panel from 3 feet away in good light. Then photograph close-ups of the paint texture. Check door jambs and trunk jamb for original paint.',
    focus: 'AI analyzes paint texture, orange peel, and color consistency to determine if paint is original or a respray.',
    required: true,
    tip: 'Original paint has a specific texture and patina. A respray often has too-perfect orange peel or overspray in jambs.',
  },
  'Evidence of Bondo/Fillers (Magnet Test)': {
    instruction: 'Run a magnet across each body panel. Photograph any areas where the magnet does not stick (indicating body filler).',
    focus: 'AI maps areas of body filler to assess extent of prior damage repair.',
    required: true,
    tip: 'A magnet will not stick to body filler. Thick filler means significant damage was repaired — and filler cracks over time.',
  },
  'Engine Numbers Matching (If applicable)': {
    instruction: 'Photograph the engine number stamp on the block (location varies by make/model). Photograph the VIN plate and compare. Photograph the transmission tag.',
    focus: 'AI verifies numbers-matching status which dramatically affects classic car value.',
    required: true,
    tip: 'A numbers-matching classic can be worth 2-3x a non-matching example. Verify all stampings carefully.',
  },
  'Frame Rails for Rust/Rot/Repairs': {
    instruction: 'Photograph both frame rails from front to rear. Use a flashlight. Look for rust-through, patches, and welds.',
    focus: 'AI assesses frame integrity — rust-through or welded patches are structural safety concerns.',
    required: true,
    tip: 'Poke suspected rust areas with a screwdriver. If it goes through, the frame is compromised.',
  },
  'Floor Pans Integrity': {
    instruction: 'Photograph the floor pans from underneath and from inside the vehicle (lift carpet/mats). Look for rust-through, patches, or repairs.',
    focus: 'AI checks floor pan integrity — rust-through is a safety hazard and expensive to repair.',
    required: true,
    tip: 'Floor pan replacement on a classic can cost $2,000-$8,000. Rust-through means exhaust fumes can enter the cabin.',
  },
  'History & Service Records': {
    instruction: 'Photograph all available documentation — service records, title history, restoration receipts, and any window sticker or build sheet.',
    focus: 'AI catalogs documentation for the report and verifies consistency with vehicle condition.',
    required: false,
    tip: 'A documented history can add significant value. Missing records on a claimed restored vehicle is a red flag.',
  },

  // ─── MOTORCYCLE ────────────────────────────────────────────────────────────

  'Frame for Damage/Cracks': {
    instruction: 'Photograph the main frame tubes, steering head, and swing arm pivot area. Look for cracks, bends, or welded repairs.',
    focus: 'AI checks for frame damage that indicates a crash — extremely dangerous if undetected.',
    required: true,
    tip: 'A cracked steering head or bent frame is a total loss on a motorcycle. Check carefully around welds.',
  },
  'Fork Seals (No Leaks)': {
    instruction: 'Photograph the front fork legs showing the area just above the lower leg where the seal sits. Look for oil residue.',
    focus: 'AI checks for leaking fork seals — oil on the fork leg is a clear indicator.',
    required: true,
    tip: 'Oil on the fork legs means the seals are leaking. Fork seal replacement costs $150-$400 and is a negotiating point.',
  },
  'Chain/Belt Tension & Condition': {
    instruction: 'Photograph the drive chain or belt showing the full length. Photograph the sprockets front and rear.',
    focus: 'AI checks chain/belt condition and sprocket wear.',
    required: true,
    tip: 'A worn chain and sprocket set costs $150-$400 to replace. Hooked sprocket teeth mean the chain has been neglected.',
  },
  'Tire Age & Tread': {
    instruction: 'Photograph both tires showing the tread and sidewall. Find the DOT date code on the sidewall (last 4 digits = week and year of manufacture).',
    focus: 'AI checks tread depth and tire age — motorcycle tires should be replaced every 5-6 years regardless of tread.',
    required: true,
    tip: 'Motorcycle tires older than 6 years are unsafe even with good tread. The rubber hardens and loses grip.',
  },

  // ─── RENTAL FLEET SPECIFIC ─────────────────────────────────────────────────

  'Front Exterior (Rental)': {
    instruction: 'Stand 8 feet in front of the vehicle, center it in frame. Photograph the full front end showing bumper, hood, headlights, and grille.',
    focus: 'AI creates a baseline record of front-end condition for before/after comparison.',
    required: true,
    tip: 'Ensure the full bumper is visible. This is the most commonly damaged area on rental vehicles.',
  },
  'Rear Exterior (Rental)': {
    instruction: 'Stand 8 feet behind the vehicle. Photograph the full rear end showing bumper, trunk/tailgate, taillights, and license plate.',
    focus: 'AI creates a baseline record of rear-end condition for before/after comparison.',
    required: true,
  },
  'Driver Side (Rental)': {
    instruction: 'Stand 10 feet from the driver side. Photograph the full side profile showing all panels from bumper to bumper.',
    focus: 'AI creates a baseline record of driver-side condition for before/after comparison.',
    required: true,
  },
  'Passenger Side (Rental)': {
    instruction: 'Stand 10 feet from the passenger side. Photograph the full side profile showing all panels from bumper to bumper.',
    focus: 'AI creates a baseline record of passenger-side condition for before/after comparison.',
    required: true,
  },
  'Interior (Front) (Rental)': {
    instruction: 'Open the driver door and photograph the full front interior — seats, dashboard, steering wheel, and center console.',
    focus: 'AI creates a baseline record of interior condition.',
    required: true,
  },
  'Interior (Rear) (Rental)': {
    instruction: 'Open a rear door and photograph the rear seats and floor.',
    focus: 'AI creates a baseline record of rear interior condition.',
    required: true,
  },
  'Existing Damage Documentation': {
    instruction: 'Photograph every existing scratch, dent, or damage mark on the vehicle from close range. Each damage area needs its own photo.',
    focus: 'AI catalogs all pre-existing damage to protect against false damage claims.',
    required: true,
    tip: 'Document EVERY scratch and dent before checkout — even small ones. This is your legal protection.',
  },
  'Fuel Level': {
    instruction: 'Photograph the fuel gauge with the ignition ON showing the current fuel level.',
    focus: 'AI records fuel level at checkout and check-in for fuel charge calculation.',
    required: true,
  },
  'Odometer (Rental)': {
    instruction: 'Photograph the odometer display clearly showing the exact mileage.',
    focus: 'AI records mileage at checkout and check-in for mileage charge calculation.',
    required: true,
  },
};

/**
 * Get photo guidance for a specific checklist item
 * Falls back to a generic instruction if no specific guidance exists
 */
export function getPhotoGuidance(itemName: string): PhotoGuidance {
  // Direct match
  if (PHOTO_GUIDANCE[itemName]) {
    return PHOTO_GUIDANCE[itemName];
  }

  // Partial match — find the closest key
  const keys = Object.keys(PHOTO_GUIDANCE);
  const partialMatch = keys.find(key =>
    itemName.toLowerCase().includes(key.toLowerCase()) ||
    key.toLowerCase().includes(itemName.toLowerCase())
  );
  if (partialMatch) {
    return PHOTO_GUIDANCE[partialMatch];
  }

  // Generic fallback
  return {
    instruction: `Photograph the "${itemName}" clearly from the best angle to show its current condition. Get close enough that details are visible.`,
    focus: 'AI will analyze this photo for condition assessment and include it in the inspection report.',
    required: false,
    tip: 'Good lighting and a steady hand produce the clearest photos for AI analysis.',
  };
}

/**
 * Get all required photo items for a vehicle type
 * Returns items that MUST be photographed for complete AI analysis
 */
export function getRequiredPhotoItems(vehicleType: string): string[] {
  const requiredItems: string[] = [];
  for (const [item, guidance] of Object.entries(PHOTO_GUIDANCE)) {
    if (guidance.required) {
      requiredItems.push(item);
    }
  }
  return requiredItems;
}
