import React from 'react';
import { Translations } from '../types';
import { IdentityWidget } from './IdentityWidget';

interface StickyHeaderProps {
  isVisible: boolean;
  searchQuery: string;
  onSearchChange: (value: string) => void;
  userId: string;
  t: Translations;
}

export const StickyHeader: React.FC<StickyHeaderProps> = ({ isVisible, searchQuery, onSearchChange, userId, t }) => {
  return (
    <div 
      className={`fixed top-0 left-0 w-full z-40 transform transition-transform duration-300 ease-in-out bg-white/95 dark:bg-[#050505]/95 backdrop-blur-sm border-b border-black/10 dark:border-white/10 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="w-full max-w-[1600px] mx-auto px-4 sm:px-12 py-3">
        <div className="flex items-center justify-between gap-4 sm:gap-8">
            
            {/* Left: Logo */}
            <div 
                className="hidden sm:block font-bold uppercase tracking-widest text-sm cursor-pointer select-none" 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            >
                ANONLOG
            </div>
            
            {/* Center: Compact Search */}
            <div className="flex-grow max-w-2xl relative">
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => onSearchChange(e.target.value)}
                    placeholder={t.search_placeholder}
                    className="w-full bg-[#f2f2f2] dark:bg-[#1a1a1a] border border-transparent focus:border-black dark:focus:border-white px-4 py-2 text-sm font-mono text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none transition-colors rounded-sm"
                />
                {searchQuery && (
                    <button 
                        onClick={() => onSearchChange('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase text-gray-400 hover:text-black dark:hover:text-white"
                    >
                        X
                    </button>
                )}
            </div>

            {/* Right: Compact Identity Widget */}
            <div className="shrink-0">
                <IdentityWidget userId={userId} t={t} compact={true} />
            </div>
        </div>
      </div>
    </div>
  );
};