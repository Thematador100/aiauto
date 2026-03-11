/**
 * SAE J1939 Heavy-Duty Truck Diagnostic Service
 *
 * Commercial trucks (Class 6-8, 18-wheelers) use J1939 CAN protocol
 * instead of standard OBD-II. This service handles:
 * - 9-pin Deutsch connector adapters (via ELM327 J1939 mode)
 * - SPN/FMI fault code format (not P/C/B/U codes)
 * - Heavy-duty live data (boost, DPF, DEF, trans temp, etc.)
 *
 * Compatible adapters:
 * - OBDLink MX+ (supports J1939 via AT commands)
 * - Nexiq USB-Link 3 (via WiFi bridge)
 * - DEARBORN DPA5 (via Bluetooth)
 * - Any ELM327 v2.1+ with J1939 support
 */

// ── Types ───────────────────────────────────────────────────────────

export interface J1939FaultCode {
  spn: number;        // Suspect Parameter Number (0-524287)
  fmi: number;        // Failure Mode Identifier (0-31)
  oc: number;         // Occurrence Count
  source: string;     // Source address name (Engine, Transmission, ABS, etc.)
  description: string;
  fmiDescription: string;
  severity: 'critical' | 'warning' | 'info';
}

export interface HeavyDutyLiveData {
  // Engine
  rpm?: number;
  engineLoad?: number;           // %
  coolantTemp?: number;          // °C
  oilPressure?: number;          // kPa
  oilTemp?: number;              // °C
  boostPressure?: number;        // kPa
  exhaustTemp?: number;          // °C
  fuelRate?: number;             // L/hr

  // Aftertreatment (emissions)
  dpfSootLoad?: number;          // %
  dpfRegenStatus?: string;       // Active / Passive / Inhibited
  defLevel?: number;             // % (Diesel Exhaust Fluid / AdBlue)
  defTemp?: number;              // °C
  noxLevel?: number;             // ppm

  // Transmission
  transTemp?: number;            // °C
  transGear?: number;            // Current gear
  outputShaftSpeed?: number;     // RPM

  // Vehicle
  vehicleSpeed?: number;         // km/h
  odometer?: number;             // km
  totalFuelUsed?: number;        // L
  totalEngineHours?: number;     // hrs

  // Air System
  primaryAirPressure?: number;   // kPa (supply tank)
  secondaryAirPressure?: number; // kPa (secondary tank)
  parkBrakeStatus?: string;      // Applied / Released
  absActive?: boolean;
}

// ── SPN/FMI Lookup Database ─────────────────────────────────────────
// Most common SPNs seen on Class 8 trucks (Cummins, Detroit, PACCAR, Volvo, CAT)

