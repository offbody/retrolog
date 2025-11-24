
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MessageList } from './components/MessageList';
import { SearchBar } from './components/SearchBar';
import { StickyInput } from './components/StickyInput';
import { StickyHeader } from './components/StickyHeader';
import { ThemeToggle } from './components/ThemeToggle';
import { LanguageToggle } from './components/LanguageToggle';
import { Preloader } from './components/Preloader';
import { IdentityWidget } from './components/IdentityWidget';
import { PixelCanvas } from './components/PixelCanvas';
import { ScrollToTop } from './components/ScrollToTop';
import { AdminLogin } from './components/AdminLogin';
import { PopularTags } from './components/PopularTags';
import { useMessages } from './hooks/useMessages';
import { Message, Language } from './types';
import { TRANSLATIONS, PREDEFINED_TAGS } from './constants';
import { auth } from './firebaseConfig';
import { onAuthStateChanged, signOut } from 'firebase/auth';

const App: React.FC = () => {
  const { messages, addMessage, deleteMessage, blockUser, toggleVote, userId } = useMessages();
  
  // Search & Tag States (Independent)
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Sticky Input is always visible now
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  
  // Scroll State for Sticky Header
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  
  // Mobile Menu State
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSearchMode, setIsSearchMode] = useState(false); // Mobile Search Mode
  
  // Admin Logic (Secure)
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  // Check for God Mode URL on mount
  useEffect(() => {
    if (window.location.pathname === '/godmode') {
      setShowAdminLogin(true);
    }
  }, []);

  // Monitor Firebase Auth State
  useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
          if (user) {
              setIsAdmin(true);
          } else {
              setIsAdmin(false);
          }
          setIsAuthChecked(true);
      });
      return () => unsubscribe();
  }, []);

  const handleAdminLogin = (success: boolean) => {
      if (success) {
          setShowAdminLogin(false);
          window.history.replaceState(null, '', '/');
      }
  };

  const handleAdminLogout = async () => {
      await signOut(auth);
      setIsAdmin(false);
      alert('LOGGED OUT FROM GOD MODE');
  };

  // Cooldown Logic
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const lastSentTime = useRef<number>(0);

  // Highlight Logic
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  const handleFlashMessage = (id: string) => {
    setHighlightedMessageId(id);
    setTimeout(() => {
        setHighlightedMessageId(null);
    }, 2000);
  };
  
  // Loading State for Preloader
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1700);
    return () => clearTimeout(timer);
  }, []);

  // Cooldown Timer Effect
  useEffect(() => {
    if (cooldownRemaining > 0) {
        const timer = setInterval(() => {
            setCooldownRemaining((prev) => {
                if (prev <= 1) return 0;
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timer);
    }
  }, [cooldownRemaining]);
  
  // Language State
  const [language, setLanguage] = useState<Language>('ru'); 
  const t = TRANSLATIONS[language];
  const locale = language === 'ru' ? 'ru-RU' : 'en-US';

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ru' ? 'en' : 'ru');
  };
  
  // Theme State with Persistence
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
        const savedTheme = localStorage.getItem('anon_log_theme');
        if (savedTheme) {
            return savedTheme === 'dark';
        }
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('anon_log_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('anon_log_theme', 'light');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);
  
  const topSectionRef = useRef<HTMLDivElement>(null);

  // Sticky Header Scroll Observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Show sticky header when the top section (header + canvas) scrolls out of view
        // But only if we scrolled DOWN (boundingClientRect.top < 0)
        const isScrolledPast = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        setShowStickyHeader(isScrolledPast);
      },
      {
        root: null,
        threshold: 0, // Trigger as soon as even 1px is out
        rootMargin: "-100px 0px 0px 0px" // Add some buffer
      }
    );

    if (topSectionRef.current) {
      observer.observe(topSectionRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  // Centralized Filter Logic
  const filteredMessages = useMemo(() => {
    // 1. Tag Filter Priority
    if (selectedTag) {
        const targetTag = selectedTag.toLowerCase();
        return messages.filter(msg => 
            (msg.tags || []).some(t => t.toLowerCase() === targetTag)
        );
    }

    // 2. Search Query Filter
    if (!searchQuery.trim()) return messages;

    const query = searchQuery.toLowerCase();
    return messages.filter((msg) => {
      const contentMatch = msg.content.toLowerCase().includes(query);
      const idString = msg.sequenceNumber.toString();
      const idMatch = idString.includes(query);
      const tagMatch = (msg.tags || []).some(tag => tag.toLowerCase().includes(query));
      
      return contentMatch || idMatch || tagMatch;
    });
  }, [messages, searchQuery, selectedTag]);

  const popularTags = useMemo(() => {
      const counts: Record<string, number> = {};
      
      messages.forEach(msg => {
          if (msg.tags) {
              msg.tags.forEach(tag => {
                  const key = tag.trim(); 
                  counts[key] = (counts[key] || 0) + 1;
              });
          }
      });
      
      PREDEFINED_TAGS.forEach(preTag => {
          const keyWithHash = '#' + preTag;
          if (!counts[keyWithHash]) {
              counts[keyWithHash] = 0;
          }
      });
      
      return Object.entries(counts)
          .sort(([, countA], [, countB]) => countB - countA)
          .map(([tag, count]) => ({ tag, count }));
  }, [messages]);

  const handleSendMessage = (content: string, manualTags?: string[]) => {
      const now = Date.now();
      const timeSinceLast = now - lastSentTime.current;
      
      if (timeSinceLast < 15000) {
          return;
      }

      addMessage(content, replyingTo?.id, manualTags);
      lastSentTime.current = now;
      setCooldownRemaining(15);
  };

  // Tag Click Handler: Sets Tag, Clears Search
  const handleTagClick = (tag: string) => {
      if (selectedTag === tag) {
          setSelectedTag(null); // Toggle off
      } else {
          setSelectedTag(tag);
          setSearchQuery(''); // Clear independent search
          window.scrollTo({ top: 0, behavior: 'smooth' });
      }
  };

  // Search Change Handler: Sets Search, Clears Tag
  const handleSearchChange = (val: string) => {
      setSearchQuery(val);
      if (val.trim().length > 0) {
          setSelectedTag(null); // Reset tag selection if typing
      }
  };

  if (showAdminLogin && !isAdmin && isAuthChecked) {
      return <AdminLogin onLogin={handleAdminLogin} t={t} />;
  }

  return (
    <>
      <Preloader isVisible={isLoading} t={t} />
      
      {/* Sticky Header */}
      <StickyHeader 
        isVisible={showStickyHeader} 
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange} 
        userId={userId}
        t={t}
      />
      
      {/* MOBILE BURGER MENU OVERLAY */}
      {isMobileMenuOpen && (
          <div className="fixed inset-0 z-[60] bg-white dark:bg-[#121212] p-6 flex flex-col font-mono">
              <div className="flex justify-end mb-8">
                  <button 
                    onClick={() => setIsMobileMenuOpen(false)} 
                    className="p-1.5 border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                  >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                  </button>
              </div>
              
              <div className="flex flex-col gap-6 items-center justify-center flex-1 w-full max-w-sm mx-auto">
                  {/* 1. Identity Block */}
                  <div className="w-full border border-dashed border-black/30 dark:border-white/30 p-6 flex flex-col items-center gap-4">
                      <span className="text-xs font-bold uppercase tracking-widest opacity-50">{t.system_name}</span>
                      <div className="scale-125">
                        <IdentityWidget userId={userId} t={t} />
                      </div>
                  </div>

                  <div className="w-full h-[1px] bg-black/10 dark:bg-white/10 my-2"></div>
                  
                  {/* 2. Language Toggle */}
                  <button 
                      onClick={toggleLanguage}
                      className="w-full border border-black dark:border-white p-4 flex items-center justify-center gap-4 text-lg font-bold uppercase tracking-widest hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                  >
                      <span className={language === 'ru' ? "opacity-100" : "opacity-30"}>RU</span>
                      <span className="opacity-30">//</span>
                      <span className={language === 'en' ? "opacity-100" : "opacity-30"}>EN</span>
                  </button>
                  
                  {isAdmin && (
                    <button onClick={handleAdminLogout} className="w-full mt-4 text-sm font-bold bg-red-500 text-white p-4 hover:bg-red-600 uppercase tracking-widest border border-red-600">
                        {t.logout_btn}
                    </button>
                  )}
              </div>

              <div className="mt-auto pt-8 text-center opacity-40 text-[10px] uppercase tracking-widest leading-relaxed">
                  <p>{t.mobile_footer_text_1}</p>
                  <p>{t.mobile_footer_text_2}</p>
              </div>
          </div>
      )}

      <div className="min-h-screen w-full transition-colors duration-300 pb-24 bg-white dark:bg-[#121212] text-black dark:text-white font-mono selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
        <div className="w-full max-w-[1600px] mx-auto px-6 sm:p-12 pt-6">
          
          {/* WRAP HEADER + CANVAS IN A REF FOR SCROLL TRACKING */}
          <div ref={topSectionRef}>
            <header className="mb-2 md:mb-8 lg:mb-8 w-full">
                {/* DESKTOP */}
                <div className="hidden lg:flex items-center justify-between h-10 gap-4">
                    <div className="flex-1 flex justify-start items-center gap-8">
                    <LanguageToggle language={language} toggleLanguage={toggleLanguage} />
                    
                    <div className="flex items-center gap-4">
                            <span className="text-sm font-bold uppercase tracking-widest text-black dark:text-white whitespace-nowrap">
                                {t.search_label}
                            </span>
                            <div className="relative w-64 group">
                                <input 
                                    type="text" 
                                    value={searchQuery}
                                    onChange={(e) => handleSearchChange(e.target.value)} // Use new handler
                                    placeholder={t.search_placeholder}
                                    className="w-full bg-transparent border-b border-black/20 dark:border-white/20 py-1 text-sm font-mono uppercase tracking-widest text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-black dark:focus:border-white transition-colors"
                                />
                                {searchQuery && (
                                    <button 
                                        onClick={() => handleSearchChange('')}
                                        className="absolute right-0 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase text-gray-400 hover:text-black dark:hover:text-white"
                                    >
                                        X
                                    </button>
                                )}
                            </div>
                    </div>
                    </div>
                    <div className="shrink-0 flex gap-4">
                        <a 
                        href="/"
                        className="border border-dashed border-black dark:border-white/50 px-4 py-2 uppercase text-sm tracking-widest font-bold transition-colors hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
                        >
                        {t.system_name}
                        </a>
                        {isAdmin && (
                            <button onClick={handleAdminLogout} className="text-xs font-bold bg-red-500 text-white px-2 hover:bg-red-600">
                                {t.logout_btn}
                            </button>
                        )}
                    </div>
                    <div className="flex-1 flex justify-end items-center gap-8">
                    <IdentityWidget userId={userId} t={t} />
                    <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} t={t} />
                    </div>
                </div>

                {/* TABLET */}
                <div className="hidden md:flex lg:hidden flex-col gap-6">
                    <div className="flex items-center justify-between w-full">
                        <LanguageToggle language={language} toggleLanguage={toggleLanguage} />
                        <IdentityWidget userId={userId} t={t} />
                        <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} t={t} />
                    </div>
                    <div className="flex justify-center items-center gap-2 w-full">
                        <a 
                        href="/"
                        className="border border-dashed border-black dark:border-white/50 px-4 py-2 uppercase text-sm tracking-widest font-bold transition-colors hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
                        >
                        {t.system_name}
                        </a>
                        {isAdmin && (
                            <button onClick={handleAdminLogout} className="text-xs font-bold bg-red-500 text-white px-2 py-1 hover:bg-red-600">
                                {t.logout_btn}
                            </button>
                        )}
                    </div>
                </div>

                {/* MOBILE HEADER */}
                <div className="flex md:hidden flex-col gap-2">
                    {isSearchMode ? (
                        <div className="flex items-center gap-3 w-full border-b border-black dark:border-white pb-2 h-10 transition-all">
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 shrink-0">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                            </svg>
                            <input 
                                autoFocus
                                type="text" 
                                value={searchQuery}
                                onChange={(e) => handleSearchChange(e.target.value)} // Use new handler
                                placeholder={t.search_placeholder_short}
                                className="flex-1 bg-transparent text-base font-mono uppercase tracking-widest text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none"
                            />
                            <button 
                                onClick={() => {
                                    if (searchQuery) handleSearchChange('');
                                    else setIsSearchMode(false);
                                }}
                                className="text-xs font-bold uppercase tracking-widest shrink-0"
                            >
                                {searchQuery ? t.search_clear : (
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="relative w-full h-10 flex sm:grid sm:grid-cols-3 items-center justify-between">
                            {/* Left: Identity */}
                            <div className="flex items-center justify-start">
                                <IdentityWidget userId={userId} t={t} compact={true} />
                            </div>
                            
                            {/* Center: Logo (Landscape only) */}
                            <div className="hidden sm:flex items-center justify-center">
                                <a 
                                href="/"
                                className="border border-dashed border-black dark:border-white/50 px-3 py-1.5 uppercase text-xs tracking-widest font-bold transition-colors hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black leading-none whitespace-nowrap"
                                >
                                {t.system_name}
                                </a>
                            </div>

                            {/* Right: Icons */}
                            <div className="flex items-center justify-end gap-3">
                                <button 
                                    onClick={toggleTheme}
                                    className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-black dark:text-white hover:opacity-70 transition-opacity"
                                >
                                    <span>[{isDark ? t.theme_dark : t.theme_light}]</span>
                                    {isDark ? (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
                                        </svg>
                                    ) : (
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
                                        </svg>
                                    )}
                                </button>

                                <button onClick={() => setIsSearchMode(true)} className="p-1">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                                    </svg>
                                </button>
                                <button 
                                    onClick={() => setIsMobileMenuOpen(true)}
                                    className="p-1.5 border border-black dark:border-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                    
                    {/* Logo for Mobile Portrait only (< sm) */}
                    <div className="sm:hidden flex justify-center items-center w-full mt-2">
                        <a 
                        href="/"
                        className="border border-dashed border-black dark:border-white/50 px-3 py-2 uppercase text-xs tracking-widest font-bold transition-colors hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black whitespace-nowrap"
                        >
                        {t.system_name}
                        </a>
                    </div>
                </div>
            </header>

            {/* HERO: PIXEL CANVAS */}
            <section className="w-full h-[100px] bg-[#f2f2f2] dark:bg-[#252525] border-b border-black/10 dark:border-white/10 relative overflow-hidden mb-4">
                <PixelCanvas />
            </section>
          </div>

          <main className="w-full max-w-[1600px] mx-auto">
              {/* Pass selectedTag as activeTag to PopularTags */}
              <PopularTags tags={popularTags} onTagClick={handleTagClick} activeTag={selectedTag || ''} t={t} />
              
              <div className="w-full hidden md:block lg:hidden mb-8">
                  <SearchBar value={searchQuery} onChange={handleSearchChange} t={t} />
              </div>
              
              <MessageList 
                  messages={filteredMessages} 
                  allMessagesRaw={messages}
                  currentUserId={userId}
                  onReply={setReplyingTo}
                  onTagClick={handleTagClick}
                  onFlashMessage={handleFlashMessage}
                  onDeleteMessage={deleteMessage}
                  onBlockUser={blockUser}
                  onVote={toggleVote}
                  highlightedMessageId={highlightedMessageId}
                  isAdmin={isAdmin}
                  t={t}
                  locale={locale}
              />
          </main>
          
          <footer className="mt-24 py-6 text-center text-xs uppercase tracking-widest border-t border-black/10 dark:border-white/10 text-gray-500 dark:text-gray-400">
            <p>{t.footer}</p>
          </footer>

        </div>

        <ScrollToTop />

        <StickyInput 
          onSendMessage={handleSendMessage} 
          isVisible={true} 
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          cooldownRemaining={cooldownRemaining}
          t={t}
        />
      </div>
    </>
  );
};

export default App;
