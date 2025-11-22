
import React, { useEffect, useState } from 'react';

interface PreloaderProps {
  isVisible: boolean;
}

export const Preloader: React.FC<PreloaderProps> = ({ isVisible }) => {
  const [shouldRender, setShouldRender] = useState(true);

  useEffect(() => {
    if (!isVisible) {
      // Wait for the fade-out transition (500ms) to finish before unmounting
      const timer = setTimeout(() => {
        setShouldRender(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  if (!shouldRender) return null;

  return (
    <div 
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white dark:bg-[#050505] transition-opacity duration-500 ease-out pointer-events-none ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div className="flex flex-col items-center gap-4">
        <div className="text-4xl font-bold font-mono tracking-widest text-black dark:text-white animate-pulse">
          ANONLOG
        </div>
        
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.2em] text-black/50 dark:text-white/50">
          <span>LOAD MESSAGES</span>
          <span className="w-2 h-4 bg-black dark:bg-white animate-pulse"></span>
        </div>

        <div className="mt-8 w-32 h-[2px] bg-gray-200 dark:bg-gray-800 overflow-hidden relative">
            <div className="absolute inset-0 bg-black dark:bg-white animate-[slide_0.7s_ease-in-out_forwards]"></div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slide {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(0); }
        }
      `}} />
    </div>
  );
};
