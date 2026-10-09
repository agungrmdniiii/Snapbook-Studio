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
        <h2 className="font-serif text-2xl sm:text-3xl font-normal text-stone-100">
          02. Jadwal Sesi & Alokasi Waktu
        </h2>
        <p className="text-xs sm:text-sm text-stone-400 font-light">
          Sistem otomatis mengamankan privasi penuh dan mencegah bentrok jadwal dengan klien lain.
        </p>
      </div>

      {/* Date Picker Input */}
      <div className="bg-[#12100f] border border-stone-800 rounded-2xl p-6 sm:p-7 space-y-3.5">
        <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-amber-400">
          <Calendar className="w-4 h-4" />
          <span>Tanggal Kedatangan Atelier</span>
        </label>
        <input
          type="date"
          min={today}
          value={selectedDate}
          onChange={(e) => {
            onSelectDate(e.target.value);
            onSelectTime(''); // reset time slot on date change
          }}
          className="w-full px-4 py-3 bg-[#0c0a09] border border-stone-800 rounded-xl text-stone-100 font-medium text-sm focus:outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400 transition-all cursor-pointer"
        />
        {selectedDate && (
          <p className="text-xs text-stone-400 font-light pt-1">
            Jadwal dipilih:{' '}
            <span className="font-serif text-sm font-normal text-amber-300">
              {formatDateIndonesian(selectedDate)}
            </span>
          </p>
        )}
      </div>

      {/* Time Slot Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-stone-300">
            <Clock className="w-4 h-4 text-amber-400" />
            <span>Alokasi Jam Sesi (WIB)</span>
          </label>
          <span className="text-[11px] font-mono text-stone-400">INTERVAL: 60 MENIT</span>
        </div>

        {isLoadingSlots ? (
          <div className="flex items-center justify-center p-12 bg-[#12100f]/60 rounded-2xl border border-stone-850">
            <div className="flex items-center gap-3 text-xs text-stone-400">
              <svg className="animate-spin h-5 w-5 text-amber-400" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>Memverifikasi ketersediaan slot atelier...</span>
            </div>
          </div>
        ) : error ? (
          <div className="p-4 bg-rose-950/40 border border-rose-900/60 rounded-xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : slots.length === 0 ? (
          <div className="p-8 text-center bg-[#12100f]/60 rounded-2xl border border-stone-850 text-xs text-stone-400 font-light">
            Silakan tentukan tanggal pemotretan terlebih dahulu untuk melihat ketersediaan jam.
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
                      ? 'bg-stone-950/40 border-stone-900 text-stone-650 cursor-not-allowed opacity-40'
                      : isSelected
                      ? 'bg-amber-400 border-amber-400 text-stone-950 font-bold shadow-lg shadow-amber-400/20'
                      : 'bg-[#12100f] border-stone-800 text-stone-200 hover:border-stone-700 hover:bg-stone-900'
                  }`}
                >
                  <span className="text-sm font-semibold tracking-wide">{slot.time}</span>
                  <span className="text-[10px] uppercase tracking-wider font-sans">
                    {slot.available ? (isSelected ? '✓ Terpilih' : 'Tersedia') : 'Terisi'}
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
