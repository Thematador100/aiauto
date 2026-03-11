import React, { useState } from 'react';
import { useLanguage } from '../i18n/LanguageContext';
type VehicleType = 'Standard' | 'Truck' | 'EV' | 'Commercial' | 'RV' | 'Classic' | 'Motorcycle';
import { VEHICLE_INSPECTION_TEMPLATES } from '../constants';

interface WizardProps {
  onComplete: (data: WizardData) => void;
  onCancel: () => void;
}

export interface WizardData {
  vehicle: {
    vin: string;
    make: string;
    model: string;
    year: string;
    mileage: string;
    vehicleType: VehicleType;
    color: string;
    licensePlate: string;
  };
  checklist: Record<string, 'pass' | 'fail' | 'na'>;
  notes: Record<string, string>;
  obdCodes: string[];
  fraudFlags: string[];
  customerEmail: string;
  customerName: string;
  overallCondition: 'excellent' | 'good' | 'fair' | 'poor';
}

const STEPS = ['vehicle', 'exterior', 'interior', 'mechanical', 'obd', 'fraud', 'report'] as const;
type Step = typeof STEPS[number];

const STEP_ICONS: Record<Step, string> = {
  vehicle: '🚗',
  exterior: '🔍',
  interior: '🪑',
  mechanical: '🔧',
  obd: '📡',
  fraud: '🛡️',
  report: '📄',
};

const VEHICLE_TYPES: { value: VehicleType; label: string; icon: string }[] = [
  { value: 'Standard', label: 'Car / SUV', icon: '🚗' },
  { value: 'Truck', label: 'Pickup Truck', icon: '🛻' },
  { value: 'EV', label: 'Electric Vehicle', icon: '⚡' },
  { value: 'Commercial', label: 'Commercial / 18-Wheeler', icon: '🚛' },
  { value: 'RV', label: 'RV / Motorhome', icon: '🏕️' },
  { value: 'Classic', label: 'Classic / Vintage', icon: '🏎️' },
  { value: 'Motorcycle', label: 'Motorcycle', icon: '🏍️' },
];

const OBD_ADAPTER_INFO: Record<VehicleType, { adapter: string; connector: string; note: string; warning?: string }> = {
  Standard: { adapter: 'OBDLink MX+', connector: 'OBD-II (16-pin)', note: 'Plug into the OBD-II port under the dashboard (driver\'s side). Works with iOS and Android via Bluetooth.' },
  Truck: { adapter: 'OBDLink MX+', connector: 'OBD-II (16-pin)', note: 'Plug into the OBD-II port under the dashboard. All light-duty trucks (F-150, RAM 1500, Silverado, etc.) use standard OBD-II.' },
  EV: { adapter: 'OBDLink MX+', connector: 'OBD-II (16-pin)', note: 'Works for most EVs. For Tesla, use the Tesla OBD-II adapter. Battery SoH requires the AI analysis module.' },
  Commercial: { adapter: 'J1939 Heavy-Duty Adapter', connector: '9-pin Deutsch (J1939)', note: 'Commercial trucks use the J1939 protocol — NOT OBD-II. The 9-pin Deutsch connector is typically located under the dash or on the firewall.', warning: '⚠️ DO NOT use OBDLink MX+ on 18-wheelers. It will not connect. You need a J1939-compatible adapter.' },
  RV: { adapter: 'OBDLink MX+', connector: 'OBD-II (16-pin)', note: 'Connect to the chassis OBD-II port (not the house systems). The port is usually in the cab area. House electrical, water, and HVAC systems require manual inspection.' },
  Classic: { adapter: 'OBDLink MX+ (if OBD-II equipped)', connector: 'OBD-II (1996+) or None (pre-1996)', note: 'Vehicles manufactured before 1996 do not have OBD-II. For pre-OBD classics, skip this step and rely on the visual and mechanical inspection.' },
  Motorcycle: { adapter: 'OBDLink MX+', connector: 'OBD-II or proprietary', note: 'Many modern motorcycles (2010+) support OBD-II. Check your bike\'s manual. Older bikes may not support OBD scanning.' },
};

