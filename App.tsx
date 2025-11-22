
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { InputForm } from './components/InputForm';
import { MessageList } from './components/MessageList';
import { SearchBar } from './components/SearchBar';
import { StickyInput } from './components/StickyInput';
import { StickyHeader } from './components/StickyHeader';
import { ThemeToggle } from './components/ThemeToggle';
import { LanguageToggle } from './components/LanguageToggle';
import { Preloader } from './components/Preloader';
import { IdentityWidget } from './components/IdentityWidget';
import { IllustrationSender } from './components/IllustrationSender';
import { IllustrationReceiver } from './components/IllustrationReceiver';
import { useMessages } from './hooks/useMessages';
import { Message, Language } from './types';
import { TRANSLATIONS } from './constants';

const App: React.FC = () => {
  const { messages, addMessage, userId } = useMessages();
  const [searchQuery, setSearchQuery] = useState('');
  const [showStickyInput, setShowStickyInput] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  
  // Cooldown Logic
  const [cooldownRemaining, setCooldownRemaining] = useState(0);
  const lastSentTime = useRef<number>(0);

  // Highlight Logic
  const [highlightedMessageId, setHighlightedMessageId] = useState<string | null>(null);

  const handleFlashMessage = (id: string) => {
    setHighlightedMessageId(id);
    // Clear highlight after animation plays (e.g. 2 seconds)
    setTimeout(() => {
        setHighlightedMessageId(null);
    }, 2000);
  };
  
  // Loading State for Preloader
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 700);
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
  
  const inputSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowStickyInput(!entry.isIntersecting);
      },
      {
        root: null,
        threshold: 0.1,
        rootMargin: "-50px 0px 0px 0px" 
      }
    );

    if (inputSectionRef.current) {
      observer.observe(inputSectionRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, []);

  const filteredMessages = useMemo(() => {
    if (!searchQuery.trim()) return messages;

    const query = searchQuery.toLowerCase();
    return messages.filter((msg) => {
      const contentMatch = msg.content.toLowerCase().includes(query);
      const idString = msg.sequenceNumber.toString();
      const idMatch = idString.includes(query);
      const tagMatch = (msg.tags || []).some(tag => tag.toLowerCase().includes(query));
      
      return contentMatch || idMatch || tagMatch;
    });
  }, [messages, searchQuery]);

  const handleSendMessage = (content: string, manualTags?: string[]) => {
      const now = Date.now();
      const timeSinceLast = now - lastSentTime.current;
      
      // 15 seconds cooldown
      if (timeSinceLast < 15000) {
          return;
      }

      addMessage(content, replyingTo?.id, manualTags);
      lastSentTime.current = now;
      setCooldownRemaining(15);
  };

  const handleTagClick = (tag: string) => {
      setSearchQuery(tag);
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Preloader isVisible={isLoading} t={t} />
      
      <StickyHeader 
        isVisible={showStickyInput}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        userId={userId}
        t={t}
      />
      
      <div className="min-h-screen w-full transition-colors duration-300 pb-24 bg-white dark:bg-[#050505] text-black dark:text-white font-mono selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
        <div className="w-full max-w-[1600px] mx-auto p-6 sm:p-12">
          
          <header className="mb-12 w-full">
             {/* DESKTOP & TABLET LANDSCAPE */}
            <div className="hidden lg:flex items-center justify-between h-10 gap-4">
                <div className="flex-1 flex justify-start">
                   <LanguageToggle language={language} toggleLanguage={toggleLanguage} />
                </div>
                <div className="shrink-0">
                    <a 
                      href="/"
                      className="border border-dashed border-black dark:border-white/50 px-4 py-2 uppercase text-sm tracking-widest font-bold transition-colors hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
                    >
                      {t.system_name}
                    </a>
                </div>
                <div className="flex-1 flex justify-end items-center gap-8">
                   <IdentityWidget userId={userId} t={t} />
                   <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} t={t} />
                </div>
            </div>

             {/* TABLET PORTRAIT / MOBILE LANDSCAPE */}
            <div className="hidden sm:flex lg:hidden flex-col gap-6">
                <div className="flex items-center justify-between w-full">
                    <LanguageToggle language={language} toggleLanguage={toggleLanguage} />
                    <IdentityWidget userId={userId} t={t} />
                    <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} t={t} />
                </div>
                <div className="flex justify-center w-full">
                    <a 
                      href="/"
                      className="border border-dashed border-black dark:border-white/50 px-4 py-2 uppercase text-sm tracking-widest font-bold transition-colors hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
                    >
                      {t.system_name}
                    </a>
                </div>
            </div>

            {/* MOBILE PORTRAIT */}
            <div className="flex sm:hidden flex-col gap-6">
                <div className="flex items-center justify-between w-full">
                    <LanguageToggle language={language} toggleLanguage={toggleLanguage} />
                    <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} t={t} />
                </div>
                <div className="flex justify-center w-full">
                    <a 
                      href="/"
                      className="border border-dashed border-black dark:border-white/50 px-4 py-2 uppercase text-sm tracking-widest font-bold transition-colors hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black text-center leading-relaxed"
                    >
                      {t.system_name}
                    </a>
                </div>
                <div className="flex justify-center w-full">
                    <IdentityWidget userId={userId} t={t} />
                </div>
            </div>
          </header>

          <div className="flex flex-col gap-16">
            <section ref={inputSectionRef} className="w-full mx-auto flex flex-col lg:flex-row items-stretch justify-center gap-4 lg:gap-8">
               <div className="hidden lg:block flex-1 min-w-0">
                  <IllustrationSender />
               </div>

               <div className="w-full max-w-md mx-auto lg:mx-0 flex flex-col gap-8 shrink-0 z-10">
                 <SearchBar value={searchQuery} onChange={setSearchQuery} t={t} />
                 <InputForm 
                    onSendMessage={handleSendMessage} 
                    replyingTo={replyingTo}
                    onCancelReply={() => setReplyingTo(null)}
                    shouldFocusOnReply={!showStickyInput}
                    cooldownRemaining={cooldownRemaining}
                    t={t}
                 />
               </div>

               <div className="hidden lg:block flex-1 min-w-0">
                  <IllustrationReceiver />
               </div>
            </section>

            <main className="w-full max-w-[1600px] mx-auto">
              <MessageList 
                  messages={filteredMessages} 
                  allMessagesRaw={messages}
                  currentUserId={userId}
                  onReply={setReplyingTo}
                  onTagClick={handleTagClick}
                  onFlashMessage={handleFlashMessage}
                  highlightedMessageId={highlightedMessageId}
                  t={t}
                  locale={locale}
              />
            </main>
          </div>
          
          <footer className="mt-24 py-6 text-center text-xs uppercase tracking-widest border-t border-black/10 dark:border-white/10 text-gray-500 dark:text-gray-400">
            <p>{t.footer}</p>
          </footer>

        </div>

        <StickyInput 
          onSendMessage={handleSendMessage} 
          isVisible={showStickyInput} 
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
