import React, { useMemo, useState } from 'react';
import { Translations } from '../types';

interface IdentityWidgetProps {
  userId: string;
  t: Translations;
  compact?: boolean;
  size?: 'default' | 'small';
}

// Helper to generate consistent color from UUID
const generateColorFromId = (id: string): string => {
  if (!id) return '#000000';
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Generate pleasant pastel/neon colors (HSL)
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 60%)`;
};

export const IdentityWidget: React.FC<IdentityWidgetProps> = ({ userId, t, compact = false, size = 'default' }) => {
  const [isTooltipOpen, setIsTooltipOpen] = useState(false);

  // Format ID like a crypto wallet: A1B2...99X0
  const formattedId = useMemo(() => {
    if (!userId) return 'LOADING...';
    const start = userId.substring(0, 4);
    const end = userId.substring(userId.length - 4);
    return `${start}•••${end}`.toUpperCase();
  }, [userId]);

  const uniqueColor = useMemo(() => generateColorFromId(userId), [userId]);

  if (!userId) return null;

  const isSmall = size === 'small';

  return (
    <div className={`flex items-center gap-3 animate-fade-in relative z-30 ${isSmall ? 'inline-flex' : ''}`}>
      {/* Label on the left - Hidden if compact or small size */}
      {!compact && !isSmall && (
        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            {t.session_key_label}
        </span>
      )}
      
      <div 
        className={`flex items-center transition-shadow ${
            isSmall 
                ? 'gap-2 border-none bg-transparent p-0' // Minimalist style for messages
                : 'gap-3 px-3 py-1 border border-black dark:border-white bg-white dark:bg-[#0a0a0a]' // Boxed style for header
        }`}
      >
        {/* Visual "Chip" - Unique Color */}
        <div 
            className="relative"
            style={{ 
                width: isSmall ? '6px' : '8px', 
                height: isSmall ? '6px' : '8px', 
                backgroundColor: uniqueColor 
            }}
        >
            {/* Blinking Status Light - Only for default size */}
            {!isSmall && (
                 <div className="absolute -top-1 -right-1 w-1 h-1 bg-green-500 rounded-full animate-pulse"></div>
            )}
        </div>

        {/* Separator - Only for boxed version */}
        {!isSmall && (
            <div className="bg-black/20 dark:bg-white/20 w-[1px] h-3"></div>
        )}

        {/* Key Text */}
        <span className={`font-mono font-bold tracking-wider text-black dark:text-white ${isSmall ? 'text-[10px]' : 'text-xs'}`}>
            {formattedId}
        </span>
      </div>

      {/* Info Icon with Tooltip - Hidden for small size to keep it clean inside messages */}
      {!isSmall && (
        <div className="relative">
            <button
            onClick={() => setIsTooltipOpen(!isTooltipOpen)}
            onMouseEnter={() => setIsTooltipOpen(true)}
            onMouseLeave={() => setIsTooltipOpen(false)}
            className="w-5 h-5 flex items-center justify-center rounded-full border border-gray-400 text-gray-400 hover:border-black hover:text-black dark:hover:border-white dark:hover:text-white transition-colors"
            aria-label="Session Info"
            >
            <span className="text-[10px] font-bold leading-none">?</span>
            </button>

            {/* Tooltip */}
            {isTooltipOpen && (
                <div className="absolute right-0 top-full mt-4 w-72 p-6 bg-white dark:bg-[#1a1a1a] border border-black dark:border-white shadow-[0_10px_40px_rgba(0,0,0,0.2)] clip-corner z-50">
                <div className="flex flex-col gap-4">
                    <div className="flex flex-col gap-1">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">FULL HASH ID</span>
                        <span className="font-mono text-xl font-bold break-all leading-tight text-black dark:text-white">
                            {userId}
                        </span>
                    </div>
                    <div className="w-full h-[1px] bg-black/10 dark:bg-white/10"></div>
                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                        {t.session_expl_text}
                    </p>
                </div>
                {/* Decorative corner line */}
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-black dark:border-white"></div>
                </div>
            )}
        </div>
      )}
    </div>
  );
};