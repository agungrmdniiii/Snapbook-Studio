import React from 'react';
import Link from 'next/link';
import { Check, Clock, Sparkles, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatIDR } from '@/lib/utils';

interface PackageItem {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  imageUrl?: string | null;
  features: string; // JSON string
}

interface PackagesSectionProps {
  packages: PackageItem[];
}

export const PackagesSection: React.FC<PackagesSectionProps> = ({ packages }) => {
  return (
    <section id="paket" className="py-24 border-b border-stone-850 relative bg-[#0c0a09]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-900 border border-stone-800 text-[11px] font-semibold text-amber-300 uppercase tracking-[0.2em]">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Rate Card & Editions • Edisi 2026</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-normal text-stone-100 tracking-tight">
            Pilihan Paket & <span className="italic text-amber-300">Edisi Sesi</span>
          </h2>
          <p className="text-stone-400 text-sm sm:text-base font-light max-w-xl mx-auto">
            Tarif transparan tanpa biaya tersembunyi. Dapatkan seluruh softcopy original resolusi tinggi serta cetakan fine-art langsung dari studio.
          </p>
        </div>

        {/* Packages Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {packages.map((pkg, idx) => {
            let featuresList: string[] = [];
            try {
              featuresList = JSON.parse(pkg.features);
            } catch {
              featuresList = [];
            }

            const isSignature = idx === 1; // Middle package highlight

            return (
              <div
                key={pkg.id}
                className={`relative rounded-2xl p-8 flex flex-col justify-between transition-all duration-300 ${
                  isSignature
                    ? 'bg-[#141210] border-2 border-amber-400/80 shadow-2xl shadow-amber-500/10 lg:-translate-y-2'
                    : 'bg-[#12100f] border border-stone-800/90 hover:border-stone-700 shadow-xl'
                }`}
              >
                {/* Signature Tag */}
                {isSignature && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-400 to-amber-300 text-stone-950 text-[10px] font-bold uppercase tracking-[0.2em] shadow-lg">
                    Signature Edition • Favorit
                  </div>
                )}

                <div>
                  {/* Top Index & Meta */}
                  <div className="flex items-center justify-between gap-2 mb-5">
                    <span className="font-mono text-2xl font-light text-stone-500">
                      {String(idx + 1).padStart(2, '0')}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-stone-400 font-mono tracking-wide">
                      <Clock className="w-3.5 h-3.5 text-amber-400" />
                      <span>{pkg.duration} MENIT SESI</span>
                    </span>
                  </div>

                  <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-amber-400 block mb-1">
                    {pkg.category}
                  </span>
                  
                  <h3 className="font-serif text-2xl sm:text-3xl font-normal text-stone-100 mb-2">
                    {pkg.name}
                  </h3>
                  
                  <p className="text-xs sm:text-sm text-stone-400 min-h-[40px] leading-relaxed mb-6 font-light">
                    {pkg.description}
                  </p>

                  {/* Price Block */}
                  <div className="flex items-baseline gap-1.5 mb-6 pb-6 border-b border-stone-800">
                    <span className="font-serif text-3xl sm:text-4xl font-normal text-stone-100 tracking-tight">
                      {formatIDR(pkg.price)}
                    </span>
                    <span className="text-xs text-stone-400 font-mono uppercase tracking-wider">/ sesi</span>
                  </div>

                  {/* Features List */}
                  <div className="space-y-3 mb-8">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-stone-400">
                      Inklusi Fasilitas:
                    </p>
                    {featuresList.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-3 text-xs sm:text-sm text-stone-300">
                        <div className="w-4 h-4 rounded-full bg-amber-400/15 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </div>
                        <span className="font-light leading-snug">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card Action */}
                <div className="pt-4 border-t border-stone-850">
                  <Link href={`/book?packageId=${pkg.id}`} className="block w-full">
                    <Button
                      variant={isSignature ? 'gold' : 'outline'}
                      size="md"
                      className="w-full"
                    >
                      <span>Reserve Edisi Ini</span>
                      <ArrowRight className="w-4 h-4 ml-1.5" />
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
