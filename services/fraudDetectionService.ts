// AI-Powered Fraud Detection Service
// Advanced algorithms for detecting odometer rollback, frame damage, flood damage, etc.

export interface FraudAnalysis {
  overallRiskScore: number; // 0-100
  odometerFraud: {
    detected: boolean;
    confidence: number;
    reasons: string[];
    expectedRange: { min: number; max: number };
  };
  frameDamage: {
    detected: boolean;
    confidence: number;
    areas: string[];
  };
  floodDamage: {
    detected: boolean;
    confidence: number;
    indicators: string[];
  };
  titleIssues: {
    detected: boolean;
    issues: string[];
  };
  recommendations: string[];
}

export interface VehicleData {
  vin: string;
  year: number;
  make: string;
  model: string;
  odometer: number;
  odometerUnit: 'miles' | 'km';
  photos?: string[];
  dtcCodes?: string[];
  serviceHistory?: Array<{
    date: string;
    odometer: number;
    service: string;
  }>;
}

class FraudDetectionService {
  
  /**
   * Comprehensive fraud analysis using multiple AI algorithms
   */
  async analyzeFraud(vehicleData: VehicleData): Promise<FraudAnalysis> {
    const [odometerAnalysis, frameDamageAnalysis, floodAnalysis, titleAnalysis] = await Promise.all([
      this.detectOdometerFraud(vehicleData),
      this.detectFrameDamage(vehicleData),
      this.detectFloodDamage(vehicleData),
      this.checkTitleIssues(vehicleData),
    ]);

    const overallRiskScore = this.calculateOverallRisk({
      odometerAnalysis,
      frameDamageAnalysis,
      floodAnalysis,
      titleAnalysis,
    });

    const recommendations = this.generateRecommendations({
      odometerAnalysis,
      frameDamageAnalysis,
      floodAnalysis,
      titleAnalysis,
      overallRiskScore,
    });

    return {
      overallRiskScore,
      odometerFraud: odometerAnalysis,
      frameDamage: frameDamageAnalysis,
      floodDamage: floodAnalysis,
      titleIssues: titleAnalysis,
      recommendations,
    };
  }

  /**
   * Advanced odometer rollback detection using multiple algorithms
   */
  private async detectOdometerFraud(vehicleData: VehicleData): Promise<FraudAnalysis['odometerFraud']> {
    const reasons: string[] = [];
    let confidence = 0;
    
    // Calculate expected odometer range based on vehicle age
    const vehicleAge = new Date().getFullYear() - vehicleData.year;
    const averageAnnualMiles = 12000; // US average
    const expectedMin = vehicleAge * (averageAnnualMiles * 0.5); // Low estimate
    const expectedMax = vehicleAge * (averageAnnualMiles * 1.5); // High estimate
    
    const expectedRange = { min: expectedMin, max: expectedMax };
    
    // Algorithm 1: Age vs. Odometer correlation
    if (vehicleData.odometer < expectedMin) {
      reasons.push(`Odometer reading (${vehicleData.odometer.toLocaleString()}) is unusually low for a ${vehicleAge}-year-old vehicle`);
      confidence += 30;
    }
    
    // Algorithm 2: Service history analysis
    if (vehicleData.serviceHistory && vehicleData.serviceHistory.length > 0) {
      const sortedHistory = [...vehicleData.serviceHistory].sort((a, b) => 
        new Date(a.date).getTime() - new Date(b.date).getTime()
      );
      
      for (let i = 1; i < sortedHistory.length; i++) {
        if (sortedHistory[i].odometer < sortedHistory[i - 1].odometer) {
          reasons.push(`Service history shows odometer decreased from ${sortedHistory[i - 1].odometer.toLocaleString()} to ${sortedHistory[i].odometer.toLocaleString()}`);
          confidence += 50;
          break;
        }
      }
      
      // Check if current odometer is less than last service record
      const lastService = sortedHistory[sortedHistory.length - 1];
      if (vehicleData.odometer < lastService.odometer) {
        reasons.push(`Current odometer (${vehicleData.odometer.toLocaleString()}) is lower than last service record (${lastService.odometer.toLocaleString()})`);
        confidence += 60;
      }
    }
    
    // Algorithm 3: Wear pattern analysis (would use AI vision on photos)
    if (vehicleData.photos && vehicleData.photos.length > 0) {
      const wearScore = await this.analyzeWearPatterns(vehicleData);
      if (wearScore > 70 && vehicleData.odometer < expectedMin) {
        reasons.push(`Vehicle shows high wear patterns inconsistent with low odometer reading`);
        confidence += 25;
      }
    }
    
    // Algorithm 4: Digital odometer tampering detection
    const digitalTamperingScore = this.detectDigitalTampering(vehicleData);
    if (digitalTamperingScore > 50) {
      reasons.push(`Digital odometer shows signs of potential tampering`);
      confidence += digitalTamperingScore / 2;
    }
    
    // Cap confidence at 100
    confidence = Math.min(confidence, 100);
    
    return {
      detected: confidence > 50,
      confidence,
      reasons,
      expectedRange,
    };
  }

  /**
   * AI-powered wear pattern analysis
   */
  private async analyzeWearPatterns(vehicleData: VehicleData): Promise<number> {
    // In production, this would use computer vision AI to analyze:
    // - Steering wheel wear
    // - Pedal wear
    // - Seat wear
    // - Interior button/switch wear
    // - Tire tread depth
    
    // Simulated wear score for now
    const vehicleAge = new Date().getFullYear() - vehicleData.year;
    const expectedWear = (vehicleData.odometer / 150000) * 100;
    const ageBasedWear = (vehicleAge / 15) * 100;
    
    return Math.max(expectedWear, ageBasedWear);
  }

