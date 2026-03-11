import React, { useState } from 'react';
import { analyzeDTCCodes } from '../services/geminiService';
import { DTCCode } from '../types';
import { LoadingSpinner } from './LoadingSpinner';

export const OBDScanner: React.FC = () => {
    const [codes, setCodes] = useState<DTCCode[]>([{ code: '', description: '' }]);
    const [analysis, setAnalysis] = useState<string>('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isConnected, setIsConnected] = useState(false);
    const [bluetoothDevice, setBluetoothDevice] = useState<BluetoothDevice | null>(null);

    const handleCodeChange = (index: number, value: string) => {
        const newCodes = [...codes];
        newCodes[index].code = value.toUpperCase();
        setCodes(newCodes);
    };

    const addCodeField = () => {
        setCodes([...codes, { code: '', description: '' }]);
    };

    const removeCodeField = (index: number) => {
        const newCodes = codes.filter((_, i) => i !== index);
        setCodes(newCodes);
    };

    const handleConnectBluetooth = async () => {
        // Check if Web Bluetooth is supported
        if (!navigator.bluetooth) {
            setError('Web Bluetooth is not supported in this browser. Please use Chrome, Edge, or Opera on desktop/Android.');
            return;
        }

        setIsConnecting(true);
        setError(null);

        try {
            const device = await navigator.bluetooth.requestDevice({
                filters: [
                    { namePrefix: 'OBDLink' },
                    { namePrefix: 'Veepeak' },
                    { namePrefix: 'V011' },
                    { namePrefix: 'OBDII' },
                    { namePrefix: 'OBD2' },
                ],
                optionalServices: ['generic_access']
            });

            setBluetoothDevice(device);
            setIsConnected(true);
            setError(null);

            // Note: Full OBD-II communication requires specific services and characteristics
            // This is a simplified implementation showing connection capability
            alert(`Connected to ${device.name || 'OBD Scanner'}!\n\nNote: Automatic code reading requires the scanner's specific Bluetooth services. For now, you can use your scanner's app to read codes, then enter them here for AI analysis.`);

        } catch (err) {
            console.error('Bluetooth connection failed:', err);
            setError(err instanceof Error ? err.message : 'Failed to connect to OBD scanner');
            setIsConnected(false);
        } finally {
            setIsConnecting(false);
        }
    };

    const handleDisconnect = () => {
        if (bluetoothDevice?.gatt?.connected) {
            bluetoothDevice.gatt.disconnect();
        }
        setBluetoothDevice(null);
        setIsConnected(false);
    };

    const handleAnalyze = async () => {
        const validCodes = codes.filter(c => c.code.trim() !== '');
        if (validCodes.length === 0) {
            setError("Please enter at least one DTC code.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setAnalysis('');
        try {
            const result = await analyzeDTCCodes(validCodes);
            setAnalysis(result);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };
    
    // A simple markdown-to-html renderer
    const renderMarkdown = (text: string) => {
        const html = text
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/### (.*)/g, '<h3 class="text-lg font-semibold mt-4 mb-2">$1</h3>')
            .replace(/## (.*)/g, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
            .replace(/# (.*)/g, '<h1 class="text-2xl font-extrabold mt-8 mb-4">$1</h1>')
            .replace(/^- (.*)/gm, '<li>$1</li>')
            .replace(/(\d)\. /g, '<br/>$1. ')
            .replace(/\n/g, '<br />');

        return { __html: html.replace(/<br \/><li>/g, '<li>') };
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-dark-card p-6 rounded-lg border border-dark-border space-y-4 flex flex-col">
                <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-light-text">Enter DTC Codes</h3>
                    {!isConnected ? (
                        <button
                            onClick={handleConnectBluetooth}
                            disabled={isConnecting}
                            className="bg-dark-bg hover:bg-dark-border text-primary font-semibold py-1.5 px-3 rounded-lg border border-primary transition-colors disabled:opacity-50 flex items-center gap-2 text-sm"
                        >
                            {isConnecting ? (
                                <>
                                    <LoadingSpinner />
                                    Connecting...
                                </>
                            ) : (
                                <>
                                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                                    </svg>
                                    Connect OBD Scanner
                                </>
                            )}
                        </button>
                    ) : (
                        <button
                            onClick={handleDisconnect}
                            className="bg-green-900/30 hover:bg-red-900/30 text-green-400 hover:text-red-400 font-semibold py-1.5 px-3 rounded-lg border border-green-400 hover:border-red-400 transition-colors flex items-center gap-2 text-sm"
                        >
                            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                                <circle cx="10" cy="10" r="3" />
                            </svg>
                            Connected - Disconnect
                        </button>
                    )}
                </div>
                <div className="flex-grow space-y-2">
                    {codes.map((code, index) => (
                        <div key={index} className="flex items-center gap-2">
                            <input
                                type="text"
                                placeholder="e.g., P0300"
                                value={code.code}
                                onChange={(e) => handleCodeChange(index, e.target.value)}
                                className="flex-grow bg-dark-bg border border-dark-border rounded-md p-2 focus:ring-2 focus:ring-primary focus:border-primary transition text-light-text font-mono"
                            />
                            {codes.length > 1 && (
                                <button onClick={() => removeCodeField(index)} className="text-red-500 hover:text-red-400 p-1 rounded-full">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    ))}
                </div>
                <div className="flex justify-between items-center">
                    <button onClick={addCodeField} className="text-sm text-primary hover:text-primary-light">
                        + Add another code
                    </button>
                    <button 
                        onClick={handleAnalyze} 
                        disabled={isLoading}
                        className="bg-primary hover:bg-primary-light text-white font-bold py-2 px-6 rounded-lg transition-colors disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                        {isLoading ? <LoadingSpinner/> : "Analyze Codes"}
                    </button>
                </div>
            </div>
            <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
                <h3 className="text-lg font-semibold text-light-text mb-2">AI Analysis & Repair Plan</h3>
                {isLoading && (
                    <div className="flex justify-center items-center h-48">
                        <LoadingSpinner />
                    </div>
                )}
                {error && <p className="text-red-500">{error}</p>}
                {analysis ? (
                     <div className="prose prose-invert max-w-none text-light-text" dangerouslySetInnerHTML={renderMarkdown(analysis)} />
                ) : (
                    !isLoading && <p className="text-medium-text">Analysis results will appear here.</p>
                )}
            </div>
        </div>
    );
};