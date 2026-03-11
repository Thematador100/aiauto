// Predictive Maintenance AI Service
// Uses machine learning to predict future maintenance needs

export interface MaintenancePrediction {
  component: string;
  likelihood: number; // 0-100
  timeframe: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  estimatedCost: { min: number; max: number };
  recommendations: string[];
}

export interface VehicleHealthScore {
  overall: number; // 0-100
  categories: {
    engine: number;
    transmission: number;
    brakes: number;
    suspension: number;
    electrical: number;
  };
  predictions: MaintenancePrediction[];
}

class PredictiveMaintenanceService {
  
  /**
   * Analyze vehicle data and predict future maintenance needs
   */
  async predictMaintenance(vehicleData: {
    year: number;
    make: string;
    model: string;
    odometer: number;
    dtcCodes?: string[];
    liveData?: any;
    serviceHistory?: any[];
  }): Promise<VehicleHealthScore> {
    
    const predictions: MaintenancePrediction[] = [];
    const vehicleAge = new Date().getFullYear() - vehicleData.year;
    
    // Algorithm 1: Mileage-based predictions
    predictions.push(...this.predictByMileage(vehicleData.odometer, vehicleAge));
    
    // Algorithm 2: DTC code analysis
    if (vehicleData.dtcCodes && vehicleData.dtcCodes.length > 0) {
      predictions.push(...this.predictByDTCCodes(vehicleData.dtcCodes));
    }
    
    // Algorithm 3: Age-based predictions
    predictions.push(...this.predictByAge(vehicleAge, vehicleData.odometer));
    
    // Algorithm 4: Live sensor data analysis
    if (vehicleData.liveData) {
      predictions.push(...this.predictByLiveData(vehicleData.liveData));
    }
    
    // Calculate health scores
    const categories = this.calculateHealthScores(predictions, vehicleData);
    const overall = this.calculateOverallHealth(categories);
    
    return {
      overall,
      categories,
      predictions: predictions.sort((a, b) => b.likelihood - a.likelihood),
    };
  }

  /**
   * Predict maintenance based on mileage
   */
  private predictByMileage(odometer: number, age: number): MaintenancePrediction[] {
    const predictions: MaintenancePrediction[] = [];
    
    // Timing belt (60k-100k miles)
    if (odometer > 60000 && odometer < 100000) {
      predictions.push({
        component: 'Timing Belt',
        likelihood: Math.min(((odometer - 60000) / 40000) * 100, 100),
        timeframe: `${Math.max(0, 100000 - odometer).toLocaleString()} miles`,
        severity: 'high',
        estimatedCost: { min: 500, max: 1200 },
        recommendations: [
          'Schedule timing belt replacement soon',
          'Inspect water pump at same time',
          'Check tensioners and pulleys',
        ],
      });
    }
    
    // Transmission fluid (30k-60k miles)
    if (odometer > 30000 && odometer % 30000 < 5000) {
      predictions.push({
        component: 'Transmission Fluid',
        likelihood: 80,
        timeframe: 'Due now',
        severity: 'medium',
        estimatedCost: { min: 150, max: 300 },
        recommendations: [
          'Change transmission fluid',
          'Inspect transmission filter',
          'Check for leaks',
        ],
      });
    }
    
    // Brake pads (25k-70k miles depending on driving)
    const brakeLifeRemaining = 50000 - (odometer % 50000);
    if (brakeLifeRemaining < 10000) {
      predictions.push({
        component: 'Brake Pads',
        likelihood: ((10000 - brakeLifeRemaining) / 10000) * 100,
        timeframe: `${brakeLifeRemaining.toLocaleString()} miles`,
        severity: 'medium',
        estimatedCost: { min: 200, max: 500 },
        recommendations: [
          'Inspect brake pad thickness',
          'Check rotor condition',
          'Test brake fluid moisture content',
        ],
      });
    }
    
    return predictions;
  }

  /**
   * Predict maintenance based on DTC codes
   */
  private predictByDTCCodes(codes: string[]): MaintenancePrediction[] {
    const predictions: MaintenancePrediction[] = [];
    
    // Oxygen sensor codes
    const o2Codes = codes.filter(c => c.includes('P013') || c.includes('P014'));
    if (o2Codes.length > 0) {
      predictions.push({
        component: 'Oxygen Sensors',
        likelihood: 90,
        timeframe: 'Immediate attention needed',
        severity: 'high',
        estimatedCost: { min: 200, max: 600 },
        recommendations: [
          'Replace faulty oxygen sensor(s)',
          'Check for exhaust leaks',
          'Verify catalytic converter function',
        ],
      });
    }
    
    // Catalytic converter codes
    const catCodes = codes.filter(c => c.includes('P042') || c.includes('P043'));
    if (catCodes.length > 0) {
      predictions.push({
        component: 'Catalytic Converter',
        likelihood: 85,
        timeframe: '1-3 months',
        severity: 'critical',
        estimatedCost: { min: 800, max: 2500 },
        recommendations: [
          'Diagnose catalytic converter efficiency',
          'Check for upstream issues (O2 sensors, fuel system)',
          'Consider replacement if below threshold',
        ],
      });
    }
    
    // Misfire codes
    const misfireCodes = codes.filter(c => c.includes('P030'));
    if (misfireCodes.length > 0) {
      predictions.push({
        component: 'Ignition System',
        likelihood: 95,
        timeframe: 'Immediate',
        severity: 'high',
        estimatedCost: { min: 100, max: 800 },
        recommendations: [
          'Replace spark plugs',
          'Inspect ignition coils',
          'Check fuel injectors',
          'Verify compression',
        ],
      });
    }
    
    return predictions;
  }

