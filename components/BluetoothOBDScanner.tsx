import React, { useState } from 'react';
import { DTCCode } from '../types';
import { analyzeDTCCodes } from '../services/geminiService';
import { LoadingSpinner } from './LoadingSpinner';

/**
 * Real Bluetooth OBD2 Scanner Component
 *
 * Platform Support:
 * ✅ Chrome/Edge on Windows (Desktop)
 * ✅ Chrome/Edge on Mac (Desktop)
 * ✅ Chrome on Android
 * ❌ iOS/Safari (Apple blocks Web Bluetooth)
 * ❌ Firefox (no Web Bluetooth support)
 *
 * Hardware Required:
 * - ELM327 Bluetooth OBD2 Adapter ($15-30 on Amazon)
 * - Must support Bluetooth Low Energy (BLE) or Classic Bluetooth
 */

interface OBD2Device {
  device: BluetoothDevice;
  characteristic?: BluetoothRemoteGATTCharacteristic;
}

export const BluetoothOBDScanner: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [obdDevice, setObdDevice] = useState<OBD2Device | null>(null);
  const [dtcCodes, setDtcCodes] = useState<DTCCode[]>([]);
  const [analysis, setAnalysis] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<string[]>([]);

  // Check if Web Bluetooth is supported
  const isBluetoothSupported = () => {
    if (!navigator.bluetooth) {
      return false;
    }
    return true;
  };

  const addLog = (message: string) => {
    setLog(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
    console.log(message);
  };

  // Connect to OBD2 adapter via Bluetooth
  const connectToOBD = async () => {
    if (!isBluetoothSupported()) {
      setError('Web Bluetooth is not supported in this browser. Use Chrome, Edge, or Brave on Windows/Mac/Android.');
      return;
    }

    setError(null);
    addLog('Requesting Bluetooth device...');

    try {
      // Request Bluetooth device (ELM327 or generic OBD2 adapter)
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'OBD' },
          { namePrefix: 'ELM327' },
          { namePrefix: 'OBDII' },
          { namePrefix: 'V-Link' },
          { namePrefix: 'KONNWEI' }
        ],
        optionalServices: ['0000fff0-0000-1000-8000-00805f9b34fb'] // Common OBD2 service UUID
      });

      addLog(`Found device: ${device.name}`);

      // Connect to GATT server
      addLog('Connecting to GATT server...');
      const server = await device.gatt?.connect();

      if (!server) {
        throw new Error('Failed to connect to GATT server');
      }

      addLog('Getting OBD2 service...');
      const service = await server.getPrimaryService('0000fff0-0000-1000-8000-00805f9b34fb');

      addLog('Getting characteristic...');
      const characteristic = await service.getCharacteristic('0000fff2-0000-1000-8000-00805f9b34fb');

      setObdDevice({ device, characteristic });
      setIsConnected(true);
      addLog('✅ Connected to OBD2 adapter!');

      // Initialize ELM327
      await sendCommand(characteristic, 'ATZ\r'); // Reset
      await sendCommand(characteristic, 'ATE0\r'); // Echo off
      await sendCommand(characteristic, 'ATL0\r'); // Linefeeds off
      await sendCommand(characteristic, 'ATS0\r'); // Spaces off
      await sendCommand(characteristic, 'ATH1\r'); // Headers on
      await sendCommand(characteristic, 'ATSP0\r'); // Auto protocol

      addLog('✅ OBD2 adapter initialized');

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Connection failed: ${errorMessage}`);
      addLog(`❌ Error: ${errorMessage}`);
      setIsConnected(false);
    }
  };

  // Send command to OBD2 adapter
  const sendCommand = async (characteristic: BluetoothRemoteGATTCharacteristic, command: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(command);

    await characteristic.writeValue(data);
    await new Promise(resolve => setTimeout(resolve, 100)); // Wait for response

    const response = await characteristic.readValue();
    const decoder = new TextDecoder();
    return decoder.decode(response);
  };

  // Scan for DTC codes
  const scanDTCCodes = async () => {
    if (!obdDevice || !obdDevice.characteristic) {
      setError('Not connected to OBD2 adapter');
      return;
    }

    setIsScanning(true);
    setError(null);
    setDtcCodes([]);
    addLog('Starting DTC scan...');

    try {
      // Request stored DTCs (Mode 03)
      addLog('Requesting stored DTC codes...');
      const response = await sendCommand(obdDevice.characteristic, '03\r');

      addLog(`Raw response: ${response}`);

      // Parse DTC codes from response
      const codes = parseDTCCodes(response);

      if (codes.length === 0) {
        addLog('✅ No DTC codes found - vehicle is healthy!');
        setDtcCodes([]);
      } else {
        addLog(`✅ Found ${codes.length} DTC code(s)`);
        setDtcCodes(codes);

        // Automatically analyze the codes
        addLog('Analyzing codes with AI...');
        const result = await analyzeDTCCodes(codes);
        setAnalysis(result);
        addLog('✅ Analysis complete');
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Scan failed: ${errorMessage}`);
      addLog(`❌ Scan error: ${errorMessage}`);
    } finally {
      setIsScanning(false);
    }
  };

  // Parse DTC codes from OBD2 response
  const parseDTCCodes = (response: string): DTCCode[] => {
    const codes: DTCCode[] = [];

    // Remove whitespace and split into hex bytes
    const cleaned = response.replace(/\s+/g, '');

    // DTC format: Each code is 2 bytes (4 hex chars)
    // First byte: high nibble = prefix (P/C/B/U), low nibble + second byte = number
    for (let i = 0; i < cleaned.length - 3; i += 4) {
      const byte1 = parseInt(cleaned.substr(i, 2), 16);
      const byte2 = parseInt(cleaned.substr(i + 2, 2), 16);

      if (byte1 === 0 && byte2 === 0) continue; // Skip empty codes

      // Determine prefix
      const prefixMap = ['P', 'C', 'B', 'U'];
      const prefix = prefixMap[(byte1 >> 6) & 0x03];

      // Build code
      const digit1 = (byte1 >> 4) & 0x03;
      const digit2 = byte1 & 0x0F;
      const digit3 = (byte2 >> 4) & 0x0F;
      const digit4 = byte2 & 0x0F;

      const code = `${prefix}${digit1}${digit2}${digit3}${digit4}`;
      codes.push({ code, description: '' });
    }

    return codes;
  };

  // Clear DTC codes
  const clearDTCCodes = async () => {
    if (!obdDevice || !obdDevice.characteristic) {
      setError('Not connected to OBD2 adapter');
      return;
    }

    if (!window.confirm('Are you sure you want to clear all DTC codes? This will turn off the check engine light.')) {
      return;
    }

    try {
      addLog('Clearing DTC codes...');
      await sendCommand(obdDevice.characteristic, '04\r'); // Mode 04: Clear codes
      addLog('✅ DTC codes cleared');
      setDtcCodes([]);
      setAnalysis('');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Clear failed: ${errorMessage}`);
      addLog(`❌ Clear error: ${errorMessage}`);
    }
  };

  // Disconnect from OBD2 adapter
  const disconnect = () => {
    if (obdDevice?.device) {
      obdDevice.device.gatt?.disconnect();
      setObdDevice(null);
      setIsConnected(false);
      setDtcCodes([]);
      setAnalysis('');
      addLog('Disconnected from OBD2 adapter');
    }
  };

  // Render markdown analysis
  const renderMarkdown = (text: string) => {
    const html = text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/### (.*)/g, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
      .replace(/## (.*)/g, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
      .replace(/# (.*)/g, '<h1 class="text-2xl font-extrabold mt-8 mb-4">$1</h1>')
      .replace(/^- (.*)/gm, '<li>$1</li>')
      .replace(/\n/g, '<br />');
    return { __html: html };
  };

  return (
    <div className="space-y-6">
      {/* Browser Compatibility Warning */}
      {!isBluetoothSupported() && (
        <div className="bg-red-900 border border-red-500 p-4 rounded-lg">
          <h3 className="text-lg font-bold text-white mb-2">⚠️ Web Bluetooth Not Supported</h3>
          <p className="text-red-100">
            Your browser doesn't support Web Bluetooth. Please use:
          </p>
          <ul className="text-red-100 mt-2 space-y-1">
            <li>✅ Chrome on Windows/Mac/Android</li>
            <li>✅ Edge on Windows/Mac</li>
            <li>✅ Brave on Windows/Mac/Android</li>
            <li>❌ Safari/iOS (not supported)</li>
            <li>❌ Firefox (not supported)</li>
          </ul>
        </div>
      )}

      {/* Connection Panel */}
      <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
        <h3 className="text-xl font-semibold text-light-text mb-4">📱 Bluetooth OBD2 Scanner</h3>

        <div className="space-y-4">
          {!isConnected ? (
            <>
              <p className="text-medium-text">
                Connect a Bluetooth OBD2 adapter (ELM327) to your vehicle's OBD2 port and click Connect.
              </p>
              <button
                onClick={connectToOBD}
                disabled={!isBluetoothSupported()}
                className="bg-primary hover:bg-primary-light text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed"
              >
                🔗 Connect to OBD2 Adapter
              </button>
            </>
          ) : (
            <>
              <p className="text-green-400 flex items-center gap-2">
                <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></span>
                Connected to {obdDevice?.device.name}
              </p>

              <div className="flex gap-3">
                <button
                  onClick={scanDTCCodes}
                  disabled={isScanning}
                  className="bg-primary hover:bg-primary-light text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isScanning ? <LoadingSpinner /> : '🔍'} Scan DTC Codes
                </button>

                {dtcCodes.length > 0 && (
                  <button
                    onClick={clearDTCCodes}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                  >
                    🧹 Clear Codes
                  </button>
                )}

                <button
                  onClick={disconnect}
                  className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  ❌ Disconnect
                </button>
              </div>
            </>
          )}

          {error && (
            <div className="bg-red-900 border border-red-500 p-3 rounded-lg text-red-100">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* DTC Codes Display */}
      {dtcCodes.length > 0 && (
        <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
          <h3 className="text-lg font-semibold text-light-text mb-4">Found DTC Codes</h3>
          <div className="space-y-2">
            {dtcCodes.map((code, index) => (
              <div key={index} className="bg-dark-bg p-3 rounded border border-dark-border">
                <span className="font-mono text-lg text-red-400">{code.code}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Analysis */}
      {analysis && (
        <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
          <h3 className="text-lg font-semibold text-light-text mb-4">🤖 AI Analysis & Repair Plan</h3>
          <div className="prose prose-invert max-w-none text-light-text" dangerouslySetInnerHTML={renderMarkdown(analysis)} />
        </div>
      )}

      {/* Debug Log */}
      {log.length > 0 && (
        <div className="bg-dark-card p-4 rounded-lg border border-dark-border">
          <h4 className="text-sm font-semibold text-medium-text mb-2">Connection Log</h4>
          <div className="bg-dark-bg p-3 rounded font-mono text-xs text-medium-text space-y-1 max-h-48 overflow-y-auto">
            {log.map((line, i) => (
              <div key={i}>{line}</div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
