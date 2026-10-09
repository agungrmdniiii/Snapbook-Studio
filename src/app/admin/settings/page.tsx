'use client';

import React, { useState, useEffect } from 'react';
import { Settings, Save, Check, AlertCircle, Lock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function AdminSettingsPage() {
  const [studioName, setStudioName] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [instagramHandle, setInstagramHandle] = useState('');
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('20:00');
  const [slotDuration, setSlotDuration] = useState('60');
  const [address, setAddress] = useState('');
  const [aboutText, setAboutText] = useState('');
  const [newPassword, setNewPassword] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
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
          setAddress(data.address || '');
          setAboutText(data.aboutText || '');
        }
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoading(false);
      }
    }
    loadSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      const payload: any = {
        studioName,
        whatsappNumber,
        instagramHandle,
        openingTime,
        closingTime,
        slotDuration: Number(slotDuration) || 60,
        address,
        aboutText,
      };

      if (newPassword.trim()) {
        if (newPassword.trim().length < 6) {
          throw new Error('Password baru minimal 6 karakter.');
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

      setSuccessMsg('Pengaturan studio berhasil diperbarui!');
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
        <h1 className="text-2xl font-extrabold text-white">Pengaturan Studio & Akun</h1>
        <p className="text-xs text-zinc-400 mt-1">
          Sesuaikan profil studio, jam operasional, nomor WhatsApp tujuan booking, dan keamanan.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-950/60 border border-emerald-900 text-emerald-300 text-xs rounded-2xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-950/60 border border-rose-900 text-rose-300 text-xs rounded-2xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400" />
          <span>{errorMsg}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-8">
        {/* Card 1: Studio Profile */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
          <h2 className="text-base font-bold text-white pb-3 border-b border-zinc-800">
            Profil & Kontak Studio
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Nama Studio"
              value={studioName}
              onChange={(e) => setStudioName(e.target.value)}
              required
            />
            <Input
              label="Nomor WhatsApp Admin (Tujuan Booking)"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              helperText="Format: 628... atau 08... (Pesan klien akan ditujukan ke nomor ini)"
              required
            />
          </div>

          <Input
            label="Akun Instagram Studio"
            value={instagramHandle}
            onChange={(e) => setInstagramHandle(e.target.value)}
            placeholder="@snapbookstudio"
          />

          <div className="space-y-1">
            <label className="block text-xs font-medium text-zinc-300">Alamat Fisik Studio</label>
            <textarea
              rows={2}
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-medium text-zinc-300">Tentang Studio (About Text)</label>
            <textarea
              rows={3}
              value={aboutText}
              onChange={(e) => setAboutText(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 text-xs focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* Card 2: Operational Hours */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
          <h2 className="text-base font-bold text-white pb-3 border-b border-zinc-800">
            Jam Operasional & Slot Reservasi
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label="Jam Buka Studio"
              type="time"
              value={openingTime}
              onChange={(e) => setOpeningTime(e.target.value)}
              required
            />
            <Input
              label="Jam Tutup Studio"
              type="time"
              value={closingTime}
              onChange={(e) => setClosingTime(e.target.value)}
              required
            />
            <Input
              label="Durasi Slot (Menit)"
              type="number"
              value={slotDuration}
              onChange={(e) => setSlotDuration(e.target.value)}
              required
            />
          </div>
        </div>

        {/* Card 3: Security & Password */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-5 shadow-xl">
          <h2 className="text-base font-bold text-white pb-3 border-b border-zinc-800 flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400" />
            <span>Keamanan Akun Admin</span>
          </h2>

          <Input
            label="Ganti Password Admin (Opsional)"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Kosongkan jika tidak ingin mengubah password"
            helperText="Minimal 6 karakter."
          />
        </div>

        <div className="flex justify-end">
          <Button type="submit" size="lg" isLoading={isSaving}>
            <Save className="w-4 h-4 mr-1.5" />
            <span>Simpan Semua Pengaturan</span>
          </Button>
        </div>
      </form>
    </div>
  );
}
