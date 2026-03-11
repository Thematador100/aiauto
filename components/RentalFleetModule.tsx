import React, { useState, useRef, useCallback } from 'react';
import { resizeAndCompressImage } from '../services/imageOptimizer';
import { LoadingSpinner } from './LoadingSpinner';

// ─── Types ──────────────────────────────────────────────────────────────────
interface FleetPhoto {
  id: string;
  base64: string;
  mimeType: string;
  area: string;
  timestamp: string;
}

interface RentalRecord {
  id: string;
  vehicleId: string;
  vehicleName: string;
  licensePlate: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  checkOutDate: string;
  checkInDate?: string;
  checkOutPhotos: FleetPhoto[];
  checkInPhotos: FleetPhoto[];
  checkOutNotes: string;
  checkInNotes: string;
  customerSignature?: string;
  status: 'out' | 'returned';
  damageFound?: boolean;
  damageNotes?: string;
}

interface FleetVehicle {
  id: string;
  name: string;
  licensePlate: string;
  year: string;
  make: string;
  model: string;
  status: 'available' | 'out' | 'maintenance';
  lastInspection?: string;
}

// ─── Walk-Around Photo Areas ─────────────────────────────────────────────────
const WALK_AROUND_AREAS = [
  { id: 'front', label: 'Front', icon: '⬆️', instruction: 'Stand 8 feet directly in front of the vehicle. Capture the full front bumper, grille, and headlights. Look for any dents, cracks, or paint chips.' },
  { id: 'front-left', label: 'Front Left Corner', icon: '↖️', instruction: 'Stand at the front-left corner. Capture the bumper corner, fender, and wheel. Look for scrapes or damage on the corner.' },
  { id: 'driver-side', label: 'Driver Side', icon: '⬅️', instruction: 'Stand 8 feet from the driver side. Capture the full side of the vehicle from front to back. Look for dents, scratches, or paint damage along the door panels.' },
  { id: 'rear-left', label: 'Rear Left Corner', icon: '↙️', instruction: 'Stand at the rear-left corner. Capture the bumper corner, taillight, and rear quarter panel.' },
  { id: 'rear', label: 'Rear', icon: '⬇️', instruction: 'Stand 8 feet directly behind the vehicle. Capture the full rear bumper, taillights, and trunk/tailgate. Look for any dents or damage.' },
  { id: 'rear-right', label: 'Rear Right Corner', icon: '↘️', instruction: 'Stand at the rear-right corner. Capture the bumper corner, taillight, and rear quarter panel.' },
  { id: 'passenger-side', label: 'Passenger Side', icon: '➡️', instruction: 'Stand 8 feet from the passenger side. Capture the full side from front to back. Look for dents, scratches, or paint damage.' },
  { id: 'front-right', label: 'Front Right Corner', icon: '↗️', instruction: 'Stand at the front-right corner. Capture the bumper corner, fender, and wheel.' },
  { id: 'interior-front', label: 'Interior Front', icon: '🪑', instruction: 'Photograph the front seats, dashboard, steering wheel, and center console. Look for stains, tears, or damage.' },
  { id: 'interior-rear', label: 'Interior Rear', icon: '🪑', instruction: 'Photograph the rear seats and floor. Look for stains, tears, or damage.' },
  { id: 'odometer', label: 'Odometer', icon: '🔢', instruction: 'Photograph the odometer display clearly showing the current mileage.' },
  { id: 'fuel-gauge', label: 'Fuel Gauge', icon: '⛽', instruction: 'Photograph the fuel gauge showing the current fuel level.' },
];

