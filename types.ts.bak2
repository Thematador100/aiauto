// types.ts

// User and authentication types (Phase 2C: Multi-tier users)
export interface User {
  id: string;
  email: string;
  plan: string;
  userType?: 'admin' | 'pro' | 'diy';
  companyName?: string;
  inspectionCredits?: number;
  subscriptionStatus?: string;
  licenseStatus?: 'active' | 'trial' | 'suspended' | 'cancelled' | 'inactive' | 'expired';
  featuresEnabled?: Record<string, boolean>;
}

// Vehicle data types
export interface Vehicle {
  vin: string;
  make: string;
  model: string;
  year: string;
  bodyClass?: string;
  fuelType?: string;
  driveType?: string;
  engineCylinders?: string;
  gvwr?: string;
}

export interface VehicleData {
  make: string;
  model: string;
  year: string;
}

// Inspection-related types
export interface InspectionPhoto {
  id: string;
  category: string;
  base64: string;
  mimeType: string;
  notes?: string;
}

export interface InspectionAudio {
  base64: string;
  mimeType: string;
}

export type ConditionRating = 'pass' | 'fail' | 'concern' | 'na' | 'unchecked';

export interface InspectionChecklistItem {
  item: string;
  checked: boolean;
  condition: ConditionRating;
  notes: string;
  photos: InspectionPhoto[];
  audio: InspectionAudio | null;
}

export interface InspectionSection {
  [key: string]: InspectionChecklistItem[];
}

export interface InspectionState {
  vehicle: Vehicle;
  vehicleType: keyof typeof import('./constants').VEHICLE_INSPECTION_TEMPLATES;
  checklist: InspectionSection;
  complianceChecklist: InspectionSection;
  overallNotes: string;
  odometer: string;
}

// Diagnostic and Chat types
export interface DTCCode {
  code: string;
  description: string;
}

export interface GroundingSource {
  uri: string;
  title?: string;
}

// External data service types
export interface VehicleHistoryReport {
  ownerCount: number;
  hasAccident: boolean;
  accidentDetails: string | null;
  lastOdometerReading: string;
  titleIssues: string | null;
}

export interface SafetyRecall {
  component: string;
  summary: string;
  consequence: string;
  remedy: string;
}

export interface TheftRecord {
  isStolen: boolean;
  isSalvage: boolean;
  details: string;
}

// Final Report types
export interface ReportSectionItem {
  check: string;
  status: 'Pass' | 'Fail' | 'Concern' | 'N/A';
  details: string;
  photos: { category: string; url: string; notes?: string }[];
}

export interface ReportSection {
  title: string;
  notes: string;
  items: ReportSectionItem[];
}

export interface VehicleGrade {
  letter: string;       // A, B, C, D, F
  score: number;        // 0-100
  buyRecommendation: string;
  estimatedRepairCost?: string;
}

export interface DamageAssessment {
  overallSeverity: string;
  accidentLikelihood: string;
  findings: { area: string; severity: string; description: string }[];
}

export interface CompletedReport {
  id: string;
  date: string;
  vehicle: Vehicle;
  vehicleType: string;
  odometer: string;
  summary: {
    overallCondition: string;
    keyFindings: string[];
    recommendations: string[];
  };
  vehicleGrade?: VehicleGrade;
  inspectorInfo?: {
    name: string;
    licenseNumber?: string;
    company?: string;
  };
  damageAssessment?: DamageAssessment;
  sections: ReportSection[];
  complianceSections: ReportSection[];
  vehicleHistory: VehicleHistoryReport;
  safetyRecalls: SafetyRecall[];
  theftAndSalvage: TheftRecord;
}

// Pricing and configuration types
export interface PricingPlan {
  name: string;
  price: string;
  features: string[];
}
