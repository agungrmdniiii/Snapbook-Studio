'use client';

import React, { useState, useEffect } from 'react';
import { Save, Check, AlertCircle, Lock } from 'lucide-react';
import { useToast } from '@/components/ui/Toast';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function AdminSettingsPage() {
  const notify = useToast();
  const [studioName, setStudioName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('20:00');
  const [slotDuration, setSlotDuration] = useState('60');
  const [bufferMinutes,setBufferMinutes]=useState('0');
  const [address, setAddress] = useState('');
  const [aboutText, setAboutText] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    async function loadSettings() {
      setIsLoading(true);
      try {
        const res = await fetch('/api/settings');
        if (!res.ok) throw new Error('Gagal memuat pengaturan');
        const data = await res.json();
        if (data) {
          setStudioName(data.studioName || '');
          setWhatsappNumber(data.whatsappNumber || '');
          setInstagramHandle(data.instagramHandle || '');
          setOpeningTime(data.openingTime || '09:00');
          setClosingTime(data.closingTime || '20:00');
          setSlotDuration(String(data.slotDuration || '60'));
          setBufferMinutes(String(data.bufferMinutes??0));
          setAddress(data.address || '');
          setAboutText(data.aboutText || '');
          setSettingsLoaded(true);
        }
      } catch (e) {
        setErrorMsg(e instanceof Error ? e.message : 'Gagal memuat pengaturan. Muat ulang halaman untuk mencoba kembali.');
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving) return;
    if (!settingsLoaded) {
      setErrorMsg('Pengaturan belum berhasil dimuat. Muat ulang halaman sebelum menyimpan.');
      return;
    }
    setIsSaving(true);
    setErrorMsg(null);

    try {
      const payload: any = {
        studioName,
        whatsappNumber,
        instagramHandle,
        openingTime,
        closingTime,
        slotDuration: Number(slotDuration) || 60,
        bufferMinutes:Number(bufferMinutes),
        address,
        aboutText,
      };

      if (newPassword.trim()) {
        if (newPassword.trim().length < 12) {
          throw new Error('Password baru minimal 12 karakter.');
        }
        payload.newPassword = newPassword.trim();
      }

      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan.');
      if (data.requiresLogin) {
        window.location.assign('/admin/login?passwordChanged=1');
        return;
      }

      notify('Pengaturan studio berhasil diperbarui.');
      setNewPassword('');
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kesalahan');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl">
      <div>
        <h1 className="font-serif text-3xl font-normal text-white">Pengaturan Studio & Keamanan</h1>
        <p className="text-xs text-neutral-400 mt-1 font-light">
          Sesuaikan profil studio, jam operasional, nomor WhatsApp tujuan booking, dan keamanan sistem.
        </p>
      </div>

      {errorMsg && (
        <div role="alert" className="p-4 bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        <fieldset disabled={isLoading || !settingsLoaded || isSaving} className="min-w-0 space-y-8">
        {/* Card 1: Studio Profile */}
        <div className="bg-[#101013] border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
          <h2 className="font-serif text-lg font-normal text-white pb-3 border-b border-neutral-800">
            Profil & Kontak Studio
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="NAMA STUDIO"
              value={studioName}
              onChange={(e) => setStudioName(e.target.value)}
              required
            />
            <Input
              label="NOMOR WHATSAPP ADMIN (TUJUAN BOOKING)"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              helperText="Format: 628... atau 08... (Pesan konfirmasi klien masuk ke nomor ini)"
              required
            />
          </div>

          <Input
            label="AKUN INSTAGRAM"
            value={instagramHandle}
            onChange={(e) => setInstagramHandle(e.target.value)}
            placeholder="@snapbookstudio"
          />

          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium tracking-[0.16em] uppercase text-neutral-400">
              Alamat Fisik Studio
            </label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-3 bg-[#0a0a0c] border border-neutral-800 rounded-xl text-white text-xs focus:outline-none focus:border-neutral-300 focus:ring-1 focus:ring-neutral-300 font-light transition-colors duration-150 motion-reduce:transition-none"
            />
          </div>

          <div className="space-y-1.5">
            <label className="block text-[11px] font-medium tracking-[0.16em] uppercase text-neutral-400">
              Tentang Studio (About Bio)
            </label>
            <textarea
              rows={3}
              value={aboutText}
              onChange={(e) => setAboutText(e.target.value)}
              className="w-full px-4 py-3 bg-[#0a0a0c] border border-neutral-800 rounded-xl text-white text-xs focus:outline-none focus:border-neutral-300 focus:ring-1 focus:ring-neutral-300 font-light transition-colors duration-150 motion-reduce:transition-none"
            />
          </div>
        </div>

        {/* Card 2: Operational Hours */}
        <div className="bg-[#101013] border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
          <h2 className="font-serif text-lg font-normal text-white pb-3 border-b border-neutral-800">
            Jam Operasional & Interval Slot
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="JAM BUKA STUDIO"
              type="time"
              value={openingTime}
              onChange={(e) => setOpeningTime(e.target.value)}
              required
            />
            <Input
              label="JAM TUTUP STUDIO"
              type="time"
              value={closingTime}
              onChange={(e) => setClosingTime(e.target.value)}
              required
            />
            <Input
              label="DURASI SLOT (MENIT)"
              type="number"
              value={slotDuration}
              onChange={(e) => setSlotDuration(e.target.value)}
              required
            />
          </div>
        </div>

        <Input label="JEDA ANTARSESI (MENIT)" type="number" min={0} max={180} step={1} required value={bufferMinutes} onChange={e=>setBufferMinutes(e.target.value)} helperText="Jeda untuk persiapan setelah sesi, 0–180 menit. Sesi dan jeda harus selesai sebelum studio tutup." />

        {/* Card 3: Security & Password */}
        <div className="bg-[#101013] border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
          <h2 className="font-serif text-lg font-normal text-white pb-3 border-b border-neutral-800 flex items-center gap-2">
            <Lock className="w-4 h-4 text-neutral-400" />
            <span>Keamanan Akun Admin</span>
          </h2>

          <Input
            label="GANTI PASSWORD (OPSIONAL)"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Kosongkan jika tidak ingin mengubah password"
            helperText="Minimal 12 karakter."
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" variant="primary" size="lg" isLoading={isSaving} loadingLabel="Menyimpan…" disabled={!settingsLoaded || isLoading}>
            <Save className="w-4 h-4 mr-1.5" />
            <span>Simpan Semua Pengaturan</span>
          </Button>
        </div>
        </fieldset>
      </form>
    </div>
  );
}