// ─── Guided Walk-Around Modal ────────────────────────────────────────────────
const WalkAroundModal: React.FC<{
  title: string;
  existingPhotos: FleetPhoto[];
  onComplete: (photos: FleetPhoto[]) => void;
  onClose: () => void;
}> = ({ title, existingPhotos, onComplete, onClose }) => {
  const [photos, setPhotos] = useState<FleetPhoto[]>([...existingPhotos]);
  const [currentAreaIdx, setCurrentAreaIdx] = useState(0);
  const [isCapturing, setIsCapturing] = useState(false);
  const [lightbox, setLightbox] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const currentArea = WALK_AROUND_AREAS[currentAreaIdx];
  const areaPhoto = photos.find(p => p.area === currentArea.id);
  const completedCount = WALK_AROUND_AREAS.filter(a => photos.some(p => p.area === a.id)).length;

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setIsCapturing(true);
    try {
      const { base64, mimeType } = await resizeAndCompressImage(e.target.files[0]);
      const newPhoto: FleetPhoto = {
        id: `${Date.now()}-${Math.random()}`,
        base64,
        mimeType,
        area: currentArea.id,
        timestamp: new Date().toISOString(),
      };
      setPhotos(prev => {
        const filtered = prev.filter(p => p.area !== currentArea.id);
        return [...filtered, newPhoto];
      });
      // Auto-advance to next area
      if (currentAreaIdx < WALK_AROUND_AREAS.length - 1) {
        setTimeout(() => setCurrentAreaIdx(i => i + 1), 400);
      }
    } catch (err) {
      alert('Failed to process photo. Please try again.');
    } finally {
      setIsCapturing(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [currentArea.id, currentAreaIdx]);

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex flex-col">
      {lightbox && (
        <div className="fixed inset-0 z-60 bg-black/95 flex items-center justify-center p-4" onClick={() => setLightbox(null)}>
          <img src={lightbox} alt="Full size" className="max-w-full max-h-full rounded-xl" />
          <button className="absolute top-4 right-4 text-white bg-black/50 rounded-full p-2" onClick={() => setLightbox(null)}>✕</button>
        </div>
      )}

      {/* Header */}
      <div className="bg-dark-card border-b border-dark-border px-4 py-3 flex items-center justify-between flex-shrink-0">
        <div>
          <h2 className="text-light-text font-bold text-base">{title}</h2>
          <p className="text-medium-text text-xs">{completedCount}/{WALK_AROUND_AREAS.length} areas photographed</p>
        </div>
        <button onClick={onClose} className="text-medium-text hover:text-light-text p-1">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Progress bar */}
      <div className="bg-dark-bg h-1.5 flex-shrink-0">
        <div className="bg-primary h-full transition-all duration-500" style={{ width: `${(completedCount / WALK_AROUND_AREAS.length) * 100}%` }} />
      </div>

      {/* Area thumbnails */}
      <div className="flex gap-2 px-4 py-3 overflow-x-auto flex-shrink-0 bg-dark-bg/50">
        {WALK_AROUND_AREAS.map((area, idx) => {
          const photo = photos.find(p => p.area === area.id);
          const isActive = idx === currentAreaIdx;
          return (
            <button
              key={area.id}
              onClick={() => setCurrentAreaIdx(idx)}
              className={`flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden border-2 transition-all ${
                isActive ? 'border-primary scale-110' : photo ? 'border-green-600' : 'border-dark-border'
              }`}
            >
              {photo ? (
                <img src={`data:${photo.mimeType};base64,${photo.base64}`} alt={area.label} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-dark-bg flex items-center justify-center text-xl">
                  {area.icon}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Current area instruction */}
        <div className="bg-blue-950/50 border border-blue-800/50 rounded-2xl p-4">
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{currentArea.icon}</span>
            <h3 className="text-light-text font-bold text-lg">{currentArea.label}</h3>
            {areaPhoto && <span className="ml-auto bg-green-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">✓ Done</span>}
          </div>
          <p className="text-blue-200 text-sm leading-relaxed">{currentArea.instruction}</p>
        </div>

        {/* Current photo preview */}
        {areaPhoto && (
          <div className="relative rounded-2xl overflow-hidden border border-dark-border">
            <img
              src={`data:${areaPhoto.mimeType};base64,${areaPhoto.base64}`}
              alt={currentArea.label}
              className="w-full max-h-64 object-cover cursor-pointer"
              onClick={() => setLightbox(`data:${areaPhoto.mimeType};base64,${areaPhoto.base64}`)}
            />
            <div className="absolute bottom-2 right-2">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="bg-black/70 text-white text-xs font-semibold px-3 py-1.5 rounded-lg"
              >
                Retake
              </button>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-3">
          <button
            onClick={() => setCurrentAreaIdx(i => Math.max(0, i - 1))}
            disabled={currentAreaIdx === 0}
            className="flex-1 bg-dark-bg border border-dark-border text-medium-text font-semibold py-3 rounded-xl disabled:opacity-30 transition-colors"
          >
            ← Previous
          </button>
          {currentAreaIdx < WALK_AROUND_AREAS.length - 1 ? (
            <button
              onClick={() => setCurrentAreaIdx(i => i + 1)}
              className="flex-1 bg-dark-bg border border-dark-border text-medium-text font-semibold py-3 rounded-xl transition-colors"
            >
              Next →
            </button>
          ) : (
            <button
              onClick={() => onComplete(photos)}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors"
            >
              ✓ Complete Walk-Around
            </button>
          )}
        </div>
      </div>

      {/* Camera button */}
      <div className="p-4 bg-dark-card border-t border-dark-border flex-shrink-0">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isCapturing}
          className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-5 rounded-2xl text-lg transition-colors disabled:opacity-50 shadow-lg"
        >
          {isCapturing ? <LoadingSpinner /> : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              📷 Take Photo — {currentArea.label}
            </>
          )}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileSelect}
        />
      </div>
    </div>
  );
};

// ─── Check-Out Form ──────────────────────────────────────────────────────────
const CheckOutForm: React.FC<{
  vehicle: FleetVehicle;
  onComplete: (record: Partial<RentalRecord>) => void;
  onCancel: () => void;
}> = ({ vehicle, onComplete, onCancel }) => {
  const [step, setStep] = useState<'info' | 'photos' | 'signature'>('info');
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<FleetPhoto[]>([]);
  const [signature, setSignature] = useState('');
  const [showWalkAround, setShowWalkAround] = useState(false);
  const sigRef = useRef<HTMLInputElement>(null);

  const handleFinish = () => {
    onComplete({
      vehicleId: vehicle.id,
      vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
      licensePlate: vehicle.licensePlate,
      customerName,
      customerEmail,
      customerPhone,
      checkOutDate: new Date().toISOString(),
      checkOutPhotos: photos,
      checkOutNotes: notes,
      customerSignature: signature,
      status: 'out',
    });
  };

  return (
    <div className="space-y-5">
      {showWalkAround && (
        <WalkAroundModal
          title={`Check-Out Walk-Around — ${vehicle.year} ${vehicle.make} ${vehicle.model}`}
          existingPhotos={photos}
          onComplete={(p) => { setPhotos(p); setShowWalkAround(false); }}
          onClose={() => setShowWalkAround(false)}
        />
      )}

      <div className="bg-dark-card border border-dark-border rounded-2xl p-5">
        <h2 className="text-light-text font-bold text-xl mb-1">Check-Out Inspection</h2>
        <p className="text-medium-text text-sm">{vehicle.year} {vehicle.make} {vehicle.model} · {vehicle.licensePlate}</p>
      </div>

      {/* Step indicator */}
      <div className="flex gap-2">
        {['Customer Info', 'Walk-Around Photos', 'Sign & Complete'].map((s, i) => (
          <div key={i} className={`flex-1 text-center text-xs font-semibold py-2 rounded-lg ${i === ['info', 'photos', 'signature'].indexOf(step) ? 'bg-primary text-white' : 'bg-dark-bg text-medium-text'}`}>
            {s}
          </div>
        ))}
      </div>

      {step === 'info' && (
        <div className="bg-dark-card border border-dark-border rounded-2xl p-5 space-y-4">
          <div>
            <label className="block text-light-text font-semibold text-sm mb-1.5">Customer Name *</label>
            <input type="text" value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="Full name" className="w-full bg-dark-bg border border-dark-border text-light-text rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition" />
          </div>
          <div>
            <label className="block text-light-text font-semibold text-sm mb-1.5">Customer Email</label>
            <input type="email" value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="customer@email.com" className="w-full bg-dark-bg border border-dark-border text-light-text rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition" />
          </div>
          <div>
            <label className="block text-light-text font-semibold text-sm mb-1.5">Customer Phone</label>
            <input type="tel" value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="(555) 000-0000" className="w-full bg-dark-bg border border-dark-border text-light-text rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition" />
          </div>
          <div>
            <label className="block text-light-text font-semibold text-sm mb-1.5">Pre-existing Damage Notes</label>
            <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Note any existing damage before the rental..." className="w-full bg-dark-bg border border-dark-border text-light-text rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition resize-none" />
          </div>
          <button onClick={() => setStep('photos')} disabled={!customerName} className="w-full bg-primary hover:bg-primary-light text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50">
            Next: Walk-Around Photos →
          </button>
        </div>
      )}

      {step === 'photos' && (
        <div className="bg-dark-card border border-dark-border rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-light-text font-bold">Vehicle Walk-Around</h3>
              <p className="text-medium-text text-xs mt-0.5">{photos.length}/{WALK_AROUND_AREAS.length} areas photographed</p>
            </div>
            {photos.length > 0 && <span className="bg-green-900/40 text-green-400 text-xs font-bold px-3 py-1 rounded-full">✓ {photos.length} photos</span>}
          </div>

          {photos.length > 0 && (
            <div className="grid grid-cols-4 gap-2">
              {photos.map(p => (
                <img key={p.id} src={`data:${p.mimeType};base64,${p.base64}`} alt={p.area} className="w-full h-16 object-cover rounded-lg border border-dark-border" />
              ))}
            </div>
          )}

          <button
            onClick={() => setShowWalkAround(true)}
            className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-colors"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {photos.length > 0 ? 'Continue Walk-Around' : 'Start Guided Walk-Around'}
          </button>

          <div className="flex gap-3">
            <button onClick={() => setStep('info')} className="flex-1 bg-dark-bg border border-dark-border text-medium-text font-semibold py-3 rounded-xl">← Back</button>
            <button onClick={() => setStep('signature')} className="flex-1 bg-primary hover:bg-primary-light text-white font-bold py-3 rounded-xl transition-colors">
              Next: Customer Sign-Off →
            </button>
          </div>
        </div>
      )}

      {step === 'signature' && (
        <div className="bg-dark-card border border-dark-border rounded-2xl p-5 space-y-4">
          <div className="bg-yellow-900/20 border border-yellow-700/40 rounded-xl p-4">
            <h3 className="text-yellow-300 font-bold text-sm mb-1">⚠️ Customer Acknowledgment</h3>
            <p className="text-yellow-200/80 text-xs leading-relaxed">
              By signing below, the customer confirms they have reviewed the vehicle condition, agree the photos accurately represent the vehicle's current state, and accept responsibility for any new damage that occurs during the rental period.
            </p>
          </div>
          <div>
            <label className="block text-light-text font-semibold text-sm mb-1.5">Customer Signature (type full name to confirm)</label>
            <input
              ref={sigRef}
              type="text"
              value={signature}
              onChange={e => setSignature(e.target.value)}
              placeholder="Type full name to sign..."
              className="w-full bg-dark-bg border border-dark-border text-light-text rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition font-serif text-lg italic"
            />
          </div>
          <div className="flex gap-3">
            <button onClick={() => setStep('photos')} className="flex-1 bg-dark-bg border border-dark-border text-medium-text font-semibold py-3 rounded-xl">← Back</button>
            <button onClick={handleFinish} disabled={!signature} className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl transition-colors disabled:opacity-50">
              ✓ Complete Check-Out
            </button>
          </div>
        </div>
      )}

      <button onClick={onCancel} className="w-full text-medium-text text-sm py-2">Cancel</button>
    </div>
  );
};

// ─── Check-In Form ───────────────────────────────────────────────────────────
const CheckInForm: React.FC<{
  record: RentalRecord;
  onComplete: (updates: Partial<RentalRecord>) => void;
  onCancel: () => void;
}> = ({ record, onComplete, onCancel }) => {
  const [photos, setPhotos] = useState<FleetPhoto[]>([]);
  const [notes, setNotes] = useState('');
  const [damageFound, setDamageFound] = useState(false);
  const [damageNotes, setDamageNotes] = useState('');
  const [showWalkAround, setShowWalkAround] = useState(false);

  const handleFinish = () => {
    onComplete({
      checkInDate: new Date().toISOString(),
      checkInPhotos: photos,
      checkInNotes: notes,
      damageFound,
      damageNotes: damageFound ? damageNotes : undefined,
      status: 'returned',
    });
  };

  return (
    <div className="space-y-5">
      {showWalkAround && (
        <WalkAroundModal
          title={`Check-In Walk-Around — ${record.vehicleName}`}
          existingPhotos={photos}
          onComplete={(p) => { setPhotos(p); setShowWalkAround(false); }}
          onClose={() => setShowWalkAround(false)}
        />
      )}

      <div className="bg-dark-card border border-dark-border rounded-2xl p-5">
        <h2 className="text-light-text font-bold text-xl mb-1">Check-In Inspection</h2>
        <p className="text-medium-text text-sm">{record.vehicleName} · Rented by {record.customerName}</p>
        <p className="text-medium-text text-xs mt-0.5">Checked out: {new Date(record.checkOutDate).toLocaleDateString()}</p>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-light-text font-bold">Return Walk-Around</h3>
            <p className="text-medium-text text-xs mt-0.5">{photos.length}/{WALK_AROUND_AREAS.length} areas photographed</p>
          </div>
          {photos.length > 0 && <span className="bg-green-900/40 text-green-400 text-xs font-bold px-3 py-1 rounded-full">✓ {photos.length} photos</span>}
        </div>

        {photos.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            {photos.map(p => (
              <img key={p.id} src={`data:${p.mimeType};base64,${p.base64}`} alt={p.area} className="w-full h-16 object-cover rounded-lg border border-dark-border" />
            ))}
          </div>
        )}

        <button
          onClick={() => setShowWalkAround(true)}
          className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {photos.length > 0 ? 'Continue Walk-Around' : 'Start Return Walk-Around'}
        </button>

        <div>
          <label className="block text-light-text font-semibold text-sm mb-1.5">Return Notes</label>
          <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={2} placeholder="General notes about the return..." className="w-full bg-dark-bg border border-dark-border text-light-text rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition resize-none" />
        </div>

        <div>
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={damageFound} onChange={e => setDamageFound(e.target.checked)} className="h-5 w-5 rounded text-red-600 focus:ring-red-500" />
            <span className="text-light-text font-semibold text-sm">New damage found on return</span>
          </label>
          {damageFound && (
            <textarea value={damageNotes} onChange={e => setDamageNotes(e.target.value)} rows={3} placeholder="Describe the new damage in detail..." className="mt-3 w-full bg-red-950/20 border border-red-700/40 text-light-text rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-red-500 transition resize-none" />
          )}
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 bg-dark-bg border border-dark-border text-medium-text font-semibold py-3 rounded-xl">Cancel</button>
          <button onClick={handleFinish} className={`flex-1 font-bold py-3 rounded-xl transition-colors text-white ${damageFound ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}>
            {damageFound ? '⚠️ Complete — Damage Noted' : '✓ Complete Check-In'}
          </button>
        </div>
      </div>
    </div>
  );
};

// ─── Main Rental Fleet Module ────────────────────────────────────────────────
export const RentalFleetModule: React.FC = () => {
  const STORAGE_KEY = 'aiautopro_fleet';
  const RECORDS_KEY = 'aiautopro_fleet_records';

  const [vehicles, setVehicles] = useState<FleetVehicle[]>(() => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); } catch { return []; }
  });
  const [records, setRecords] = useState<RentalRecord[]>(() => {
    try { return JSON.parse(localStorage.getItem(RECORDS_KEY) || '[]'); } catch { return []; }
  });

  const [view, setView] = useState<'fleet' | 'checkout' | 'checkin' | 'add-vehicle' | 'history'>('fleet');
  const [selectedVehicle, setSelectedVehicle] = useState<FleetVehicle | null>(null);
  const [selectedRecord, setSelectedRecord] = useState<RentalRecord | null>(null);

  // Add vehicle form state
  const [newVehicle, setNewVehicle] = useState({ year: '', make: '', model: '', licensePlate: '' });

  const saveVehicles = (v: FleetVehicle[]) => {
    setVehicles(v);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(v));
  };

  const saveRecords = (r: RentalRecord[]) => {
    setRecords(r);
    localStorage.setItem(RECORDS_KEY, JSON.stringify(r));
  };

  const handleCheckOut = (vehicleId: string) => {
    const v = vehicles.find(v => v.id === vehicleId);
    if (v) { setSelectedVehicle(v); setView('checkout'); }
  };

  const handleCheckIn = (vehicleId: string) => {
    const r = records.find(r => r.vehicleId === vehicleId && r.status === 'out');
    if (r) { setSelectedRecord(r); setView('checkin'); }
  };

  const handleCheckOutComplete = (data: Partial<RentalRecord>) => {
    const record: RentalRecord = {
      id: `${Date.now()}-${Math.random()}`,
      checkInPhotos: [],
      checkInNotes: '',
      ...data,
    } as RentalRecord;
    saveRecords([...records, record]);
    saveVehicles(vehicles.map(v => v.id === data.vehicleId ? { ...v, status: 'out' } : v));
    setView('fleet');
  };

  const handleCheckInComplete = (updates: Partial<RentalRecord>) => {
    if (!selectedRecord) return;
    const updated = records.map(r => r.id === selectedRecord.id ? { ...r, ...updates } : r);
    saveRecords(updated);
    saveVehicles(vehicles.map(v => v.id === selectedRecord.vehicleId ? { ...v, status: 'available', lastInspection: new Date().toISOString() } : v));
    setView('fleet');
  };

  const handleAddVehicle = () => {
    if (!newVehicle.make || !newVehicle.model || !newVehicle.licensePlate) return;
    const v: FleetVehicle = {
      id: `${Date.now()}-${Math.random()}`,
      name: `${newVehicle.year} ${newVehicle.make} ${newVehicle.model}`,
      ...newVehicle,
      status: 'available',
    };
    saveVehicles([...vehicles, v]);
    setNewVehicle({ year: '', make: '', model: '', licensePlate: '' });
    setView('fleet');
  };

  // ── Fleet Dashboard ──
  if (view === 'fleet') {
    const available = vehicles.filter(v => v.status === 'available').length;
    const out = vehicles.filter(v => v.status === 'out').length;

    return (
      <div className="space-y-5">
        <div className="bg-dark-card border border-dark-border rounded-2xl p-5 flex items-center justify-between">
          <div>
            <h1 className="text-light-text font-bold text-2xl">Fleet Manager</h1>
            <p className="text-medium-text text-sm mt-0.5">{vehicles.length} vehicles · {available} available · {out} out</p>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setView('history')} className="bg-dark-bg border border-dark-border text-medium-text font-semibold py-2 px-4 rounded-xl text-sm">History</button>
            <button onClick={() => setView('add-vehicle')} className="bg-primary hover:bg-primary-light text-white font-bold py-2 px-4 rounded-xl text-sm">+ Add Vehicle</button>
          </div>
        </div>

        {vehicles.length === 0 ? (
          <div className="bg-dark-card border border-dark-border rounded-2xl text-center py-16 px-6">
            <span className="text-5xl">🚗</span>
            <h3 className="text-light-text font-bold text-lg mt-4 mb-2">No vehicles yet</h3>
            <p className="text-medium-text text-sm mb-6">Add your first vehicle to get started.</p>
            <button onClick={() => setView('add-vehicle')} className="bg-primary hover:bg-primary-light text-white font-bold py-3 px-8 rounded-xl">Add First Vehicle</button>
          </div>
        ) : (
          <div className="space-y-3">
            {vehicles.map(vehicle => {
              const activeRecord = records.find(r => r.vehicleId === vehicle.id && r.status === 'out');
              return (
                <div key={vehicle.id} className="bg-dark-card border border-dark-border rounded-2xl overflow-hidden">
                  <div className="p-4 flex items-center gap-4">
                    <span className="text-3xl">🚗</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-light-text font-bold">{vehicle.year} {vehicle.make} {vehicle.model}</p>
                      <p className="text-medium-text text-xs">{vehicle.licensePlate}</p>
                      {activeRecord && <p className="text-yellow-400 text-xs mt-0.5">Out with: {activeRecord.customerName}</p>}
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      vehicle.status === 'available' ? 'bg-green-900/40 text-green-400' :
                      vehicle.status === 'out' ? 'bg-yellow-900/40 text-yellow-400' :
                      'bg-gray-800 text-gray-400'
                    }`}>
                      {vehicle.status === 'available' ? '✓ Available' : vehicle.status === 'out' ? '🔑 Out' : '🔧 Maintenance'}
                    </span>
                  </div>
                  <div className="border-t border-dark-border grid grid-cols-2 divide-x divide-dark-border">
                    {vehicle.status === 'available' ? (
                      <button onClick={() => handleCheckOut(vehicle.id)} className="py-3 text-green-400 hover:bg-green-950/30 font-semibold text-sm transition-colors">
                        🔑 Check Out
                      </button>
                    ) : vehicle.status === 'out' ? (
                      <button onClick={() => handleCheckIn(vehicle.id)} className="py-3 text-blue-400 hover:bg-blue-950/30 font-semibold text-sm transition-colors">
                        ✓ Check In
                      </button>
                    ) : (
                      <div className="py-3 text-medium-text text-sm text-center">In Maintenance</div>
                    )}
                    <button
                      onClick={() => saveVehicles(vehicles.filter(v => v.id !== vehicle.id))}
                      className="py-3 text-red-400 hover:bg-red-950/30 font-semibold text-sm transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  if (view === 'add-vehicle') {
    return (
      <div className="space-y-5">
        <div className="bg-dark-card border border-dark-border rounded-2xl p-5">
          <h2 className="text-light-text font-bold text-xl mb-4">Add Vehicle to Fleet</h2>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-light-text font-semibold text-sm mb-1.5">Year</label>
                <input type="text" value={newVehicle.year} onChange={e => setNewVehicle(p => ({ ...p, year: e.target.value }))} placeholder="2022" className="w-full bg-dark-bg border border-dark-border text-light-text rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition" />
              </div>
              <div>
                <label className="block text-light-text font-semibold text-sm mb-1.5">Make</label>
                <input type="text" value={newVehicle.make} onChange={e => setNewVehicle(p => ({ ...p, make: e.target.value }))} placeholder="Toyota" className="w-full bg-dark-bg border border-dark-border text-light-text rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition" />
              </div>
            </div>
            <div>
              <label className="block text-light-text font-semibold text-sm mb-1.5">Model</label>
              <input type="text" value={newVehicle.model} onChange={e => setNewVehicle(p => ({ ...p, model: e.target.value }))} placeholder="Camry" className="w-full bg-dark-bg border border-dark-border text-light-text rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition" />
            </div>
            <div>
              <label className="block text-light-text font-semibold text-sm mb-1.5">License Plate *</label>
              <input type="text" value={newVehicle.licensePlate} onChange={e => setNewVehicle(p => ({ ...p, licensePlate: e.target.value.toUpperCase() }))} placeholder="ABC-1234" className="w-full bg-dark-bg border border-dark-border text-light-text rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary transition" />
            </div>
            <div className="flex gap-3">
              <button onClick={() => setView('fleet')} className="flex-1 bg-dark-bg border border-dark-border text-medium-text font-semibold py-3 rounded-xl">Cancel</button>
              <button onClick={handleAddVehicle} disabled={!newVehicle.make || !newVehicle.model || !newVehicle.licensePlate} className="flex-1 bg-primary hover:bg-primary-light text-white font-bold py-3 rounded-xl disabled:opacity-50">Add Vehicle</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (view === 'checkout' && selectedVehicle) {
    return <CheckOutForm vehicle={selectedVehicle} onComplete={handleCheckOutComplete} onCancel={() => setView('fleet')} />;
  }

  if (view === 'checkin' && selectedRecord) {
    return <CheckInForm record={selectedRecord} onComplete={handleCheckInComplete} onCancel={() => setView('fleet')} />;
  }

  if (view === 'history') {
    const returned = records.filter(r => r.status === 'returned').sort((a, b) => new Date(b.checkInDate!).getTime() - new Date(a.checkInDate!).getTime());
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-light-text font-bold text-xl">Rental History</h2>
          <button onClick={() => setView('fleet')} className="text-medium-text text-sm hover:text-light-text">← Back to Fleet</button>
        </div>
        {returned.length === 0 ? (
          <div className="bg-dark-card border border-dark-border rounded-2xl text-center py-12">
            <p className="text-medium-text">No completed rentals yet.</p>
          </div>
        ) : (
          returned.map(r => (
            <div key={r.id} className="bg-dark-card border border-dark-border rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-light-text font-bold">{r.vehicleName}</p>
                  <p className="text-medium-text text-sm">{r.customerName} · {r.customerEmail}</p>
                  <p className="text-medium-text text-xs mt-1">
                    Out: {new Date(r.checkOutDate).toLocaleDateString()} →
                    In: {r.checkInDate ? new Date(r.checkInDate).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
                {r.damageFound ? (
                  <span className="bg-red-900/40 text-red-400 text-xs font-bold px-3 py-1 rounded-full flex-shrink-0">⚠️ Damage</span>
                ) : (
                  <span className="bg-green-900/40 text-green-400 text-xs font-bold px-3 py-1 rounded-full flex-shrink-0">✓ Clean</span>
                )}
              </div>
              {r.damageFound && r.damageNotes && (
                <div className="mt-3 bg-red-950/20 border border-red-700/30 rounded-xl p-3">
                  <p className="text-red-300 text-xs font-semibold mb-1">Damage Notes:</p>
                  <p className="text-red-200/80 text-xs">{r.damageNotes}</p>
                </div>
              )}
              <div className="mt-3 flex gap-2 text-xs text-medium-text">
                <span>📷 {r.checkOutPhotos.length} check-out photos</span>
                <span>·</span>
                <span>📷 {r.checkInPhotos.length} check-in photos</span>
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  return null;
};
