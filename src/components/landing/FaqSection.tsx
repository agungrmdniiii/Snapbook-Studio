'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Kapan sebaiknya saya dan rombongan tiba di studio?',
      a: 'Kami menyarankan Anda tiba 10–15 menit sebelum slot sesi Anda dimulai. Waktu ini sangat berharga untuk touch-up riasan, ganti pakaian, serta briefing arahan gaya bersama tim kami agar durasi foto Anda optimal.',
    },
    {
      q: 'Bagaimana jika saya datang terlambat dari jam yang dipesan?',
      a: 'Durasi sesi foto tetap berjalan sesuai batas waktu reservasi demi menjaga kenyamanan klien pada slot berikutnya. Mohon beri tahu tim studio kami via WhatsApp jika terjadi kendala perjalanan.',
    },
    {
      q: 'Bagaimana dan kapan saya menerima file softcopy foto?',
      a: 'Seluruh file softcopy original resolusi penuh akan dikirimkan via tautan Google Drive berproteksi pada hari yang sama (maksimal malam hari sesi foto Anda).',
    },
    {
      q: 'Apakah jadwal sesi foto dapat di-reschedule?',
      a: 'Perubahan jadwal dapat dilakukan maksimal H-1 sebelum sesi foto berlangsung melalui WhatsApp admin, dengan ketentuan ketersediaan slot pengganti di tanggal baru.',
    },
    {
      q: 'Bagaimana mekanisme pembayaran & uang muka (DP)?',
      a: 'Setelah mengisi formulir reservasi, sistem kami langsung menghubungkan Anda ke WhatsApp resmi studio untuk konfirmasi ketersediaan dan detail instruksi pembayaran sesuai kebijakan studio.',
    },
  ];

  return (
    <section id="faq" className="py-24 border-b border-stone-850 bg-[#090807]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-stone-900 border border-stone-800 text-[11px] font-semibold text-amber-300 uppercase tracking-[0.2em]">
            <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
            <span>Studio Protocol & Etiquette</span>
          </div>
          <h2 className="font-serif text-3xl sm:text-5xl font-normal text-stone-100 tracking-tight">
            Tanya Jawab & <span className="italic text-amber-300">Panduan Sesi</span>
          </h2>
          <p className="text-stone-400 text-sm sm:text-base font-light max-w-lg mx-auto">
            Semua hal esensial yang perlu Anda ketahui sebelum memasuki ruang atelier studio.
          </p>
        </div>

        <div className="space-y-3.5">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-xl border border-stone-800 bg-[#12100f] overflow-hidden transition-all duration-200"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full px-6 py-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-stone-900/40 transition-colors"
                >
                  <span className="font-serif text-base sm:text-lg font-normal text-stone-100 flex items-center gap-3">
                    <span className="font-mono text-xs text-amber-400/80 font-normal">
                      [{String(idx + 1).padStart(2, '0')}]
                    </span>
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-stone-400 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-amber-300' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-6 text-sm text-stone-300 font-light leading-relaxed border-t border-stone-850 pt-4">
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
