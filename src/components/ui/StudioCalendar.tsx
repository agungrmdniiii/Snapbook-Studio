'use client';

import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface StudioCalendarProps {
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  minDate?: string; // YYYY-MM-DD
}

export const StudioCalendar: React.FC<StudioCalendarProps> = ({
  selectedDate,
  onSelectDate,
  minDate,
}) => {
  // Parse initial year and month from selectedDate or today
  const initialDate = useMemo(() => {
    if (selectedDate && selectedDate.includes('-')) {
      const [y, m, d] = selectedDate.split('-').map(Number);
      return new Date(y, m - 1, d);
    }
    return new Date();
  }, [selectedDate]);

  const [viewDate, setViewDate] = useState<Date>(
    new Date(initialDate.getFullYear(), initialDate.getMonth(), 1)
  );

  const viewYear = viewDate.getFullYear();
  const viewMonth = viewDate.getMonth();

  const monthNamesIndonesian = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const dayHeaders = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

  // Helper date YYYY-MM-DD
  const formatYMD = (year: number, month: number, day: number) => {
    const m = String(month + 1).padStart(2, '0');
    const d = String(day).padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  const todayStr = useMemo(() => {
    const d = new Date();
    return formatYMD(d.getFullYear(), d.getMonth(), d.getDate());
  }, []);

  const effectiveMinDate = minDate || todayStr;

  // Calendar cells computation
  const calendarCells = useMemo(() => {
    const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 = Sun
    const totalDaysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

    const cells = [];

    // 1. Previous month trailing days
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const d = prevMonthDays - i;
      const prevMonth = viewMonth === 0 ? 11 : viewMonth - 1;
      const prevYear = viewMonth === 0 ? viewYear - 1 : viewYear;
      const dateStr = formatYMD(prevYear, prevMonth, d);

      cells.push({
        day: d,
        dateStr,
        isCurrentMonth: false,
        isDisabled: true,
      });
    }

    // 2. Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      const dateStr = formatYMD(viewYear, viewMonth, d);
      const isPast = dateStr < effectiveMinDate;

      cells.push({
        day: d,
        dateStr,
        isCurrentMonth: true,
        isDisabled: isPast,
      });
    }

    // 3. Next month leading days (to complete grid to 35 or 42)
    const remainingSlots = 42 - cells.length;
    // If only 35 is needed and remaining > 7, clamp to 35
    const totalTarget = cells.length <= 35 ? 35 : 42;
    const slotsToAdd = totalTarget - cells.length;

    for (let d = 1; d <= slotsToAdd; d++) {
      const nextMonth = viewMonth === 11 ? 0 : viewMonth + 1;
      const nextYear = viewMonth === 11 ? viewYear + 1 : viewYear;
      const dateStr = formatYMD(nextYear, nextMonth, d);

      cells.push({
        day: d,
        dateStr,
        isCurrentMonth: false,
        isDisabled: true,
      });
    }

    return cells;
  }, [viewYear, viewMonth, effectiveMinDate]);

  const handlePrevMonth = () => {
    setViewDate(new Date(viewYear, viewMonth - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewYear, viewMonth + 1, 1));
  };

  const handleTodayJump = () => {
    const now = new Date();
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
    onSelectDate(todayStr);
  };

  // Check if prev month should be disabled
  const isPrevDisabled = useMemo(() => {
    const [minY, minM] = effectiveMinDate.split('-').map(Number);
    const minMonthIndex = minM - 1;
    return viewYear < minY || (viewYear === minY && viewMonth <= minMonthIndex);
  }, [viewYear, viewMonth, effectiveMinDate]);

  return (
    <div className="w-full bg-[#0a0a0c] border border-neutral-800/90 rounded-3xl p-5 sm:p-6 shadow-2xl select-none animate-studio-fade">
      {/* Month & Year Navigation Header */}
      <div className="flex items-center justify-between pb-4 border-b border-neutral-800/80 mb-4">
        <div className="flex items-baseline gap-2">
          <h3 className="font-serif text-xl sm:text-2xl font-normal text-white tracking-wide">
            {monthNamesIndonesian[viewMonth]}
          </h3>
          <span className="text-xs sm:text-sm font-mono text-neutral-400">
            {viewYear}
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={handleTodayJump}
            className="px-2.5 py-1 rounded-full text-[10px] font-mono uppercase tracking-wider text-neutral-400 hover:text-white bg-neutral-900 border border-neutral-800 hover:border-neutral-700 transition-colors mr-1 cursor-pointer"
          >
            Hari Ini
          </button>

          <button
            type="button"
            onClick={handlePrevMonth}
            disabled={isPrevDisabled}
            className={`p-1.5 rounded-full border transition-colors cursor-pointer ${
              isPrevDisabled
                ? 'border-neutral-900 text-neutral-700 cursor-not-allowed opacity-30'
                : 'border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800'
            }`}
            aria-label="Bulan sebelumnya"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={handleNextMonth}
            className="p-1.5 rounded-full border border-neutral-800 text-neutral-300 hover:text-white hover:bg-neutral-800 transition-colors cursor-pointer"
            aria-label="Bulan berikutnya"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Weekday Header */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {dayHeaders.map((dh, idx) => (
          <div
            key={dh}
            className={`py-1.5 text-[11px] font-mono uppercase tracking-widest font-semibold ${
              idx === 0 || idx === 6 ? 'text-neutral-500' : 'text-neutral-400'
            }`}
          >
            {dh}
          </div>
        ))}
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {calendarCells.map((cell, idx) => {
          const isSelected = selectedDate === cell.dateStr;
          const isToday = todayStr === cell.dateStr;

          if (!cell.isCurrentMonth) {
            return (
              <div
                key={idx}
                className="aspect-square flex items-center justify-center rounded-2xl text-xs font-mono text-neutral-700/40 opacity-40 select-none"
              >
                {cell.day}
              </div>
            );
          }

          if (cell.isDisabled) {
            return (
              <div
                key={idx}
                className="aspect-square flex items-center justify-center rounded-2xl text-xs font-mono text-neutral-700/50 cursor-not-allowed select-none"
              >
                {cell.day}
              </div>
            );
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectDate(cell.dateStr)}
              className={`aspect-square relative flex flex-col items-center justify-center rounded-2xl text-sm font-medium transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-white active:scale-95 ${
                isSelected
                  ? 'bg-white text-black font-bold shadow-lg shadow-white/10 ring-2 ring-white scale-105 z-10'
                  : 'text-neutral-200 hover:bg-neutral-800/80 hover:text-white bg-neutral-900/40 border border-neutral-800/50'
              }`}
            >
              <span className="font-serif text-base leading-none">{cell.day}</span>
              {isToday && (
                <span
                  className={`w-1 h-1 rounded-full mt-1 ${
                    isSelected ? 'bg-black' : 'bg-amber-400'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
