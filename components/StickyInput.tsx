
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StickyInputProps } from '../types';
import { MAX_MESSAGE_LENGTH, MAX_TAG_LENGTH, MAX_TITLE_LENGTH } from '../constants';

export const StickyInput: React.FC<StickyInputProps> = ({ onSendMessage, isVisible, replyingTo, onCancelReply, cooldownRemaining, t, user }) => {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [tagInputText, setTagInputText] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [expanded, setExpanded] = useState(false); // Track expansion for title
  
  const inputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length === 0 || cooldownRemaining > 0) return;
    
    const manualTags = tagInputText
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

    onSendMessage(text, title, manualTags);
    setText('');
    setTitle('');
    setTagInputText('');
    setShowTagInput(false);
    setExpanded(false);
    
    if (replyingTo) onCancelReply();
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
      className="fixed bottom-0 left-0 w-full z-50 bg-white/95 dark:bg-[#252525]/95 backdrop-blur-md pb-safe border-t border-black/10 dark:border-white/10 transition-all"
    >
       {/* Replying Banner */}
       {replyingTo && (
         <div className="bg-black dark:bg-white text-white dark:text-black p-2 flex justify-between items-center border-t border-black/10 dark:border-white/10">
             <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-3 h-3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                </svg>
                {t.replying_to_prefix}{replyingTo.sequenceNumber.toString().padStart(3, '0')}
             </div>
             <button type="button" onClick={onCancelReply} className="hover:opacity-70">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
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
                    className="w-full bg-transparent border-b border-black/10 dark:border-white/10 py-1 text-sm font-bold text-black dark:text-white placeholder-gray-400 focus:outline-none"
               />
           </div>
       )}

       {/* Tag Input Area */}
       {showTagInput && (
          <div className="w-full bg-[#f2f2f2] dark:bg-[#252525] border-t border-black/10 dark:border-white/10 px-4 py-2 relative mt-1">
               <div className="relative">
                    <input 
                        ref={tagInputRef}
                        type="text" 
                        value={tagInputText}
                        onChange={handleTagChange}
                        placeholder={t.tags_placeholder}
                        className="w-full bg-transparent py-1 pr-6 text-sm font-mono text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none"
                    />
                    <button
                        type="button"
                        onClick={handleCloseTags}
                        className="absolute right-0 top-1/2 -translate-y-1/2 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
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
                className={`flex items-center justify-center w-8 h-8 border border-black/10 dark:border-white/10 transition-colors shrink-0 ${expanded ? 'bg-black text-white dark:bg-white dark:text-black' : 'text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black'}`}
                title="Expand Title"
            >
                <span className="text-xs font-bold">T</span>
            </button>
          )}

          {/* Toggle Tags Button */}
          {!showTagInput && (
             <button
                type="button"
                onClick={() => setShowTagInput(!showTagInput)}
                className="flex items-center justify-center w-8 h-8 border border-black/10 dark:border-white/10 text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors shrink-0"
                title={t.add_tag_btn}
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
              />
              
              <div className="absolute right-0 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none pl-2 bg-gradient-to-l from-white dark:from-[#252525] to-transparent">
                  {detectedTags.length > 0 ? (
                     <div className="flex gap-1">
                        {detectedTags.slice(0, 2).map((tag, i) => (
                            <span key={i} className="text-[8px] bg-black dark:bg-white text-white dark:text-black px-1">{tag}</span>
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
            disabled={text.trim().length === 0 || cooldownRemaining > 0}
            className="shrink-0 h-10 px-4 sm:px-6 border border-black/10 dark:border-white/10 text-black dark:text-white text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {cooldownRemaining > 0 ? (
                <span>{cooldownRemaining}s</span>
            ) : (
                <>
                    <span className="sm:hidden">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                        </svg>
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
