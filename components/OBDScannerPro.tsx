import React, { useState, useEffect } from 'react';
import { obdBluetoothService, LiveData, EVBatteryData } from '../services/obdBluetoothService';
import { analyzeDTCCodes } from '../services/geminiService';
import { DTCCode } from '../types';
import { LoadingSpinner } from './LoadingSpinner';

export const OBDScannerPro: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [deviceName, setDeviceName] = useState<string>('');

  const [dtcCodes, setDtcCodes] = useState<string[]>([]);
  const [isReadingDTCs, setIsReadingDTCs] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [evBatteryData, setEvBatteryData] = useState<EVBatteryData | null>(null);
  const [isReadingLive, setIsReadingLive] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'dtc' | 'live' | 'ev'>('dtc');

  useEffect(() => {
    return () => {
      if (isConnected) {
        obdBluetoothService.disconnect();
      }
    };
  }, [isConnected]);

  const handleConnect = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const device = await obdBluetoothService.connect();
      setDeviceName(device.device.name || 'OBD Adapter');
      setIsConnected(true);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to connect');
      setIsConnected(false);
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    await obdBluetoothService.disconnect();
    setIsConnected(false);
    setDeviceName('');
    setDtcCodes([]);
    setLiveData(null);
    setEvBatteryData(null);
  };

  const handleReadDTCs = async () => {
    setIsReadingDTCs(true);
    setError(null);

    try {
      const codes = await obdBluetoothService.readDTCs();
      setDtcCodes(codes);

      if (codes.length === 0) {
        setError('No trouble codes found - vehicle is healthy! ✅');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read DTCs');
    } finally {
      setIsReadingDTCs(false);
    }
  };

  const handleAnalyzeDTCs = async () => {
    if (dtcCodes.length === 0) {
      setError('No codes to analyze');
      return;
    }

    setIsAnalyzing(true);
    setError(null);

    try {
      const dtcObjects: DTCCode[] = dtcCodes.map(code => ({ code, description: '' }));
      const result = await analyzeDTCCodes(dtcObjects);
      setAnalysis(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to analyze codes');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClearDTCs = async () => {
    if (!confirm('Are you sure you want to clear all DTCs? This will reset the check engine light.')) {
      return;
    }

    try {
      await obdBluetoothService.clearDTCs();
      setDtcCodes([]);
      setAnalysis('');
      alert('✅ DTCs cleared successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to clear DTCs');
    }
  };

  const handleReadLiveData = async () => {
    setIsReadingLive(true);
    setError(null);

    try {
      const data = await obdBluetoothService.readLiveData();
      setLiveData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read live data');
    } finally {
      setIsReadingLive(false);
    }
  };

  const handleReadEVData = async () => {
    setIsReadingLive(true);
    setError(null);

    try {
      const data = await obdBluetoothService.readEVBatteryData();
      if (data) {
        setEvBatteryData(data);
      } else {
        setError('No EV battery data available. This vehicle may not be an EV/Hybrid, or the manufacturer uses proprietary protocols.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to read EV data');
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

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-xl font-bold text-light-text mb-2">🔌 Professional OBD-II Scanner</h3>
            <p className="text-sm text-medium-text">
              {isConnected ? (
                <span className="text-green-400">✅ Connected to: <span className="font-semibold">{deviceName}</span></span>
              ) : (
                <span>Connect your OBDLink MX+ or compatible Bluetooth OBD adapter</span>
              )}
            </p>
          </div>

          {!isConnected ? (
            <button
              onClick={handleConnect}
              disabled={isConnecting}
              className="bg-primary hover:bg-primary-light text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              {isConnecting ? (
                <>
                  <LoadingSpinner />
                  Connecting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                  </svg>
                  Connect Scanner
                </>
              )}
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

      {/* Error Display */}
      {error && (
        <div className={`p-4 rounded-lg border ${error.includes('✅') ? 'bg-green-900/30 border-green-700 text-green-300' : 'bg-red-900/30 border-red-700 text-red-300'}`}>
          <p className="font-semibold">{error}</p>
        </div>
      )}

      {/* Tabs - Only show when connected */}
      {isConnected && (
        <>
          <div className="flex gap-2 border-b border-dark-border">
            <button
              onClick={() => setActiveTab('dtc')}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeTab === 'dtc'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-medium-text hover:text-light-text'
              }`}
            >
              🚨 Diagnostic Codes
            </button>
            <button
              onClick={() => setActiveTab('live')}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeTab === 'live'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-medium-text hover:text-light-text'
              }`}
            >
              📊 Live Data
            </button>
            <button
              onClick={() => setActiveTab('ev')}
              className={`px-4 py-2 font-semibold transition-colors ${
                activeTab === 'ev'
                  ? 'border-b-2 border-primary text-primary'
                  : 'text-medium-text hover:text-light-text'
              }`}
            >
              🔋 EV Battery (Premium)
            </button>
          </div>

          {/* DTC Tab */}
          {activeTab === 'dtc' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
                <h3 className="text-lg font-bold text-light-text mb-4">Diagnostic Trouble Codes</h3>

                <div className="space-y-4">
                  <button
                    onClick={handleReadDTCs}
                    disabled={isReadingDTCs}
                    className="w-full bg-primary hover:bg-primary-light text-white font-bold py-3 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isReadingDTCs ? <LoadingSpinner /> : '🔍'} Read DTCs from Vehicle
                  </button>

                  {dtcCodes.length > 0 && (
                    <>
                      <div className="bg-dark-bg p-4 rounded-lg border border-dark-border">
                        <p className="text-sm font-semibold text-light-text mb-2">Found {dtcCodes.length} code(s):</p>
                        <div className="space-y-1">
                          {dtcCodes.map((code, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <span className="font-mono text-primary font-bold">{code}</span>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={handleAnalyzeDTCs}
                          disabled={isAnalyzing}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
                        >
                          {isAnalyzing ? <LoadingSpinner /> : '🤖 AI Analysis'}
                        </button>
                        <button
                          onClick={handleClearDTCs}
                          className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                        >
                          🗑️ Clear Codes
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
                <h3 className="text-lg font-bold text-light-text mb-4">AI-Powered Analysis</h3>
                {analysis ? (
                  <div className="prose prose-invert max-w-none text-light-text" dangerouslySetInnerHTML={renderMarkdown(analysis)} />
                ) : (
                  <p className="text-medium-text">Analysis will appear here after reading and analyzing codes.</p>
                )}
              </div>
            </div>
          )}

          {/* Live Data Tab */}
          {activeTab === 'live' && (
            <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold text-light-text">Real-Time Vehicle Data</h3>
                <button
                  onClick={handleReadLiveData}
                  disabled={isReadingLive}
                  className="bg-primary hover:bg-primary-light text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {isReadingLive ? <LoadingSpinner /> : '🔄'} Refresh Data
                </button>
              </div>

              {liveData ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {liveData.rpm !== undefined && (
                    <DataCard label="Engine RPM" value={`${Math.round(liveData.rpm)}`} unit="rpm" />
                  )}
                  {liveData.speed !== undefined && (
                    <DataCard label="Speed" value={`${Math.round(liveData.speed)}`} unit="mph" />
                  )}
                  {liveData.coolantTemp !== undefined && (
                    <DataCard label="Coolant Temp" value={`${Math.round(liveData.coolantTemp)}`} unit="°C" />
                  )}
                  {liveData.engineLoad !== undefined && (
                    <DataCard label="Engine Load" value={`${Math.round(liveData.engineLoad)}`} unit="%" />
                  )}
                  {liveData.throttlePosition !== undefined && (
                    <DataCard label="Throttle" value={`${Math.round(liveData.throttlePosition)}`} unit="%" />
                  )}
                  {liveData.fuelPressure !== undefined && (
                    <DataCard label="Fuel Pressure" value={`${Math.round(liveData.fuelPressure)}`} unit="kPa" />
                  )}
                </div>
              ) : (
                <p className="text-medium-text">Click "Refresh Data" to read live vehicle parameters.</p>
              )}
            </div>
          )}

          {/* EV Battery Tab - Premium Feature! */}
          {activeTab === 'ev' && (
            <div className="bg-gradient-to-br from-primary/20 to-purple-900/20 p-6 rounded-lg border-2 border-primary">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-bold text-light-text flex items-center gap-2">
                    <span className="text-2xl">⚡</span> EV Battery Health
                    <span className="text-xs bg-yellow-600 text-white px-2 py-1 rounded-full">PREMIUM</span>
                  </h3>
                  <p className="text-sm text-medium-text mt-1">Requires OBDLink MX+ or compatible pro scanner</p>
                </div>
                <button
                  onClick={handleReadEVData}
                  disabled={isReadingLive}
                  className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white font-bold py-2 px-4 rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isReadingLive ? <LoadingSpinner /> : '🔋'} Read Battery Data
                </button>
              </div>

              {evBatteryData ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <EVDataCard
                    label="State of Charge"
                    value={`${Math.round(evBatteryData.stateOfCharge)}`}
                    unit="%"
                    icon="🔋"
                    good={evBatteryData.stateOfCharge > 20}
                  />
                  <EVDataCard
                    label="State of Health"
                    value={`${Math.round(evBatteryData.stateOfHealth)}`}
                    unit="%"
                    icon="💚"
                    good={evBatteryData.stateOfHealth > 80}
                  />
                  <EVDataCard
                    label="Battery Voltage"
                    value={`${evBatteryData.batteryVoltage.toFixed(1)}`}
                    unit="V"
                    icon="⚡"
                  />
                  <EVDataCard
                    label="Battery Current"
                    value={`${evBatteryData.batteryCurrent.toFixed(1)}`}
                    unit="A"
                    icon="🔌"
                  />
                  <EVDataCard
                    label="Battery Temp"
                    value={`${Math.round(evBatteryData.batteryTemperature)}`}
                    unit="°C"
                    icon="🌡️"
                    good={evBatteryData.batteryTemperature < 45}
                  />
                </div>
              ) : (
                <div className="text-center py-12">
                  <p className="text-2xl mb-4">🚗⚡</p>
                  <p className="text-light-text font-semibold mb-2">EV Battery Diagnostics Ready</p>
                  <p className="text-medium-text text-sm">
                    Click "Read Battery Data" to analyze EV/Hybrid battery health.<br />
                    Your OBDLink MX+ will access manufacturer-specific battery parameters.
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {/* Feature Highlight - Show when not connected */}
      {!isConnected && (
        <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/30 p-6 rounded-lg border border-primary">
          <h3 className="text-xl font-bold text-light-text mb-4">✨ Professional Features</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FeatureCard
              icon="🚨"
              title="Auto-Read DTCs"
              description="Instantly pull diagnostic codes from vehicle computer"
            />
            <FeatureCard
              icon="📊"
              title="Live Data Stream"
              description="Monitor real-time engine and sensor parameters"
            />
            <FeatureCard
              icon="🔋"
              title="EV Battery Health"
              description="State of Health, voltage, temp, and degradation analysis"
              premium
            />
          </div>
        </div>
      )}
    </div>
  );
};

const DataCard: React.FC<{ label: string; value: string; unit: string }> = ({ label, value, unit }) => (
  <div className="bg-dark-bg p-4 rounded-lg border border-dark-border">
    <p className="text-xs text-medium-text mb-1">{label}</p>
    <p className="text-2xl font-bold text-light-text">
      {value} <span className="text-sm text-medium-text">{unit}</span>
    </p>
  </div>
);

const EVDataCard: React.FC<{ label: string; value: string; unit: string; icon: string; good?: boolean }> = ({
  label, value, unit, icon, good
}) => (
  <div className={`bg-dark-bg p-4 rounded-lg border-2 ${good === undefined ? 'border-dark-border' : good ? 'border-green-500' : 'border-yellow-500'}`}>
    <p className="text-xs text-medium-text mb-1 flex items-center gap-1">
      <span>{icon}</span> {label}
    </p>
    <p className="text-3xl font-bold text-light-text">
      {value} <span className="text-sm text-medium-text">{unit}</span>
    </p>
    {good !== undefined && (
      <p className={`text-xs mt-1 ${good ? 'text-green-400' : 'text-yellow-400'}`}>
        {good ? '✅ Good' : '⚠️ Monitor'}
      </p>
    )}
  </div>
);

const FeatureCard: React.FC<{ icon: string; title: string; description: string; premium?: boolean }> = ({
  icon, title, description, premium
}) => (
  <div className="bg-dark-card p-4 rounded-lg border border-dark-border">
    <div className="text-3xl mb-2">{icon}</div>
    <h4 className="font-bold text-light-text mb-1 flex items-center gap-2">
      {title}
      {premium && <span className="text-xs bg-yellow-600 text-white px-2 py-0.5 rounded-full">PRO</span>}
    </h4>
    <p className="text-sm text-medium-text">{description}</p>
  </div>
);
