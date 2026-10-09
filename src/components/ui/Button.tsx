import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gold';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const variants = {
      primary: 'bg-stone-100 hover:bg-white text-stone-950 font-medium tracking-wider uppercase shadow-md active:scale-[0.98]',
      gold: 'bg-gradient-to-r from-[#d4af37] to-[#e6ca65] hover:brightness-110 text-stone-950 font-semibold tracking-wider uppercase shadow-lg shadow-[#d4af37]/15 active:scale-[0.98]',
      secondary: 'bg-stone-900 hover:bg-stone-800 text-stone-200 border border-stone-800 active:scale-[0.98]',
      outline: 'border border-stone-700 hover:border-stone-400 text-stone-200 hover:bg-stone-900/60 tracking-wider uppercase active:scale-[0.98]',
      ghost: 'text-stone-400 hover:text-stone-100 hover:bg-stone-900/50',
      danger: 'bg-rose-700 hover:bg-rose-600 text-white font-medium active:scale-[0.98]',
    };

    const sizes = {
      sm: 'px-3.5 py-1.5 text-[11px] rounded-full gap-1.5',
      md: 'px-5 py-2.5 text-xs rounded-full gap-2',
      lg: 'px-7 py-3.5 text-xs rounded-full gap-2.5 font-semibold tracking-widest',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed select-none',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
