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
        setErrorMessage('Nama lengkap pemesan wajib diisi.');
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
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses reservasi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12 sm:py-16">
      {/* Wizard Header */}
      <div className="text-center mb-12 space-y-2">
        <h1 className="font-serif text-3xl sm:text-4xl font-normal text-white">
          Reservasi Sesi Foto
        </h1>
        <p className="text-neutral-400 text-xs sm:text-sm font-light">
          Pilih paket dan tentukan jadwal sesi foto Anda secara mandiri dan praktis.
        </p>
      </div>

      {/* Progress Steps Header */}
      {currentStep < 5 && (
        <div className="mb-14">
          <div className="flex items-center justify-between max-w-xl mx-auto px-2">
            {stepsList.slice(0, 4).map((s, idx) => {
              const isPast = currentStep > s.num;
              const isCurrent = currentStep === s.num;
              return (
                <div key={s.num} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs transition-all ${
                        isPast
                          ? 'bg-white text-black font-semibold'
                          : isCurrent
                          ? 'border-2 border-white text-white font-semibold'
                          : 'border border-neutral-800 bg-neutral-900 text-neutral-400'
                      }`}
                    >
                      {isPast ? <Check className="w-3.5 h-3.5 stroke-[2.5]" /> : s.num}
                    </div>
                    <span
                      className={`text-[11px] tracking-wider uppercase mt-2 font-medium ${
                        isCurrent
                          ? 'text-white'
                          : isPast
                          ? 'text-neutral-300'
                          : 'text-neutral-400'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>

                  {idx < 3 && (
                    <div
                      className={`w-12 sm:w-20 h-[1px] mx-2 -mt-4 transition-colors ${
                        currentStep > idx + 1 ? 'bg-white' : 'bg-neutral-800'
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
        <div className="mb-8 p-4 rounded-xl bg-rose-950/40 border border-rose-900/60 text-rose-300 text-xs sm:text-sm flex items-center justify-between max-w-2xl mx-auto">
          <span>{errorMessage}</span>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-rose-400 hover:text-white font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Dynamic Step View */}
      <div key={currentStep} className="py-2 animate-studio-fade">
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
        <div className="mt-14 pt-6 border-t border-neutral-800 flex items-center justify-between max-w-2xl mx-auto">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              <ArrowLeft className="w-3.5 h-3.5 mr-1.5" />
              <span>Kembali</span>
            </Button>
          ) : (
            <div />
          )}

          <Button
            type="button"
            variant="primary"
            size="md"
            onClick={handleNext}
            isLoading={isSubmitting}
          >
            <span>{currentStep === 4 ? 'Konfirmasi Reservasi' : 'Lanjutkan'}</span>
            {currentStep < 4 && <ArrowRight className="w-3.5 h-3.5 ml-1.5" />}
          </Button>
        </div>
      )}
    </div>
  );
};
