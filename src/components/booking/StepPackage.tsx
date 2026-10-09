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
    <div className="space-y-8">
      <div className="text-center space-y-2 mb-8">
        <h2 className="font-serif text-2xl sm:text-3xl font-normal text-stone-100">
          01. Pilih Koleksi Edisi Foto
        </h2>
        <p className="text-xs sm:text-sm text-stone-400 font-light">
          Tentukan edisi pemotretan yang paling mencerminkan kebutuhan momen Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {packages.map((pkg, idx) => {
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
              className={`p-6 sm:p-7 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#151311] border-amber-400 shadow-xl shadow-amber-500/10'
                  : 'bg-[#12100f] border-stone-800 hover:border-stone-700'
              }`}
            >
              <div>
                {/* Meta Bar */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="font-mono text-sm text-stone-400">
                    EDITION {String(idx + 1).padStart(2, '0')}
                  </span>
                  <span className="flex items-center gap-1 text-xs text-stone-400 font-mono">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>{pkg.duration} MENIT</span>
                  </span>
                </div>

                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400 block mb-1">
                  {pkg.category}
                </span>

                <h3 className="font-serif text-2xl font-normal text-stone-100 mb-1">
                  {pkg.name}
                </h3>
                
                <p className="text-xs text-stone-400 mb-5 line-clamp-2 font-light">
                  {pkg.description}
                </p>

                <p className="font-serif text-2xl sm:text-3xl font-normal text-stone-100 mb-5 pb-4 border-b border-stone-850">
                  {formatIDR(pkg.price)}
                </p>

                {/* Features Checklist */}
                <div className="space-y-2.5">
                  {features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2.5 text-xs text-stone-300">
                      <Check className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5 stroke-[2.5]" />
                      <span className="font-light leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-stone-850">
                <button
                  type="button"
                  className={`w-full py-2.5 rounded-full text-xs font-semibold tracking-wider uppercase transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-amber-400 text-stone-950 shadow-md font-bold'
                      : 'bg-stone-900 text-stone-300 hover:bg-stone-800 border border-stone-800'
                  }`}
                >
                  {isSelected ? '✓ Edisi Terpilih' : 'Pilih Edisi Ini'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
