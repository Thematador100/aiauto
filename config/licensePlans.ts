/**
 * AI Auto Pro — Modular License Plans
 *
 * Each plan unlocks specific feature modules.
 * Admin can assign any plan to any user.
 * Users can also purchase directly from the marketing site.
 */

export interface LicensePlan {
  id: string;
  name: string;
  tagline: string;
  price: number;           // Annual price in USD
  monthlyEquiv: number;    // Monthly equivalent for display
  audience: string;        // Who this is for
  modules: string[];       // Feature modules unlocked
  maxInspections: number | 'unlimited'; // Per year
  userSeats: number;       // Number of user accounts
  highlight?: boolean;     // Show as recommended
  badge?: string;          // e.g. "Most Popular", "Best Value"
  stripeLink?: string;     // Stripe payment link (set in env)
}

export const LICENSE_MODULES = {
  // Core
  INSPECTION_STANDARD:    'inspection_standard',    // Car, SUV, Truck inspections
  INSPECTION_COMMERCIAL:  'inspection_commercial',  // 18-Wheeler / CDL inspections
  INSPECTION_RV:          'inspection_rv',          // RV / Motorhome inspections
  INSPECTION_CLASSIC:     'inspection_classic',     // Vintage / Classic car inspections
  INSPECTION_EV:          'inspection_ev',          // EV / Hybrid inspections
  INSPECTION_MOTORCYCLE:  'inspection_motorcycle',  // Motorcycle inspections

  // AI Fraud & Detection
  DAMAGE_DETECTION:       'damage_detection',       // Optical body damage AI
  ODOMETER_FRAUD:         'odometer_fraud',         // Odometer rollback detection
  FLOOD_DETECTION:        'flood_detection',        // Flood damage AI
  VIN_CLONE:              'vin_clone',              // VIN cloning & title washing
  TIRE_WEAR:              'tire_wear',              // AI tire wear analysis
  FRAME_STRUCTURAL:       'frame_structural',       // Frame/unibody structural AI

  // OBD / Diagnostics
  OBD_STANDARD:           'obd_standard',           // OBD-II Bluetooth scanning
  OBD_HEAVY_DUTY:         'obd_heavy_duty',         // J1939 heavy-duty scanning
  DTC_AI:                 'dtc_ai',                 // AI DTC code interpretation

  // Reports & Business
  AI_REPORTS:             'ai_reports',             // AI-generated inspection reports
  PDF_EXPORT:             'pdf_export',             // PDF report export
  DEALER_TRICKS:          'dealer_tricks',          // Dealer tactics exposure module
  LEAD_BOT:               'lead_bot',               // Lead capture bot integration
  WHITE_LABEL:            'white_label',            // White-label branding
  API_ACCESS:             'api_access',             // REST API access
} as const;

export type LicenseModule = typeof LICENSE_MODULES[keyof typeof LICENSE_MODULES];

