import React from 'react';
import { CONFIG } from '../config';

export const Footer: React.FC = () => {
  return (
    <footer className="max-w-4xl mx-auto text-center py-6 px-4">
      <p className="text-sm text-medium-text">
        &copy; {new Date().getFullYear()} {CONFIG.BRANDING.companyName}. All rights reserved.
      </p>
      <p className="text-xs text-gray-600 mt-1">
        Powered by Google AI
      </p>
    </footer>
  );
};
