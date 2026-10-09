import React from 'react';
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
    <div className="space-y-8 max-w-xl mx-auto">
      <div className="text-center space-y-2">
        <h2 className="font-serif text-2xl sm:text-3xl font-normal text-white">
          Informasi Pemesan
        </h2>
        <p className="text-xs sm:text-sm text-neutral-400 font-light">
          Data ini digunakan untuk konfirmasi jadwal dan pengiriman file foto Anda.
        </p>
      </div>

      <div className="bg-[#101013] border border-neutral-800 rounded-3xl p-6 sm:p-8 space-y-6">
        <Input
          label="NAMA LENGKAP *"
          placeholder="Contoh: Rian Anggara"
          value={clientName}
          onChange={(e) => onChange({ clientName: e.target.value })}
          required
        />

        <Input
          label="NOMOR WHATSAPP AKTIF *"
          placeholder="Contoh: 081234567890"
          value={clientPhone}
          onChange={(e) => onChange({ clientPhone: e.target.value })}
          helperText="Admin studio akan mengonfirmasi jadwal Anda ke nomor ini."
          required
        />

        <Input
          label="ALAMAT EMAIL (OPSIONAL)"
          type="email"
          placeholder="Contoh: rian@email.com"
          value={clientEmail}
          onChange={(e) => onChange({ clientEmail: e.target.value })}
          helperText="Untuk pengiriman link Google Drive cadangan."
        />

        <div className="space-y-2">
          <label className="block text-[11px] font-medium tracking-[0.16em] uppercase text-neutral-400">
            Catatan Tambahan (Opsional)
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            placeholder="Contoh: Bawa properti wisuda sendiri, sesi foto keluarga 4 orang."
            className="w-full px-4 py-3 bg-[#0a0a0c] border border-neutral-800 rounded-xl text-neutral-100 placeholder-neutral-600 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400 focus:border-neutral-400 transition-colors font-light"
          />
        </div>
      </div>
    </div>
  );
};
