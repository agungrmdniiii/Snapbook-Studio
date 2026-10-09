'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown } from 'lucide-react';

export const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'Kapan sebaiknya saya tiba di studio?',
      a: 'Kami menyarankan Anda dan rekan hadir 10–15 menit sebelum slot jam Anda dimulai. Waktu ini berguna untuk persiapan makeup, mengganti pakaian, serta briefing singkat agar durasi foto Anda optimal.',
    },
    {
      q: 'Bagaimana jika saya datang terlambat dari jam yang dipesan?',
      a: 'Durasi sesi foto tetap berjalan sesuai jam yang telah dijadwalkan agar tidak mengganggu slot klien berikutnya. Mohon infokan kami via WhatsApp jika ada kendala di perjalanan.',
    },
    {
      q: 'Bagaimana dan kapan saya menerima file softcopy foto?',
      a: 'Seluruh softcopy foto original akan dikirimkan melalui link Google Drive maksimal pada malam hari di tanggal sesi foto Anda.',
    },
    {
      q: 'Apakah bisa reschedule / ganti jadwal?',
      a: 'Perubahan jadwal dapat dilakukan maksimal H-1 sebelum sesi foto dengan menghubungi admin kami melalui WhatsApp, selama slot pengganti masih tersedia.',
    },
    {
      q: 'Bagaimana mekanisme pembayaran & DP?',
      a: 'Setelah Anda mengisi formulir pemesanan, sistem akan mengarahkan Anda ke WhatsApp admin studio kami untuk konfirmasi ketersediaan dan detail instruksi pembayaran sesuai aturan studio.',
    },
  ];

  return (
    <section id="faq" className="py-20 border-t border-zinc-900 bg-zinc-950/60">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12 space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-800/80 border border-zinc-700/60 text-xs font-semibold text-amber-400">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Pertanyaan Umum</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            Frequently Asked Questions
          </h2>
          <p className="text-zinc-400 text-sm">
            Semua hal penting yang perlu Anda ketahui sebelum datang ke studio.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-zinc-800 bg-zinc-900/60 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenIndex(isOpen ? null : idx)}
                  className="w-full px-6 py-4.5 text-left flex items-center justify-between gap-4 cursor-pointer"
                >
                  <span className="text-base font-semibold text-zinc-100">{faq.q}</span>
                  <ChevronDown
                    className={`w-5 h-5 text-zinc-400 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 text-amber-400' : ''
                    }`}
                  />
                </button>
                {isOpen && (
                  <div className="px-6 pb-5 text-sm text-zinc-400 leading-relaxed border-t border-zinc-800/50 pt-3">
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
