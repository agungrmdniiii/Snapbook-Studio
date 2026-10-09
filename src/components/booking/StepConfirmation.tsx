'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, MessageCircle, Copy, Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { formatIDR, formatDateIndonesian } from '@/lib/utils';
import { BookingData } from '@/types';

interface StepConfirmationProps {
  booking: BookingData;
  whatsappUrl: string;
}

export const StepConfirmation: React.FC<StepConfirmationProps> = ({
  booking,
  whatsappUrl,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    navigator.clipboard.writeText(booking.bookingCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300">
      {/* Header Banner */}
      <div className="text-center space-y-3">
        <div className="w-16 h-16 rounded-full bg-amber-400/10 text-amber-300 border border-amber-400/30 mx-auto flex items-center justify-center shadow-xl shadow-amber-400/5">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <div className="text-[10px] uppercase tracking-[0.25em] text-amber-400 font-mono">
          Official Reservation Pass Issued
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl font-normal text-stone-100">
          Reservasi Berhasil Dibuat
        </h2>
        <p className="text-xs sm:text-sm text-stone-400 max-w-md mx-auto font-light leading-relaxed">
          Slot waktu privat Anda telah diamankan. Silakan kirimkan konfirmasi via WhatsApp untuk verifikasi jadwal resmi dari tim atelier.
        </p>
      </div>

      {/* Reservation Pass Card */}
      <div className="bg-[#12100f] border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Subtle decorative gold edge bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-200 to-amber-400" />

        {/* Code Bar */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-[#0c0a09] border border-stone-800">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400">
              Kode Pass Reservasi
            </p>
            <p className="text-xl sm:text-2xl font-mono font-bold text-stone-100 mt-0.5 tracking-wider">
              {booking.bookingCode}
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCopyCode}
            className="shrink-0"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-amber-300" />
                <span>Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-stone-400" />
                <span>Salin</span>
              </>
            )}
          </Button>
        </div>

        {/* Breakdown Details */}
        <div className="space-y-3.5 text-xs sm:text-sm border-t border-stone-850 pt-5">
          <div className="flex items-center justify-between py-1">
            <span className="text-stone-400 uppercase tracking-wider text-[11px]">Nama Klien</span>
            <span className="font-medium text-stone-100">{booking.clientName}</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-stone-400 uppercase tracking-wider text-[11px]">Edisi Paket</span>
            <span className="font-serif text-base text-stone-100">{booking.package?.name}</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-stone-400 uppercase tracking-wider text-[11px]">Jadwal & Waktu</span>
            <span className="font-medium text-amber-300 text-right">
              {formatDateIndonesian(booking.date)} <br />
              <span className="text-xs font-mono text-stone-300">{booking.startTime} – {booking.endTime} WIB</span>
            </span>
          </div>
          {booking.addOns && booking.addOns.length > 0 && (
            <div className="flex items-start justify-between py-1">
              <span className="text-stone-400 uppercase tracking-wider text-[11px]">Add-ons</span>
              <span className="font-light text-stone-200 text-right max-w-[220px]">
                {booking.addOns.map((a) => a.addOn.name).join(', ')}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between py-4 border-t border-stone-850 font-normal">
            <span className="font-serif text-base text-stone-200">Total Tarif Sesi</span>
            <span className="font-serif text-2xl text-amber-300">{formatIDR(booking.totalPrice)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-2 space-y-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full"
          >
            <button
              type="button"
              className="w-full py-3.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-stone-950 font-bold text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-2 shadow-xl shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 fill-stone-950" />
              <span>Kirim Konfirmasi ke WhatsApp Studio</span>
            </button>
          </a>

          <Link
            href={`/cek-booking?query=${booking.bookingCode}`}
            className="block w-full"
          >
            <Button variant="outline" size="md" className="w-full">
              <span>Pantau Status Pass Mandiri</span>
              <ArrowRight className="w-4 h-4 ml-1.5 text-amber-400" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
