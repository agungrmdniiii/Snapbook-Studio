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
        return 'gold';
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
    <div className="overflow-x-auto rounded-2xl border border-stone-800 bg-[#12100f] shadow-xl">
      <table className="w-full text-left text-sm">
        <thead className="bg-[#0a0908] text-stone-400 text-[10px] uppercase tracking-[0.2em] border-b border-stone-800 font-mono">
          <tr>
            <th className="px-5 py-4 font-normal">Pass Code & Schedule</th>
            <th className="px-5 py-4 font-normal">Client Dossier</th>
            <th className="px-5 py-4 font-normal">Edition & Rate</th>
            <th className="px-5 py-4 font-normal">Status Pass</th>
            <th className="px-5 py-4 font-normal text-right">Dispatch & Comms</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-850 text-stone-300">
          {bookings.length === 0 ? (
            <tr>
              <td colSpan={5} className="px-5 py-12 text-center text-stone-400 text-xs font-light">
                Tidak ada data reservasi atelier yang sesuai kriteria.
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
                `Halo Kak ${item.clientName}, kami dari ${studioName} terkait reservasi dengan Kode ${item.bookingCode}...`
              )}`;

              return (
                <tr key={item.id} className="hover:bg-stone-900/40 transition-colors">
                  {/* Col 1 */}
                  <td className="px-5 py-4 align-top">
                    <span className="font-mono font-bold text-stone-100 text-xs block tracking-wide">
                      {item.bookingCode}
                    </span>
                    <span className="text-xs text-stone-400 mt-0.5 block font-serif">
                      {formatDateIndonesian(item.date)}
                    </span>
                    <span className="text-[11px] font-mono text-amber-300 block mt-0.5">
                      {item.startTime} – {item.endTime} WIB
                    </span>
                  </td>

                  {/* Col 2 */}
                  <td className="px-5 py-4 align-top">
                    <span className="font-serif text-base text-stone-100 block font-normal">{item.clientName}</span>
                    <span className="text-xs text-stone-400 block font-mono">{item.clientPhone}</span>
                    {item.clientEmail && (
                      <span className="text-[11px] text-stone-400 block truncate max-w-[180px] font-light">
                        {item.clientEmail}
                      </span>
                    )}
                    {item.notes && (
                      <p className="text-[11px] text-stone-400 italic mt-1.5 bg-[#0c0a09] p-2 rounded-lg border border-stone-850 font-light">
                        "{item.notes}"
                      </p>
                    )}
                  </td>

                  {/* Col 3 */}
                  <td className="px-5 py-4 align-top">
                    <span className="font-serif text-sm text-stone-100 block font-normal">{item.package?.name}</span>
                    {item.addOns && item.addOns.length > 0 && (
                      <span className="text-[11px] text-stone-400 block mt-0.5 font-light">
                        +{item.addOns.map((a) => a.addOn.name).join(', ')}
                      </span>
                    )}
                    <span className="text-xs font-serif text-amber-300 block mt-1">
                      {formatIDR(item.totalPrice)}
                    </span>
                  </td>

                  {/* Col 4 */}
                  <td className="px-5 py-4 align-top">
                    <div className="space-y-2">
                      <Badge variant={getBadgeVariant(item.status) as any}>
                        {getStatusLabel(item.status)}
                      </Badge>

                      <div className="flex items-center gap-1">
                        <select
                          value={item.status}
                          onChange={(e) => onUpdateStatus(item.id, e.target.value as BookingStatus)}
                          className="text-[10px] uppercase font-mono tracking-wider bg-[#0c0a09] border border-stone-800 text-stone-300 rounded-lg px-2 py-1 focus:outline-none focus:border-amber-400 cursor-pointer"
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
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-stone-900 hover:bg-stone-800 text-stone-200 text-xs font-medium border border-stone-800 transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Chat WA</span>
                      </a>

                      <a
                        href={reminderUrl}
                        target="_blank"
                        rel="noreferrer"
                        title="Kirim Pesan Pengingat Jadwal (H-1)"
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-amber-400/10 hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-medium transition-colors"
                      >
                        <Bell className="w-3.5 h-3.5 text-amber-400" />
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
