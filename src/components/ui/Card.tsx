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
        'bg-[#0f0f12] border border-neutral-800/80 rounded-2xl p-6 sm:p-8 transition-all',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
};
