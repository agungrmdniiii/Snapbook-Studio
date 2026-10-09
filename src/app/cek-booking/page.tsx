'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Calendar, Clock, MapPin, AlertCircle, ArrowLeft, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { Navbar } from '@/components/landing/Navbar';
import { Footer } from '@/components/landing/Footer';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { formatIDR, formatDateIndonesian } from '@/lib/utils';

interface TrackedBooking {
  bookingCode: string;
  clientName: string;
  packageName: string;
  packageDuration: number;
  date: string;
  startTime: string;
  endTime: string;
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED';
  totalPrice: number;
  addOns: string[];
  studio: {
    name: string;
    address: string;
    whatsappNumber: string;
    instagramHandle: string;
  };
}

function CekBookingContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('query') || '';

  const [query, setQuery] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<TrackedBooking | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (searchQuery?: string) => {
    const q = (searchQuery ?? query).trim();
    if (!q) {
      setError('Masukkan kode pass reservasi (misal: SB-20261009-XXXX) atau nomor WhatsApp.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`/api/bookings/track?query=${encodeURIComponent(q)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Reservasi tidak ditemukan.');
      }

      setResult(data);
    } catch (err: any) {
      setError(err.message || 'Gagal mencari reservasi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return <Badge variant="success">✓ Sesi Terkonfirmasi</Badge>;
      case 'COMPLETED':
        return <Badge variant="info">Sesi Selesai</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">Dibatalkan</Badge>;
      case 'PENDING':
      default:
        return <Badge variant="gold">Menunggu Verifikasi Admin</Badge>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#0c0a09]">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-16">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-stone-400 hover:text-amber-300 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-amber-400" />
            <span>Kembali ke Atelier</span>
          </Link>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-stone-100 mt-4">
            Verifikasi Reservation Pass
          </h1>
          <p className="text-xs sm:text-sm text-stone-400 mt-1 font-light">
            Pantau status jadwal terkurasi, panduan kedatangan atelier, dan rincian edisi pemotretan Anda.
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-[#12100f] border border-stone-800 rounded-3xl p-6 sm:p-7 shadow-xl mb-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-stone-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Masukkan Kode Pass (SB-...) atau No. WhatsApp"
                className="w-full pl-11 pr-4 py-3.5 bg-[#0c0a09] border border-stone-800 rounded-2xl text-stone-100 placeholder-stone-600 text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all font-light"
              />
            </div>
            <Button type="submit" variant="gold" size="lg" isLoading={isLoading} className="shrink-0">
              <span>Lacak Jadwal Pass</span>
            </Button>
          </form>

          {error && (
            <div className="mt-4 p-4 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Search Result Card - Editorial Pass */}
        {result && (
          <div className="bg-[#12100f] border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in duration-300 relative overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-200 to-amber-400" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-stone-850">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400">
                  Official Reservation Pass
                </span>
                <h3 className="font-mono text-2xl font-bold text-stone-100 mt-1 tracking-wider">
                  {result.bookingCode}
                </h3>
                <p className="text-xs text-stone-400 mt-1 font-light">
                  Nama Tamu:{' '}
                  <span className="text-stone-200 font-medium">{result.clientName}</span>
                </p>
              </div>
              <div>{getStatusBadge(result.status)}</div>
            </div>

            {/* Session Time & Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-[#0c0a09] border border-stone-800 space-y-1.5">
                <div className="flex items-center gap-2 text-[10px] font-bold text-amber-400 uppercase tracking-[0.2em]">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Jadwal Sesi Pemotretan</span>
                </div>
                <p className="font-serif text-lg font-normal text-stone-100">
                  {formatDateIndonesian(result.date)}
                </p>
                <p className="text-xs text-stone-400 font-mono">
                  Pukul {result.startTime} – {result.endTime} WIB ({result.packageDuration} Menit)
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0c0a09] border border-stone-800 space-y-1.5">
                <div className="flex items-center gap-2 text-[10px] font-bold text-amber-400 uppercase tracking-[0.2em]">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Lokasi Studio Atelier</span>
                </div>
                <p className="font-serif text-base font-normal text-stone-100">{result.studio.name}</p>
                <p className="text-xs text-stone-400 font-light leading-snug">{result.studio.address}</p>
              </div>
            </div>

            {/* Package & Addons breakdown */}
            <div className="border-t border-stone-850 pt-5 space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-center justify-between">
                <span className="text-stone-400 uppercase tracking-wider text-[11px]">Edisi Paket</span>
                <span className="font-serif text-base text-stone-100">{result.packageName}</span>
              </div>
              {result.addOns.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-stone-400 uppercase tracking-wider text-[11px]">Add-ons</span>
                  <span className="font-light text-stone-200">{result.addOns.join(', ')}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-4 border-t border-stone-850 font-normal">
                <span className="font-serif text-base text-stone-300">Total Tarif Sesi</span>
                <span className="font-serif text-2xl text-amber-300">{formatIDR(result.totalPrice)}</span>
              </div>
            </div>

            {/* Arrival Rules Guidance */}
            <div className="p-5 rounded-2xl bg-amber-400/[0.06] border border-amber-400/20 text-xs text-stone-300 space-y-1.5 font-light">
              <p className="font-bold uppercase tracking-wider text-amber-400 text-[11px]">
                Protocol Kedatangan:
              </p>
              <p>• Harap hadir 10–15 menit sebelum slot ({result.startTime} WIB) untuk touch-up & briefing gaya.</p>
              <p>• Untuk pertanyaan mendesak, silakan hubungi WhatsApp Studio: +{result.studio.whatsappNumber}</p>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}

export default function CekBookingPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#0c0a09] flex items-center justify-center text-stone-400 font-mono text-xs">
          MEMUAT VERIFIKASI PASS...
        </div>
      }
    >
      <CekBookingContent />
    </Suspense>
  );
}
