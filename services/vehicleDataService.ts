// This service is responsible for fetching structured vehicle data from a dedicated API.
// Using a specialized API is more reliable for VIN decoding than a general LLM.

import { VehicleData } from '../types';
import { NHTSA_VEHICLE_TYPE_MAP, VEHICLE_INSPECTION_TEMPLATES } from '../constants';

export interface DecodedVehicle extends VehicleData {
  suggestedVehicleType: keyof typeof VEHICLE_INSPECTION_TEMPLATES;
  bodyClass?: string;
  fuelType?: string;
  driveType?: string;
  engineCylinders?: string;
  gvwr?: string;
}

// Live implementation using the free NHTSA vPIC API.
export const getVehicleDataByVIN = async (vin: string): Promise<DecodedVehicle> => {
  console.log(`[VehicleDataService] Decoding VIN via NHTSA API: ${vin}`);
  
  try {
    const response = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/${vin}?format=json`);
    if (!response.ok) {
      throw new Error(`NHTSA API responded with status: ${response.status}`);
    }
    
    const data = await response.json();
    const results = data.Results;
    
    const getValue = (variable: string): string | null => {
      const item = results.find((i: { Variable: string; Value: string | null; }) => i.Variable === variable);
      return item?.Value || null;
    };

    const make = getValue('Make');
    const model = getValue('Model');
    const year = getValue('Model Year');

    if (!make || !model || !year) {
      console.error("NHTSA API response missing key fields:", results);
      throw new Error('VIN decoded, but essential data (Make, Model, Year) was not found.');
    }

    // Extract additional fields for vehicle type detection
    const nhtsaVehicleType = getValue('Vehicle Type') || '';
    const bodyClass = getValue('Body Class') || '';
    const fuelType = getValue('Fuel Type - Primary') || '';
    const driveType = getValue('Drive Type') || '';
    const engineCylinders = getValue('Engine Number of Cylinders') || '';
    const gvwr = getValue('Gross Vehicle Weight Rating From') || '';
    const electrification = getValue('Electrification Level') || '';

    // --- Smart Vehicle Type Detection ---
    let suggestedVehicleType: keyof typeof VEHICLE_INSPECTION_TEMPLATES = 'Standard';

    // Check for EV first (highest priority override)
    const isEV = fuelType.toLowerCase().includes('electric') ||
                 electrification.toLowerCase().includes('bev') ||
                 electrification.toLowerCase().includes('phev') ||
                 model.toLowerCase().includes('model s') ||
                 model.toLowerCase().includes('model 3') ||
                 model.toLowerCase().includes('model x') ||
                 model.toLowerCase().includes('model y') ||
                 model.toLowerCase().includes('ioniq') ||
                 model.toLowerCase().includes('bolt');

    if (isEV) {
      suggestedVehicleType = 'EV';
    } else if (nhtsaVehicleType === 'Motorcycle') {
      suggestedVehicleType = 'Motorcycle';
    } else if (nhtsaVehicleType === 'Bus' || bodyClass.toLowerCase().includes('bus')) {
      suggestedVehicleType = 'Commercial';
    } else if (nhtsaVehicleType === 'Trailer' || bodyClass.toLowerCase().includes('trailer')) {
      suggestedVehicleType = 'RV';
    } else if (nhtsaVehicleType in NHTSA_VEHICLE_TYPE_MAP) {
      // Use the NHTSA map for standard types
      const mapped = NHTSA_VEHICLE_TYPE_MAP[nhtsaVehicleType];
      
      // Refine: If it's a "Truck" — check GVWR to distinguish pickup (Truck) from 18-wheeler (Commercial)
      if (mapped === 'Truck') {
        // GVWR > 26,000 lbs = Class 7-8 commercial truck
        const gvwrNum = parseInt(gvwr.replace(/[^0-9]/g, '')) || 0;
        if (gvwrNum > 26000 || bodyClass.toLowerCase().includes('tractor') || bodyClass.toLowerCase().includes('semi')) {
          suggestedVehicleType = 'Commercial';
        } else {
          suggestedVehicleType = 'Truck';
        }
      } else {
        suggestedVehicleType = mapped;
      }
    } else {
      // Fallback: use body class to guess
      const bodyLower = bodyClass.toLowerCase();
      if (bodyLower.includes('pickup') || bodyLower.includes('truck')) {
        suggestedVehicleType = 'Truck';
      } else if (bodyLower.includes('motor home') || bodyLower.includes('rv') || bodyLower.includes('recreational')) {
        suggestedVehicleType = 'RV';
      } else if (bodyLower.includes('tractor') || bodyLower.includes('semi') || bodyLower.includes('cab-over')) {
        suggestedVehicleType = 'Commercial';
      } else if (bodyLower.includes('motorcycle') || bodyLower.includes('moped')) {
        suggestedVehicleType = 'Motorcycle';
      } else {
        suggestedVehicleType = 'Standard';
      }
    }

    console.log(`[VehicleDataService] VIN decoded: ${year} ${make} ${model} | NHTSA Type: "${nhtsaVehicleType}" | Body: "${bodyClass}" | Suggested: ${suggestedVehicleType}`);

    return {
      make,
      model,
      year,
      suggestedVehicleType,
      bodyClass: bodyClass || undefined,
      fuelType: fuelType || undefined,
      driveType: driveType || undefined,
      engineCylinders: engineCylinders || undefined,
      gvwr: gvwr || undefined,
    };

  } catch (error) {
    console.error('[VehicleDataService] Error fetching from NHTSA API:', error);
    throw new Error('Could not decode VIN. The service may be unavailable or the VIN is invalid.');
  }
};
