import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  variant?: 'amber' | 'emerald' | 'sky' | 'rose';
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  variant = 'amber',
}) => {
  return (
    <div className="bg-[#101013] border border-neutral-800 rounded-2xl p-6 shadow-xl flex items-center justify-between">
      <div>
        <p className="text-[10px] font-medium text-neutral-400 uppercase tracking-[0.18em]">{title}</p>
        <p className="font-serif text-3xl font-normal text-white mt-1.5">{value}</p>
        {subtitle && <p className="text-xs text-neutral-400 font-light mt-1">{subtitle}</p>}
      </div>
      <div className="w-10 h-10 rounded-full border border-neutral-800 bg-neutral-900 flex items-center justify-center shrink-0 text-neutral-300">
        <Icon className="w-4 h-4" />
      </div>
    </div>
  );
};
