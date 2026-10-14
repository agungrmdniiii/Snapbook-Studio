'use client';

import React, { useState } from 'react';
import { MessageSquare, Bell, Eye, Trash2, CheckCircle2, Clock, Check, X, ArrowUpRight } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { BookingData, BookingStatus } from '@/types';
import { formatIDR, formatDateIndonesian } from '@/lib/utils';
import { generateReminderWhatsAppUrl, sanitizeWhatsAppNumber } from '@/lib/whatsapp';

interface BookingTableProps {
  bookings: BookingData[];
  onUpdateStatus: (bookingId: string, status: BookingStatus) => Promise<void>;
  onDeleteBooking?: (bookingId: string) => Promise<void>;
  studioName?: string;
}

export const BookingTable: React.FC<BookingTableProps> = ({
  bookings,
  onUpdateStatus,
  onDeleteBooking,
  studioName = 'Snapbook Studio',
}) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedBooking, setSelectedBooking] = useState<BookingData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleStatusChange = async (id: string, status: BookingStatus) => {
    setUpdatingId(id);
    try {
      await onUpdateStatus(id, status);
      if (selectedBooking && selectedBooking.id === id) {
        setSelectedBooking((prev) => (prev ? { ...prev, status } : null));
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!onDeleteBooking) return;
    if (!confirm('Hapus data reservasi ini secara permanen dari sistem?')) return;
    setIsDeleting(true);
    try {
      await onDeleteBooking(id);
      setSelectedBooking(null);
    } finally {
      setIsDeleting(false);
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium tracking-wide bg-emerald-950/40 text-emerald-300 border border-emerald-800/80">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>Terkonfirmasi</span>
          </div>
        );
      case 'COMPLETED':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium tracking-wide bg-sky-950/40 text-sky-300 border border-sky-800/80">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
            <span>Selesai</span>
          </div>
        );
      case 'CANCELLED':
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium tracking-wide bg-rose-950/40 text-rose-300 border border-rose-800/80">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
            <span>Dibatalkan</span>
          </div>
        );
      case 'PENDING':
      default:
        return (
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium tracking-wide bg-amber-950/40 text-amber-300 border border-amber-800/80">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            <span>Menunggu DP</span>
          </div>
        );
    }
  };

  return (
    <>
      <div className="overflow-x-auto rounded-3xl border border-neutral-800 bg-[#101013] shadow-2xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-[#0a0a0c] text-neutral-400 text-[10px] uppercase tracking-[0.2em] border-b border-neutral-800 font-mono">
            <tr>
              <th className="px-6 py-4 font-medium">Kode & Jadwal Sesi</th>
              <th className="px-6 py-4 font-medium">Data Klien</th>
              <th className="px-6 py-4 font-medium">Paket & Total</th>
              <th className="px-6 py-4 font-medium">Status & Aksi</th>
              <th className="px-6 py-4 font-medium text-right">Aksi WhatsApp</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-800/80 text-neutral-300">
            {bookings.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-16 text-center text-neutral-500 text-xs font-light">
                  Tidak ada data reservasi yang sesuai dengan filter yang dipilih.
                </td>
              </tr>
            ) : (
              bookings.map((item) => {
                const isItemUpdating = updatingId === item.id;

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
                    {/* Col 1: Kode & Jadwal */}
                    <td className="px-6 py-4 align-top">
                      <button
                        type="button"
                        onClick={() => setSelectedBooking(item)}
                        className="font-mono font-semibold text-white text-xs block tracking-wider hover:underline text-left cursor-pointer"
                      >
                        {item.bookingCode}
                      </button>
                      <span className="text-xs text-neutral-300 mt-1 block">
                        {formatDateIndonesian(item.date)}
                      </span>
                      <span className="text-[11px] font-mono text-neutral-400 block mt-0.5">
                        {item.startTime} – {item.endTime} WIB
                      </span>
                    </td>

                    {/* Col 2: Klien */}
                    <td className="px-6 py-4 align-top">
                      <span className="font-medium text-white block">{item.clientName}</span>
                      <a
                        href={chatClientUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs text-neutral-400 hover:text-emerald-400 font-mono block mt-0.5 transition-colors"
                      >
                        {item.clientPhone}
                      </a>
                      {item.clientEmail && (
                        <span className="text-[11px] text-neutral-400 block truncate max-w-[170px] font-light">
                          {item.clientEmail}
                        </span>
                      )}
                      {item.notes && (
                        <p className="text-[11px] text-neutral-400 italic mt-1.5 bg-[#0a0a0c] p-2 rounded-lg border border-neutral-800 font-light max-w-[220px]">
                          "{item.notes}"
                        </p>
                      )}
                    </td>

                    {/* Col 3: Paket & Biaya */}
                    <td className="px-6 py-4 align-top">
                      <span className="text-sm font-medium text-white block">{item.package?.name}</span>
                      {item.addOns && item.addOns.length > 0 && (
                        <span className="text-[11px] text-neutral-400 block mt-0.5 font-light">
                          +{item.addOns.map((a) => a.addOn.name).join(', ')}
                        </span>
                      )}
                      <span className="text-xs font-serif text-white block mt-1 font-semibold">
                        {formatIDR(item.totalPrice)}
                      </span>
                    </td>

                    {/* Col 4: Status & Clean Action Buttons (NO DROPDOWN) */}
                    <td className="px-6 py-4 align-top">
                      <div className="space-y-2.5">
                        <div className="flex items-center gap-2">
                          {renderStatusBadge(item.status)}
                          {isItemUpdating && (
                            <svg className="animate-spin h-3.5 w-3.5 text-white shrink-0" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                            </svg>
                          )}
                        </div>

                        {/* Direct Contextual Action Buttons */}
                        {item.status === 'PENDING' && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={isItemUpdating}
                              onClick={() => handleStatusChange(item.id, 'CONFIRMED')}
                              className="px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-950/70 hover:bg-emerald-800 text-emerald-200 border border-emerald-700/80 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm"
                            >
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Konfirmasi DP</span>
                            </button>
                            <button
                              type="button"
                              disabled={isItemUpdating}
                              onClick={() => handleStatusChange(item.id, 'CANCELLED')}
                              className="px-2.5 py-1.5 rounded-full text-xs font-medium text-neutral-400 hover:text-rose-300 hover:bg-rose-950/40 border border-transparent hover:border-rose-900 transition-all cursor-pointer"
                            >
                              Batalkan
                            </button>
                          </div>
                        )}

                        {item.status === 'CONFIRMED' && (
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              disabled={isItemUpdating}
                              onClick={() => handleStatusChange(item.id, 'COMPLETED')}
                              className="px-3 py-1.5 rounded-full text-xs font-medium bg-sky-950/70 hover:bg-sky-800 text-sky-200 border border-sky-700/80 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 shadow-sm"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5 text-sky-400" />
                              <span>Selesaikan Sesi</span>
                            </button>
                            <button
                              type="button"
                              disabled={isItemUpdating}
                              onClick={() => handleStatusChange(item.id, 'CANCELLED')}
                              className="px-2.5 py-1.5 rounded-full text-xs font-medium text-neutral-400 hover:text-rose-300 hover:bg-rose-950/40 border border-transparent hover:border-rose-900 transition-all cursor-pointer"
                            >
                              Batalkan
                            </button>
                          </div>
                        )}

                        {item.status === 'COMPLETED' && (
                          <span className="text-[11px] text-neutral-500 font-light flex items-center gap-1">
                            <Check className="w-3 h-3 text-neutral-400" />
                            <span>Sesi Selesai</span>
                          </span>
                        )}

                        {item.status === 'CANCELLED' && (
                          <button
                            type="button"
                            disabled={isItemUpdating}
                            onClick={() => handleStatusChange(item.id, 'PENDING')}
                            className="text-[11px] text-neutral-400 hover:text-white underline cursor-pointer"
                          >
                            Pulihkan ke Pending
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Col 5: WhatsApp & View Actions */}
                    <td className="px-6 py-4 align-top text-right">
                      <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedBooking(item)}
                            title="Buka Detail Lengkap"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs border border-neutral-800 transition-colors cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Detail</span>
                          </button>

                          <a
                            href={chatClientUrl}
                            target="_blank"
                            rel="noreferrer"
                            title="Chat WhatsApp Klien"
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-950/50 hover:bg-emerald-900/70 text-emerald-300 text-xs font-medium border border-emerald-800/80 transition-all cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                            <span>WA</span>
                          </a>

                          <a
                            href={reminderUrl}
                            target="_blank"
                            rel="noreferrer"
                            title="Kirim Pesan Pengingat H-1"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-neutral-300 text-xs border border-neutral-800 transition-all cursor-pointer"
                          >
                            <Bell className="w-3.5 h-3.5 text-neutral-400" />
                            <span>H-1</span>
                          </a>
                        </div>

                        {onDeleteBooking && (
                          <button
                            type="button"
                            onClick={() => handleDelete(item.id)}
                            title="Hapus Reservasi"
                            className="text-[10px] text-neutral-500 hover:text-rose-400 transition-colors cursor-pointer flex items-center gap-1 font-mono"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Hapus</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Booking Detail Modal */}
      {selectedBooking && (
        <Modal
          isOpen={!!selectedBooking}
          onClose={() => setSelectedBooking(null)}
          title={`Detail Reservasi: ${selectedBooking.bookingCode}`}
          maxWidth="lg"
        >
          <div className="space-y-6 text-sm">
            {/* Top Status & Date */}
            <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
              <div>
                <p className="text-xs text-neutral-400 font-light">Status Reservasi</p>
                <div className="mt-1.5">{renderStatusBadge(selectedBooking.status)}</div>
              </div>
              <div className="text-right">
                <p className="text-xs text-neutral-400 font-light">Jadwal Sesi</p>
                <p className="font-serif text-base text-white">{formatDateIndonesian(selectedBooking.date)}</p>
                <p className="text-xs text-neutral-400 font-mono">
                  {selectedBooking.startTime} – {selectedBooking.endTime} WIB
                </p>
              </div>
            </div>

            {/* Client Info */}
            <div className="p-4 rounded-2xl bg-[#0a0a0c] border border-neutral-800 space-y-2">
              <h4 className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                Data Pemesan
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-neutral-500 block">Nama Lengkap:</span>
                  <span className="text-white font-medium">{selectedBooking.clientName}</span>
                </div>
                <div>
                  <span className="text-neutral-500 block">WhatsApp:</span>
                  <a
                    href={`https://wa.me/${sanitizeWhatsAppNumber(selectedBooking.clientPhone)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 font-mono hover:underline"
                  >
                    {selectedBooking.clientPhone}
                  </a>
                </div>
                {selectedBooking.clientEmail && (
                  <div className="sm:col-span-2">
                    <span className="text-neutral-500 block">Email:</span>
                    <span className="text-neutral-300">{selectedBooking.clientEmail}</span>
                  </div>
                )}
                {selectedBooking.notes && (
                  <div className="sm:col-span-2 pt-1 border-t border-neutral-800/80">
                    <span className="text-neutral-500 block">Catatan Tambahan:</span>
                    <p className="text-neutral-300 italic">"{selectedBooking.notes}"</p>
                  </div>
                )}
              </div>
            </div>

            {/* Package & Pricing Breakdown */}
            <div className="p-4 rounded-2xl bg-[#0a0a0c] border border-neutral-800 space-y-2">
              <h4 className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                Rincian Paket & Layanan
              </h4>
              <div className="flex items-center justify-between text-xs py-1">
                <span className="text-white">{selectedBooking.package?.name}</span>
                <span className="font-serif text-white">
                  {formatIDR(selectedBooking.package?.price || 0)}
                </span>
              </div>
              {selectedBooking.addOns && selectedBooking.addOns.length > 0 && (
                <div className="space-y-1 pt-1 border-t border-neutral-800/80">
                  {selectedBooking.addOns.map((ad) => (
                    <div key={ad.id} className="flex items-center justify-between text-xs text-neutral-400">
                      <span>+ {ad.addOn?.name}</span>
                      <span className="font-mono">{formatIDR(ad.priceAtBooking)}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-between text-sm font-semibold pt-2 border-t border-neutral-800">
                <span className="text-white">Total Biaya:</span>
                <span className="font-serif text-lg text-white">{formatIDR(selectedBooking.totalPrice)}</span>
              </div>
            </div>

            {/* Status Switcher (Pills, NO Dropdown) */}
            <div className="p-4 rounded-2xl bg-[#101013] border border-neutral-800 space-y-2.5">
              <span className="text-xs text-neutral-300 font-medium block">
                Ubah Status Reservasi:
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: 'PENDING', label: 'Menunggu DP' },
                  { key: 'CONFIRMED', label: 'Terkonfirmasi' },
                  { key: 'COMPLETED', label: 'Selesai' },
                  { key: 'CANCELLED', label: 'Dibatalkan' },
                ].map((st) => (
                  <button
                    key={st.key}
                    type="button"
                    onClick={() => handleStatusChange(selectedBooking.id, st.key as BookingStatus)}
                    className={`px-3 py-2 rounded-xl text-xs font-medium border transition-all cursor-pointer ${
                      selectedBooking.status === st.key
                        ? 'bg-white text-black font-semibold border-white shadow-md'
                        : 'bg-neutral-900 text-neutral-300 border-neutral-800 hover:border-neutral-600'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            {/* WhatsApp Direct Actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-4 border-t border-neutral-800">
              {onDeleteBooking && (
                <Button
                  variant="danger"
                  size="sm"
                  onClick={() => handleDelete(selectedBooking.id)}
                  isLoading={isDeleting}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  <span>Hapus Reservasi</span>
                </Button>
              )}

              <div className="flex items-center gap-2">
                <a
                  href={`https://wa.me/${sanitizeWhatsAppNumber(
                    selectedBooking.clientPhone
                  )}?text=${encodeURIComponent(
                    `Halo Kak ${selectedBooking.clientName}, kami dari ${studioName}. Reservasi foto Anda (${selectedBooking.bookingCode}) pada ${selectedBooking.date} jam ${selectedBooking.startTime} WIB telah terverifikasi.`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium transition-colors inline-flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Chat WhatsApp</span>
                </a>
                <Button variant="outline" size="sm" onClick={() => setSelectedBooking(null)}>
                  <span>Tutup</span>
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </>
  );
};
