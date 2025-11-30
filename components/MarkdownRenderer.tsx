
import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Split by newlines to handle block level elements first
  const lines = content.split('\n');
  const renderedLines: React.ReactNode[] = [];

  let inCodeBlock = false;
  let codeBlockContent: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Code Block Handling
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // End of code block
        renderedLines.push(
          <pre key={`code-${i}`} className="bg-black/10 dark:bg-white/10 p-3 my-2 font-mono text-xs overflow-x-auto whitespace-pre-wrap border border-[#1D2025]/10 dark:border-white/10">
            <code>{codeBlockContent.join('\n')}</code>
          </pre>
        );
        codeBlockContent = [];
        inCodeBlock = false;
      } else {
        // Start of code block
        inCodeBlock = true;
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockContent.push(line);
      continue;
    }

    // Block Quote
    if (line.trim().startsWith('>') && !line.trim().startsWith('>!')) {
       renderedLines.push(
         <blockquote key={`quote-${i}`} className="border-l-4 border-[#1D2025] dark:border-white pl-4 my-2 italic opacity-80">
           {parseInline(line.replace(/^>\s?/, ''))}
         </blockquote>
       );
       continue;
    }

    // List Items (Bullet)
    if (line.trim().match(/^-\s/)) {
        renderedLines.push(
            <li key={`li-${i}`} className="ml-4 list-disc">
                {parseInline(line.replace(/^-\s/, ''))}
            </li>
        );
        continue;
    }

    // List Items (Numbered)
    if (line.trim().match(/^\d+\.\s/)) {
        renderedLines.push(
            <li key={`oli-${i}`} className="ml-4 list-decimal">
                {parseInline(line.replace(/^\d+\.\s/, ''))}
            </li>
        );
        continue;
    }

    // Empty line (Line Break)
    if (line.trim() === '') {
        renderedLines.push(<div key={`br-${i}`} className="h-4"></div>);
    } else {
        // Normal paragraph
        renderedLines.push(
            <div key={`p-${i}`} className="min-h-[1.5em] my-1">
                {parseInline(line)}
            </div>
        );
    }
  }

  // Close open code block if any
  if (inCodeBlock && codeBlockContent.length > 0) {
      renderedLines.push(
          <pre key={`code-end`} className="bg-black/10 dark:bg-white/10 p-3 my-2 font-mono text-xs overflow-x-auto whitespace-pre-wrap border border-[#1D2025]/10 dark:border-white/10">
            <code>{codeBlockContent.join('\n')}</code>
          </pre>
      );
  }

  return <div className={`markdown-preview text-sm leading-relaxed ${className}`}>{renderedLines}</div>;
};

// Helper for inline styles
const parseInline = (text: string): React.ReactNode[] => {
    let parts: React.ReactNode[] = [text];
    
    // Helper to apply regex replacement to string parts in the array
    const apply = (regex: RegExp, render: (m: string, ...args: any[]) => React.ReactNode) => {
        const newParts: React.ReactNode[] = [];
        parts.forEach(part => {
            if (typeof part !== 'string') {
                newParts.push(part);
                return;
            }
            let lastIndex = 0;
            // Using replace as an iterator
            part.replace(regex, (match, ...args) => {
                 // args contains [captures..., offset, string]
                 const offset = args[args.length - 2];
                 
                 // Push text before match
                 if (offset > lastIndex) {
                     newParts.push(part.substring(lastIndex, offset));
                 }
                 // Push rendered match
                 newParts.push(render(match, ...args));
                 lastIndex = offset + match.length;
                 return match;
            });
            // Push remaining text
            if (lastIndex < part.length) {
                newParts.push(part.substring(lastIndex));
            }
        });
        parts = newParts;
    };

    // Apply rules in specific order
    // 1. Images ![alt](url)
    apply(/!\[(.*?)\]\((.*?)\)/g, (m, alt, url) => (
        <img key={Math.random()} src={url} alt={alt} className="max-w-full h-auto max-h-[300px] border border-[#1D2025]/20 dark:border-white/20 my-2 block" />
    ));
    // 2. Spoilers >!text!<
    apply(/>!(.*?)!</g, (m, c) => (
        <span key={Math.random()} className="bg-black dark:bg-white text-transparent hover:text-white dark:hover:text-black hover:bg-black/80 dark:hover:bg-white/80 transition-colors cursor-pointer px-1 rounded-sm select-none" title="Spoiler">
            {c}
        </span>
    ));
    // 3. Links [text](url)
    apply(/\[(.*?)\]\((.*?)\)/g, (m, t, u) => (
        <a key={Math.random()} href={u} target="_blank" rel="noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">
            {t}
        </a>
    ));
    // 4. Bold **text**
    apply(/\*\*(.*?)\*\*/g, (m, c) => <strong key={Math.random()} className="font-bold">{c}</strong>);
    // 5. Italic *text*
    apply(/\*(.*?)\*/g, (m, c) => <em key={Math.random()} className="italic">{c}</em>);
    // 6. Strike ~~text~~
    apply(/~~(.*?)~~/g, (m, c) => <span key={Math.random()} className="line-through opacity-70">{c}</span>);
    // 7. Inline Code `text`
    apply(/`(.*?)`/g, (m, c) => <code key={Math.random()} className="bg-black/10 dark:bg-white/10 px-1 font-mono text-xs border border-black/10 dark:border-white/10">{c}</code>);

    return parts;
};
