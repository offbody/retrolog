import React from 'react';
import { Language } from '../types';

interface LanguageToggleProps {
  language: Language;
  toggleLanguage: () => void;
}

export const LanguageToggle: React.FC<LanguageToggleProps> = ({ language, toggleLanguage }) => {
  return (
    <button 
      onClick={toggleLanguage}
      className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest hover:opacity-70 transition-opacity select-none"
      aria-label="Toggle Language"
    >
      <span className={`flex items-center gap-2 ${language === 'ru' ? "opacity-100 text-black dark:text-white" : "opacity-30 text-gray-500"}`}>
        [RU]
      </span>
      
      <span className="opacity-30">//</span>
      
      <span className={`flex items-center gap-2 ${language === 'en' ? "opacity-100 text-black dark:text-white" : "opacity-30 text-gray-500"}`}>
        [EN]
      </span>
    </button>
  );
};