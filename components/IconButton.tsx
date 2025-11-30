
import React from 'react';

type IconButtonVariant = 'standard' | 'filled' | 'tonal' | 'outlined';

interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: React.ReactNode;
  variant?: IconButtonVariant;
  badge?: boolean | number; // True for dot, number for count
  className?: string;
}

export const IconButton: React.FC<IconButtonProps> = ({ 
  icon, 
  variant = 'standard', 
  badge, 
  className = '', 
  ...props 
}) => {
  
  const baseStyles = "relative flex items-center justify-center transition-all duration-200 shrink-0 font-mono disabled:opacity-50 disabled:cursor-not-allowed";
  
  // Size defaults to roughly 34px-40px depending on padding, usually handled by parent layout or explicitly sized classes.
  // We'll set a default dimension but allow override via className.
  const defaultSize = "w-[34px] h-[34px] sm:w-[40px] sm:h-[40px]";

  const variants: Record<IconButtonVariant, string> = {
    standard: "bg-transparent text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10",
    filled: "bg-[#1D2025] dark:bg-white text-white dark:text-black hover:opacity-90 shadow-sm",
    tonal: "bg-[#1D2025]/10 dark:bg-white/10 text-black dark:text-white hover:bg-[#1D2025]/20 dark:hover:bg-white/20",
    outlined: "border border-[#1D2025] dark:border-white text-black dark:text-white hover:bg-[#1D2025] hover:text-white dark:hover:bg-white dark:hover:text-black bg-transparent"
  };

  return (
    <button 
      className={`${baseStyles} ${defaultSize} ${variants[variant]} ${className}`}
      {...props}
    >
      {icon}
      
      {/* Badge Logic */}
      {badge && (
        <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
           <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
           <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
      )}
    </button>
  );
};
