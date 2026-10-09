'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BookingTable } from '@/components/admin/BookingTable';
import { BookingData, BookingStatus } from '@/types';
import { Search, RefreshCw, CalendarCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';

function BookingsContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || 'ALL';
  const initialSearch = searchParams.get('search') || '';

  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [studioName, setStudioName] = useState('Snapbook Studio');

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'ALL') params.append('status', statusFilter);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      const res = await fetch(`/api/bookings?${params.toString()}`);
      if (!res.ok) throw new Error('Gagal mengambil data booking');
      const data = await res.json();
      setBookings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
    // fetch studio name
    fetch('/api/settings')
      .then((r) => r.json())
      .then((cfg) => {
        if (cfg?.studioName) setStudioName(cfg.studioName);
      })
      .catch(() => {});
  }, [statusFilter]);

  const handleUpdateStatus = async (bookingId: string, newStatus: BookingStatus) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) throw new Error('Gagal mengupdate status');

      // Update local state
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
    } catch (err: any) {
      alert(err.message || 'Gagal mengubah status');
    }
  };

  const statusTabs = [
    { key: 'ALL', label: 'Semua' },
    { key: 'PENDING', label: 'Menunggu DP' },
    { key: 'CONFIRMED', label: 'Terkonfirmasi' },
    { key: 'COMPLETED', label: 'Selesai' },
    { key: 'CANCELLED', label: 'Dibatalkan' },
  ];

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Manajemen Reservasi</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Pantau dan kelola jadwal sesi foto, konfirmasi DP, dan pengingat WhatsApp.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchBookings} isLoading={isLoading}>
          <RefreshCw className="w-3.5 h-3.5 mr-1" />
          <span>Muat Ulang</span>
        </Button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-amber-500 text-zinc-950 shadow-md'
                  : 'bg-zinc-800/80 text-zinc-400 hover:text-white hover:bg-zinc-750'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            fetchBookings();
          }}
          className="relative min-w-[280px]"
        >
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari kode, nama, no HP..."
            className="w-full pl-9 pr-3 py-1.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500 transition-all"
          />
        </form>
      </div>

      {/* Bookings Table */}
      {isLoading ? (
        <div className="p-16 text-center text-xs text-zinc-400 bg-zinc-900/40 rounded-2xl border border-zinc-850">
          Memuat data reservasi...
        </div>
      ) : (
        <BookingTable
          bookings={bookings}
          onUpdateStatus={handleUpdateStatus}
          studioName={studioName}
        />
      )}
    </div>
  );
}

export default function AdminBookingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-zinc-400 text-xs">Memuat data...</div>}>
      <BookingsContent />
    </Suspense>
  );
}
