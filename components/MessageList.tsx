
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MessageListProps, Message } from '../types';
import { MessageItem } from './MessageItem';
import { LAST_READ_KEY } from '../constants';

type TabType = 'all' | 'mine';
type SortOrder = 'newest' | 'oldest' | 'best';

export const MessageList: React.FC<MessageListProps> = ({ messages, currentUserId, onReply, onTagClick, onFlashMessage, onDeleteMessage, onBlockUser, onVote, highlightedMessageId, allMessagesRaw, isAdmin, t, locale }) => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  // CHANGED: Default sort order to 'newest' (Feed style)
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');
  
  const bottomRef = useRef<HTMLDivElement>(null);
  const topRef = useRef<HTMLDivElement>(null);
  
  // Refs to track if user is currently near the edge of the screen
  const isNearBottomRef = useRef(false);
  const isNearTopRef = useRef(true);

  const [lastReadTime, setLastReadTime] = useState<number>(() => {
      const stored = localStorage.getItem(LAST_READ_KEY);
      return stored ? parseInt(stored, 10) : Date.now();
  });

  // Track scroll position
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const windowHeight = window.innerHeight;
      const fullHeight = document.documentElement.scrollHeight;

      // User is near bottom if distance to bottom is less than 200px
      isNearBottomRef.current = (scrollTop + windowHeight) >= (fullHeight - 200);
      
      // User is near top if scrollTop is less than 200px
      isNearTopRef.current = scrollTop < 200;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // CHANGED: Removed auto-scroll on mount. 
  useEffect(() => {
    if (sortOrder === 'oldest' && isNearBottomRef.current && bottomRef.current) {
         bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, sortOrder]);

  const allMyDialogs = useMemo(() => {
    const raw = allMessagesRaw || messages;
    const myMessageIds = new Set(raw.filter(m => m.senderId === currentUserId).map(m => m.id));
    
    return raw.filter(msg => {
        const isMyMessage = msg.senderId === currentUserId;
        const isReplyToMe = msg.parentId && myMessageIds.has(msg.parentId);
        return isMyMessage || isReplyToMe;
    });
  }, [allMessagesRaw, messages, currentUserId]);

  const filteredMessages = useMemo(() => {
    let result: typeof messages = [];

    if (activeTab === 'all') {
        result = [...messages];
    } else {
        const myMessageIds = new Set(
            (allMessagesRaw || messages)
                .filter(m => m.senderId === currentUserId)
                .map(m => m.id)
        );

        result = messages.filter(msg => {
            const isMyMessage = msg.senderId === currentUserId;
            const isReplyToMe = msg.parentId && myMessageIds.has(msg.parentId);
            return isMyMessage || isReplyToMe;
        });
    }

    return result.sort((a, b) => {
        if (sortOrder === 'newest') {
            return b.timestamp - a.timestamp;
        } else if (sortOrder === 'oldest') {
            return a.timestamp - b.timestamp;
        } else {
            // BEST (Sort by score)
            const getScore = (msg: Message) => {
                const votes = msg.votes || {};
                return (Object.values(votes) as number[]).reduce((acc, curr) => acc + curr, 0);
            };
            
            const scoreA = getScore(a);
            const scoreB = getScore(b);
            
            if (scoreB !== scoreA) {
                return scoreB - scoreA; // Higher score first
            }
            // If scores equal, newest first
            return b.timestamp - a.timestamp;
        }
    });
  }, [messages, activeTab, currentUserId, allMessagesRaw, sortOrder]);

  const hasUnread = useMemo(() => {
      return allMyDialogs.some(msg => 
          msg.timestamp > lastReadTime && 
          msg.senderId !== currentUserId
      );
  }, [allMyDialogs, lastReadTime, currentUserId]);

  const handleTabChange = (tab: TabType) => {
      setActiveTab(tab);
      if (tab === 'mine') {
          const now = Date.now();
          setLastReadTime(now);
          localStorage.setItem(LAST_READ_KEY, now.toString());
      }
  };

  const getParentInfo = (parentId?: string | null) => {
      if (!parentId || !allMessagesRaw) return { seq: undefined, senderId: undefined };
      const parent = allMessagesRaw.find(m => m.id === parentId);
      return { 
          seq: parent ? parent.sequenceNumber : undefined,
          senderId: parent ? parent.senderId : undefined
      };
  };

  return (
    <div className="w-full">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[#1D2025]/10 dark:border-white/10 pb-0">
         <div className="flex items-center gap-8">
            <button 
                onClick={() => handleTabChange('all')}
                className={`pb-4 text-sm font-bold uppercase tracking-widest transition-colors relative ${
                    activeTab === 'all' 
                    ? 'text-black dark:text-white' 
                    : 'text-gray-400 dark:text-gray-600 hover:text-black dark:hover:text-white'
                }`}
            >
            {t.all_messages_tab} ({messages.length})
            {activeTab === 'all' && (
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#1D2025] dark:bg-white"></div>
            )}
            </button>

            <button 
                onClick={() => handleTabChange('mine')}
                className={`pb-4 text-sm font-bold uppercase tracking-widest transition-colors relative flex items-center gap-2 ${
                    activeTab === 'mine' 
                    ? 'text-black dark:text-white' 
                    : 'text-gray-400 dark:text-gray-600 hover:text-black dark:hover:text-white'
                }`}
            >
            {t.my_dialogs_tab}
            {hasUnread && activeTab !== 'mine' && (
                <div className="w-[6px] h-[6px] rounded-full bg-[#FF4343] animate-pulse shadow-[0_0_8px_rgba(255,67,67,0.6)]"></div>
            )}
            {activeTab === 'mine' && (
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#1D2025] dark:bg-white"></div>
            )}
            </button>
         </div>

         <div className="flex flex-wrap items-center gap-2 pb-4">
            <button 
                onClick={() => setSortOrder('newest')}
                className={`transition-colors whitespace-nowrap font-mono text-sm uppercase tracking-widest ${sortOrder === 'newest' ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-600 hover:text-black dark:hover:text-white'}`}
            >
                <span className="lg:hidden">{t.sort_newest_short}</span>
                <span className="hidden lg:inline">{t.sort_newest}</span>
            </button>
            <span className="opacity-30 text-black dark:text-white font-mono text-sm px-1">//</span>
            <button 
                onClick={() => setSortOrder('oldest')}
                className={`transition-colors whitespace-nowrap font-mono text-sm uppercase tracking-widest ${sortOrder === 'oldest' ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-600 hover:text-black dark:hover:text-white'}`}
            >
                <span className="lg:hidden">{t.sort_oldest_short}</span>
                <span className="hidden lg:inline">{t.sort_oldest}</span>
            </button>
            <span className="opacity-30 text-black dark:text-white font-mono text-sm px-1">//</span>
            <button 
                onClick={() => setSortOrder('best')}
                className={`transition-colors whitespace-nowrap font-mono text-sm uppercase tracking-widest ${sortOrder === 'best' ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-600 hover:text-black dark:hover:text-white'}`}
            >
                <span className="lg:hidden">{t.sort_best_short}</span>
                <span className="hidden lg:inline">{t.sort_best}</span>
            </button>
         </div>
      </div>
      
      {filteredMessages.length === 0 ? (
        <div className="w-full flex justify-center py-24 opacity-30">
            <p className="uppercase tracking-widest text-sm font-bold border-b border-[#1D2025] dark:border-white pb-1 text-black dark:text-white">
                {activeTab === 'all' ? t.no_entries : t.no_dialogs}
            </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
            {/* Anchor for Newest Sort */}
            <div ref={topRef} />
            
            {filteredMessages.map((msg) => {
                const { seq, senderId } = getParentInfo(msg.parentId);
                return (
                    <MessageItem 
                        key={msg.id} 
                        message={msg} 
                        currentUserId={currentUserId}
                        onReply={onReply}
                        onTagClick={onTagClick}
                        onFlashMessage={onFlashMessage}
                        onDeleteMessage={onDeleteMessage}
                        onBlockUser={onBlockUser}
                        onVote={onVote}
                        parentSequenceNumber={seq}
                        parentSenderId={senderId}
                        allMessages={allMessagesRaw || messages}
                        isFlashHighlighted={highlightedMessageId === msg.id}
                        isAdmin={isAdmin}
                        t={t}
                        locale={locale}
                    />
                );
            })}
            
            {/* Anchor for Oldest Sort */}
            <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
};
