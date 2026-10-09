import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatIDR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return 'Rp 0';
  return 'Rp ' + Math.round(amount).toLocaleString('id-ID');
}

export function generateTimeSlots(
  openingTime: string = '09:00',
  closingTime: string = '20:00',
  durationMinutes: number = 60
): string[] {
  const slots: string[] = [];
  const [startHour, startMin] = openingTime.split(':').map(Number);
  const [endHour, endMin] = closingTime.split(':').map(Number);

  let currentMinutes = startHour * 60 + startMin;
  const closingMinutes = endHour * 60 + endMin;

  while (currentMinutes + durationMinutes <= closingMinutes) {
    const hours = Math.floor(currentMinutes / 60);
    const mins = currentMinutes % 60;
    const formatted = `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
    slots.push(formatted);
    currentMinutes += durationMinutes;
  }

  return slots;
}

export function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hour, min] = startTime.split(':').map(Number);
  const totalMins = hour * 60 + min + durationMinutes;
  const endH = Math.floor(totalMins / 60);
  const endM = totalMins % 60;
  return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
}

export function formatDateIndonesian(dateString: string): string {
  try {
    const [year, month, day] = dateString.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${days[date.getDay()]}, ${day} ${months[month - 1]} ${year}`;
  } catch {
    return dateString;
  }
}
