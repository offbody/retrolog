
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { StickyInputProps } from '../types';
import { MAX_MESSAGE_LENGTH, MAX_TAG_LENGTH } from '../constants';

export const StickyInput: React.FC<StickyInputProps> = ({ onSendMessage, isVisible, replyingTo, onCancelReply, t }) => {
  const [text, setText] = useState('');
  const [tagInputText, setTagInputText] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim().length === 0) return;
    
    const manualTags = tagInputText
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

    onSendMessage(text, manualTags);
    setText('');
    setTagInputText('');
    setShowTagInput(false);
    
    if (replyingTo) onCancelReply();
  };

  // Strict Message Length Handler
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setText(val.slice(0, MAX_MESSAGE_LENGTH));
  };

  // Strict Tag Length Handler
  const handleTagChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const constrained = val.split(',').map(segment => segment.slice(0, MAX_TAG_LENGTH)).join(',');
    setTagInputText(constrained);
  };

  useEffect(() => {
      if (isVisible && replyingTo && inputRef.current) {
          inputRef.current.focus();
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
      className={`fixed bottom-0 left-0 w-full z-50 transform transition-transform duration-300 ease-in-out ${
        isVisible ? 'translate-y-0' : 'translate-y-full'
      }`}
    >
       {/* Replying Banner for Sticky */}
       {replyingTo && (
         <div className="bg-black dark:bg-white text-white dark:text-black py-1 px-4 flex justify-center items-center gap-4 text-[10px] font-bold uppercase tracking-widest">
            <span>{t.replying_to_prefix}{replyingTo.sequenceNumber.toString().padStart(3, '0')}</span>
            <button onClick={onCancelReply} className="border-b border-white/50 dark:border-black/50">{t.cancel_btn}</button>
         </div>
       )}
      
      <div className="bg-white dark:bg-[#0a0a0a] border-t border-black dark:border-white p-4 pb-6 sm:pb-4">
        <div className="max-w-[1600px] mx-auto flex flex-col gap-2">
          
          {/* Sticky Tag Input (Collapsible) */}
          {showTagInput && (
              <div className="w-full animate-fade-in">
                  <div className="relative">
                    <input 
                        ref={tagInputRef}
                        type="text"
                        value={tagInputText}
                        onChange={handleTagChange}
                        placeholder={t.tags_placeholder}
                        className="w-full bg-[#f2f2f2] dark:bg-[#1a1a1a] text-black dark:text-white text-xs font-mono p-2 pr-8 border-b border-black dark:border-white focus:outline-none"
                    />
                    <button
                        type="button"
                        onClick={handleCloseTags}
                        className="absolute right-2 top-1/2 -translate-y-1/2 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors"
                        title="Clear and Close"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                  </div>
              </div>
          )}

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                {t.quick_entry_label}
                </span>
            </div>

            <form onSubmit={handleSubmit} className="flex-grow flex flex-col gap-2">
                <div className="flex gap-2 sm:gap-4 w-full">
                    <div className="relative flex-grow group flex flex-col bg-[#f2f2f2] dark:bg-[#1a1a1a] border border-transparent focus-within:border-black dark:focus-within:border-white transition-colors">
                        
                        <div className="relative">
                            <input
                                ref={inputRef}
                                type="text"
                                value={text}
                                onChange={handleTextChange}
                                placeholder={replyingTo ? `${t.replying_to_prefix}${replyingTo.sequenceNumber}...` : t.input_placeholder}
                                maxLength={MAX_MESSAGE_LENGTH}
                                className="w-full bg-transparent text-black dark:text-white font-mono text-sm sm:text-base font-bold pl-3 sm:pl-4 py-3 sm:py-4 pr-12 focus:outline-none placeholder-gray-400 dark:placeholder-gray-600"
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 dark:text-gray-600 font-bold pointer-events-none">
                                {text.length}
                            </div>
                        </div>
                    </div>

                    {/* Toggle Tag Button (Sticky) */}
                    {!showTagInput && (
                        <button
                            type="button"
                            onClick={() => setShowTagInput(true)}
                            className="shrink-0 border border-black dark:border-white text-black dark:text-white px-3 flex items-center justify-center font-bold hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black transition-colors"
                            title={t.add_tag_btn}
                        >
                            #
                        </button>
                    )}

                    <button
                    type="submit"
                    disabled={text.trim().length === 0}
                    className="bg-black dark:bg-white text-white dark:text-black px-4 sm:px-8 text-xs sm:text-sm font-bold uppercase tracking-widest hover:bg-gray-800 dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                    {t.send_btn}
                    </button>
                </div>
                
                {/* Sticky Tag Preview */}
                {detectedTags.length > 0 && (
                    <div className="flex items-center gap-2 overflow-x-auto w-full no-scrollbar pl-1">
                        {detectedTags.map((tag, idx) => (
                            <span key={idx} className="text-[10px] bg-black dark:bg-white text-white dark:text-black px-2 py-0.5 font-mono whitespace-nowrap">
                                {tag}
                            </span>
                        ))}
                    </div>
                )}
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
