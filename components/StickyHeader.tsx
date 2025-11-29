
import React from 'react';
import { Translations, UserProfile } from '../types';
import { generateColorFromId } from './IdentityWidget';
import { SearchBar } from './SearchBar';

interface StickyHeaderProps {
  isVisible: boolean;
  userProfile: UserProfile | null;
  onLogin: () => Promise<void>;
  onToggleMenu: () => void;
  t: Translations;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
}

export const StickyHeader: React.FC<StickyHeaderProps> = ({ isVisible, userProfile, onLogin, onToggleMenu, t, searchQuery = '', onSearchChange = () => {} }) => {
  return (
    <div 
      className={`fixed top-0 left-0 w-full z-40 transform transition-transform duration-300 ease-in-out bg-white/95 dark:bg-[#121212]/95 backdrop-blur-sm border-b border-black/10 dark:border-white/10 ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-12 py-3">
        <div className="flex items-center justify-between gap-4">
            
            {/* Left: Burger Menu & Search */}
            <div className="flex-1 flex items-center justify-start gap-6">
                <button 
                    onClick={onToggleMenu}
                    className="w-10 h-10 flex items-center justify-center border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors shrink-0"
                    aria-label="Open Menu"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    </svg>
                </button>

                {/* Search Bar - Hidden on small mobile */}
                <div className="hidden md:block w-64 lg:w-80">
                   <SearchBar value={searchQuery} onChange={onSearchChange} t={t} variant="header" />
                </div>
            </div>
            
            {/* Center: System Name */}
            <div className="flex-none flex justify-center">
                <div 
                    className="font-mono font-bold uppercase tracking-widest text-sm cursor-pointer select-none whitespace-nowrap hidden sm:block" 
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                    {t.system_name}
                </div>
                <div 
                    className="font-mono font-bold uppercase tracking-widest text-sm cursor-pointer select-none whitespace-nowrap sm:hidden" 
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                    ANONLOG
                </div>
            </div>

            {/* Right: Auth Logic */}
            <div className="flex-1 flex justify-end shrink-0">
                {userProfile ? (
                     <div className="flex items-center gap-3">
                        <span className="text-xs font-bold uppercase text-black dark:text-white">
                            {userProfile.displayName || 'USER'}
                        </span>
                        
                        {/* Colored Square Avatar */}
                        <div 
                            className="w-8 h-8 border border-black dark:border-white"
                            style={{ backgroundColor: generateColorFromId(userProfile.uid) }}
                        />
                     </div>
                ) : (
                    <button 
                        onClick={() => onLogin()}
                        className="border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors uppercase font-bold tracking-widest whitespace-nowrap text-xs px-4 py-2"
                    >
                        {t.login_btn}
                    </button>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};