const SPN_DATABASE: Record<number, { name: string; unit: string; system: string }> = {
  // Engine
  84:   { name: 'Vehicle Speed', unit: 'km/h', system: 'Vehicle' },
  91:   { name: 'Accelerator Pedal Position', unit: '%', system: 'Engine' },
  92:   { name: 'Engine Load', unit: '%', system: 'Engine' },
  100:  { name: 'Engine Oil Pressure', unit: 'kPa', system: 'Engine' },
  102:  { name: 'Boost Pressure', unit: 'kPa', system: 'Engine' },
  105:  { name: 'Intake Manifold Temperature', unit: '°C', system: 'Engine' },
  108:  { name: 'Barometric Pressure', unit: 'kPa', system: 'Engine' },
  110:  { name: 'Engine Coolant Temperature', unit: '°C', system: 'Engine' },
  157:  { name: 'Fuel Rail Pressure', unit: 'kPa', system: 'Fuel' },
  158:  { name: 'Battery Voltage', unit: 'V', system: 'Electrical' },
  168:  { name: 'Battery Potential', unit: 'V', system: 'Electrical' },
  171:  { name: 'Ambient Air Temperature', unit: '°C', system: 'Engine' },
  174:  { name: 'Fuel Temperature', unit: '°C', system: 'Fuel' },
  175:  { name: 'Engine Oil Temperature', unit: '°C', system: 'Engine' },
  183:  { name: 'Fuel Rate', unit: 'L/hr', system: 'Fuel' },
  190:  { name: 'Engine Speed (RPM)', unit: 'rpm', system: 'Engine' },
  235:  { name: 'Total Engine Hours', unit: 'hr', system: 'Vehicle' },
  245:  { name: 'Total Vehicle Distance', unit: 'km', system: 'Vehicle' },
  247:  { name: 'Total Engine Fuel Used', unit: 'L', system: 'Vehicle' },

  // Transmission
  161:  { name: 'Transmission Input Shaft Speed', unit: 'rpm', system: 'Transmission' },
  162:  { name: 'Transmission Output Shaft Speed', unit: 'rpm', system: 'Transmission' },
  177:  { name: 'Transmission Oil Temperature', unit: '°C', system: 'Transmission' },
  523:  { name: 'Transmission Current Gear', unit: 'gear', system: 'Transmission' },
  524:  { name: 'Transmission Selected Gear', unit: 'gear', system: 'Transmission' },

  // Air Brakes
  46:   { name: 'Pneumatic Supply Pressure', unit: 'kPa', system: 'Air Brakes' },
  116:  { name: 'Service Brake Air Pressure (Circuit 1)', unit: 'kPa', system: 'Air Brakes' },
  117:  { name: 'Service Brake Air Pressure (Circuit 2)', unit: 'kPa', system: 'Air Brakes' },

  // Aftertreatment / Emissions (EPA 2010+)
  1761: { name: 'Aftertreatment DPF Soot Load', unit: '%', system: 'Aftertreatment' },
  3031: { name: 'Aftertreatment DPF Regen Status', unit: 'status', system: 'Aftertreatment' },
  3226: { name: 'Aftertreatment SCR Catalyst Efficiency', unit: '%', system: 'Aftertreatment' },
  3363: { name: 'Aftertreatment DEF Tank Level', unit: '%', system: 'Aftertreatment' },
  3364: { name: 'Aftertreatment DEF Tank Temperature', unit: '°C', system: 'Aftertreatment' },
  4094: { name: 'NOx Sensor (Outlet)', unit: 'ppm', system: 'Aftertreatment' },
  4360: { name: 'Aftertreatment DPF Ash Load', unit: '%', system: 'Aftertreatment' },
  3556: { name: 'Aftertreatment Exhaust Gas Temperature', unit: '°C', system: 'Aftertreatment' },

  // ABS / Stability
  561:  { name: 'ABS Active', unit: 'boolean', system: 'ABS' },
  563:  { name: 'ABS Warning Lamp', unit: 'lamp', system: 'ABS' },
  571:  { name: 'Wheel Speed Sensor', unit: 'km/h', system: 'ABS' },
  575:  { name: 'Retarder Active', unit: 'boolean', system: 'Brakes' },
  1592: { name: 'Park Brake Status', unit: 'status', system: 'Air Brakes' },

  // Electrical
  625:  { name: 'CAN Communication Error', unit: '', system: 'Communication' },
  639:  { name: 'J1939 Network Error', unit: '', system: 'Communication' },

  // Exhaust
  412:  { name: 'EGR Temperature', unit: '°C', system: 'Emissions' },
  411:  { name: 'EGR Valve Position', unit: '%', system: 'Emissions' },
  414:  { name: 'Exhaust Pressure', unit: 'kPa', system: 'Emissions' },
  2659: { name: 'Turbo Compressor Outlet Temperature', unit: '°C', system: 'Engine' },
};

// FMI (Failure Mode Identifier) descriptions per SAE J1939-73
const FMI_DESCRIPTIONS: Record<number, string> = {
  0:  'Data valid but above normal operational range (most severe)',
  1:  'Data valid but below normal operational range (most severe)',
  2:  'Data erratic, intermittent, or incorrect',
  3:  'Voltage above normal or shorted to high source',
  4:  'Voltage below normal or shorted to low source',
  5:  'Current below normal or open circuit',
  6:  'Current above normal or grounded circuit',
  7:  'Mechanical system not responding or out of adjustment',
  8:  'Abnormal frequency or pulse width or period',
  9:  'Abnormal update rate',
  10: 'Abnormal rate of change',
  11: 'Root cause not known',
  12: 'Bad intelligent device or component',
  13: 'Out of calibration',
  14: 'Special instructions',
  15: 'Data valid but above normal operating range (least severe)',
  16: 'Data valid but above normal operating range (moderately severe)',
  17: 'Data valid but below normal operating range (least severe)',
  18: 'Data valid but below normal operating range (moderately severe)',
  19: 'Received network data in error',
  20: 'Data drifted high',
  21: 'Data drifted low',
  31: 'Condition exists',
};

