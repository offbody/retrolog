
import React, { useMemo, useState } from 'react';

const RECEIVER_WORDS = [
  'ТИШИНА', 'СУДЬБА', 'СМЫСЛ', 'ЭХО', 'ТЕПЛО', 
  'ПРИНЯТИЕ', 'ОТВЕТ', 'ПОКОЙ', 'РАВНОВЕСИЕ', 'СВЕТ',
  'ПУСТОТА', 'ВРЕМЯ', 'ВЕЧНОСТЬ', 'ПАМЯТЬ', 'ПУТЬ'
];

export const IllustrationReceiver: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);

  const columns = useMemo(() => {
    const chars = 'ｦｧｨｩｪｫｬｭｮｯｰｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ';
    const colCount = 25;
    return Array.from({ length: colCount }).map((_, i) => ({
      id: i,
      left: (i / colCount) * 100,
      speed: Math.random() * 1.5 + 1.5,
      startDelay: Math.random() * 5,
      chars: Array.from({ length: 22 }).map(() => chars[Math.floor(Math.random() * chars.length)]),
      // Append '#' separator to the word
      word: RECEIVER_WORDS[Math.floor(Math.random() * RECEIVER_WORDS.length)] + '#'
    }));
  }, []);

  return (
    <div 
        className="w-full h-full relative opacity-30 hover:opacity-100 transition-opacity duration-1000 overflow-hidden cursor-default select-none"
        style={{
            maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
            transform: 'scaleX(-1)' // Mirror effect for the container
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
    >
      {columns.map((col) => (
        <div
            key={col.id}
            className="absolute top-0 flex flex-col items-center text-black dark:text-white font-mono font-light text-sm leading-none"
            style={{ left: `${col.left}%`, width: `${100 / 25}%` }}
        >
            {col.chars.map((char, rowIdx) => {
                const charDelay = -col.startDelay + (rowIdx * (col.speed / 16));
                const wordChar = col.word[rowIdx % col.word.length];

                return (
                    <span 
                        key={rowIdx} 
                        className="relative block w-full h-[1.1em] text-center"
                        style={{
                            opacity: 0.05,
                            animation: `matrix-wave-rx ${col.speed}s linear infinite`,
                            animationDelay: `${charDelay}s`
                        }}
                    >
                        {/* Layer 1: Matrix Char (Fades Out) */}
                        <span className={`absolute inset-0 transition-opacity duration-500 ${isHovered ? 'opacity-0' : 'opacity-100'}`}>
                            {char}
                        </span>
                        
                        {/* Layer 2: Word Char (Fades In) - Always un-mirrored to stay readable */}
                        <span 
                            className={`absolute inset-0 transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-0'}`}
                            style={{ transform: 'scaleX(-1)' }}
                        >
                            {wordChar}
                        </span>
                    </span>
                );
            })}
        </div>
      ))}
    </div>
  );
};