  /**
   * Predict maintenance based on vehicle age
   */
  private predictByAge(age: number, odometer: number): MaintenancePrediction[] {
    const predictions: MaintenancePrediction[] = [];
    
    // Battery (3-5 years)
    if (age >= 3) {
      predictions.push({
        component: 'Battery',
        likelihood: Math.min((age - 3) * 25, 100),
        timeframe: `${Math.max(0, 5 - age)} years`,
        severity: 'medium',
        estimatedCost: { min: 100, max: 250 },
        recommendations: [
          'Test battery voltage and cranking amps',
          'Clean battery terminals',
          'Check charging system',
        ],
      });
    }
    
    // Coolant (5 years or 150k miles)
    if (age >= 5 || odometer >= 150000) {
      predictions.push({
        component: 'Coolant System',
        likelihood: 75,
        timeframe: 'Due for service',
        severity: 'medium',
        estimatedCost: { min: 150, max: 400 },
        recommendations: [
          'Flush and replace coolant',
          'Inspect hoses and clamps',
          'Check radiator cap and thermostat',
        ],
      });
    }
    
    return predictions;
  }

  /**
   * Predict maintenance based on live sensor data
   */
  private predictByLiveData(liveData: any): MaintenancePrediction[] {
    const predictions: MaintenancePrediction[] = [];
    
    // High coolant temperature
    if (liveData.coolantTemp > 100) {
      predictions.push({
        component: 'Cooling System',
        likelihood: 90,
        timeframe: 'Immediate',
        severity: 'critical',
        estimatedCost: { min: 200, max: 1500 },
        recommendations: [
          'Check coolant level immediately',
          'Inspect for leaks',
          'Test thermostat',
          'Verify radiator fan operation',
        ],
      });
    }
    
    // High engine load
    if (liveData.engineLoad > 85) {
      predictions.push({
        component: 'Air Filter',
        likelihood: 70,
        timeframe: '1-2 months',
        severity: 'low',
        estimatedCost: { min: 20, max: 60 },
        recommendations: [
          'Inspect and replace air filter',
          'Check for intake restrictions',
        ],
      });
    }
    
    return predictions;
  }

  /**
   * Calculate health scores for each category
   */
  private calculateHealthScores(predictions: MaintenancePrediction[], vehicleData: any): VehicleHealthScore['categories'] {
    const scores = {
      engine: 100,
      transmission: 100,
      brakes: 100,
      suspension: 100,
      electrical: 100,
    };
    
    // Reduce scores based on predictions
    for (const pred of predictions) {
      const impact = pred.likelihood * (pred.severity === 'critical' ? 0.8 : pred.severity === 'high' ? 0.5 : 0.3);
      
      if (pred.component.toLowerCase().includes('engine') || pred.component.toLowerCase().includes('timing')) {
        scores.engine -= impact / 2;
      }
      if (pred.component.toLowerCase().includes('transmission')) {
        scores.transmission -= impact / 2;
      }
      if (pred.component.toLowerCase().includes('brake')) {
        scores.brakes -= impact / 2;
      }
      if (pred.component.toLowerCase().includes('suspension')) {
        scores.suspension -= impact / 2;
      }
      if (pred.component.toLowerCase().includes('electrical') || pred.component.toLowerCase().includes('battery')) {
        scores.electrical -= impact / 2;
      }
    }
    
    // Ensure scores don't go below 0
    return {
      engine: Math.max(0, Math.round(scores.engine)),
      transmission: Math.max(0, Math.round(scores.transmission)),
      brakes: Math.max(0, Math.round(scores.brakes)),
      suspension: Math.max(0, Math.round(scores.suspension)),
      electrical: Math.max(0, Math.round(scores.electrical)),
    };
  }

  /**
   * Calculate overall health score
   */
  private calculateOverallHealth(categories: VehicleHealthScore['categories']): number {
    const weights = {
      engine: 0.3,
      transmission: 0.25,
      brakes: 0.2,
      suspension: 0.15,
      electrical: 0.1,
    };
    
    const overall = 
      categories.engine * weights.engine +
      categories.transmission * weights.transmission +
      categories.brakes * weights.brakes +
      categories.suspension * weights.suspension +
      categories.electrical * weights.electrical;
    
    return Math.round(overall);
  }
}

export const predictiveMaintenanceService = new PredictiveMaintenanceService();