// J1939 PGNs (Parameter Group Numbers) used for requesting data
const J1939_PGNS = {
  // Engine
  ENGINE_SPEED:         'F004',   // PGN 61444 - Electronic Engine Controller 1
  ENGINE_LOAD:          'F003',   // PGN 61443 - Electronic Engine Controller 2
  VEHICLE_SPEED:        'FEF1',   // PGN 65265 - Cruise Control / Vehicle Speed
  COOLANT_TEMP:         'FEEE',   // PGN 65262 - Engine Temperature 1
  OIL_PRESSURE:         'FEEF',   // PGN 65263 - Engine Fluid Level/Pressure
  OIL_TEMP:             'FD7C',   // PGN 64892 - Engine Temperature 3
  FUEL_RATE:            'FEF2',   // PGN 65266 - Fuel Economy
  BOOST_PRESSURE:       'FEF6',   // PGN 65270 - Inlet/Exhaust Conditions 1
  INTAKE_TEMP:          'FEF6',   // same PGN as boost (multi-byte)
  BATTERY_VOLTAGE:      'FEF7',   // PGN 65271 - Electrical Power
  TOTAL_HOURS:          'FEE5',   // PGN 65253 - Engine Hours
  TOTAL_DISTANCE:       'FEC1',   // PGN 65217 - High Resolution Vehicle Distance
  TOTAL_FUEL:           'FEE9',   // PGN 65257 - Engine Fuel Used

  // Transmission
  TRANS_TEMP:           'FE6C',   // PGN 65132 - Transmission Fluids
  TRANS_GEAR:           'F005',   // PGN 61445 - Electronic Transmission Controller 2

  // Air System
  AIR_SUPPLY_PRESSURE:  'FEAE',   // PGN 65198 - Air Supply Pressure
  BRAKE_PRESSURE:       'FE4E',   // PGN 65102 - Brake Application Pressure

  // Aftertreatment
  DPF_STATUS:           'FDB8',   // PGN 64952 - Aftertreatment 1 DPF
  DEF_LEVEL:            'FE56',   // PGN 65110 - Aftertreatment DEF Tank 1
  EXHAUST_TEMP:         'FE4D',   // PGN 65101 - Exhaust Temperature

  // Faults
  ACTIVE_DTC:           'FECA',   // PGN 65226 - Active Diagnostic Trouble Codes (DM1)
  PREVIOUSLY_ACTIVE:    'FECB',   // PGN 65227 - Previously Active DTCs (DM2)
};

// ── Service Class ───────────────────────────────────────────────────

class J1939Service {
  private characteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private responseBuffer = '';
  private isInitialized = false;

