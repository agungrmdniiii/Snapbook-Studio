import React from 'react';
import { Check } from 'lucide-react';
import { AddOnItem } from '@/types';
import { formatIDR } from '@/lib/utils';

interface StepAddOnsProps {
  addOns: AddOnItem[];
  selectedAddOnIds: string[];
  onToggleAddOn: (id: string) => void;
  basePrice: number;
}

export const StepAddOns: React.FC<StepAddOnsProps> = ({
  addOns,
  selectedAddOnIds,
  onToggleAddOn,
  basePrice,
}) => {
  const selectedAddOns = addOns.filter((ad) => selectedAddOnIds.includes(ad.id));
  const addOnsTotal = selectedAddOns.reduce((sum, ad) => sum + ad.price, 0);
  const total = basePrice + addOnsTotal;

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="font-serif text-2xl sm:text-3xl font-normal text-white">
          Layanan Tambahan (Add-ons)
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400 font-light">
          Opsional: Personalisasikan sesi Anda dengan cetak foto tambahan atau layanan ekstra lainnya.
        </p>
      </div>

      <div className="space-y-3.5">
        {addOns.map((addon) => {
          const isSelected = selectedAddOnIds.includes(addon.id);
          return (
            <div
              key={addon.id}
              role="checkbox"
              aria-checked={isSelected}
              tabIndex={0}
              onClick={() => onToggleAddOn(addon.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onToggleAddOn(addon.id);
                }
              }}
              className={`p-5 rounded-2xl border transition-all duration-150 cursor-pointer flex items-center justify-between gap-4 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-300 active:scale-[0.99] motion-reduce:active:scale-100 ${
                isSelected
                  ? 'bg-[#15151a] border-white'
                  : 'bg-[#101013] border-neutral-800 hover:border-neutral-700'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 border transition-colors ${
                    isSelected
                      ? 'bg-white border-white text-black'
                      : 'border-neutral-700 bg-neutral-900 text-transparent'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div>
                  <h4 className="font-serif text-base font-normal text-white">{addon.name}</h4>
                  {addon.description && (
                    <p className="text-xs text-neutral-400 mt-0.5 font-light">{addon.description}</p>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-serif text-base text-neutral-200">
                  +{formatIDR(addon.price)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Total Calculation Bar */}
      <div className="bg-[#101013] border border-neutral-800 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-neutral-400">
            Estimasi Total Sementara
          </p>
          <p className="text-xs text-neutral-400 font-light mt-0.5">
            Paket ({formatIDR(basePrice)}) + Add-ons ({formatIDR(addOnsTotal)})
          </p>
        </div>
        <p className="font-serif text-2xl sm:text-3xl text-white">{formatIDR(total)}</p>
      </div>
    </div>
  );
};
