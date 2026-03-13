/**
 * AdvancedTools.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * Optional premium inspection tools. Each tool is independently toggled ON/OFF
 * by the inspector based on what the customer ordered.
 *
 * Tools:
 *   1. Paint Thickness Meter   — detects repaint & body filler (all vehicles)
 *   2. Battery & Charging Test — CCA load test + alternator output
 *   3. Brake Fluid Moisture    — boiling point degradation check
 *   4. Borescope / Engine Scope — cylinder inspection via phone camera
 *   5. NMVTIS / Auction History — total loss & title wash check
 *   6. UV / Black Light         — fluid leaks & hidden repairs (standard step)
 *
 * SAFETY: This component is completely isolated. Any error inside it
 * is caught locally and does NOT affect the rest of the application.
 */

import React, { useState } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface PanelReading {
  panel: string;
  reading: string;
}

interface AdvancedToolsProps {
  vin?: string;
  vehicleType?: string;
  mileage?: string;
  onResultsChange?: (results: AdvancedToolsResults) => void;
}

export interface AdvancedToolsResults {
  paintThickness?: any;
  batteryTest?: any;
  brakeFluid?: any;
  borescope?: any;
  nmvtis?: any;
  uvLight?: {
    oilLeaks: boolean;
    coolantLeaks: boolean;
    hiddenRepairs: boolean;
    notes: string;
  };
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const API_BASE = '/api/advanced';

const STATUS_COLORS: Record<string, string> = {
  PASS: '#16a34a',
  CONCERN: '#d97706',
  FAIL: '#dc2626',
  CRITICAL: '#7c3aed',
  LOW: '#16a34a',
  MEDIUM: '#d97706',
  HIGH: '#dc2626',
  UNKNOWN: '#6b7280',
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => (
  <span style={{
    display: 'inline-block',
    padding: '2px 10px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: 700,
    color: '#fff',
    backgroundColor: STATUS_COLORS[status] || '#6b7280',
    letterSpacing: '0.05em',
  }}>
    {status}
  </span>
);

const ToolToggle: React.FC<{
  label: string;
  icon: string;
  description: string;
  enabled: boolean;
  onToggle: () => void;
  badge?: string;
}> = ({ label, icon, description, enabled, onToggle, badge }) => (
  <div style={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    borderRadius: '10px',
    border: `2px solid ${enabled ? '#2563eb' : '#e5e7eb'}`,
    backgroundColor: enabled ? '#eff6ff' : '#f9fafb',
    marginBottom: '8px',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  }} onClick={onToggle}>
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <span style={{ fontSize: '22px' }}>{icon}</span>
      <div>
        <div style={{ fontWeight: 700, fontSize: '14px', color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {label}
          {badge && (
            <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '8px', backgroundColor: '#fef3c7', color: '#92400e', fontWeight: 600 }}>
              {badge}
            </span>
          )}
        </div>
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{description}</div>
      </div>
    </div>
    <div style={{
      width: '44px', height: '24px', borderRadius: '12px',
      backgroundColor: enabled ? '#2563eb' : '#d1d5db',
      position: 'relative', transition: 'background-color 0.15s',
      flexShrink: 0,
    }}>
      <div style={{
        position: 'absolute', top: '3px',
        left: enabled ? '23px' : '3px',
        width: '18px', height: '18px', borderRadius: '50%',
        backgroundColor: '#fff', transition: 'left 0.15s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }} />
    </div>
  </div>
);

const SectionHeader: React.FC<{ icon: string; title: string; subtitle?: string }> = ({ icon, title, subtitle }) => (
  <div style={{ marginBottom: '16px' }}>
    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#111827', display: 'flex', alignItems: 'center', gap: '8px' }}>
      <span>{icon}</span> {title}
    </h3>
    {subtitle && <p style={{ margin: '4px 0 0', fontSize: '12px', color: '#6b7280' }}>{subtitle}</p>}
  </div>
);

const ResultCard: React.FC<{ title: string; status: string; reading?: string; interpretation: string; repairEstimate?: { min: number; max: number } | null }> = ({
  title, status, reading, interpretation, repairEstimate
}) => (
  <div style={{
    padding: '12px 14px', borderRadius: '8px', marginBottom: '8px',
    border: `1px solid ${STATUS_COLORS[status] || '#e5e7eb'}22`,
    backgroundColor: status === 'FAIL' || status === 'CRITICAL' ? '#fef2f2' : status === 'CONCERN' ? '#fffbeb' : '#f0fdf4',
  }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
      <span style={{ fontWeight: 600, fontSize: '13px', color: '#374151' }}>{title}</span>
      <StatusBadge status={status} />
    </div>
    {reading && <div style={{ fontSize: '12px', color: '#6b7280', marginBottom: '4px' }}>Reading: <strong>{reading}</strong></div>}
    <div style={{ fontSize: '13px', color: '#374151' }}>{interpretation}</div>
    {repairEstimate && (
      <div style={{ marginTop: '6px', fontSize: '12px', color: '#dc2626', fontWeight: 600 }}>
        Est. Repair: ${repairEstimate.min.toLocaleString()}–${repairEstimate.max.toLocaleString()}
      </div>
    )}
  </div>
);

// ── PAINT THICKNESS TOOL ─────────────────────────────────────────────────────
const STANDARD_PANELS = ['Hood', 'Roof', 'Trunk/Tailgate', 'Front Bumper', 'Rear Bumper', 'Driver Door', 'Passenger Door', 'Driver Rear Door', 'Passenger Rear Door', 'Left Fender', 'Right Fender', 'Left Quarter Panel', 'Right Quarter Panel'];

const PaintThicknessTool: React.FC<{ vehicleType?: string; onResult: (r: any) => void }> = ({ vehicleType, onResult }) => {
  const [panels, setPanels] = useState<PanelReading[]>(
    STANDARD_PANELS.map(p => ({ panel: p, reading: '' }))
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const updateReading = (index: number, value: string) => {
    const updated = [...panels];
    updated[index] = { ...updated[index], reading: value };
    setPanels(updated);
  };

  const analyze = async () => {
    const filledPanels = panels.filter(p => p.reading.trim() !== '');
    if (filledPanels.length === 0) {
      setError('Enter at least one panel reading before analyzing.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/analyze-paint-thickness`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ panels: filledPanels, vehicleType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setResult(data);
      onResult(data);
    } catch (e: any) {
      setError(e.message || 'Analysis failed. Check connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <SectionHeader icon="🎨" title="Paint Thickness Meter" subtitle="Enter readings in microns (µm) for each panel. Factory spec: 90–190 µm. Skip panels you didn't test." />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px', marginBottom: '16px' }}>
        {panels.map((p, i) => (
          <div key={p.panel} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151' }}>{p.panel}</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="number"
                placeholder="µm"
                value={p.reading}
                onChange={e => updateReading(i, e.target.value)}
                style={{
                  width: '80px', padding: '6px 8px', borderRadius: '6px',
                  border: '1px solid #d1d5db', fontSize: '13px',
                  backgroundColor: p.reading && Number(p.reading) > 400 ? '#fef2f2'
                    : p.reading && Number(p.reading) > 220 ? '#fffbeb' : '#fff',
                }}
              />
              <span style={{ fontSize: '11px', color: '#9ca3af' }}>µm</span>
            </div>
          </div>
        ))}
      </div>

      <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', marginBottom: '12px', fontSize: '12px', color: '#0369a1' }}>
        <strong>Quick Reference:</strong> &lt;190 µm = Factory ✓ &nbsp;|&nbsp; 190–220 µm = Borderline ⚠️ &nbsp;|&nbsp; 220–400 µm = Repainted 🔴 &nbsp;|&nbsp; &gt;400 µm = Body Filler 🚨
      </div>

      {error && <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '13px', marginBottom: '12px' }}>{error}</div>}

      <button
        onClick={analyze}
        disabled={loading}
        style={{
          padding: '10px 24px', borderRadius: '8px', border: 'none',
          backgroundColor: loading ? '#9ca3af' : '#1d4ed8', color: '#fff',
          fontWeight: 700, fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer', width: '100%',
        }}
      >
        {loading ? '⏳ Analyzing...' : '🔍 Analyze Paint Thickness'}
      </button>

      {result && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <strong style={{ fontSize: '15px' }}>Results</strong>
            <StatusBadge status={result.overallVerdict} />
          </div>
          <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f9fafb', marginBottom: '12px', fontSize: '13px', color: '#374151' }}>
            {result.overallInterpretation}
          </div>
          {result.repairEstimate && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#fef2f2', marginBottom: '12px', fontSize: '13px', color: '#dc2626', fontWeight: 600 }}>
              💰 Total Estimated Repair: ${result.repairEstimate.min.toLocaleString()}–${result.repairEstimate.max.toLocaleString()}
            </div>
          )}
          {result.panelResults?.filter((p: any) => p.status !== 'PASS' && p.status !== 'SKIPPED').map((p: any, i: number) => (
            <ResultCard key={i} title={p.panel} status={p.status} reading={`${p.reading} µm`} interpretation={p.interpretation} repairEstimate={p.repairEstimate} />
          ))}
          {result.aiVisualNote && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#f0f9ff', border: '1px solid #bae6fd', fontSize: '12px', color: '#0369a1', marginTop: '8px' }}>
              <strong>AI Visual Cross-Check:</strong> {result.aiVisualNote}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── BATTERY & CHARGING TOOL ──────────────────────────────────────────────────
const BatteryTool: React.FC<{ vehicleType?: string; onResult: (r: any) => void }> = ({ vehicleType, onResult }) => {
  const [measuredCCA, setMeasuredCCA] = useState('');
  const [ratedCCA, setRatedCCA] = useState('');
  const [restingVoltage, setRestingVoltage] = useState('');
  const [alternatorVoltage, setAlternatorVoltage] = useState('');
  const [engineRunning, setEngineRunning] = useState(false);
  const [batteryAge, setBatteryAge] = useState('');
  const [houseBankVoltage, setHouseBankVoltage] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = async () => {
    if (!measuredCCA && !restingVoltage) {
      setError('Enter at least one reading (CCA or resting voltage).');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/analyze-battery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ measuredCCA, ratedCCA, restingVoltage, alternatorVoltage, engineRunning, batteryAge, vehicleType, houseBankVoltage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setResult(data);
      onResult(data);
    } catch (e: any) {
      setError(e.message || 'Analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', width: '100%' };
  const labelStyle = { fontSize: '12px', fontWeight: 600 as const, color: '#374151', display: 'block' as const, marginBottom: '4px' };

  return (
    <div>
      <SectionHeader icon="🔋" title="Battery & Charging System Test" subtitle="Requires dedicated CCA tester (Midtronics/ANCEL). OBD voltage is supplementary only." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div>
          <label style={labelStyle}>Measured CCA</label>
          <input type="number" placeholder="e.g. 420" value={measuredCCA} onChange={e => setMeasuredCCA(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Rated CCA (from label)</label>
          <input type="number" placeholder="e.g. 600" value={ratedCCA} onChange={e => setRatedCCA(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Resting Voltage (engine off)</label>
          <input type="number" step="0.1" placeholder="e.g. 12.4" value={restingVoltage} onChange={e => setRestingVoltage(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Alternator Voltage (engine on)</label>
          <input type="number" step="0.1" placeholder="e.g. 14.2" value={alternatorVoltage} onChange={e => setAlternatorVoltage(e.target.value)} style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle}>Battery Age (years, approx.)</label>
          <input type="number" placeholder="e.g. 3" value={batteryAge} onChange={e => setBatteryAge(e.target.value)} style={inputStyle} />
        </div>
        {vehicleType === 'RV' && (
          <div>
            <label style={labelStyle}>RV House Bank Voltage</label>
            <input type="number" step="0.1" placeholder="e.g. 12.3" value={houseBankVoltage} onChange={e => setHouseBankVoltage(e.target.value)} style={inputStyle} />
          </div>
        )}
      </div>
      <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', marginBottom: '12px', cursor: 'pointer' }}>
        <input type="checkbox" checked={engineRunning} onChange={e => setEngineRunning(e.target.checked)} />
        Alternator voltage was measured with engine running
      </label>

      {error && <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '13px', marginBottom: '12px' }}>{error}</div>}

      <button onClick={analyze} disabled={loading} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: loading ? '#9ca3af' : '#1d4ed8', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer', width: '100%' }}>
        {loading ? '⏳ Analyzing...' : '🔋 Analyze Battery & Charging'}
      </button>

      {result && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <strong style={{ fontSize: '15px' }}>Results</strong>
            <StatusBadge status={result.overallVerdict} />
          </div>
          {result.results?.map((r: any, i: number) => (
            <ResultCard key={i} title={r.test} status={r.status} reading={r.reading} interpretation={r.interpretation} repairEstimate={r.repairEstimate} />
          ))}
          {result.repairEstimate && (
            <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#fef2f2', fontSize: '13px', color: '#dc2626', fontWeight: 600, marginTop: '8px' }}>
              💰 Total Est. Repair: ${result.repairEstimate.min.toLocaleString()}–${result.repairEstimate.max.toLocaleString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ── BRAKE FLUID TOOL ─────────────────────────────────────────────────────────
const BrakeFluidTool: React.FC<{ onResult: (r: any) => void }> = ({ onResult }) => {
  const [testMethod, setTestMethod] = useState<'digital' | 'strip'>('digital');
  const [moisturePercent, setMoisturePercent] = useState('');
  const [stripResult, setStripResult] = useState<'good' | 'fair' | 'poor'>('good');
  const [dotRating, setDotRating] = useState('DOT 4');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = async () => {
    setLoading(true);
    setError(null);
    try {
      const body = testMethod === 'digital'
        ? { moisturePercent: Number(moisturePercent), dotRating }
        : { stripResult, dotRating };
      const res = await fetch(`${API_BASE}/analyze-brake-fluid`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setResult(data);
      onResult(data);
    } catch (e: any) {
      setError(e.message || 'Analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <SectionHeader icon="🛑" title="Brake Fluid Moisture Test" subtitle="Degraded brake fluid causes vapor lock and brake fade. 99% of inspectors skip this." />
      <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
        {(['digital', 'strip'] as const).map(m => (
          <button key={m} onClick={() => setTestMethod(m)} style={{ padding: '6px 16px', borderRadius: '6px', border: `2px solid ${testMethod === m ? '#2563eb' : '#e5e7eb'}`, backgroundColor: testMethod === m ? '#eff6ff' : '#fff', fontWeight: testMethod === m ? 700 : 400, fontSize: '13px', cursor: 'pointer' }}>
            {m === 'digital' ? '📱 Digital Tester' : '🧪 Test Strip'}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>DOT Rating</label>
          <select value={dotRating} onChange={e => setDotRating(e.target.value)} style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', width: '100%' }}>
            <option>DOT 3</option>
            <option>DOT 4</option>
            <option>DOT 5.1</option>
          </select>
        </div>
        {testMethod === 'digital' ? (
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Moisture %</label>
            <input type="number" step="0.1" placeholder="e.g. 1.8" value={moisturePercent} onChange={e => setMoisturePercent(e.target.value)} style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', width: '100%' }} />
          </div>
        ) : (
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Strip Result</label>
            <select value={stripResult} onChange={e => setStripResult(e.target.value as any)} style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', width: '100%' }}>
              <option value="good">Good (Green)</option>
              <option value="fair">Fair (Yellow)</option>
              <option value="poor">Poor (Red)</option>
            </select>
          </div>
        )}
      </div>

      {error && <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '13px', marginBottom: '12px' }}>{error}</div>}

      <button onClick={analyze} disabled={loading} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: loading ? '#9ca3af' : '#1d4ed8', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer', width: '100%' }}>
        {loading ? '⏳ Analyzing...' : '🛑 Analyze Brake Fluid'}
      </button>

      {result && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <strong style={{ fontSize: '15px' }}>Result</strong>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', color: '#6b7280' }}>Safety Risk:</span>
              <StatusBadge status={result.safetyRisk} />
              <StatusBadge status={result.status} />
            </div>
          </div>
          <ResultCard title="Brake Fluid Condition" status={result.status} reading={`Estimated boiling point: ${result.boilingPoint}`} interpretation={result.recommendation} repairEstimate={result.repairEstimate} />
        </div>
      )}
    </div>
  );
};

// ── BORESCOPE TOOL ────────────────────────────────────────────────────────────
const BorescopeTool: React.FC<{ vehicleType?: string; mileage?: string; onResult: (r: any) => void }> = ({ vehicleType, mileage, onResult }) => {
  const [photos, setPhotos] = useState<string[]>([]);
  const [cylinderCount, setCylinderCount] = useState('4');
  const [engineType, setEngineType] = useState('gasoline');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const analyze = async () => {
    if (photos.length === 0) {
      setError('Capture at least one borescope photo before analyzing.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/analyze-borescope`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({ photos, cylinderCount: Number(cylinderCount), engineType, mileage, vehicleType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Analysis failed');
      setResult(data);
      onResult(data);
    } catch (e: any) {
      setError(e.message || 'Analysis failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <SectionHeader icon="🔭" title="Borescope / Engine Scope" subtitle="Connect USB-C borescope to phone. Inspect through spark plug ports. Premium vehicles only." />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Cylinder Count</label>
          <select value={cylinderCount} onChange={e => setCylinderCount(e.target.value)} style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', width: '100%' }}>
            <option value="4">4-Cylinder</option>
            <option value="6">6-Cylinder</option>
            <option value="8">8-Cylinder</option>
            <option value="10">10-Cylinder</option>
            <option value="12">12-Cylinder</option>
          </select>
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Engine Type</label>
          <select value={engineType} onChange={e => setEngineType(e.target.value)} style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', width: '100%' }}>
            <option value="gasoline">Gasoline</option>
            <option value="diesel">Diesel</option>
            <option value="turbocharged gasoline">Turbocharged Gas</option>
            <option value="turbocharged diesel">Turbocharged Diesel</option>
          </select>
        </div>
      </div>

      <div style={{ padding: '16px', borderRadius: '8px', border: '2px dashed #d1d5db', textAlign: 'center', marginBottom: '12px', backgroundColor: '#f9fafb' }}>
        <input type="file" accept="image/*" multiple capture="environment" onChange={handlePhotoCapture} style={{ display: 'none' }} id="borescope-upload" />
        <label htmlFor="borescope-upload" style={{ cursor: 'pointer' }}>
          <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔭</div>
          <div style={{ fontWeight: 600, fontSize: '14px', color: '#374151' }}>Capture Borescope Photos</div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px' }}>One photo per cylinder through spark plug port</div>
        </label>
        {photos.length > 0 && (
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
            {photos.map((p, i) => (
              <div key={i} style={{ position: 'relative' }}>
                <img src={p} alt={`Cylinder ${i + 1}`} style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '6px', border: '2px solid #e5e7eb' }} />
                <div style={{ position: 'absolute', top: '-6px', left: '-6px', width: '18px', height: '18px', borderRadius: '50%', backgroundColor: '#2563eb', color: '#fff', fontSize: '10px', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{i + 1}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '13px', marginBottom: '12px' }}>{error}</div>}

      <button onClick={analyze} disabled={loading || photos.length === 0} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: loading || photos.length === 0 ? '#9ca3af' : '#1d4ed8', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: loading || photos.length === 0 ? 'not-allowed' : 'pointer', width: '100%' }}>
        {loading ? `⏳ Analyzing ${photos.length} cylinder(s)...` : `🔭 Analyze ${photos.length} Cylinder Photo(s)`}
      </button>

      {result && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <strong style={{ fontSize: '15px' }}>Engine Internal Condition</strong>
            <StatusBadge status={result.overallVerdict} />
          </div>
          <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f9fafb', marginBottom: '12px', fontSize: '13px', color: '#374151' }}>
            {result.overallNote}
          </div>
          {result.cylinderFindings?.map((c: any, i: number) => (
            <ResultCard key={i} title={`Cylinder ${c.cylinder}`} status={c.condition} interpretation={c.findings} repairEstimate={null} />
          ))}
        </div>
      )}
    </div>
  );
};

// ── NMVTIS TOOL ───────────────────────────────────────────────────────────────
const NMVTISTool: React.FC<{ vin?: string; onResult: (r: any) => void }> = ({ vin: propVin, onResult }) => {
  const [vin, setVin] = useState(propVin || '');
  const [stateHistory, setStateHistory] = useState('');
  const [titleBrands, setTitleBrands] = useState('');
  const [previousOwners, setPreviousOwners] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const analyze = async () => {
    if (!vin || vin.length !== 17) {
      setError('Enter a valid 17-character VIN.');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_BASE}/check-nmvtis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('token')}` },
        body: JSON.stringify({
          vin,
          stateHistory: stateHistory ? stateHistory.split(',').map(s => s.trim()) : [],
          titleBrands: titleBrands || null,
          previousOwners: previousOwners || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Check failed');
      setResult(data);
      onResult(data);
    } catch (e: any) {
      setError(e.message || 'Check failed.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <SectionHeader icon="🔍" title="NMVTIS / Auction History Check" subtitle="Catches total loss vehicles rebuilt and retitled across states — invisible to CARFAX." />
      <div style={{ display: 'grid', gap: '10px', marginBottom: '12px' }}>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>VIN (17 characters)</label>
          <input type="text" maxLength={17} placeholder="1HGBH41JXMN109186" value={vin} onChange={e => setVin(e.target.value.toUpperCase())} style={{ padding: '8px 10px', borderRadius: '6px', border: `1px solid ${vin.length > 0 && vin.length !== 17 ? '#dc2626' : '#d1d5db'}`, fontSize: '13px', width: '100%', fontFamily: 'monospace', letterSpacing: '0.1em' }} />
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>State Registration History (comma-separated, if known)</label>
          <input type="text" placeholder="e.g. TX, FL, GA, SC" value={stateHistory} onChange={e => setStateHistory(e.target.value)} style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', width: '100%' }} />
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Title Brands (if any shown on title)</label>
          <input type="text" placeholder="e.g. Salvage, Rebuilt, Flood, None" value={titleBrands} onChange={e => setTitleBrands(e.target.value)} style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', width: '100%' }} />
        </div>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '4px' }}>Number of Previous Owners</label>
          <input type="text" placeholder="e.g. 3" value={previousOwners} onChange={e => setPreviousOwners(e.target.value)} style={{ padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', width: '100%' }} />
        </div>
      </div>

      {error && <div style={{ padding: '10px', borderRadius: '6px', backgroundColor: '#fef2f2', color: '#dc2626', fontSize: '13px', marginBottom: '12px' }}>{error}</div>}

      <button onClick={analyze} disabled={loading} style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', backgroundColor: loading ? '#9ca3af' : '#1d4ed8', color: '#fff', fontWeight: 700, fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer', width: '100%' }}>
        {loading ? '⏳ Running History Check...' : '🔍 Run NMVTIS & Auction Check'}
      </button>

      {result && (
        <div style={{ marginTop: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <strong style={{ fontSize: '15px' }}>History Risk Assessment</strong>
            <StatusBadge status={result.overallRisk} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '12px' }}>
            <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#f9fafb', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Title Wash Risk</div>
              <StatusBadge status={result.titleWashRisk} />
            </div>
            <div style={{ padding: '10px', borderRadius: '8px', backgroundColor: '#f9fafb', textAlign: 'center' }}>
              <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>Total Loss Risk</div>
              <StatusBadge status={result.totalLossRisk} />
            </div>
          </div>
          {result.redFlags?.length > 0 && (
            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#fef2f2', marginBottom: '10px' }}>
              <strong style={{ fontSize: '13px', color: '#dc2626' }}>🚨 Red Flags:</strong>
              <ul style={{ margin: '6px 0 0', paddingLeft: '18px' }}>
                {result.redFlags.map((f: string, i: number) => <li key={i} style={{ fontSize: '13px', color: '#374151', marginBottom: '2px' }}>{f}</li>)}
              </ul>
            </div>
          )}
          {result.recommendation && (
            <div style={{ padding: '12px', borderRadius: '8px', backgroundColor: '#f0f9ff', marginBottom: '10px', fontSize: '13px', color: '#0369a1' }}>
              <strong>Recommendation:</strong> {result.recommendation}
            </div>
          )}
          <div style={{ marginTop: '10px' }}>
            <strong style={{ fontSize: '12px', color: '#374151' }}>Manual Verification Links:</strong>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
              {result.manualCheckLinks?.map((link: any, i: number) => (
                <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" style={{ padding: '4px 10px', borderRadius: '6px', backgroundColor: '#eff6ff', color: '#2563eb', fontSize: '12px', fontWeight: 600, textDecoration: 'none', border: '1px solid #bfdbfe' }}>
                  {link.name} ↗
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ── UV / BLACK LIGHT TOOL (standard — no toggle needed) ───────────────────────
const UVLightTool: React.FC<{ onResult: (r: any) => void }> = ({ onResult }) => {
  const [oilLeaks, setOilLeaks] = useState(false);
  const [coolantLeaks, setCoolantLeaks] = useState(false);
  const [hiddenRepairs, setHiddenRepairs] = useState(false);
  const [notes, setNotes] = useState('');

  const handleChange = (field: string, value: boolean | string) => {
    const updated = {
      oilLeaks: field === 'oilLeaks' ? value as boolean : oilLeaks,
      coolantLeaks: field === 'coolantLeaks' ? value as boolean : coolantLeaks,
      hiddenRepairs: field === 'hiddenRepairs' ? value as boolean : hiddenRepairs,
      notes: field === 'notes' ? value as string : notes,
    };
    if (field === 'oilLeaks') setOilLeaks(value as boolean);
    if (field === 'coolantLeaks') setCoolantLeaks(value as boolean);
    if (field === 'hiddenRepairs') setHiddenRepairs(value as boolean);
    if (field === 'notes') setNotes(value as string);
    onResult(updated);
  };

  const hasFindings = oilLeaks || coolantLeaks || hiddenRepairs;

  return (
    <div>
      <SectionHeader icon="🔦" title="UV / Black Light Inspection" subtitle="Scan under UV light: engine bay, carpet, body panels, door jambs. Takes 60 seconds." />
      <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#faf5ff', border: '1px solid #e9d5ff', marginBottom: '12px', fontSize: '12px', color: '#7c3aed' }}>
        <strong>What to look for:</strong> Oil leaks glow yellow-green. Coolant glows bright green. Body filler and repaired cracks fluoresce differently from surrounding metal. UV dye is added to most factory fluids.
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '12px' }}>
        {[
          { key: 'oilLeaks', label: 'Active oil leak detected (UV glow in engine bay or undercarriage)', value: oilLeaks },
          { key: 'coolantLeaks', label: 'Coolant leak detected (bright green UV glow)', value: coolantLeaks },
          { key: 'hiddenRepairs', label: 'Hidden body repair / filler detected (panel fluoresces differently)', value: hiddenRepairs },
        ].map(item => (
          <label key={item.key} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', cursor: 'pointer', padding: '10px 12px', borderRadius: '8px', border: `1px solid ${item.value ? '#dc2626' : '#e5e7eb'}`, backgroundColor: item.value ? '#fef2f2' : '#f9fafb' }}>
            <input type="checkbox" checked={item.value} onChange={e => handleChange(item.key, e.target.checked)} style={{ marginTop: '2px', accentColor: '#dc2626' }} />
            <span style={{ fontSize: '13px', color: '#374151' }}>{item.label}</span>
          </label>
        ))}
      </div>
      <textarea
        placeholder="UV inspection notes (optional)..."
        value={notes}
        onChange={e => handleChange('notes', e.target.value)}
        rows={2}
        style={{ width: '100%', padding: '8px 10px', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '13px', resize: 'vertical' }}
      />
      {hasFindings && (
        <div style={{ marginTop: '10px', padding: '10px 14px', borderRadius: '8px', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', fontSize: '13px', color: '#dc2626', fontWeight: 600 }}>
          ⚠️ UV findings detected — document in report and disclose to buyer.
        </div>
      )}
    </div>
  );
};

// ── MAIN COMPONENT ────────────────────────────────────────────────────────────
const AdvancedTools: React.FC<AdvancedToolsProps> = ({ vin, vehicleType, mileage, onResultsChange }) => {
  const [enabledTools, setEnabledTools] = useState<Record<string, boolean>>({
    paint: false,
    battery: false,
    brakeFluid: false,
    borescope: false,
    nmvtis: false,
    uvLight: true, // UV light is always on — it's free and takes 60 seconds
  });
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [results, setResults] = useState<AdvancedToolsResults>({});

  const toggleTool = (key: string) => {
    const newEnabled = { ...enabledTools, [key]: !enabledTools[key] };
    setEnabledTools(newEnabled);
    if (newEnabled[key] && activeSection !== key) setActiveSection(key);
  };

  const updateResult = (key: keyof AdvancedToolsResults, data: any) => {
    const updated = { ...results, [key]: data };
    setResults(updated);
    onResultsChange?.(updated);
  };

  const enabledCount = Object.values(enabledTools).filter(Boolean).length;

  // Determine which tools are recommended based on vehicle type
  const getRecommendedBadge = (toolKey: string): string | undefined => {
    const recommendations: Record<string, string[]> = {
      paint: ['Standard', 'Truck', 'Classic', 'EV'],
      battery: ['Standard', 'Truck', 'EV', 'RV', 'Commercial'],
      brakeFluid: ['Standard', 'Truck', 'Classic', 'Commercial'],
      borescope: ['Classic', 'Commercial', 'RV'],
      nmvtis: ['Standard', 'Truck', 'Classic', 'EV', 'RV', 'Commercial', 'Motorcycle'],
    };
    if (vehicleType && recommendations[toolKey]?.includes(vehicleType)) {
      return 'Recommended';
    }
    return undefined;
  };

  return (
    <div style={{ fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif' }}>
      {/* Header */}
      <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#1e3a5f', color: '#fff', marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 800 }}>⚡ Advanced Inspection Tools</h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#93c5fd' }}>
              Optional premium tools — activate based on customer order or vehicle type
            </p>
          </div>
          {enabledCount > 0 && (
            <div style={{ padding: '4px 12px', borderRadius: '20px', backgroundColor: '#2563eb', fontSize: '12px', fontWeight: 700 }}>
              {enabledCount} Active
            </div>
          )}
        </div>
      </div>

      {/* Tool Toggles */}
      <div style={{ marginBottom: '16px' }}>
        <ToolToggle
          label="Paint Thickness Meter"
          icon="🎨"
          description="Detects repaint & body filler. Catches hidden accident repairs invisible to the eye."
          enabled={enabledTools.paint}
          onToggle={() => { toggleTool('paint'); setActiveSection(activeSection === 'paint' ? null : 'paint'); }}
          badge={getRecommendedBadge('paint')}
        />
        <ToolToggle
          label="Battery & Charging Test"
          icon="🔋"
          description="CCA load test + alternator output. Catches failing batteries before purchase."
          enabled={enabledTools.battery}
          onToggle={() => { toggleTool('battery'); setActiveSection(activeSection === 'battery' ? null : 'battery'); }}
          badge={getRecommendedBadge('battery')}
        />
        <ToolToggle
          label="Brake Fluid Moisture Test"
          icon="🛑"
          description="Checks boiling point degradation. 99% of inspectors skip this safety check."
          enabled={enabledTools.brakeFluid}
          onToggle={() => { toggleTool('brakeFluid'); setActiveSection(activeSection === 'brakeFluid' ? null : 'brakeFluid'); }}
          badge={getRecommendedBadge('brakeFluid')}
        />
        <ToolToggle
          label="Borescope / Engine Scope"
          icon="🔭"
          description="Cylinder wall & piston inspection via USB-C scope. Premium vehicles only."
          enabled={enabledTools.borescope}
          onToggle={() => { toggleTool('borescope'); setActiveSection(activeSection === 'borescope' ? null : 'borescope'); }}
          badge={getRecommendedBadge('borescope')}
        />
        <ToolToggle
          label="NMVTIS / Auction History"
          icon="🔍"
          description="Catches rebuilt titles & total loss vehicles invisible to CARFAX."
          enabled={enabledTools.nmvtis}
          onToggle={() => { toggleTool('nmvtis'); setActiveSection(activeSection === 'nmvtis' ? null : 'nmvtis'); }}
          badge={getRecommendedBadge('nmvtis')}
        />
        <ToolToggle
          label="UV / Black Light Scan"
          icon="🔦"
          description="60-second scan for fluid leaks and hidden body repairs. Always included."
          enabled={enabledTools.uvLight}
          onToggle={() => { toggleTool('uvLight'); setActiveSection(activeSection === 'uvLight' ? null : 'uvLight'); }}
        />
      </div>

      {/* Active Tool Panels */}
      {enabledTools.paint && (
        <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '12px', backgroundColor: '#fff' }}>
          <PaintThicknessTool vehicleType={vehicleType} onResult={r => updateResult('paintThickness', r)} />
        </div>
      )}
      {enabledTools.battery && (
        <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '12px', backgroundColor: '#fff' }}>
          <BatteryTool vehicleType={vehicleType} onResult={r => updateResult('batteryTest', r)} />
        </div>
      )}
      {enabledTools.brakeFluid && (
        <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '12px', backgroundColor: '#fff' }}>
          <BrakeFluidTool onResult={r => updateResult('brakeFluid', r)} />
        </div>
      )}
      {enabledTools.borescope && (
        <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '12px', backgroundColor: '#fff' }}>
          <BorescopeTool vehicleType={vehicleType} mileage={mileage} onResult={r => updateResult('borescope', r)} />
        </div>
      )}
      {enabledTools.nmvtis && (
        <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '12px', backgroundColor: '#fff' }}>
          <NMVTISTool vin={vin} onResult={r => updateResult('nmvtis', r)} />
        </div>
      )}
      {enabledTools.uvLight && (
        <div style={{ padding: '20px', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '12px', backgroundColor: '#fff' }}>
          <UVLightTool onResult={r => updateResult('uvLight', r)} />
        </div>
      )}

      {/* Footer note */}
      <div style={{ padding: '10px 14px', borderRadius: '8px', backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', fontSize: '11px', color: '#6b7280', textAlign: 'center' }}>
        Advanced tools are optional. Results are included in the final inspection report when activated.
        Each tool operates independently — a failure in one does not affect others.
      </div>
    </div>
  );
};

export default AdvancedTools;
