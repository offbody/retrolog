
import React from 'react';
import { Translations, UserProfile } from '../types';
import { SearchBar } from './SearchBar';
import { AuthWidget } from './AuthWidget';
import { IconButton } from './IconButton';
import { PrimaryButton } from './PrimaryButton';

interface StickyHeaderProps {
  isVisible: boolean;
  userProfile: UserProfile | null;
  onLogin: () => Promise<void>;
  onToggleMenu: () => void;
  t: Translations;
  searchQuery?: string;
  onSearchChange?: (val: string) => void;
  // Theme props needed for AuthWidget
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
      className={`fixed top-0 left-0 w-full z-40 transform transition-transform duration-300 ease-in-out bg-r-light/95 dark:bg-r-dark/95 backdrop-blur-sm border-b border-black/10 dark:border-white/10 font-mono ${
        isVisible ? 'translate-y-0' : '-translate-y-full'
      }`}
    >
      <div className="w-full max-w-[1600px] mx-auto px-6 sm:px-12 py-2 sm:py-3">
        <div className="flex items-center justify-between gap-4">
            
            {/* Left: Burger Menu & Search */}
            <div className="flex-1 flex items-center justify-start gap-4 sm:gap-6">
                <IconButton 
                    onClick={onToggleMenu}
                    variant="outlined"
                    icon={<span className="material-symbols-outlined">menu</span>}
                />

                {/* Search Bar - Hidden on small mobile */}
                <div className="hidden md:block w-64 lg:w-80">
                   <SearchBar value={searchQuery} onChange={onSearchChange} t={t} variant="header" />
                </div>
            </div>
            
            {/* Center: System Name */}
            <div className="flex-none flex justify-center">
                <div 
                    className="font-bold uppercase tracking-widest text-sm cursor-pointer select-none whitespace-nowrap hidden sm:block font-mono text-black dark:text-white" 
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                    {t.system_name}
                </div>
                <div 
                    className="font-bold uppercase tracking-widest text-sm cursor-pointer select-none whitespace-nowrap sm:hidden font-mono text-black dark:text-white" 
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                >
                    RETROLOG
                </div>
            </div>

            {/* Right: Auth & Tools */}
            <div className="flex-1 flex justify-end shrink-0 items-center gap-2 sm:gap-4">
                 
                 {/* Tool Bar Group */}
                 <div className="flex items-center gap-2 mr-2">
                     
                     <div className="hidden sm:block">
                        <PrimaryButton 
                            variant="outlined"
                            onClick={onCreateClick}
                            icon={<span className="material-symbols-outlined text-[20px]">add</span>}
                        >
                            {t.action_create}
                        </PrimaryButton>
                     </div>

                     <div className="sm:hidden">
                        <IconButton 
                            variant="outlined"
                            onClick={onCreateClick}
                            icon={<span className="material-symbols-outlined">add</span>}
                        />
                     </div>
                     
                     <IconButton 
                        variant="standard"
                        badge={false} 
                        icon={<span className="material-symbols-outlined">notifications</span>}
                     />

                     <IconButton 
                        variant="standard"
                        icon={<span className="material-symbols-outlined">chat</span>}
                     />
                 </div>

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
