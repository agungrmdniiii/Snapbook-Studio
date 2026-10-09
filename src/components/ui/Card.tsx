import React from 'react';
import { cn } from '@/lib/utils';

export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  className,
  children,
  ...props
}) => {
  return (
    <div
      className={cn(
        'bg-zinc-900/80 border border-zinc-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-sm transition-all',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
