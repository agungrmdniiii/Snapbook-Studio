'use client';
import { useRef } from 'react';
import { ChevronUp } from 'lucide-react';
import type { PackageItem, AddOnItem } from '@/types';
import { formatIDR, formatDateIndonesian } from '@/lib/utils';

interface BookingSummaryProps {
  selectedPackage: PackageItem;
  addOns: AddOnItem[];
  date: string;
  time: string;
  slotAvailable: boolean;
  step: number;
  busy: boolean;
  onEdit: (step: number) => void;
}

export function BookingSummary({ selectedPackage, addOns, date, time, slotAvailable, step, busy, onEdit }: BookingSummaryProps) {
  const details = useRef<HTMLDetailsElement>(null);
  const total = selectedPackage.price + addOns.reduce((sum, item) => sum + item.price, 0);
  const schedule = date ? `${formatDateIndonesian(date)}${time ? ` · ${time} WIB` : ' · Pilih jam'}` : 'Pilih tanggal dan jam';
  const compactSchedule = date && time ? `${formatDateIndonesian(date).replace(/^[^,]+, /, '')} · ${time} WIB` : 'Jadwal belum lengkap';
  function edit(next: number) { if (details.current) details.current.open = false; onEdit(next); }
  const content = <>
    <div className="studio-summary-top"><h2>Sesi pilihan Anda</h2><button type="button" disabled={busy} onClick={() => edit(1)}>Ubah paket</button></div>
    <dl>
      <div><dt>Paket</dt><dd>{selectedPackage.name}<span>{selectedPackage.duration} menit · {formatIDR(selectedPackage.price)}</span></dd></div>
      <div><dt>Jadwal {date && <button type="button" disabled={busy} onClick={() => edit(2)}>Ubah</button>}</dt><dd>{schedule}{time && !slotAvailable && <span>Ketersediaan jam sedang diperiksa.</span>}</dd></div>
      {step >= 3 && <div><dt>Tambahan <button type="button" disabled={busy} onClick={() => edit(3)}>Ubah</button></dt><dd>{addOns.length ? <ul>{addOns.map(item => <li key={item.id}>{item.name}<span>{formatIDR(item.price)}</span></li>)}</ul> : 'Tanpa tambahan'}</dd></div>}
      <div className="studio-summary-total"><dt>Total pilihan</dt><dd className="studio-summary-price">{formatIDR(total)}</dd></div>
    </dl>
    <p>{step === 4 ? 'Periksa kembali pilihan Anda sebelum konfirmasi. ' : ''}Pembayaran dikonfirmasi admin melalui WhatsApp.</p>
  </>;
  return <>
    <aside className="studio-booking-summary studio-summary-desktop" aria-label="Ringkasan reservasi">{content}</aside>
    <aside className="studio-summary-mobile" aria-label="Ringkasan reservasi ponsel">
      <details ref={details}>
        <summary><span className="studio-summary-mobile-title"><span>{selectedPackage.name}</span><strong>{formatIDR(total)}</strong></span><span className="studio-summary-mobile-meta"><span>{compactSchedule}</span><span>Ringkasan <ChevronUp size={15} /></span></span></summary>
        <div className="studio-booking-summary studio-summary-mobile-content">{content}</div>
      </details>
    </aside>
  </>;
}
