import React from 'react';
import Link from 'next/link';
import { Check, Clock, ArrowRight } from 'lucide-react';
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
    <section id="paket" className="py-24 sm:py-32 border-b border-neutral-850 bg-[#0c0c0e]">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="max-w-2xl mb-16 space-y-4">
          <h2 className="font-serif text-3xl sm:text-5xl font-normal text-neutral-100 tracking-tight">
            Paket Foto & Tarif
          </h2>
          <p className="text-neutral-400 text-sm sm:text-base font-light">
            Tarif transparan tanpa biaya tersembunyi. Dapatkan seluruh file softcopy original resolusi penuh serta cetakan foto berkualitas tinggi.
          </p>
        </div>

        {/* Packages Grid - Architectural Collections */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-stretch">
          {packages.map((pkg, idx) => {
            let featuresList: string[] = [];
            try {
              featuresList = JSON.parse(pkg.features);
            } catch {
              featuresList = [];
            }

            const isHighlight = idx === 1;

            return (
              <div
                key={pkg.id}
                className={`relative rounded-2xl p-8 sm:p-9 flex flex-col justify-between transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:border-neutral-600 ${
                  isHighlight
                    ? 'bg-[#141418] border-2 border-neutral-500 shadow-2xl'
                    : 'bg-[#101013] border border-neutral-800/90'
                }`}
              >
                {isHighlight && (
                  <div className="absolute -top-3 left-8 px-3 py-0.5 rounded-full bg-white text-black text-[10px] font-medium tracking-[0.2em] uppercase">
                    Pilihan Populer
                  </div>
                )}

                <div>
                  {/* Category & Duration */}
                  <div className="flex items-center justify-between gap-2 mb-6">
                    <span className="text-[11px] font-medium uppercase tracking-[0.2em] text-neutral-400">
                      {pkg.category}
                    </span>
                    <span className="flex items-center gap-1.5 text-xs text-neutral-400 font-mono">
                      <Clock className="w-3.5 h-3.5 text-neutral-400" />
                      <span>{pkg.duration} Menit</span>
                    </span>
                  </div>

                  <h3 className="font-serif text-2xl sm:text-3xl font-normal text-neutral-100 mb-2">
                    {pkg.name}
                  </h3>

                  <p className="text-xs sm:text-sm text-neutral-400 min-h-[40px] leading-relaxed mb-6 font-light">
                    {pkg.description}
                  </p>

                  {/* Price */}
                  <div className="flex items-baseline gap-1.5 mb-8 pb-6 border-b border-neutral-800">
                    <span className="font-serif text-3xl sm:text-4xl text-white">
                      {formatIDR(pkg.price)}
                    </span>
                    <span className="text-xs text-neutral-400 font-light">/ sesi</span>
                  </div>

                  {/* Inclusions */}
                  <div className="space-y-3.5 mb-8">
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-300">
                      Fasilitas Termasuk:
                    </p>
                    {featuresList.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-3 text-xs sm:text-sm text-neutral-300">
                        <Check className="w-4 h-4 text-neutral-400 shrink-0 mt-0.5" />
                        <span className="font-light leading-snug">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* CTA Action */}
                <div className="pt-6 border-t border-neutral-800/80">
                  <Link href={`/book?packageId=${pkg.id}`} className="block w-full">
                    <Button
                      variant={isHighlight ? 'primary' : 'outline'}
                      size="md"
                      className="w-full"
                    >
                      <span>Pesan Jadwal Ini</span>
                      <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
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
