'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarCheck,
  Package,
  Image as ImageIcon,
  Settings,
  LogOut,
  Camera,
  ExternalLink,
} from 'lucide-react';

export const AdminSidebar: React.FC<{ username?: string }> = ({ username = 'admin' }) => {
  const pathname = usePathname();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
      router.refresh();
    } catch (e) {
      console.error('Logout error:', e);
    }
  };

  const navLinks = [
    { label: 'Ringkasan Atelier', href: '/admin', icon: LayoutDashboard },
    { label: 'Kelola Reservasi', href: '/admin/bookings', icon: CalendarCheck },
    { label: 'Edisi & Add-on', href: '/admin/packages', icon: Package },
    { label: 'Arsip & Galeri', href: '/admin/gallery', icon: ImageIcon },
    { label: 'Pengaturan Studio', href: '/admin/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0a0908] border-r border-stone-850 flex flex-col justify-between min-h-screen p-5 shrink-0">
      <div>
        {/* Brand */}
        <div className="flex items-center gap-3 pb-6 mb-6 border-b border-stone-850">
          <div className="w-9 h-9 rounded-full border border-amber-400/40 bg-amber-400/10 flex items-center justify-center text-amber-300">
            <Camera className="w-4 h-4 stroke-[1.8]" />
          </div>
          <div>
            <span className="font-serif text-lg font-normal text-stone-100 block">
              Atelier Portal
            </span>
            <span className="text-[10px] uppercase tracking-[0.2em] text-amber-400 block -mt-0.5">
              Staff Console
            </span>
          </div>
        </div>

        {/* Nav Links */}
        <nav className="space-y-1.5">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider font-medium transition-all ${
                  isActive
                    ? 'bg-amber-400 text-stone-950 font-bold shadow-md shadow-amber-400/15'
                    : 'text-stone-400 hover:text-stone-100 hover:bg-stone-900/60'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer User & Actions */}
      <div className="pt-6 border-t border-stone-850 space-y-3">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-stone-400 hover:text-amber-300 hover:bg-stone-900/50 transition-colors"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Lihat Public Site</span>
          </span>
          <span className="text-[10px] text-stone-400">↗</span>
        </Link>

        <div className="flex items-center justify-between p-3 rounded-xl bg-[#12100f] border border-stone-800">
          <div className="truncate mr-2">
            <p className="text-xs font-semibold text-stone-200 truncate">@{username}</p>
            <p className="text-[10px] text-amber-400 font-mono">Curator Admin</p>
          </div>
          <button
            onClick={handleLogout}
            title="Keluar / Logout"
            className="p-1.5 rounded-lg text-stone-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
