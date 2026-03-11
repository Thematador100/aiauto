/**
 * Professional OBD-II Bluetooth Service
 * Optimized for OBDLink MX+ with enhanced EV support
 */

export interface OBDDevice {
  device: BluetoothDevice;
  server: BluetoothRemoteGATTServer | null;
  characteristic: BluetoothRemoteGATTCharacteristic | null;
}

export interface EVBatteryData {
  stateOfCharge: number; // %
  stateOfHealth: number; // %
  batteryVoltage: number; // V
  batteryCurrent: number; // A
  batteryTemperature: number; // °C
  estimatedRange: number; // miles
}

export interface LiveData {
  rpm?: number;
  speed?: number;
  coolantTemp?: number;
  engineLoad?: number;
  fuelPressure?: number;
  intakeTemp?: number;
  maf?: number; // Mass Air Flow
  throttlePosition?: number;

  // EV-specific
  evBattery?: EVBatteryData;
  motorTemp?: number;
  inverterTemp?: number;
  dcDcConverterTemp?: number;
}

class OBDBluetoothService {
  private device: OBDDevice | null = null;
  private isInitialized = false;
  private responseBuffer = '';

  /**
   * Connect to OBDLink MX+ or compatible OBD-II Bluetooth adapter
   */
  async connect(): Promise<OBDDevice> {
    try {
      // Request Bluetooth device
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'OBDLink' },
          { namePrefix: 'Veepeak' },
          { namePrefix: 'V011' },
          { namePrefix: 'OBDII' },
          { namePrefix: 'OBD2' },
          { namePrefix: 'ELM327' },
        ],
        optionalServices: [
          '0000fff0-0000-1000-8000-00805f9b34fb', // OBDLink service
          '0000ffe0-0000-1000-8000-00805f9b34fb', // Common OBD service
        ]
      });

      console.log('🔌 Connecting to:', device.name);

      const server = await device.gatt?.connect();
      if (!server) {
        throw new Error('Failed to connect to GATT server');
      }

      // Try to get the service
      let service;
      try {
        service = await server.getPrimaryService('0000fff0-0000-1000-8000-00805f9b34fb');
      } catch {
        service = await server.getPrimaryService('0000ffe0-0000-1000-8000-00805f9b34fb');
      }

      // Get characteristic for reading/writing
      const characteristic = await service.getCharacteristic('0000fff1-0000-1000-8000-00805f9b34fb')
        .catch(() => service.getCharacteristic('0000ffe1-0000-1000-8000-00805f9b34fb'));

      // Start notifications
      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', (event) => {
        const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
        if (value) {
          const text = new TextDecoder().decode(value);
          this.responseBuffer += text;
        }
      });

      this.device = { device, server, characteristic };

      // Initialize ELM327
      await this.initialize();

      console.log('✅ Connected to OBD adapter');
      return this.device;
    } catch (error) {
      console.error('❌ Connection failed:', error);
      throw new Error(`Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Initialize ELM327 chip
   */
  private async initialize(): Promise<void> {
    if (!this.device) throw new Error('Not connected');

    try {
      await this.sendCommand('ATZ'); // Reset
      await this.wait(1000);
      await this.sendCommand('ATE0'); // Echo off
      await this.sendCommand('ATL0'); // Line feeds off
      await this.sendCommand('ATS0'); // Spaces off
      await this.sendCommand('ATH1'); // Headers on (for advanced diagnostics)
      await this.sendCommand('ATSP0'); // Auto protocol detection

      this.isInitialized = true;
      console.log('✅ OBD adapter initialized');
    } catch (error) {
      throw new Error(`Initialization failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Send OBD-II command
   */
  private async sendCommand(command: string): Promise<string> {
    if (!this.device?.characteristic) {
      throw new Error('Not connected to OBD adapter');
    }

    this.responseBuffer = '';

    const encoder = new TextEncoder();
    const data = encoder.encode(command + '\r');

    await this.device.characteristic.writeValue(data);

    // Wait for response
    await this.wait(300);

    return this.responseBuffer.trim();
  }

  /**
   * Read Diagnostic Trouble Codes (DTCs)
   */
  async readDTCs(): Promise<string[]> {
    if (!this.isInitialized) {
      throw new Error('OBD adapter not initialized');
    }

    try {
      // Mode 03: Request stored DTCs
      const response = await this.sendCommand('03');

      return this.parseDTCs(response);
    } catch (error) {
      throw new Error(`Failed to read DTCs: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse DTC codes from OBD response
   */
  private parseDTCs(response: string): string[] {
    const codes: string[] = [];
    const hex = response.replace(/\s/g, '');

    // Parse pairs of bytes into DTC codes
    for (let i = 0; i < hex.length; i += 4) {
      const byte1 = parseInt(hex.substr(i, 2), 16);
      const byte2 = parseInt(hex.substr(i + 2, 2), 16);

      if (byte1 === 0 && byte2 === 0) continue;

      const prefixMap: Record<number, string> = { 0: 'P', 1: 'C', 2: 'B', 3: 'U' };
      const prefix = prefixMap[byte1 >> 6] || 'P';
      const code = prefix + ((byte1 & 0x3F) << 8 | byte2).toString(16).toUpperCase().padStart(4, '0');

      codes.push(code);
    }

    return codes;
  }

  /**
   * Clear DTCs
   */
  async clearDTCs(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error('OBD adapter not initialized');
    }

    await this.sendCommand('04'); // Mode 04: Clear DTCs
    console.log('✅ DTCs cleared');
  }

  /**
   * Read live data - Generic vehicle parameters
   */
  async readLiveData(): Promise<LiveData> {
    const data: LiveData = {};

    try {
      // Mode 01: Current data
      const responses = await Promise.all([
        this.sendCommand('010C').catch(() => null), // RPM
        this.sendCommand('010D').catch(() => null), // Speed
        this.sendCommand('0105').catch(() => null), // Coolant temp
        this.sendCommand('0104').catch(() => null), // Engine load
        this.sendCommand('010A').catch(() => null), // Fuel pressure
        this.sendCommand('010F').catch(() => null), // Intake temp
        this.sendCommand('0110').catch(() => null), // MAF
        this.sendCommand('0111').catch(() => null), // Throttle
      ]);

      // Parse responses
      if (responses[0]) data.rpm = this.parseValue(responses[0], 256) / 4;
      if (responses[1]) data.speed = this.parseValue(responses[1]);
      if (responses[2]) data.coolantTemp = this.parseValue(responses[2]) - 40;
      if (responses[3]) data.engineLoad = this.parseValue(responses[3]) * 100 / 255;
      if (responses[4]) data.fuelPressure = this.parseValue(responses[4]) * 3;
      if (responses[5]) data.intakeTemp = this.parseValue(responses[5]) - 40;
      if (responses[6]) data.maf = this.parseValue(responses[6], 256) / 100;
      if (responses[7]) data.throttlePosition = this.parseValue(responses[7]) * 100 / 255;

    } catch (error) {
      console.error('Error reading live data:', error);
    }

    return data;
  }

  /**
   * Read EV-specific battery data (OBDLink MX+ advantage!)
   */
  async readEVBatteryData(): Promise<EVBatteryData | null> {
    try {
      // These PIDs may vary by manufacturer
      // OBDLink MX+ supports manufacturer-specific codes
      const responses = await Promise.all([
        this.sendCommand('015B').catch(() => null), // Hybrid battery SoC
        this.sendCommand('220101').catch(() => null), // EV Battery SoH (Toyota)
        this.sendCommand('220102').catch(() => null), // Battery Voltage (Toyota)
        this.sendCommand('220105').catch(() => null), // Battery Current (Toyota)
        this.sendCommand('220106').catch(() => null), // Battery Temp (Toyota)
      ]);

      if (!responses.some(r => r !== null)) {
        return null; // No EV data available
      }

      return {
        stateOfCharge: responses[0] ? this.parseValue(responses[0]) * 100 / 255 : 0,
        stateOfHealth: responses[1] ? this.parseValue(responses[1], 256) / 100 : 100,
        batteryVoltage: responses[2] ? this.parseValue(responses[2], 256) / 10 : 0,
        batteryCurrent: responses[3] ? (this.parseValue(responses[3], 256) - 1000) / 10 : 0,
        batteryTemperature: responses[4] ? this.parseValue(responses[4]) - 40 : 0,
        estimatedRange: 0, // Calculated from SoC and battery capacity
      };
    } catch (error) {
      console.error('Error reading EV data:', error);
      return null;
    }
  }

  /**
   * Parse OBD response value
   */
  private parseValue(response: string, multiplier: number = 1): number {
    const hex = response.replace(/\s/g, '').replace(/[^0-9A-F]/gi, '');
    const bytes = hex.match(/.{1,2}/g) || [];

    if (bytes.length < 2) return 0;

    const dataBytes = bytes.slice(2); // Skip mode and PID

    if (dataBytes.length === 1) {
      return parseInt(dataBytes[0], 16);
    } else if (dataBytes.length >= 2) {
      return parseInt(dataBytes[0], 16) * multiplier + parseInt(dataBytes[1], 16);
    }

    return 0;
  }

  /**
   * Disconnect from OBD adapter
   */
  async disconnect(): Promise<void> {
    if (this.device?.server?.connected) {
      this.device.server.disconnect();
    }
    this.device = null;
    this.isInitialized = false;
    console.log('🔌 Disconnected from OBD adapter');
  }

  /**
   * Check if connected
   */
  isConnected(): boolean {
    return this.device?.server?.connected || false;
  }

  /**
   * Wait helper
   */
  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const obdBluetoothService = new OBDBluetoothService();
