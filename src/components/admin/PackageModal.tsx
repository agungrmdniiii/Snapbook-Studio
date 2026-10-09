'use client';

import React, { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface PackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'package' | 'addon';
  initialData?: any;
  onSuccess: () => void;
}

export const PackageModal: React.FC<PackageModalProps> = ({
  isOpen,
  onClose,
  type,
  initialData,
  onSuccess,
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('60');
  const [category, setCategory] = useState('General');
  const [features, setFeatures] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || '');
      setDescription(initialData.description || '');
      setPrice(String(initialData.price || ''));
      setDuration(String(initialData.duration || '60'));
      setCategory(initialData.category || 'General');
      setIsActive(initialData.isActive ?? true);
      if (initialData.features) {
        try {
          const parsed = JSON.parse(initialData.features);
          setFeatures(Array.isArray(parsed) ? parsed.join('\n') : initialData.features);
        } catch {
          setFeatures(initialData.features);
        }
      } else {
        setFeatures('');
      }
    } else {
      setName('');
      setDescription('');
      setPrice('');
      setDuration('60');
      setCategory('General');
      setFeatures('');
      setIsActive(true);
    }
    setError(null);
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !price) {
      setError('Nama dan harga wajib diisi.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const payload: any = {
        type,
        name: name.trim(),
        description: description.trim(),
        price: Number(price),
        isActive,
      };

      if (type === 'package') {
        payload.duration = Number(duration) || 60;
        payload.category = category.trim();
        const featureArray = features
          .split('\n')
          .map((f) => f.trim())
          .filter(Boolean);
        payload.features = JSON.stringify(featureArray);
      }

      const method = initialData ? 'PUT' : 'POST';
      const endpoint = initialData ? `/api/packages/${initialData.id}` : '/api/packages';

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan.');

      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setIsLoading(false);
    }
  };

  const title = initialData
    ? `Edit ${type === 'package' ? 'Edisi Paket' : 'Add-on'}`
    : `Tambah ${type === 'package' ? 'Edisi Paket Baru' : 'Add-on Baru'}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-rose-950/60 border border-rose-900/60 text-rose-300 text-xs rounded-xl">
            {error}
          </div>
        )}

        <Input
          label="NAMA *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder={type === 'package' ? 'Contoh: Graduation Special' : 'Contoh: Ekstra Cetak 10R'}
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            label="HARGA (RP) *"
            type="number"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Contoh: 450000"
            required
          />

          {type === 'package' ? (
            <Input
              label="DURASI (MENIT)"
              type="number"
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              placeholder="Contoh: 60"
            />
          ) : (
            <div className="flex items-center gap-2 pt-6">
              <input
                type="checkbox"
                id="addonActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-amber-400 accent-amber-400 cursor-pointer"
              />
              <label htmlFor="addonActive" className="text-xs text-stone-300 cursor-pointer">
                Status Aktif
              </label>
            </div>
          )}
        </div>

        {type === 'package' && (
          <>
            <Input
              label="KATEGORI"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Contoh: Portrait, Graduation, Family"
            />

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-300">
                Fitur / Fasilitas (Satu baris per poin)
              </label>
              <textarea
                rows={4}
                value={features}
                onChange={(e) => setFeatures(e.target.value)}
                placeholder="60 menit sesi foto&#10;10 foto diedit retouch&#10;Semua softcopy Google Drive"
                className="w-full px-3.5 py-2.5 bg-[#0c0a09] border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 text-xs font-mono focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="pkgActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 rounded text-amber-400 accent-amber-400 cursor-pointer"
              />
              <label htmlFor="pkgActive" className="text-xs text-stone-300 cursor-pointer">
                Paket Aktif & Tampil di Publik
              </label>
            </div>
          </>
        )}

        <div className="space-y-1">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-300">Deskripsi Singkat</label>
          <textarea
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Deskripsi layanan..."
            className="w-full px-3.5 py-2.5 bg-[#0c0a09] border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 text-xs focus:outline-none focus:border-amber-400"
          />
        </div>

        <div className="pt-4 flex items-center justify-end gap-2 border-t border-stone-800">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" variant="gold" size="sm" isLoading={isLoading}>
            Simpan Data
          </Button>
        </div>
      </form>
    </Modal>
  );
};
