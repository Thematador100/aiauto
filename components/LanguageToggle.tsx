import React from 'react';
import { useLanguage } from '../i18n/LanguageContext';

const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
      <button
        onClick={() => setLanguage('en')}
        className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
          language === 'en'
            ? 'bg-blue-600 text-white shadow'
            : 'text-gray-400 hover:text-white'
        }`}
        title="English"
      >
        EN
      </button>
      <button
        onClick={() => setLanguage('es')}
        className={`px-2 py-1 rounded text-xs font-semibold transition-all ${
          language === 'es'
            ? 'bg-blue-600 text-white shadow'
            : 'text-gray-400 hover:text-white'
        }`}
        title="Español"
      >
        ES
      </button>
    </div>
  );
};

export default LanguageToggle;
