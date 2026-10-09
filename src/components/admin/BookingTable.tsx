'use client';

import React from 'react';
import { MessageSquare, Bell } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { BookingData, BookingStatus } from '@/types';
import { formatIDR, formatDateIndonesian } from '@/lib/utils';
import { generateReminderWhatsAppUrl, sanitizeWhatsAppNumber } from '@/lib/whatsapp';

interface BookingTableProps {
  bookings: BookingData[];
  onUpdateStatus: (bookingId: string, status: BookingStatus) => Promise<void>;
  studioName?: string;
}

export const BookingTable: React.FC<BookingTableProps> = ({
  bookings,
  onUpdateStatus,
  studioName = 'Snapbook Studio',
}) => {
  const getBadgeVariant = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'success';
      case 'COMPLETED':
        return 'info';
      case 'CANCELLED':
        return 'danger';
      case 'PENDING':
      default:
        return 'warning';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'Terkonfirmasi';
      case 'COMPLETED':
        return 'Selesai';
      case 'CANCELLED':
        return 'Dibatalkan';
      case 'PENDING':
      default:
        return 'Menunggu DP';
    }
  };

  return (
    <div className="overflow-x-auto rounded-2xl border border-neutral-800 bg-[#101013] shadow-xl">
      <table className="w-full text-left text-sm">
        <thead className="bg-[#0a0a0c] text-neutral-400 text-[10px] uppercase tracking-[0.18em] border-b border-neutral-800 font-mono">
          <tr>
            <th className="px-5 py-4 font-medium">Kode & Jadwal</th>
            <th className="px-5 py-4 font-medium">Data Pemesan</th>
            <th className="px-5 py-4 font-medium">Paket & Biaya</th>
            <th className="px-5 py-4 font-medium">Status</th>
            <th className="px-5 py-4 font-medium text-right">Aksi WhatsApp</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-800 text-neutral-300">
          {bookings.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-5 py-12 text-center text-neutral-500 text-xs font-light">
                Tidak ada data reservasi yang sesuai kriteria.
              </td>
            </tr>
          ) : (
            bookings.map((item) => {
              const reminderUrl = generateReminderWhatsAppUrl(
                item.clientPhone,
                {
                  bookingCode: item.bookingCode,
                  clientName: item.clientName,
                  packageName: item.package?.name || '',
                  packagePrice: item.package?.price || 0,
                  date: item.date,
                  startTime: item.startTime,
                  endTime: item.endTime,
                  totalPrice: item.totalPrice,
                },
                studioName
              );

              const chatClientUrl = `https://wa.me/${sanitizeWhatsAppNumber(
                item.clientPhone
              )}?text=${encodeURIComponent(
                `Halo Kak ${item.clientName}, kami dari ${studioName} terkait reservasi sesi foto dengan Kode ${item.bookingCode}...`
              )}`;

              return (
                <tr key={item.id} className="hover:bg-neutral-900/40 transition-colors">
                  {/* Col 1 */}
                  <td className="px-5 py-4 align-top">
                    <span className="font-mono font-medium text-white text-xs block tracking-wide">
                      {item.bookingCode}
                    </span>
                    <span className="text-xs text-neutral-400 mt-0.5 block">
                      {formatDateIndonesian(item.date)}
                    </span>
                    <span className="text-[11px] font-mono text-neutral-400 block mt-0.5">
                      {item.startTime} – {item.endTime} WIB
                    </span>
                  </td>

                  {/* Col 2 */}
                  <td className="px-5 py-4 align-top">
                    <span className="font-medium text-white block">{item.clientName}</span>
                    <span className="text-xs text-neutral-400 block font-mono">{item.clientPhone}</span>
                    {item.clientEmail && (
                      <span className="text-[11px] text-neutral-400 block truncate max-w-[180px] font-light">
                        {item.clientEmail}
                      </span>
                    )}
                    {item.notes && (
                      <p className="text-[11px] text-neutral-400 italic mt-1.5 bg-[#0a0a0c] p-2 rounded-lg border border-neutral-800 font-light">
                        "{item.notes}"
                      </p>
                    )}
                  </td>

                  {/* Col 3 */}
                  <td className="px-5 py-4 align-top">
                    <span className="text-sm text-white block">{item.package?.name}</span>
                    {item.addOns && item.addOns.length > 0 && (
                      <span className="text-[11px] text-neutral-400 block mt-0.5 font-light">
                        +{item.addOns.map((a) => a.addOn.name).join(', ')}
                      </span>
                    )}
                    <span className="text-xs font-serif text-white block mt-1">
                      {formatIDR(item.totalPrice)}
                    </span>
                  </td>

                  {/* Col 4 */}
                  <td className="px-5 py-4 align-top">
                    <div className="space-y-2">
                      <Badge variant={getBadgeVariant(item.status) as any}>
                        {getStatusLabel(item.status)}
                      </Badge>

                      <div>
                        <select
                          value={item.status}
                          onChange={(e) => onUpdateStatus(item.id, e.target.value as BookingStatus)}
                          className="text-[11px] bg-[#0a0a0c] border border-neutral-800 text-neutral-300 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-neutral-300 focus:ring-1 focus:ring-neutral-300 cursor-pointer transition-colors duration-150"
                        >
                          <option value="PENDING">Pending (Menunggu DP)</option>
                          <option value="CONFIRMED">Confirmed (Diterima)</option>
                          <option value="COMPLETED">Completed (Selesai)</option>
                          <option value="CANCELLED">Cancelled (Batal)</option>
                        </select>
                      </div>
                    </div>
                  </td>

                  {/* Col 5: Actions */}
                  <td className="px-5 py-4 align-top text-right space-y-1.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <a
                        href={chatClientUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="Chat WhatsApp Klien"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-medium border border-neutral-800 transition-all duration-150 active:scale-[0.98] motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Chat WA</span>
                      </a>

                      <a
                        href={reminderUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="Kirim Pesan Pengingat Jadwal (H-1)"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-200 text-xs font-medium border border-neutral-800 transition-all duration-150 active:scale-[0.98] motion-reduce:active:scale-100 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                      >
                        <Bell className="w-3.5 h-3.5 text-neutral-400" />
                        <span>Reminder H-1</span>
                      </a>
                    </div>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};
