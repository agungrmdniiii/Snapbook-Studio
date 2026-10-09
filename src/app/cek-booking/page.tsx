'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Search, Calendar, Clock, MapPin, CheckCircle, AlertCircle, Phone, ArrowLeft } from 'lucide-react';
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
    <div className="flex flex-col min-h-screen bg-[#0c0d0e]">
      <Navbar />

      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Beranda</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white mt-3">
            Cek Status Reservasi Anda
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Pantau status verifikasi, jadwal kedatangan, dan detail sesi foto studio Anda.
          </p>
        </div>

        {/* Search Box */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl mb-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Masukkan Kode Booking (SB-...) atau No. WhatsApp"
                className="w-full pl-11 pr-4 py-3.5 bg-zinc-950 border border-zinc-800 rounded-2xl text-white placeholder-zinc-500 text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
            </div>
            <Button type="submit" size="lg" isLoading={isLoading} className="shrink-0">
              <span>Lacak Jadwal</span>
            </Button>
          </form>

          {error && (
            <div className="mt-4 p-4 rounded-xl bg-rose-950/40 border border-rose-900 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Search Result Card */}
        {result && (
          <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-2xl animate-in fade-in duration-300">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                  Kode Reservasi
                </span>
                <h3 className="text-2xl font-mono font-extrabold text-white mt-0.5">
                  {result.bookingCode}
                </h3>
                <p className="text-xs text-zinc-400 mt-1">Atas nama: <span className="text-white font-medium">{result.clientName}</span></p>
              </div>
              <div>{getStatusBadge(result.status)}</div>
            </div>

            {/* Session Time & Location */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-850 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  <Calendar className="w-4 h-4" />
                  <span>Jadwal Sesi Foto</span>
                </div>
                <p className="text-base font-bold text-white">
                  {formatDateIndonesian(result.date)}
                </p>
                <p className="text-xs text-zinc-400 font-mono">
                  Pukul {result.startTime} - {result.endTime} WIB ({result.packageDuration} menit)
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-950 border border-zinc-850 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  <MapPin className="w-4 h-4" />
                  <span>Lokasi Studio</span>
                </div>
                <p className="text-sm font-bold text-white">{result.studio.name}</p>
                <p className="text-xs text-zinc-400 leading-snug">{result.studio.address}</p>
              </div>
            </div>

            {/* Package & Addons breakdown */}
            <div className="border-t border-zinc-800 pt-5 space-y-2 text-xs sm:text-sm">
              <div className="flex items-center justify-between">
                <span className="text-zinc-400">Paket Foto</span>
                <span className="font-semibold text-white">{result.packageName}</span>
              </div>
              {result.addOns.length > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-zinc-400">Layanan Ekstra (Add-ons)</span>
                  <span className="font-semibold text-white">{result.addOns.join(', ')}</span>
                </div>
              )}
              <div className="flex items-center justify-between pt-3 border-t border-zinc-800 text-sm sm:text-base font-bold">
                <span className="text-zinc-300">Total Biaya</span>
                <span className="text-emerald-400">{formatIDR(result.totalPrice)}</span>
              </div>
            </div>

            {/* Arrival Rules Guidance */}
            <div className="p-4.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200/90 space-y-1">
              <p className="font-bold text-amber-400">📌 Panduan Kedatangan:</p>
              <p>• Harap hadir 10–15 menit sebelum waktu sesi ({result.startTime} WIB) untuk briefing & persiapan.</p>
              <p>• Jika memerlukan bantuan atau ingin bertanya ke admin, hubungi WhatsApp: +{result.studio.whatsappNumber}</p>
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
        <div className="min-h-screen bg-[#0c0d0e] flex items-center justify-center text-zinc-400">
          Memuat pencarian...
        </div>
      }
    >
      <CekBookingContent />
    </Suspense>
  );
}
