'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Calendar, MapPin, AlertCircle, ArrowLeft } from 'lucide-react';
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
      setError('Masukkan kode booking (misal: SB-20261009-XXXX) atau nomor WhatsApp.');
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
      setError(err.message || 'Gagal mencari data reservasi.');
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
        return <Badge variant="success">✓ Jadwal Terkonfirmasi</Badge>;
      case 'COMPLETED':
        return <Badge variant="info">Sesi Selesai</Badge>;
      case 'CANCELLED':
        return <Badge variant="danger">Dibatalkan</Badge>;
      case 'PENDING':
      default:
        return <Badge variant="warning">Menunggu Konfirmasi DP</Badge>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#09090b]">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-6 py-12 sm:py-16">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs uppercase tracking-wider text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda</span>
          </Link>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal text-white mt-4">
            Cek Status Booking
          </h1>
          <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-light">
            Pantau status verifikasi jadwal, lokasi studio, dan detail reservasi foto Anda.
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-[#101013] border border-neutral-800 rounded-3xl p-6 sm:p-7 mb-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-neutral-500 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Masukkan Kode Booking (SB-...) atau No. WhatsApp"
                className="w-full pl-11 pr-4 py-3.5 bg-[#0a0a0c] border border-neutral-800 rounded-2xl text-white placeholder-neutral-600 text-sm focus:outline-none focus:border-neutral-300 focus:ring-1 focus:ring-neutral-300 transition-colors duration-150 motion-reduce:transition-none font-light"
              />
            </div>
            <Button type="submit" variant="primary" size="lg" isLoading={isLoading} className="shrink-0">
              <span>Lacak Jadwal</span>
            </Button>
          </form>

          {error && (
            <div className="mt-4 p-4 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Search Result Card - Clean Studio Receipt */}
        {result && (
          <div className="bg-[#101013] border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6 animate-studio-fade">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-neutral-800">
              <div>
                <span className="text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-400">
                  Kode Reservasi
                </span>
                <h3 className="font-mono text-2xl font-semibold text-white mt-1 tracking-wider">
                  {result.bookingCode}
                </h3>
                <p className="text-xs text-neutral-400 mt-1 font-light">
                  Nama Pemesan:{' '}
                  <span className="text-neutral-200 font-medium">{result.clientName}</span>
                </p>
              </div>
              <div>{getStatusBadge(result.status)}</div>
            </div>

            {/* Session Time & Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-[#0a0a0c] border border-neutral-800 space-y-1.5">
                <div className="flex items-center gap-2 text-[10px] font-medium text-neutral-400 uppercase tracking-[0.18em]">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Jadwal Sesi Foto</span>
                </div>
                <p className="font-serif text-lg font-normal text-white">
                  {formatDateIndonesian(result.date)}
                </p>
                <p className="text-xs text-neutral-400 font-mono">
                  Pukul {result.startTime} – {result.endTime} WIB ({result.packageDuration} Menit)
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-[#0a0a0c] border border-neutral-800 space-y-1.5">
                <div className="flex items-center gap-2 text-[10px] font-medium text-neutral-400 uppercase tracking-[0.18em]">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>Lokasi Studio</span>
                </div>
                <p className="font-serif text-base font-normal text-white">{result.studio.name}</p>
                <p className="text-xs text-neutral-400 font-light leading-snug">{result.studio.address}</p>
              </div>
            </div>

            {/* Package & Addons breakdown */}
            <div className="border-t border-neutral-800 pt-5 space-y-2.5 text-xs sm:text-sm">
              <div className="flex items-center justify-between">
                <span className="text-neutral-400">Paket Foto</span>
                <span className="font-serif text-base text-white">{result.packageName}</span>
              </div>
              {result.addOns.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-neutral-400">Layanan Tambahan</span>
                  <span className="font-light text-neutral-300">{result.addOns.join(', ')}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-4 border-t border-neutral-800 font-normal">
                <span className="text-sm text-neutral-300">Total Biaya Sesi</span>
                <span className="font-serif text-2xl text-white">{formatIDR(result.totalPrice)}</span>
              </div>
            </div>

            {/* Arrival Rules Guidance */}
            <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-800 text-xs text-neutral-300 space-y-1.5 font-light">
              <p className="font-medium uppercase tracking-wider text-neutral-200 text-[11px]">
                Panduan Kedatangan:
              </p>
              <p>• Harap hadir 10–15 menit sebelum slot sesi Anda ({result.startTime} WIB) untuk touch-up & persiapan.</p>
              <p>• Jika memerlukan bantuan, hubungi WhatsApp Studio kami: +{result.studio.whatsappNumber}</p>
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
        <div className="min-h-screen bg-[#09090b] flex items-center justify-center text-neutral-400 font-mono text-xs">
          MEMUAT DATA...
        </div>
      }
    >
      <CekBookingContent />
    </Suspense>
  );
}
