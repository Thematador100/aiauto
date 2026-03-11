// config.ts

import { PricingPlan } from './types';

interface ReportPricing {
  [key: string]: { price: number };
}

interface Config {
  BRANDING: {
    companyName: string;
  };
  PRICING: {
    plans: {
      pro: PricingPlan;
    };
    reports: ReportPricing;
  };
}

export const CONFIG: Config = {
  BRANDING: {
    companyName: 'AI Auto Pro',
  },
  PRICING: {
    plans: {
      pro: {
        name: 'Pro',
        price: '$49.99 / mo',
        features: [
          'Unlimited Vehicle Inspections',
          'AI-Powered Report Summaries',
          'Vehicle History Integration',
          'Diagnostic Code Analysis',
          'AI Assistant Chat',
        ],
      },
    },
    // Keys MUST match keys in VEHICLE_INSPECTION_TEMPLATES in constants.ts
    reports: {
      'Standard': { price: 19.99 },       // Car / SUV
      'Truck': { price: 24.99 },           // Pickup / Light-Duty Truck
      'EV': { price: 24.99 },              // Electric Vehicle
      'Commercial': { price: 39.99 },      // 18-Wheeler / Commercial
      'RV': { price: 34.99 },              // RV / Motorhome
      'Classic': { price: 29.99 },         // Classic / Vintage
      'Motorcycle': { price: 14.99 },      // Motorcycle
    },
  },
};
