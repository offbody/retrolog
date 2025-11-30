import React from 'react';
import { Translations } from '../types';

interface ThemeToggleProps {
  isDark: boolean;
  toggleTheme: () => void;
  t?: Translations; // Optional to not break if parent not ready immediately
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ isDark, toggleTheme, t }) => {
  return (
    <button 
      onClick={toggleTheme}
      className="flex items-center justify-center transition-colors text-[#434C58] hover:text-[#FFFFFF]"
      aria-label={isDark ? "Current theme: Dark" : "Current theme: Light"}
      title={isDark ? t?.theme_dark : t?.theme_light}
    >
      {isDark ? (
        <span className="material-symbols-outlined">dark_mode</span>
      ) : (
        <span className="material-symbols-outlined">light_mode</span>
      )}
    </button>
  );
};