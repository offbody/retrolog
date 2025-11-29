
import React from 'react';
import { Translations } from '../types';

interface PopularTagsProps {
  tags: { tag: string; count: number }[];
  onTagClick: (tag: string) => void;
  activeTag: string;
  t: Translations;
  className?: string; // Allow passing extra classes for layout
}

export const PopularTags: React.FC<PopularTagsProps> = ({ tags, onTagClick, activeTag, t, className = '' }) => {
  if (tags.length === 0) return null;

  // Limit to 30 tags
  const visibleTags = tags.slice(0, 30);

  return (
    <div className={`w-full ${className}`}>
      {/* Header - Updated to match Sort Labels in MessageList */}
      <div className="mb-4 border-b border-[#1D2025]/10 dark:border-white/10 pb-4">
         <span className="text-sm font-mono font-normal uppercase tracking-widest text-black dark:text-white whitespace-nowrap">
             {t.popular_tags_label}
         </span>
      </div>
      
      {/* 
        Responsive Layout:
        Mobile/Tablet (< lg): Horizontal scroll (flex-row, overflow-x-auto)
        Desktop (>= lg): Vertical list (flex-col) 
      */}
      <div className="flex flex-row overflow-x-auto lg:flex-col lg:overflow-visible gap-2 pb-2 lg:pb-0 no-scrollbar -mx-6 px-6 lg:mx-0 lg:px-0">
         {visibleTags.map((item, idx) => {
             const isActive = activeTag.toLowerCase() === item.tag.toLowerCase() || activeTag.toLowerCase().includes(item.tag.toLowerCase());
             return (
                 <button
                    key={idx}
                    onClick={() => onTagClick(item.tag)}
                    className={`group flex items-center justify-between border transition-colors shrink-0 text-left ${
                        isActive 
                        ? 'bg-[#1D2025] dark:bg-white border-[#1D2025] dark:border-white' 
                        : 'bg-transparent border-[#1D2025]/10 dark:border-white/10 hover:border-[#1D2025] dark:hover:border-white'
                    }`}
                 >
                    <span className={`pl-4 pr-3 py-2 text-sm font-mono uppercase font-normal ${
                        isActive 
                        ? 'text-white dark:text-black' 
                        : 'text-black dark:text-white'
                    }`}>
                        {item.tag}
                    </span>
                    <span className={`pr-4 py-2 text-xs font-mono ${
                        isActive
                        ? 'text-white/60 dark:text-black/60'
                        : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                    }`}>
                        {item.count}
                    </span>
                 </button>
             );
         })}
      </div>
    </div>
  );
};
