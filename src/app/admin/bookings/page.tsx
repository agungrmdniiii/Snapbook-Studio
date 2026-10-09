'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { BookingTable } from '@/components/admin/BookingTable';
import { BookingData, BookingStatus } from '@/types';
import { Search, RefreshCw } from 'lucide-react';
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
    { key: 'ALL', label: 'Semua Pass' },
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
          <div className="text-[10px] uppercase font-mono tracking-[0.25em] text-amber-400 mb-1">
            Reservations Ledger
          </div>
          <h1 className="font-serif text-3xl font-normal text-stone-100">Manajemen Reservasi & Pass</h1>
          <p className="text-xs text-stone-400 mt-1 font-light">
            Pantau dan kelola jadwal sesi foto, konfirmasi DP, dan pengingat WhatsApp.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchBookings} isLoading={isLoading}>
          <RefreshCw className="w-3.5 h-3.5 mr-1 text-amber-400" />
          <span>Muat Ulang</span>
        </Button>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-[#12100f] border border-stone-800 rounded-2xl p-4">
        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 md:pb-0">
          {statusTabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-3.5 py-1.5 rounded-full text-[11px] uppercase tracking-wider font-medium transition-all shrink-0 cursor-pointer ${
                statusFilter === tab.key
                  ? 'bg-amber-400 text-stone-950 font-bold shadow-md shadow-amber-400/15'
                  : 'bg-stone-900 text-stone-400 hover:text-stone-200 border border-stone-800'
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
          <Search className="w-3.5 h-3.5 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cari kode pass, nama, no HP..."
            className="w-full pl-9 pr-3.5 py-2 bg-[#0c0a09] border border-stone-800 rounded-xl text-xs text-stone-100 placeholder-stone-600 focus:outline-none focus:border-amber-400 transition-all font-light"
          />
        </form>
      </div>

      {/* Bookings Table */}
      {isLoading ? (
        <div className="p-16 text-center text-xs text-stone-400 bg-[#12100f] rounded-2xl border border-stone-850 font-light">
          Memverifikasi data reservasi...
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
    <Suspense fallback={<div className="p-8 text-stone-400 text-xs font-mono">MEMUAT DATA RESERVASI...</div>}>
      <BookingsContent />
    </Suspense>
  );
}
