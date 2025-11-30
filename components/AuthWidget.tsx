
import React, { useState, useRef, useEffect } from 'react';
import { Translations, UserProfile } from '../types';
import { LoginModal } from './LoginModal';
import { UserAvatar } from './UserAvatar';

interface AuthWidgetProps {
  user: UserProfile | null;
  onLogin: () => Promise<void>;
  onLogout: () => void;
  t: Translations;
  compact?: boolean;
  isDark: boolean;
  toggleTheme: () => void;
}

export const AuthWidget: React.FC<AuthWidgetProps> = ({ user, onLogin, onLogout, t, compact = false, isDark, toggleTheme }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleLoginClick = () => {
      setShowLoginModal(true);
  };

  const handleGoogleLogin = async () => {
      try {
          await onLogin();
          setShowLoginModal(false);
      } catch (error) {
          console.error("AuthWidget: Login failed", error);
      }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setShowMenu(false);
        }
    };
    if (showMenu) {
        document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  // If NOT Logged In
  if (!user) {
    return (
      <div className="flex items-center gap-4">
        {/* Theme Toggle for Guests */}
        <button 
          onClick={toggleTheme}
          className="flex items-center justify-center transition-colors text-[#434C58] hover:text-[#FFFFFF]"
          title={isDark ? t.theme_dark : t.theme_light}
        >
          {isDark ? (
            <span className="material-symbols-outlined">dark_mode</span>
          ) : (
            <span className="material-symbols-outlined">light_mode</span>
          )}
        </button>

        <button 
            onClick={handleLoginClick}
            className={`
                border border-[#1D2025] dark:border-white hover:bg-[#1D2025] hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors uppercase font-bold tracking-widest whitespace-nowrap
                ${compact ? 'text-[10px] px-2 py-1' : 'text-xs px-4 py-2'}
            `}
        >
            {t.login_btn}
        </button>
        
        {showLoginModal && (
            <LoginModal 
                onClose={() => setShowLoginModal(false)} 
                onGoogleLogin={handleGoogleLogin}
                t={t}
            />
        )}
      </div>
    );
  }

  // If Logged In
  return (
    <div className="relative z-40" ref={menuRef}>
        <button 
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity group"
        >
            <div className="text-right hidden sm:block">
                <div className="text-xs font-bold uppercase text-black dark:text-white group-hover:underline decoration-dashed underline-offset-4">
                    {user.displayName || 'USER'}
                </div>
                <div className="text-[10px] font-mono text-gray-500 dark:text-gray-400">
                    KARMA: {user.karma}
                </div>
            </div>
            
            {/* User Avatar Component */}
            <UserAvatar userId={user.uid} />
        </button>

        {showMenu && (
            <>
                <div className="absolute right-0 top-full mt-2 w-64 bg-[#FAF9F6] dark:bg-[#1D2025] border border-black/10 dark:border-white/10 shadow-2xl z-40 animate-fade-in flex flex-col py-1">
                    
                    {/* Header (Mobile Only) */}
                    <div className="p-4 border-b border-black/10 dark:border-white/10 sm:hidden">
                        <div className="text-xs font-bold uppercase text-black dark:text-white">
                            {user.displayName}
                        </div>
                        <div className="text-[10px] font-mono text-gray-500 dark:text-gray-400">
                            KARMA: {user.karma}
                        </div>
                    </div>

                    {/* --- EMAIL VERIFICATION WARNING --- */}
                    {!user.emailVerified && (
                        <div className="p-4 bg-red-100 dark:bg-red-900/30 border-b border-red-500/30">
                            <div className="flex items-start gap-2 text-red-600 dark:text-red-400">
                                <span className="material-symbols-outlined text-[18px] shrink-0">warning</span>
                                <div className="flex flex-col gap-1">
                                    <span className="text-[10px] font-bold uppercase tracking-widest">{t.email_verification_alert}</span>
                                    <span className="text-[10px] leading-tight opacity-80">{t.email_verification_action}</span>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex flex-col">
                         {/* PROFILE */}
                         <button className="flex items-center gap-3 w-full text-left px-4 py-3 text-[10px] font-bold uppercase text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors">
                            <span className="material-symbols-outlined text-[16px]">person</span>
                            {t.menu_profile}
                         </button>

                         {/* SETTINGS */}
                         <button className="flex items-center gap-3 w-full text-left px-4 py-3 text-[10px] font-bold uppercase text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors">
                            <span className="material-symbols-outlined text-[16px]">settings</span>
                            {t.menu_settings}
                         </button>

                         {/* THEME TOGGLE */}
                         <button 
                            onClick={(e) => { e.stopPropagation(); toggleTheme(); }}
                            className="flex items-center gap-3 w-full text-left px-4 py-3 text-[10px] font-bold uppercase text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                         >
                            {isDark ? (
                                <>
                                    <span className="material-symbols-outlined text-[16px]">light_mode</span>
                                    {t.menu_theme_day}
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined text-[16px]">dark_mode</span>
                                    {t.menu_theme_night}
                                </>
                            )}
                         </button>

                         <div className="w-full h-[1px] bg-black/10 dark:bg-white/10 my-1"></div>

                         {/* LOGOUT */}
                         <button 
                            onClick={onLogout}
                            className="flex items-center gap-3 w-full text-left px-4 py-3 text-[10px] font-bold uppercase text-red-600 dark:text-red-500 hover:bg-red-600 hover:text-white dark:hover:bg-red-500 dark:hover:text-white transition-colors"
                         >
                            <span className="material-symbols-outlined text-[16px]">logout</span>
                            {t.logout_btn}
                         </button>
                    </div>
                </div>
            </>
        )}
    </div>
  );
};
