
import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { MessageItemProps, Translations } from '../types';
import { UserAvatar } from './UserAvatar';
import { IdentityWidget } from './IdentityWidget';

// --- Helper Functions ---

const formatCompactNumber = (num: number): string => {
  return Intl.NumberFormat('en-US', {
    notation: "compact",
    maximumFractionDigits: 1
  }).format(num);
};

const formatRelativeTime = (timestamp: number, t: Translations): string => {
  const now = Date.now();
  const diffInSeconds = Math.floor((now - timestamp) / 1000);

  if (diffInSeconds < 60) {
    return `${diffInSeconds} ${t.time_sec_ago}`;
  }
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} ${t.time_min_ago}`;
  }
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} ${t.time_hour_ago}`;
  }
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) {
    return `${diffInDays} ${diffInDays === 1 ? t.time_day_ago : t.time_days_ago}`;
  }
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return `${diffInMonths} ${t.time_month_ago}`;
  }
  const diffInYears = Math.floor(diffInDays / 365);
  return `${diffInYears} ${diffInYears === 1 ? t.time_year_ago : t.time_years_ago}`;
};

export const MessageItem: React.FC<MessageItemProps> = ({ 
  message, 
  currentUserId, 
  onReply, 
  onTagClick, 
  onFlashMessage, 
  onDeleteMessage, 
  onBlockUser, 
  onVote, 
  parentSequenceNumber, 
  parentSenderId, 
  allMessages, 
  isFlashHighlighted, 
  isAdmin, 
  t 
}) => {
  
  // Voting Data
  const votes = message.votes || {};
  const score = (Object.values(votes) as number[]).reduce((acc, curr) => acc + curr, 0);
  const userVote = votes[currentUserId] || 0;
  
  // Counters (Mock/Real)
  const likeCount = score > 0 ? score : 0; // Simplified for UI
  const commentCount = message.commentCount || 0;
  const shareCount = message.shareCount || 0;

  // Media Logic
  const hasMedia = message.media && message.media.length > 0;
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);

  // Menu Logic
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
            setIsMenuOpen(false);
        }
    };
    if (isMenuOpen) {
        document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
        document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Tag Rendering
  const renderContent = (content: string) => {
    const parts = content.split(/(#[a-zA-Z0-9_а-яА-ЯёЁ]+)/g);
    return parts.map((part, index) => {
      if (part.startsWith('#') && part.length <= 32) {
        return (
          <button
            key={index}
            onClick={(e) => { e.stopPropagation(); onTagClick(part); }}
            className="font-bold text-blue-500 hover:underline cursor-pointer transition-colors"
          >
            {part}
          </button>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  const handleVote = (e: React.MouseEvent, type: 'up' | 'down') => {
      e.stopPropagation();
      onVote(message.id, type);
  };

  return (
    <div id={message.id} className="w-full animate-fade-in mb-8 group">
      
      {/* ---------------- SECTION 1: HEADER ---------------- */}
      <div className="flex items-center justify-between mb-4 px-2">
         <div className="flex items-center gap-3">
             {/* Avatar (User or Community) */}
             <div className="relative">
                <UserAvatar userId={message.community || message.senderId} className="w-8 h-8 rounded-none border border-[#1D2025] dark:border-white" />
             </div>
             
             <div className="flex items-baseline gap-2">
                 {/* Name */}
                 <span className="text-sm font-bold text-black dark:text-white uppercase tracking-wider">
                     {message.community ? message.community : (message.senderName || 'ANONYMOUS')}
                 </span>
                 
                 {/* Time */}
                 <span className="text-xs text-gray-500 font-mono">
                     {formatRelativeTime(message.timestamp, t)}
                 </span>
             </div>
         </div>

         {/* More Menu */}
         <div className="relative" ref={menuRef}>
            <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-500 hover:text-black dark:hover:text-white transition-colors p-1"
            >
                <span className="material-symbols-outlined">more_horiz</span>
            </button>
            
            {isMenuOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-[#FAF9F6] dark:bg-[#1D2025] border border-black/10 dark:border-white/10 z-50 flex flex-col py-1 shadow-xl animate-fade-in">
                    
                    {/* Hide */}
                    <button className="flex items-center gap-3 w-full text-left px-4 py-3 text-[10px] font-bold uppercase text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors">
                        <span className="material-symbols-outlined text-[16px]">visibility_off</span>
                        {t.post_menu_hide}
                    </button>
                    
                    {/* Save */}
                    <button className="flex items-center gap-3 w-full text-left px-4 py-3 text-[10px] font-bold uppercase text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors">
                        <span className="material-symbols-outlined text-[16px]">bookmark</span>
                        {t.post_menu_save}
                    </button>
                    
                    {/* Subscribe */}
                    <button className="flex items-center gap-3 w-full text-left px-4 py-3 text-[10px] font-bold uppercase text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors">
                        <span className="material-symbols-outlined text-[16px]">notifications</span>
                        {t.post_menu_subscribe}
                    </button>
                    
                    {/* Report */}
                    <button className="flex items-center gap-3 w-full text-left px-4 py-3 text-[10px] font-bold uppercase text-red-600 dark:text-red-500 hover:bg-red-600 hover:text-white dark:hover:bg-red-500 dark:hover:text-white transition-colors border-t border-black/10 dark:border-white/10">
                        <span className="material-symbols-outlined text-[16px]">flag</span>
                        {t.post_menu_report}
                    </button>
                    
                    {/* Admin Actions */}
                    {(isAdmin || message.senderId === currentUserId) && (
                         <button 
                            onClick={(e) => { e.stopPropagation(); onDeleteMessage(message.id); }}
                            className="flex items-center gap-3 w-full text-left px-4 py-3 text-[10px] font-bold uppercase text-red-600 dark:text-red-500 hover:bg-red-600 hover:text-white dark:hover:bg-red-500 dark:hover:text-white transition-colors border-t border-black/10 dark:border-white/10"
                        >
                            <span className="material-symbols-outlined text-[16px]">delete</span>
                            DELETE POST
                        </button>
                    )}
                </div>
            )}
         </div>
      </div>

      {/* ---------------- SECTION 2: BODY ---------------- */}
      <div className="mb-6 px-2">
         {/* Title */}
         {message.title && (
             <h2 className="text-[18px] leading-[24px] font-bold text-black dark:text-white mb-2 line-clamp-4">
                 {message.title}
             </h2>
         )}

         {hasMedia ? (
             // --- MEDIA MODE ---
             <div className="w-full mt-3">
                 <div className="relative w-full h-[525px] bg-black border border-[#1D2025] dark:border-white/10 overflow-hidden flex items-center justify-center">
                     {/* Media Content */}
                     <img 
                        src={message.media![currentMediaIndex]} 
                        alt="Post media" 
                        className="w-full h-full object-contain"
                     />
                     
                     {/* Gallery Controls */}
                     {message.media!.length > 1 && (
                         <>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setCurrentMediaIndex(prev => prev > 0 ? prev - 1 : message.media!.length - 1) }}
                                className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white flex items-center justify-center hover:bg-white hover:text-black transition-colors"
                            >
                                <span className="material-symbols-outlined">arrow_back</span>
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setCurrentMediaIndex(prev => prev < message.media!.length - 1 ? prev + 1 : 0) }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 text-white flex items-center justify-center hover:bg-white hover:text-black transition-colors"
                            >
                                <span className="material-symbols-outlined">arrow_forward</span>
                            </button>
                            {/* Dots */}
                            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
                                {message.media!.map((_, idx) => (
                                    <div 
                                        key={idx} 
                                        className={`w-2 h-2 rounded-full ${idx === currentMediaIndex ? 'bg-white' : 'bg-white/30'}`} 
                                    />
                                ))}
                            </div>
                         </>
                     )}
                 </div>
                 {/* Content text */}
                 {message.content && (
                     <p className="mt-4 text-[14px] leading-[20px] text-gray-600 dark:text-[#B7CAD4] line-clamp-3 font-normal whitespace-pre-wrap">
                        {renderContent(message.content)}
                     </p>
                 )}
             </div>
         ) : (
             // --- TEXT MODE ---
             <div className="w-full">
                 <p className="text-[14px] leading-[20px] text-gray-600 dark:text-[#B7CAD4] line-clamp-6 font-normal whitespace-pre-wrap">
                    {renderContent(message.content)}
                 </p>
             </div>
         )}
      </div>

      {/* ---------------- SECTION 3: TOOLS ---------------- */}
      <div className="flex items-center gap-2 px-2">
          
          {/* Like Tool */}
          <div className="flex items-center bg-[#E0DED6] dark:bg-[#1D2025] h-8 rounded-sm overflow-hidden transition-colors">
              <button 
                onClick={(e) => handleVote(e, 'up')}
                className={`px-3 h-full flex items-center justify-center gap-2 hover:bg-black/5 dark:hover:bg-white/10 transition-colors ${
                    userVote === 1 ? 'text-red-500' : 'text-black dark:text-white'
                }`}
              >
                  <span className={`material-symbols-outlined text-[16px] transition-all duration-200 ${
                      userVote === 1 ? 'icon-filled scale-110' : ''
                  }`}>
                      favorite
                  </span>
                  <span className="text-xs font-bold font-mono">
                      {formatCompactNumber(likeCount)}
                  </span>
              </button>
          </div>

          {/* Comments Tool - Updated Light Mode BG to #E0DED6 */}
          <div className="flex items-center bg-[#E0DED6] dark:bg-[#1D2025] h-8 rounded-sm overflow-hidden transition-colors">
               <button 
                 onClick={(e) => { e.stopPropagation(); onReply(message); }}
                 className="px-3 h-full flex items-center justify-center gap-2 text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
               >
                   <span className="material-symbols-outlined text-[16px]">chat_bubble</span>
                   <span className="text-xs font-bold font-mono">
                      {formatCompactNumber(commentCount)}
                   </span>
               </button>
          </div>

          {/* Share Tool - Updated Light Mode BG to #E0DED6 */}
          <div className="flex items-center bg-[#E0DED6] dark:bg-[#1D2025] h-8 rounded-sm overflow-hidden transition-colors">
               <button 
                 className="px-3 h-full flex items-center justify-center gap-2 text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
               >
                   <span className="material-symbols-outlined text-[16px]">share</span>
               </button>
          </div>
      </div>
      
      {/* Divider line for visual separation in the feed, since card bg is gone */}
      <div className="w-full h-[1px] bg-black/10 dark:bg-white/10 mt-8"></div>

    </div>
  );
};