  /**
   * Connect to a J1939-capable adapter via Bluetooth.
   * OBDLink MX+ and similar adapters support J1939 via AT commands.
   */
  async connect(): Promise<{ name: string }> {
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { namePrefix: 'OBDLink' },
          { namePrefix: 'Nexiq' },
          { namePrefix: 'DPA' },
          { namePrefix: 'DEARBORN' },
          { namePrefix: 'ELM327' },
          { namePrefix: 'Veepeak' },
          { namePrefix: 'OBDII' },
          { namePrefix: 'OBD2' },
          { namePrefix: 'V011' },
        ],
        optionalServices: [
          '0000fff0-0000-1000-8000-00805f9b34fb',
          '0000ffe0-0000-1000-8000-00805f9b34fb',
        ]
      });

      const server = await device.gatt?.connect();
      if (!server) throw new Error('Failed to connect to GATT server');

      let service;
      try {
        service = await server.getPrimaryService('0000fff0-0000-1000-8000-00805f9b34fb');
      } catch {
        service = await server.getPrimaryService('0000ffe0-0000-1000-8000-00805f9b34fb');
      }

      const characteristic = await service.getCharacteristic('0000fff1-0000-1000-8000-00805f9b34fb')
        .catch(() => service.getCharacteristic('0000ffe1-0000-1000-8000-00805f9b34fb'));

      await characteristic.startNotifications();
      characteristic.addEventListener('characteristicvaluechanged', (event) => {
        const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
        if (value) {
          this.responseBuffer += new TextDecoder().decode(value);
        }
      });

      this.device = device;
      this.server = server;
      this.characteristic = characteristic;

      await this.initializeJ1939();

      return { name: device.name || 'J1939 Adapter' };
    } catch (error) {
      throw new Error(`J1939 connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Initialize adapter for J1939 CAN protocol (heavy-duty trucks).
   * Switches from standard OBD-II mode to J1939 mode.
   */
  private async initializeJ1939(): Promise<void> {
    // Reset and configure
    await this.sendCommand('ATZ');       // Reset adapter
    await this.wait(1000);
    await this.sendCommand('ATE0');      // Echo off
    await this.sendCommand('ATL0');      // Linefeeds off
    await this.sendCommand('ATS0');      // Spaces off
    await this.sendCommand('ATH1');      // Headers on (needed for J1939 source addressing)

    // Switch to J1939 protocol
    // ATSP A = SAE J1939 (CAN 29-bit, 250kbps)
    await this.sendCommand('ATSP A');
    await this.wait(300);

    // Set the CAN monitoring to accept all J1939 messages
    await this.sendCommand('ATCAF1');    // CAN auto formatting on

    // Try J1939 header format (request from tool address F9 to broadcast)
    await this.sendCommand('AT SH 18 EA F9');
    await this.wait(200);

    this.isInitialized = true;
    console.log('[J1939] Adapter initialized in heavy-duty mode');
  }

  /**
   * Read active fault codes (DM1 message - PGN 65226)
   */
  async readFaultCodes(): Promise<J1939FaultCode[]> {
    if (!this.isInitialized) throw new Error('J1939 adapter not initialized');

    try {
      // Request DM1 (Active DTCs) from all ECUs
      const response = await this.sendCommand('00 FECA');
      await this.wait(500);

      // Also try direct request
      const response2 = await this.sendCommand('18 FECA 00');
      await this.wait(500);

      const combined = response + '\n' + response2;
      return this.parseDM1Response(combined);
    } catch (error) {
      console.error('[J1939] Error reading fault codes:', error);
      return [];
    }
  }

  /**
   * Read previously active fault codes (DM2 - PGN 65227)
   */
  async readPreviousFaults(): Promise<J1939FaultCode[]> {
    if (!this.isInitialized) throw new Error('J1939 adapter not initialized');

    try {
      const response = await this.sendCommand('00 FECB');
      await this.wait(500);
      return this.parseDM1Response(response);
    } catch (error) {
      console.error('[J1939] Error reading previous faults:', error);
      return [];
    }
  }

  /**
   * Clear active fault codes (DM11 - Diagnostic data clear)
   */
  async clearFaultCodes(): Promise<void> {
    if (!this.isInitialized) throw new Error('J1939 adapter not initialized');
    // DM11 = PGN 65235 (0xFED3)
    await this.sendCommand('18 FED3 FF');
    await this.wait(1000);
    console.log('[J1939] Fault codes cleared');
  }

  /**
   * Read heavy-duty live data from J1939 CAN bus
   */
  async readLiveData(): Promise<HeavyDutyLiveData> {
    if (!this.isInitialized) throw new Error('J1939 adapter not initialized');

    const data: HeavyDutyLiveData = {};

    // Request PGNs in parallel batches for speed
    const requests = [
      { pgn: J1939_PGNS.ENGINE_SPEED, parser: (r: string) => { data.rpm = this.parseJ1939Value(r, 190); } },
      { pgn: J1939_PGNS.ENGINE_LOAD, parser: (r: string) => { data.engineLoad = this.parseJ1939Value(r, 92); } },
      { pgn: J1939_PGNS.COOLANT_TEMP, parser: (r: string) => { data.coolantTemp = this.parseJ1939Value(r, 110); } },
      { pgn: J1939_PGNS.OIL_PRESSURE, parser: (r: string) => { data.oilPressure = this.parseJ1939Value(r, 100); } },
      { pgn: J1939_PGNS.BOOST_PRESSURE, parser: (r: string) => { data.boostPressure = this.parseJ1939Value(r, 102); } },
      { pgn: J1939_PGNS.VEHICLE_SPEED, parser: (r: string) => { data.vehicleSpeed = this.parseJ1939Value(r, 84); } },
      { pgn: J1939_PGNS.FUEL_RATE, parser: (r: string) => { data.fuelRate = this.parseJ1939Value(r, 183); } },
      { pgn: J1939_PGNS.TRANS_TEMP, parser: (r: string) => { data.transTemp = this.parseJ1939Value(r, 177); } },
      { pgn: J1939_PGNS.TRANS_GEAR, parser: (r: string) => { data.transGear = this.parseJ1939Value(r, 523); } },
      { pgn: J1939_PGNS.AIR_SUPPLY_PRESSURE, parser: (r: string) => { data.primaryAirPressure = this.parseJ1939Value(r, 46); } },
      { pgn: J1939_PGNS.DEF_LEVEL, parser: (r: string) => { data.defLevel = this.parseJ1939Value(r, 3363); } },
      { pgn: J1939_PGNS.TOTAL_HOURS, parser: (r: string) => { data.totalEngineHours = this.parseJ1939Value(r, 235); } },
    ];

    // Request sequentially (J1939 CAN bus can't handle rapid parallel requests well)
    for (const req of requests) {
      try {
        const response = await this.sendCommand(`00 ${req.pgn}`);
        await this.wait(150);
        if (response && !response.includes('NO DATA') && !response.includes('?')) {
          req.parser(response);
        }
      } catch {
        // Skip failed requests
      }
    }

    return data;
  }

  /**
   * Parse DM1/DM2 fault code response into structured fault codes
   * J1939 DM1 format: [Lamp Status (2 bytes)] [SPN (19 bits)] [FMI (5 bits)] [OC (7 bits)]
   */
  private parseDM1Response(response: string): J1939FaultCode[] {
    const faults: J1939FaultCode[] = [];
    const hex = response.replace(/[\s\r\n>]/g, '').replace(/[^0-9A-Fa-f]/g, '');

    if (hex.length < 8) return faults; // Too short to contain faults

    // Skip lamp status bytes (first 2 bytes = 4 hex chars), then parse 4-byte fault entries
    for (let i = 4; i + 8 <= hex.length; i += 8) {
      const byte1 = parseInt(hex.substr(i, 2), 16);
      const byte2 = parseInt(hex.substr(i + 2, 2), 16);
      const byte3 = parseInt(hex.substr(i + 4, 2), 16);
      const byte4 = parseInt(hex.substr(i + 6, 2), 16);

      // SPN is 19 bits: byte3[7:5] + byte2[7:0] + byte1[7:0]
      const spn = ((byte3 & 0xE0) << 11) | (byte2 << 8) | byte1;
      // FMI is 5 bits: byte3[4:0]
      const fmi = byte3 & 0x1F;
      // OC is 7 bits: byte4[6:0]
      const oc = byte4 & 0x7F;

      if (spn === 0 && fmi === 0) continue; // Empty slot
      if (spn === 0x7FFFF) continue; // Not available

      const spnInfo = SPN_DATABASE[spn];
      const fmiDesc = FMI_DESCRIPTIONS[fmi] || `FMI ${fmi}`;

      // Determine severity
      let severity: 'critical' | 'warning' | 'info' = 'warning';
      if (fmi <= 2 || fmi === 7 || fmi === 12) severity = 'critical';
      if (fmi >= 15 && fmi <= 18) severity = 'info';

      faults.push({
        spn,
        fmi,
        oc,
        source: spnInfo?.system || 'Unknown',
        description: spnInfo?.name || `SPN ${spn}`,
        fmiDescription: fmiDesc,
        severity,
      });
    }

    return faults;
  }

  /**
   * Parse a J1939 PGN response value for a specific SPN
   */
  private parseJ1939Value(response: string, spn: number): number | undefined {
    const hex = response.replace(/[\s\r\n>]/g, '').replace(/[^0-9A-Fa-f]/g, '');
    if (hex.length < 4 || response.includes('NO DATA')) return undefined;

    // Parse based on known SPN byte positions within their PGN
    // These offsets are per J1939-71 standard
    const bytes = hex.match(/.{1,2}/g)?.map(b => parseInt(b, 16)) || [];
    if (bytes.length < 2) return undefined;

    switch (spn) {
      case 190: // Engine RPM: 2 bytes, 0.125 rpm/bit, bytes 4-5 of PGN F004
        if (bytes.length >= 4) return (bytes[3] * 256 + bytes[2]) * 0.125;
        break;
      case 92: // Engine Load: 1 byte, 1%/bit, byte 3 of PGN F003
        if (bytes.length >= 3) return bytes[2];
        break;
      case 110: // Coolant Temp: 1 byte, 1°C/bit offset -40
        if (bytes.length >= 1) return bytes[0] - 40;
        break;
      case 84: // Vehicle Speed: 2 bytes, 1/256 km/h per bit
        if (bytes.length >= 2) return (bytes[1] * 256 + bytes[0]) / 256;
        break;
      case 100: // Oil Pressure: 1 byte, 4 kPa/bit
        if (bytes.length >= 1) return bytes[0] * 4;
        break;
      case 102: // Boost Pressure: 1 byte, 2 kPa/bit
        if (bytes.length >= 1) return bytes[0] * 2;
        break;
      case 177: // Trans Oil Temp: 2 bytes, 0.03125°C/bit offset -273
        if (bytes.length >= 2) return (bytes[1] * 256 + bytes[0]) * 0.03125 - 273;
        break;
      case 183: // Fuel Rate: 2 bytes, 0.05 L/hr per bit
        if (bytes.length >= 2) return (bytes[1] * 256 + bytes[0]) * 0.05;
        break;
      case 46: // Air Supply Pressure: 1 byte, 8 kPa/bit
        if (bytes.length >= 1) return bytes[0] * 8;
        break;
      case 3363: // DEF Level: 1 byte, 0.4%/bit
        if (bytes.length >= 1) return bytes[0] * 0.4;
        break;
      case 235: // Total Engine Hours: 4 bytes, 0.05 hr/bit
        if (bytes.length >= 4)
          return (bytes[3] * 16777216 + bytes[2] * 65536 + bytes[1] * 256 + bytes[0]) * 0.05;
        break;
      case 523: // Current Gear: 1 byte, offset -125
        if (bytes.length >= 1) return bytes[0] - 125;
        break;
      default:
        // Generic single-byte parse
        return bytes[0];
    }
    return undefined;
  }

  /**
   * Format a fault code for display
   */
  static formatFaultCode(fault: J1939FaultCode): string {
    return `SPN ${fault.spn} / FMI ${fault.fmi}`;
  }

  /**
   * Format fault code for AI analysis
   */
  static formatForAnalysis(faults: J1939FaultCode[]): string {
    return faults.map(f =>
      `SPN ${f.spn} (${f.description}) / FMI ${f.fmi} (${f.fmiDescription}) - ${f.source} [${f.severity}] x${f.oc}`
    ).join('\n');
  }

  /**
   * Get the SPN database entry for a given SPN
   */
  static lookupSPN(spn: number): { name: string; unit: string; system: string } | null {
    return SPN_DATABASE[spn] || null;
  }

  /**
   * Get FMI description
   */
  static lookupFMI(fmi: number): string {
    return FMI_DESCRIPTIONS[fmi] || `Unknown FMI (${fmi})`;
  }

  // ── Low-Level Communication ─────────────────────────────────────

  private async sendCommand(command: string): Promise<string> {
    if (!this.characteristic) throw new Error('Not connected');

    this.responseBuffer = '';
    const data = new TextEncoder().encode(command + '\r');
    await this.characteristic.writeValue(data);
    await this.wait(400); // J1939 is slower than OBD-II, needs more time
    return this.responseBuffer.trim();
  }

  async disconnect(): Promise<void> {
    if (this.server?.connected) {
      this.server.disconnect();
    }
    this.device = null;
    this.server = null;
    this.characteristic = null;
    this.isInitialized = false;
  }

  isConnected(): boolean {
    return this.server?.connected || false;
  }

  private wait(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const j1939Service = new J1939Service();
export { SPN_DATABASE, FMI_DESCRIPTIONS, J1939_PGNS };
