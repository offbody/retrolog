
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { MessageList } from './components/MessageList';
import { SearchBar } from './components/SearchBar';
// StickyInput removed
import { StickyHeader } from './components/StickyHeader';
import { Preloader } from './components/Preloader';
import { AuthWidget } from './components/AuthWidget';
import { PixelCanvas } from './components/PixelCanvas';
import { ScrollToTop } from './components/ScrollToTop';
import { AdminLogin } from './components/AdminLogin';
import { PopularTags } from './components/PopularTags';
import { CreatePostModal } from './components/CreatePostModal'; // Import new modal
import { useMessages } from './hooks/useMessages';
import { Message, Language } from './types';
import { TRANSLATIONS, PREDEFINED_TAGS } from './constants';
import { auth } from './firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { IconButton } from './components/IconButton';
import { PrimaryButton } from './components/PrimaryButton';
import { StickyInput } from './components/StickyInput'; // Import only for Reply mode, if we keep reply separate, or we can reuse modal later. For now, request said replace StickyInput at bottom. 
// Actually, StickyInput was used for replies too. If we remove it completely, we lose reply functionality.
// The user request was "уберем внизу страницы интерфейс ввода сообщения... Вместо него - по нажатию на кнопку создать".
// This implies the *always visible* bottom bar is gone. 
// I will keep StickyInput ONLY for replies (if replyingTo is set), but hide it otherwise.
// Wait, StickyInput component has `isVisible` prop.
// However, the prompt says "interface input message at bottom is no longer needed". 
// I will repurpose StickyInput ONLY for replies, or assuming for now we focus on the "Create" button flow.
// Let's modify StickyInput usage to only show when replying.

