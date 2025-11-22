
import React, { useMemo } from 'react';

export const IllustrationSender: React.FC = () => {
  const columns = useMemo(() => {
    // Authentic Matrix code rain often uses half-width katakana
    // Removed numbers as requested for a cleaner look
    const chars = 'ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ';
    const colCount = 25;
    return Array.from({ length: colCount }).map((_, i) => ({
      id: i,
      left: (i / colCount) * 100, // Position in percentage
      speed: Math.random() * 2 + 2, 
      startDelay: Math.random() * 5, 
      chars: Array.from({ length: 22 }).map(() => chars[Math.floor(Math.random() * chars.length)])
    }));
  }, []);

  return (
    <div 
        className="w-full h-full relative opacity-30 hover:opacity-100 transition-opacity duration-1000 overflow-hidden cursor-default select-none"
        style={{
            // CSS Mask for fading out the bottom
            maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)'
        }}
    >
      {columns.map((col) => (
        <div
            key={col.id}
            className="absolute top-0 flex flex-col items-center text-black dark:text-white font-mono font-light text-sm leading-none"
            style={{ left: `${col.left}%`, width: `${100 / 25}%` }}
        >
            {col.chars.map((char, rowIdx) => {
                const charDelay = -col.startDelay + (rowIdx * (col.speed / 16));
                return (
                    <span 
                        key={rowIdx} 
                        className="block py-[2px]" // Add slight vertical spacing
                        style={{
                            opacity: 0.05,
                            animation: `matrix-wave ${col.speed}s linear infinite`,
                            animationDelay: `${charDelay}s`
                        }}
                    >
                        {char}
                    </span>
                );
            })}
        </div>
      ))}
    </div>
  );
};
