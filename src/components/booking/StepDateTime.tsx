'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Clock, AlertCircle } from 'lucide-react';
import { formatDateIndonesian } from '@/lib/utils';

interface SlotItem {
  time: string;
  available: boolean;
}

interface StepDateTimeProps {
  selectedDate: string;
  selectedTime: string;
  onSelectDate: (date: string) => void;
  onSelectTime: (time: string) => void;
}

export const StepDateTime: React.FC<StepDateTimeProps> = ({
  selectedDate,
  selectedTime,
  onSelectDate,
  onSelectTime,
}) => {
  const [slots, setSlots] = useState<SlotItem[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Today in YYYY-MM-DD
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!selectedDate) return;

    let isMounted = true;
    async function fetchSlots() {
      setIsLoadingSlots(true);
      setError(null);
      try {
        const res = await fetch(`/api/bookings/available-slots?date=${selectedDate}`);
        if (!res.ok) throw new Error('Gagal mengambil slot');
        const data = await res.json();
        if (isMounted) {
          setSlots(data.slots || []);
        }
      } catch (err) {
        if (isMounted) {
          setError('Terjadi kendala saat memuat slot jam. Silakan coba lagi.');
        }
      } finally {
        if (isMounted) setIsLoadingSlots(false);
      }
    }

    fetchSlots();
    return () => {
      isMounted = false;
    };
  }, [selectedDate]);

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center space-y-1.5">
        <h2 className="text-xl sm:text-2xl font-bold text-white">2. Pilih Tanggal & Jam Sesi</h2>
        <p className="text-xs sm:text-sm text-zinc-400">
          Sistem otomatis mencegah bentrok jadwal dengan pelanggan lain.
        </p>
      </div>

      {/* Date Picker Input */}
      <div className="bg-zinc-900/80 border border-zinc-800 rounded-2xl p-6 space-y-3">
        <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-amber-400">
          <Calendar className="w-4 h-4" />
          <span>Tanggal Kedatangan</span>
        </label>
        <input
          type="date"
          min={today}
          value={selectedDate}
          onChange={(e) => {
            onSelectDate(e.target.value);
            onSelectTime(''); // reset time slot on date change
          }}
          className="w-full px-4 py-3 bg-zinc-950 border border-zinc-800 rounded-xl text-white font-medium text-sm focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all cursor-pointer"
        />
        {selectedDate && (
          <p className="text-xs text-zinc-400">
            Jadwal dipilih:{' '}
            <span className="font-semibold text-zinc-200">
              {formatDateIndonesian(selectedDate)}
            </span>
          </p>
        )}
      </div>

      {/* Time Slot Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-300">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Slot Jam Sesi (WIB)</span>
          </label>
          <span className="text-[11px] text-zinc-500">Durasi slot: 60 Menit</span>
        </div>

        {isLoadingSlots ? (
          <div className="flex items-center justify-center p-12 bg-zinc-900/40 rounded-2xl border border-zinc-850">
            <div className="flex items-center gap-2 text-sm text-zinc-400">
              <svg className="animate-spin h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Memeriksa ketersediaan jam...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-950/40 border border-rose-900/80 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : slots.length === 0 ? (
          <div className="p-8 text-center bg-zinc-900/40 rounded-2xl border border-zinc-850 text-xs text-zinc-400">
            Silakan tentukan tanggal terlebih dahulu untuk melihat ketersediaan jam.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {slots.map((slot) => {
              const isSelected = selectedTime === slot.time;
              return (
                <button
                  key={slot.time}
                  type="button"
                  disabled={!slot.available}
                  onClick={() => onSelectTime(slot.time)}
                  className={`p-3.5 rounded-xl border font-semibold text-sm transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    !slot.available
                      ? 'bg-zinc-950/60 border-zinc-900 text-zinc-600 cursor-not-allowed opacity-50'
                      : isSelected
                      ? 'bg-amber-500 border-amber-500 text-zinc-950 shadow-lg shadow-amber-500/20'
                      : 'bg-zinc-900/80 border-zinc-800 text-zinc-200 hover:border-zinc-700 hover:bg-zinc-800'
                  }`}
                >
                  <span className="text-base">{slot.time}</span>
                  <span className="text-[10px] font-normal uppercase tracking-wider">
                    {slot.available ? (isSelected ? '✓ Dipilih' : 'Tersedia') : 'Penuh'}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
