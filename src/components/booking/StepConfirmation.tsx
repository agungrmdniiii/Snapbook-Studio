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
    <div className="max-w-xl mx-auto space-y-8 animate-studio-fade">
      {/* Header */}
      <div className="text-center space-y-3">
        <div className="w-14 h-14 rounded-full border border-neutral-700 bg-neutral-900 mx-auto flex items-center justify-center text-white">
          <CheckCircle2 className="w-7 h-7" />
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl font-normal text-white">
          Reservasi Berhasil Dibuat
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400 max-w-md mx-auto font-light leading-relaxed">
          Slot waktu sesi foto Anda telah dicatat di sistem studio. Silakan klik tombol di bawah untuk verifikasi ke WhatsApp resmi studio kami.
        </p>
      </div>

      {/* Reservation Receipt Card */}
      <div className="bg-[#101013] border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6">
        {/* Booking Code Bar */}
        <div className="flex items-center justify-between p-4 rounded-xl bg-[#0a0a0c] border border-neutral-800">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-400">
              Kode Booking Anda
            </p>
            <p className="text-xl font-mono font-semibold text-white mt-0.5 tracking-wider">
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
                <Copy className="w-3.5 h-3.5 text-neutral-400" />
                <span>Salin</span>
              </>
            )}
          </Button>
        </div>

        {/* Details Breakdown */}
        <div className="space-y-3 text-xs sm:text-sm border-t border-neutral-800 pt-5">
          <div className="flex items-center justify-between py-1">
            <span className="text-neutral-400">Nama Pemesan</span>
            <span className="font-medium text-white">{booking.clientName}</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-neutral-400">Paket Foto</span>
            <span className="font-serif text-base text-white">{booking.package?.name}</span>
          </div>
          <div className="flex items-center justify-between py-1">
            <span className="text-neutral-400">Tanggal & Jam</span>
            <span className="font-medium text-white text-right">
              {formatDateIndonesian(booking.date)} <br />
              <span className="text-xs font-mono text-neutral-400">{booking.startTime} – {booking.endTime} WIB</span>
            </span>
          </div>
          {booking.addOns && booking.addOns.length > 0 && (
            <div className="flex items-start justify-between py-1">
              <span className="text-neutral-400">Layanan Tambahan</span>
              <span className="font-light text-neutral-300 text-right max-w-[220px]">
                {booking.addOns.map((a) => a.addOn.name).join(', ')}
              </span>
            </div>
          )}
          <div className="flex items-center justify-between py-4 border-t border-neutral-800 font-normal">
            <span className="text-sm text-neutral-300">Total Biaya Sesi</span>
            <span className="font-serif text-2xl text-white">{formatIDR(booking.totalPrice)}</span>
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
              className="w-full py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs uppercase tracking-[0.16em] flex items-center justify-center gap-2 shadow-lg transition-all duration-150 cursor-pointer active:scale-[0.98] motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#09090b]"
            >
              <MessageCircle className="w-4 h-4 fill-white" />
              <span>Konfirmasi via WhatsApp Studio</span>
            </button>
          </a>

          <Link
            href={`/cek-booking?query=${booking.bookingCode}`}
            className="block w-full"
          >
            <Button variant="outline" size="md" className="w-full">
              <span>Cek Status Booking Mandiri</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
