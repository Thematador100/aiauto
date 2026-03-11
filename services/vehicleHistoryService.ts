// services/vehicleHistoryService.ts
import { VehicleHistoryReport } from '../types';

// This is a mock vehicle history service. In a real application, this would
// make an HTTP request to an API like CarFax or AutoCheck.

/**
 * Fetches a mock vehicle history report based on the VIN.
 * @param vin The Vehicle Identification Number.
 * @returns A promise that resolves to a VehicleHistoryReport.
 */
export const getVehicleHistory = async (vin: string): Promise<VehicleHistoryReport> => {
  console.log(`[VehicleHistoryService] Fetching history for VIN: ${vin}`);
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1200));

  // Generate mock data based on VIN characters to make it deterministic
  const lastDigit = parseInt(vin.slice(-1), 16) % 10; // Use last digit for variability

  if (lastDigit < 2) { // ~20% chance of major issues
    return {
      ownerCount: 3,
      hasAccident: true,
      accidentDetails: "Severe front-end collision reported in 2020. Structural damage reported.",
      lastOdometerReading: "95,430 miles",
      titleIssues: "Salvage Title",
    };
  }

  if (lastDigit < 5) { // ~30% chance of minor issues
    return {
      ownerCount: 2,
      hasAccident: true,
      accidentDetails: "Minor rear-end collision in 2021. No airbag deployment.",
      lastOdometerReading: "78,100 miles",
      titleIssues: null,
    };
  }

  // ~50% chance of a clean report
  return {
    ownerCount: 1,
    hasAccident: false,
    accidentDetails: null,
    lastOdometerReading: "62,500 miles",
    titleIssues: null,
  };
};
