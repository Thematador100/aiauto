import React, { useState } from 'react';
import { useAuth } from './hooks/useAuth';
import { MainApp } from './components/MainApp';
import { LoginPage } from './components/LoginPage';
import { SignupPage } from './components/SignupPage';
import { AdminDashboard } from './components/AdminDashboard';
import { DIYDashboard } from './components/DIYDashboard';
import { LicenseGate } from './components/LicenseGate';
import LandingPage from './components/LandingPage';
import { ManualPage } from './components/ManualPage';
import { PublicDemo } from './components/PublicDemo';
import AffiliatePage from './components/AffiliatePage';
import AuctionProxyPage from './components/AuctionProxyPage';
import UpsellPage from './components/UpsellPage';
import { LanguageProvider } from './i18n/LanguageContext';
import './index.css';

type AppView = 'landing' | 'login' | 'signup' | 'manual' | 'demo' | 'app' | 'affiliate' | 'auction' | 'upsell';

/**
 * App with landing page, authentication, and user routing
 */
const App: React.FC = () => {
  const { user, login, logout, isLoading } = useAuth();
  // Check for ?demo or ?ref= in URL to show public demo
  const urlParams = new URLSearchParams(window.location.search);
  const isDemo = urlParams.has('demo') || urlParams.has('ref');
  const isSignup = urlParams.has('signup');
  const isAffiliate = urlParams.has('affiliate');
  const isAuction = urlParams.has('auction') || urlParams.has('proxy');
  const isUpsell = urlParams.has('upsell');
  const [currentView, setCurrentView] = useState<AppView>(
    isDemo ? 'demo' : isSignup ? 'signup' : isAffiliate ? 'affiliate' : isAuction ? 'auction' : isUpsell ? 'upsell' : 'landing'
  );
  const [showDIYInspection, setShowDIYInspection] = useState(false);

  // Loading state while checking for existing session
  if (isLoading) {
    return (
      <div className="min-h-screen bg-dark-bg text-light-text flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl text-primary mb-4">🚗</div>
          <p className="text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  // User is not logged in - show landing, login, signup, manual, or affiliate
  if (!user) {
    if (currentView === 'manual') {
      return <ManualPage onBack={() => setCurrentView('landing')} />;
    }

    if (currentView === 'signup') {
      return (
        <SignupPage
          onSignup={login}
          onNavigateToLogin={() => setCurrentView('login')}
        />
      );
    }

    if (currentView === 'login') {
      return (
        <LoginPage
          onLogin={login}
          onNavigateToSignup={() => setCurrentView('signup')}
        />
      );
    }

    if (currentView === 'demo') {
      return <PublicDemo onGetLicense={() => setCurrentView('landing')} />;
    }

    if (currentView === 'affiliate') {
      return <AffiliatePage onBack={() => setCurrentView('landing')} />;
    }

    if (currentView === 'auction') {
      return <AuctionProxyPage onGetLicense={() => setCurrentView('upsell')} onBack={() => setCurrentView('landing')} />;
    }

    if (currentView === 'upsell') {
      return <UpsellPage onDecline={() => setCurrentView('landing')} />;
    }

    // Default: Landing page
    return (
      <LandingPage
        onNavigateToLogin={() => setCurrentView('login')}
        onNavigateToSignup={() => setCurrentView('signup')}
        onNavigateToManual={() => setCurrentView('manual')}
        onNavigateToDemo={() => setCurrentView('demo')}
        onNavigateToAffiliate={() => setCurrentView('affiliate')}
      />
    );
  }

  // User is logged in - route based on user type

  if (user.userType === 'admin') {
    // Admin users get the enterprise admin panel (no license gate - admins always have access)
    return <AdminDashboard user={user} onLogout={logout} />;
  }

  // All non-admin users go through the license gate
  return (
    <LicenseGate user={user} onLogout={logout}>
      {user.userType === 'diy' ? (
        showDIYInspection ? (
          <MainApp user={user} onLogout={logout} />
        ) : (
          <DIYDashboard
            user={user}
            onLogout={logout}
            onStartInspection={() => setShowDIYInspection(true)}
          />
        )
      ) : (
        <MainApp user={user} onLogout={logout} />
      )}
    </LicenseGate>
  );
};

const AppWithLanguage: React.FC = () => (
  <LanguageProvider>
    <App />
  </LanguageProvider>
);

export default AppWithLanguage;
