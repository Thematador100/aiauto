import React, { useState, useRef, useCallback } from 'react';
import { InspectionState, InspectionPhoto, ConditionRating, InspectionChecklistItem } from '../types';
import { useInspectionState, VehicleType } from '../hooks/useInspectionState';
import { VINScanner } from './VINScanner';
import { DecodedVehicle } from '../services/vehicleDataService';
import { VEHICLE_INSPECTION_TEMPLATES, DEALER_TRICKS } from '../constants';
import { resizeAndCompressImage } from '../services/imageOptimizer';
import { AudioRecorder } from './AudioRecorder';
import { LoadingSpinner } from './LoadingSpinner';
import { FraudDetection } from './FraudDetection';
import { GuidedPhotoModal } from './GuidedPhotoModal';
import { getPhotoGuidance } from '../services/photoGuidance';

interface InspectionFormProps {
  onFinalize: (state: InspectionState) => void;
}

const vehicleTypes = Object.keys(VEHICLE_INSPECTION_TEMPLATES) as VehicleType[];

export const VEHICLE_TYPE_LABELS: Record<string, string> = {
  Standard: 'Standard (Car / SUV)',
  Truck: 'Truck (Pickup / Light-Duty)',
  EV: 'Electric Vehicle (EV)',
  Commercial: 'Commercial / 18-Wheeler',
  RV: 'RV / Motorhome / Travel Trailer',
  Classic: 'Classic / Vintage / Collector',
  Motorcycle: 'Motorcycle',
};

const VEHICLE_TYPE_ICONS: Record<string, string> = {
  Standard: '🚗',
  Truck: '🛻',
  EV: '⚡',
  Commercial: '🚛',
  RV: '🏕️',
  Classic: '🏎️',
  Motorcycle: '🏍️',
};

const COMPLIANCE_SECTION_LABELS: Record<string, string> = {
  Commercial: 'DOT / FMCSA Compliance',
  RV: 'Habitability & Safety Systems',
  Classic: 'Authenticity & Provenance',
};

const CONDITION_OPTIONS: { value: ConditionRating; label: string; color: string }[] = [
  { value: 'pass', label: 'Pass', color: 'bg-green-600 text-white' },
  { value: 'fail', label: 'Fail', color: 'bg-red-600 text-white' },
  { value: 'concern', label: 'Concern', color: 'bg-yellow-600 text-white' },
  { value: 'na', label: 'N/A', color: 'bg-gray-600 text-white' },
];

