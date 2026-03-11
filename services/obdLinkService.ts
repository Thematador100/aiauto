// OBDLink MX+ Bluetooth Service
// Supports OBDLink MX+ (MX201) via Web Bluetooth API

export interface OBDData {
  codes: string[];
  liveData: {
    rpm: number;
    speed: number;
    coolantTemp: number;
    engineLoad: number;
    throttlePosition: number;
    fuelLevel: number;
    odometerReading?: number;
  };
  freezeFrame: any[];
  readinessMonitors: {
    misfire: boolean;
    fuelSystem: boolean;
    components: boolean;
    catalyst: boolean;
    evaporative: boolean;
    secondaryAir: boolean;
    acRefrigerant: boolean;
    oxygenSensor: boolean;
    oxygenSensorHeater: boolean;
    egrSystem: boolean;
  };
}

class OBDLinkService {
  private device: BluetoothDevice | null = null;
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private connected: boolean = false;

  // OBDLink MX+ specific UUIDs
  private readonly SERVICE_UUID = '0000fff0-0000-1000-8000-00805f9b34fb';
  private readonly CHARACTERISTIC_UUID = '0000fff1-0000-1000-8000-00805f9b34fb';

  async connect(): Promise<boolean> {
    try {
      console.log('Requesting Bluetooth Device...');
      
      // Request OBDLink MX+ device
      this.device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'OBDLink' },
          { namePrefix: 'MX+' },
          { services: [this.SERVICE_UUID] }
        ],
        optionalServices: [this.SERVICE_UUID]
      });

      console.log('Connecting to GATT Server...');
      const server = await this.device.gatt!.connect();

      console.log('Getting Service...');
      const service = await server.getPrimaryService(this.SERVICE_UUID);

      console.log('Getting Characteristic...');
      this.characteristic = await service.getCharacteristic(this.CHARACTERISTIC_UUID);

      this.connected = true;
      console.log('OBDLink MX+ Connected Successfully!');

      // Initialize OBD connection
      await this.sendCommand('ATZ'); // Reset
      await this.delay(1000);
      await this.sendCommand('ATE0'); // Echo off
      await this.sendCommand('ATL0'); // Linefeeds off
      await this.sendCommand('ATSP0'); // Auto protocol

      return true;
    } catch (error) {
      console.error('Bluetooth connection failed:', error);
      this.connected = false;
      throw new Error(`Failed to connect to OBDLink MX+: ${error}`);
    }
  }

  async disconnect(): Promise<void> {
    if (this.device && this.device.gatt!.connected) {
      await this.device.gatt!.disconnect();
      this.connected = false;
      console.log('OBDLink MX+ Disconnected');
    }
  }

  isConnected(): boolean {
    return this.connected && this.device?.gatt?.connected || false;
  }

  private async sendCommand(command: string): Promise<string> {
    if (!this.characteristic) {
      throw new Error('Not connected to OBDLink MX+');
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(command + '\r');
    
    await this.characteristic.writeValue(data);
    await this.delay(100);

    const response = await this.characteristic.readValue();
    const decoder = new TextDecoder();
    return decoder.decode(response);
  }

  async readDTCCodes(): Promise<string[]> {
    try {
      const response = await this.sendCommand('03'); // Request DTCs
      const codes = this.parseDTCCodes(response);
      return codes;
    } catch (error) {
      console.error('Failed to read DTC codes:', error);
      return [];
    }
  }

  async getLiveData(): Promise<OBDData['liveData']> {
    try {
      const [rpm, speed, coolant, load, throttle, fuel] = await Promise.all([
        this.getPID('010C'), // RPM
        this.getPID('010D'), // Speed
        this.getPID('0105'), // Coolant temp
        this.getPID('0104'), // Engine load
        this.getPID('0111'), // Throttle position
        this.getPID('012F'), // Fuel level
      ]);

      return {
        rpm: this.parseRPM(rpm),
        speed: this.parseSpeed(speed),
        coolantTemp: this.parseCoolantTemp(coolant),
        engineLoad: this.parseEngineLoad(load),
        throttlePosition: this.parseThrottlePosition(throttle),
        fuelLevel: this.parseFuelLevel(fuel),
      };
    } catch (error) {
      console.error('Failed to get live data:', error);
      throw error;
    }
  }

  async getOdometerReading(): Promise<number | null> {
    try {
      // Try Mode 01 PID A6 (Odometer) - not all vehicles support this
      const response = await this.sendCommand('01A6');
      if (response.includes('NO DATA') || response.includes('?')) {
        return null;
      }
      return this.parseOdometer(response);
    } catch (error) {
      console.log('Odometer reading not available via OBD');
      return null;
    }
  }

  async getReadinessMonitors(): Promise<OBDData['readinessMonitors']> {
    try {
      const response = await this.sendCommand('0101'); // Mode 01 PID 01
      return this.parseReadinessMonitors(response);
    } catch (error) {
      console.error('Failed to get readiness monitors:', error);
      throw error;
    }
  }

  async getFreezeFrameData(): Promise<any[]> {
    try {
      const response = await this.sendCommand('02'); // Mode 02
      return this.parseFreezeFrame(response);
    } catch (error) {
      console.error('Failed to get freeze frame data:', error);
      return [];
    }
  }

  async clearDTCCodes(): Promise<boolean> {
    try {
      await this.sendCommand('04'); // Clear DTCs
      return true;
    } catch (error) {
      console.error('Failed to clear DTC codes:', error);
      return false;
    }
  }

  private async getPID(pid: string): Promise<string> {
    return await this.sendCommand(pid);
  }

  private parseDTCCodes(response: string): string[] {
    const codes: string[] = [];
    const lines = response.split('\r').filter(line => line.trim());
    
    for (const line of lines) {
      const matches = line.match(/[0-9A-F]{4}/g);
      if (matches) {
        matches.forEach(code => {
          const dtc = this.hexToDTC(code);
          if (dtc) codes.push(dtc);
        });
      }
    }
    
    return codes;
  }

  private hexToDTC(hex: string): string | null {
    const firstChar = parseInt(hex[0], 16);
    const prefix = ['P', 'C', 'B', 'U'][Math.floor(firstChar / 4)];
    const secondChar = firstChar % 4;
    const remaining = hex.substring(1);
    
    return `${prefix}${secondChar}${remaining}`;
  }

  private parseRPM(response: string): number {
    const hex = response.replace(/\s/g, '').match(/41\s*0C\s*([0-9A-F]{2})\s*([0-9A-F]{2})/i);
    if (!hex) return 0;
    return (parseInt(hex[1], 16) * 256 + parseInt(hex[2], 16)) / 4;
  }

  private parseSpeed(response: string): number {
    const hex = response.replace(/\s/g, '').match(/41\s*0D\s*([0-9A-F]{2})/i);
    if (!hex) return 0;
    return parseInt(hex[1], 16);
  }

  private parseCoolantTemp(response: string): number {
    const hex = response.replace(/\s/g, '').match(/41\s*05\s*([0-9A-F]{2})/i);
    if (!hex) return 0;
    return parseInt(hex[1], 16) - 40; // Celsius
  }

  private parseEngineLoad(response: string): number {
    const hex = response.replace(/\s/g, '').match(/41\s*04\s*([0-9A-F]{2})/i);
    if (!hex) return 0;
    return (parseInt(hex[1], 16) * 100) / 255;
  }

  private parseThrottlePosition(response: string): number {
    const hex = response.replace(/\s/g, '').match(/41\s*11\s*([0-9A-F]{2})/i);
    if (!hex) return 0;
    return (parseInt(hex[1], 16) * 100) / 255;
  }

  private parseFuelLevel(response: string): number {
    const hex = response.replace(/\s/g, '').match(/41\s*2F\s*([0-9A-F]{2})/i);
    if (!hex) return 0;
    return (parseInt(hex[1], 16) * 100) / 255;
  }

  private parseOdometer(response: string): number {
    const hex = response.replace(/\s/g, '').match(/41\s*A6\s*([0-9A-F]{2})\s*([0-9A-F]{2})\s*([0-9A-F]{2})\s*([0-9A-F]{2})/i);
    if (!hex) return 0;
    return (parseInt(hex[1], 16) * 16777216 + 
            parseInt(hex[2], 16) * 65536 + 
            parseInt(hex[3], 16) * 256 + 
            parseInt(hex[4], 16)) / 10; // km
  }

  private parseReadinessMonitors(response: string): OBDData['readinessMonitors'] {
    // Simplified readiness monitor parsing
    // In production, this would parse the full bit flags
    return {
      misfire: true,
      fuelSystem: true,
      components: true,
      catalyst: true,
      evaporative: true,
      secondaryAir: true,
      acRefrigerant: true,
      oxygenSensor: true,
      oxygenSensorHeater: true,
      egrSystem: true,
    };
  }

  private parseFreezeFrame(response: string): any[] {
    // Freeze frame parsing - simplified
    return [];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const obdLinkService = new OBDLinkService();
