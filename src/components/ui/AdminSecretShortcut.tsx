'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';

export const AdminSecretShortcut: React.FC = () => {
  const router = useRouter();
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    let keyBuffer: string[] = [];
    let bufferTimer: NodeJS.Timeout;

    const handleKeyDown = (e: KeyboardEvent) => {
      // 1. Shortcut: Ctrl + Shift + A (or Cmd + Shift + A on Mac)
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        triggerAdminRedirect();
        return;
      }

      // 2. Shortcut: Ctrl + Alt + A
      if ((e.ctrlKey || e.metaKey) && e.altKey && (e.key === 'A' || e.key === 'a')) {
        e.preventDefault();
        triggerAdminRedirect();
        return;
      }

      // 3. Typed keyword "admin"
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        (e.target as HTMLElement)?.isContentEditable
      ) {
        return;
      }

      if (e.key.length === 1) {
        keyBuffer.push(e.key.toLowerCase());
        clearTimeout(bufferTimer);
        bufferTimer = setTimeout(() => {
          keyBuffer = [];
        }, 1500);

        if (keyBuffer.join('').includes('admin')) {
          keyBuffer = [];
          triggerAdminRedirect();
        }
      }
    };

    const triggerAdminRedirect = () => {
      setShowNotification(true);
      setTimeout(() => {
        router.push('/admin');
        setTimeout(() => setShowNotification(false), 2000);
      }, 600);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(bufferTimer);
    };
  }, [router]);

  if (!showNotification) return null;

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-3 rounded-full bg-neutral-900/95 border border-neutral-700 text-white text-xs font-mono shadow-2xl flex items-center gap-2.5 animate-studio-fade backdrop-blur-md">
      <ShieldCheck className="w-4 h-4 text-emerald-400 animate-pulse" />
      <span>Pintasan Rahasia: Membuka Portal Admin...</span>
    </div>
  );
};
