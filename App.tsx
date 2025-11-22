
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
  
  // Loading State for Preloader
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 700);
    return () => clearTimeout(timer);
  }, []);
  
  // Language State
  const [language, setLanguage] = useState<Language>('ru'); // Default to RU as per conversation context
  const t = TRANSLATIONS[language];
  const locale = language === 'ru' ? 'ru-RU' : 'en-US';

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'ru' ? 'en' : 'ru');
  };
  
  // Theme State
  const [isDark, setIsDark] = useState(false);

  // Initialize theme based on system preference or previous session could go here.
  // For now, we default to light to match the initial request.
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);
  
  // Ref for the main input section to track its visibility
  const inputSectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        // If the main input is NOT intersecting (is out of view), show the sticky input
        // We invert isIntersecting because we want to show sticky when main is hidden
        setShowStickyInput(!entry.isIntersecting);
      },
      {
        root: null, // viewport
        threshold: 0.1, // trigger when even 10% is visible/hidden
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
      // Check if query matches the sequence number (e.g. "5" matches ID 5, "005" also matches)
      const idString = msg.sequenceNumber.toString();
      const idMatch = idString.includes(query);
      
      // Check tags (safe check if tags is undefined in older messages)
      const tagMatch = (msg.tags || []).some(tag => tag.toLowerCase().includes(query));
      
      return contentMatch || idMatch || tagMatch;
    });
  }, [messages, searchQuery]);

  const handleSendMessage = (content: string, manualTags?: string[]) => {
      addMessage(content, replyingTo?.id, manualTags);
  };

  const handleTagClick = (tag: string) => {
      setSearchQuery(tag);
      // Scroll to top to see search results if needed, or just let the list update
      window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <Preloader isVisible={isLoading} />
      
      {/* Sticky Header */}
      <StickyHeader 
        isVisible={showStickyInput}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        userId={userId}
        t={t}
      />
      
      <div className="min-h-screen w-full transition-colors duration-300 pb-24 bg-white dark:bg-[#050505] text-black dark:text-white font-mono selection:bg-black selection:text-white dark:selection:bg-white dark:selection:text-black">
        <div className="w-full max-w-[1600px] mx-auto p-6 sm:p-12">
          
          {/* Responsive Header */}
          <header className="mb-12 w-full">
            
            {/* 1. DESKTOP & TABLET LANDSCAPE (Large Screens) - Single Line via Flexbox */}
            {/* Using Flex instead of Grid ensures items push each other rather than overlapping if space is tight */}
            <div className="hidden lg:flex items-center justify-between h-10 gap-4">
                
                {/* Left Column: Language - Flex-1 ensures equal spacing pull */}
                <div className="flex-1 flex justify-start">
                   <LanguageToggle language={language} toggleLanguage={toggleLanguage} />
                </div>

                {/* Center Column: Logo - Shrink-0 ensures it doesn't collapse */}
                <div className="shrink-0">
                    <a 
                      href="/"
                      className="border border-dashed border-black dark:border-white/50 px-4 py-2 uppercase text-sm tracking-widest font-bold transition-colors hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
                    >
                      {t.system_name}
                    </a>
                </div>

                {/* Right Column: Session + Theme - Flex-1 ensures equal spacing pull */}
                <div className="flex-1 flex justify-end items-center gap-8">
                   <IdentityWidget userId={userId} t={t} />
                   <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} t={t} />
                </div>
            </div>

            {/* 2. TABLET PORTRAIT & MOBILE LANDSCAPE (Medium Screens) - Two Lines */}
            <div className="hidden sm:flex lg:hidden flex-col gap-6">
                {/* Top Row: Lang - Session - Theme */}
                <div className="flex items-center justify-between w-full">
                    <LanguageToggle language={language} toggleLanguage={toggleLanguage} />
                    <IdentityWidget userId={userId} t={t} />
                    <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} t={t} />
                </div>
                {/* Bottom Row: Logo (Service Name) */}
                <div className="flex justify-center w-full">
                    <a 
                      href="/"
                      className="border border-dashed border-black dark:border-white/50 px-4 py-2 uppercase text-sm tracking-widest font-bold transition-colors hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black"
                    >
                      {t.system_name}
                    </a>
                </div>
            </div>

            {/* 3. MOBILE PORTRAIT (Small Screens) - Three Lines */}
            <div className="flex sm:hidden flex-col gap-6">
                {/* Top Row: Lang - Theme */}
                <div className="flex items-center justify-between w-full">
                    <LanguageToggle language={language} toggleLanguage={toggleLanguage} />
                    <ThemeToggle isDark={isDark} toggleTheme={toggleTheme} t={t} />
                </div>
                {/* Mid Row: Logo */}
                <div className="flex justify-center w-full">
                    <a 
                      href="/"
                      className="border border-dashed border-black dark:border-white/50 px-4 py-2 uppercase text-sm tracking-widest font-bold transition-colors hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black text-center leading-relaxed"
                    >
                      {t.system_name}
                    </a>
                </div>
                {/* Bottom Row: Identity */}
                <div className="flex justify-center w-full">
                    <IdentityWidget userId={userId} t={t} />
                </div>
            </div>
            
          </header>

          <div className="flex flex-col gap-16">
            {/* Control Center: Search & Input with Illustrations */}
            <section ref={inputSectionRef} className="w-full mx-auto flex flex-col lg:flex-row items-stretch justify-center gap-4 lg:gap-8">
               
               {/* Left Illustration (Desktop only) - Flexible Width */}
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
                    t={t}
                 />
               </div>

               {/* Right Illustration (Desktop only) - Flexible Width */}
               <div className="hidden lg:block flex-1 min-w-0">
                  <IllustrationReceiver />
               </div>

            </section>

            {/* Feed Section */}
            <main className="w-full max-w-[1600px] mx-auto">
              <MessageList 
                  messages={filteredMessages} 
                  allMessagesRaw={messages}
                  currentUserId={userId}
                  onReply={setReplyingTo}
                  onTagClick={handleTagClick}
                  t={t}
                  locale={locale}
              />
            </main>
          </div>
          
          {/* Footer */}
          <footer className="mt-24 py-6 text-center text-xs uppercase tracking-widest border-t border-black/10 dark:border-white/10 text-gray-500 dark:text-gray-400">
            <p>{t.footer}</p>
          </footer>

        </div>

        {/* Sticky Input Widget */}
        <StickyInput 
          onSendMessage={handleSendMessage} 
          isVisible={showStickyInput} 
          replyingTo={replyingTo}
          onCancelReply={() => setReplyingTo(null)}
          t={t}
        />
      </div>
    </>
  );
};

export default App;
