// components/VINScanner.tsx
import React, { useState, useCallback } from 'react';
import { validateVIN } from '../services/vinValidator';
import { getVehicleDataByVIN, DecodedVehicle } from '../services/vehicleDataService';
import { VEHICLE_INSPECTION_TEMPLATES } from '../constants';
import { LoadingSpinner } from './LoadingSpinner';

interface VINScannerProps {
  onVinDecoded: (vehicle: DecodedVehicle & { vin: string }) => void;
  vin: string;
  setVin: (vin: string) => void;
}

const VEHICLE_TYPE_LABELS: Record<string, string> = {
  Standard: 'Standard (Car / SUV)',
  Truck: 'Truck (Pickup / Light-Duty)',
  EV: 'Electric Vehicle (EV)',
  Commercial: 'Commercial / 18-Wheeler',
  RV: 'RV / Motorhome / Travel Trailer',
  Classic: 'Classic / Vintage / Collector',
  Motorcycle: 'Motorcycle',
};

const VEHICLE_TYPE_ICONS: Record<string, string> = {
  Standard: '🚗',
  Truck: '🛻',
  EV: '⚡',
  Commercial: '🚛',
  RV: '🏕️',
  Classic: '🏎️',
  Motorcycle: '🏍️',
};

export const VINScanner: React.FC<VINScannerProps> = ({ onVinDecoded, vin, setVin }) => {
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [decoded, setDecoded] = useState<(DecodedVehicle & { vin: string }) | null>(null);

  const handleDecode = useCallback(async () => {
    setError(null);
    setDecoded(null);
    const validation = validateVIN(vin);
    if (!validation.isValid) {
      setError(validation.message);
      return;
    }

    setIsLoading(true);
    try {
      const vehicleData = await getVehicleDataByVIN(vin);
      const fullVehicle = { ...vehicleData, vin };
      setDecoded(fullVehicle);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [vin]);

  const handleConfirm = () => {
    if (decoded) {
      onVinDecoded(decoded);
    }
  };

  return (
    <div className="bg-dark-card p-6 rounded-lg border border-dark-border space-y-4">
      <div>
        <h2 className="text-xl font-semibold text-light-text mb-1">VIN Lookup</h2>
        <p className="text-medium-text text-sm">
          Enter the 17-digit VIN to auto-populate vehicle details and select the correct inspection template.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="Enter VIN (e.g. 1HGBH41JXMN109186)"
          value={vin}
          onChange={(e) => {
            setVin(e.target.value.toUpperCase());
            setDecoded(null);
            setError(null);
          }}
          className="flex-grow bg-dark-bg border border-dark-border rounded-md p-2 focus:ring-2 focus:ring-primary focus:border-primary transition text-light-text font-mono tracking-widest"
          maxLength={17}
        />
        <button
          onClick={handleDecode}
          disabled={isLoading || vin.length !== 17}
          className="bg-primary hover:bg-primary-light text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2 whitespace-nowrap"
        >
          {isLoading ? <LoadingSpinner /> : 'Decode VIN'}
        </button>
      </div>

      {error && (
        <p className="text-red-400 text-sm bg-red-900/20 border border-red-700/40 rounded p-2">{error}</p>
      )}

      {decoded && (
        <div className="bg-dark-bg border border-primary/40 rounded-lg p-4 space-y-3">
          {/* Vehicle Summary */}
          <div className="flex items-center gap-3">
            <span className="text-3xl">{VEHICLE_TYPE_ICONS[decoded.suggestedVehicleType] || '🚗'}</span>
            <div>
              <p className="text-light-text font-bold text-lg">
                {decoded.year} {decoded.make} {decoded.model}
              </p>
              <p className="text-medium-text text-sm font-mono">{decoded.vin}</p>
            </div>
          </div>

          {/* Decoded Details Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
            {decoded.bodyClass && (
              <div className="bg-dark-card rounded p-2">
                <p className="text-medium-text text-xs">Body Style</p>
                <p className="text-light-text font-medium">{decoded.bodyClass}</p>
              </div>
            )}
            {decoded.fuelType && (
              <div className="bg-dark-card rounded p-2">
                <p className="text-medium-text text-xs">Fuel Type</p>
                <p className="text-light-text font-medium">{decoded.fuelType}</p>
              </div>
            )}
            {decoded.driveType && (
              <div className="bg-dark-card rounded p-2">
                <p className="text-medium-text text-xs">Drive Type</p>
                <p className="text-light-text font-medium">{decoded.driveType}</p>
              </div>
            )}
            {decoded.engineCylinders && (
              <div className="bg-dark-card rounded p-2">
                <p className="text-medium-text text-xs">Engine</p>
                <p className="text-light-text font-medium">{decoded.engineCylinders}-Cylinder</p>
              </div>
            )}
            {decoded.gvwr && (
              <div className="bg-dark-card rounded p-2">
                <p className="text-medium-text text-xs">GVWR</p>
                <p className="text-light-text font-medium">{decoded.gvwr}</p>
              </div>
            )}
          </div>

          {/* Auto-detected Vehicle Type */}
          <div className="bg-primary/10 border border-primary/30 rounded-lg p-3">
            <p className="text-primary text-xs font-bold uppercase tracking-wide mb-1">
              Auto-Detected Inspection Template
            </p>
            <p className="text-light-text font-semibold">
              {VEHICLE_TYPE_ICONS[decoded.suggestedVehicleType]}{' '}
              {VEHICLE_TYPE_LABELS[decoded.suggestedVehicleType] || decoded.suggestedVehicleType}
            </p>
            <p className="text-medium-text text-xs mt-1">
              You can change this below if needed.
            </p>
          </div>

          <button
            onClick={handleConfirm}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-6 rounded-lg transition-colors"
          >
            ✓ Confirm Vehicle &amp; Start Inspection
          </button>
        </div>
      )}
    </div>
  );
};
