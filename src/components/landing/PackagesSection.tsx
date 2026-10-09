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
    <section id="paket" className="py-24 border-t border-zinc-900 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-xs font-semibold text-amber-400 uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pilihan Paket Foto</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Tarif Transparan & Terjangkau
          </h2>
          <p className="text-zinc-400 text-sm sm:text-base">
            Tanpa biaya tersembunyi. Dapatkan seluruh softcopy foto Anda dan cetakan berkualitas tinggi langsung dari studio.
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

            const isPopular = idx === 1; // Middle package highlight

            return (
              <div
                key={pkg.id}
                className={`relative rounded-3xl p-8 flex flex-col justify-between transition-all duration-300 ${
                  isPopular
                    ? 'bg-zinc-900 border-2 border-amber-500/60 shadow-2xl shadow-amber-500/10 lg:-translate-y-2'
                    : 'bg-zinc-900/60 border border-zinc-800 hover:border-zinc-700 shadow-xl'
                }`}
              >
                {isPopular && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-amber-500 to-amber-400 text-zinc-950 text-xs font-bold uppercase tracking-wider shadow-md">
                    Paling Favorit 🔥
                  </div>
                )}

                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-xs font-semibold uppercase tracking-wider text-amber-400 px-2.5 py-1 rounded-lg bg-amber-500/10">
                      {pkg.category}
                    </span>
                    <span className="flex items-center gap-1 text-xs text-zinc-400">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{pkg.duration} Menit Sesi</span>
                    </span>
                  </div>

                  <h3 className="text-2xl font-bold text-white mb-2">{pkg.name}</h3>
                  <p className="text-xs text-zinc-400 min-h-[36px] leading-relaxed mb-6">
                    {pkg.description}
                  </p>

                  <div className="flex items-baseline gap-1 mb-6 pb-6 border-b border-zinc-800">
                    <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                      {formatIDR(pkg.price)}
                    </span>
                    <span className="text-xs text-zinc-500">/ sesi</span>
                  </div>

                  {/* Feature Bullets */}
                  <div className="space-y-3 mb-8">
                    <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                      Fasilitas Termasuk:
                    </p>
                    {featuresList.map((feat, fIdx) => (
                      <div key={fIdx} className="flex items-start gap-3 text-sm text-zinc-300">
                        <div className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 mt-0.5">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                        <span className="text-xs sm:text-sm leading-relaxed">{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link href={`/book?packageId=${pkg.id}`} className="w-full">
                  <Button
                    variant={isPopular ? 'primary' : 'outline'}
                    size="lg"
                    className="w-full"
                  >
                    <span>Pilih Paket Ini</span>
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
