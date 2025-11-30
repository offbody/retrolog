import React, { useState, useEffect } from 'react';

export const ScrollToTop: React.FC = () => {
  const [showTop, setShowTop] = useState(false);
  const [showBottom, setShowBottom] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight;

      // Show TOP button if scrolled down more than 500px
      setShowTop(scrollTop > 500);

      // Show BOTTOM button if not at the very bottom (with 500px buffer)
      // AND if the page is actually scrollable (content > viewport)
      const isNearBottom = scrollTop + windowHeight >= fullHeight - 500;
      setShowBottom(!isNearBottom && fullHeight > windowHeight);
    };

    window.addEventListener('scroll', handleScroll);
    // Check initially
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  const scrollToBottom = () => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: 'smooth',
    });
  };

  // If neither is visible, render nothing to keep DOM clean
  if (!showTop && !showBottom) return null;

  return (
    <div className="fixed bottom-32 right-4 sm:right-8 z-30 flex flex-col gap-3">
      
      {/* Scroll To Top */}
      <button
        onClick={scrollToTop}
        className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white dark:bg-[#252525] border border-[#1D2025] dark:border-white text-black dark:text-white hover:bg-[#1D2025] hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-500 shadow-lg ${
            showTop ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none absolute'
        }`}
        aria-label="Scroll to top"
      >
        <span className="material-symbols-outlined">arrow_upward</span>
      </button>

      {/* Scroll To Bottom */}
      <button
        onClick={scrollToBottom}
        className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center bg-white dark:bg-[#252525] border border-[#1D2025] dark:border-white text-black dark:text-white hover:bg-[#1D2025] hover:text-white dark:hover:bg-white dark:hover:text-black transition-all duration-500 shadow-lg ${
            showBottom ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4 pointer-events-none absolute'
        }`}
        aria-label="Scroll to bottom"
      >
        <span className="material-symbols-outlined">arrow_downward</span>
      </button>
    </div>
  );
};