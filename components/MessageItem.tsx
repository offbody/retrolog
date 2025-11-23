
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { MessageItemProps } from '../types';
import { IdentityWidget } from './IdentityWidget';

export const MessageItem: React.FC<MessageItemProps> = ({ message, currentUserId, onReply, onTagClick, onFlashMessage, onDeleteMessage, onBlockUser, onVote, parentSequenceNumber, parentSenderId, isFlashHighlighted, isAdmin, t, locale }) => {
  const date = new Date(message.timestamp);
  const timeString = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  const dateString = date.toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
  
  const isOwnMessage = message.senderId === currentUserId;

  // Highlight Logic (Flash)
  const isFresh = Date.now() - message.timestamp < 1000;
  const [isFreshHighlighted, setIsFreshHighlighted] = useState(isFresh);

  useEffect(() => {
    if (isFreshHighlighted) {
      const timer = setTimeout(() => setIsFreshHighlighted(false), 1400);
      return () => clearTimeout(timer);
    }
  }, [isFreshHighlighted]);

  // Mobile Long Press Logic
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isLongPress = useRef(false);

  const handleTouchStart = () => {
    isLongPress.current = false;
    timerRef.current = setTimeout(() => {
      isLongPress.current = true;
      setShowMobileMenu(true);
      if (navigator.vibrate) navigator.vibrate(50);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleTouchMove = () => {
    if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
    }
  };

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content);
    setShowMobileMenu(false);
  }, [message.content]);

  const handleReplyAction = () => {
    onReply(message);
    setShowMobileMenu(false);
  };

  const handleDeleteAction = (e: React.MouseEvent) => {
      e.stopPropagation();
      onDeleteMessage(message.id);
  };

  const handleBlockAction = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (window.confirm("ADMIN: ЗАБЛОКИРОВАТЬ ПОЛЬЗОВАТЕЛЯ? Его сообщения перестанут отображаться.")) {
          onBlockUser(message.senderId);
      }
  };

  const handleScrollToParent = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (message.parentId) {
      const parentEl = document.getElementById(message.parentId);
      if (parentEl) {
        onFlashMessage(message.parentId);
        parentEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  // Voting Logic
  const votes = message.votes || {} as Record<string, number>;
  // Explicitly cast Object.values(votes) to number[] to avoid TypeScript inference issues
  const score = (Object.values(votes) as number[]).reduce((acc: number, curr: number) => acc + curr, 0);
  const userVote = votes[currentUserId] || 0; // 1 (up), -1 (down), or 0

  const handleVoteAction = (e: React.MouseEvent, type: 'up' | 'down') => {
      e.stopPropagation();
      onVote(message.id, type);
  };

  const formattedParentHash = useMemo(() => {
      if (!parentSenderId) return '...';
      const start = parentSenderId.substring(0, 4);
      const end = parentSenderId.substring(parentSenderId.length - 4);
      return `${start}•••${end}`.toUpperCase();
  }, [parentSenderId]);

  const renderContent = (content: string) => {
    const parts = content.split(/(#[a-zA-Z0-9_а-яА-ЯёЁ]+)/g);
    
    return parts.map((part, index) => {
      if (part.startsWith('#') && part.length <= 32) {
        return (
          <button
            key={index}
            onClick={(e) => { e.stopPropagation(); onTagClick(part); }}
            className="font-bold text-blue-600 dark:text-blue-400 hover:text-black dark:hover:text-white hover:underline cursor-pointer transition-colors"
          >
            {part}
          </button>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  // Determine background color based on state
  const bgColorClass = useMemo(() => {
      if (isFreshHighlighted || isFlashHighlighted) {
           return 'bg-[#C8D4EF] dark:bg-[#1e3a8a]'; // Flash color
      }
      return 'bg-[#F2F2F2] dark:bg-[#1a1a1a]'; // Default background
  }, [isFreshHighlighted, isFlashHighlighted]);

  return (
    <div id={message.id} className="w-full animate-fade-in relative">
      <div 
        className={`w-full clip-corner p-6 flex flex-col gap-3 transition-colors duration-1000 ease-out group relative touch-manipulation ${bgColorClass}`}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        onMouseDown={handleTouchStart}
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
      >
        
        {/* 1. META HEADER */}
        <div className="flex items-center justify-between w-full border-b border-black/5 dark:border-white/5 pb-2 mb-1 gap-2">
            <div className="flex items-center flex-wrap gap-3 text-xs font-bold text-gray-500 dark:text-gray-500 uppercase tracking-wider">
                <IdentityWidget userId={message.senderId} t={t} size="small" compact />
                <span className="opacity-30">//</span>
                <span className="font-mono whitespace-nowrap">
                    {dateString} {timeString}
                </span>

                {isOwnMessage && (
                    <>
                        <span className="opacity-30">//</span>
                        <span className="bg-black dark:bg-white text-white dark:text-black px-1.5 py-0.5 text-[10px]">
                            {t.you_label}
                        </span>
                    </>
                )}

                {message.isAdmin && (
                    <>
                        <span className="opacity-30">//</span>
                        <span className="bg-[#FF7F50] text-black px-1.5 py-0.5 text-[10px]">
                            {t.admin_badge}
                        </span>
                    </>
                )}

                {parentSequenceNumber !== undefined && (
                    <>
                        <span className="opacity-30 hidden sm:inline">//</span>
                        <button 
                            onClick={handleScrollToParent}
                            className="flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-black dark:hover:text-white hover:underline transition-colors cursor-pointer"
                            title="Go to parent message"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                            </svg>
                            <span>{t.replying_to_prefix}{formattedParentHash}</span>
                        </button>
                    </>
                )}
            </div>

            <div className="flex items-center gap-4">
                {isAdmin && (
                    <div className="flex gap-2">
                        <button
                            onClick={handleBlockAction}
                            className="px-2 h-6 bg-black text-white flex items-center justify-center font-bold shadow-md hover:bg-gray-800 text-[10px] uppercase tracking-wider"
                            title="ADMIN: Block User"
                        >
                            BLOCK
                        </button>
                        <button
                            onClick={handleDeleteAction}
                            className="w-6 h-6 bg-red-500 text-white flex items-center justify-center rounded-full font-bold shadow-md hover:bg-red-600"
                            title="ADMIN: Delete Message"
                        >
                            X
                        </button>
                    </div>
                )}

                <div className="hidden sm:flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <button 
                        onClick={handleReplyAction}
                        className="text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        title={t.reply_btn}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                        </svg>
                    </button>
                    <button 
                        onClick={handleCopy}
                        className="text-black dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        title={t.copy_btn}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 01-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 011.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 00-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.38l-7.5 5.47m7.5-6.818V7.375c0-.621-.504-1.125-1.125-1.125H9.375" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>

        {/* 2. TAGS SECTION */}
        {message.tags && message.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
                {message.tags.map((tag, idx) => (
                    <button 
                    key={idx}
                    onClick={(e) => { e.stopPropagation(); onTagClick(tag); }}
                    className="text-[10px] font-bold uppercase tracking-wider bg-black/5 dark:bg-white/10 hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black text-gray-600 dark:text-gray-400 px-2 py-1 rounded transition-colors font-mono"
                    >
                    {tag}
                    </button>
                ))}
            </div>
        )}

        {/* 3. CONTENT SECTION (Regular font weight) */}
        <div className="w-full relative">
          <p className="text-black dark:text-white text-lg font-normal leading-snug break-words whitespace-pre-wrap">
            {renderContent(message.content)}
          </p>
        </div>

        {/* 4. FOOTER: VOTING (Bottom Right) */}
        <div className="absolute bottom-6 right-6 flex items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
             {/* Upvote */}
             <button 
                onClick={(e) => handleVoteAction(e, 'up')}
                className={`transition-transform active:scale-90 ${
                    userVote === 1 
                    ? 'text-black dark:text-white' 
                    : 'text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white'
                }`}
                title="Upvote"
             >
                {/* Reddit Style Block Arrow Up */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6" fill={userVote === 1 ? "currentColor" : "none"} stroke={userVote === 1 ? "none" : "currentColor"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 4L3 13h6v7h6v-7h6z" />
                </svg>
             </button>

             {/* Score */}
             <span className="text-sm font-bold font-mono min-w-[1ch] text-center text-black dark:text-white">
                {score}
             </span>

             {/* Downvote */}
             <button 
                onClick={(e) => handleVoteAction(e, 'down')}
                className={`transition-transform active:scale-90 ${
                    userVote === -1 
                    ? 'text-black dark:text-white' 
                    : 'text-gray-400 dark:text-gray-500 hover:text-black dark:hover:text-white'
                }`}
                title="Downvote"
             >
                {/* Reddit Style Block Arrow Down */}
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" className="w-6 h-6" fill={userVote === -1 ? "currentColor" : "none"} stroke={userVote === -1 ? "none" : "currentColor"} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 20l9-9h-6V4H9v7H3z" />
                </svg>
             </button>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
           <div className="absolute inset-0 z-20 bg-white/95 dark:bg-black/95 backdrop-blur-md flex items-center justify-center gap-8 animate-fade-in clip-corner">
              {/* Mobile menu content omitted for brevity - same as before */}
              <button onClick={handleReplyAction} className="flex flex-col items-center gap-2 p-4">
                 <div className="w-14 h-14 rounded-full border-2 border-black dark:border-white flex items-center justify-center bg-black text-white dark:bg-white dark:text-black shadow-lg">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                    </svg>
                 </div>
                 <span className="text-xs font-bold uppercase tracking-widest">{t.reply_btn}</span>
              </button>
              <button onClick={handleCopy} className="flex flex-col items-center gap-2 p-4">
                 <div className="w-14 h-14 rounded-full border-2 border-black dark:border-white flex items-center justify-center shadow-lg bg-white dark:bg-black">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                 </div>
                 <span className="text-xs font-bold uppercase tracking-widest">{t.copy_btn}</span>
              </button>
              <button onClick={(e) => { e.stopPropagation(); setShowMobileMenu(false); }} className="absolute top-4 right-4 p-2 hover:opacity-50">
                 <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                 </svg>
              </button>
           </div>
        )}
      </div>
    </div>
  );
};
