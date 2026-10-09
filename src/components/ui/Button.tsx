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
      primary: 'bg-white hover:bg-neutral-200 text-black font-medium tracking-[0.18em] uppercase transition-colors',
      gold: 'bg-[#c5a880] hover:bg-[#d2b893] text-black font-medium tracking-[0.18em] uppercase transition-colors',
      secondary: 'bg-neutral-900 hover:bg-neutral-800 text-neutral-200 border border-neutral-800 tracking-[0.15em] uppercase transition-colors',
      outline: 'border border-neutral-700 hover:border-neutral-300 text-neutral-200 hover:bg-white/5 tracking-[0.18em] uppercase transition-colors',
      ghost: 'text-neutral-400 hover:text-white tracking-[0.15em] uppercase transition-colors',
      danger: 'bg-rose-900/80 hover:bg-rose-800 text-white tracking-[0.15em] uppercase border border-rose-800 transition-colors',
    };

    const sizes = {
      sm: 'px-3.5 py-1.5 text-[10px] rounded-full gap-1.5',
      md: 'px-5 py-2.5 text-[11px] rounded-full gap-2',
      lg: 'px-7 py-3 text-xs rounded-full gap-2.5',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed select-none transition-all duration-150 ease-out active:scale-[0.98] motion-reduce:active:scale-100 motion-reduce:transition-none focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b]',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {isLoading && (
          <svg className="animate-spin -ml-1 mr-2 h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
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
