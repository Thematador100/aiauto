// services/vehicleExtraDataService.ts
import { SafetyRecall, TheftRecord } from '../types';

/**
 * Fetches open safety recalls for a given VIN from the NHTSA API.
 */
export const getSafetyRecalls = async (vin: string): Promise<SafetyRecall[]> => {
    console.log(`[VehicleExtraDataService] Fetching recalls for VIN: ${vin}`);
    try {
        const response = await fetch(`https://api.nhtsa.gov/recalls/recallsByVehicle?vin=${vin}`);
        if (!response.ok) {
            throw new Error(`NHTSA Recalls API responded with status: ${response.status}`);
        }
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            return data.results.map((recall: any) => ({
                component: recall.Component,
                summary: recall.Summary,
                consequence: recall.Conequence, // Typo is in the API
                remedy: recall.Remedy,
            }));
        }
        return [];
    } catch (error) {
        console.error('[VehicleExtraDataService] Error fetching recalls:', error);
        // Return empty array on failure so it doesn't block the report.
        return [];
    }
};

/**
 * Checks for theft and salvage records.
 * In a real application, this would call an API like the NICB's VINCheck.
 * Here, we'll mock the functionality.
 */
export const getTheftAndSalvageRecord = async (vin: string): Promise<TheftRecord> => {
    console.log(`[VehicleExtraDataService] Checking theft/salvage for VIN: ${vin}`);
    await new Promise(resolve => setTimeout(resolve, 700)); // Simulate network delay

    const lastChar = vin.slice(-1).toLowerCase();
    
    if (lastChar === 's') {
        return {
            isStolen: false,
            isSalvage: true,
            details: "This vehicle has been reported as a 'salvage vehicle' by an insurance company. This may be due to collision, flood, or other damage."
        };
    }
    if (lastChar === 't') {
        return {
            isStolen: true,
            isSalvage: false,
            details: "This vehicle has been reported as stolen and has not been recovered."
        };
    }

    return {
        isStolen: false,
        isSalvage: false,
        details: "No theft or salvage records were found for this VIN."
    };
};
