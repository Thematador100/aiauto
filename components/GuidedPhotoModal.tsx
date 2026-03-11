import React, { useState, useRef, useEffect, useCallback } from 'react';
import { getPhotoGuidance } from '../services/photoGuidance';

interface GuidedPhotoModalProps {
  itemName: string;
  category: string;
  existingPhotoCount: number;
  onPhotoCapture: (base64: string, url: string) => void;
  onClose: () => void;
}

export const GuidedPhotoModal: React.FC<GuidedPhotoModalProps> = ({
  itemName,
  category,
  existingPhotoCount,
  onPhotoCapture,
  onClose,
}) => {
  const guidance = getPhotoGuidance(itemName);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [mode, setMode] = useState<'choose' | 'camera' | 'preview'>('choose');
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [isCapturing, setIsCapturing] = useState(false);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async (facing: 'environment' | 'user' = 'environment') => {
    stopCamera();
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
    } catch (err) {
      setCameraError('Camera access denied or unavailable. Use the Upload Photo option instead.');
    }
  }, [stopCamera]);

  useEffect(() => {
    if (mode === 'camera') {
      startCamera(facingMode);
    }
    return () => {
      if (mode !== 'camera') stopCamera();
    };
  }, [mode, facingMode, startCamera, stopCamera]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  const handleCapture = useCallback(() => {
    if (!videoRef.current || !canvasRef.current) return;
    setIsCapturing(true);
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    setCapturedImage(dataUrl);
    setMode('preview');
    stopCamera();
    setIsCapturing(false);
  }, [stopCamera]);

  const handleFlipCamera = useCallback(() => {
    const newFacing = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newFacing);
    startCamera(newFacing);
  }, [facingMode, startCamera]);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const result = ev.target?.result as string;
      setCapturedImage(result);
      setMode('preview');
    };
    reader.readAsDataURL(file);
  }, []);

  const handleConfirm = useCallback(() => {
    if (!capturedImage) return;
    onPhotoCapture(capturedImage, capturedImage);
    onClose();
  }, [capturedImage, onPhotoCapture, onClose]);

  const handleRetake = useCallback(() => {
    setCapturedImage(null);
    setMode('camera');
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col" style={{ touchAction: 'none' }}>
      {/* Header */}
      <div className="bg-gray-900 px-4 py-3 flex items-center justify-between safe-area-top">
        <button
          onClick={() => { stopCamera(); onClose(); }}
          className="text-white p-2 rounded-full hover:bg-gray-700 transition-colors"
          aria-label="Close"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="text-center flex-1 px-2">
          <p className="text-white font-semibold text-sm truncate">{itemName}</p>
          <p className="text-gray-400 text-xs">{category} · {existingPhotoCount} photo{existingPhotoCount !== 1 ? 's' : ''} taken</p>
        </div>
        <div className="w-10" />
      </div>

      {/* AI Guidance Banner */}
      <div className="bg-blue-900/90 border-b border-blue-700 px-4 py-3">
        <div className="flex items-start gap-3">
          <div className="text-blue-400 mt-0.5 flex-shrink-0">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-blue-100 text-sm leading-relaxed">{guidance.instruction}</p>
            {guidance.tip && (
              <p className="text-yellow-300 text-xs mt-1.5 flex items-start gap-1">
                <span className="flex-shrink-0">💡</span>
                <span>{guidance.tip}</span>
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 relative overflow-hidden">

        {/* MODE: CHOOSE */}
        {mode === 'choose' && (
          <div className="flex flex-col items-center justify-center h-full gap-6 px-6">
            <div className="text-center mb-2">
              <div className="text-6xl mb-3">📷</div>
              <h2 className="text-white text-xl font-bold">{itemName}</h2>
              <p className="text-gray-400 text-sm mt-1">{guidance.focus}</p>
            </div>
            <button
              onClick={() => setMode('camera')}
              className="w-full max-w-sm bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold py-5 px-6 rounded-2xl text-lg flex items-center justify-center gap-3 transition-colors shadow-lg"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Take Photo with Camera
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full max-w-sm bg-gray-700 hover:bg-gray-600 active:bg-gray-800 text-white font-bold py-5 px-6 rounded-2xl text-lg flex items-center justify-center gap-3 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Upload from Gallery
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileUpload}
            />
            {guidance.required && (
              <div className="flex items-center gap-2 text-yellow-400 text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
                Required for AI analysis
              </div>
            )}
          </div>
        )}

        {/* MODE: CAMERA */}
        {mode === 'camera' && (
          <div className="relative h-full flex flex-col">
            {cameraError ? (
              <div className="flex flex-col items-center justify-center h-full gap-4 px-6 text-center">
                <div className="text-red-400 text-5xl">📵</div>
                <p className="text-white font-semibold">{cameraError}</p>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-8 rounded-xl"
                >
                  Upload Photo Instead
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
            ) : (
              <>
                {/* Video feed */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />

                {/* Viewfinder overlay */}
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute inset-8 border-2 border-white/30 rounded-lg">
                    {/* Corner markers */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
                  </div>
                </div>

                {/* Controls */}
                <div className="absolute bottom-0 left-0 right-0 pb-8 pt-4 bg-gradient-to-t from-black/80 to-transparent">
                  <div className="flex items-center justify-around px-8">
                    {/* Flip camera */}
                    <button
                      onClick={handleFlipCamera}
                      className="text-white p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                      aria-label="Flip camera"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                    </button>

                    {/* Shutter button */}
                    <button
                      onClick={handleCapture}
                      disabled={isCapturing}
                      className="w-20 h-20 rounded-full bg-white border-4 border-gray-300 hover:bg-gray-100 active:scale-95 transition-all shadow-xl disabled:opacity-50 flex items-center justify-center"
                      aria-label="Take photo"
                    >
                      <div className="w-14 h-14 rounded-full bg-white border-2 border-gray-400" />
                    </button>

                    {/* Upload fallback */}
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-white p-3 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
                      aria-label="Upload from gallery"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleFileUpload}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* MODE: PREVIEW */}
        {mode === 'preview' && capturedImage && (
          <div className="flex flex-col h-full">
            <div className="flex-1 relative">
              <img
                src={capturedImage}
                alt="Captured"
                className="absolute inset-0 w-full h-full object-contain bg-black"
              />
            </div>
            <div className="bg-gray-900 p-4 flex gap-3">
              <button
                onClick={handleRetake}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white font-bold py-4 rounded-xl text-base flex items-center justify-center gap-2 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retake
              </button>
              <button
                onClick={handleConfirm}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl text-base flex items-center justify-center gap-2 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Use This Photo
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default GuidedPhotoModal;
