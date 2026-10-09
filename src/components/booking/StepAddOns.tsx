import React from 'react';
import { Plus, Check, Sparkles } from 'lucide-react';
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
    <div className="space-y-6 max-w-2xl mx-auto">
      <div className="text-center space-y-1.5">
        <h2 className="text-xl sm:text-2xl font-bold text-white">3. Layanan Tambahan (Add-ons)</h2>
        <p className="text-xs sm:text-sm text-zinc-400">
          Opsional: Tingkatkan pengalaman foto Anda dengan layanan ekstra favorit studio.
        </p>
      </div>

      <div className="space-y-3">
        {addOns.map((addon) => {
          const isSelected = selectedAddOnIds.includes(addon.id);
          return (
            <div
              key={addon.id}
              onClick={() => onToggleAddOn(addon.id)}
              className={`p-4.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 ${
                isSelected
                  ? 'bg-amber-500/10 border-amber-500 shadow-md shadow-amber-500/10'
                  : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-start gap-3.5">
                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 border transition-colors ${
                    isSelected
                      ? 'bg-amber-500 border-amber-500 text-zinc-950'
                      : 'border-zinc-700 bg-zinc-800 text-transparent'
                  }`}
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{addon.name}</h4>
                  {addon.description && (
                    <p className="text-xs text-zinc-400 mt-0.5">{addon.description}</p>
                  )}
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-sm font-bold text-amber-400">
                  +{formatIDR(addon.price)}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Live Total Calculation Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between">
        <div>
          <p className="text-xs text-zinc-400">Estimasi Subtotal Sementara</p>
          <p className="text-xs text-zinc-500">
            Paket ({formatIDR(basePrice)}) + Add-ons ({formatIDR(addOnsTotal)})
          </p>
        </div>
        <p className="text-xl font-extrabold text-white">{formatIDR(total)}</p>
      </div>
    </div>
  );
};
