
import React, { useState, useMemo } from 'react';
import { MessageListProps } from '../types';
import { MessageItem } from './MessageItem';
import { LAST_READ_KEY } from '../constants';

type TabType = 'all' | 'mine';
type SortOrder = 'newest' | 'oldest';

export const MessageList: React.FC<MessageListProps> = ({ messages, currentUserId, onReply, onTagClick, allMessagesRaw, t, locale }) => {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [sortOrder, setSortOrder] = useState<SortOrder>('newest');

  // State to track when the user last viewed "My Dialogs"
  const [lastReadTime, setLastReadTime] = useState<number>(() => {
      const stored = localStorage.getItem(LAST_READ_KEY);
      return stored ? parseInt(stored, 10) : Date.now();
  });

  // 1. Calculate ALL "My Dialogs" messages (unfiltered by search) to check for notifications
  const allMyDialogs = useMemo(() => {
    const raw = allMessagesRaw || messages;
    const myMessageIds = new Set(raw.filter(m => m.senderId === currentUserId).map(m => m.id));
    
    return raw.filter(msg => {
        const isMyMessage = msg.senderId === currentUserId;
        const isReplyToMe = msg.parentId && myMessageIds.has(msg.parentId);
        return isMyMessage || isReplyToMe;
    });
  }, [allMessagesRaw, messages, currentUserId]);

  // 2. Calculate visible messages for the current view (filtered by search if applied in App) AND Sorted
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

    // Apply Sorting
    return result.sort((a, b) => {
        if (sortOrder === 'newest') {
            return b.timestamp - a.timestamp;
        } else {
            return a.timestamp - b.timestamp;
        }
    });
  }, [messages, activeTab, currentUserId, allMessagesRaw, sortOrder]);

  // Check if there is any message in "My Dialogs" that is newer than lastReadTime
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

  // Helper to find parent sequence number
  const getParentSequence = (parentId?: string) => {
      if (!parentId || !allMessagesRaw) return undefined;
      const parent = allMessagesRaw.find(m => m.id === parentId);
      return parent ? parent.sequenceNumber : undefined;
  };

  return (
    <div className="w-full">
      <div className="mb-8 flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-black/10 dark:border-white/10 pb-0">
         {/* Tabs Left */}
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
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-black dark:bg-white"></div>
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
            {/* Unread Indicator */}
            {hasUnread && activeTab !== 'mine' && (
                <div className="w-[6px] h-[6px] rounded-full bg-[#FF4343] animate-pulse shadow-[0_0_8px_rgba(255,67,67,0.6)]"></div>
            )}
            {activeTab === 'mine' && (
                <div className="absolute bottom-0 left-0 w-full h-[2px] bg-black dark:bg-white"></div>
            )}
            </button>
         </div>

         {/* Sorting Controls Right */}
         <div className="flex items-center gap-3 pb-4 text-[10px] sm:text-xs font-bold uppercase tracking-widest">
            <button 
                onClick={() => setSortOrder('newest')}
                className={`transition-colors ${sortOrder === 'newest' ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-600 hover:text-black dark:hover:text-white'}`}
            >
                {t.sort_newest}
            </button>
            <span className="opacity-30 text-black dark:text-white">//</span>
            <button 
                onClick={() => setSortOrder('oldest')}
                className={`transition-colors ${sortOrder === 'oldest' ? 'text-black dark:text-white' : 'text-gray-400 dark:text-gray-600 hover:text-black dark:hover:text-white'}`}
            >
                {t.sort_oldest}
            </button>
         </div>
      </div>
      
      {filteredMessages.length === 0 ? (
        <div className="w-full flex justify-center py-24 opacity-30">
            <p className="uppercase tracking-widest text-sm font-bold border-b border-black dark:border-white pb-1 text-black dark:text-white">
                {activeTab === 'all' ? t.no_entries : t.no_dialogs}
            </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
            {filteredMessages.map((msg) => (
            <MessageItem 
                key={msg.id} 
                message={msg} 
                currentUserId={currentUserId}
                onReply={onReply}
                onTagClick={onTagClick}
                parentSequenceNumber={getParentSequence(msg.parentId)}
                t={t}
                locale={locale}
            />
            ))}
        </div>
      )}
    </div>
  );
};