'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ShowcaseImageData } from '@/types';

export default function AdminGalleryPage() {
  const [images, setImages] = useState<ShowcaseImageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Portrait');
  const [aspectRatio, setAspectRatio] = useState('portrait');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGallery = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/gallery');
      if (!res.ok) throw new Error('Gagal memuat galeri');
      const data = await res.json();
      setImages(data);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('URL foto wajib diisi.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: url.trim(),
          title: title.trim(),
          category,
          aspectRatio,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menambahkan foto.');

      setUrl('');
      setTitle('');
      setIsModalOpen(false);
      fetchGallery();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus foto portofolio ini?')) return;
    try {
      const res = await fetch(`/api/gallery/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus');
      fetchGallery();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus foto');
    }
  };

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="text-[10px] uppercase font-mono tracking-[0.25em] text-amber-400 mb-1">
            Visual Archive Curation
          </div>
          <h1 className="font-serif text-3xl font-normal text-stone-100">Arsip & Portofolio Galeri Studio</h1>
          <p className="text-xs text-stone-400 mt-1 font-light">
            Foto yang terdaftar di sini akan tampil di section portofolio landing page publik.
          </p>
        </div>
        <Button variant="gold" size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          <span>Tambah Foto Baru</span>
        </Button>
      </div>

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="p-16 text-center text-xs text-stone-400 bg-[#12100f] rounded-2xl border border-stone-850 font-light">
          Memuat arsip foto atelier...
        </div>
      ) : images.length === 0 ? (
        <div className="p-16 text-center text-xs text-stone-400 bg-[#12100f] rounded-2xl border border-stone-850 font-light">
          Belum ada foto portofolio. Klik tombol "Tambah Foto Baru" di atas.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {images.map((img, idx) => (
            <div
              key={img.id}
              className="group relative rounded-2xl overflow-hidden bg-[#12100f] border border-stone-800 shadow-xl aspect-[3/4] flex flex-col justify-end"
            >
              <img
                src={img.url}
                alt={img.title || 'Foto Portofolio'}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 filter contrast-[1.04]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0c0a09] via-transparent to-transparent p-4 flex flex-col justify-between">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-mono text-stone-300 bg-[#0c0a09]/80 px-2 py-0.5 rounded border border-stone-800">
                    N° {String(idx + 1).padStart(2, '0')}
                  </span>
                  <button
                    onClick={() => handleDelete(img.id)}
                    title="Hapus Foto"
                    className="p-1.5 rounded-lg bg-[#0c0a09]/80 text-stone-400 hover:text-rose-400 hover:bg-rose-950/60 border border-stone-800 backdrop-blur-sm transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-400 px-2 py-0.5 rounded bg-[#0c0a09]/80">
                    {img.category}
                  </span>
                  <p className="font-serif text-sm font-normal text-stone-100 mt-1.5 truncate">
                    {img.title || 'Untitled Session'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add Photo */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Kurasi Foto Baru ke Arsip"
      >
        <form onSubmit={handleAddImage} className="space-y-4">
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-900/60 text-rose-300 text-xs rounded-xl">
              {error}
            </div>
          )}

          <Input
            label="URL GAMBAR FOTO *"
            placeholder="https://images.unsplash.com/... atau URL gambar lainnya"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            required
          />

          <Input
            label="JUDUL FOTO (OPSIONAL)"
            placeholder="Contoh: Graduation Session 2026"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-300">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0c0a09] border border-stone-800 rounded-xl text-stone-100 text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="Portrait">Portrait</option>
                <option value="Graduation">Graduation</option>
                <option value="Family">Family</option>
                <option value="Couple">Couple</option>
                <option value="Maternity">Maternity</option>
                <option value="General">Lainnya</option>
              </select>
            </div>

            <div className="space-y-1">
              <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-300">Orientasi</label>
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#0c0a09] border border-stone-800 rounded-xl text-stone-100 text-xs focus:outline-none focus:border-amber-400 cursor-pointer"
              >
                <option value="portrait">Portrait (3:4)</option>
                <option value="square">Square (1:1)</option>
                <option value="landscape">Landscape (4:3)</option>
              </select>
            </div>
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-stone-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button type="submit" variant="gold" size="sm" isLoading={isSubmitting}>
              Tambahkan Foto
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
