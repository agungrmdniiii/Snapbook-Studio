import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'info' | 'danger' | 'gold';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-stone-900 text-stone-300 border-stone-800',
    gold: 'bg-[#d4af37]/10 text-[#d4af37] border-[#d4af37]/30',
    success: 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40',
    warning: 'bg-amber-950/40 text-amber-300 border-amber-800/40',
    info: 'bg-sky-950/40 text-sky-300 border-sky-800/40',
    danger: 'bg-rose-950/40 text-rose-300 border-rose-800/40',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-medium tracking-wider uppercase border transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
