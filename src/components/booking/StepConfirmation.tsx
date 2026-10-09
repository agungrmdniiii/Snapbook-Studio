'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { CheckCircle2, MessageCircle, Copy, Check, Calendar, Clock, MapPin, ArrowRight } from 'lucide-react';
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
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/10">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
          Reservasi Berhasil Dibuat!
        </h2>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-md mx-auto">
          Slot waktu Anda telah dicatat di sistem studio. Silakan kirimkan konfirmasi via WhatsApp untuk verifikasi jadwal.
        </p>
      </div>

      {/* Booking Code Card */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-7 space-y-6 shadow-xl">
        <div className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950 border border-zinc-800/80">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
              Kode Booking Anda
            </p>
            <p className="text-xl font-mono font-extrabold text-white mt-0.5">
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
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                <span>Tersalin</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Salin</span>
              </>
            )}
          </Button>
        </div>

        {/* Summary Details */}
        <div className="space-y-3 text-xs sm:text-sm border-t border-zinc-800/80 pt-4">
          <div className="flex items-center justify-between py-1">
            <span className="text-zinc-400">Nama Pemesan</span>
            <span className="font-semibold text-white">{booking.clientName}</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-zinc-400">Paket Foto</span>
            <span className="font-semibold text-white">{booking.package?.name}</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-zinc-400">Tanggal & Jam</span>
            <span className="font-semibold text-amber-400 text-right">
              {formatDateIndonesian(booking.date)} <br />
              <span className="text-xs font-mono">{booking.startTime} - {booking.endTime} WIB</span>
            </span>
          </div>
          {booking.addOns && booking.addOns.length > 0 && (
            <div className="flex items-start justify-between py-1">
              <span className="text-zinc-400">Add-ons</span>
              <span className="font-semibold text-white text-right max-w-[200px]">
                {booking.addOns.map((a) => a.addOn.name).join(', ')}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between py-3 border-t border-zinc-800 font-bold text-base">
            <span className="text-zinc-300">Total Biaya Sesi</span>
            <span className="text-emerald-400">{formatIDR(booking.totalPrice)}</span>
          </div>
        </div>

        {/* Primary Action Button */}
        <div className="pt-2 space-y-3">
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full"
          >
            <button
              type="button"
              className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 active:scale-[0.98] transition-all cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 fill-zinc-950" />
              <span>Kirim Konfirmasi via WhatsApp</span>
            </button>
          </a>

          <Link
            href={`/cek-booking?query=${booking.bookingCode}`}
            className="block w-full"
          >
            <Button variant="outline" size="md" className="w-full">
              <span>Pantau Status Booking Mandiri</span>
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
