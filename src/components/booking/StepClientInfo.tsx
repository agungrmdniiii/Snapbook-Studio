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
        <h2 className="font-serif text-2xl sm:text-3xl font-normal text-stone-100">
          04. Data Pemesan & Koordinat
        </h2>
        <p className="text-xs sm:text-sm text-stone-400 font-light">
          Identitas resmi untuk penerbitan Reservation Pass dan pengiriman arsip softcopy.
        </p>
      </div>

      <div className="bg-[#12100f] border border-stone-800 rounded-3xl p-6 sm:p-8 space-y-6 shadow-xl">
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
          helperText="Admin studio akan mengirimkan verifikasi via nomor ini."
          required
        />

        <Input
          label="ALAMAT EMAIL (OPSIONAL)"
          type="email"
          placeholder="Contoh: rian@email.com"
          value={clientEmail}
          onChange={(e) => onChange({ clientEmail: e.target.value })}
          helperText="Digunakan untuk tautan arsip Google Drive cadangan."
        />

        <div className="space-y-2">
          <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-stone-300">
            Catatan Sesi / Permintaan Khusus
          </label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => onChange({ notes: e.target.value })}
            placeholder="Contoh: Sesi foto wisuda bersama keluarga 4 orang, membawa properti toga."
            className="w-full px-4 py-3 bg-[#0c0a09] border border-stone-800 rounded-xl text-stone-100 placeholder-stone-600 text-sm focus:outline-none focus:ring-1 focus:ring-amber-400 focus:border-amber-400 transition-all font-light"
          />
        </div>
      </div>
    </div>
  );
};
