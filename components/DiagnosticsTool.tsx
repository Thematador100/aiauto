import React, { useState } from 'react';
import { OBDScanner } from './OBDScanner';
import { OBDScannerPro } from './OBDScannerPro';
import { WiFiOBDScanner } from './WiFiOBDScanner';
import { HeavyDutyScanner } from './HeavyDutyScanner';

type ScannerMode = 'bluetooth' | 'wifi' | 'manual' | 'heavyduty';

const CONNECTOR_GUIDE: Record<string, { mode: ScannerMode; connector: string; note: string }[]> = {
  Truck: [
    { mode: 'bluetooth', connector: '16-pin OBD-II (under dashboard)', note: 'Pickup trucks (F-150, RAM 1500/2500/3500, Silverado, Sierra, Tundra, Titan) use standard OBD-II. Use OBDLink MX+ via Bluetooth or WiFi.' },
  ],
  Standard: [
    { mode: 'bluetooth', connector: '16-pin OBD-II (under dashboard)', note: 'All cars 1996+ have OBD-II. Use Bluetooth or WiFi scanner.' },
  ],
  EV: [
    { mode: 'bluetooth', connector: '16-pin OBD-II (under dashboard)', note: 'EVs use standard OBD-II plus manufacturer-specific battery PIDs.' },
  ],
  Commercial: [
    { mode: 'heavyduty', connector: '9-pin Deutsch round connector (SAE J1939)', note: 'All Class 7-8 trucks (18-wheelers). Located on driver-side dash or under steering column.' },
  ],
  RV: [
    { mode: 'bluetooth', connector: '16-pin OBD-II', note: 'Class A/C motorhomes on gas/auto chassis (Ford, Chevy, RAM). Standard OBD-II port under dash.' },
    { mode: 'heavyduty', connector: '9-pin Deutsch (J1939)', note: 'Class A diesel pushers on commercial chassis (Freightliner, Spartan, Cummins). Use Heavy-Duty J1939 mode.' },
    { mode: 'manual', connector: 'No engine connector', note: 'Travel trailers & fifth wheels have NO engine. Use Manual Entry for DTC codes from tow vehicle, and inspect RV habitability systems separately.' },
  ],
  Classic: [
    { mode: 'bluetooth', connector: '16-pin OBD-II', note: 'Vehicles 1996+ have OBD-II. Use Bluetooth or WiFi scanner.' },
    { mode: 'manual', connector: 'No OBD port (pre-1996)', note: 'Pre-1996 classics have no OBD-II. Use Manual Entry to log issues found during physical inspection.' },
  ],
  Motorcycle: [
    { mode: 'bluetooth', connector: '16-pin OBD-II (if equipped)', note: 'Most 2010+ motorcycles have OBD-II. Check near the seat or under a panel.' },
    { mode: 'manual', connector: 'No OBD port', note: 'Older or smaller motorcycles may lack OBD-II. Use Manual Entry.' },
  ],
};

export const DiagnosticsTool: React.FC<{ vehicleType?: string }> = ({ vehicleType }) => {
    const [scannerMode, setScannerMode] = useState<ScannerMode>('bluetooth');
    const [showGuide, setShowGuide] = useState(true);

    const guide = vehicleType ? CONNECTOR_GUIDE[vehicleType] || CONNECTOR_GUIDE.Standard : null;

    return (
        <div className="space-y-6">
            <div className="bg-dark-card p-4 rounded-lg border border-dark-border">
                <h2 className="text-2xl font-semibold text-light-text">Professional Diagnostic Tools</h2>
                <p className="text-medium-text mt-1">
                    Connect your OBDLink MX+ Bluetooth scanner for professional diagnostics with EV battery health monitoring, or use WiFi (iOS) or manual entry. For commercial trucks, use the J1939 Heavy-Duty mode.
                </p>

                {/* Vehicle-Specific Connector Guide */}
                {guide && showGuide && (
                  <div className="mt-4 bg-dark-bg border border-blue-500/40 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-bold text-blue-400">
                        Connector Guide: {vehicleType}
                      </h3>
                      <button
                        onClick={() => setShowGuide(false)}
                        className="text-medium-text hover:text-light-text text-xs"
                      >
                        Dismiss
                      </button>
                    </div>
                    <div className="space-y-2">
                      {guide.map((entry, i) => (
                        <button
                          key={i}
                          onClick={() => setScannerMode(entry.mode)}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            scannerMode === entry.mode
                              ? 'border-blue-500 bg-blue-900/20'
                              : 'border-dark-border hover:border-blue-500/50'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-600/30 text-blue-300">
                              {entry.connector}
                            </span>
                            <span className="text-xs text-medium-text">
                              ({entry.mode === 'bluetooth' ? 'Bluetooth' : entry.mode === 'heavyduty' ? 'Heavy-Duty J1939' : entry.mode === 'wifi' ? 'WiFi' : 'Manual'})
                            </span>
                          </div>
                          <p className="text-xs text-medium-text mt-1">{entry.note}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Mode Selector */}
                <div className="flex gap-4 mt-4 flex-wrap">
                    <button
                        onClick={() => setScannerMode('bluetooth')}
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                            scannerMode === 'bluetooth'
                                ? 'bg-gradient-to-r from-primary to-purple-600 text-white'
                                : 'bg-dark-bg text-medium-text hover:text-light-text'
                        }`}
                    >
                        <span>Pro Bluetooth</span>
                        <span className="text-xs bg-yellow-500 text-black px-2 py-0.5 rounded-full font-bold">EV+</span>
                    </button>
                    <button
                        onClick={() => setScannerMode('heavyduty')}
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors flex items-center gap-2 ${
                            scannerMode === 'heavyduty'
                                ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white'
                                : 'bg-dark-bg text-medium-text hover:text-light-text'
                        }`}
                    >
                        <span>Heavy-Duty J1939</span>
                        <span className="text-xs bg-orange-500 text-white px-2 py-0.5 rounded-full font-bold">CDL</span>
                    </button>
                    <button
                        onClick={() => setScannerMode('wifi')}
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                            scannerMode === 'wifi'
                                ? 'bg-primary text-white'
                                : 'bg-dark-bg text-medium-text hover:text-light-text'
                        }`}
                    >
                        WiFi Scanner (iOS)
                    </button>
                    <button
                        onClick={() => setScannerMode('manual')}
                        className={`px-4 py-2 rounded-lg font-semibold transition-colors ${
                            scannerMode === 'manual'
                                ? 'bg-primary text-white'
                                : 'bg-dark-bg text-medium-text hover:text-light-text'
                        }`}
                    >
                        Manual Entry
                    </button>
                </div>
            </div>

            {scannerMode === 'bluetooth' && <OBDScannerPro />}
            {scannerMode === 'heavyduty' && <HeavyDutyScanner />}
            {scannerMode === 'wifi' && <WiFiOBDScanner />}
            {scannerMode === 'manual' && <OBDScanner />}

        </div>
    );
};
