import React, { useState } from 'react';
import { User } from '../types';
import { CONFIG } from '../config';

interface HeaderProps {
  user: User;
  currentTab: string;
  onTabChange: (tab: string) => void;
  onLogout: () => void;
  extraControls?: React.ReactNode;
}

const TABS = ['Dashboard', 'Inspection', 'Diagnostics', 'Assistant', 'Fleet', 'Reseller', 'Referral', 'Certification', 'Profile', 'Manual'];
const TAB_LABELS: Record<string, string> = {
  Fleet: '🚗 Fleet',
  Reseller: '🔑 Reseller',
  Referral: '💰 Earn',
  Certification: '🎓 Certification',
};

export const Header: React.FC<HeaderProps> = ({ user, currentTab, onTabChange, onLogout, extraControls }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <header className="bg-dark-card shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-4">
            <div className="text-xl font-bold text-primary">{CONFIG.BRANDING.companyName}</div>
            <nav className="hidden md:flex space-x-1">
              {TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => onTabChange(tab)}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    currentTab === tab
                      ? 'bg-primary text-white'
                      : 'text-medium-text hover:bg-dark-bg hover:text-light-text'
                  }`}
                >
                  {TAB_LABELS[tab] || tab}
                </button>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-2">
            {extraControls && <div className="hidden sm:flex">{extraControls}</div>}
            <span className="text-sm text-medium-text hidden sm:block">
              {user.email}
            </span>
            <button
              onClick={onLogout}
              className="hidden md:block px-3 py-2 rounded-md text-sm font-medium text-medium-text hover:bg-dark-bg hover:text-light-text"
            >
              Logout
            </button>
            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden px-2 py-2 rounded-md text-medium-text hover:text-light-text"
            >
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {mobileMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </div>
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-dark-card border-t border-dark-border px-4 pb-4">
          <nav className="flex flex-col space-y-1 pt-2">
            {TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  onTabChange(tab);
                  setMobileMenuOpen(false);
                }}
                className={`px-4 py-3 rounded-lg text-sm font-medium text-left transition-colors ${
                  currentTab === tab
                    ? 'bg-primary text-white'
                    : 'text-medium-text hover:bg-dark-bg hover:text-light-text'
                }`}
              >
                {TAB_LABELS[tab] || tab}
              </button>
            ))}
            <button
              onClick={() => {
                onLogout();
                setMobileMenuOpen(false);
              }}
              className="px-4 py-3 rounded-lg text-sm font-medium text-left text-red-400 hover:bg-red-900/20 transition-colors"
            >
              Sign Out
            </button>
          </nav>
        </div>
      )}
    </header>
  );
};
