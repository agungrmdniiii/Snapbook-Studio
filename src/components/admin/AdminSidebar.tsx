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
    { label: 'Galeri Foto', href: '/admin/gallery', icon: ImageIcon },
    { label: 'Pengaturan Studio', href: '/admin/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-[#0a0a0c] border-r border-neutral-800 flex flex-col justify-between min-h-screen p-5 shrink-0">
      <div>
        {/* Brand */}
        <div className="pb-6 mb-6 border-b border-neutral-800">
          <span className="font-serif text-lg font-normal text-white uppercase tracking-[0.14em] block">
            Snapbook Studio
          </span>
          <span className="text-[10px] uppercase tracking-[0.2em] text-neutral-400 block mt-0.5">
            Portal Admin
          </span>
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
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-colors ${
                  isActive
                    ? 'bg-white text-black font-semibold shadow-sm'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-900/60 font-medium'
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
      <div className="pt-6 border-t border-neutral-800 space-y-3">
        <Link
          href="/"
          target="_blank"
          className="flex items-center justify-between px-3 py-2 rounded-xl text-xs text-neutral-400 hover:text-white transition-colors"
        >
          <span className="flex items-center gap-2">
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Lihat Website Publik</span>
          </span>
          <span className="text-[10px] text-neutral-400">↗</span>
        </Link>

        <div className="flex items-center justify-between p-3 rounded-xl bg-[#101013] border border-neutral-800">
          <div className="truncate mr-2">
            <p className="text-xs font-semibold text-white truncate">@{username}</p>
            <p className="text-[10px] text-neutral-400">Administrator</p>
          </div>
          <button
            onClick={handleLogout}
            title="Keluar / Logout"
            className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-400 transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
