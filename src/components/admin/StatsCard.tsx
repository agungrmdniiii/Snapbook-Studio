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
  const variants = {
    amber: 'bg-amber-400/10 text-amber-300 border-amber-400/30',
    emerald: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    sky: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
    rose: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  };

  return (
    <div className="bg-[#12100f] border border-stone-800 rounded-2xl p-6 shadow-xl flex items-center justify-between">
      <div>
        <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-[0.2em]">{title}</p>
        <p className="font-serif text-3xl font-normal text-stone-100 mt-1">{value}</p>
        {subtitle && <p className="text-xs text-stone-400 font-light mt-1">{subtitle}</p>}
      </div>
      <div
        className={cn(
          'w-11 h-11 rounded-full border flex items-center justify-center shrink-0',
          variants[variant]
        )}
      >
        <Icon className="w-5 h-5 stroke-[1.8]" />
      </div>
    </div>
  );
};