const App: React.FC = () => {
  const { messages, addMessage, deleteMessage, blockUser, toggleVote, userId, userProfile, loginWithGoogle, logout } = useMessages();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [showStickyHeader, setShowStickyHeader] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false); // Side menu state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false); // New Modal State
  
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isAuthChecked, setIsAuthChecked] = useState(false);

  useEffect(() => {
    if (window.location.pathname === '/godmode') {
      setShowAdminLogin(true);
    }
  }, []);

  useEffect(() => {
      const unsubscribe = onAuthStateChanged(auth, (user) => {
          // SECURITY FIX: Strict check for admin email only.
          if (user && user.email === 'root@retrolog.ru') {
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

  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const lastSentTime = useRef<number>(0);
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  const handleFlashMessage = (id: string) => {
    setHighlightedMessageId(id);
    setTimeout(() => {
        setHighlightedMessageId(null);
    }, 2000);
  };
  
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1700);
    return () => clearTimeout(timer);
  }, []);

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
  
  // Force Russian language
  const [language] = useState<Language>('ru'); 
  const t = TRANSLATIONS[language];
  const locale = 'ru-RU';

  // THEME LOGIC: Auto Sync with System
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
        return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Listen for system theme changes and sync automatically
  useEffect(() => {
      if (!window.matchMedia) return;
      
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = (e: MediaQueryListEvent) => {
          setIsDark(e.matches);
      };

      // Set initial value
      setIsDark(mediaQuery.matches);

      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Manual toggle
  const toggleTheme = () => setIsDark(!isDark);
  
  const topSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        const isScrolledPast = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        setShowStickyHeader(isScrolledPast);
      },
      {
        root: null,
        threshold: 0, 
        rootMargin: "-100px 0px 0px 0px" 
      }
    );

    if (topSectionRef.current) {
      observer.observe(topSectionRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const filteredMessages = useMemo(() => {
    if (selectedTag) {
        const targetTag = selectedTag.toLowerCase();
        return messages.filter(msg => 
            (msg.tags || []).some(t => t.toLowerCase() === targetTag)
        );
    }

    if (!searchQuery.trim()) return messages;

    const query = searchQuery.toLowerCase();
    return messages.filter((msg) => {
      const contentMatch = msg.content.toLowerCase().includes(query);
      const titleMatch = msg.title?.toLowerCase().includes(query) || false;
      const idString = msg.sequenceNumber.toString();
      const idMatch = idString.includes(query);
      const tagMatch = (msg.tags || []).some(tag => tag.toLowerCase().includes(query));
      
      return contentMatch || titleMatch || idMatch || tagMatch;
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

  const handleSendMessage = async (content: string, title: string, manualTags?: string[]) => {
      const now = Date.now();
      const timeSinceLast = now - lastSentTime.current;
      
      if (timeSinceLast < 5000) { // Reduced cooldown
          return;
      }

      await addMessage(content, title, replyingTo?.id, manualTags);
      lastSentTime.current = now;
      setCooldownRemaining(5);
  };

  const handleTagClick = (tag: string) => {
      if (selectedTag === tag) {
          setSelectedTag(null); 
      } else {
          setSelectedTag(tag);
          setSearchQuery(''); 
          window.scrollTo({ top: 0, behavior: 'smooth' });
          setIsDrawerOpen(false); // Close mobile drawer if open
      }
  };

  const handleSearchChange = (val: string) => {
      setSearchQuery(val);
      if (val.trim().length > 0) {
          setSelectedTag(null); 
      }
  };

  const openCreateModal = () => {
      setIsCreateModalOpen(true);
  };

  if (showAdminLogin && !isAdmin && isAuthChecked) {
      return <AdminLogin onLogin={handleAdminLogin} t={t} />;
  }

  return (
    <>
      <Preloader isVisible={isLoading} t={t} />
      
      {isCreateModalOpen && (
          <CreatePostModal 
              onClose={() => setIsCreateModalOpen(false)}
              onSendMessage={handleSendMessage}
              t={t}
          />
      )}

      <StickyHeader 
        isVisible={showStickyHeader} 
        userProfile={userProfile}
        onLogin={() => loginWithGoogle()}
        onToggleMenu={() => setIsDrawerOpen(true)}
        t={t}
        searchQuery={searchQuery}
        onSearchChange={handleSearchChange}
        isDark={isDark}
        toggleTheme={toggleTheme}
        onCreateClick={openCreateModal}
      />
      
      {/* SIDEBAR DRAWER (Mobile & Desktop Triggered by Burger) */}
      {isDrawerOpen && (
          <>
            <div 
                className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm"
                onClick={() => setIsDrawerOpen(false)}
            />
            <div className="fixed inset-y-0 left-0 z-[70] w-80 bg-r-light dark:bg-r-dark border-r border-black dark:border-white p-6 flex flex-col transform transition-transform duration-300 ease-out animate-fade-in font-mono shadow-2xl text-black dark:text-white">
                <div className="flex justify-between items-center mb-8 border-b border-black dark:border-white pb-4">
                    <span className="text-sm font-bold uppercase tracking-widest">{t.menu_btn}</span>
                    <button 
                        onClick={() => setIsDrawerOpen(false)}
                        className="p-1 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                
                <nav className="flex flex-col gap-4 flex-1 overflow-y-auto no-scrollbar">
                    {/* Search in Drawer for Mobile */}
                    <div className="lg:hidden mb-4">
                         <SearchBar value={searchQuery} onChange={handleSearchChange} t={t} />
                    </div>

                    <button 
                        onClick={() => { setSelectedTag(null); setIsDrawerOpen(false); window.scrollTo({top:0, behavior:'smooth'}); }}
                        className="text-left py-3 text-lg font-bold uppercase tracking-widest hover:pl-4 transition-all duration-300 text-black dark:text-white"
                    >
                        {t.all_messages_tab}
                    </button>
                    
                    <div className="mt-4">
                        <PopularTags 
                            tags={popularTags} 
                            onTagClick={handleTagClick} 
                            activeTag={selectedTag || ''} 
                            t={t} 
                            className="w-full"
                        />
                    </div>
                </nav>

                <div className="mt-auto pt-6 border-t border-black/10 dark:border-white/10">
                     <div className="flex flex-col gap-4">
                        {userProfile && (
                            <button onClick={logout} className="text-xs font-bold uppercase tracking-widest text-red-500 hover:text-red-600 text-left flex items-center gap-2">
                                <span className="material-symbols-outlined text-[16px]">logout</span>
                                {t.logout_btn}
                            </button>
                        )}
                        <p className="text-[10px] uppercase text-gray-400">
                            {t.mobile_footer_text_2}
                        </p>
                     </div>
                </div>
            </div>
          </>
      )}

      <div className="min-h-screen w-full transition-colors duration-300 pb-24 bg-r-light dark:bg-r-dark text-black dark:text-white font-mono selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
        <div className="w-full max-w-[1600px] mx-auto px-6 sm:p-12 pt-6">
          
          <div ref={topSectionRef}>
            {/* UNIFIED HEADER (Desktop & Mobile) */}
            <header className="mb-6 md:mb-8 w-full h-16 sm:h-20 flex items-center justify-between border-b border-black dark:border-white pb-4 sm:pb-0 sm:border-none relative gap-4">
                
                {/* LEFT: Burger Menu & Search */}
                <div className="flex-1 flex items-center justify-start gap-4 sm:gap-6">
                    <IconButton 
                        onClick={() => setIsDrawerOpen(true)}
                        variant="outlined"
                        icon={<span className="material-symbols-outlined">menu</span>}
                    />

                    {/* Search Bar - Hidden on small mobile, visible on desktop */}
                    <div className="hidden md:block w-80">
                         <SearchBar value={searchQuery} onChange={handleSearchChange} t={t} variant="header" />
                    </div>
                </div>

                {/* CENTER: System Name */}
                <div className="flex-none flex justify-center">
                    <a 
                        href="/"
                        className="border border-dashed border-black dark:border-white/50 px-4 py-2 uppercase text-xs sm:text-sm tracking-widest font-bold transition-colors hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black whitespace-nowrap hidden sm:block"
                    >
                        {t.system_name}
                    </a>
                    {/* Mobile abbreviated name */}
                     <a 
                        href="/"
                        className="border border-dashed border-black dark:border-white/50 px-2 py-2 uppercase text-xs tracking-widest font-bold transition-colors hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black whitespace-nowrap sm:hidden"
                    >
                        RETROLOG
                    </a>
                </div>

                {/* RIGHT: Auth & Tools */}
                <div className="flex-1 flex justify-end items-center gap-2 sm:gap-4">
                    
                    {/* Tool Bar Group */}
                    <div className="flex items-center gap-2 mr-2">
                         
                         {/* Create Button - Hidden on very small screens to save space, visible on SM+ */}
                         <div className="hidden sm:block">
                            <PrimaryButton 
                                variant="outlined"
                                onClick={openCreateModal}
                                icon={<span className="material-symbols-outlined text-[20px]">add</span>}
                            >
                                {t.action_create}
                            </PrimaryButton>
                         </div>

                         {/* Mobile Create Button (Icon Only) */}
                         <div className="sm:hidden">
                            <IconButton 
                                variant="outlined"
                                onClick={openCreateModal}
                                icon={<span className="material-symbols-outlined">add</span>}
                            />
                         </div>
                         
                         {/* Notifications */}
                         <IconButton 
                            variant="standard"
                            badge={false} 
                            icon={<span className="material-symbols-outlined">notifications</span>}
                         />

                         {/* Messages */}
                         <IconButton 
                            variant="standard"
                            icon={<span className="material-symbols-outlined">chat</span>}
                         />
                    </div>

                    <AuthWidget 
                        user={userProfile} 
                        onLogin={loginWithGoogle} 
                        onLogout={logout} 
                        t={t}
                        isDark={isDark}
                        toggleTheme={toggleTheme}
                    />
                </div>
            </header>

            <section className="w-full h-[100px] border-b border-black/10 dark:border-white/10 relative overflow-hidden mb-6 md:mb-8">
                <PixelCanvas />
            </section>
          </div>

          {/* MAIN LAYOUT: CSS GRID (3 Columns Feed + 1 Column Sidebar) */}
          <main className="w-full max-w-[1600px] mx-auto grid grid-cols-1 lg:grid-cols-4 gap-8">
              
              {/* Left Column (Feed) */}
              <div className="lg:col-span-3">
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
              </div>

              {/* Right Column (Sidebar) - Desktop Only */}
              <aside className="hidden lg:block lg:col-span-1 h-fit sticky top-24">
                   <PopularTags 
                      tags={popularTags} 
                      onTagClick={handleTagClick} 
                      activeTag={selectedTag || ''} 
                      t={t} 
                      className="" 
                   />
                   
                   <footer className="mt-12 text-xs uppercase tracking-widest text-gray-400 leading-relaxed opacity-50">
                       <p>{t.footer}</p>
                       <p className="mt-2">2025. MARK 1.</p>
                   </footer>
              </aside>

          </main>
          
          {/* Mobile Footer */}
          <footer className="lg:hidden mt-24 py-6 text-center text-xs uppercase tracking-widest border-t border-black/10 dark:border-white/10 text-gray-500 dark:text-gray-400">
            <p>{t.footer}</p>
          </footer>

        </div>

        <ScrollToTop />
        
        {/* Only show StickyInput when replying, acting as a reply modal of sorts */}
        {userProfile && replyingTo && (
            <StickyInput 
              onSendMessage={handleSendMessage} 
              isVisible={true}
              replyingTo={replyingTo}
              onCancelReply={() => setReplyingTo(null)}
              cooldownRemaining={cooldownRemaining}
              t={t}
              user={userProfile}
            />
        )}
      </div>
    </>
  );
};

export default App;
