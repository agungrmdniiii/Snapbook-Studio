import React from 'react';
import { Check, Sparkles } from 'lucide-react';
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
        <h2 className="font-serif text-2xl sm:text-3xl font-normal text-stone-100">
          03. Layanan Tambahan (Add-ons)
        </h2>
        <p className="text-xs sm:text-sm text-stone-400 font-light">
          Opsional: Personalisasikan sesi Anda dengan cetakan fine-art, background ekstra, atau durasi tambahan.
        </p>
      </div>

      <div className="space-y-3.5">
        {addOns.map((addon) => {
          const isSelected = selectedAddOnIds.includes(addon.id);
          return (
            <div
              key={addon.id}
              onClick={() => onToggleAddOn(addon.id)}
              className={`p-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                isSelected
                  ? 'bg-[#151311] border-amber-400 shadow-md shadow-amber-400/10'
                  : 'bg-[#12100f] border-stone-800 hover:border-stone-700'
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 mt-0.5 border transition-colors ${
                    isSelected
                      ? 'bg-amber-400 border-amber-400 text-stone-950'
                      : 'border-stone-700 bg-stone-900 text-transparent'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </div>
                <div>
                  <h4 className="font-serif text-base font-normal text-stone-100">{addon.name}</h4>
                  {addon.description && (
                    <p className="text-xs text-stone-400 mt-0.5 font-light">{addon.description}</p>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="font-serif text-base font-normal text-amber-300">
                  +{formatIDR(addon.price)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Total Calculation Bar */}
      <div className="bg-[#12100f] border border-stone-800 rounded-2xl p-5 flex items-center justify-between">
        <div>
          <p className="text-[11px] uppercase tracking-[0.2em] text-stone-400">
            Estimasi Subtotal Sesi
          </p>
          <p className="text-xs text-stone-400 font-light mt-0.5">
            Paket ({formatIDR(basePrice)}) + Add-ons ({formatIDR(addOnsTotal)})
          </p>
        </div>
        <p className="font-serif text-2xl sm:text-3xl font-normal text-stone-100">{formatIDR(total)}</p>
      </div>
    </div>
  );
};
