import React from 'react';
import Image from 'next/image';
import { MotionLink as Link } from './PublicMotion';
import { Clock, ArrowRight, ArrowDown } from 'lucide-react';
import { PackageFeatures } from '@/components/booking/PackageFeatures';
import { formatIDR } from '@/lib/utils';
import { DEFAULT_PACKAGES } from '@/lib/constants';
import { INSPIRATION_PHOTOS } from '@/lib/gallery-presentation';

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
    <section id="paket" className="studio-packages py-20 sm:py-28 border-b border-neutral-800 bg-[#0c0c0e]">
      <div className="max-w-7xl mx-auto px-6 sm:px-8">
        <div className="max-w-2xl mb-16 space-y-4">
          <h2 className="font-serif text-3xl sm:text-5xl font-normal text-neutral-100 tracking-tight">
            Paket Foto & Tarif
          </h2>
          <p className="text-neutral-400 text-sm sm:text-base font-light">
            Bandingkan harga, durasi, dan fasilitas setiap paket.
          </p>
        </div>

        {packages.length > 1 && <nav className="studio-package-overview" aria-label="Bandingkan harga dan durasi paket">
          {packages.map(pkg => <a key={pkg.id} href={`#${encodeURIComponent(`paket-${pkg.id}`)}`}>
            <span className="studio-overview-name">{pkg.name}</span><strong>{formatIDR(pkg.price)}</strong><span>{pkg.duration} menit <ArrowDown size={16} aria-hidden="true" /></span>
          </a>)}
        </nav>}
        {!packages.length && <p role="status" className="text-neutral-300 py-8">Belum ada paket yang tersedia.</p>}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8 items-stretch">
          {packages.map((pkg) => {
            const seed = DEFAULT_PACKAGES.find(item => item.id === pkg.id);
            const customImage = pkg.imageUrl && pkg.imageUrl !== seed?.imageUrl;
            const category = pkg.category === 'Self Portrait' || pkg.category === 'Editorial' ? 'Portrait' : pkg.category;
            const inspiration = INSPIRATION_PHOTOS.find(photo => photo.category === category);
            const imageUrl = customImage ? pkg.imageUrl : inspiration?.url;

            return (
              <article
                key={pkg.id}
                id={`paket-${pkg.id}`}
                tabIndex={-1}
                className="studio-package-card relative rounded-2xl p-8 sm:p-9 flex flex-col justify-between bg-[#101013] border border-neutral-800/90 hover:border-neutral-600 transition-colors duration-200"
              >
                <div>
                  {imageUrl && <figure className="studio-package-photo">
                    <Image src={imageUrl} alt={customImage ? pkg.name : `Inspirasi ${pkg.name}`} fill sizes="(max-width: 767px) 90vw, 45vw" unoptimized={!!customImage} />
                    {!customImage && <figcaption>Inspirasi sesi · Foto stok</figcaption>}
                  </figure>}
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
                  <div className="mb-8">
                    <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-300">
                      Fasilitas Termasuk:
                    </p>
                    <PackageFeatures value={pkg.features} />
                  </div>
                </div>

                {/* CTA Action */}
                <div className="pt-6 border-t border-neutral-800/80">
                  <Link href={`/book?packageId=${encodeURIComponent(pkg.id)}`} className="studio-book-link studio-package-cta" aria-label={`Pilih ${pkg.name} dan lanjut ke jadwal`}>
                    <span>Pilih paket</span><ArrowRight size={17} aria-hidden="true" />
                  </Link>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
