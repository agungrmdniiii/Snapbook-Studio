import React from 'react';
import { Clock, Check } from 'lucide-react';
import { PackageItem } from '@/types';
import { formatIDR } from '@/lib/utils';

interface StepPackageProps {
  packages: PackageItem[];
  selectedPackage: PackageItem | null;
  onSelect: (pkg: PackageItem) => void;
  onSelectAndNext?: (pkg: PackageItem) => void;
}

export const StepPackage: React.FC<StepPackageProps> = ({
  packages,
  selectedPackage,
  onSelect,
  onSelectAndNext,
}) => {
  return (
    <div className="space-y-8">
      <div className="text-center space-y-2 mb-8">
        <h2 className="font-serif text-2xl sm:text-3xl font-normal text-white">
          Pilih Paket Foto
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400 font-light">
          Pilih berdasarkan jumlah orang, durasi, dan fasilitas.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
              className={`p-6 sm:p-7 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                isSelected
                  ? 'bg-[#15151a] border-white shadow-xl'
                  : 'bg-[#101013] border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div>
                {/* Meta */}
                <div className="flex items-center justify-between gap-2 mb-4">
                  <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-400">
                    {pkg.category}
                  </span>
                  <span className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{pkg.duration} Menit</span>
                  </span>
                </div>

                <h3 className="font-serif text-2xl font-normal text-white mb-2">
                  {pkg.name}
                </h3>

                <p className="text-xs text-neutral-400 mb-6 line-clamp-2 font-light leading-relaxed">
                  {pkg.description}
                </p>

                <p className="font-serif text-2xl sm:text-3xl text-white mb-6 pb-4 border-b border-neutral-800">
                  {formatIDR(pkg.price)}
                </p>

                {/* Features */}
                <div className="space-y-2.5">
                  {features.map((feat, fIdx) => (
                    <div key={fIdx} className="flex items-start gap-2.5 text-xs text-neutral-300">
                      <Check className="w-3.5 h-3.5 text-neutral-400 shrink-0 mt-0.5" />
                      <span className="font-light leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-4 border-t border-neutral-800">
                <button
                  type="button"
                  aria-label={`Pilih ${pkg.name} dan lanjut ke jadwal`}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (onSelectAndNext) {
                      onSelectAndNext(pkg);
                    } else {
                      onSelect(pkg);
                    }
                  }}
                  className={`w-full py-2.5 rounded-full text-xs font-medium tracking-[0.16em] uppercase transition-all text-center select-none cursor-pointer ${
                    isSelected
                      ? 'bg-white text-black font-semibold'
                      : 'bg-neutral-900 text-neutral-300 hover:bg-neutral-800 hover:text-white border border-neutral-800'
                  }`}
                >
                  {isSelected ? 'Lanjut Pilih Jam' : 'Pilih Paket Ini'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
