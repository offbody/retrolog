import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StickyInputProps } from '../types';
import { MAX_MESSAGE_LENGTH, MAX_TAG_LENGTH, MAX_TITLE_LENGTH } from '../constants';

export const StickyInput: React.FC<StickyInputProps> = ({ onSendMessage, isVisible, replyingTo, onCancelReply, cooldownRemaining, t }) => {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [tagInputText, setTagInputText] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [expanded, setExpanded] = useState(false); // Track expansion for title
  const [isSending, setIsSending] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length === 0 || cooldownRemaining > 0 || isSending) return;
    
    setIsSending(true);

    const manualTags = tagInputText
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

    try {
        await onSendMessage(text, title, manualTags);
        // Only clear if success
        setText('');
        setTitle('');
        setTagInputText('');
        setShowTagInput(false);
        setExpanded(false);
        
        if (replyingTo) onCancelReply();

    } catch (error: any) {
         console.error("Failed to send:", error);
         alert(`ОШИБКА ОТПРАВКИ: ${error.code || error.message || 'Нет прав доступа к БД'}.`);
    } finally {
        setIsSending(false);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setText(val.slice(0, MAX_MESSAGE_LENGTH));
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val.slice(0, MAX_TITLE_LENGTH));
  };

  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const constrained = val.split(',').map(segment => segment.slice(0, MAX_TAG_LENGTH)).join(',');
    setTagInputText(constrained);
  };

  useEffect(() => {
      if (isVisible && replyingTo && inputRef.current) {
          inputRef.current.focus();
      }
      if (replyingTo && replyingTo.tags && replyingTo.tags.length > 0) {
          const tagsString = replyingTo.tags.join(', ');
          setTagInputText(tagsString);
          setShowTagInput(true);
      }
  }, [isVisible, replyingTo]);

  useEffect(() => {
    if (showTagInput && tagInputRef.current) {
        tagInputRef.current.focus();
    }
  }, [showTagInput]);

  const detectedTags = useMemo(() => {
    const regexMatches = text.match(/#[a-zA-Z0-9_а-яА-ЯёЁ]+/g) || [] as string[];
    
    const manualTags = tagInputText
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0)
        .map(t => t.startsWith('#') ? t : `#${t}`);

    return [...regexMatches, ...manualTags].filter(tag => tag.length <= MAX_TAG_LENGTH);
  }, [text, tagInputText]);

  const handleCloseTags = () => {
      setTagInputText('');
      setShowTagInput(false);
  };

  return (
    <div 
      className="fixed bottom-0 left-0 w-full z-50 bg-r-light/95 dark:bg-r-dark/95 backdrop-blur-md pb-safe border-t border-black/10 dark:border-white/10 transition-all"
    >
       {/* Replying Banner */}
       {replyingTo && (
         <div className="bg-[#1D2025] dark:bg-white text-white dark:text-black p-2 flex justify-between items-center border-t border-[#1D2025]/10 dark:border-white/10">
             <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                <span className="material-symbols-outlined text-[14px]">reply</span>
                {t.replying_to_prefix}{replyingTo.sequenceNumber.toString().padStart(3, '0')}
             </div>
             <button type="button" onClick={onCancelReply} className="hover:opacity-70">
                <span className="material-symbols-outlined text-[18px]">close</span>
             </button>
         </div>
       )}
       
       {/* Optional Title Input for Quick Post */}
       {expanded && !replyingTo && (
           <div className="px-4 pt-2">
               <input 
                    type="text" 
                    value={title}
                    onChange={handleTitleChange}
                    placeholder={t.title_placeholder}
                    className="w-full bg-transparent border-b border-[#1D2025]/10 dark:border-white/10 py-1 text-sm font-bold text-black dark:text-white placeholder-gray-400 focus:outline-none"
                    disabled={isSending}
               />
           </div>
       )}

       {/* Tag Input Area - Use card colors for contrast against the sticky bar bg */}
       {showTagInput && (
          <div className="w-full bg-r-card-light dark:bg-r-card-dark border-t border-[#1D2025]/10 dark:border-white/10 px-4 py-2 relative mt-1">
               <div className="relative">
                    <input 
                        ref={tagInputRef}
                        type="text" 
                        value={tagInputText}
                        onChange={handleTagChange}
                        placeholder={t.tags_placeholder}
                        className="w-full bg-transparent py-1 pr-6 text-sm font-mono text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none"
                        disabled={isSending}
                    />
                    <button
                        type="button"
                        onClick={handleCloseTags}
                        className="absolute right-0 top-1/2 -translate-y-1/2 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors"
                        disabled={isSending}
                    >
                        <span className="material-symbols-outlined text-[16px]">close</span>
                    </button>
               </div>
          </div>
       )}

       <div className="w-full px-4 py-3 flex items-center gap-4">
       <form onSubmit={handleSubmit} className="flex-1 flex items-center gap-4">
          {/* Expand/Collapse for Title */}
          {!replyingTo && (
            <button
                type="button"
                onClick={() => setExpanded(!expanded)}
                className={`flex items-center justify-center w-8 h-8 border border-[#1D2025]/10 dark:border-white/10 transition-colors shrink-0 ${expanded ? 'bg-[#1D2025] text-white dark:bg-white dark:text-black' : 'text-black dark:text-white hover:bg-[#1D2025] hover:text-white dark:hover:bg-white dark:hover:text-black'}`}
                title="Expand Title"
                disabled={isSending}
            >
                <span className="text-xs font-bold">T</span>
            </button>
          )}

          {/* Toggle Tags Button */}
          {!showTagInput && (
             <button
                type="button"
                onClick={() => setShowTagInput(!showTagInput)}
                className="flex items-center justify-center w-8 h-8 border border-[#1D2025]/10 dark:border-white/10 text-black dark:text-white hover:bg-[#1D2025] hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors shrink-0"
                title={t.add_tag_btn}
                disabled={isSending}
             >
                <span className="text-sm font-bold">#</span>
             </button>
          )}

          {/* Input Field */}
          <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={text}
                onChange={handleTextChange}
                placeholder={t.input_placeholder}
                className="w-full bg-transparent text-black dark:text-white text-base pr-14 placeholder-black dark:placeholder-white focus:outline-none"
                disabled={isSending}
              />
              
              <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none pl-2 bg-gradient-to-l from-r-light dark:from-r-dark to-transparent">
                  {detectedTags.length > 0 ? (
                     <div className="flex gap-1">
                        {detectedTags.slice(0, 2).map((tag, i) => (
                            <span key={i} className="text-[8px] bg-[#1D2025] dark:bg-white text-white dark:text-black px-1">{tag}</span>
                        ))}
                        {detectedTags.length > 2 && <span className="text-[8px] text-gray-400">...</span>}
                     </div>
                  ) : (
                     <span className="text-[10px] text-gray-400 dark:text-gray-600">
                        {text.length}/{MAX_MESSAGE_LENGTH}
                     </span>
                  )}
              </div>
          </div>

          {/* Send Button */}
          <button
            type="submit"
            disabled={text.trim().length === 0 || cooldownRemaining > 0 || isSending}
            className="shrink-0 h-10 px-4 sm:px-6 border border-[#1D2025]/10 dark:border-white/10 text-black dark:text-white text-xs font-bold uppercase tracking-widest hover:bg-[#1D2025] hover:text-white dark:hover:bg-white dark:hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {isSending ? (
                <span className="animate-pulse">...</span>
            ) : cooldownRemaining > 0 ? (
                <span>{cooldownRemaining}s</span>
            ) : (
                <>
                    <span className="sm:hidden">
                        <span className="material-symbols-outlined">send</span>
                    </span>
                    <span className="hidden sm:inline">{t.send_btn}</span>
                </>
            )}
          </button>
       </form>
       </div>
    </div>
  );
};