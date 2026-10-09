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
    { label: 'Ringkasan', href: '/admin', icon: LayoutDashboard },
    { label: 'Kelola Reservasi', href: '/admin/bookings', icon: CalendarCheck },
    { label: 'Paket & Add-on', href: '/admin/packages', icon: Package },
    { label: 'Portofolio Galeri', href: '/admin/gallery', icon: ImageIcon },
    { label: 'Pengaturan Studio', href: '/admin/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-zinc-950 border-r border-zinc-850 flex flex-col justify-between min-h-screen p-5 shrink-0">
      <div>
        {/* Brand */}
        <div className="flex items-center gap-3 pb-6 mb-6 border-b border-zinc-850">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-300 flex items-center justify-center text-zinc-950 font-bold shadow-md shadow-amber-500/20">
            <Camera className="w-5 h-5 stroke-[2.2]" />
          </div>
          <div>
            <span className="text-base font-bold text-white block">Portal Admin</span>
            <span className="text-[11px] text-zinc-400">Snapbook Studio</span>
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
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-amber-500 text-zinc-950 font-semibold shadow-md shadow-amber-500/15'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
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
      <div className="pt-6 border-t border-zinc-850 space-y-3">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Lihat Website Publik</span>
          </span>
          <span className="text-[10px] text-zinc-650">↗</span>
        </Link>

        <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/60 border border-zinc-850">
          <div className="truncate mr-2">
            <p className="text-xs font-semibold text-white truncate">@{username}</p>
            <p className="text-[10px] text-zinc-400">Administrator</p>
          </div>
          <button
            onClick={handleLogout}
            title="Keluar / Logout"
            className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-950/40 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
