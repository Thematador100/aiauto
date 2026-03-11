import React, { useState, useEffect } from 'react';

// Detect iOS Safari (no beforeinstallprompt support)
const isIOS = () =>
  /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;

const isInStandaloneMode = () =>
  window.matchMedia('(display-mode: standalone)').matches ||
  (navigator as any).standalone === true;

/**
 * InstallAppButton — PWA install for Android (one-tap) + iOS (step-by-step guide)
 */
export const InstallAppButton: React.FC = () => {
  const [showAndroidPrompt, setShowAndroidPrompt] = useState(false);
  const [showIOSBanner, setShowIOSBanner] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    if (isInStandaloneMode()) return;

    const dismissedAt = localStorage.getItem('pwaPromptDismissed');
    if (dismissedAt && (Date.now() - parseInt(dismissedAt)) / 86400000 < 7) return;

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowAndroidPrompt(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall as EventListener);
    window.addEventListener('showInstallPrompt', handleBeforeInstall as EventListener);

    let iosTimer: ReturnType<typeof setTimeout> | undefined;
    if (isIOS()) {
      iosTimer = setTimeout(() => setShowIOSBanner(true), 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall as EventListener);
      window.removeEventListener('showInstallPrompt', handleBeforeInstall as EventListener);
      if (iosTimer) clearTimeout(iosTimer);
    };
  }, []);

  const handleAndroidInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') console.log('PWA installed');
    setDeferredPrompt(null);
    setShowAndroidPrompt(false);
  };

  const dismiss = () => {
    localStorage.setItem('pwaPromptDismissed', Date.now().toString());
    setShowAndroidPrompt(false);
    setShowIOSBanner(false);
  };

  if (showAndroidPrompt) {
    return (
      <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-sm z-50 animate-slide-up">
        <div className="bg-gradient-to-r from-blue-700 to-indigo-700 rounded-2xl shadow-2xl p-4 border border-blue-500/40">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-3">
              <img src="/icons/icon-72x72.png" alt="icon" className="w-12 h-12 rounded-xl" />
              <div>
                <div className="font-bold text-white text-base leading-tight">Install AI Auto Pro</div>
                <div className="text-blue-200 text-xs mt-0.5">Works offline · Fast · Home screen</div>
              </div>
            </div>
            <button onClick={dismiss} className="text-white/60 hover:text-white text-lg p-1" aria-label="Dismiss">x</button>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleAndroidInstall}
              className="flex-1 bg-white text-blue-700 font-bold py-3 rounded-xl text-sm hover:bg-blue-50 transition-colors"
            >
              Install App
            </button>
            <button onClick={dismiss} className="px-4 py-3 text-white/70 hover:text-white text-sm rounded-xl transition-colors">
              Later
            </button>
          </div>
          <div className="mt-2.5 flex justify-center gap-4 text-xs text-blue-200">
            <span>Offline mode</span>
            <span>Push alerts</span>
            <span>No app store needed</span>
          </div>
        </div>
      </div>
    );
  }

  if (showIOSBanner) {
    return (
      <div className="ios-install-banner">
        <img src="/icons/icon-72x72.png" alt="icon" className="w-12 h-12 rounded-xl shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-white text-sm">Install AI Auto Pro</div>
          <div className="text-blue-200 text-xs mt-0.5 leading-snug">
            Tap the Share button then "Add to Home Screen"
          </div>
        </div>
        <button onClick={dismiss} className="text-white/60 hover:text-white text-xl shrink-0 p-1" aria-label="Dismiss">x</button>
      </div>
    );
  }

  return null;
};
