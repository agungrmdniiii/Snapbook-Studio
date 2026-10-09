'use client';

import React, { useState } from 'react';
import { PackageItem, AddOnItem, BookingData } from '@/types';
import { StepPackage } from './StepPackage';
import { StepDateTime } from './StepDateTime';
import { StepAddOns } from './StepAddOns';
import { StepClientInfo } from './StepClientInfo';
import { StepConfirmation } from './StepConfirmation';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';

interface BookingWizardProps {
  packages: PackageItem[];
  addOns: AddOnItem[];
  initialPackageId?: string;
}

export const BookingWizard: React.FC<BookingWizardProps> = ({
  packages,
  addOns,
  initialPackageId,
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [selectedPackage, setSelectedPackage] = useState<PackageItem | null>(() => {
    return packages.find((p) => p.id === initialPackageId) || null;
  });
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [selectedAddOnIds, setSelectedAddOnIds] = useState<string[]>([]);
  const [clientInfo, setClientInfo] = useState({
    clientName: '',
    clientPhone: '',
    clientEmail: '',
    notes: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [completedBooking, setCompletedBooking] = useState<BookingData | null>(null);
  const [whatsappUrl, setWhatsappUrl] = useState<string>('');

  const stepsList = [
    { num: 1, label: 'Paket' },
    { num: 2, label: 'Jadwal' },
    { num: 3, label: 'Add-ons' },
    { num: 4, label: 'Data Diri' },
    { num: 5, label: 'Selesai' },
  ];

  const handleToggleAddOn = (id: string) => {
    setSelectedAddOnIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleNext = () => {
    setErrorMessage(null);

    if (currentStep === 1) {
      if (!selectedPackage) {
        setErrorMessage('Silakan pilih salah satu paket foto terlebih dahulu.');
        return;
      }
      setCurrentStep(2);
    } else if (currentStep === 2) {
      if (!selectedDate || !selectedTime) {
        setErrorMessage('Silakan tentukan tanggal dan jam sesi yang tersedia.');
        return;
      }
      setCurrentStep(3);
    } else if (currentStep === 3) {
      setCurrentStep(4);
    } else if (currentStep === 4) {
      if (!clientInfo.clientName.trim()) {
        setErrorMessage('Nama lengkap wajib diisi.');
        return;
      }
      if (!clientInfo.clientPhone.trim() || clientInfo.clientPhone.trim().length < 8) {
        setErrorMessage('Nomor WhatsApp tidak valid (minimal 8 digit).');
        return;
      }
      handleSubmitBooking();
    }
  };

  const handleBack = () => {
    setErrorMessage(null);
    if (currentStep > 1 && currentStep < 5) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleSubmitBooking = async () => {
    if (!selectedPackage) return;
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const payload = {
        packageId: selectedPackage.id,
        clientName: clientInfo.clientName,
        clientPhone: clientInfo.clientPhone,
        clientEmail: clientInfo.clientEmail,
        date: selectedDate,
        startTime: selectedTime,
        addOnIds: selectedAddOnIds,
        notes: clientInfo.notes,
      };

      const res = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal membuat reservasi.');
      }

      setCompletedBooking(data.booking);
      setWhatsappUrl(data.whatsappUrl);
      setCurrentStep(5);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      {/* Progress Steps Header */}
      {currentStep < 5 && (
        <div className="mb-10">
          <div className="flex items-center justify-between max-w-xl mx-auto">
            {stepsList.slice(0, 4).map((s, idx) => {
              const isPast = currentStep > s.num;
              const isCurrent = currentStep === s.num;
              return (
                <div key={s.num} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                        isPast
                          ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                          : isCurrent
                          ? 'bg-amber-500/20 border-2 border-amber-500 text-amber-400'
                          : 'bg-zinc-800 text-zinc-500'
                      }`}
                    >
                      {isPast ? <Check className="w-4 h-4 stroke-[3]" /> : s.num}
                    </div>
                    <span
                      className={`text-[11px] font-medium mt-1.5 ${
                        isCurrent || isPast ? 'text-zinc-200 font-semibold' : 'text-zinc-500'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>

                  {idx < 3 && (
                    <div
                      className={`w-12 sm:w-20 h-0.5 mx-2 transition-colors ${
                        currentStep > idx + 1 ? 'bg-amber-500' : 'bg-zinc-800'
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Error Alert */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-950/60 border border-rose-900 text-rose-300 text-sm flex items-center justify-between">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-white font-bold ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Dynamic Step View */}
      <div className="py-2">
        {currentStep === 1 && (
          <StepPackage
            packages={packages}
            selectedPackage={selectedPackage}
            onSelect={(pkg) => {
              setSelectedPackage(pkg);
              setErrorMessage(null);
            }}
          />
        )}

        {currentStep === 2 && (
          <StepDateTime
            selectedDate={selectedDate}
            selectedTime={selectedTime}
            onSelectDate={setSelectedDate}
            onSelectTime={setSelectedTime}
          />
        )}

        {currentStep === 3 && (
          <StepAddOns
            addOns={addOns}
            selectedAddOnIds={selectedAddOnIds}
            onToggleAddOn={handleToggleAddOn}
            basePrice={selectedPackage?.price || 0}
          />
        )}

        {currentStep === 4 && (
          <StepClientInfo
            clientName={clientInfo.clientName}
            clientPhone={clientInfo.clientPhone}
            clientEmail={clientInfo.clientEmail}
            notes={clientInfo.notes}
            onChange={(fields) => setClientInfo((prev) => ({ ...prev, ...fields }))}
          />
        )}

        {currentStep === 5 && completedBooking && (
          <StepConfirmation
            booking={completedBooking}
            whatsappUrl={whatsappUrl}
          />
        )}
      </div>

      {/* Navigation Footer Controls */}
      {currentStep < 5 && (
        <div className="mt-12 pt-6 border-t border-zinc-800 flex items-center justify-between max-w-2xl mx-auto">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              <span>Kembali</span>
            </Button>
          ) : (
            <div />
          )}

          <Button
            type="button"
            size="md"
            onClick={handleNext}
            isLoading={isSubmitting}
          >
            <span>{currentStep === 4 ? 'Konfirmasi & Simpan Booking' : 'Lanjutkan'}</span>
            {currentStep < 4 && <ArrowRight className="w-4 h-4 ml-1" />}
          </Button>
        </div>
      )}
    </div>
  );
};
