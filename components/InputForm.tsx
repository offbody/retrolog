
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { MessageInputProps } from '../types';
import { MAX_MESSAGE_LENGTH, MAX_TITLE_LENGTH, MAX_TAG_LENGTH } from '../constants';

export const InputForm: React.FC<MessageInputProps> = ({ onSendMessage, replyingTo, onCancelReply, shouldFocusOnReply = true, cooldownRemaining, t }) => {
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [tagInputText, setTagInputText] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
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
        // Wait for the message to actually be sent
        await onSendMessage(text, title, manualTags);
        
        // Only clear form if successful
        setText('');
        setTitle('');
        setTagInputText('');
        setShowTagInput(false);
        if (replyingTo) onCancelReply();

    } catch (error: any) {
        // Show error to user
        console.error("Failed to send:", error);
        alert(`ОШИБКА ОТПРАВКИ: ${error.code || error.message || 'Нет прав доступа к БД'}. Проверьте правила Firebase.`);
    } finally {
        setIsSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      handleSubmit(e);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
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
      if (replyingTo && shouldFocusOnReply && textareaRef.current) {
          textareaRef.current.focus();
      }
      
      if (replyingTo && replyingTo.tags && replyingTo.tags.length > 0) {
          const tagsString = replyingTo.tags.join(', ');
          setTagInputText(tagsString);
          setShowTagInput(true);
      }
  }, [replyingTo, shouldFocusOnReply]);

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
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-0 relative">
      
      {replyingTo && (
          <div className="w-full bg-[#1D2025] dark:bg-white text-white dark:text-black p-3 flex justify-between items-center clip-corner-top mb-[-1px] z-10">
             <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />
                </svg>
                {t.replying_to_prefix}{replyingTo.sequenceNumber.toString().padStart(3, '0')}
             </div>
             <button type="button" onClick={onCancelReply} className="hover:opacity-70">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
             </button>
          </div>
      )}

      <div 
        className="relative group w-full" 
        onFocus={() => setIsFocused(true)}
        onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) {
                setIsFocused(false);
            }
        }}
      >
        <label htmlFor="message-input" className="sr-only">Message</label>
        
        <div className={`relative w-full bg-[#f2f2f2] dark:bg-[#252525] clip-corner transition-transform duration-300 group-hover:translate-y-[-4px] flex flex-col ${replyingTo ? 'rounded-t-none' : ''}`}>
          
          {/* Title Input - Only show if NOT replying (new post) or if configured to allow titles in replies */}
          {!replyingTo && (
              <input
                ref={titleRef}
                type="text"
                value={title}
                onChange={handleTitleChange}
                placeholder={t.title_placeholder}
                className="w-full bg-transparent border-b border-[#1D2025]/5 dark:border-white/5 px-8 py-4 text-lg font-bold uppercase tracking-wide text-black dark:text-white placeholder-gray-400/70 dark:placeholder-gray-600/70 focus:outline-none"
                disabled={isSending}
              />
          )}

          {showTagInput && (
              <div className="w-full px-8 pt-4 pb-2 animate-fade-in shrink-0">
                  <div className="relative">
                    <input 
                        ref={tagInputRef}
                        type="text" 
                        value={tagInputText}
                        onChange={handleTagChange}
                        placeholder={t.tags_placeholder}
                        className="w-full bg-transparent border-b border-[#1D2025]/20 dark:border-white/20 py-2 pr-6 text-sm font-mono text-black dark:text-white placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:border-[#1D2025] dark:focus:border-white"
                        disabled={isSending}
                    />
                    <button
                        type="button"
                        onClick={handleCloseTags}
                        className="absolute right-0 top-1/2 -translate-y-1/2 text-black/50 dark:text-white/50 hover:text-black dark:hover:text-white transition-colors"
                        disabled={isSending}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                  </div>
              </div>
          )}

          <textarea
            id="message-input"
            ref={textareaRef}
            value={text}
            onChange={handleTextChange}
            onKeyDown={handleKeyDown}
            placeholder={t.input_placeholder}
            className={`w-full flex-1 bg-transparent text-black dark:text-white px-8 py-6 text-base sm:text-lg placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none resize-none ${showTagInput ? 'h-48' : 'h-40'}`}
            disabled={isSending}
          />
          
          <div className="w-full px-8 pb-8 flex items-center gap-6 shrink-0">
             <span className="text-xs text-gray-400 dark:text-gray-600 uppercase tracking-wider">
                {text.length} / {MAX_MESSAGE_LENGTH}
             </span>
             
             {!showTagInput && (
                 <button
                    type="button"
                    onClick={() => setShowTagInput(true)}
                    className={`
                        flex items-center gap-2 px-3 py-1 border border-[#1D2025] dark:border-white text-black dark:text-white
                        text-[10px] font-bold uppercase tracking-widest hover:bg-[#1D2025] hover:text-white dark:hover:bg-white dark:hover:text-black transition-all
                        ${isFocused ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}
                    `}
                    disabled={isSending}
                 >
                    <span>+</span>
                    {t.add_tag_btn}
                 </button>
             )}

             {detectedTags.length > 0 && (
                <div className="flex items-center gap-2 overflow-x-auto max-w-[120px] sm:max-w-[200px] no-scrollbar">
                    {detectedTags.map((tag, idx) => (
                        <span key={idx} className="text-[10px] bg-[#1D2025] dark:bg-white text-white dark:text-black px-2 py-0.5 font-mono whitespace-nowrap">
                            {tag}
                        </span>
                    ))}
                </div>
             )}
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center border-b border-[#1D2025] dark:border-white pb-4 mt-6">
        <span className="text-sm font-bold uppercase tracking-widest text-black dark:text-white">{t.new_entry_label}</span>
        <button
          type="submit"
          disabled={text.trim().length === 0 || cooldownRemaining > 0 || isSending}
          className="px-8 py-3 border border-[#1D2025] dark:border-white text-black dark:text-white text-sm font-bold uppercase tracking-widest hover:bg-[#1D2025] hover:text-white dark:hover:bg-white dark:hover:text-black disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
        >
          {isSending ? 'SENDING...' : (cooldownRemaining > 0 ? `${cooldownRemaining}s` : t.publish_btn)}
        </button>
      </div>
    </form>
  );
};