const InspectionWizard: React.FC<WizardProps> = ({ onComplete, onCancel }) => {
  const { t, language } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  const [vinInput, setVinInput] = useState('');
  const [decoding, setDecoding] = useState(false);
  const [vinDecoded, setVinDecoded] = useState(false);

  const [vehicle, setVehicle] = useState({
    vin: '',
    make: '',
    model: '',
    year: '',
    mileage: '',
    vehicleType: 'Standard' as VehicleType,
    color: '',
    licensePlate: '',
  });

  const [checklist, setChecklist] = useState<Record<string, 'pass' | 'fail' | 'na'>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [obdCodes, setObdCodes] = useState<string[]>([]);
  const [fraudFlags, setFraudFlags] = useState<string[]>([]);
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [overallCondition, setOverallCondition] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  const [sendingReport, setSendingReport] = useState(false);
  const [reportSent, setReportSent] = useState(false);

  const stepKey = STEPS[currentStep];
  const totalSteps = STEPS.length;
  const progress = ((currentStep + 1) / totalSteps) * 100;

  const template = VEHICLE_INSPECTION_TEMPLATES[vehicle.vehicleType];
  const obdInfo = OBD_ADAPTER_INFO[vehicle.vehicleType];

  // Get checklist items for current step
  const getChecklistItems = (section: string) => {
    if (!template) return [];
    const sectionMap: Record<string, string> = {
      exterior: 'Exterior',
      interior: 'Interior',
      mechanical: 'Engine & Mechanical',
    };
    const sectionName = sectionMap[section];
    if (!sectionName) return [];
    const found = template.sections?.find((s: any) =>
      s.name?.toLowerCase().includes(sectionName.toLowerCase())
    );
    return found?.items || [];
  };

  const setChecklistItem = (item: string, value: 'pass' | 'fail' | 'na') => {
    setChecklist(prev => ({ ...prev, [item]: value }));
  };

  const setNote = (item: string, value: string) => {
    setNotes(prev => ({ ...prev, [item]: value }));
  };

  const decodeVin = async () => {
    if (vinInput.length !== 17) return;
    setDecoding(true);
    try {
      const res = await fetch(`https://vpic.nhtsa.dot.gov/api/vehicles/decodevin/${vinInput}?format=json`);
      const data = await res.json();
      const results = data.Results || [];
      const get = (var_: string) => results.find((r: any) => r.Variable === var_)?.Value || '';
      const nhtsaType = get('Vehicle Type');
      let vehicleType: VehicleType = 'Standard';
      if (nhtsaType.includes('TRUCK')) vehicleType = 'Truck';
      else if (nhtsaType.includes('MULTIPURPOSE')) vehicleType = 'Standard';
      else if (nhtsaType.includes('MOTORCYCLE')) vehicleType = 'Motorcycle';
      else if (nhtsaType.includes('BUS') || nhtsaType.includes('INCOMPLETE')) vehicleType = 'Commercial';
      const fuelType = get('Fuel Type - Primary');
      if (fuelType.includes('Electric')) vehicleType = 'EV';

      setVehicle(prev => ({
        ...prev,
        vin: vinInput,
        make: get('Make'),
        model: get('Model'),
        year: get('Model Year'),
        vehicleType,
      }));
      setVinDecoded(true);
    } catch {
      // fallback — just set VIN
      setVehicle(prev => ({ ...prev, vin: vinInput }));
    }
    setDecoding(false);
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) setCurrentStep(s => s + 1);
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(s => s - 1);
  };

  const handleFinish = () => {
    onComplete({
      vehicle,
      checklist,
      notes,
      obdCodes,
      fraudFlags,
      customerEmail,
      customerName,
      overallCondition,
    });
  };

  const handleSendReport = async () => {
    if (!customerEmail) return;
    setSendingReport(true);
    try {
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://auto.srv1171019.hstgr.cloud';
      const token = localStorage.getItem('token');
      await fetch(`${BACKEND_URL}/api/reports/send-to-customer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          customerEmail,
          customerName,
          vehicle,
          checklist,
          notes,
          obdCodes,
          overallCondition,
        }),
      });
      setReportSent(true);
    } catch {
      // silently fail — PDF download still works
    }
    setSendingReport(false);
  };

  const renderStepContent = () => {
    switch (stepKey) {
      case 'vehicle':
        return (
          <div className="space-y-5">
            <div>
              <h2 className="text-xl font-bold text-white mb-1">{t.vehicle.title}</h2>
              <p className="text-gray-400 text-sm">{t.vehicle.subtitle}</p>
            </div>

            {/* VIN Decoder */}
            <div className="bg-gray-800 rounded-xl p-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">{t.vehicle.vinLabel}</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  maxLength={17}
                  value={vinInput}
                  onChange={e => setVinInput(e.target.value.toUpperCase())}
                  placeholder={t.vehicle.vinPlaceholder}
                  className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm font-mono border border-gray-600 focus:border-blue-500 focus:outline-none"
                />
                <button
                  onClick={decodeVin}
                  disabled={vinInput.length !== 17 || decoding}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  {decoding ? t.vehicle.decoding : t.vehicle.decodeVin}
                </button>
              </div>
              {vinDecoded && (
                <div className="mt-2 flex items-center gap-2 text-green-400 text-sm">
                  <span>✅</span>
                  <span>{vehicle.year} {vehicle.make} {vehicle.model} — {VEHICLE_TYPES.find(v => v.value === vehicle.vehicleType)?.label}</span>
                </div>
              )}
            </div>

            {/* Vehicle Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t.vehicle.vehicleType}</label>
              <div className="grid grid-cols-2 gap-2">
                {VEHICLE_TYPES.map(vt => (
                  <button
                    key={vt.value}
                    onClick={() => setVehicle(prev => ({ ...prev, vehicleType: vt.value }))}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all ${
                      vehicle.vehicleType === vt.value
                        ? 'border-blue-500 bg-blue-900/30 text-white'
                        : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500'
                    }`}
                  >
                    <span className="text-xl">{vt.icon}</span>
                    <span className="text-sm font-medium">{vt.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Manual Fields */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'make', label: t.vehicle.make },
                { key: 'model', label: t.vehicle.model },
                { key: 'year', label: t.vehicle.year },
                { key: 'mileage', label: t.vehicle.mileage },
                { key: 'color', label: t.vehicle.color },
                { key: 'licensePlate', label: t.vehicle.licensePlate },
              ].map(field => (
                <div key={field.key}>
                  <label className="block text-xs text-gray-400 mb-1">{field.label}</label>
                  <input
                    type="text"
                    value={(vehicle as any)[field.key]}
                    onChange={e => setVehicle(prev => ({ ...prev, [field.key]: e.target.value }))}
                    className="w-full bg-gray-800 text-white rounded-lg px-3 py-2 text-sm border border-gray-700 focus:border-blue-500 focus:outline-none"
                  />
                </div>
              ))}
            </div>
          </div>
        );

      case 'exterior':
      case 'interior':
      case 'mechanical': {
        const items = getChecklistItems(stepKey);
        const sectionLabels: Record<string, string> = {
          exterior: language === 'es' ? 'Inspección Exterior' : 'Exterior Inspection',
          interior: language === 'es' ? 'Inspección Interior' : 'Interior Inspection',
          mechanical: language === 'es' ? 'Inspección Mecánica' : 'Mechanical Inspection',
        };
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">{sectionLabels[stepKey]}</h2>
            {items.length === 0 ? (
              <div className="text-gray-400 text-sm">
                {language === 'es' ? 'No hay elementos para este tipo de vehículo.' : 'No items for this vehicle type.'}
              </div>
            ) : (
              <div className="space-y-3">
                {items.map((item: string) => (
                  <div key={item} className="bg-gray-800 rounded-xl p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white font-medium">{item}</span>
                      <div className="flex gap-1">
                        {(['pass', 'fail', 'na'] as const).map(val => (
                          <button
                            key={val}
                            onClick={() => setChecklistItem(item, val)}
                            className={`px-2 py-1 rounded text-xs font-bold transition-all ${
                              checklist[item] === val
                                ? val === 'pass' ? 'bg-green-600 text-white'
                                  : val === 'fail' ? 'bg-red-600 text-white'
                                  : 'bg-gray-500 text-white'
                                : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                            }`}
                          >
                            {val === 'pass' ? t.checklist.pass : val === 'fail' ? t.checklist.fail : t.checklist.na}
                          </button>
                        ))}
                      </div>
                    </div>
                    {checklist[item] === 'fail' && (
                      <input
                        type="text"
                        placeholder={t.checklist.addNote}
                        value={notes[item] || ''}
                        onChange={e => setNote(item, e.target.value)}
                        className="w-full bg-gray-700 text-white rounded px-2 py-1 text-xs border border-gray-600 focus:border-red-500 focus:outline-none"
                      />
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      }

      case 'obd':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">{t.obd.title}</h2>

            {/* Adapter guidance */}
            <div className={`rounded-xl p-4 ${obdInfo.warning ? 'bg-red-900/30 border border-red-700' : 'bg-blue-900/30 border border-blue-700'}`}>
              <div className="flex items-start gap-3">
                <span className="text-2xl">{obdInfo.warning ? '⚠️' : '🔌'}</span>
                <div>
                  <div className="font-bold text-white text-sm">{t.obd.adapterTitle}: {obdInfo.adapter}</div>
                  <div className="text-xs text-gray-300 mt-1">{obdInfo.connector}</div>
                  {obdInfo.warning && (
                    <div className="text-red-300 text-xs font-semibold mt-2">{obdInfo.warning}</div>
                  )}
                  <div className="text-gray-400 text-xs mt-2">{obdInfo.note}</div>
                </div>
              </div>
            </div>

            {/* DTC codes input */}
            <div className="bg-gray-800 rounded-xl p-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {language === 'es' ? 'Códigos DTC encontrados (uno por línea)' : 'DTC Codes Found (one per line)'}
              </label>
              <textarea
                rows={4}
                placeholder={language === 'es' ? 'P0300\nP0420\n...' : 'P0300\nP0420\n...'}
                value={obdCodes.join('\n')}
                onChange={e => setObdCodes(e.target.value.split('\n').filter(Boolean))}
                className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm font-mono border border-gray-600 focus:border-blue-500 focus:outline-none"
              />
              {obdCodes.length > 0 && (
                <div className="mt-2 text-yellow-400 text-sm font-semibold">
                  ⚠️ {obdCodes.length} {t.obd.faultsFound}
                </div>
              )}
              {obdCodes.length === 0 && (
                <div className="mt-2 text-green-400 text-sm">✅ {t.obd.noFaults}</div>
              )}
            </div>
          </div>
        );

      case 'fraud':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-white">
              {language === 'es' ? '🛡️ Detección de Fraude y Daños' : '🛡️ Fraud & Damage Detection'}
            </h2>
            <p className="text-gray-400 text-sm">
              {language === 'es'
                ? 'Marca cualquier señal de alerta que hayas observado durante la inspección.'
                : 'Check any red flags you observed during the inspection.'}
            </p>

            {[
              { key: 'odometer', label: language === 'es' ? 'Posible retroceso de odómetro' : 'Possible odometer rollback', icon: '📏' },
              { key: 'flood', label: language === 'es' ? 'Señales de daño por inundación' : 'Signs of flood damage', icon: '💧' },
              { key: 'paint', label: language === 'es' ? 'Pintura inconsistente / repintado' : 'Inconsistent paint / respray', icon: '🎨' },
              { key: 'frame', label: language === 'es' ? 'Daño estructural / chasis doblado' : 'Frame damage / bent chassis', icon: '🔩' },
              { key: 'vin', label: language === 'es' ? 'VIN alterado o ilegible' : 'Altered or illegible VIN', icon: '🔍' },
              { key: 'title', label: language === 'es' ? 'Historial de título sospechoso' : 'Suspicious title history', icon: '📋' },
              { key: 'airbag', label: language === 'es' ? 'Airbags desplegados / reemplazados' : 'Deployed / replaced airbags', icon: '💥' },
              { key: 'rust', label: language === 'es' ? 'Óxido severo / corrosión' : 'Severe rust / corrosion', icon: '🦠' },
            ].map(flag => (
              <button
                key={flag.key}
                onClick={() => setFraudFlags(prev =>
                  prev.includes(flag.key) ? prev.filter(f => f !== flag.key) : [...prev, flag.key]
                )}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                  fraudFlags.includes(flag.key)
                    ? 'border-red-500 bg-red-900/30 text-white'
                    : 'border-gray-700 bg-gray-800 text-gray-400 hover:border-gray-500'
                }`}
              >
                <span className="text-xl">{flag.icon}</span>
                <span className="text-sm font-medium">{flag.label}</span>
                {fraudFlags.includes(flag.key) && <span className="ml-auto text-red-400">⚠️ FLAGGED</span>}
              </button>
            ))}
          </div>
        );

      case 'report':
        return (
          <div className="space-y-5">
            <h2 className="text-xl font-bold text-white">{t.report.title}</h2>

            {/* Overall condition */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">{t.report.overall}</label>
              <div className="grid grid-cols-4 gap-2">
                {(['excellent', 'good', 'fair', 'poor'] as const).map(cond => (
                  <button
                    key={cond}
                    onClick={() => setOverallCondition(cond)}
                    className={`p-2 rounded-xl border-2 text-center text-sm font-bold transition-all ${
                      overallCondition === cond
                        ? cond === 'excellent' ? 'border-green-500 bg-green-900/30 text-green-400'
                          : cond === 'good' ? 'border-blue-500 bg-blue-900/30 text-blue-400'
                          : cond === 'fair' ? 'border-yellow-500 bg-yellow-900/30 text-yellow-400'
                          : 'border-red-500 bg-red-900/30 text-red-400'
                        : 'border-gray-700 bg-gray-800 text-gray-400'
                    }`}
                  >
                    {(t.report as any)[cond]}
                  </button>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="bg-gray-800 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{language === 'es' ? 'Vehículo' : 'Vehicle'}</span>
                <span className="text-white font-medium">{vehicle.year} {vehicle.make} {vehicle.model}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{language === 'es' ? 'Tipo' : 'Type'}</span>
                <span className="text-white">{VEHICLE_TYPES.find(v => v.value === vehicle.vehicleType)?.label}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{language === 'es' ? 'Elementos fallidos' : 'Failed items'}</span>
                <span className={`font-bold ${Object.values(checklist).filter(v => v === 'fail').length > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {Object.values(checklist).filter(v => v === 'fail').length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{language === 'es' ? 'Códigos DTC' : 'DTC Codes'}</span>
                <span className={`font-bold ${obdCodes.length > 0 ? 'text-yellow-400' : 'text-green-400'}`}>
                  {obdCodes.length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">{language === 'es' ? 'Señales de fraude' : 'Fraud flags'}</span>
                <span className={`font-bold ${fraudFlags.length > 0 ? 'text-red-400' : 'text-green-400'}`}>
                  {fraudFlags.length}
                </span>
              </div>
            </div>

            {/* Send to customer */}
            <div className="bg-gray-800 rounded-xl p-4 space-y-3">
              <h3 className="text-sm font-bold text-white">{t.report.sendToCustomer}</h3>
              <div>
                <label className="block text-xs text-gray-400 mb-1">{t.report.customerName}</label>
                <input
                  type="text"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder={language === 'es' ? 'Juan García' : 'John Smith'}
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">{t.report.customerEmail}</label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={e => setCustomerEmail(e.target.value)}
                  className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:border-blue-500 focus:outline-none"
                  placeholder={language === 'es' ? 'cliente@email.com' : 'customer@email.com'}
                />
              </div>
              <button
                onClick={handleSendReport}
                disabled={!customerEmail || sendingReport || reportSent}
                className={`w-full py-2 rounded-lg text-sm font-bold transition-all ${
                  reportSent ? 'bg-green-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white'
                }`}
              >
                {reportSent ? `✅ ${t.report.sent}` : sendingReport ? t.report.sending : t.report.sendBtn}
              </button>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <button onClick={onCancel} className="text-gray-400 hover:text-white text-sm">
            ✕ {t.common.cancel}
          </button>
          <span className="text-white font-bold text-sm">{t.wizard.title}</span>
          <span className="text-gray-400 text-sm">{t.wizard.step} {currentStep + 1} {t.wizard.of} {totalSteps}</span>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="flex justify-between mt-2">
          {STEPS.map((step, idx) => (
            <div
              key={step}
              className={`flex flex-col items-center ${idx <= currentStep ? 'text-blue-400' : 'text-gray-600'}`}
            >
              <span className="text-lg">{STEP_ICONS[step]}</span>
              <span className="text-xs hidden sm:block">{(t.wizard.steps as any)[step]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 pb-24">
        {renderStepContent()}
      </div>

      {/* Footer navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-800 border-t border-gray-700 px-4 py-3 flex gap-3">
        {currentStep > 0 && (
          <button
            onClick={handleBack}
            className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl font-semibold transition-colors"
          >
            {t.wizard.back}
          </button>
        )}
        {currentStep < totalSteps - 1 ? (
          <button
            onClick={handleNext}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-colors"
          >
            {t.wizard.next}
          </button>
        ) : (
          <button
            onClick={handleFinish}
            className="flex-1 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold transition-colors"
          >
            {t.wizard.finish}
          </button>
        )}
      </div>
    </div>
  );
};

export default InspectionWizard;
