

import React, { useState, useRef, useEffect } from 'react';
import { Translations } from '../types';
import { MAX_TAG_LENGTH, MAX_TITLE_LENGTH, MAX_MESSAGE_LENGTH } from '../constants';

interface CreatePostModalProps {
  onClose: () => void;
  onSendMessage: (content: string, title: string, manualTags?: string[]) => Promise<void>;
  t: Translations;
}

type TabType = 'text' | 'media' | 'link';

export const CreatePostModal: React.FC<CreatePostModalProps> = ({ onClose, onSendMessage, t }) => {
  const [activeTab, setActiveTab] = useState<TabType>('text');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [tagInputText, setTagInputText] = useState('');
  const [showTagInput, setShowTagInput] = useState(false);
  const [isSending, setIsSending] = useState(false);

  const modalRef = useRef<HTMLDivElement>(null);
  const tagInputRef = useRef<HTMLInputElement>(null);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
        if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
            onClose();
        }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  useEffect(() => {
    if (showTagInput && tagInputRef.current) {
        tagInputRef.current.focus();
    }
  }, [showTagInput]);

  const handleSubmit = async () => {
      // Validation Logic
      if (!title.trim()) return;
      if (activeTab === 'text' && !text.trim()) return;
      if (activeTab === 'link' && !linkUrl.trim()) return;
      if (isSending) return;
      
      setIsSending(true);

      const manualTags = tagInputText
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);

      try {
          // Combine content based on active tab
          let finalContent = text;
          
          if (activeTab === 'link' && linkUrl.trim()) {
              // If link tab, append link to text or use as sole content
              finalContent = `${text}\n\n${linkUrl.trim()}`.trim();
          }

          await onSendMessage(finalContent, title, manualTags);
          onClose();
      } catch (e) {
          console.error(e);
          setIsSending(false);
      }
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setTitle(e.target.value.slice(0, MAX_TITLE_LENGTH));
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setText(e.target.value.slice(0, MAX_MESSAGE_LENGTH));
  };

  // Check if form is valid for submission
  const isSubmitDisabled = 
      isSending || 
      !title.trim() || 
      (activeTab === 'text' && !text.trim()) || 
      (activeTab === 'link' && !linkUrl.trim());

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in font-mono">
        <div ref={modalRef} className="w-full max-w-4xl bg-r-light dark:bg-r-dark border border-[#1D2025] dark:border-white/20 shadow-2xl flex flex-col max-h-[90vh] h-auto overflow-hidden">
            
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#1D2025]/10 dark:border-white/10 shrink-0">
                <h2 className="text-lg font-bold text-black dark:text-white">{t.create_post_title}</h2>
                <div className="flex items-center gap-4">
                     <button className="text-xs font-bold uppercase tracking-widest text-[#1D2025] dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors">
                         {t.drafts_btn}
                     </button>
                     <button onClick={onClose} className="hover:opacity-50 transition-opacity">
                         <span className="material-symbols-outlined">close</span>
                     </button>
                </div>
            </div>

            <div className="flex flex-col h-full overflow-y-auto">
                <div className="p-4 sm:p-6 pb-0 flex flex-col gap-4 shrink-0">
                    {/* Community Selector (Square) */}
                    <div>
                        <button className="flex items-center gap-2 bg-[#1D2025]/5 dark:bg-white/10 px-4 py-2 hover:bg-[#1D2025]/10 dark:hover:bg-white/20 transition-colors w-full sm:w-auto">
                            <div className="w-5 h-5 rounded-full bg-gray-400 flex items-center justify-center text-white font-bold text-[10px]">r/</div>
                            <span className="text-sm font-bold text-black dark:text-white truncate">{t.choose_community}</span>
                            <span className="material-symbols-outlined text-[16px] ml-auto sm:ml-2">expand_more</span>
                        </button>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-8 border-b border-[#1D2025]/10 dark:border-white/10">
                        {[
                            { id: 'text', label: t.tab_text },
                            { id: 'media', label: t.tab_media },
                            { id: 'link', label: t.tab_link },
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as TabType)}
                                className={`pb-3 text-sm font-bold uppercase tracking-widest relative transition-colors ${
                                    activeTab === tab.id 
                                    ? 'text-black dark:text-white' 
                                    : 'text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
                                }`}
                            >
                                {tab.label}
                                {activeTab === tab.id && (
                                    <div className="absolute bottom-0 left-0 w-full h-[2px] bg-[#1D2025] dark:bg-white"></div>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Title Input (Square) */}
                    <div className="relative">
                        <input 
                            type="text"
                            value={title}
                            onChange={handleTitleChange}
                            placeholder={t.title_required_placeholder}
                            maxLength={MAX_TITLE_LENGTH}
                            className="w-full bg-transparent border border-[#1D2025]/20 dark:border-white/20 p-4 text-sm font-bold text-black dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#1D2025] dark:focus:border-white transition-colors"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400 font-mono">
                            {title.length}/{MAX_TITLE_LENGTH}
                        </div>
                    </div>

                    {/* Tags Toggle (Square) */}
                    {!showTagInput && (
                        <button 
                            onClick={() => setShowTagInput(true)}
                            className="self-start text-xs font-bold uppercase tracking-widest bg-[#1D2025]/5 dark:bg-white/10 px-3 py-1 text-black dark:text-white hover:bg-[#1D2025]/10 dark:hover:bg-white/20"
                        >
                            + {t.add_tag_btn}
                        </button>
                    )}
                    
                    {showTagInput && (
                        <div className="relative">
                            <input 
                                ref={tagInputRef}
                                type="text"
                                value={tagInputText}
                                onChange={(e) => setTagInputText(e.target.value)}
                                placeholder={t.tags_placeholder}
                                className="w-full bg-transparent border border-[#1D2025]/20 dark:border-white/20 p-2 text-sm font-mono text-black dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#1D2025] dark:focus:border-white transition-colors"
                            />
                            <button 
                                onClick={() => setShowTagInput(false)}
                                className="absolute right-2 top-1/2 -translate-y-1/2"
                            >
                                <span className="material-symbols-outlined text-[16px] text-gray-400 hover:text-black dark:hover:text-white">close</span>
                            </button>
                        </div>
                    )}
                </div>

                {/* --- CONTENT AREA --- */}
                <div className="flex-1 p-4 sm:p-6 pt-2">
                    {activeTab === 'text' && (
                        <div className="flex flex-col h-[300px] border border-[#1D2025]/20 dark:border-white/20 overflow-hidden focus-within:border-[#1D2025] dark:focus-within:border-white transition-colors">
                            <textarea 
                                ref={textAreaRef}
                                value={text}
                                onChange={handleTextChange}
                                placeholder={t.text_area_optional}
                                className="w-full h-full bg-transparent p-4 text-sm text-black dark:text-white placeholder-gray-400 focus:outline-none resize-none font-mono leading-relaxed"
                            />
                        </div>
                    )}

                    {activeTab === 'media' && (
                        <div className="w-full h-[300px] border border-dashed border-[#1D2025]/20 dark:border-white/20 flex flex-col items-center justify-center gap-6 hover:bg-[#1D2025]/5 dark:hover:bg-white/5 transition-colors cursor-pointer group bg-[#1D2025]/[0.02] dark:bg-white/[0.02]">
                            <div className="w-16 h-16 bg-[#1D2025]/10 dark:bg-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <span className="material-symbols-outlined text-[#1D2025] dark:text-white text-[32px]">cloud_upload</span>
                            </div>
                            <div className="text-center">
                                <span className="text-sm font-bold uppercase tracking-widest text-[#1D2025] dark:text-white block mb-2">
                                    {t.media_drag_drop}
                                </span>
                                <span className="text-xs text-gray-500 font-mono">JPG, PNG, GIF, MP4 (MAX 10MB)</span>
                            </div>
                        </div>
                    )}

                    {activeTab === 'link' && (
                        <div className="flex flex-col gap-6 h-[300px]">
                            <div className="relative">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 block">
                                    TARGET URL *
                                </label>
                                <input 
                                    type="url"
                                    value={linkUrl}
                                    onChange={(e) => setLinkUrl(e.target.value)}
                                    placeholder="https://example.com/cool-stuff"
                                    className="w-full bg-transparent border border-[#1D2025]/20 dark:border-white/20 p-4 text-sm font-mono text-black dark:text-white placeholder-gray-400 focus:outline-none focus:border-[#1D2025] dark:focus:border-white transition-colors"
                                />
                            </div>
                            <div className="p-4 bg-[#1D2025]/5 dark:bg-white/5 border-l-2 border-[#1D2025] dark:border-white">
                                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed">
                                    Link posts will display the URL as the main content. You can still add a title and tags.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Buttons (Square) */}
                <div className="flex items-center justify-end gap-3 p-4 sm:p-6 pt-0 shrink-0 bg-r-light dark:bg-r-dark z-10">
                     <button 
                        className="px-6 py-3 border border-[#1D2025]/20 dark:border-white/20 text-xs font-bold uppercase tracking-widest text-[#1D2025] dark:text-white hover:bg-[#1D2025]/5 dark:hover:bg-white/10 transition-colors"
                     >
                         {t.save_draft_btn}
                     </button>
                     <button 
                        onClick={handleSubmit}
                        disabled={isSubmitDisabled}
                        className="px-6 py-3 bg-[#1D2025] dark:bg-white text-white dark:text-black text-xs font-bold uppercase tracking-widest hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
                     >
                         {isSending ? 'SENDING...' : t.publish_post_btn}
                     </button>
                </div>
            </div>
        </div>
    </div>
  );
};
