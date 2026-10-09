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
      <div className="text-center space-y-2">
        <h2 className="font-serif text-2xl sm:text-3xl font-normal text-white">
          Pilih Tanggal & Jam Sesi
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400 font-light">
          Sistem otomatis mencegah bentrok jadwal dengan pelanggan lain.
        </p>
      </div>

      {/* Date Picker Input */}
      <div className="bg-[#101013] border border-neutral-800 rounded-2xl p-6 sm:p-7 space-y-3.5">
        <label className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-300">
          <Calendar className="w-4 h-4 text-neutral-400" />
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
          className="w-full px-4 py-3 bg-[#0a0a0c] border border-neutral-800 rounded-xl text-white font-medium text-sm focus:outline-none focus:border-neutral-400 focus:ring-1 focus:ring-neutral-400 transition-colors cursor-pointer"
        />
        {selectedDate && (
          <p className="text-xs text-neutral-400 font-light pt-1">
            Tanggal dipilih:{' '}
            <span className="font-medium text-white">
              {formatDateIndonesian(selectedDate)}
            </span>
          </p>
        )}
      </div>

      {/* Time Slot Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-300">
            <Clock className="w-4 h-4 text-neutral-400" />
            <span>Pilihan Jam Sesi (WIB)</span>
          </label>
          <span className="text-[11px] font-mono text-neutral-400">Durasi slot: 60 Menit</span>
        </div>

        {isLoadingSlots ? (
          <div className="flex items-center justify-center p-12 bg-[#101013] rounded-2xl border border-neutral-800">
            <div className="flex items-center gap-3 text-xs text-neutral-400 font-light">
              <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Memeriksa ketersediaan jadwal...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-950/40 border border-rose-900/60 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : slots.length === 0 ? (
          <div className="p-8 text-center bg-[#101013] rounded-2xl border border-neutral-800 text-xs text-neutral-400 font-light">
            Silakan pilih tanggal terlebih dahulu untuk melihat ketersediaan jam.
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
                  className={`p-3.5 rounded-xl border font-mono transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
                    !slot.available
                      ? 'bg-neutral-950/40 border-neutral-900 text-neutral-700 cursor-not-allowed opacity-30'
                      : isSelected
                      ? 'bg-white border-white text-black font-bold shadow-lg'
                      : 'bg-[#101013] border-neutral-800 text-neutral-200 hover:border-neutral-600 hover:bg-neutral-900'
                  }`}
                >
                  <span className="text-sm font-medium tracking-wide">{slot.time}</span>
                  <span className="text-[10px] uppercase tracking-wider font-sans">
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
