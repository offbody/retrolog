
import React, { useState } from 'react';
import { Translations, UserProfile } from '../types';
import { auth, db } from '../firebaseConfig';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    updateProfile
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

interface LoginModalProps {
  onClose: () => void;
  onGoogleLogin: () => Promise<void>;
  t: Translations;
}

export const LoginModal: React.FC<LoginModalProps> = ({ onClose, onGoogleLogin, t }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  
  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const toggleMode = () => {
    setMode(prev => prev === 'login' ? 'register' : 'login');
    setError(null);
  };

  const getErrorMessage = (errCode: string): string => {
      switch (errCode) {
          case 'auth/invalid-email': return t.error_invalid_email;
          case 'auth/user-disabled': return t.error_user_disabled;
          case 'auth/user-not-found': return t.error_user_not_found;
          case 'auth/wrong-password': return t.error_wrong_password;
          case 'auth/invalid-credential': return t.error_wrong_password;
          case 'auth/email-already-in-use': return t.error_email_already_in_use;
          case 'auth/weak-password': return t.error_weak_password;
          case 'missing-fields': return t.error_missing_fields;
          default: return t.error_generic;
      }
  };

  const handleGoogleClick = async () => {
      setIsLoading(true);
      setError(null);
      try {
          await onGoogleLogin();
          // Modal closes in parent component on success
      } catch (e) {
          setIsLoading(false);
          // Error logged in parent
      }
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (!email.trim() || !password.trim()) {
          setError(getErrorMessage('missing-fields'));
          return;
      }

      if (mode === 'register' && !username.trim()) {
          setError(getErrorMessage('missing-fields'));
          return;
      }

      setIsLoading(true);

      try {
          if (mode === 'login') {
              await signInWithEmailAndPassword(auth, email, password);
              onClose(); // Close modal on success
          } else {
              // Registration Flow
              const userCredential = await createUserWithEmailAndPassword(auth, email, password);
              const user = userCredential.user;

              // 1. Update Auth Profile (Display Name)
              await updateProfile(user, {
                  displayName: username
              });

              // 2. Create Firestore Document Immediately
              const newUserProfile: UserProfile = {
                  uid: user.uid,
                  displayName: username,
                  email: user.email,
                  photoURL: null,
                  karma: 0,
                  createdAt: Date.now()
              };

              await setDoc(doc(db, 'users', user.uid), newUserProfile);
              
              onClose();
          }
      } catch (err: any) {
          console.error(err);
          const errorCode = err.code || 'unknown';
          setError(getErrorMessage(errorCode));
      } finally {
          setIsLoading(false);
      }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-white/80 dark:bg-black/90 backdrop-blur-md p-4 animate-fade-in font-mono">
      <div className="relative w-full max-w-[450px] bg-white dark:bg-[#121212] border-2 border-black dark:border-white shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] dark:shadow-[8px_8px_0px_0px_rgba(255,255,255,1)] flex flex-col">
        
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b-2 border-black dark:border-white p-4 bg-black dark:bg-white text-white dark:text-black">
            <span className="text-sm font-bold uppercase tracking-widest">
                {mode === 'login' ? t.auth_title_login : t.auth_title_register} //
            </span>
            <button 
                onClick={onClose}
                className="hover:opacity-50 transition-opacity font-bold"
                disabled={isLoading}
            >
                [ESC]
            </button>
        </div>

        <div className="p-6 md:p-8 flex flex-col gap-6">
            
            {/* Disclaimer */}
            <p className="text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400 leading-relaxed text-justify border-l-2 border-gray-300 dark:border-gray-700 pl-3">
                {t.auth_disclaimer}
            </p>

            {/* Primary Actions */}
            <div className="flex flex-col gap-3">
                {/* Google Button */}
                <button 
                    type="button"
                    onClick={handleGoogleClick}
                    disabled={isLoading}
                    className="group relative w-full h-14 bg-transparent border border-black dark:border-white flex items-center justify-center gap-4 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-all active:translate-y-[2px] disabled:opacity-50 disabled:cursor-wait"
                >
                    <div className="w-5 h-5 bg-white p-0.5 rounded-sm flex items-center justify-center">
                         <svg viewBox="0 0 24 24" className="w-full h-full">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.2 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest">
                        {isLoading ? 'CONNECTING...' : t.auth_google_btn}
                    </span>
                    {!isLoading && <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-[8px]">→</div>}
                </button>

                {/* Apple Button (Mock) */}
                <button 
                    type="button"
                    className="w-full h-12 opacity-50 bg-[#f2f2f2] dark:bg-[#1a1a1a] border border-dashed border-black dark:border-white flex items-center justify-center gap-3 cursor-not-allowed" 
                    disabled
                >
                    <svg className="w-4 h-4 text-black dark:text-white" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.79C2.79 14.21 3.51 7.6 9.02 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.48-1.23 3.64-1.24.92.02 3.6.26 4.61 2.31-.08.05-2.8 1.66-2.79 4.94.01 3.94 3.48 5.24 3.5 5.27-.03.1-.55 1.94-1.81 3.95zm-4.14-14.24c.66-1.23.31-2.81.31-2.81s-1.39.12-2.85 1.74c-1.09 1.19-1.28 2.92-1.28 2.92s1.53.14 3.82-1.85z"/>
                    </svg>
                    <span className="text-xs font-bold uppercase tracking-widest">{t.auth_apple_btn}</span>
                </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-4">
                <div className="h-[1px] flex-1 bg-black/20 dark:bg-white/20"></div>
                <span className="text-[10px] font-bold text-black/40 dark:text-white/40 uppercase tracking-widest">// {t.auth_or_divider} //</span>
                <div className="h-[1px] flex-1 bg-black/20 dark:bg-white/20"></div>
            </div>

            {/* Inputs Form */}
            <form className="flex flex-col gap-4 opacity-100" onSubmit={handleSubmit}>
                <div className="flex flex-col gap-1">
                     <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{t.auth_email_label}*</label>
                     <input 
                        type="email" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-[#f2f2f2] dark:bg-[#1f1f1f] border-b-2 border-black/10 dark:border-white/10 focus:border-black dark:focus:border-white px-4 py-3 text-sm font-mono outline-none transition-colors text-black dark:text-white placeholder-gray-500"
                        placeholder="USER@NET.LOC"
                        disabled={isLoading}
                     />
                </div>
                
                {mode === 'register' && (
                     <div className="flex flex-col gap-1 animate-fade-in">
                        <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{t.auth_username_label}</label>
                        <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full bg-[#f2f2f2] dark:bg-[#1f1f1f] border-b-2 border-black/10 dark:border-white/10 focus:border-black dark:focus:border-white px-4 py-3 text-sm font-mono outline-none transition-colors text-black dark:text-white placeholder-gray-500"
                            placeholder="NEO_2025"
                            disabled={isLoading}
                        />
                    </div>
                )}

                <div className="flex flex-col gap-1">
                     <label className="text-[9px] font-bold uppercase tracking-widest text-gray-400">{t.auth_password_label}*</label>
                     <input 
                        type="password" 
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-[#f2f2f2] dark:bg-[#1f1f1f] border-b-2 border-black/10 dark:border-white/10 focus:border-black dark:focus:border-white px-4 py-3 text-sm font-mono outline-none transition-colors text-black dark:text-white placeholder-********"
                        placeholder="••••••••"
                        disabled={isLoading}
                     />
                </div>
                
                <div className="flex justify-between items-center mt-1">
                     {error ? (
                        <span className="text-[10px] font-bold uppercase tracking-wide text-red-500 animate-pulse">
                            [ERR]: {error}
                        </span>
                     ) : (
                         mode === 'login' ? (
                            <a href="#" className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-black dark:hover:text-white transition-colors hover:underline decoration-dashed">
                                {t.auth_forgot_pass}
                            </a>
                        ) : <span></span>
                     )}
                </div>

                <button 
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 bg-black dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-[0.2em] hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors mt-2 shadow-lg disabled:opacity-50 disabled:cursor-wait flex items-center justify-center gap-2"
                >
                    {isLoading && (
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                    )}
                    {mode === 'login' ? t.auth_submit_login : t.auth_submit_register}
                </button>
            </form>

            {/* Mode Switcher */}
            <div className="flex items-center justify-center gap-2 pt-2 text-[10px] font-bold uppercase tracking-widest text-gray-500">
                <span>
                    {mode === 'login' ? t.auth_no_account : t.auth_has_account}
                </span>
                <button 
                    type="button"
                    onClick={toggleMode}
                    className="text-black dark:text-white border-b border-black dark:border-white pb-0.5 hover:opacity-50 transition-opacity"
                    disabled={isLoading}
                >
                    {mode === 'login' ? t.auth_switch_register : t.auth_switch_login}
                </button>
            </div>

        </div>
      </div>
    </div>
  );
};
