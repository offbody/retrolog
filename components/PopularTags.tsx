
import React from 'react';
import { Translations } from '../types';

interface PopularTagsProps {
  tags: { tag: string; count: number }[];
  onTagClick: (tag: string) => void;
  activeTag: string;
  t: Translations;
}

export const PopularTags: React.FC<PopularTagsProps> = ({ tags, onTagClick, activeTag, t }) => {
  if (tags.length === 0) return null;

  // Limit to 30 tags to prevent layout overflow and keep it clean (~3 rows on desktop)
  const visibleTags = tags.slice(0, 30);

  return (
    <div className="w-full mb-8">
      <div className="flex items-center gap-4 mb-4">
         <span className="text-xs font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500 whitespace-nowrap">
             {t.popular_tags_label} //
         </span>
         <div className="h-[1px] w-full bg-black/10 dark:bg-white/10"></div>
      </div>
      
      {/* Layout change: nowrap + scroll for mobile. Wrap + height limit for desktop (3 rows approx) */}
      {/* md:max-h-[120px] fits approx 3 rows strictly */}
      <div className="flex flex-nowrap overflow-x-auto md:flex-wrap gap-2 pb-2 md:pb-0 no-scrollbar -mx-6 px-6 md:mx-0 md:px-0 md:max-h-[120px] md:overflow-hidden">
         {visibleTags.map((item, idx) => {
             const isActive = activeTag.toLowerCase() === item.tag.toLowerCase() || activeTag.toLowerCase().includes(item.tag.toLowerCase());
             return (
                 <button
                    key={idx}
                    onClick={() => onTagClick(item.tag)}
                    className={`group flex items-center border transition-colors shrink-0 ${
                        isActive 
                        ? 'bg-black dark:bg-white border-black dark:border-white' 
                        : 'bg-transparent border-black/10 dark:border-white/10 hover:border-black dark:hover:border-white'
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
