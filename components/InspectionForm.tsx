import React, { useState, useRef } from 'react';
import { InspectionState, InspectionPhoto, ConditionRating, InspectionChecklistItem } from '../types';
import { useInspectionState, VehicleType } from '../hooks/useInspectionState';
import { VINScanner } from './VINScanner';
import { DecodedVehicle } from '../services/vehicleDataService';
import { VEHICLE_INSPECTION_TEMPLATES, DEALER_TRICKS } from '../constants';
import { resizeAndCompressImage } from '../services/imageOptimizer';
import { AudioRecorder } from './AudioRecorder';
import { LoadingSpinner } from './LoadingSpinner';
import { FraudDetection } from './FraudDetection';

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
        className={`text-xs font-semibold py-1 px-2 rounded transition-colors ${
          value === opt.value ? opt.color : 'bg-dark-bg text-medium-text border border-dark-border hover:border-primary'
        }`}
      >
        {opt.label}
      </button>
    ))}
  </div>
);

const ChecklistItemRow: React.FC<{
  item: InspectionChecklistItem;
  category: string;
  index: number;
  isUploading: boolean;
  onUpdate: (category: string, index: number, updates: Partial<InspectionChecklistItem>) => void;
  onTriggerUpload: (category: string, index: number) => void;
  onRemovePhoto: (category: string, index: number, photoId: string) => void;
  onAudioReady: (category: string, index: number, audio: any) => void;
}> = ({ item, category, index, isUploading, onUpdate, onTriggerUpload, onRemovePhoto, onAudioReady }) => (
  <div className="border-t border-dark-border pt-4">
    <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
      <label className="flex items-center space-x-3 flex-1">
        <input
          type="checkbox"
          checked={item.checked}
          onChange={(e) => onUpdate(category, index, {
            checked: e.target.checked,
            condition: e.target.checked && item.condition === 'unchecked' ? 'pass' : item.condition,
          })}
          className="h-5 w-5 rounded bg-dark-bg border-dark-border text-primary focus:ring-primary"
        />
        <span className={`text-light-text ${item.condition === 'fail' ? 'text-red-400' : item.condition === 'concern' ? 'text-yellow-400' : ''}`}>
          {item.item}
        </span>
      </label>
      <ConditionSelector
        value={item.condition}
        onChange={(condition) => onUpdate(category, index, { condition, checked: condition !== 'unchecked' })}
      />
    </div>
    <div className="pl-8 mt-2 space-y-3">
      <textarea
        placeholder="Add notes..."
        value={item.notes}
        onChange={(e) => onUpdate(category, index, { notes: e.target.value })}
        className="w-full bg-dark-bg border border-dark-border rounded-md p-2 focus:ring-2 focus:ring-primary focus:border-primary transition text-light-text text-sm"
        rows={2}
      />
      <div className="flex items-center gap-4">
        <button
          onClick={() => onTriggerUpload(category, index)}
          disabled={isUploading}
          className="text-xs font-semibold py-1 px-3 rounded-md transition-colors bg-blue-600 hover:bg-blue-500 text-white flex items-center gap-1 disabled:bg-gray-500"
        >
          {isUploading ? <LoadingSpinner /> : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              Add Photo
            </>
          )}
        </button>
        <AudioRecorder
          onAudioReady={(audio) => onAudioReady(category, index, audio)}
          hasAudio={!!item.audio}
        />
      </div>
      {item.photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {item.photos.map(photo => (
            <div key={photo.id} className="relative group">
              <img src={`data:${photo.mimeType};base64,${photo.base64}`} alt="Inspection" className="rounded-md object-cover w-full h-20" />
              <button onClick={() => onRemovePhoto(category, index, photo.id)} className="absolute top-0 right-0 bg-red-600 text-white rounded-full p-0.5 m-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
);

// Dealer Tricks Alert Panel
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentPhotoContext = useRef<{ category: string; itemIndex: number } | null>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!event.target.files || event.target.files.length === 0 || !currentPhotoContext.current) {
      return;
    }
    const file = event.target.files[0];
    const { category, itemIndex } = currentPhotoContext.current;
    const uploadKey = `${category}-${itemIndex}`;

    setIsUploading(prev => ({ ...prev, [uploadKey]: true }));
    try {
      const { base64, mimeType } = await resizeAndCompressImage(file);
      const photo: InspectionPhoto = {
        id: `${Date.now()}-${Math.random()}`,
        category: category,
        base64,
        mimeType,
        notes: ''
      };
      addPhotoToChecklistItem(category, itemIndex, photo);
    } catch (err) {
      console.error("Error processing image:", err);
      alert("Failed to process image. Please try a different file.");
    } finally {
      setIsUploading(prev => ({ ...prev, [uploadKey]: false }));
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const triggerFileUpload = (category: string, itemIndex: number) => {
    currentPhotoContext.current = { category, itemIndex };
    fileInputRef.current?.click();
  };

  // Handle VIN decode — auto-set vehicle type from NHTSA suggestion
  const handleVinDecoded = (vehicle: DecodedVehicle & { vin: string }) => {
    setDecodedVehicle(vehicle);
    setSelectedVehicleType(vehicle.suggestedVehicleType as VehicleType);
    // Immediately initialize state with the auto-detected type
    initializeState(vehicle, vehicle.suggestedVehicleType as VehicleType);
  };

  if (!inspectionState) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        {/* VIN Scanner — now auto-detects vehicle type */}
        <VINScanner
          onVinDecoded={handleVinDecoded}
          vin={vin}
          setVin={setVin}
        />

        {/* Manual Vehicle Type Override (shown after VIN decode OR as standalone) */}
        <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
          <h2 className="text-xl font-semibold text-light-text mb-1">Select Vehicle Type</h2>
          <p className="text-medium-text text-sm mb-4">
            {decodedVehicle
              ? 'Auto-detected from VIN. Override if needed, then click Start Inspection.'
              : 'Or skip VIN and manually select the vehicle type to start inspection.'}
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 mb-4">
            {vehicleTypes.map(type => (
              <button
                key={type}
                onClick={() => setSelectedVehicleType(type)}
                className={`flex flex-col items-center gap-1 p-3 rounded-lg border-2 transition-all ${
                  selectedVehicleType === type
                    ? 'border-primary bg-primary/10 text-primary'
                    : 'border-dark-border text-medium-text hover:border-primary/50'
                }`}
              >
                <span className="text-2xl">{VEHICLE_TYPE_ICONS[type]}</span>
                <span className="text-xs font-semibold text-center leading-tight">{VEHICLE_TYPE_LABELS[type]}</span>
              </button>
            ))}
          </div>

          {/* Start without VIN button */}
          {!decodedVehicle && (
            <button
              onClick={() => {
                const blankVehicle = { make: 'Unknown', model: 'Unknown', year: 'Unknown', vin: 'MANUAL-' + Date.now(), suggestedVehicleType: selectedVehicleType };
                initializeState(blankVehicle, selectedVehicleType);
              }}
              className="w-full bg-dark-bg border border-dark-border hover:border-primary text-medium-text hover:text-light-text font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
            >
              Start Inspection Without VIN
            </button>
          )}
        </div>
      </div>
    );
  }

  const hasComplianceChecklist = Object.keys(inspectionState.complianceChecklist).length > 0;
  const complianceLabel = COMPLIANCE_SECTION_LABELS[inspectionState.vehicleType] || 'Additional Checks';

  // Progress tracking
  const allItems = [
    ...Object.values(inspectionState.checklist).flat(),
    ...Object.values(inspectionState.complianceChecklist).flat(),
  ];
  const totalItems = allItems.length;
  const checkedItems = allItems.filter((i: any) => i.condition !== 'unchecked').length;
  const progressPercent = totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;
  const photoCount = allItems.reduce((sum: number, i: any) => sum + i.photos.length, 0);
  const failCount = allItems.filter((i: any) => i.condition === 'fail').length;
  const concernCount = allItems.filter((i: any) => i.condition === 'concern').length;

  const handleFinalizeClick = () => {
    if (!inspectionState.odometer.trim() || !/^\d+$/.test(inspectionState.odometer)) {
      setError("Please enter a valid odometer reading (numbers only).");
      return;
    }
    setError(null);
    onFinalize(inspectionState);
  };

  const renderChecklistSection = (checklist: Record<string, any[]>, sectionHeader?: string) => (
    <>
      {sectionHeader && (
        <div className="bg-primary/10 border border-primary/30 p-4 rounded-lg">
          <h2 className="text-xl font-bold text-primary">{sectionHeader}</h2>
          <p className="text-medium-text text-sm mt-1">
            {inspectionState.vehicleType === 'Commercial' && 'Federal Motor Carrier Safety Regulations (FMCSR) compliance items'}
            {inspectionState.vehicleType === 'RV' && 'Habitability systems, LP gas safety, water, and electrical checks'}
            {inspectionState.vehicleType === 'Classic' && 'Numbers matching verification, originality assessment, and provenance documentation'}
          </p>
        </div>
      )}
      {Object.entries(checklist).map(([category, items]) => (
        <div key={category} className="bg-dark-card p-6 rounded-lg border border-dark-border">
          <h2 className="text-xl font-semibold text-light-text mb-4">{category}</h2>
          <div className="space-y-6">
            {Array.isArray(items) && items.map((item, index) => (
              <ChecklistItemRow
                key={index}
                item={item}
                category={category}
                index={index}
                isUploading={!!isUploading[`${category}-${index}`]}
                onUpdate={updateChecklistItem}
                onTriggerUpload={triggerFileUpload}
                onRemovePhoto={removePhotoFromChecklistItem}
                onAudioReady={addAudioToChecklistItem}
              />
            ))}
          </div>
        </div>
      ))}
    </>
  );

  return (
    <div className="space-y-6">
      {/* Vehicle Header */}
      <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
        <div className="flex justify-between items-start flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-light-text">
              {VEHICLE_TYPE_ICONS[inspectionState.vehicleType]}{' '}
              {inspectionState.vehicle.year !== 'Unknown' ? `${inspectionState.vehicle.year} ` : ''}
              {inspectionState.vehicle.make !== 'Unknown' ? `${inspectionState.vehicle.make} ` : ''}
              {inspectionState.vehicle.model !== 'Unknown' ? inspectionState.vehicle.model : 'Vehicle Inspection'}
            </h1>
            {inspectionState.vehicle.vin && !inspectionState.vehicle.vin.startsWith('MANUAL-') && (
              <p className="font-mono text-medium-text text-sm mt-1">VIN: {inspectionState.vehicle.vin}</p>
            )}
          </div>
          <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/20 text-primary">
            {VEHICLE_TYPE_LABELS[inspectionState.vehicleType] || inspectionState.vehicleType}
          </span>
        </div>
      </div>

      {/* Dealer Tricks Alert */}
      <DealerTricksPanel vehicleType={inspectionState.vehicleType} />

      {/* Progress Indicator */}
      <div className="bg-dark-card p-4 rounded-lg border border-dark-border sticky top-0 z-10">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-light-text">Inspection Progress</span>
          <div className="flex items-center gap-3 text-xs">
            <span className="text-green-400">{checkedItems}/{totalItems} items</span>
            <span className="text-blue-400">{photoCount} photos</span>
            {failCount > 0 && <span className="text-red-400">{failCount} fails</span>}
            {concernCount > 0 && <span className="text-yellow-400">{concernCount} concerns</span>}
          </div>
        </div>
        <div className="w-full h-3 bg-dark-bg rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              progressPercent === 100 ? 'bg-green-500' : progressPercent > 50 ? 'bg-primary' : 'bg-yellow-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-medium-text mt-2">
          {progressPercent === 0 && 'Start by entering the odometer reading, then work through each section.'}
          {progressPercent > 0 && progressPercent < 50 && 'Keep going! Mark each item as Pass, Fail, Concern, or N/A. Add photos for evidence.'}
          {progressPercent >= 50 && progressPercent < 100 && 'Great progress! Finish the remaining items and add photos for any failed/concern items.'}
          {progressPercent === 100 && 'All items checked! Review your notes and photos, then tap Finalize to generate the report.'}
        </p>
      </div>

      {/* Odometer */}
      <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
        <h2 className="text-xl font-semibold text-light-text mb-3">
          {inspectionState.vehicleType === 'Commercial' ? 'Odometer / Hubodometer Reading' : 'Odometer Reading'}
        </h2>
        <input
          type="text"
          inputMode="numeric"
          placeholder={inspectionState.vehicleType === 'Commercial' ? 'e.g., 456000' : 'e.g., 75300'}
          value={inspectionState.odometer}
          onChange={(e) => setOdometer(e.target.value.replace(/\D/g, ''))}
          className="w-full bg-dark-bg border border-dark-border rounded-md p-2 focus:ring-2 focus:ring-primary focus:border-primary transition text-light-text font-mono"
        />
      </div>

      {/* Main Inspection Checklist */}
      {renderChecklistSection(inspectionState.checklist)}

      {/* Compliance / Specialized Checklist */}
      {hasComplianceChecklist && renderChecklistSection(inspectionState.complianceChecklist, complianceLabel)}

      {/* Overall Notes */}
      <div className="bg-dark-card p-6 rounded-lg border border-dark-border">
        <h2 className="text-xl font-semibold text-light-text mb-3">Overall Notes</h2>
        <textarea
          placeholder="Add any final thoughts or summary notes about the vehicle..."
          value={inspectionState.overallNotes}
          onChange={(e) => setOverallNotes(e.target.value)}
          className="w-full bg-dark-bg border border-dark-border rounded-md p-2 focus:ring-2 focus:ring-primary focus:border-primary transition text-light-text"
          rows={4}
        />
      </div>

      {/* AI Fraud & Damage Detection — Always Visible, Consumer Protection Core Feature */}
      <div className="bg-dark-card rounded-lg border-2 border-red-500/40 overflow-hidden">
        <div className="bg-gradient-to-r from-red-900/30 to-orange-900/20 px-6 py-4 border-b border-red-500/30">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🛡️</span>
              <div>
                <h2 className="text-xl font-bold text-light-text">AI Fraud & Damage Protection</h2>
                <p className="text-sm text-red-300/80">
                  {inspectionState.vehicleType === 'Commercial'
                    ? 'FMCSA-grade: odometer, flood, VIN clone, frame/structural, tire wear, and body damage AI'
                    : 'Protect yourself: odometer rollback, flood damage, VIN fraud, body damage, tire wear, and frame analysis'}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <span className="text-xs bg-red-600/30 text-red-300 border border-red-500/40 px-2 py-1 rounded font-semibold">INCLUDED IN ALL PLANS</span>
              <button
                onClick={() => setShowAdvancedAnalysis(!showAdvancedAnalysis)}
                className="text-xs text-medium-text hover:text-light-text border border-dark-border rounded px-3 py-1 transition-colors"
              >
                {showAdvancedAnalysis ? 'Collapse ▲' : 'Expand ▼'}
              </button>
            </div>
          </div>
          {!showAdvancedAnalysis && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mt-3">
              {[
                { icon: '📏', label: 'Odometer Fraud' },
                { icon: '💧', label: 'Flood Damage' },
                { icon: '🔍', label: 'VIN / Title Fraud' },
                { icon: '📸', label: 'Body Damage AI' },
                { icon: '🔧', label: 'Tire Wear AI' },
                { icon: '🏗️', label: 'Frame Analysis' },
              ].map(item => (
                <button
                  key={item.label}
                  onClick={() => setShowAdvancedAnalysis(true)}
                  className="flex flex-col items-center gap-1 bg-dark-bg/60 border border-dark-border rounded-lg p-2 hover:border-red-500/50 transition-colors cursor-pointer"
                >
                  <span className="text-lg">{item.icon}</span>
                  <span className="text-xs text-medium-text text-center leading-tight">{item.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
        {showAdvancedAnalysis && (
          <div className="p-4">
            <FraudDetection
              claimedMileage={parseInt(inspectionState.odometer) || 0}
              vin={inspectionState.vehicle.vin}
              vehicleType={inspectionState.vehicleType}
            />
          </div>
        )}
      </div>

      {error && <p className="text-red-500 text-sm text-center bg-red-900/20 border border-red-700/40 rounded p-2">{error}</p>}

      <div className="flex justify-end p-4">
        <button
          onClick={handleFinalizeClick}
          className="bg-primary hover:bg-primary-light text-white font-bold py-3 px-8 rounded-lg transition-colors text-lg"
        >
          Finalize &amp; Generate Report →
        </button>
      </div>

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