  /**
   * Digital odometer tampering detection
   */
  private detectDigitalTampering(vehicleData: VehicleData): number {
    let score = 0;
    
    // Check for common digital tampering indicators
    // 1. Odometer reading is a round number (e.g., 50000, 75000)
    if (vehicleData.odometer % 10000 === 0 || vehicleData.odometer % 5000 === 0) {
      score += 20;
    }
    
    // 2. Odometer ends in repeating digits (e.g., 123333, 456666)
    const odometerStr = vehicleData.odometer.toString();
    const lastThree = odometerStr.slice(-3);
    if (lastThree[0] === lastThree[1] && lastThree[1] === lastThree[2]) {
      score += 15;
    }
    
    // 3. Check for common rollback target numbers
    const commonTargets = [25000, 50000, 75000, 100000, 125000, 150000];
    const tolerance = 500;
    for (const target of commonTargets) {
      if (Math.abs(vehicleData.odometer - target) < tolerance) {
        score += 25;
        break;
      }
    }
    
    return score;
  }

  /**
   * Frame damage detection using AI vision
   */
  private async detectFrameDamage(vehicleData: VehicleData): Promise<FraudAnalysis['frameDamage']> {
    // In production, this would use computer vision to detect:
    // - Uneven panel gaps
    // - Paint overspray
    // - Welding marks
    // - Frame rail damage
    // - Misaligned body panels
    
    const areas: string[] = [];
    let confidence = 0;
    
    // Check DTC codes for airbag deployment
    if (vehicleData.dtcCodes) {
      const airbagCodes = vehicleData.dtcCodes.filter(code => 
        code.startsWith('B') && (code.includes('00') || code.includes('01'))
      );
      if (airbagCodes.length > 0) {
        areas.push('Airbag system (possible deployment history)');
        confidence += 40;
      }
    }
    
    return {
      detected: confidence > 30,
      confidence,
      areas,
    };
  }

  /**
   * Flood damage detection
   */
  private async detectFloodDamage(vehicleData: VehicleData): Promise<FraudAnalysis['floodDamage']> {
    const indicators: string[] = [];
    let confidence = 0;
    
    // Check DTC codes for water-related issues
    if (vehicleData.dtcCodes) {
      const waterRelatedCodes = vehicleData.dtcCodes.filter(code => 
        code.includes('P0') && (
          code.includes('60') || // Fuel system
          code.includes('70') || // Transmission
          code.includes('A0')    // Electrical
        )
      );
      
      if (waterRelatedCodes.length > 3) {
        indicators.push('Multiple electrical system codes suggesting water damage');
        confidence += 35;
      }
    }
    
    // In production, would also check for:
    // - Musty smell indicators (via notes)
    // - Water stains in photos
    // - Rust in unusual places
    // - Moisture in lights
    // - Title history from flood-prone areas
    
    return {
      detected: confidence > 40,
      confidence,
      indicators,
    };
  }

  /**
   * Title issue detection
   */
  private async checkTitleIssues(vehicleData: VehicleData): Promise<FraudAnalysis['titleIssues']> {
    const issues: string[] = [];
    
    // In production, this would integrate with:
    // - NMVTIS (National Motor Vehicle Title Information System)
    // - Carfax/AutoCheck APIs
    // - State DMV databases
    
    // For now, return placeholder
    return {
      detected: false,
      issues,
    };
  }

  /**
   * Calculate overall fraud risk score
   */
  private calculateOverallRisk(analyses: {
    odometerAnalysis: FraudAnalysis['odometerFraud'];
    frameDamageAnalysis: FraudAnalysis['frameDamage'];
    floodAnalysis: FraudAnalysis['floodDamage'];
    titleAnalysis: FraudAnalysis['titleIssues'];
  }): number {
    const weights = {
      odometer: 0.4,
      frame: 0.3,
      flood: 0.2,
      title: 0.1,
    };
    
    const score = 
      (analyses.odometerAnalysis.detected ? analyses.odometerAnalysis.confidence : 0) * weights.odometer +
      (analyses.frameDamageAnalysis.detected ? analyses.frameDamageAnalysis.confidence : 0) * weights.frame +
      (analyses.floodAnalysis.detected ? analyses.floodAnalysis.confidence : 0) * weights.flood +
      (analyses.titleAnalysis.detected ? 80 : 0) * weights.title;
    
    return Math.round(score);
  }

  /**
   * Generate actionable recommendations
   */
  private generateRecommendations(data: any): string[] {
    const recommendations: string[] = [];
    
    if (data.overallRiskScore > 70) {
      recommendations.push('⚠️ HIGH RISK: Do not proceed with purchase without further investigation');
      recommendations.push('Request full vehicle history report (Carfax/AutoCheck)');
      recommendations.push('Have vehicle inspected by certified mechanic');
    } else if (data.overallRiskScore > 40) {
      recommendations.push('⚠️ MODERATE RISK: Proceed with caution');
      recommendations.push('Request service records and verify odometer history');
    } else {
      recommendations.push('✅ LOW RISK: No major fraud indicators detected');
    }
    
    if (data.odometerAnalysis.detected) {
      recommendations.push('Verify odometer reading with service records and previous owners');
      recommendations.push('Check for NMVTIS odometer discrepancy reports');
    }
    
    if (data.frameDamageAnalysis.detected) {
      recommendations.push('Have frame inspected by body shop or use frame measuring equipment');
      recommendations.push('Request accident history and repair records');
    }
    
    if (data.floodAnalysis.detected) {
      recommendations.push('Check for water damage in trunk, under carpets, and in door panels');
      recommendations.push('Verify title history for flood/salvage designations');
    }
    
    return recommendations;
  }
}

export const fraudDetectionService = new FraudDetectionService();
