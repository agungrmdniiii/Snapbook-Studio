'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Kapan sebaiknya saya dan rombongan tiba di studio?',
      a: 'Sebaiknya datang 10–15 menit sebelum sesi untuk berganti pakaian, merapikan riasan, dan persiapan foto.',
    },
    {
      q: 'Bagaimana jika saya datang terlambat dari jam yang dipesan?',
      a: 'Sesi tetap berakhir sesuai jadwal. Jika terlambat, kabari admin lewat WhatsApp.',
    },
    {
      q: 'Kapan dan bagaimana saya menerima file softcopy foto?',
      a: 'Semua file foto asli beresolusi penuh dikirim lewat Google Drive pada hari yang sama, paling lambat malam setelah sesi.',
    },
    {
      q: 'Apakah jadwal sesi foto bisa diganti (reschedule)?',
      a: 'Bisa, paling lambat H-1. Hubungi admin lewat WhatsApp untuk memilih jadwal pengganti yang masih tersedia.',
    },
    {
      q: 'Bagaimana mekanisme pembayaran & uang muka (DP)?',
      a: 'Setelah reservasi dibuat, hubungi admin lewat tombol WhatsApp untuk konfirmasi jadwal dan instruksi pembayaran.',
    },
  ];

  return (
    <section id="faq" className="py-24 sm:py-32 border-b border-neutral-850 bg-[#09090b]">
      <div className="max-w-4xl mx-auto px-6 sm:px-8">
        <div className="mb-14 space-y-3">
          <h2 className="font-serif text-3xl sm:text-5xl font-normal text-neutral-100 tracking-tight">
            Panduan & Pertanyaan Umum
          </h2>
          <p className="text-neutral-400 text-sm sm:text-base font-light">
            Info kedatangan, file foto, dan perubahan jadwal.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className={`rounded-2xl border overflow-hidden transition-all duration-200 ${
                  isOpen ? 'border-neutral-700 bg-[#121216]' : 'border-neutral-800 bg-[#101013]'
                }`}
              >
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-neutral-900/40 focus-visible:outline-none focus-visible:bg-neutral-900/60 focus-visible:ring-1 focus-visible:ring-neutral-400 transition-colors"
                >
                  <span className="font-serif text-base sm:text-lg font-normal text-neutral-100">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-400 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shrink-0 motion-reduce:transition-none ${
                      isOpen ? 'rotate-180 text-white' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-sm text-neutral-300 font-light leading-relaxed border-t border-neutral-800/60 pt-4 animate-studio-subtle">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
