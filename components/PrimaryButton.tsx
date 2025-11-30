import React from 'react';

type PrimaryButtonVariant = 'text' | 'filled' | 'tonal' | 'outlined';

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: PrimaryButtonVariant;
  icon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

export const PrimaryButton: React.FC<PrimaryButtonProps> = ({ 
  variant = 'filled', 
  icon, 
  children, 
  className = '', 
  ...props 
}) => {
  
  // Updated baseStyles to include fixed height matching IconButton (h-[34px] sm:h-[40px])
  const baseStyles = "flex items-center justify-center gap-2 px-4 h-[34px] sm:h-[40px] text-xs sm:text-sm font-bold uppercase tracking-widest transition-all duration-200 font-mono disabled:opacity-50 disabled:cursor-not-allowed";

  const variants: Record<PrimaryButtonVariant, string> = {
    text: "bg-transparent text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/10",
    filled: "bg-[#1D2025] dark:bg-white text-white dark:text-black hover:opacity-90 shadow-md",
    tonal: "bg-[#1D2025]/10 dark:bg-white/10 text-black dark:text-white hover:bg-[#1D2025]/20 dark:hover:bg-white/20",
    outlined: "border border-[#1D2025] dark:border-white text-black dark:text-white hover:bg-[#1D2025] hover:text-white dark:hover:bg-white dark:hover:text-black bg-transparent"
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      {...props}
    >
      {icon && <span className="shrink-0 flex items-center">{icon}</span>}
      <span className="whitespace-nowrap">{children}</span>
    </button>
  );
};