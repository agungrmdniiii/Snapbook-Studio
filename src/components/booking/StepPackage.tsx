import React from 'react';
import { Clock, Check, Sparkles } from 'lucide-react';
import { PackageItem } from '@/types';
import { formatIDR } from '@/lib/utils';

interface StepPackageProps {
  packages: PackageItem[];
  selectedPackage: PackageItem | null;
  onSelect: (pkg: PackageItem) => void;
}

export const StepPackage: React.FC<StepPackageProps> = ({
  packages,
  selectedPackage,
  onSelect,
}) => {
  return (
    <div className="space-y-6">
      <div className="text-center space-y-1.5 mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-white">1. Pilih Paket Foto</h2>
        <p className="text-xs sm:text-sm text-zinc-400">
          Tentukan paket sesi foto yang paling sesuai dengan kebutuhan Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {packages.map((pkg) => {
          const isSelected = selectedPackage?.id === pkg.id;
          let features: string[] = [];
          try {
            features = JSON.parse(pkg.features);
          } catch {
            features = [];
          }

          return (
            <div
              key={pkg.id}
              onClick={() => onSelect(pkg)}
              className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-amber-500/10 border-amber-500 shadow-xl shadow-amber-500/10'
                  : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 px-2 py-0.5 rounded-md bg-amber-500/15">
                    {pkg.category}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-zinc-400">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{pkg.duration} Mnt</span>
                  </span>
                </div>

                <h3 className="text-lg font-bold text-white mb-1">{pkg.name}</h3>
                <p className="text-xs text-zinc-400 mb-4 line-clamp-2">{pkg.description}</p>

                <p className="text-2xl font-extrabold text-white mb-4">
                  {formatIDR(pkg.price)}
                </p>

                <div className="space-y-2 border-t border-zinc-800/80 pt-4">
                  {features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2 text-xs text-zinc-300">
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5 stroke-[3]" />
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-3 border-t border-zinc-800/60">
                <button
                  type="button"
                  className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-500 text-zinc-950 shadow-md'
                      : 'bg-zinc-800 text-zinc-300 hover:bg-zinc-700'
                  }`}
                >
                  {isSelected ? '✓ Paket Terpilih' : 'Pilih Paket Ini'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
