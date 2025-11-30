import React from 'react';
import { SearchBarProps } from '../types';

interface CustomSearchBarProps extends SearchBarProps {
  variant?: 'default' | 'header';
}

export const SearchBar: React.FC<CustomSearchBarProps> = ({ value, onChange, t }) => {
  // Variant is currently passed in props but unused in logic as styles were unified.
  // Removed from destructuring to satisfy linter.
  
  return (
    <div 
      className={`
        w-full flex items-center gap-4 transition-colors duration-300
        border-b border-[#1D2025]/10 dark:border-white/10 
        hover:border-[#1D2025] dark:hover:border-white 
        focus-within:border-[#1D2025] dark:focus-within:border-white 
        pb-4 bg-transparent
      `}
    >
      <label htmlFor="search" className="text-sm font-bold uppercase tracking-widest whitespace-nowrap text-black dark:text-white cursor-pointer">
        {t.search_label}
      </label>
      <input
        id="search"
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={t.search_placeholder}
        className="w-full bg-transparent font-mono text-sm uppercase tracking-widest placeholder-gray-400 dark:placeholder-gray-600 text-black dark:text-white focus:outline-none"
      />
      {value && (
        <button 
          onClick={() => onChange('')}
          className="text-xs font-bold uppercase text-black dark:text-white hover:text-gray-500 dark:hover:text-gray-400"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      )}
    </div>
  );
};