const ConditionSelector: React.FC<{
  value: ConditionRating;
  onChange: (condition: ConditionRating) => void;
}> = ({ value, onChange }) => (
  <div className="flex gap-1 flex-wrap">
    {CONDITION_OPTIONS.map((opt) => (
      <button
        key={opt.value}
        type="button"
        onClick={() => onChange(value === opt.value ? 'unchecked' : opt.value)}
        className={`text-xs font-semibold py-1.5 px-3 rounded-lg transition-colors ${
          value === opt.value ? opt.color : 'bg-dark-bg text-medium-text border border-dark-border hover:border-primary'
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

// ─── Checklist Item Row ─────────────────────────────────────────────────────
const ChecklistItemRow: React.FC<{
  item: InspectionChecklistItem;
  category: string;
  index: number;
  isUploading: boolean;
  onUpdate: (category: string, index: number, updates: Partial<InspectionChecklistItem>) => void;
  onTriggerPhotoModal: (category: string, index: number) => void;
  onRemovePhoto: (category: string, index: number, photoId: string) => void;
  onAudioReady: (category: string, index: number, audio: any) => void;
}> = ({ item, category, index, isUploading, onUpdate, onTriggerPhotoModal, onRemovePhoto, onAudioReady }) => {
  const guidance = getPhotoGuidance(item.item);
  const photoCount = item.photos.length;
  const [lightboxPhoto, setLightboxPhoto] = useState<string | null>(null);

  return (
    <div className="border-t border-dark-border pt-4">
      {/* Lightbox */}
      {lightboxPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxPhoto(null)}
        >
          <img src={lightboxPhoto} alt="Inspection" className="max-w-full max-h-full rounded-xl shadow-2xl" />
          <button
            className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2"
            onClick={() => setLightboxPhoto(null)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
        <label className="flex items-center space-x-3 flex-1 cursor-pointer">
          <input
            type="checkbox"
            checked={item.checked}
            onChange={(e) => onUpdate(category, index, {
              checked: e.target.checked,
              condition: e.target.checked && item.condition === 'unchecked' ? 'pass' : item.condition,
            })}
            className="h-5 w-5 rounded bg-dark-bg border-dark-border text-primary focus:ring-primary flex-shrink-0"
          />
          <span className={`text-light-text font-medium ${item.condition === 'fail' ? 'text-red-400' : item.condition === 'concern' ? 'text-yellow-400' : ''}`}>
            {item.item}
          </span>
        </label>
        <ConditionSelector
          value={item.condition}
          onChange={(condition) => onUpdate(category, index, { condition, checked: condition !== 'unchecked' })}
        />
      </div>

      <div className="pl-2 mt-3 space-y-3">
        {/* AI Photo Guidance hint */}
        {guidance && (
          <div className="bg-blue-950/40 border border-blue-800/40 rounded-lg px-3 py-2 text-xs text-blue-300 flex items-start gap-2">
            <span className="text-blue-400 mt-0.5 flex-shrink-0">📷</span>
            <span className="leading-relaxed">{guidance.instruction.split('.')[0]}.</span>
          </div>
        )}

        <textarea
          placeholder="Add notes..."
          value={item.notes}
          onChange={(e) => onUpdate(category, index, { notes: e.target.value })}
          className="w-full bg-dark-bg border border-dark-border rounded-lg p-2.5 focus:ring-2 focus:ring-primary focus:border-primary transition text-light-text text-sm"
          rows={2}
        />

        <div className="flex items-center gap-3 flex-wrap">
          {/* Guided Photo Button */}
          <button
            onClick={() => onTriggerPhotoModal(category, index)}
            disabled={isUploading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold py-2.5 px-4 rounded-xl text-sm transition-colors disabled:bg-gray-500 shadow-sm"
          >
            {isUploading ? <LoadingSpinner /> : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {photoCount > 0 ? `Photos (${photoCount}) · Add More` : 'Take / Add Photo'}
                {guidance?.required && photoCount === 0 && (
                  <span className="bg-yellow-500 text-yellow-900 text-xs font-bold px-1.5 py-0.5 rounded-full ml-1">Required</span>
                )}
              </>
            )}
          </button>

          <AudioRecorder
            onAudioReady={(audio) => onAudioReady(category, index, audio)}
            hasAudio={!!item.audio}
          />
        </div>

        {/* Photo Grid */}
        {photoCount > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2 mt-1">
            {item.photos.map(photo => (
              <div key={photo.id} className="relative rounded-xl overflow-hidden border border-dark-border shadow-sm">
                <img
                  src={`data:${photo.mimeType};base64,${photo.base64}`}
                  alt="Inspection"
                  className="object-cover w-full h-24 sm:h-28 cursor-pointer"
                  onClick={() => setLightboxPhoto(`data:${photo.mimeType};base64,${photo.base64}`)}
                />
                {/* Always-visible delete — no hover required on mobile */}
                <button
                  onClick={() => onRemovePhoto(category, index, photo.id)}
                  className="absolute top-1 right-1 bg-red-600 hover:bg-red-700 text-white rounded-full p-1 shadow-lg transition-colors"
                  aria-label="Remove photo"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                {/* Expand icon */}
                <div className="absolute bottom-1 left-1 bg-black/50 rounded p-0.5 pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Dealer Tricks Alert Panel ──────────────────────────────────────────────
const DealerTricksPanel: React.FC<{ vehicleType: string }> = ({ vehicleType }) => {
  const [dismissed, setDismissed] = useState(false);
  const tricks = DEALER_TRICKS[vehicleType] || DEALER_TRICKS['Standard'];

  if (dismissed) return null;

  return (
    <div className="bg-yellow-900/20 border border-yellow-600/40 rounded-lg p-4">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 text-lg">⚠️</span>
          <div>
            <h3 className="text-yellow-300 font-bold text-sm">Dealer Tricks to Watch For</h3>
            <p className="text-yellow-400/70 text-xs">Common fraud tactics for {VEHICLE_TYPE_LABELS[vehicleType] || vehicleType}</p>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-yellow-400/50 hover:text-yellow-400 text-xs ml-4 shrink-0"
        >
          Dismiss
        </button>
      </div>
      <ul className="space-y-1.5">
        {tricks.map((trick, i) => (
          <li key={i} className="flex items-start gap-2 text-xs text-yellow-200/80">
            <span className="text-yellow-500 mt-0.5 shrink-0">•</span>
            <span>{trick}</span>
          </li>
        ))}
      </ul>
    </div>
  );
};

// ─── Main InspectionForm ────────────────────────────────────────────────────
export const InspectionForm: React.FC<InspectionFormProps> = ({ onFinalize }) => {
  const {
    inspectionState,
    initializeState,
    updateChecklistItem,
    setOdometer,
    setOverallNotes,
    addPhotoToChecklistItem,
    removePhotoFromChecklistItem,
    addAudioToChecklistItem,
  } = useInspectionState();

  const [vin, setVin] = useState('');
  const [selectedVehicleType, setSelectedVehicleType] = useState<VehicleType>('Standard');
  const [decodedVehicle, setDecodedVehicle] = useState<(DecodedVehicle & { vin: string }) | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState<{ [key: string]: boolean }>({});
  const [showAdvancedAnalysis, setShowAdvancedAnalysis] = useState(false);
  // Inspection mode: 'standard' = basic docs + OBD; 'advanced' = full AI damage/fraud analysis
  const [inspectionMode, setInspectionMode] = useState<'standard' | 'advanced'>('standard');

  // Guided photo modal state
  const [guidedModalOpen, setGuidedModalOpen] = useState(false);
  const [guidedModalContext, setGuidedModalContext] = useState<{ category: string; itemIndex: number; itemName: string } | null>(null);

  // Legacy file input (fallback)
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentPhotoContext = useRef<{ category: string; itemIndex: number } | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !currentPhotoContext.current) return;
    const file = event.target.files[0];
    const { category, itemIndex } = currentPhotoContext.current;
    const uploadKey = `${category}-${itemIndex}`;
    setIsUploading(prev => ({ ...prev, [uploadKey]: true }));
    try {
      const { base64, mimeType } = await resizeAndCompressImage(file);
      const photo: InspectionPhoto = {
        id: `${Date.now()}-${Math.random()}`,
        category,
        base64,
        mimeType,
        notes: ''
      };
      addPhotoToChecklistItem(category, itemIndex, photo);
    } catch (err) {
      console.error('Error processing image:', err);
      alert('Failed to process image. Please try a different file.');
    } finally {
      setIsUploading(prev => ({ ...prev, [uploadKey]: false }));
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Open the guided photo modal for a checklist item
  const triggerPhotoModal = useCallback((category: string, itemIndex: number) => {
    if (!inspectionState) return;
    const categoryItems = inspectionState.checklist[category];
    const itemName = categoryItems?.[itemIndex]?.item || category;
    setGuidedModalContext({ category, itemIndex, itemName });
    setGuidedModalOpen(true);
  }, [inspectionState]);

  // Handle photo captured from the guided modal
  const handleGuidedPhotoCapture = useCallback(async (base64DataUrl: string) => {
    if (!guidedModalContext) return;
    const { category, itemIndex } = guidedModalContext;
    const uploadKey = `${category}-${itemIndex}`;
    setIsUploading(prev => ({ ...prev, [uploadKey]: true }));
    try {
      // Strip the data URL prefix to get pure base64
      const base64 = base64DataUrl.split(',')[1] || base64DataUrl;
      const mimeType = base64DataUrl.startsWith('data:') ? base64DataUrl.split(';')[0].split(':')[1] : 'image/jpeg';
      const photo: InspectionPhoto = {
        id: `${Date.now()}-${Math.random()}`,
        category,
        base64,
        mimeType,
        notes: ''
      };
      addPhotoToChecklistItem(category, itemIndex, photo);
    } catch (err) {
      console.error('Error saving guided photo:', err);
    } finally {
      setIsUploading(prev => ({ ...prev, [uploadKey]: false }));
    }
  }, [guidedModalContext, addPhotoToChecklistItem]);

  // Handle VIN decode — auto-set vehicle type from NHTSA suggestion
  const handleVinDecoded = (vehicle: DecodedVehicle & { vin: string }) => {
    setDecodedVehicle(vehicle);
    setSelectedVehicleType(vehicle.suggestedVehicleType as VehicleType);
    initializeState(vehicle, vehicle.suggestedVehicleType as VehicleType);
  };

  if (!inspectionState) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">

        {/* ─── Inspection Mode Selector ─── */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-5">
          <h3 className="text-light-text font-bold text-base mb-1">Select Inspection Type</h3>
          <p className="text-medium-text text-xs mb-4">Choose based on what the client needs. You can always upgrade later.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              onClick={() => setInspectionMode('standard')}
              className={`flex flex-col gap-2 p-4 rounded-xl border-2 text-left transition-all ${
                inspectionMode === 'standard'
                  ? 'border-blue-500 bg-blue-950/40'
                  : 'border-dark-border bg-dark-bg hover:border-blue-500/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">📋</span>
                <span className="text-light-text font-bold text-sm">Standard Inspection</span>
                {inspectionMode === 'standard' && <span className="ml-auto bg-blue-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">Selected</span>}
              </div>
              <p className="text-medium-text text-xs leading-relaxed">Guided photo documentation, full checklist, OBD diagnostic data, and a clean professional report. Perfect for routine pre-purchase inspections.</p>
              <p className="text-blue-400 text-xs font-semibold">✓ Guided photos &nbsp;✓ OBD data &nbsp;✓ Pass/Fail report</p>
            </button>

            <button
              onClick={() => setInspectionMode('advanced')}
              className={`flex flex-col gap-2 p-4 rounded-xl border-2 text-left transition-all ${
                inspectionMode === 'advanced'
                  ? 'border-purple-500 bg-purple-950/40'
                  : 'border-dark-border bg-dark-bg hover:border-purple-500/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">🤖</span>
                <span className="text-light-text font-bold text-sm">Advanced AI Inspection</span>
                {inspectionMode === 'advanced' && <span className="ml-auto bg-purple-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">Selected</span>}
              </div>
              <p className="text-medium-text text-xs leading-relaxed">Everything in Standard PLUS deep AI visual analysis: hidden damage detection, paint overspray, flood indicators, frame analysis, fraud flags, and repair cost estimates.</p>
              <p className="text-purple-400 text-xs font-semibold">✓ All Standard features &nbsp;✓ Hidden damage AI &nbsp;✓ Fraud detection &nbsp;✓ Repair estimates</p>
            </button>
          </div>
        </div>

        {/* VIN Scanner — auto-detects vehicle type */}
        <VINScanner
          onVinDecoded={handleVinDecoded}
          onManualEntry={(v) => {
            setVin(v);
            setError(null);
          }}
        />
        {/* Manual vehicle type selector */}
        <div className="bg-dark-card border border-dark-border rounded-xl p-5 space-y-4">
          <h3 className="text-light-text font-semibold text-base">Or select vehicle type manually</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {vehicleTypes.map((type) => (
              <button
                key={type}
                onClick={() => {
                  setSelectedVehicleType(type);
                  initializeState({ vin: vin || 'MANUAL', make: '', model: '', year: '', suggestedVehicleType: type } as any, type);
                }}
                className={`flex flex-col items-center justify-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  selectedVehicleType === type
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-dark-border bg-dark-bg text-medium-text hover:border-primary/50'
                }`}
              >
                <span className="text-3xl">{VEHICLE_TYPE_ICONS[type]}</span>
                <span className="text-xs font-semibold text-center leading-tight">{VEHICLE_TYPE_LABELS[type]}</span>
              </button>
            ))}
          </div>
        </div>
        {error && <p className="text-red-500 text-sm text-center bg-red-900/20 border border-red-700/40 rounded p-2">{error}</p>}
      </div>
    );
  }

  const categories = Object.keys(inspectionState.checklist);
  const totalItems = categories.reduce((sum, cat) => sum + inspectionState.checklist[cat].length, 0);
  const checkedItems = categories.reduce((sum, cat) => sum + inspectionState.checklist[cat].filter(i => i.checked).length, 0);
  const failItems = categories.reduce((sum, cat) => sum + inspectionState.checklist[cat].filter(i => i.condition === 'fail').length, 0);
  const concernItems = categories.reduce((sum, cat) => sum + inspectionState.checklist[cat].filter(i => i.condition === 'concern').length, 0);
  const totalPhotos = categories.reduce((sum, cat) => sum + inspectionState.checklist[cat].reduce((s, i) => s + i.photos.length, 0), 0);
  const progressPct = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  const handleFinalizeClick = () => {
    if (checkedItems === 0) {
      setError('Please complete at least one checklist item before finalizing.');
      return;
    }
    setError(null);
    onFinalize(inspectionState);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">

      {/* Guided Photo Modal */}
      {guidedModalOpen && guidedModalContext && (
        <GuidedPhotoModal
          itemName={guidedModalContext.itemName}
          category={guidedModalContext.category}
          existingPhotoCount={
            inspectionState.checklist[guidedModalContext.category]?.[guidedModalContext.itemIndex]?.photos.length ?? 0
          }
          onPhotoCapture={handleGuidedPhotoCapture}
          onClose={() => setGuidedModalOpen(false)}
        />
      )}

      {/* Sticky Progress Bar */}
      <div className="sticky top-0 z-30 bg-dark-card/95 backdrop-blur border border-dark-border rounded-xl p-4 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <div>
            <p className="text-light-text font-bold text-sm">
              {inspectionState.vehicle.year} {inspectionState.vehicle.make} {inspectionState.vehicle.model}
            </p>
            <p className="text-medium-text text-xs">{inspectionState.vehicle.vin}</p>
          </div>
          <div className="text-right">
            <p className="text-light-text font-bold text-lg">{progressPct}%</p>
            <p className="text-medium-text text-xs">{checkedItems}/{totalItems} items</p>
          </div>
        </div>
        <div className="w-full bg-dark-bg rounded-full h-2.5 mb-2">
          <div
            className={`h-2.5 rounded-full transition-all duration-500 ${progressPct === 100 ? 'bg-green-500' : 'bg-primary'}`}
            style={{ width: `${progressPct}%` }}
          />
        </div>
        <div className="flex gap-4 text-xs">
          {failItems > 0 && <span className="text-red-400 font-semibold">⛔ {failItems} Fail{failItems !== 1 ? 's' : ''}</span>}
          {concernItems > 0 && <span className="text-yellow-400 font-semibold">⚠️ {concernItems} Concern{concernItems !== 1 ? 's' : ''}</span>}
          <span className="text-blue-400 font-semibold">📷 {totalPhotos} Photo{totalPhotos !== 1 ? 's' : ''}</span>
          {failItems === 0 && concernItems === 0 && checkedItems > 0 && <span className="text-green-400 font-semibold">✅ Looking good</span>}
        </div>
      </div>

      {/* Dealer Tricks Panel */}
      <DealerTricksPanel vehicleType={selectedVehicleType} />

      {/* Odometer */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <label className="block text-light-text font-semibold mb-2 text-sm">Odometer Reading</label>
        <input
          type="number"
          placeholder="Enter mileage..."
          value={inspectionState.odometer || ''}
          onChange={(e) => setOdometer(Number(e.target.value))}
          className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-light-text focus:ring-2 focus:ring-primary focus:border-primary transition text-base"
        />
      </div>

      {/* Checklist Categories */}
      {categories.map((category, catIdx) => {
        const isComplianceSection = category === 'compliance' || category === 'Compliance';
        const sectionLabel = COMPLIANCE_SECTION_LABELS[selectedVehicleType] || category;
        const items = inspectionState.checklist[category];
        const catChecked = items.filter(i => i.checked).length;
        const catFails = items.filter(i => i.condition === 'fail').length;
        const catConcerns = items.filter(i => i.condition === 'concern').length;
        const catPhotos = items.reduce((s, i) => s + i.photos.length, 0);

        return (
          <div key={category} className="bg-dark-card border border-dark-border rounded-xl overflow-hidden">
            {/* Category Header */}
            <div className="px-5 py-4 bg-dark-bg/50 border-b border-dark-border flex items-center justify-between">
              <div>
                <h3 className="text-light-text font-bold text-base capitalize">
                  {isComplianceSection ? sectionLabel : category}
                </h3>
                <p className="text-medium-text text-xs mt-0.5">
                  {catChecked}/{items.length} completed
                  {catPhotos > 0 && ` · 📷 ${catPhotos}`}
                </p>
              </div>
              <div className="flex gap-2">
                {catFails > 0 && <span className="bg-red-900/40 text-red-400 text-xs font-bold px-2 py-1 rounded-full">⛔ {catFails}</span>}
                {catConcerns > 0 && <span className="bg-yellow-900/40 text-yellow-400 text-xs font-bold px-2 py-1 rounded-full">⚠️ {catConcerns}</span>}
                {catChecked === items.length && items.length > 0 && <span className="bg-green-900/40 text-green-400 text-xs font-bold px-2 py-1 rounded-full">✅ Done</span>}
              </div>
            </div>

            {/* Items */}
            <div className="p-5 space-y-2">
              {items.map((item, itemIdx) => (
                <ChecklistItemRow
                  key={`${category}-${itemIdx}`}
                  item={item}
                  category={category}
                  index={itemIdx}
                  isUploading={!!isUploading[`${category}-${itemIdx}`]}
                  onUpdate={updateChecklistItem}
                  onTriggerPhotoModal={triggerPhotoModal}
                  onRemovePhoto={removePhotoFromChecklistItem}
                  onAudioReady={addAudioToChecklistItem}
                />
              ))}
            </div>
          </div>
        );
      })}

      {/* Advanced AI Analysis — only shown when Advanced mode is selected */}
      {decodedVehicle && inspectionMode === 'advanced' && (
        <div className="bg-dark-card border border-purple-700/40 rounded-xl overflow-hidden">
          <button
            onClick={() => setShowAdvancedAnalysis(!showAdvancedAnalysis)}
            className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-dark-bg/30 transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-2xl">🤖</span>
              <div>
                <h3 className="text-light-text font-bold text-base">Advanced AI Analysis</h3>
                <p className="text-medium-text text-xs">Hidden damage detection, fraud flags, repair cost estimates</p>
              </div>
            </div>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className={`h-5 w-5 text-medium-text transition-transform ${showAdvancedAnalysis ? 'rotate-180' : ''}`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
          {showAdvancedAnalysis && (
            <div className="border-t border-dark-border p-5">
              <FraudDetection vehicle={decodedVehicle} inspectionState={inspectionState} />
            </div>
          )}
        </div>
      )}

      {/* Standard mode — subtle note that advanced analysis is not included */}
      {decodedVehicle && inspectionMode === 'standard' && (
        <div className="bg-dark-bg border border-dark-border rounded-xl px-5 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-lg">📋</span>
            <p className="text-medium-text text-sm">Running in <span className="text-light-text font-semibold">Standard</span> mode — AI damage &amp; fraud analysis is off.</p>
          </div>
          <button
            onClick={() => setInspectionMode('advanced')}
            className="text-xs font-semibold text-purple-400 hover:text-purple-300 whitespace-nowrap border border-purple-700/40 rounded-lg px-3 py-1.5 transition-colors"
          >
            Upgrade to Advanced
          </button>
        </div>
      )}

      {/* Overall Notes */}
      <div className="bg-dark-card border border-dark-border rounded-xl p-5">
        <label className="block text-light-text font-semibold mb-2 text-sm">Overall Inspector Notes</label>
        <textarea
          placeholder="Add any overall observations, recommendations, or notes about this vehicle..."
          value={inspectionState.overallNotes || ''}
          onChange={(e) => setOverallNotes(e.target.value)}
          className="w-full bg-dark-bg border border-dark-border rounded-lg p-3 text-light-text focus:ring-2 focus:ring-primary focus:border-primary transition text-sm"
          rows={4}
        />
      </div>

      {error && <p className="text-red-500 text-sm text-center bg-red-900/20 border border-red-700/40 rounded p-2">{error}</p>}

      {/* Finalize Button */}
      <div className="flex justify-end p-4">
        <button
          onClick={handleFinalizeClick}
          className="bg-primary hover:bg-primary-light text-white font-bold py-4 px-10 rounded-xl transition-colors text-lg shadow-lg"
        >
          Finalize &amp; Generate Report →
        </button>
      </div>

      {/* Legacy hidden file input (fallback) */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        className="hidden"
        accept="image/*"
      />
    </div>
  );
};