export const LICENSE_PLANS: LicensePlan[] = [
  {
    id: 'diy-consumer',
    name: 'DIY Consumer',
    tagline: 'Protect yourself before you buy',
    price: 97,
    monthlyEquiv: 8,
    audience: 'Private buyers, used car shoppers',
    modules: [
      LICENSE_MODULES.INSPECTION_STANDARD,
      LICENSE_MODULES.INSPECTION_CLASSIC,
      LICENSE_MODULES.DAMAGE_DETECTION,
      LICENSE_MODULES.ODOMETER_FRAUD,
      LICENSE_MODULES.FLOOD_DETECTION,
      LICENSE_MODULES.VIN_CLONE,
      LICENSE_MODULES.AI_REPORTS,
      LICENSE_MODULES.PDF_EXPORT,
    ],
    maxInspections: 25,
    userSeats: 1,
  },
  {
    id: 'vintage-classic',
    name: 'Vintage & Classic',
    tagline: 'Purpose-built for collector car inspection',
    price: 297,
    monthlyEquiv: 25,
    audience: 'Classic car collectors, auction buyers, restoration shops',
    modules: [
      LICENSE_MODULES.INSPECTION_STANDARD,
      LICENSE_MODULES.INSPECTION_CLASSIC,
      LICENSE_MODULES.DAMAGE_DETECTION,
      LICENSE_MODULES.ODOMETER_FRAUD,
      LICENSE_MODULES.FLOOD_DETECTION,
      LICENSE_MODULES.VIN_CLONE,
      LICENSE_MODULES.FRAME_STRUCTURAL,
      LICENSE_MODULES.TIRE_WEAR,
      LICENSE_MODULES.DEALER_TRICKS,
      LICENSE_MODULES.AI_REPORTS,
      LICENSE_MODULES.PDF_EXPORT,
    ],
    maxInspections: 100,
    userSeats: 1,
    badge: 'Collectors Choice',
  },
  {
    id: 'pro-inspector',
    name: 'Pro Inspector',
    tagline: 'Full platform for professional inspectors',
    price: 997,
    monthlyEquiv: 83,
    audience: 'Mobile inspectors, dealerships, independent shops',
    modules: [
      LICENSE_MODULES.INSPECTION_STANDARD,
      LICENSE_MODULES.INSPECTION_CLASSIC,
      LICENSE_MODULES.INSPECTION_RV,
      LICENSE_MODULES.INSPECTION_EV,
      LICENSE_MODULES.INSPECTION_MOTORCYCLE,
      LICENSE_MODULES.DAMAGE_DETECTION,
      LICENSE_MODULES.ODOMETER_FRAUD,
      LICENSE_MODULES.FLOOD_DETECTION,
      LICENSE_MODULES.VIN_CLONE,
      LICENSE_MODULES.TIRE_WEAR,
      LICENSE_MODULES.FRAME_STRUCTURAL,
      LICENSE_MODULES.OBD_STANDARD,
      LICENSE_MODULES.DTC_AI,
      LICENSE_MODULES.DEALER_TRICKS,
      LICENSE_MODULES.AI_REPORTS,
      LICENSE_MODULES.PDF_EXPORT,
    ],
    maxInspections: 'unlimited',
    userSeats: 1,
    highlight: true,
    badge: 'Most Popular',
  },
  {
    id: 'commercial-fleet',
    name: 'Commercial & Fleet',
    tagline: 'CDL-grade inspection for 18-wheelers and fleets',
    price: 1997,
    monthlyEquiv: 166,
    audience: 'Trucking companies, fleet managers, CDL inspectors, auction houses',
    modules: [
      LICENSE_MODULES.INSPECTION_STANDARD,
      LICENSE_MODULES.INSPECTION_COMMERCIAL,
      LICENSE_MODULES.INSPECTION_RV,
      LICENSE_MODULES.DAMAGE_DETECTION,
      LICENSE_MODULES.ODOMETER_FRAUD,
      LICENSE_MODULES.FLOOD_DETECTION,
      LICENSE_MODULES.VIN_CLONE,
      LICENSE_MODULES.TIRE_WEAR,
      LICENSE_MODULES.FRAME_STRUCTURAL,
      LICENSE_MODULES.OBD_STANDARD,
      LICENSE_MODULES.OBD_HEAVY_DUTY,
      LICENSE_MODULES.DTC_AI,
      LICENSE_MODULES.DEALER_TRICKS,
      LICENSE_MODULES.AI_REPORTS,
      LICENSE_MODULES.PDF_EXPORT,
    ],
    maxInspections: 'unlimited',
    userSeats: 5,
    badge: 'Fleet Ready',
  },
  {
    id: 'entrepreneur',
    name: 'Entrepreneur License',
    tagline: 'Run your own AI inspection business',
    price: 3997,
    monthlyEquiv: 333,
    audience: 'Entrepreneurs launching mobile inspection services',
    modules: [
      LICENSE_MODULES.INSPECTION_STANDARD,
      LICENSE_MODULES.INSPECTION_COMMERCIAL,
      LICENSE_MODULES.INSPECTION_RV,
      LICENSE_MODULES.INSPECTION_CLASSIC,
      LICENSE_MODULES.INSPECTION_EV,
      LICENSE_MODULES.INSPECTION_MOTORCYCLE,
      LICENSE_MODULES.DAMAGE_DETECTION,
      LICENSE_MODULES.ODOMETER_FRAUD,
      LICENSE_MODULES.FLOOD_DETECTION,
      LICENSE_MODULES.VIN_CLONE,
      LICENSE_MODULES.TIRE_WEAR,
      LICENSE_MODULES.FRAME_STRUCTURAL,
      LICENSE_MODULES.OBD_STANDARD,
      LICENSE_MODULES.OBD_HEAVY_DUTY,
      LICENSE_MODULES.DTC_AI,
      LICENSE_MODULES.DEALER_TRICKS,
      LICENSE_MODULES.AI_REPORTS,
      LICENSE_MODULES.PDF_EXPORT,
      LICENSE_MODULES.WHITE_LABEL,
      LICENSE_MODULES.LEAD_BOT,
    ],
    maxInspections: 'unlimited',
    userSeats: 10,
    badge: 'Best Value',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'Full platform with API access and white-label',
    price: 9997,
    monthlyEquiv: 833,
    audience: 'Large fleets, auction houses, insurance companies, franchise operations',
    modules: Object.values(LICENSE_MODULES), // All modules
    maxInspections: 'unlimited',
    userSeats: 999,
  },
];

/**
 * Check if a user's license plan includes a specific module
 */
export function hasModule(userModules: string[] | null | undefined, module: LicenseModule): boolean {
  if (!userModules || userModules.length === 0) return false;
  return userModules.includes(module) || userModules.includes('all');
}

/**
 * Get plan by ID
 */
export function getPlanById(planId: string): LicensePlan | undefined {
  return LICENSE_PLANS.find(p => p.id === planId);
}

/**
 * Get all modules for a plan ID
 */
export function getModulesForPlan(planId: string): string[] {
  const plan = getPlanById(planId);
  return plan?.modules || [];
}
