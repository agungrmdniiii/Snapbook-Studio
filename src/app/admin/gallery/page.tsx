'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Upload, Link as LinkIcon, Image as ImageIcon, CheckCircle2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { CustomSelect } from '@/components/ui/CustomSelect';
import { ShowcaseImageData } from '@/types';

export default function AdminGalleryPage() {
  const [images, setImages] = useState<ShowcaseImageData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Add modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [inputMode, setInputMode] = useState<'upload' | 'url'>('upload');
  const [url, setUrl] = useState('');
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Portrait');
  const [aspectRatio, setAspectRatio] = useState('portrait');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const fetchGallery = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/gallery', { cache: 'no-store' });
      if (!res.ok) throw new Error('Gagal memuat galeri');
      const data = await res.json();
      setImages(data);
    } catch (e: any) {
      console.error(e);
      showToast(e.message || 'Gagal memuat foto');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGallery();
  }, []);

  useEffect(() => {
    return () => { if (uploadedPreview) URL.revokeObjectURL(uploadedPreview); };
  }, [uploadedPreview]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || file.size > 4 * 1024 * 1024) {
      setError('Pilih foto JPG, PNG, atau WEBP dengan ukuran maksimal 4 MB.');
      return;
    }
    setError(null);
    setSelectedFile(file);
    setFileName(file.name);
    setUploadedPreview(URL.createObjectURL(file));
  };
  const handleAddImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (inputMode === 'upload' ? !selectedFile : !url.trim()) {
      setError('Silakan upload file foto atau masukkan link URL foto terlebih dahulu.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let imageUrl = url.trim();
      if (inputMode === 'upload' && selectedFile) {
        const form = new FormData();
        form.append('file', selectedFile);
        const upload = await fetch('/api/gallery/upload', { method: 'POST', body: form });
        const result = await upload.json();
        if (!upload.ok) throw new Error(result.error || 'Gagal mengunggah foto.');
        imageUrl = result.url;
      }
      const res = await fetch('/api/gallery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: imageUrl,
          title: title.trim(),
          category,
          aspectRatio,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menambahkan foto.');

      setUrl('');
      setUploadedPreview(null);
      setSelectedFile(null);
      setFileName('');
      setTitle('');
      setIsModalOpen(false);
      showToast('Foto berhasil ditambahkan ke galeri studio!');
      fetchGallery();
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus foto portofolio ini dari galeri?')) return;
    try {
      const res = await fetch(`/api/gallery/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus');
      showToast('Foto berhasil dihapus.');
      fetchGallery();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus foto');
    }
  };

  const resetForm = () => {
    setUrl('');
    setUploadedPreview(null);
    setSelectedFile(null);
    setFileName('');
    setTitle('');
    setError(null);
  };

  return (
    <div className="space-y-8 max-w-6xl animate-studio-fade">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-neutral-900 border border-neutral-700 text-white text-xs sm:text-sm shadow-2xl flex items-center gap-3 animate-studio-fade">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
          <button
            onClick={() => setToastMessage(null)}
            className="text-neutral-500 hover:text-white ml-2 text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-normal text-white">Galeri & Portofolio Studio</h1>
          <p className="text-xs text-neutral-400 mt-1 font-light">
            Upload foto karya terbaik Anda untuk dipamerkan di section portofolio website utama.
          </p>
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
        >
          <Plus className="w-3.5 h-3.5 mr-1" />
          <span>Upload Foto Baru</span>
        </Button>
      </div>

      {/* Gallery Grid */}
      {isLoading ? (
        <div className="p-16 text-center text-xs text-neutral-400 bg-[#101013] rounded-3xl border border-neutral-800 font-light flex flex-col items-center justify-center gap-3">
          <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span>Memuat koleksi foto galeri...</span>
        </div>
      ) : images.length === 0 ? (
        <div className="p-16 text-center text-xs text-neutral-400 bg-[#101013] rounded-3xl border border-neutral-800 font-light">
          Belum ada foto portofolio. Klik tombol "Upload Foto Baru" di atas.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {images.map((img) => (
            <div
              key={img.id}
              className="group relative rounded-2xl overflow-hidden bg-[#101013] border border-neutral-800 shadow-xl aspect-[3/4] flex flex-col justify-end"
            >
              <img
                src={img.url}
                alt={img.title || 'Foto Portofolio'}
                className="absolute inset-0 w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:group-hover:scale-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-4 flex flex-col justify-between">
                <div className="flex justify-end">
                  <button
                    onClick={() => handleDelete(img.id)}
                    title="Hapus Foto"
                    className="p-1.5 rounded-lg bg-black/70 text-neutral-300 hover:text-rose-400 hover:bg-rose-950/80 border border-neutral-700 backdrop-blur-sm transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div>
                  <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-white px-2 py-0.5 rounded bg-black/70">
                    {img.category}
                  </span>
                  <p className="font-serif text-sm font-normal text-white mt-1.5 truncate">
                    {img.title || 'Untitled Session'}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Add / Upload Photo */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Upload Foto ke Galeri Studio"
        maxWidth="lg"
      >
        <form onSubmit={handleAddImage} className="space-y-5">
          {error && (
            <div className="p-3 bg-rose-950/60 border border-rose-900/60 text-rose-300 text-xs rounded-xl">
              {error}
            </div>
          )}

          {/* Mode Switcher: Upload vs URL */}
          <div className="flex items-center gap-2 p-1 bg-neutral-900 border border-neutral-800 rounded-full w-fit">
            <button
              type="button"
              onClick={() => setInputMode('upload')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                inputMode === 'upload'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Upload dari Perangkat</span>
            </button>
            <button
              type="button"
              onClick={() => setInputMode('url')}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                inputMode === 'url'
                  ? 'bg-white text-black font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              <LinkIcon className="w-3.5 h-3.5" />
              <span>Gunakan Link URL</span>
            </button>
          </div>

          {/* Upload Dropzone Area */}
          {inputMode === 'upload' ? (
            <div className="space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleFileChange}
                className="hidden"
              />

              {uploadedPreview ? (
                <div className="relative rounded-2xl overflow-hidden border border-neutral-700 bg-black aspect-[16/9] flex items-center justify-center group">
                  <img
                    src={uploadedPreview}
                    alt="Pratinjau Foto"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <span>Ganti Foto</span>
                    </Button>
                    <Button
                      type="button"
                      variant="danger"
                      size="sm"
                      onClick={() => {
                        setUploadedPreview(null);
      setSelectedFile(null);
                        setUrl('');
                        setFileName('');
                      }}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  {fileName && (
                    <span className="absolute bottom-2 left-2 text-[10px] font-mono bg-black/80 text-neutral-300 px-2 py-0.5 rounded border border-neutral-800">
                      {fileName}
                    </span>
                  )}
                </div>
              ) : (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-neutral-800 hover:border-neutral-500 rounded-2xl p-8 text-center bg-[#0a0a0c] hover:bg-neutral-900/40 transition-colors cursor-pointer flex flex-col items-center justify-center gap-3"
                >
                  <div className="w-12 h-12 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-neutral-400 group-hover:text-white">
                    <ImageIcon className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-white">
                      Klik untuk memilih file foto
                    </p>
                    <p className="text-[11px] text-neutral-500 font-light">
                      JPG, PNG, atau WEBP, maksimal 4 MB
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-neutral-900 border border-neutral-800 text-[10px] font-mono text-neutral-400 uppercase tracking-wider">
                    Pilih File Foto
                  </span>
                </div>
              )}
            </div>
          ) : (
            <Input
              label="URL GAMBAR FOTO *"
              placeholder="https://images.unsplash.com/... atau URL gambar lainnya"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              required
            />
          )}

          <Input
            label="JUDUL FOTO (OPSIONAL)"
            placeholder="Contoh: Graduation Session 2026"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CustomSelect
              label="Kategori Foto"
              value={category}
              onChange={setCategory}
              options={[
                { value: 'Portrait', label: 'Portrait' },
                { value: 'Graduation', label: 'Graduation' },
                { value: 'Family', label: 'Family' },
                { value: 'Couple', label: 'Couple' },
                { value: 'Maternity', label: 'Maternity' },
                { value: 'General', label: 'Lainnya' },
              ]}
            />

            <CustomSelect
              label="Orientasi Foto"
              value={aspectRatio}
              onChange={setAspectRatio}
              options={[
                { value: 'portrait', label: 'Portrait (3:4)' },
                { value: 'square', label: 'Square (1:1)' },
                { value: 'landscape', label: 'Landscape (4:3)' },
              ]}
            />
          </div>

          <div className="pt-4 flex items-center justify-end gap-2 border-t border-neutral-800">
            <Button type="button" variant="outline" size="sm" onClick={() => setIsModalOpen(false)}>
              Batal
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSubmitting}
            >
              {inputMode === 'upload' ? 'Upload & Publikasikan' : 'Tambahkan Foto'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
