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
        'bg-[#141211]/90 border border-stone-800/80 rounded-2xl p-6 sm:p-8 shadow-xl backdrop-blur-sm transition-all',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
