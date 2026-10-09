import React from 'react';
import { User, Phone, Mail, FileText } from 'lucide-react';
import { Input } from '@/components/ui/Input';

interface StepClientInfoProps {
  clientName: string;
  clientPhone: string;
  clientEmail: string;
  notes: string;
  onChange: (fields: {
    clientName?: string;
    clientPhone?: string;
    clientEmail?: string;
    notes?: string;
  }) => void;
}

export const StepClientInfo: React.FC<StepClientInfoProps> = ({
  clientName,
  clientPhone,
  clientEmail,
  notes,
  onChange,
}) => {
  return (
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="text-center space-y-1.5">
        <h2 className="text-xl sm:text-2xl font-bold text-white">4. Informasi Data Pemesan</h2>
        <p className="text-xs sm:text-sm text-zinc-400">
          Data ini digunakan untuk identifikasi jadwal dan pengiriman softcopy foto.
        </p>
      </div>

      <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 sm:p-8 space-y-5">
        <Input
          label="Nama Lengkap *"
          placeholder="Contoh: Rian Anggara"
          value={clientName}
          onChange={(e) => onChange({ clientName: e.target.value })}
          required
        />

        <Input
          label="Nomor WhatsApp Aktif *"
          placeholder="Contoh: 081234567890"
          value={clientPhone}
          onChange={(e) => onChange({ clientPhone: e.target.value })}
          helperText="Admin studio akan mengonfirmasi jadwal via nomor ini."
          required
        />

        <Input
          label="Alamat Email (Opsional)"
          type="email"
          placeholder="Contoh: rian@email.com"
          value={clientEmail}
          onChange={(e) => onChange({ clientEmail: e.target.value })}
          helperText="Untuk pengiriman link Google Drive backup."
        />

        <div className="space-y-1.5">
          <label className="block text-xs font-medium text-zinc-300">
            Catatan Tambahan (Opsional)
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            placeholder="Contoh: Bawa properti toga sendiri, sesi foto wisuda bersama orang tua."
            className="w-full px-3.5 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-zinc-100 placeholder-zinc-500 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all"
          />
        </div>
      </div>
    </div>
  );
};
