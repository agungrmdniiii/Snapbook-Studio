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
    default: 'bg-neutral-900 text-neutral-300 border-neutral-800',
    gold: 'bg-[#c5a880]/10 text-[#c5a880] border-[#c5a880]/30',
    success: 'bg-emerald-950/30 text-emerald-300 border-emerald-900/40',
    warning: 'bg-amber-950/30 text-amber-300 border-amber-900/40',
    info: 'bg-sky-950/30 text-sky-300 border-sky-900/40',
    danger: 'bg-rose-950/30 text-rose-300 border-rose-900/40',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-medium tracking-[0.15em] uppercase border transition-colors',
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
};
