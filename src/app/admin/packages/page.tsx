'use client';

import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit2, Trash2, Clock, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PackageModal } from '@/components/admin/PackageModal';
import { PackageItem, AddOnItem } from '@/types';
import { formatIDR } from '@/lib/utils';

export default function AdminPackagesPage() {
  const [packages, setPackages] = useState<PackageItem[]>([]);
  const [addOns, setAddOns] = useState<AddOnItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<'package' | 'addon'>('package');
  const [selectedItem, setSelectedItem] = useState<any>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/packages?all=true');
      if (!res.ok) throw new Error('Gagal memuat data');
      const data = await res.json();
      setPackages(data.packages || []);
      setAddOns(data.addOns || []);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string, isAddon: boolean = false) => {
    if (!confirm(`Hapus ${isAddon ? 'add-on' : 'paket'} ini secara permanen?`)) return;

    try {
      const url = isAddon ? `/api/packages/${id}?type=addon` : `/api/packages/${id}`;
      const res = await fetch(url, { method: 'DELETE' });
      if (!res.ok) throw new Error('Gagal menghapus');
      fetchData();
    } catch (err: any) {
      alert(err.message || 'Gagal menghapus');
    }
  };

  const openAddPackage = () => {
    setModalType('package');
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const openAddAddon = () => {
    setModalType('addon');
    setSelectedItem(null);
    setIsModalOpen(true);
  };

  const openEdit = (item: any, type: 'package' | 'addon') => {
    setModalType(type);
    setSelectedItem(item);
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-10 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-normal text-white">Paket Foto & Layanan Tambahan</h1>
          <p className="text-xs text-neutral-400 mt-1 font-light">
            Kelola katalog harga, durasi sesi foto, dan layanan ekstra studio.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={openAddAddon}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>Tambah Add-on</span>
          </Button>
          <Button variant="primary" size="sm" onClick={openAddPackage}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            <span>Tambah Paket Foto</span>
          </Button>
        </div>
      </div>

      {/* Section 1: Packages */}
      <div className="space-y-4">
        <h2 className="text-xs uppercase tracking-[0.18em] font-medium text-neutral-300 flex items-center gap-2">
          <Package className="w-4 h-4 text-neutral-400" />
          <span>Daftar Paket Foto ({packages.length})</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            let features: string[] = [];
            try {
              features = JSON.parse(pkg.features);
            } catch {
              features = [];
            }

            return (
              <div
                key={pkg.id}
                className="bg-[#101013] border border-neutral-800 rounded-2xl p-6 sm:p-7 shadow-xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-neutral-400 px-2.5 py-0.5 rounded-full bg-neutral-900 border border-neutral-800">
                      {pkg.category}
                    </span>
                    <Badge variant={pkg.isActive ? 'success' : 'default'}>
                      {pkg.isActive ? 'Aktif' : 'Nonaktif'}
                    </Badge>
                  </div>

                  <h3 className="font-serif text-2xl font-normal text-white">{pkg.name}</h3>
                  <p className="text-xs text-neutral-400 mt-1 mb-4 leading-relaxed font-light">{pkg.description}</p>

                  <div className="flex items-baseline justify-between mb-4 pb-4 border-b border-neutral-800">
                    <span className="font-serif text-2xl text-white">{formatIDR(pkg.price)}</span>
                    <span className="text-xs text-neutral-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{pkg.duration} mnt</span>
                    </span>
                  </div>

                  <div className="space-y-2 mb-6">
                    {features.slice(0, 4).map((f, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs text-neutral-300">
                        <Check className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                        <span className="truncate font-light">{f}</span>
                      </div>
                    ))}
                    {features.length > 4 && (
                      <p className="text-[10px] text-neutral-400 font-mono">+{features.length - 4} fasilitas lainnya</p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-neutral-800 flex items-center justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => openEdit(pkg, 'package')}>
                    <Edit2 className="w-3 h-3 mr-1" />
                    <span>Edit</span>
                  </Button>
                  <Button variant="danger" size="sm" onClick={() => handleDelete(pkg.id)}>
                    <Trash2 className="w-3 h-3 mr-1" />
                    <span>Hapus</span>
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Section 2: Add-Ons */}
      <div className="space-y-4 pt-6 border-t border-neutral-800">
        <h2 className="text-xs uppercase tracking-[0.18em] font-medium text-neutral-300 flex items-center gap-2">
          <span>Layanan Tambahan / Add-ons ({addOns.length})</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {addOns.map((ad) => (
            <div
              key={ad.id}
              className="p-5 rounded-2xl bg-[#101013] border border-neutral-800 flex items-center justify-between"
            >
              <div>
                <p className="font-serif text-base font-normal text-white">{ad.name}</p>
                <p className="font-serif text-sm text-neutral-200 mt-0.5">{formatIDR(ad.price)}</p>
                {ad.description && <p className="text-[11px] text-neutral-400 mt-0.5 font-light">{ad.description}</p>}
              </div>

              <div className="flex items-center gap-1.5 shrink-0 ml-3">
                <button
                  onClick={() => openEdit(ad, 'addon')}
                  className="p-2 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors cursor-pointer"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(ad.id, true)}
                  className="p-2 text-neutral-400 hover:text-rose-400 hover:bg-rose-950/40 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      <PackageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        type={modalType}
        initialData={selectedItem}
        onSuccess={fetchData}
      />
    </div>
  );
}
