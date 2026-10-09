import React from 'react';

export const MarqueeBanner: React.FC = () => {
  const items = [
    'EDITORIAL PORTRAIT',
    'ATELIER PRIVÉ',
    'CINEMATIC LIGHTING',
    'SAME-DAY DRIVE ACCESS',
    'RETUSIR RESOLUSI PENUH',
    'WISUDA & KELUARGA',
    'PRIVATE SUITE BEBAS BENTROK',
    'CETAK FOTO ARCHIVAL',
  ];

  return (
    <div className="w-full overflow-hidden border-y border-neutral-850 bg-[#070709] py-3.5 select-none relative">
      <div className="animate-marquee flex items-center gap-8">
        {[...items, ...items, ...items, ...items].map((text, idx) => (
          <div key={idx} className="flex items-center gap-8 shrink-0">
            <span className="text-[11px] font-medium tracking-[0.28em] uppercase text-neutral-400 hover:text-white transition-colors">
              {text}
            </span>
            <span className="w-1.5 h-1.5 rounded-full bg-neutral-600 shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
};
