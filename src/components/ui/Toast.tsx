'use client';

import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CheckCircle2, AlertCircle, X } from 'lucide-react';

type Kind = 'success' | 'error';
type Notice = { id: number; message: string; kind: Kind };
const ToastContext = createContext<((message: string, kind?: Kind) => void) | null>(null);

function ToastItem({ notice, dismiss }: { notice: Notice; dismiss: (id: number) => void }) {
  const [paused, setPaused] = useState(false);
  useEffect(() => {
    // Errors remain available until dismissed; reading or focusing pauses success dismissal.
    if (notice.kind === 'error' || paused) return;
    const timer = window.setTimeout(() => dismiss(notice.id), 5000);
    return () => window.clearTimeout(timer);
  }, [notice.id, notice.kind, paused, dismiss]);
  const Icon = notice.kind === 'success' ? CheckCircle2 : AlertCircle;
  return (
    <div role={notice.kind === 'error' ? 'alert' : 'status'} aria-atomic="true"
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) setPaused(false); }}
      className="pointer-events-auto flex items-start gap-3 rounded-xl bg-[#161619] p-4 text-sm text-neutral-100 shadow-[0_8px_30px_rgba(0,0,0,0.35)] animate-studio-fade motion-reduce:animate-none">
      <Icon aria-hidden="true" className={`mt-0.5 h-5 w-5 shrink-0 ${notice.kind === 'success' ? 'text-emerald-300' : 'text-rose-300'}`} />
      <p className="min-w-0 flex-1 break-words leading-relaxed">{notice.message}</p>
      <button type="button" aria-label="Tutup notifikasi" onClick={() => dismiss(notice.id)}
        className="-m-1 shrink-0 rounded-lg p-2 text-neutral-400 hover:bg-neutral-800 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">
        <X aria-hidden="true" className="h-4 w-4" />
      </button>
    </div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [mounted, setMounted] = useState(false);
  const nextId = useRef(0);
  useEffect(() => { setMounted(true); }, []);
  const dismiss = useCallback((id: number) => setNotices(items => items.filter(n => n.id !== id)), []);
  const notify = useCallback((message: string, kind: Kind = 'success') => {
    const notice = { id: ++nextId.current, message, kind };
    setNotices(items => [...items.filter(n => n.message !== message || n.kind !== kind), notice].slice(-3));
  }, []);
  return <ToastContext.Provider value={notify}>
    {children}
    {mounted && createPortal(<aside aria-label="Notifikasi tindakan" className="pointer-events-none fixed right-4 top-[max(1rem,env(safe-area-inset-top))] z-[10050] flex w-[calc(100%-2rem)] max-w-sm flex-col gap-3 sm:right-6 sm:top-6">
      {notices.map(notice => <ToastItem key={notice.id} notice={notice} dismiss={dismiss} />)}
    </aside>, document.body)}
  </ToastContext.Provider>;
}

export function useToast() {
  const notify = useContext(ToastContext);
  if (!notify) throw new Error('useToast requires ToastProvider');
  return notify;
}
