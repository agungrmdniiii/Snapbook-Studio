'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, ArrowRight, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError('Username dan password wajib diisi.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: username.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login gagal.');
      }

      router.push('/admin');
      router.refresh();
    } catch (err: any) {
      setError(err.message || 'Kredensial tidak valid');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0c0a09] flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 animate-in fade-in duration-300">
        {/* Brand */}
        <div className="text-center space-y-3">
          <div className="w-12 h-12 rounded-full border border-amber-400/40 bg-amber-400/10 flex items-center justify-center text-amber-300 mx-auto shadow-xl shadow-amber-400/5">
            <Camera className="w-5 h-5 stroke-[1.8]" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono tracking-[0.25em] text-amber-400 mb-1">
              Atelier Management System
            </div>
            <h1 className="font-serif text-3xl font-normal text-stone-100 tracking-tight">Staff Curator Console</h1>
            <p className="text-xs text-stone-400 mt-1 font-light">Masuk untuk mengelola reservasi pass dan operasional atelier.</p>
          </div>
        </div>

        {/* Card */}
        <div className="bg-[#12100f] border border-stone-800 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-400 via-amber-200 to-amber-400" />

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="p-3.5 bg-rose-950/40 border border-rose-900/60 rounded-xl text-xs text-rose-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Input
              label="USERNAME ADMIN"
              placeholder="admin"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
            />

            <Input
              label="PASSWORD"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <Button type="submit" variant="gold" size="lg" className="w-full mt-2" isLoading={isLoading}>
              <span>Masuk ke Console</span>
              <ArrowRight className="w-4 h-4 ml-1.5" />
            </Button>
          </form>

          <div className="mt-6 pt-5 border-t border-stone-850 text-center">
            <p className="text-[11px] text-stone-400 font-light">
              Kredensial bawaan: <span className="font-mono text-amber-300">admin / adminpassword123</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
