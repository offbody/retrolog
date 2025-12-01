
import React from 'react';
import { Translations, UserProfile } from '../types';
import { SearchBar } from './SearchBar';
import { AuthWidget } from './AuthWidget';
import { IconButton } from './IconButton';
import { PrimaryButton } from './PrimaryButton';
import { PixelCanvas } from './PixelCanvas';

interface StickyHeaderProps {
  isVisible: boolean;
  userProfile: UserProfile | null;
  onLogin: () => Promise<void>;
  onToggleMenu: () => void;
  t: Translations;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  isDark: boolean;
  toggleTheme: () => void;
  onCreateClick?: () => void;
}

export const StickyHeader: React.FC<StickyHeaderProps> = ({ 
  isVisible, 
  userProfile, 
  onLogin, 
  onToggleMenu, 
  t, 
  searchQuery = '', 
  onSearchChange = () => {}, 
  isDark, 
  toggleTheme,
  onCreateClick 
}) => {
  return (
    <div 
      className={`md:hidden fixed top-0 left-0 w-full z-[60] transform transition-transform duration-300 ease-in-out bg-r-light/95 dark:bg-r-dark/95 backdrop-blur-sm border-b border-black/10 dark:border-white/10 font-mono ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="w-full max-w-[1600px] mx-auto px-4 h-16 flex items-center">
        <div className="w-full flex items-center justify-between gap-2">
            
            {/* Left: Burger Menu */}
            <div className="shrink-0">
                <IconButton 
                    onClick={onToggleMenu}
                    variant="outlined"
                    icon={<span className="material-symbols-outlined">menu</span>}
                    className="shrink-0 !border-none"
                />
            </div>
            
            {/* Center: Mobile Pixel Canvas (Scaled Down 2.5x) */}
            <div className="flex-1 flex justify-center min-w-0 mx-2 overflow-hidden">
                <div className="h-[36px] w-full max-w-[228px] relative">
                    <div className="absolute top-0 left-0 w-[250%] h-[250%] origin-top-left scale-[0.4]">
                        <PixelCanvas />
                    </div>
                </div>
            </div>

            {/* Right: Auth Widget */}
            <div className="shrink-0 flex justify-end items-center">
                <AuthWidget 
                    user={userProfile} 
                    onLogin={onLogin} 
                    onLogout={() => { window.location.reload(); }} 
                    t={t}
                    isDark={isDark}
                    toggleTheme={toggleTheme}
                />
            </div>
        </div>
      </div>
    </div>
  );
};
