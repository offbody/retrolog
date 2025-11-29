
import React, { useState } from 'react';
import { Translations, UserProfile } from '../types';
import { LoginModal } from './LoginModal';

interface AuthWidgetProps {
  user: UserProfile | null;
  onLogin: () => Promise<void>;
  onLogout: () => void;
  t: Translations;
  compact?: boolean;
}

export const AuthWidget: React.FC<AuthWidgetProps> = ({ user, onLogin, onLogout, t, compact = false }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleLoginClick = () => {
      setShowLoginModal(true);
  };

  const handleGoogleLogin = async () => {
      // We pass this handler to the modal. 
      // It awaits the login process before closing the modal 
      // to ensure the popup isn't interrupted by component unmounting.
      try {
          await onLogin();
          setShowLoginModal(false);
      } catch (error) {
          // Error is logged in hook, we can keep modal open or show error toast here
          console.error("AuthWidget: Login failed", error);
      }
  };

  if (!user) {
    return (
      <>
        <button 
            onClick={handleLoginClick}
            className={`
                border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors uppercase font-bold tracking-widest whitespace-nowrap
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
      </>
    );
  }

  return (
    <div className="relative z-40">
        <button 
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-3 hover:opacity-80 transition-opacity"
        >
            <div className="text-right hidden sm:block">
                <div className="text-xs font-bold uppercase text-black dark:text-white">
                    {user.displayName || 'USER'}
                </div>
                <div className="text-[10px] font-mono text-gray-500 dark:text-gray-400">
                    KARMA: {user.karma}
                </div>
            </div>
            
            <div className="w-8 h-8 rounded bg-gray-200 overflow-hidden border border-black dark:border-white">
                {user.photoURL ? (
                    <img src={user.photoURL} alt="Av" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-black text-white font-bold">
                        {user.displayName?.[0] || 'U'}
                    </div>
                )}
            </div>
        </button>

        {showMenu && (
            <>
                <div 
                    className="fixed inset-0 z-30 cursor-default" 
                    onClick={() => setShowMenu(false)}
                ></div>
                <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-[#1a1a1a] border border-black dark:border-white shadow-lg z-40 clip-corner">
                    <div className="p-4 border-b border-black/10 dark:border-white/10 sm:hidden">
                        <div className="text-xs font-bold uppercase text-black dark:text-white">
                            {user.displayName}
                        </div>
                        <div className="text-[10px] font-mono text-gray-500">
                            KARMA: {user.karma}
                        </div>
                    </div>
                    <div className="flex flex-col">
                         <div className="px-4 py-2 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                            {t.session_key_label}
                         </div>
                         <div className="px-4 pb-2 font-mono text-xs truncate opacity-50">
                            {user.uid}
                         </div>
                         <button 
                            onClick={onLogout}
                            className="px-4 py-3 text-left text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors border-t border-black/10 dark:border-white/10"
                         >
                            {t.logout_btn}
                         </button>
                    </div>
                </div>
            </>
        )}
    </div>
  );
};
