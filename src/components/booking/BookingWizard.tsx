'use client';

import React, { useState } from 'react';
import { PackageItem, AddOnItem, BookingData } from '@/types';
import { StepPackage } from './StepPackage';
import { StepDateTime } from './StepDateTime';
import { StepAddOns } from './StepAddOns';
import { StepClientInfo } from './StepClientInfo';
import { StepConfirmation } from './StepConfirmation';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, ArrowRight, Check, Sparkles } from 'lucide-react';

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
    { num: 1, label: 'Collection', stepNum: '01' },
    { num: 2, label: 'Schedule', stepNum: '02' },
    { num: 3, label: 'Add-ons', stepNum: '03' },
    { num: 4, label: 'Details', stepNum: '04' },
    { num: 5, label: 'Pass', stepNum: '05' },
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
        setErrorMessage('Silakan pilih salah satu paket edisi foto terlebih dahulu.');
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
      setErrorMessage(err.message || 'Terjadi kesalahan saat memproses reservasi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Wizard Masthead */}
      <div className="text-center mb-10 space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-900 border border-stone-800 text-[10px] font-semibold uppercase tracking-[0.22em] text-amber-300">
          <Sparkles className="w-3 h-3 text-amber-400" />
          <span>Atelier Session Reservation</span>
        </div>
        <h1 className="font-serif text-3xl sm:text-4xl font-normal text-stone-100">
          Reservasi Sesi Studio
        </h1>
        <p className="text-stone-400 text-xs sm:text-sm font-light">
          Ikuti langkah mudah di bawah untuk mengamankan slot waktu privat Anda.
        </p>
      </div>

      {/* Progress Steps Header - Editorial Step Indicator */}
      {currentStep < 5 && (
        <div className="mb-12">
          <div className="flex items-center justify-between max-w-xl mx-auto px-2">
            {stepsList.slice(0, 4).map((s, idx) => {
              const isPast = currentStep > s.num;
              const isCurrent = currentStep === s.num;
              return (
                <div key={s.num} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center font-mono text-xs transition-all ${
                        isPast
                          ? 'bg-amber-400 text-stone-950 font-bold shadow-md shadow-amber-400/20'
                          : isCurrent
                          ? 'border-2 border-amber-400 text-amber-300 bg-amber-400/10 font-bold'
                          : 'border border-stone-800 bg-stone-900 text-stone-400'
                      }`}
                    >
                      {isPast ? <Check className="w-4 h-4 stroke-[3]" /> : s.stepNum}
                    </div>
                    <span
                      className={`text-[10px] uppercase tracking-[0.15em] mt-2 font-medium ${
                        isCurrent
                          ? 'text-amber-300 font-bold'
                          : isPast
                          ? 'text-stone-200'
                          : 'text-stone-400'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>

                  {idx < 3 && (
                    <div
                      className={`w-12 sm:w-20 h-[1px] mx-2 -mt-4 transition-colors ${
                        currentStep > idx + 1 ? 'bg-amber-400/80' : 'bg-stone-800'
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
        <div className="mt-14 pt-6 border-t border-stone-850 flex items-center justify-between max-w-2xl mx-auto">
          {currentStep > 1 ? (
            <Button
              type="button"
              variant="outline"
              size="md"
              onClick={handleBack}
              disabled={isSubmitting}
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              <span>Kembali</span>
            </Button>
          ) : (
            <div />
          )}

          <Button
            type="button"
            variant="gold"
            size="md"
            onClick={handleNext}
            isLoading={isSubmitting}
          >
            <span>{currentStep === 4 ? 'Konfirmasi & Terbitkan Pass' : 'Langkah Berikutnya'}</span>
            {currentStep < 4 && <ArrowRight className="w-4 h-4 ml-1.5" />}
          </Button>
        </div>
      )}
    </div>
  );
};
