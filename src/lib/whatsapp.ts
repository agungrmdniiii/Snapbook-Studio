import { formatIDR, formatDateIndonesian } from './utils';

export interface BookingWhatsAppInfo {
  bookingCode: string;
  clientName: string;
  packageName: string;
  packagePrice: number;
  date: string;
  startTime: string;
  endTime: string;
  addOns?: string[];
  totalPrice: number;
  notes?: string;
}

export function sanitizeWhatsAppNumber(phone: string): string {
  let clean = phone.replace(/\D/g, '');
  if (clean.startsWith('0')) {
    clean = '62' + clean.slice(1);
  }
  return clean;
}

export function generateBookingWhatsAppUrl(
  studioPhone: string,
  booking: BookingWhatsAppInfo
): string {
  const targetPhone = sanitizeWhatsAppNumber(studioPhone);
  const formattedDate = formatDateIndonesian(booking.date);

  const addOnText =
    booking.addOns && booking.addOns.length > 0
      ? `\n➕ *Add-ons:* ${booking.addOns.join(', ')}`
      : '';

  const notesText = booking.notes ? `\n📝 *Catatan:* ${booking.notes}` : '';

  const message = `Halo Snapbook Studio, saya ingin konfirmasi booking foto:
📋 *Kode Booking:* ${booking.bookingCode}
👤 *Nama:* ${booking.clientName}
📦 *Paket:* ${booking.packageName} (${formatIDR(booking.packagePrice)})
🗓 *Tanggal:* ${formattedDate}
⏰ *Jam:* ${booking.startTime} - ${booking.endTime} WIB${addOnText}
💰 *Total Biaya:* ${formatIDR(booking.totalPrice)}${notesText}

Mohon info ketersediaan dan nomor rekening untuk pembayaran DP. Terima kasih!`;

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
}

export function generateReminderWhatsAppUrl(
  clientPhone: string,
  booking: BookingWhatsAppInfo,
  studioName: string = 'Snapbook Studio'
): string {
  const targetPhone = sanitizeWhatsAppNumber(clientPhone);
  const formattedDate = formatDateIndonesian(booking.date);

  const message = `Halo Kak ${booking.clientName}, kami dari *${studioName}*! 👋

Mengingatkan kembali jadwal sesi foto Anda:
📋 *Kode Booking:* ${booking.bookingCode}
📦 *Paket:* ${booking.packageName}
🗓 *Tanggal:* ${formattedDate}
⏰ *Waktu:* ${booking.startTime} - ${booking.endTime} WIB

⚠️ *Pengingat Kedatangan:*
Mohon hadir *10-15 menit lebih awal* sebelum sesi dimulai untuk persiapan riasan dan kostum agar durasi foto Anda maksimal.

Sampai jumpa di studio! ✨`;

  return `https://wa.me/${targetPhone}?text=${encodeURIComponent(message)}`;
}
