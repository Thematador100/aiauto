import React, { useState, useEffect } from 'react';
import { j1939Service, J1939FaultCode, HeavyDutyLiveData } from '../services/j1939Service';
import { LoadingSpinner } from './LoadingSpinner';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://auto.srv1171019.hstgr.cloud';

/**
 * Heavy-Duty Scanner for 18-wheelers / commercial trucks.
 * Uses SAE J1939 protocol via 9-pin Deutsch connector adapter.
 */
export const HeavyDutyScanner: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [deviceName, setDeviceName] = useState('');
  const [showSetupGuide, setShowSetupGuide] = useState(true);

  const [faults, setFaults] = useState<J1939FaultCode[]>([]);
  const [isReadingFaults, setIsReadingFaults] = useState(false);
  const [analysis, setAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [liveData, setLiveData] = useState<HeavyDutyLiveData | null>(null);
  const [isReadingLive, setIsReadingLive] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'faults' | 'live' | 'aftertreatment'>('faults');

  useEffect(() => {
    return () => {
      if (isConnected) j1939Service.disconnect();
    };
  }, [isConnected]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const device = await j1939Service.connect();
      setDeviceName(device.name);
      setIsConnected(true);
      setShowSetupGuide(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connection failed');
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await j1939Service.disconnect();
    setIsConnected(false);
    setDeviceName('');
    setFaults([]);
    setLiveData(null);
  };

  const handleReadFaults = async () => {
    setIsReadingFaults(true);
    setError(null);
    try {
      const activeFaults = await j1939Service.readFaultCodes();
      const prevFaults = await j1939Service.readPreviousFaults();

      const allFaults = [
        ...activeFaults,
        ...prevFaults.filter(p => !activeFaults.some(a => a.spn === p.spn && a.fmi === p.fmi))
      ];
      setFaults(allFaults);

      if (allFaults.length === 0) {
        setError('No active fault codes found - systems healthy');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read faults');
    } finally {
      setIsReadingFaults(false);
    }
  };

  const handleAnalyzeFaults = async () => {
    if (faults.length === 0) return;
    setIsAnalyzing(true);
    setError(null);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      const codesForApi = faults.map(f => ({
        code: `SPN ${f.spn} / FMI ${f.fmi}`,
        description: `${f.description} - ${f.fmiDescription} (${f.source}, severity: ${f.severity}, count: ${f.oc})`
      }));

      const response = await fetch(`${BACKEND_URL}/api/analyze-dtc`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: JSON.stringify({ codes: codesForApi, vehicleType: 'Commercial' }),
      });

      if (!response.ok) throw new Error('Analysis failed');
      const data = await response.json();
      setAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClearFaults = async () => {
    if (!confirm('Clear all active fault codes? This should only be done after repairs are verified.')) return;
    try {
      await j1939Service.clearFaultCodes();
      setFaults([]);
      setAnalysis('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear faults');
    }
  };

  const handleReadLiveData = async () => {
    setIsReadingLive(true);
    setError(null);
    try {
      const data = await j1939Service.readLiveData();
      setLiveData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read live data');
    } finally {
      setIsReadingLive(false);
    }
  };

  const renderMarkdown = (text: string) => {
    const html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/### (.*)/g, '<h3 class="text-lg font-semibold mt-4 mb-2 text-primary">$1</h3>')
      .replace(/## (.*)/g, '<h2 class="text-xl font-bold mt-6 mb-3 text-primary">$1</h2>')
      .replace(/^- (.*)/gm, '<li class="ml-4">$1</li>')
      .replace(/\n/g, '<br />');
    return { __html: html };
  };

  const severityColor = (s: string) =>
    s === 'critical' ? 'text-red-400 bg-red-900/30 border-red-700' :
    s === 'warning' ? 'text-yellow-400 bg-yellow-900/30 border-yellow-700' :
    'text-blue-400 bg-blue-900/30 border-blue-700';

  return (
    <div className="space-y-6">
      {/* Connector Setup Guide */}
      {showSetupGuide && !isConnected && (
        <div className="bg-gradient-to-br from-orange-900/30 to-red-900/20 p-6 rounded-lg border-2 border-orange-500">
          <div className="flex items-start gap-4">
            <div className="text-4xl">9&#x20DD;</div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-orange-300 mb-3">
                Heavy-Duty 9-Pin Connector Required
              </h3>
              <p className="text-medium-text mb-4">
                Commercial trucks use a <span className="text-light-text font-semibold">9-pin Deutsch connector (SAE J1939)</span> instead of the standard 16-pin OBD-II port found in passenger vehicles.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="bg-dark-bg rounded-lg p-4 border border-dark-border">
                  <h4 className="text-light-text font-semibold mb-2">Where to Find It</h4>
                  <ul className="text-sm text-medium-text space-y-1">
                    <li>Under the dash, driver side (most common)</li>
                    <li>Near the steering column, behind a panel</li>
                    <li>On the engine bulkhead (some Volvos)</li>
                    <li>Round connector, 9 pins in a circular pattern</li>
                  </ul>
                </div>
                <div className="bg-dark-bg rounded-lg p-4 border border-dark-border">
                  <h4 className="text-light-text font-semibold mb-2">Compatible Adapters</h4>
                  <ul className="text-sm text-medium-text space-y-1">
                    <li><span className="text-green-400">OBDLink MX+</span> - 9-to-16 pin cable needed</li>
                    <li><span className="text-green-400">Nexiq USB-Link 3</span> - Direct 9-pin</li>
                    <li><span className="text-green-400">DEARBORN DPA5</span> - Direct 9-pin</li>
                    <li><span className="text-green-400">ELM327 v2.1+</span> - 9-to-16 pin cable needed</li>
                  </ul>
                </div>
              </div>

              <div className="bg-yellow-900/30 border border-yellow-700 rounded-lg p-3 mb-4">
                <p className="text-yellow-300 text-sm font-semibold">
                  Need an adapter cable? A "9-pin to 16-pin OBD-II adapter cable" ($15-30) lets you use your existing OBDLink or ELM327 with the truck's 9-pin port.
                </p>
              </div>

              <button
                onClick={() => setShowSetupGuide(false)}
                className="text-sm text-orange-400 hover:text-orange-300 transition-colors"
              >
                Got it, hide this guide
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Connection Status */}
      <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-light-text mb-2">
              Heavy-Duty J1939 Scanner
            </h3>
            <p className="text-sm text-medium-text">
              {isConnected ? (
                <span className="text-green-400">Connected: <span className="font-semibold">{deviceName}</span> (J1939 Mode)</span>
              ) : (
                <span>Connect via 9-pin Deutsch adapter for commercial truck diagnostics</span>
              )}
            </p>
          </div>
          {!isConnected ? (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isConnecting ? <><LoadingSpinner /> Connecting...</> : 'Connect J1939'}
            </button>
          ) : (
            <button
              onClick={handleDisconnect}
              className="bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
            >
              Disconnect
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className={`p-4 rounded-lg border ${error.includes('healthy') ? 'bg-green-900/30 border-green-700 text-green-300' : 'bg-red-900/30 border-red-700 text-red-300'}`}>
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* Tabs */}
      {isConnected && (
        <>
          <div className="flex gap-2 border-b border-dark-border">
            <button
              onClick={() => setActiveTab('faults')}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeTab === 'faults' ? 'border-b-2 border-orange-500 text-orange-400' : 'text-medium-text hover:text-light-text'
              }`}
            >
              Fault Codes (SPN/FMI)
            </button>
            <button
              onClick={() => setActiveTab('live')}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeTab === 'live' ? 'border-b-2 border-orange-500 text-orange-400' : 'text-medium-text hover:text-light-text'
              }`}
            >
              Engine & Drivetrain
            </button>
            <button
              onClick={() => setActiveTab('aftertreatment')}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeTab === 'aftertreatment' ? 'border-b-2 border-orange-500 text-orange-400' : 'text-medium-text hover:text-light-text'
              }`}
            >
              DPF / DEF / Emissions
            </button>
          </div>

          {/* Fault Codes Tab */}
          {activeTab === 'faults' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
                <h3 className="text-lg font-bold text-light-text mb-4">J1939 Fault Codes</h3>
                <div className="space-y-4">
                  <button
                    onClick={handleReadFaults}
                    disabled={isReadingFaults}
                    className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isReadingFaults ? <LoadingSpinner /> : null} Read Fault Codes (DM1/DM2)
                  </button>

                  {faults.length > 0 && (
                    <>
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {faults.map((fault, i) => (
                          <div key={i} className={`p-3 rounded-lg border ${severityColor(fault.severity)}`}>
                            <div className="flex items-center justify-between mb-1">
                              <span className="font-mono font-bold text-sm">
                                SPN {fault.spn} / FMI {fault.fmi}
                              </span>
                              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                                fault.severity === 'critical' ? 'bg-red-600 text-white' :
                                fault.severity === 'warning' ? 'bg-yellow-600 text-black' :
                                'bg-blue-600 text-white'
                              }`}>
                                {fault.severity.toUpperCase()}
                              </span>
                            </div>
                            <div className="text-sm text-light-text font-semibold">{fault.description}</div>
                            <div className="text-xs text-medium-text mt-1">{fault.fmiDescription}</div>
                            <div className="text-xs text-medium-text mt-1">
                              Source: {fault.source} | Count: {fault.oc}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={handleAnalyzeFaults}
                          disabled={isAnalyzing}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {isAnalyzing ? <LoadingSpinner /> : null} AI Analysis (FMCSA)
                        </button>
                        <button
                          onClick={handleClearFaults}
                          className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                        >
                          Clear Codes
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
                <h3 className="text-lg font-bold text-light-text mb-4">AI Commercial Analysis</h3>
                {analysis ? (
                  <div className="prose prose-invert max-w-none text-light-text" dangerouslySetInnerHTML={renderMarkdown(analysis)} />
                ) : (
                  <div className="text-center py-8 text-medium-text">
                    <p>Read fault codes and click "AI Analysis" for FMCSA-aware diagnostics.</p>
                    <p className="text-sm mt-2">Identifies Out-of-Service conditions per FMCSR Part 396.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Engine & Drivetrain Tab */}
          {activeTab === 'live' && (
            <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-light-text">Engine & Drivetrain Data</h3>
                <button
                  onClick={handleReadLiveData}
                  disabled={isReadingLive}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isReadingLive ? <LoadingSpinner /> : null} Refresh
                </button>
              </div>
              {liveData ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {liveData.rpm !== undefined && <HDDataCard label="Engine RPM" value={Math.round(liveData.rpm)} unit="rpm" />}
                  {liveData.engineLoad !== undefined && <HDDataCard label="Engine Load" value={Math.round(liveData.engineLoad)} unit="%" />}
                  {liveData.vehicleSpeed !== undefined && <HDDataCard label="Vehicle Speed" value={Math.round(liveData.vehicleSpeed)} unit="km/h" />}
                  {liveData.coolantTemp !== undefined && <HDDataCard label="Coolant Temp" value={Math.round(liveData.coolantTemp)} unit="°C" warn={liveData.coolantTemp > 105} />}
                  {liveData.oilPressure !== undefined && <HDDataCard label="Oil Pressure" value={Math.round(liveData.oilPressure)} unit="kPa" warn={liveData.oilPressure < 100} />}
                  {liveData.boostPressure !== undefined && <HDDataCard label="Boost Pressure" value={Math.round(liveData.boostPressure)} unit="kPa" />}
                  {liveData.fuelRate !== undefined && <HDDataCard label="Fuel Rate" value={liveData.fuelRate.toFixed(1)} unit="L/hr" />}
                  {liveData.transTemp !== undefined && <HDDataCard label="Trans Temp" value={Math.round(liveData.transTemp)} unit="°C" warn={liveData.transTemp > 120} />}
                  {liveData.transGear !== undefined && <HDDataCard label="Gear" value={liveData.transGear} unit="" />}
                  {liveData.primaryAirPressure !== undefined && <HDDataCard label="Air Supply PSI" value={Math.round(liveData.primaryAirPressure * 0.145)} unit="PSI" warn={liveData.primaryAirPressure < 550} />}
                  {liveData.totalEngineHours !== undefined && <HDDataCard label="Engine Hours" value={Math.round(liveData.totalEngineHours)} unit="hrs" />}
                </div>
              ) : (
                <p className="text-medium-text text-center py-8">Click "Refresh" to read engine and drivetrain data via J1939.</p>
              )}
            </div>
          )}

          {/* Aftertreatment / Emissions Tab */}
          {activeTab === 'aftertreatment' && (
            <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-light-text">DPF / DEF / Emissions (EPA 2010+)</h3>
                  <p className="text-sm text-medium-text">Aftertreatment system monitoring for diesel emissions compliance</p>
                </div>
                <button
                  onClick={handleReadLiveData}
                  disabled={isReadingLive}
                  className="bg-orange-600 hover:bg-orange-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isReadingLive ? <LoadingSpinner /> : null} Refresh
                </button>
              </div>
              {liveData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {liveData.dpfSootLoad !== undefined && (
                    <HDDataCard label="DPF Soot Load" value={Math.round(liveData.dpfSootLoad)} unit="%" warn={liveData.dpfSootLoad > 80} />
                  )}
                  {liveData.dpfRegenStatus && (
                    <div className="bg-dark-bg p-4 rounded-lg border border-dark-border">
                      <p className="text-xs text-medium-text mb-1">DPF Regen Status</p>
                      <p className={`text-xl font-bold ${liveData.dpfRegenStatus === 'Active' ? 'text-yellow-400' : 'text-green-400'}`}>
                        {liveData.dpfRegenStatus}
                      </p>
                    </div>
                  )}
                  {liveData.defLevel !== undefined && (
                    <HDDataCard label="DEF Fluid Level" value={Math.round(liveData.defLevel)} unit="%" warn={liveData.defLevel < 15} />
                  )}
                  {liveData.defTemp !== undefined && (
                    <HDDataCard label="DEF Temperature" value={Math.round(liveData.defTemp)} unit="°C" />
                  )}
                  {liveData.exhaustTemp !== undefined && (
                    <HDDataCard label="Exhaust Temp" value={Math.round(liveData.exhaustTemp)} unit="°C" warn={liveData.exhaustTemp > 600} />
                  )}
                  {liveData.noxLevel !== undefined && (
                    <HDDataCard label="NOx Level" value={Math.round(liveData.noxLevel)} unit="ppm" warn={liveData.noxLevel > 200} />
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-medium-text">
                  <p>Click "Refresh" to read aftertreatment data.</p>
                  <p className="text-sm mt-2">Monitors DPF soot loading, DEF fluid level, and NOx emissions.</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

const HDDataCard: React.FC<{ label: string; value: string | number; unit: string; warn?: boolean }> = ({ label, value, unit, warn }) => (
  <div className={`bg-dark-bg p-4 rounded-lg border ${warn ? 'border-yellow-500' : 'border-dark-border'}`}>
    <p className="text-xs text-medium-text mb-1">{label}</p>
    <p className={`text-2xl font-bold ${warn ? 'text-yellow-400' : 'text-light-text'}`}>
      {value} <span className="text-sm text-medium-text">{unit}</span>
    </p>
    {warn && <p className="text-xs text-yellow-400 mt-1">Monitor</p>}
  </div>
);
