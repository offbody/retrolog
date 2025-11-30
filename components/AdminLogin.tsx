import React, { useState } from 'react';
import { Translations } from '../types';
import { auth } from '../firebaseConfig';
import { signInWithEmailAndPassword } from 'firebase/auth';

interface AdminLoginProps {
  onLogin: (success: boolean) => void;
  t: Translations;
}

export const AdminLogin: React.FC<AdminLoginProps> = ({ onLogin, t }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Secure login via Firebase
      await signInWithEmailAndPassword(auth, email, password);
      onLogin(true);
    } catch (err) {
      console.error(err);
      setError('ACCESS DENIED // INVALID CREDENTIALS');
      setPassword('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-r-light dark:bg-r-dark text-black dark:text-white font-mono p-4">
      <div className="w-full max-w-md flex flex-col gap-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold uppercase tracking-widest mb-2">
            {t.admin_login_title}
          </h1>
          <div className="w-full h-[1px] bg-black dark:bg-white opacity-20"></div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-6">
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest opacity-50">EMAIL</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-r-card-light dark:bg-r-card-dark border border-transparent focus:border-black dark:focus:border-white p-4 text-sm outline-none transition-colors"
              placeholder="root@retrolog.ru"
              autoFocus
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold uppercase tracking-widest opacity-50">PASSWORD</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-r-card-light dark:bg-r-card-dark border border-transparent focus:border-black dark:focus:border-white p-4 text-sm outline-none transition-colors"
            />
          </div>

          {error && (
            <div className="text-red-500 text-xs font-bold uppercase tracking-widest text-center animate-pulse">
              {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-black dark:bg-white text-white dark:text-black py-4 text-sm font-bold uppercase tracking-widest hover:opacity-80 transition-opacity disabled:opacity-50"
          >
            {isLoading ? 'AUTHENTICATING...' : t.login_btn}
          </button>
        </form>
        
        <div className="text-center opacity-30 text-xs uppercase tracking-widest">
          <a href="/" className="hover:underline">Return to System</a>
        </div>
      </div>
    </div>
  );
};