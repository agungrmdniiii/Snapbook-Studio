'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { BookingTable } from '@/components/admin/BookingTable';
import { BookingData, BookingStatus } from '@/types';
import { Search, RefreshCw, Calendar, CheckCircle2, Clock, Check, X, DollarSign, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { StudioCalendar } from '@/components/ui/StudioCalendar';
import { formatIDR, formatDateIndonesian } from '@/lib/utils';

function BookingsContent() {
  const searchParams = useSearchParams();
  const initialStatus = searchParams.get('status') || 'ALL';
  const initialSearch = searchParams.get('search') || '';

  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [dateFilter, setDateFilter] = useState('ALL'); // 'ALL' | 'TODAY' | 'TOMORROW' | 'CUSTOM'
  const [customDate, setCustomDate] = useState('');
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState(initialSearch);
  const [bookings, setBookings] = useState<BookingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [studioName, setStudioName] = useState('Snapbook Studio');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Helper date YYYY-MM-DD
  const getLocalDate = (offsetDays = 0) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const today = getLocalDate(0);
  const tomorrow = getLocalDate(1);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchBookings = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter && statusFilter !== 'ALL') params.append('status', statusFilter);
      if (searchTerm.trim()) params.append('search', searchTerm.trim());

      let filterDateVal = '';
      if (dateFilter === 'TODAY') filterDateVal = today;
      else if (dateFilter === 'TOMORROW') filterDateVal = tomorrow;
      else if (dateFilter === 'CUSTOM' && customDate) filterDateVal = customDate;

      if (filterDateVal) {
        params.append('date', filterDateVal);
      }

      const res = await fetch(`/api/bookings?${params.toString()}`, {
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Gagal mengambil data booking');
      const data = await res.json();
      setBookings(data);
    } catch (e: any) {
      console.error(e);
      showToast(e.message || 'Gagal memuat reservasi');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [statusFilter, dateFilter, customDate]);

  useEffect(() => {
    fetch('/api/settings')
      .then((r) => r.json())
      .then((cfg) => {
        if (cfg?.studioName) setStudioName(cfg.studioName);
      })
      .catch(() => {});
  }, []);

  const handleUpdateStatus = async (bookingId: string, newStatus: BookingStatus) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Gagal mengupdate status');
      }

      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b))
      );
      showToast(`Status reservasi berhasil diubah ke: ${newStatus}`);
    } catch (err: any) {
      showToast(err.message || 'Gagal mengubah status');
    }
  };

  const handleDeleteBooking = async (bookingId: string) => {
    try {
      const res = await fetch(`/api/bookings/${bookingId}`, {
        method: 'DELETE',
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Gagal menghapus reservasi');
      }

      setBookings((prev) => prev.filter((b) => b.id !== bookingId));
      showToast('Data reservasi berhasil dihapus.');
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus reservasi');
    }
  };

  // Metrics for counters
  const stats = useMemo(() => {
    const total = bookings.length;
    const pending = bookings.filter((b) => b.status === 'PENDING').length;
    const confirmed = bookings.filter((b) => b.status === 'CONFIRMED').length;
    const completed = bookings.filter((b) => b.status === 'COMPLETED').length;
    const revenue = bookings
      .filter((b) => b.status === 'CONFIRMED' || b.status === 'COMPLETED')
      .reduce((sum, b) => sum + (b.totalPrice || 0), 0);

    return { total, pending, confirmed, completed, revenue };
  }, [bookings]);

  const statusTabs = [
    { key: 'ALL', label: 'Semua Booking' },
    { key: 'PENDING', label: 'Menunggu DP' },
    { key: 'CONFIRMED', label: 'Terkonfirmasi' },
    { key: 'COMPLETED', label: 'Selesai' },
    { key: 'CANCELLED', label: 'Dibatalkan' },
  ];

  return (
    <div className="space-y-6 max-w-7xl animate-studio-fade">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-neutral-900 border border-neutral-700 text-white text-xs sm:text-sm shadow-2xl flex items-center gap-3 animate-studio-fade">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-neutral-500 hover:text-white ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-normal text-white">Manajemen Reservasi</h1>
          <p className="text-xs text-neutral-400 mt-1 font-light">
            Pantau jadwal sesi foto studio, verifikasi DP, dan kirim pengingat WhatsApp.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchBookings} isLoading={isLoading}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            <span>Muat Ulang</span>
          </Button>
        </div>
      </div>

      {/* Metric Quick Counter Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => setStatusFilter('ALL')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'ALL'
              ? 'bg-neutral-800/80 border-neutral-500'
              : 'bg-[#101013] border-neutral-800 hover:border-neutral-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-mono text-neutral-400">Total Bookings</span>
            <span className="text-xs text-neutral-400">📋</span>
          </div>
          <p className="font-serif text-2xl text-white mt-1">{stats.total}</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('PENDING')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'PENDING'
              ? 'bg-amber-950/40 border-amber-600'
              : 'bg-[#101013] border-neutral-800 hover:border-neutral-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-mono text-amber-400">Menunggu DP</span>
            <Clock className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <p className="font-serif text-2xl text-amber-300 mt-1">{stats.pending}</p>
        </button>

        <button
          type="button"
          onClick={() => setStatusFilter('CONFIRMED')}
          className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
            statusFilter === 'CONFIRMED'
              ? 'bg-emerald-950/40 border-emerald-600'
              : 'bg-[#101013] border-neutral-800 hover:border-neutral-700'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-mono text-emerald-400">Terkonfirmasi</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <p className="font-serif text-2xl text-emerald-300 mt-1">{stats.confirmed}</p>
        </button>

        <div className="p-4 rounded-2xl border border-neutral-800 bg-[#101013] text-left">
          <div className="flex items-center justify-between">
            <span className="text-[10px] uppercase tracking-wider font-mono text-neutral-400">Total Nilai Sesi</span>
            <DollarSign className="w-3.5 h-3.5 text-white" />
          </div>
          <p className="font-serif text-xl sm:text-2xl text-white mt-1 truncate">{formatIDR(stats.revenue)}</p>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-[#101013] border border-neutral-800 rounded-3xl p-5 space-y-4 shadow-xl">
        {/* Row 1: Status Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-2 sm:pb-0">
            {statusTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3.5 py-1.5 rounded-full text-[11px] uppercase tracking-wider font-medium transition-all shrink-0 cursor-pointer ${
                  statusFilter === tab.key
                    ? 'bg-white text-black font-semibold shadow-md'
                    : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800 hover:border-neutral-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search Form */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              fetchBookings();
            }}
            className="relative min-w-[280px]"
          >
            <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cari kode booking, nama, WhatsApp..."
              className="w-full pl-9 pr-3.5 py-2.5 bg-[#0a0a0c] border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-600 focus:outline-none focus:border-neutral-400 transition-colors font-light"
            />
          </form>
        </div>

        {/* Row 2: Clean Date Filter Pills (NO raw native date picker popup) */}
        <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-neutral-800/80">
          <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 flex items-center gap-1.5 mr-1">
            <Calendar className="w-3.5 h-3.5" />
            <span>Filter Tanggal:</span>
          </span>

          <button
            type="button"
            onClick={() => {
              setDateFilter('ALL');
              setCustomDate('');
            }}
            className={`px-3.5 py-1 rounded-full text-[11px] uppercase font-mono tracking-wider transition-colors cursor-pointer ${
              dateFilter === 'ALL'
                ? 'bg-white text-black font-semibold'
                : 'bg-[#0a0a0c] text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            Semua
          </button>

          <button
            type="button"
            onClick={() => {
              setDateFilter('TODAY');
              setCustomDate('');
            }}
            className={`px-3.5 py-1 rounded-full text-[11px] uppercase font-mono tracking-wider transition-colors cursor-pointer ${
              dateFilter === 'TODAY'
                ? 'bg-white text-black font-semibold'
                : 'bg-[#0a0a0c] text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            Hari Ini
          </button>

          <button
            type="button"
            onClick={() => {
              setDateFilter('TOMORROW');
              setCustomDate('');
            }}
            className={`px-3.5 py-1 rounded-full text-[11px] uppercase font-mono tracking-wider transition-colors cursor-pointer ${
              dateFilter === 'TOMORROW'
                ? 'bg-white text-black font-semibold'
                : 'bg-[#0a0a0c] text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            Besok
          </button>

          {/* Custom Date Button using StudioCalendar */}
          <button
            type="button"
            onClick={() => setShowCalendarModal(!showCalendarModal)}
            className={`px-3 py-1 rounded-full text-[11px] uppercase font-mono tracking-wider transition-colors cursor-pointer flex items-center gap-1.5 ${
              dateFilter === 'CUSTOM' && customDate
                ? 'bg-white text-black font-semibold'
                : 'bg-[#0a0a0c] text-neutral-400 hover:text-white border border-neutral-800'
            }`}
          >
            <CalendarDays className="w-3.5 h-3.5" />
            <span>{customDate ? formatDateIndonesian(customDate) : 'Pilih Tanggal...'}</span>
          </button>

          {customDate && (
            <button
              type="button"
              onClick={() => {
                setCustomDate('');
                setDateFilter('ALL');
              }}
              className="text-[11px] text-neutral-400 hover:text-white font-mono cursor-pointer ml-1 underline"
            >
              Reset
            </button>
          )}
        </div>

        {/* Custom Studio Calendar Expander */}
        {showCalendarModal && (
          <div className="pt-3 max-w-sm border-t border-neutral-800 animate-studio-fade">
            <StudioCalendar
              selectedDate={customDate}
              onSelectDate={(date) => {
                setCustomDate(date);
                setDateFilter('CUSTOM');
                setShowCalendarModal(false);
              }}
            />
          </div>
        )}
      </div>

      {/* Bookings Table */}
      {isLoading ? (
        <div className="p-16 text-center text-xs text-neutral-400 bg-[#101013] rounded-3xl border border-neutral-800 font-light flex flex-col items-center justify-center gap-3">
          <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Memuat data reservasi...</span>
        </div>
      ) : (
        <BookingTable
          bookings={bookings}
          onUpdateStatus={handleUpdateStatus}
          onDeleteBooking={handleDeleteBooking}
          studioName={studioName}
        />
      )}
    </div>
  );
}

export default function AdminBookingsPage() {
  return (
    <Suspense fallback={<div className="p-8 text-neutral-400 text-xs font-mono">MEMUAT DATA RESERVASI...</div>}>
      <BookingsContent />
    </Suspense>
  );
}
