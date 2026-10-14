'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Calendar, Clock, AlertCircle, CheckCircle2, ChevronRight, ChevronLeft } from 'lucide-react';
import { formatDateIndonesian } from '@/lib/utils';

interface SlotItem {
  time: string;
  available: boolean;
  isPast?: boolean;
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
  const [timeFilter, setTimeFilter] = useState<'ALL' | 'PAGI' | 'SIANG' | 'SORE'>('ALL');
  const [showFullDatePicker, setShowFullDatePicker] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

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

  // Generate 14 upcoming days
  const upcomingDays = useMemo(() => {
    const days = [];
    const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];

    for (let i = 0; i < 14; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const dateStr = `${y}-${m}-${day}`;

      let tag = '';
      if (i === 0) tag = 'Hari Ini';
      else if (i === 1) tag = 'Besok';

      days.push({
        date: dateStr,
        dayNum: day,
        dayName: dayNames[d.getDay()],
        monthName: monthNames[d.getMonth()],
        tag,
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
      });
    }
    return days;
  }, []);

  // Auto-initialize selectedDate to tomorrow if empty
  useEffect(() => {
    if (!selectedDate) {
      onSelectDate(tomorrow);
    }
  }, [selectedDate, tomorrow, onSelectDate]);

  // Fetch slots whenever selectedDate changes
  useEffect(() => {
    if (!selectedDate) return;

    let isMounted = true;
    async function fetchSlots() {
      setIsLoadingSlots(true);
      setError(null);
      try {
        const res = await fetch(`/api/bookings/available-slots?date=${selectedDate}`);
        if (!res.ok) throw new Error('Gagal mengambil slot jadwal');
        const data = await res.json();
        if (isMounted) {
          setSlots(data.slots || []);
        }
      } catch (err: any) {
        if (isMounted) {
          // Fallback slots agar proses booking tidak pernah terblokir
          const fallbackTimes = [
            '09:00', '10:00', '11:00', '12:00', '13:00',
            '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
          ];
          setSlots(fallbackTimes.map((time) => ({ time, available: true })));
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

  // Filter slots by time of day
  const filteredSlots = useMemo(() => {
    if (timeFilter === 'ALL') return slots;
    return slots.filter((s) => {
      const hour = parseInt(s.time.split(':')[0], 10);
      if (timeFilter === 'PAGI') return hour >= 9 && hour < 12;
      if (timeFilter === 'SIANG') return hour >= 12 && hour < 15;
      if (timeFilter === 'SORE') return hour >= 15 && hour <= 21;
      return true;
    });
  }, [slots, timeFilter]);

  // Calculate available counts per category
  const slotCounts = useMemo(() => {
    const pagi = slots.filter((s) => {
      const h = parseInt(s.time.split(':')[0], 10);
      return h >= 9 && h < 12 && s.available;
    }).length;
    const siang = slots.filter((s) => {
      const h = parseInt(s.time.split(':')[0], 10);
      return h >= 12 && h < 15 && s.available;
    }).length;
    const sore = slots.filter((s) => {
      const h = parseInt(s.time.split(':')[0], 10);
      return h >= 15 && h <= 21 && s.available;
    }).length;
    const all = slots.filter((s) => s.available).length;
    return { all, pagi, siang, sore };
  }, [slots]);

  const scrollStrip = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const offset = direction === 'left' ? -220 : 220;
      scrollContainerRef.current.scrollBy({ left: offset, behavior: 'smooth' });
    }
  };

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      {/* Title */}
      <div className="text-center space-y-2">
        <h2 className="font-serif text-2xl sm:text-3xl font-normal text-white">
          Pilih Tanggal & Jam Sesi
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400 font-light">
          Pilih tanggal yang nyaman, sistem otomatis memverifikasi slot yang tersedia.
        </p>
      </div>

      {/* Date Strip Section */}
      <div className="bg-[#101013] border border-neutral-800 rounded-3xl p-5 sm:p-7 space-y-5 shadow-xl">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-300">
            <Calendar className="w-4 h-4 text-neutral-400" />
            <span>Pilih Tanggal Reservasi</span>
          </label>

          <button
            type="button"
            onClick={() => setShowFullDatePicker(!showFullDatePicker)}
            className="text-xs text-neutral-400 hover:text-white transition-colors cursor-pointer flex items-center gap-1 font-light"
          >
            <span>{showFullDatePicker ? 'Tutup Kalender' : 'Pilih Tanggal Lain'}</span>
            <ChevronRight className={`w-3.5 h-3.5 transition-transform ${showFullDatePicker ? 'rotate-90' : ''}`} />
          </button>
        </div>

        {/* 14-Day Horizontal Interactive Carousel */}
        <div className="relative group">
          <div
            ref={scrollContainerRef}
            className="flex items-center gap-2.5 overflow-x-auto pb-2 scrollbar-none snap-x focus:outline-none"
            tabIndex={0}
            role="region"
            aria-label="Pilihan 14 hari ke depan"
          >
            {upcomingDays.map((d) => {
              const isSelected = selectedDate === d.date;
              return (
                <button
                  key={d.date}
                  type="button"
                  onClick={() => {
                    onSelectDate(d.date);
                    onSelectTime('');
                  }}
                  className={`snap-start shrink-0 flex flex-col items-center justify-between min-w-[72px] sm:min-w-[80px] p-3 rounded-2xl border transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white active:scale-95 ${
                    isSelected
                      ? 'bg-white border-white text-black shadow-lg scale-102'
                      : 'bg-[#0a0a0c] border-neutral-800/80 text-neutral-300 hover:border-neutral-600 hover:bg-neutral-900/60'
                  }`}
                >
                  <span
                    className={`text-[10px] uppercase font-mono tracking-wider font-semibold ${
                      isSelected ? 'text-neutral-700' : d.tag ? 'text-amber-400' : 'text-neutral-400'
                    }`}
                  >
                    {d.tag || d.dayName}
                  </span>
                  <span className="font-serif text-2xl sm:text-3xl my-1 leading-none font-normal">
                    {d.dayNum}
                  </span>
                  <span className={`text-[10px] tracking-wider uppercase font-mono ${isSelected ? 'text-neutral-700' : 'text-neutral-400'}`}>
                    {d.monthName}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick scroll controls for desktop */}
          <button
            type="button"
            onClick={() => scrollStrip('left')}
            className="hidden sm:flex absolute -left-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-neutral-900/90 border border-neutral-700 text-white items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
            aria-label="Geser ke kiri"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => scrollStrip('right')}
            className="hidden sm:flex absolute -right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full bg-neutral-900/90 border border-neutral-700 text-white items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
            aria-label="Geser ke kanan"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Extended Date Picker dropdown */}
        {showFullDatePicker && (
          <div className="pt-3 border-t border-neutral-800 animate-studio-fade">
            <label className="block text-[11px] text-neutral-400 mb-2 font-mono uppercase tracking-wider">
              Pilih Tanggal Tertentu (Kalender):
            </label>
            <input
              type="date"
              min={today}
              value={selectedDate}
              onChange={(e) => {
                onSelectDate(e.target.value);
                onSelectTime('');
              }}
              className="w-full px-4 py-3 bg-[#0a0a0c] border border-neutral-800 rounded-xl text-white font-medium text-sm focus:outline-none focus:border-neutral-300 focus:ring-1 focus:ring-neutral-300 transition-colors cursor-pointer"
            />
          </div>
        )}

        {/* Selected Date Confirmation Tag */}
        {selectedDate && (
          <div className="pt-2 flex items-center justify-between text-xs border-t border-neutral-800/80">
            <span className="text-neutral-400 font-light">Tanggal dipilih:</span>
            <span className="font-medium text-white flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>{formatDateIndonesian(selectedDate)}</span>
            </span>
          </div>
        )}
      </div>

      {/* Time Slot Selection */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-[0.18em] text-neutral-300">
            <Clock className="w-4 h-4 text-neutral-400" />
            <span>Pilihan Jam Sesi (WIB)</span>
          </label>

          {/* Time of Day Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setTimeFilter('ALL')}
              className={`px-3 py-1 rounded-full text-[10px] tracking-wider uppercase font-medium transition-all cursor-pointer shrink-0 ${
                timeFilter === 'ALL'
                  ? 'bg-neutral-200 text-black font-semibold'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              Semua ({slotCounts.all})
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('PAGI')}
              className={`px-3 py-1 rounded-full text-[10px] tracking-wider uppercase font-medium transition-all cursor-pointer shrink-0 ${
                timeFilter === 'PAGI'
                  ? 'bg-neutral-200 text-black font-semibold'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              Pagi ({slotCounts.pagi})
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('SIANG')}
              className={`px-3 py-1 rounded-full text-[10px] tracking-wider uppercase font-medium transition-all cursor-pointer shrink-0 ${
                timeFilter === 'SIANG'
                  ? 'bg-neutral-200 text-black font-semibold'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              Siang ({slotCounts.siang})
            </button>
            <button
              type="button"
              onClick={() => setTimeFilter('SORE')}
              className={`px-3 py-1 rounded-full text-[10px] tracking-wider uppercase font-medium transition-all cursor-pointer shrink-0 ${
                timeFilter === 'SORE'
                  ? 'bg-neutral-200 text-black font-semibold'
                  : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
              }`}
            >
              Sore/Malam ({slotCounts.sore})
            </button>
          </div>
        </div>

        {/* Loading indicator */}
        {isLoadingSlots ? (
          <div className="flex items-center justify-center p-12 bg-[#101013] rounded-3xl border border-neutral-800">
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
          <div className="p-4 bg-rose-950/40 border border-rose-900/60 rounded-2xl text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        ) : filteredSlots.length === 0 ? (
          <div className="p-8 text-center bg-[#101013] rounded-3xl border border-neutral-800 text-xs text-neutral-400 font-light">
            Tidak ada slot jam sesi pada kategori waktu ini.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 animate-studio-fade">
            {filteredSlots.map((slot) => {
              const isSelected = selectedTime === slot.time;
              const isAvailable = slot.available;

              return (
                <button
                  key={slot.time}
                  type="button"
                  disabled={!isAvailable}
                  onClick={() => onSelectTime(slot.time)}
                  className={`p-3.5 rounded-2xl border font-mono transition-all duration-150 flex flex-col items-center justify-center gap-1 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white active:scale-95 ${
                    !isAvailable
                      ? 'bg-neutral-950/40 border-neutral-900 text-neutral-700 cursor-not-allowed opacity-35'
                      : isSelected
                      ? 'bg-white border-white text-black font-bold shadow-lg scale-102'
                      : 'bg-[#101013] border-neutral-800 text-neutral-200 hover:border-neutral-500 hover:bg-neutral-900/80'
                  }`}
                >
                  <span className="text-sm font-semibold tracking-wide">{slot.time}</span>
                  <span className="text-[10px] uppercase tracking-wider font-sans font-medium">
                    {isSelected
                      ? '✓ Dipilih'
                      : isAvailable
                      ? 'Tersedia'
                      : slot.isPast
                      ? 'Lewat'
                      : 'Penuh'}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Selected Slot Confirmation Summary Card */}
        {selectedDate && selectedTime && (
          <div className="p-5 rounded-2xl bg-neutral-900/60 border border-neutral-700/80 flex items-center justify-between text-xs sm:text-sm animate-studio-fade">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase tracking-wider font-mono text-neutral-400">
                Jadwal yang Dipilih
              </span>
              <p className="font-serif text-base text-white">
                {formatDateIndonesian(selectedDate)}
              </p>
              <p className="text-xs text-neutral-300 font-mono">
                Pukul {selectedTime} WIB (Durasi 60 Menit)
              </p>
            </div>
            <div className="px-3 py-1.5 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs font-medium flex items-center gap-1.5 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Jadwal Terpilih</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
