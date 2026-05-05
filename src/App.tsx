import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Camera, Calendar, Clock, User, Phone, Check, ChevronRight, X, Instagram, Facebook, Mail, Copy, Search, Filter, ArrowUpRight } from 'lucide-react';
import { Package, StudioConfig, Booking, ShowcaseImage } from './types';
import { formatCurrency, cn, generateWhatsAppLink } from './lib/utils';
import { getPackages, getStudioConfig, createBooking, checkAvailability, getBookings, updateBookingStatus, getShowcaseImages, addShowcaseImage, deleteShowcaseImage, savePackage, deletePackage, saveStudioConfig } from './services/bookingService';
import { format, addMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, startOfDay, addMinutes, isAfter, parse } from 'date-fns';

const TIME_SLOTS = [
  '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'
];

export default function App() {
  const [packages, setPackages] = React.useState<Package[]>([]);
  const [showcaseImages, setShowcaseImages] = React.useState<ShowcaseImage[]>([]);
  const [config, setConfig] = React.useState<StudioConfig | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [isBookingModalOpen, setIsBookingModalOpen] = React.useState(false);
  const [isAdminMode, setIsAdminMode] = React.useState(() => {
    return localStorage.getItem('snapbook_admin_session') === 'active';
  });
  const [isPreviewMode, setIsPreviewMode] = React.useState(false);
  const [currentView, setCurrentView] = React.useState<'about_us' | 'services'>('about_us');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
  const [showAdminLogin, setShowAdminLogin] = React.useState(false);
  const [adminCreds, setAdminCreds] = React.useState({ id: '', pw: '' });
  const [adminLoginError, setAdminLoginError] = React.useState(false);

  // Hidden Shortcut for Admin
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt + ` (Backtick)
      if (e.altKey && e.key === '`') {
        setShowAdminLogin(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const refreshGallery = React.useCallback(async () => {
    const gallery = await getShowcaseImages();
    setShowcaseImages(gallery);
  }, []);

  // Booking State
  const [step, setStep] = React.useState(1);
  const [selectedPackage, setSelectedPackage] = React.useState<Package | null>(null);
  const [selectedDate, setSelectedDate] = React.useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = React.useState<string | null>(null);
  const [unavailableSlots, setUnavailableSlots] = React.useState<string[]>([]);
  const [clientInfo, setClientInfo] = React.useState({ name: '', phone: '', email: '' });
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [bookingSuccess, setBookingSuccess] = React.useState<string | null>(null);
  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => {
    async function init() {
      // Small delay to ensure seed finishes if it runs on mount
      setTimeout(async () => {
        try {
          const [pkgs, cfg, gallery] = await Promise.all([getPackages(), getStudioConfig(), getShowcaseImages()]);
          setPackages(pkgs);
          setConfig(cfg);
          setShowcaseImages(gallery);
        } catch (e) {
          console.error("Initialization error:", e);
        } finally {
          setLoading(false);
        }
      }, 800);
    }
    init();
  }, []);

  const handleForceSeed = async () => {
    try {
      const { forceSeed } = await import('./services/seedService');
      await forceSeed();
      const [pkgs, cfg] = await Promise.all([getPackages(), getStudioConfig()]);
      setPackages(pkgs);
      setConfig(cfg);
      alert("Studio initialized successfully! Refreshing data...");
    } catch (e) {
      console.error(e);
      alert("Failed to initialize. Master control required.");
    }
  };

  const getAvailableSlots = () => {
    const start = parse(config?.openingTime || '09:00', 'HH:mm', new Date());
    const end = parse(config?.closingTime || '20:00', 'HH:mm', new Date());
    const slots: string[] = [];
    let current = start;
    while (current <= end) {
      slots.push(format(current, 'HH:mm'));
      current = addMinutes(current, 60);
    }
    return slots;
  };

  const loadAvailability = async (date: Date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const bookings = await getBookings();
    
    // Convert all bookings on this date to time ranges (in minutes from midnight)
    const takenRanges = bookings
      .filter(b => b.date === dateStr && b.status !== 'cancelled')
      .map(b => {
        const start = parse(b.startTime, 'HH:mm', new Date());
        const end = parse(b.endTime, 'HH:mm', new Date());
        return {
          start: start.getHours() * 60 + start.getMinutes(),
          end: end.getHours() * 60 + end.getMinutes()
        };
      });

    const unavailable: string[] = [];
    const slotsToProcess = getAvailableSlots();
    slotsToProcess.forEach(slot => {
      const slotTime = parse(slot, 'HH:mm', new Date());
      const slotStart = slotTime.getHours() * 60 + slotTime.getMinutes();
      const slotEnd = slotStart + (selectedPackage?.duration || 30);

      const isConflict = takenRanges.some(range => {
        return slotStart < range.end && range.start < slotEnd;
      });

      if (isConflict) unavailable.push(slot);
    });

    setUnavailableSlots(unavailable);
  };

  React.useEffect(() => {
    if (selectedDate && step === 3) {
      loadAvailability(selectedDate);
    }
  }, [selectedDate, step]);

  const handleBooking = async () => {
    if (!selectedPackage || !selectedDate || !selectedTime || !clientInfo.name || !clientInfo.phone) return;
    
    setIsSubmitting(true);
    try {
      const dateStr = format(selectedDate, 'yyyy-MM-dd');
      const bookingData = {
        packageId: selectedPackage.id,
        packageName: selectedPackage.name,
        clientName: clientInfo.name,
        clientEmail: clientInfo.email,
        clientPhone: clientInfo.phone,
        date: dateStr,
        startTime: selectedTime,
        endTime: format(addMinutes(parse(selectedTime, 'HH:mm', new Date()), selectedPackage.duration), 'HH:mm'),
        totalPrice: selectedPackage.price,
      };

      const bookingId = await createBooking(bookingData);
      setBookingSuccess(bookingId);
      
      // WhatsApp Integration
      const waMsg = `Halo ${config?.studioName || 'Studio'}! Saya ingin konfirmasi booking foto:
Nama: ${clientInfo.name}
Paket: ${selectedPackage.name}
Tanggal: ${dateStr}
Jam: ${selectedTime}
Booking ID: ${bookingId}
Terima kasih!`;
      
      const waLink = generateWhatsAppLink(config?.whatsappNumber || '081234567890', waMsg);
      
      setTimeout(() => {
        window.open(waLink, '_blank');
      }, 1500);

    } catch (error) {
      alert('Gagal membuat booking. Silakan coba lagi.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetBooking = () => {
    setStep(1);
    setSelectedPackage(null);
    setSelectedDate(null);
    setSelectedTime(null);
    setClientInfo({ name: '', phone: '', email: '' });
    setBookingSuccess(null);
    setIsBookingModalOpen(false);
  };

  const handleAdminToggle = () => {
    if (isAdminMode) {
      setIsAdminMode(false);
    } else {
      setShowAdminLogin(true);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Check against config in database
    if (config && adminCreds.id === (config.adminId || 'admin') && adminCreds.pw === (config.adminPw || 'akuadmin')) {
      setIsAdminMode(true);
      localStorage.setItem('snapbook_admin_session', 'active');
      setShowAdminLogin(false);
      setAdminCreds({ id: '', pw: '' });
      setAdminLoginError(false);
    } else {
      // Fallback for initial state before config is fully loaded
      if (adminCreds.id === 'admin' && adminCreds.pw === 'akuadmin') {
         setIsAdminMode(true);
         localStorage.setItem('snapbook_admin_session', 'active');
         setShowAdminLogin(false);
         setAdminCreds({ id: '', pw: '' });
         setAdminLoginError(false);
         return;
      }
      setAdminLoginError(true);
    }
  };

  const handleAdminLogout = () => {
    setIsAdminMode(false);
    localStorage.removeItem('snapbook_admin_session');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFDFD]">
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-8 h-8 border-2 border-black border-t-transparent rounded-full"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#FDFDFD] text-[#1A1A1A] font-sans selection:bg-black selection:text-white">
      {/* Header Navigation */}
      <header className="border-b border-gray-100 px-6 md:px-10 py-6 flex justify-between items-center sticky top-0 bg-[#FDFDFD]/80 backdrop-blur-md z-40">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-white"></div>
          </div>
          <h1 className="text-lg md:text-xl font-bold tracking-tight uppercase">{config?.studioName}</h1>
        </div>
        
        {/* Mobile Menu Toggle */}
        <button 
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="md:hidden w-10 h-10 flex items-center justify-center border border-gray-100 rounded-full"
        >
          {isMobileMenuOpen ? <X className="w-5 h-5" /> : <div className="w-5 h-4 flex flex-col justify-between"><span className="w-full h-0.5 bg-black"></span><span className="w-full h-0.5 bg-black"></span><span className="w-full h-0.5 bg-black"></span></div>}
        </button>

        <nav className="hidden md:flex gap-8 text-sm font-medium text-gray-500 uppercase tracking-widest items-center">
          {!isAdminMode && (
            <>
              <button onClick={() => { setIsBookingModalOpen(true); setStep(1); }} className="text-black border-b border-black">Reservasi</button>
              <button 
                onClick={() => setCurrentView('about_us')} 
                className={cn("hover:text-black transition-colors", currentView === 'about_us' && "text-black")}
              > Tentang Kami
              </button>
              <button 
                onClick={() => setCurrentView('services')} 
                className={cn("hover:text-black transition-colors", currentView === 'services' && "text-black")}
              > Layanan
              </button>
            </>
          )}
          
          {isAdminMode && (
            <div className="flex items-center gap-4 border-l border-gray-100 pl-8">
              <div className="flex flex-col items-end">
                <span className="text-xs font-bold uppercase tracking-widest leading-none mb-1">Admin</span>
                <span className="text-[10px] text-gray-400 font-medium uppercase tracking-[0.2em]">Sesi Aktif</span>
              </div>
              <button 
                onClick={handleAdminLogout}
                className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest bg-black text-white hover:bg-gray-800 transition-all"
              >
                Tutup Control
              </button>
            </div>
          )}
        </nav>
      </header>

      {/* Mobile Navigation Drawer */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            className="fixed inset-0 z-50 bg-white md:hidden flex flex-col p-8 pt-24"
          >
            <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-8 right-8 w-12 h-12 border border-gray-100 rounded-full flex items-center justify-center"><X className="w-6 h-6" /></button>
            <div className="flex flex-col gap-10 text-xl font-bold uppercase tracking-[0.2em]">
               {!isAdminMode && (
                 <>
                   <button onClick={() => { setCurrentView('about_us'); setIsMobileMenuOpen(false); }} className={cn("text-left", currentView === 'about_us' && "text-gray-300")}>Beranda</button>
                   <button onClick={() => { setCurrentView('services'); setIsMobileMenuOpen(false); }} className={cn("text-left", currentView === 'services' && "text-gray-300")}>Layanan</button>
                   <button onClick={() => { setIsBookingModalOpen(true); setStep(1); setIsMobileMenuOpen(false); }} className="text-left">Reservasi Sesi</button>
                 </>
               )}
            </div>

            <div className="mt-auto border-t border-gray-50 pt-10 pb-6">
              {isAdminMode && (
                <button 
                  onClick={() => { handleAdminLogout(); setIsMobileMenuOpen(false); }}
                  className="w-full py-5 bg-black text-white rounded-full flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-[0.2em]"
                >
                  Tutup Admin Control
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {isAdminMode ? (
        <AdminSection 
          onForceSeed={handleForceSeed} 
          config={config} 
          setConfig={setConfig}
          onShowcaseUpdate={refreshGallery}
          showcaseData={showcaseImages}
        />
      ) : (
        <main className="flex-1 flex flex-col">
          <AnimatePresence mode="wait">
            {currentView === 'about_us' && (
              <motion.div
                key="about_us"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="flex-1 flex flex-col"
              >
                {/* Hero Section */}
                <section className="relative px-6 md:px-10 pt-32 md:pt-40 pb-24 flex flex-col items-center text-center">
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-4xl"
                  >
                    <div className="flex items-center justify-center gap-4 mb-8 md:mb-10">
                      <span className="hidden sm:block h-[1px] w-12 bg-gray-200"></span>
                      <span className="text-[10px] sm:text-sm font-bold text-gray-400 uppercase tracking-[0.3em] sm:tracking-[0.4em] block">
                        Studio Professional / Self-Portrait
                      </span>
                      <span className="hidden sm:block h-[1px] w-12 bg-gray-200"></span>
                    </div>
                    
                    <h1 className="text-5xl sm:text-7xl md:text-9xl font-serif italic mb-8 md:mb-10 leading-[0.9] tracking-tighter">
                      Seni sebuah <br />
                      <span className="not-italic font-sans font-bold uppercase">Kehadiran</span>
                    </h1>
                    
                    <p className="text-base sm:text-xl text-gray-400 mb-8 max-w-xl mx-auto leading-relaxed font-light">
                      {config?.aboutText || "Studio potret diri profesional yang dirancang untuk hasil kelas atas dan privasi mutlak. Pesan momen kreatif Anda hari ini."}
                    </p>
                    
                    <div className="flex flex-col md:flex-row gap-6 items-center justify-center">
                      <button 
                        onClick={() => setIsBookingModalOpen(true)}
                        className="group flex items-center bg-black text-white px-12 py-6 rounded-full font-bold uppercase text-sm tracking-[0.3em] hover:bg-gray-800 transition-all shadow-2xl shadow-black/20"
                      >
                        <span>Pesan Sesi Anda</span>
                        <ChevronRight className="w-4 h-4 ml-4 group-hover:translate-x-1 transition-transform" />
                      </button>
                      <button 
                        onClick={() => setCurrentView('services')}
                        className="text-xs font-bold uppercase tracking-widest border-b border-black py-2 hover:opacity-50 transition-opacity"
                      >
                        Lihat Koleksi
                      </button>
                    </div>
                  </motion.div>
                </section>

                {/* Features Section */}
                <section className="px-10 py-10 flex border-y border-gray-50 bg-gray-50/10 overflow-x-auto no-scrollbar gap-20 items-center justify-center">
                   <div className="flex items-center gap-4 shrink-0">
                     <Camera className="w-5 h-5 text-gray-300" />
                     <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Peralatan Kelas Premium</span>
                   </div>
                   <div className="flex items-center gap-4 shrink-0">
                     <Clock className="w-5 h-5 text-gray-300" />
                     <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Pengiriman Digital Instan</span>
                   </div>
                   <div className="flex items-center gap-4 shrink-0">
                     <User className="w-5 h-5 text-gray-300" />
                     <span className="text-xs font-bold uppercase tracking-widest text-gray-400">Privasi Mutlak</span>
                   </div>
                </section>

                {/* Philosophy Section */}
                <section className="py-16 md:py-24 px-6 md:px-10 max-w-[1400px] mx-auto text-center">
                  <div className="max-w-2xl mx-auto">
                    <span className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest block mb-6 md:mb-8">Filosofi Kami</span>
                    <h3 className="text-2xl sm:text-4xl md:text-5xl font-serif italic mb-0 leading-tight">Kami percaya setiap orang memiliki sisi yang layak untuk diabadikan secara profesional namun tetap personal.</h3>
                  </div>
                </section>

                {/* Showcase Section (Previously About) */}
                <section className="py-16 md:py-24 px-6 md:px-10 max-w-[1400px] mx-auto border-t border-gray-50">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12 md:mb-16">
                    <div className="max-w-xl">
                      <span className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest block mb-4">Etalase / Visi Kami</span>
                      <h2 className="text-4xl sm:text-5xl md:text-6xl font-serif italic mb-6 md:mb-8">Karya Kami</h2>
                      <p className="text-base sm:text-lg text-gray-500 font-light leading-relaxed">
                        Lihat bagaimana kami menangkap esensi dan kepribadian melalui lensa artistik. Setiap foto adalah cerita yang menceritakan tentang kehadiran dan ekspresi diri.
                      </p>
                    </div>
                    <button className="text-xs font-bold uppercase tracking-[0.3em] border-b border-black pb-2 hover:opacity-50 transition-opacity whitespace-nowrap">
                      Lihat di Instagram
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-12 gap-8 lg:gap-10">
                    {showcaseImages.length > 0 ? (
                      showcaseImages.map((img, i) => {
                        let colSpan = "md:col-span-4";
                        if (img.aspectRatio === 'landscape') {
                          colSpan = i % 3 === 0 ? "md:col-span-12" : "md:col-span-8";
                        } else if (img.aspectRatio === 'square') {
                          colSpan = "md:col-span-6";
                        }
                        
                        const aspectClass = img.aspectRatio === 'portrait' ? "aspect-[3/4]" : 
                                          img.aspectRatio === 'landscape' ? "aspect-[16/9]" : "aspect-square";

                        return (
                          <motion.div 
                            key={img.id}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: (i % 6) * 0.1 }}
                            className={cn(
                              "group relative overflow-hidden bg-gray-50 rounded-sm",
                              colSpan,
                              aspectClass
                            )}
                          >
                            <img 
                              src={img.url} 
                              alt={img.title || "Showcase Image"} 
                              className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                              referrerPolicy="no-referrer"
                            />
                            {(img.title || img.category) && (
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex items-end p-10">
                                <motion.div 
                                  initial={{ y: 10, opacity: 0 }}
                                  whileHover={{ y: 0, opacity: 1 }}
                                  className="text-white"
                                >
                                  {img.category && <span className="text-[10px] font-bold uppercase tracking-widest block mb-2 text-gray-300">{img.category}</span>}
                                  {img.title && <h4 className="text-2xl font-serif italic leading-none">{img.title}</h4>}
                                </motion.div>
                              </div>
                            )}
                          </motion.div>
                        );
                      })
                    ) : (
                      <>
                        <div className="md:col-span-8 group relative aspect-[16/10] overflow-hidden bg-gray-100 rounded-sm">
                          <img 
                            src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=1288&auto=format&fit=crop" 
                            alt="Portrait Artistik" 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                        <div className="md:col-span-4 group relative aspect-[4/5] overflow-hidden bg-gray-100 rounded-sm">
                          <img 
                            src="https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?q=80&w=1364&auto=format&fit=crop" 
                            alt="Minimalist Portrait" 
                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            referrerPolicy="no-referrer"
                          />
                        </div>
                      </>
                    )}
                  </div>
                </section>
              </motion.div>
            )}

            {/* Services View */}
            {currentView === 'services' && (
              <motion.div
                key="services"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="flex-1 flex flex-col"
              >
                {/* Packages Section */}
                <section className="py-16 md:py-32 px-6 md:px-10 max-w-[1400px] mx-auto min-h-[60vh]">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12 md:mb-20">
                    <div className="max-w-md">
                      <span className="text-xs sm:text-sm font-bold text-gray-400 uppercase tracking-widest block mb-4">Layanan / Koleksi</span>
                      <h2 className="text-4xl sm:text-5xl font-serif italic">Pilih Pengalaman Anda</h2>
                    </div>
                    <p className="text-base sm:text-lg text-gray-400 italic max-w-xs md:text-right leading-relaxed font-light">
                      Pengalaman fotografi terkurasi yang dirancang untuk ekspresi diri dan standar profesional.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                    {packages.length > 0 ? (
                      packages.map((pkg, idx) => (
                        <motion.div
                          key={pkg.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.1 }}
                          onClick={() => {
                            setSelectedPackage(pkg);
                            setStep(2);
                            setIsBookingModalOpen(true);
                          }}
                          className="group cursor-pointer border border-gray-100 p-10 bg-white hover:border-black transition-all duration-500 rounded-sm flex flex-col h-full"
                        >
                          <div className="flex justify-between items-start mb-10">
                            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-3 py-1 rounded-sm">
                              {pkg.category}
                            </div>
                            <div className="text-sm font-mono font-medium text-gray-400 group-hover:text-black transition-colors">
                              {formatCurrency(pkg.price)}
                            </div>
                          </div>
                          
                          {pkg.imageUrl && (
                            <div className="aspect-[16/10] mb-8 overflow-hidden rounded-sm bg-gray-50">
                              <img src={pkg.imageUrl} alt={pkg.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                            </div>
                          )}

                          <h3 className="text-2xl font-bold uppercase tracking-tight mb-4">{pkg.name}</h3>
                          <p className="text-xs text-gray-500 leading-relaxed mb-10 flex-grow">{pkg.description}</p>
                          
                          <ul className="space-y-4 mb-12 border-t border-gray-50 pt-8 mt-auto">
                            {pkg.features.slice(0, 3).map((feature, i) => (
                              <li key={i} className="flex items-center gap-3 text-xs font-medium uppercase tracking-widest text-gray-400">
                                <div className="w-1 h-1 bg-black rounded-full" />
                                {feature}
                              </li>
                            ))}
                          </ul>

                          <div className="flex items-center justify-between group-hover:translate-x-2 transition-transform">
                            <span className="text-xs font-bold uppercase tracking-widest">Pesan Sekarang</span>
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        </motion.div>
                      ))
                    ) : (
                      <div className="col-span-full py-40 border border-dashed border-gray-100 flex flex-col items-center justify-center text-center bg-gray-50/20">
                         <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                           <Camera className="w-6 h-6 text-gray-200" />
                         </div>
                         <h3 className="text-xl font-serif italic mb-4">The Studio is currently transitioning.</h3>
                         <p className="text-xs text-gray-400 uppercase tracking-widest mb-10">Waiting for owner to initialize digital collections.</p>
                      </div>
                    )}
                  </div>
                </section>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer */}
          <footer className="mt-auto border-t border-gray-100">
            <div className="max-w-[1400px] mx-auto py-16 md:py-24 px-6 md:px-10 grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-20">
              <div className="col-span-1 md:col-span-2">
                <div className="flex items-center gap-3 mb-8 md:mb-10">
                  <div className="w-8 h-8 bg-black rounded-full flex items-center justify-center">
                    <Camera className="w-4 h-4 text-white" />
                  </div>
                  <h1 className="text-lg font-bold tracking-tight uppercase">{config?.studioName}</h1>
                </div>
                <h3 className="text-3xl md:text-4xl font-serif italic mb-8 md:mb-10 leading-tight">Capturing the beauty of <br/> the ephemeral moment.</h3>
                <div className="flex gap-6">
                  <a href={config?.instagramUrl} target="_blank" rel="noreferrer" className="text-gray-300 hover:text-black transition-colors"><Instagram className="w-5 h-5" /></a>
                  <a href={config?.facebookUrl} target="_blank" rel="noreferrer" className="text-gray-300 hover:text-black transition-colors"><Facebook className="w-5 h-5" /></a>
                  <a href={`mailto:${config?.email}`} className="text-gray-300 hover:text-black transition-colors"><Mail className="w-5 h-5" /></a>
                </div>
              </div>
              <div className="space-y-8">
                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Informasi</h4>
                <nav className="flex flex-col gap-4 text-xs font-medium uppercase tracking-widest">
                  <button onClick={() => setCurrentView('about_us')} className="hover:opacity-100 opacity-60 text-left">Tentang Kami</button>
                  <button onClick={() => setCurrentView('services')} className="hover:opacity-100 opacity-60 text-left">Layanan</button>
                  <a href="#" className="hover:opacity-100 opacity-60">Kebijakan Privasi</a>
                  <a href="#" className="hover:opacity-100 opacity-60">Syarat & Ketentuan</a>
                </nav>
              </div>
              <div className="space-y-8">
                <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Kantor</h4>
                <address className="not-italic flex flex-col gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-500 opacity-60 leading-relaxed">
                  <p>{config?.address || "Jakarta, Indonesia"}</p>
                  <p>{config?.phone}</p>
                  <p>{config?.email}</p>
                </address>
              </div>
            </div>

            <div className="px-6 md:px-10 py-8 md:py-10 border-t border-gray-100 bg-gray-50/20">
              <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-400 italic text-center md:text-left">
                  © 2024 {config?.studioName} — Built for Excellence
                </span>
                <div className="flex gap-8">
                   <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-gray-300">All Rights Reserved</span>
                </div>
              </div>
            </div>
          </footer>
        </main>
      )}

      {/* Admin Login Modal */}
      <AnimatePresence>
        {showAdminLogin && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-0">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAdminLogin(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              className="bg-white w-full max-w-sm p-10 rounded-sm relative z-10 shadow-2xl"
            >
              <h3 className="text-3xl font-serif italic mb-8">Admin Access</h3>
              <form onSubmit={handleAdminLogin} className="space-y-6">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-2">ID Admin</label>
                  <input 
                    type="text" 
                    value={adminCreds.id}
                    onChange={(e) => setAdminCreds({ ...adminCreds, id: e.target.value })}
                    className="w-full border-b border-gray-200 py-3 focus:border-black outline-none transition-colors text-sm"
                    placeholder="ID"
                    autoFocus
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400 block mb-2">Password</label>
                  <input 
                    type="password" 
                    value={adminCreds.pw}
                    onChange={(e) => setAdminCreds({ ...adminCreds, pw: e.target.value })}
                    className="w-full border-b border-gray-200 py-3 focus:border-black outline-none transition-colors text-sm"
                    placeholder="••••••••"
                    required
                  />
                </div>
                {adminLoginError && (
                  <p className="text-[10px] text-red-500 font-bold uppercase tracking-widest">Kredensial tidak valid</p>
                )}
                <div className="pt-4 flex flex-col gap-4">
                  <button 
                    type="submit"
                    className="w-full py-4 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors rounded-sm"
                  >
                    Masuk Sekarang
                  </button>
                  <button 
                    type="button"
                    onClick={() => setShowAdminLogin(false)}
                    className="w-full py-4 text-xs font-bold uppercase tracking-widest text-gray-400 hover:text-black transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Booking Modal (Clean Minimalism Redesign) */}
      <AnimatePresence>
        {isBookingModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={resetBooking}
              className="absolute inset-0 bg-white/95 backdrop-blur-xl" 
            />
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="relative w-full h-full md:grid md:grid-cols-[400px_1fr] lg:grid-cols-[450px_1fr] overflow-hidden bg-white"
            >
              {/* Left Column: Progress & Package Specs */}
              <section className="bg-gray-50 border-r border-gray-100 p-8 md:p-12 lg:p-20 flex flex-col overflow-y-auto no-scrollbar">
                <button 
                  onClick={resetBooking}
                  className="group flex items-center gap-3 text-xs font-bold uppercase tracking-widest mb-12 md:mb-20 hover:text-gray-400 transition-colors"
                >
                  <X className="w-4 h-4" /> Tutup
                </button>

                <div className="space-y-12 md:space-y-20 flex-grow">
                  {/* Step Display */}
                  <div>
                    <span className="text-[10px] sm:text-xs font-bold text-gray-400 uppercase tracking-widest block mb-4">Langkah 0{step} / 04</span>
                    <h2 className="text-3xl md:text-4xl font-serif italic">
                      {step === 1 && "Pilih Pengalaman"}
                      {step === 2 && "Pilih Tanggal"}
                      {step === 3 && "Pilih Slot Waktu"}
                      {step === 4 && "Lengkapi Detail"}
                    </h2>
                  </div>

                  {/* Summary Card */}
                  {selectedPackage && (
                    <motion.div 
                      layout
                      className="space-y-10"
                    >
                      <div className="space-y-4">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-400 block">Koleksi Terpilih</label>
                        <h4 className="text-2xl font-bold uppercase tracking-tight">{selectedPackage.name}</h4>
                        <p className="text-xs text-gray-500 italic leading-relaxed">{selectedPackage.description}</p>
                      </div>

                      {selectedDate && (
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-gray-400 block">Tanggal & Waktu</label>
                          <p className="text-sm font-mono">{format(selectedDate, 'dd MMM yyyy')} {selectedTime ? `@ ${selectedTime}` : ''}</p>
                        </div>
                      )}

                      <div className="pt-10 border-t border-gray-100">
                        <label className="text-xs font-bold uppercase tracking-widest text-gray-400 block mb-2">Total Investasi</label>
                        <p className="text-4xl font-mono font-bold tracking-tighter">{formatCurrency(selectedPackage.price)}</p>
                      </div>
                    </motion.div>
                  )}
                </div>

                {/* Studio Occupancy (Mock for theme) */}
                <div className="mt-auto">
                  <h4 className="text-sm font-bold uppercase mb-3 tracking-widest opacity-40">Kepadatan Jadwal</h4>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="flex-1 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div className="w-[85%] h-full bg-black"></div>
                    </div>
                    <span className="text-xs font-mono text-gray-500">85%</span>
                  </div>
                  <p className="text-xs text-gray-400 italic">Sangat diminati. Segera amankan slot Anda.</p>
                </div>
              </section>

              {/* Right Column: Interaction Flow */}
              <section className="bg-white p-8 md:p-12 lg:p-24 overflow-y-auto no-scrollbar flex flex-col">
                <div className="max-w-xl self-center w-full my-auto">
                  {bookingSuccess ? (
                    <motion.div 
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="text-center pt-8 md:pt-0"
                    >
                      <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-10 mx-auto">
                        <Check className="w-6 h-6 text-green-600" />
                      </div>
                      <h3 className="text-3xl md:text-4xl font-serif italic mb-2">Dikonfirmasi.</h3>
                      <p className="text-sm font-bold uppercase tracking-[0.2em] mb-10 text-gray-400">Selamat datang, {clientInfo.name}</p>
                      
                      <div className="mb-10 p-8 border border-gray-100 rounded-sm text-left inline-block w-full max-w-md bg-gray-50/50">
                        <div className="flex justify-between items-center mb-8">
                          <span className="text-xs font-bold uppercase tracking-[0.2em] text-gray-400">Ringkasan Sesi</span>
                          <div className="text-xs font-mono font-bold px-3 py-1 bg-black text-white rounded-full">
                            ID: {bookingSuccess}
                          </div>
                        </div>
                        
                        <div className="space-y-5">
                          <div className="flex justify-between items-start gap-4">
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-300">Paket</span>
                            <span className="text-sm font-bold uppercase text-right leading-tight max-w-[200px]">{selectedPackage?.name}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-300">Tanggal</span>
                            <span className="text-sm font-mono">{selectedDate && format(selectedDate, 'dd MMM yyyy')}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-bold uppercase tracking-widest text-gray-300">Waktu</span>
                            <span className="text-sm font-mono">{selectedTime}</span>
                          </div>
                          <div className="pt-8 mt-4 border-t border-gray-100">
                             <div className="flex justify-between items-center mb-4">
                               <span className="text-xs font-bold uppercase tracking-widest text-gray-300">Referensi Pemesanan</span>
                               <button 
                                 onClick={() => {
                                   navigator.clipboard.writeText(bookingSuccess);
                                   setCopied(true);
                                   setTimeout(() => setCopied(false), 2000);
                                 }}
                                 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest px-3 py-1 bg-white border border-gray-100 rounded-full hover:border-black transition-all"
                               >
                                 {copied ? <Check className="w-2.5 h-2.5" /> : <Copy className="w-2.5 h-2.5" />}
                                 {copied ? 'Tersalin' : 'Salin ID'}
                               </button>
                             </div>
                             <div className="p-4 bg-white border border-gray-100 flex items-center justify-center">
                                <span className="text-2xl font-mono font-bold tracking-[0.2em] text-black">
                                  {bookingSuccess}
                                </span>
                             </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-black p-6 rounded-sm mb-12 flex items-center gap-4 text-left">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse shadow-[0_0_8px_rgba(74,222,128,0.5)]"></div>
                        <p className="text-xs text-white font-bold uppercase tracking-[0.2em]">Mengalihkan ke WhatsApp untuk instruksi...</p>
                      </div>

                      <button 
                        onClick={resetBooking}
                        className="w-full py-5 border border-black rounded-full text-xs font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all"
                      >
                        Kembali ke Profil
                      </button>
                    </motion.div>
                  ) : (
                    <AnimatePresence mode="wait">
                      {step === 1 && (
                        <motion.div 
                          key="step1"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-12"
                        >
                          <div className="grid grid-cols-1 gap-6">
                            {packages.length > 0 ? (
                              packages.map(pkg => (
                                <button
                                  key={pkg.id}
                                  onClick={() => { setSelectedPackage(pkg); setStep(2); }}
                                  className={cn(
                                    "group text-left p-8 border transition-all duration-300",
                                    selectedPackage?.id === pkg.id 
                                      ? "bg-black text-white border-black" 
                                      : "border-gray-100 hover:border-black"
                                  )}
                                >
                                  <div className="flex justify-between items-center mb-4">
                                    <div className="flex flex-col">
                                      <span className="text-[8px] font-bold uppercase tracking-widest text-gray-400 mb-1 group-hover:text-gray-300">{pkg.category}</span>
                                      <span className="font-bold uppercase text-sm tracking-tight">{pkg.name}</span>
                                    </div>
                                    <span className="text-xs font-mono opacity-60 group-hover:opacity-100">{formatCurrency(pkg.price)}</span>
                                  </div>
                                  <p className={cn("text-xs leading-relaxed", selectedPackage?.id === pkg.id ? "text-gray-400" : "text-gray-500")}>
                                    {pkg.description}
                                  </p>
                                </button>
                              ))
                            ) : (
                              <div className="text-center py-20 border border-dashed border-gray-100 rounded-sm bg-gray-50/50">
                                <Camera className="w-10 h-10 text-gray-200 mx-auto mb-4" />
                                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Collections currently offline</p>
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}

                      {step === 2 && (
                        <motion.div 
                          key="step2"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                        >
                          <CalendarPicker onSelect={(date) => { setSelectedDate(date); setStep(3); }} selectedDate={selectedDate} />
                          <button onClick={() => setStep(1)} className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 hover:opacity-100 mt-12 flex items-center gap-2">
                             Kembali ke Layanan
                          </button>
                        </motion.div>
                      )}

                      {step === 3 && (
                        <motion.div 
                          key="step3"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-12"
                        >
                           <div className="grid grid-cols-3 gap-3">
                            {getAvailableSlots().map(time => {
                              const isTaken = unavailableSlots.includes(time);
                              return (
                                <button
                                  key={time}
                                  disabled={isTaken}
                                  onClick={() => { setSelectedTime(time); setStep(4); }}
                                  className={cn(
                                    "py-4 border text-[11px] font-mono transition-all",
                                    selectedTime === time 
                                      ? "bg-black border-black text-white" 
                                      : isTaken 
                                        ? "opacity-10 bg-gray-50 cursor-not-allowed line-through" 
                                        : "border-gray-100 hover:border-black"
                                  )}
                                >
                                  {time}
                                </button>
                              );
                            })}
                          </div>
                          <button onClick={() => setStep(2)} className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 hover:opacity-100 mt-4 flex items-center gap-2">
                             Ubah Tanggal
                          </button>
                        </motion.div>
                      )}

                      {step === 4 && (
                        <motion.div 
                          key="step4"
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          className="space-y-12"
                        >
                          <div className="space-y-8">                            <div className="space-y-2">
                              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 block">Identitas Lengkap</label>
                              <input 
                                value={clientInfo.name}
                                onChange={e => setClientInfo({ ...clientInfo, name: e.target.value })}
                                placeholder="Cth. Julian Alvarez" 
                                className="w-full border-b border-gray-200 py-4 text-sm focus:border-black outline-none bg-transparent transition-colors font-medium" 
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 block">Nomor WhatsApp</label>
                              <input 
                                value={clientInfo.phone}
                                type="tel"
                                onChange={e => setClientInfo({ ...clientInfo, phone: e.target.value })}
                                placeholder="62812..." 
                                className="w-full border-b border-gray-200 py-4 text-sm focus:border-black outline-none bg-transparent transition-colors font-medium" 
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-xs font-bold uppercase tracking-widest text-gray-400 block">Saluran Komunikasi (Email)</label>
                              <input 
                                value={clientInfo.email}
                                type="email"
                                onChange={e => setClientInfo({ ...clientInfo, email: e.target.value })}
                                placeholder="nama@domain.com" 
                                className="w-full border-b border-gray-200 py-4 text-sm focus:border-black outline-none bg-transparent transition-colors font-medium" 
                              />
                            </div>
                          </div>
                          
                          <div className="pt-10 flex flex-col gap-6">
                            <button 
                              disabled={isSubmitting || !clientInfo.name || !clientInfo.phone}
                              onClick={handleBooking}
                              className="w-full py-6 bg-black text-white rounded-full font-bold uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-4 hover:bg-gray-900 transition-all shadow-2xl shadow-black/20 disabled:opacity-30"
                            >
                              {isSubmitting ? 'Memproses...' : 'Selesaikan Reservasi'}
                              <ChevronRight className="w-4 h-4" />
                            </button>
                            <button onClick={() => setStep(3)} className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-40 hover:opacity-100 flex items-center gap-2 self-center">
                              Sesuaikan Jadwal
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  )}
                </div>
              </section>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CalendarPicker({ onSelect, selectedDate }: { onSelect: (date: Date) => void, selectedDate: Date | null }) {
  const [currentMonth, setCurrentMonth] = React.useState(new Date());
  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });

  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const prevMonth = () => setCurrentMonth(addMonths(currentMonth, -1));

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-10">
        <h4 className="font-serif italic text-2xl">{format(currentMonth, 'MMMM yyyy')}</h4>
        <div className="flex gap-4">
          <button onClick={prevMonth} className="w-10 h-10 border border-gray-100 flex items-center justify-center hover:border-black transition-colors rounded-sm"><ChevronRight className="w-4 h-4 rotate-180" /></button>
          <button onClick={nextMonth} className="w-10 h-10 border border-gray-100 flex items-center justify-center hover:border-black transition-colors rounded-sm"><ChevronRight className="w-4 h-4" /></button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1">
        {['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'].map(d => (
          <div key={d} className="text-center text-xs uppercase font-bold text-gray-300 py-4">{d}</div>
        ))}
        {Array.from({ length: days[0].getDay() === 0 ? 6 : days[0].getDay() - 1 }).map((_, i) => <div key={`empty-${i}`} />)}
        {days.map(day => {
          const disabled = !isAfter(day, startOfDay(new Date())) && !isToday(day);
          const isSelected = isSameDay(day, selectedDate || new Date(0));
          return (
            <button
              key={day.toISOString()}
              disabled={disabled}
              onClick={() => onSelect(day)}
              className={cn(
                "h-14 w-full flex items-center justify-center text-xs font-mono transition-all rounded-sm",
                isSelected ? "bg-black text-white font-bold" : "hover:bg-gray-50",
                disabled && "opacity-10 cursor-not-allowed",
                isToday(day) && !isSelected && "border border-black font-bold"
              )}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>
    </div>
  );
}
function AdminSection({ onForceSeed, config, setConfig, onShowcaseUpdate, showcaseData }: { onForceSeed: () => void, config: StudioConfig | null, setConfig: (cfg: StudioConfig) => void, onShowcaseUpdate: () => void, showcaseData: ShowcaseImage[] }) {
  const [bookings, setBookings] = React.useState<Booking[]>([]);
  const [packages, setPackages] = React.useState<Package[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState<'bookings' | 'packages' | 'showcase'>('bookings');
  const [isEditingConfig, setIsEditingConfig] = React.useState(false);
  const [isAddingPackage, setIsAddingPackage] = React.useState(false);
  const [isAddingShowcase, setIsAddingShowcase] = React.useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = React.useState<string | null>(null);
  const [editingPackageId, setEditingPackageId] = React.useState<string | null>(null);
  const [expandedBookingId, setExpandedBookingId] = React.useState<string | null>(null);
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadProgress, setUploadProgress] = React.useState(0);
  
  // Filtering states
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<Booking['status'] | 'all'>('all');

  const [editConfig, setEditConfig] = React.useState<StudioConfig>({
    studioName: config?.studioName || '',
    whatsappNumber: config?.whatsappNumber || '',
    aboutText: config?.aboutText || '',
    instagramHandle: config?.instagramHandle || '',
    openingTime: config?.openingTime || '09:00',
    closingTime: config?.closingTime || '20:00'
  });
  const [newPkg, setNewPkg] = React.useState<Partial<Package>>({
    name: '',
    description: '',
    price: 0,
    duration: 30,
    features: [],
    category: 'Self-Photo'
  });
  const [newShowcase, setNewShowcase] = React.useState<Partial<ShowcaseImage>>({
    title: '',
    category: '',
    aspectRatio: 'portrait'
  });
  const [featureInput, setFeatureInput] = React.useState('');
  const [imageFile, setImageFile] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Maaf, ukuran foto maksimal adalah 2MB.');
        e.target.value = ''; // Reset input
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const addFeature = () => {
    if (featureInput.trim()) {
      setNewPkg(prev => ({
        ...prev,
        features: [...(prev.features || []), featureInput.trim()]
      }));
      setFeatureInput('');
    }
  };

  const removeFeature = (index: number) => {
    setNewPkg(prev => ({
      ...prev,
      features: (prev.features || []).filter((_, i) => i !== index)
    }));
  };

  React.useEffect(() => {
    async function load() {
      const [bookingsData, packagesData] = await Promise.all([
        getBookings(),
        getPackages()
      ]);
      setBookings(bookingsData);
      setPackages(packagesData);
      setLoading(false);
    }
    load();
  }, []);

  const handleUpdateStatus = async (id: string, status: Booking['status']) => {
    await updateBookingStatus(id, status);
    const updatedBookings = bookings.map(b => b.id === id ? { ...b, status } : b);
    setBookings(updatedBookings);
    
    // WhatsApp notification on confirmation
    if (status === 'confirmed') {
      const b = updatedBookings.find(item => item.id === id);
      if (b) {
        const message = `Halo ${b.clientName}!\n\nKami menginformasikan bahwa pesanan booking studio Anda telah DIKONFIRMASI ✅\n\nDetail Reservasi:\n🆔 ID: ${b.id}\n📸 Paket: ${b.packageName}\n📅 Tanggal: ${b.date}\n⏰ Jam: ${b.startTime} - ${b.endTime}\n💰 Total: ${formatCurrency(b.totalPrice)}\n\nSampai jumpa di ${config?.studioName || 'Lumina Studio'}!\nHarap datang 10 menit sebelum jadwal. Terima kasih.`;
        const link = generateWhatsAppLink(b.clientPhone, message);
        window.open(link, '_blank');
      }
    }
  };

  // Stats calculation
  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'pending').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    completed: bookings.filter(b => b.status === 'completed').length,
    revenue: bookings.filter(b => b.status === 'completed' || b.status === 'confirmed').reduce((sum, b) => sum + b.totalPrice, 0)
  };

  // Filtered bookings
  const filteredBookings = bookings.filter(b => {
    const matchesSearch = b.clientName.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          b.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          b.clientPhone.includes(searchQuery);
    const matchesFilter = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesFilter;
  });

  const handleSaveConfig = async () => {
    try {
      setIsUploading(true);
      await saveStudioConfig(editConfig);
      alert('Konfigurasi Studio berhasil disimpan ke Cloud Database.');
      setIsEditingConfig(false);
      // Update global config state without page reload
      setConfig(editConfig);
    } catch (e) {
      console.error(e);
      alert('Gagal menyimpan ke database cloud.');
    } finally {
      setIsUploading(false);
    }
  };

  const [localShowcase, setLocalShowcase] = React.useState<ShowcaseImage[]>(showcaseData);

  React.useEffect(() => {
    setLocalShowcase(showcaseData);
  }, [showcaseData]);

  const handleDeleteShowcase = React.useCallback(async (id: string) => {
    try {
      setIsUploading(true);
      await deleteShowcaseImage(id);
      await onShowcaseUpdate();
      setConfirmDeleteId(null);
    } catch (e) {
      console.error("Delete failed:", e);
      alert('Gagal menghapus foto.');
    } finally {
      setIsUploading(false);
    }
  }, [onShowcaseUpdate]);

  const handleSaveShowcase = async () => {
    if (!imageFile && !newShowcase.url) {
      alert("Pilih foto terlebih dahulu.");
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(10);
    
    try {
      let url = newShowcase.url || '';
      if (imageFile) {
        setUploadProgress(40);
        url = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(imageFile);
        });
        setUploadProgress(80);
      }

      await addShowcaseImage({
        url,
        title: newShowcase.title,
        category: newShowcase.category,
        aspectRatio: newShowcase.aspectRatio as any,
      });

      await onShowcaseUpdate();
      setIsAddingShowcase(false);
      setNewShowcase({ title: '', category: '', aspectRatio: 'portrait' });
      setImageFile(null);
      setImagePreview(null);
      setUploadProgress(100);
    } catch (e) {
      console.error(e);
      alert('Gagal menyimpan foto.');
    } finally {
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
    }
  };

  const handleSavePackage = async () => {
    if (!newPkg.name || !newPkg.price) {
      alert("Name and Price are required.");
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(10);
    
    try {
      const id = editingPackageId || newPkg.name.toLowerCase().replace(/\s+/g, '-');
      let imageUrl = newPkg.imageUrl || '';

      if (imageFile) {
        setUploadProgress(30);
        // Convert to Base64 for local storage (limited size but works for demo/local)
        imageUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(imageFile);
        });
        setUploadProgress(80);
      }

      const fullPkg = { ...newPkg, id, imageUrl } as Package;
      await savePackage(fullPkg);
      
      const updatedPackages = await getPackages();
      setPackages(updatedPackages);
      setIsAddingPackage(false);
      setEditingPackageId(null);
      setNewPkg({ name: '', description: '', price: 0, duration: 30, features: [], category: 'Self-Photo' });
      setImageFile(null);
      setImagePreview(null);
      setUploadProgress(0);
      alert('Package integrated to local database.');
    } catch (e) {
      console.error('Logic Failure:', e);
      alert(`Integration failed: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditPackage = (pkg: Package) => {
    setNewPkg(pkg);
    setEditingPackageId(pkg.id);
    setImagePreview(pkg.imageUrl || null);
    setIsAddingPackage(true);
  };

  const handleDeletePackage = async (id: string) => {
    if (!confirm('Are you sure you want to delete this package?')) return;
    try {
      await deletePackage(id);
      const updated = await getPackages();
      alert('Package deleted.');
      setPackages(updated);
    } catch (e) {
      console.error(e);
      alert('Failed to delete package.');
    }
  };

  if (loading) return <div className="p-40 text-center text-[10px] uppercase font-bold tracking-[0.3em] opacity-30">Decrypting Entries...</div>;

  return (
    <div className="p-6 md:p-20 max-w-[1400px] mx-auto min-h-screen">
      {!config && (
        <div className="mb-10 p-6 md:p-10 border border-black rounded-sm bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h4 className="font-bold uppercase text-xs mb-1">Studio Not Initialized</h4>
            <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-relaxed">The database appears to be empty. Run the setup to populate base collections.</p>
          </div>
          <button 
            onClick={onForceSeed}
            className="w-full md:w-auto px-6 py-3 bg-black text-white text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
          >
            Run Initial Setup
          </button>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-10 mb-20">
        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-4">Operasional</span>
          <h1 className="text-4xl md:text-5xl font-serif italic mb-2 leading-tight">Kontrol Master</h1>
          <div className="flex flex-wrap gap-x-8 gap-y-4 mt-6">
            <button 
              onClick={() => setActiveTab('bookings')}
              className={cn(
                "text-[10px] font-bold uppercase tracking-widest pb-2 transition-all border-b-2",
                activeTab === 'bookings' ? "border-black text-black" : "border-transparent text-gray-300"
              )}
            >
              Pesanan
            </button>
            <button 
              onClick={() => setActiveTab('packages')}
              className={cn(
                "text-[10px] font-bold uppercase tracking-widest pb-2 transition-all border-b-2",
                activeTab === 'packages' ? "border-black text-black" : "border-transparent text-gray-300"
              )}
            >
              Paket
            </button>
            <button 
              onClick={() => setActiveTab('showcase')}
              className={cn(
                "text-[10px] font-bold uppercase tracking-widest pb-2 transition-all border-b-2",
                activeTab === 'showcase' ? "border-black text-black" : "border-transparent text-gray-300"
              )}
            >
              Showcase
            </button>
          </div>
        </div>
        <button 
          onClick={() => setIsEditingConfig(!isEditingConfig)}
          className="px-6 py-3 border border-black rounded-sm text-[10px] font-bold uppercase tracking-widest hover:bg-black hover:text-white transition-all shadow-lg shadow-black/5"
        >
          {isEditingConfig ? 'Batal Edit' : 'Edit Info Studio'}
        </button>
      </div>

      {isEditingConfig && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-20 p-10 border border-black bg-white space-y-10"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Nama Studio</label>
              <input 
                value={editConfig.studioName}
                onChange={e => setEditConfig({...editConfig, studioName: e.target.value})}
                className="w-full border-b border-gray-200 py-3 text-sm focus:border-black outline-none bg-transparent"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">WhatsApp Number</label>
              <input 
                value={editConfig.whatsappNumber}
                onChange={e => setEditConfig({...editConfig, whatsappNumber: e.target.value})}
                className="w-full border-b border-gray-200 py-3 text-sm focus:border-black outline-none bg-transparent"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Instagram Handle</label>
              <input 
                value={editConfig.instagramHandle}
                onChange={e => setEditConfig({...editConfig, instagramHandle: e.target.value})}
                placeholder="@studio_name"
                className="w-full border-b border-gray-200 py-3 text-sm focus:border-black outline-none bg-transparent"
              />
            </div>
            <div className="grid grid-cols-2 gap-10">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Opening Time</label>
                <input 
                  type="time"
                  value={editConfig.openingTime}
                  onChange={e => setEditConfig({...editConfig, openingTime: e.target.value})}
                  className="w-full border-b border-gray-200 py-3 text-sm focus:border-black outline-none bg-transparent font-mono"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Closing Time</label>
                <input 
                  type="time"
                  value={editConfig.closingTime}
                  onChange={e => setEditConfig({...editConfig, closingTime: e.target.value})}
                  className="w-full border-b border-gray-200 py-3 text-sm focus:border-black outline-none bg-transparent font-mono"
                />
              </div>
            </div>
            <div className="col-span-2 space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-gray-400">About Narrative</label>
              <textarea 
                value={editConfig.aboutText}
                onChange={e => setEditConfig({...editConfig, aboutText: e.target.value})}
                className="w-full border-b border-gray-200 py-3 text-sm focus:border-black outline-none bg-transparent min-h-[100px]"
              />
            </div>
            
            {/* Admin Credentials Control */}
            <div className="col-span-2 pt-10 border-t border-gray-100">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-6">Keamanan Akses Admin</span>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400">ID Admin Baru</label>
                  <input 
                    value={editConfig.adminId || ''}
                    onChange={e => setEditConfig({...editConfig, adminId: e.target.value})}
                    placeholder="ID untuk login"
                    className="w-full border-b border-gray-200 py-3 text-sm focus:border-black outline-none bg-transparent"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400">Password Admin Baru</label>
                  <input 
                    type="text"
                    value={editConfig.adminPw || ''}
                    onChange={e => setEditConfig({...editConfig, adminPw: e.target.value})}
                    placeholder="Password untuk login"
                    className="w-full border-b border-gray-200 py-3 text-sm focus:border-black outline-none bg-transparent"
                  />
                </div>
              </div>
              <p className="mt-4 text-[9px] text-gray-400 uppercase tracking-widest italic">Hati-hati: Perubahan ini akan mengganti kredensial akses "Alt + `" Anda.</p>
            </div>
          </div>
          <button 
            onClick={handleSaveConfig}
            className="w-full py-4 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors"
          >
            Save Studio Changes
          </button>
        </motion.div>
      )}

      {activeTab === 'bookings' ? (
        <div className="space-y-10">
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
            <div className="p-6 border border-gray-100 rounded-sm bg-white">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Total Pesanan</span>
              <div className="text-2xl font-mono font-bold tracking-tighter">{stats.total}</div>
            </div>
            <div className="p-6 border border-gray-100 rounded-sm bg-yellow-50/30">
              <span className="text-[10px] font-bold text-yellow-600/60 uppercase tracking-widest block mb-2">Pending</span>
              <div className="text-2xl font-mono font-bold tracking-tighter text-yellow-700/80">{stats.pending}</div>
            </div>
            <div className="p-6 border border-gray-100 rounded-sm bg-green-50/30">
              <span className="text-[10px] font-bold text-green-600/60 uppercase tracking-widest block mb-2">Dikonfirmasi</span>
              <div className="text-2xl font-mono font-bold tracking-tighter text-green-700/80">{stats.confirmed}</div>
            </div>
            <div className="p-6 border border-gray-100 rounded-sm bg-black text-white">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Selesai</span>
              <div className="text-2xl font-mono font-bold tracking-tighter">{stats.completed}</div>
            </div>
            <div className="p-6 border border-gray-100 rounded-sm bg-white col-span-2 md:col-span-1">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest block mb-2">Estimasi Omzet</span>
              <div className="text-2xl font-mono font-bold tracking-tighter">{formatCurrency(stats.revenue)}</div>
            </div>
          </div>

          {/* Filtering Bar */}
          <div className="flex flex-col md:flex-row gap-6 justify-between items-center bg-white p-6 border border-gray-100 rounded-sm">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
              <input 
                type="text" 
                placeholder="Cari Nama, ID, atau No HP..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-gray-50/50 border border-transparent focus:border-black focus:bg-white outline-none rounded-sm text-sm transition-all"
              />
            </div>
            <div className="flex gap-2 w-full md:w-auto overflow-x-auto no-scrollbar pb-1 md:pb-0">
              {(['all', 'pending', 'confirmed', 'completed', 'cancelled'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={cn(
                    "px-4 py-2 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all whitespace-nowrap",
                    statusFilter === f 
                      ? "bg-black text-white" 
                      : "bg-gray-50 text-gray-400 hover:bg-gray-100 hover:text-black"
                  )}
                >
                  {f === 'all' ? 'Semua' : 
                   f === 'pending' ? 'Pending' : 
                   f === 'confirmed' ? 'Dikonfirmasi' : 
                   f === 'completed' ? 'Selesai' : 'Batal'}
                </button>
              ))}
            </div>
          </div>

          <div className="border border-gray-100 overflow-hidden rounded-sm bg-white">
            <div className="overflow-x-auto no-scrollbar">
              <table className="w-full text-left border-collapse min-w-[1000px]">
                <thead>
                  <tr className="bg-gray-50 text-xs uppercase tracking-[0.2em] font-bold text-gray-400">
                    <th className="px-6 md:px-10 py-6 border-b border-gray-100">Tanggal</th>
                    <th className="px-6 md:px-10 py-6 border-b border-gray-100">Nama</th>
                    <th className="px-6 md:px-10 py-6 border-b border-gray-100">No Whatsapp</th>
                    <th className="px-6 md:px-10 py-6 border-b border-gray-100">Paket</th>
                    <th className="px-6 md:px-10 py-6 border-b border-gray-100">Status</th>
                    <th className="px-6 md:px-10 py-6 border-b border-gray-100 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filteredBookings.length === 0 ? (
                    <tr><td colSpan={6} className="px-6 md:px-10 py-32 text-center text-xs uppercase font-bold tracking-widest opacity-20 italic">Tidak ada data pemesanan yang cocok.</td></tr>
                  ) : (
                    filteredBookings.map(b => (
                      <React.Fragment key={b.id}>
                        <tr 
                          onClick={() => setExpandedBookingId(expandedBookingId === b.id ? null : b.id)}
                          className={cn(
                            "group hover:bg-gray-50/50 transition-colors cursor-pointer border-b border-gray-50",
                            expandedBookingId === b.id && "bg-gray-50/80"
                          )}
                        >
                          <td className="px-6 md:px-10 py-8">
                            <div className="text-sm md:text-base font-mono font-bold">{b.date}</div>
                            <div className="text-[10px] uppercase font-bold opacity-30 mt-1">{b.startTime}</div>
                          </td>
                          <td className="px-6 md:px-10 py-8">
                            <div className="text-sm md:text-base font-bold uppercase tracking-tight">{b.clientName}</div>
                            <div className="text-[9px] font-mono text-gray-300 uppercase tracking-widest mt-1">ID: {b.id}</div>
                          </td>
                          <td className="px-6 md:px-10 py-8">
                            <div className="flex items-center gap-2 group/wa">
                              <div className="text-xs md:text-sm font-mono font-medium text-gray-500">{b.clientPhone}</div>
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  window.open(`https://wa.me/${b.clientPhone}`, '_blank');
                                }}
                                className="opacity-0 group-hover:opacity-100 group-hover/wa:text-green-500 transition-all p-1"
                              >
                                <ArrowUpRight className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                          <td className="px-6 md:px-10 py-8">
                            <div className="text-[10px] md:text-xs font-bold uppercase tracking-widest">{b.packageName}</div>
                            <div className="text-[10px] font-mono opacity-30 mt-1">{formatCurrency(b.totalPrice)}</div>
                          </td>
                          <td className="px-6 md:px-10 py-8">
                            <span className={cn(
                              "px-3 md:px-4 py-1 md:py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest inline-block text-center min-w-[80px]",
                              b.status === 'pending' && "bg-yellow-50 text-yellow-600 border border-yellow-100",
                              b.status === 'confirmed' && "bg-black text-white",
                              b.status === 'completed' && "bg-green-50 text-green-600 border border-green-100",
                              b.status === 'cancelled' && "bg-red-50 text-red-500 border border-red-100",
                            )}>
                              {b.status === 'pending' ? 'Tunda' : 
                               b.status === 'confirmed' ? 'Dikonfirmasi' :
                               b.status === 'completed' ? 'Selesai' : 'Dibatalkan'}
                            </span>
                          </td>
                          <td className="px-6 md:px-10 py-8 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex justify-end gap-3">
                              {b.status === 'pending' && (
                                <button 
                                  onClick={() => handleUpdateStatus(b.id, 'confirmed')}
                                  className="px-4 py-2 bg-black text-white text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-all rounded-sm shadow-sm"
                                >
                                  Konfirmasi
                                </button>
                              )}
                              {b.status === 'confirmed' && (
                                <button 
                                  onClick={() => handleUpdateStatus(b.id, 'completed')}
                                  className="px-4 py-2 bg-green-500 text-white text-[10px] font-bold uppercase tracking-widest hover:bg-green-600 transition-all rounded-sm shadow-sm"
                                >
                                  Selesai
                                </button>
                              )}
                              {b.status !== 'cancelled' && b.status !== 'completed' && (
                                <button 
                                  onClick={() => handleUpdateStatus(b.id, 'cancelled')}
                                  className="px-4 py-2 border border-gray-100 text-gray-400 hover:text-red-500 hover:border-red-500 text-[10px] font-bold uppercase tracking-widest transition-all rounded-sm"
                                >
                                  Batalkan
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                        {expandedBookingId === b.id && (
                          <tr className="bg-gray-50/40 border-b border-gray-100">
                            <td colSpan={6} className="px-10 py-10">
                              <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                className="grid grid-cols-1 md:grid-cols-3 gap-12"
                              >
                                <div className="space-y-4">
                                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Kontak Client</label>
                                  <div className="space-y-2">
                                    <p className="text-sm font-medium">{b.clientEmail || 'Tidak ada email'}</p>
                                    <button 
                                      onClick={() => window.open(`https://wa.me/${b.clientPhone}`, '_blank')}
                                      className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-green-600 hover:underline"
                                    >
                                      Chat via WhatsApp
                                      <ArrowUpRight className="w-3 h-3" />
                                    </button>
                                  </div>
                                </div>
                                <div className="space-y-4">
                                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Rincian Waktu</label>
                                  <div className="space-y-2">
                                    <p className="text-sm font-mono">{b.startTime} — {b.endTime}</p>
                                    <p className="text-xs text-gray-400 italic">Dibuat pada: {new Date(b.createdAt).toLocaleString()}</p>
                                  </div>
                                </div>
                                <div className="space-y-4">
                                  <label className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-400">Status & Pembayaran</label>
                                  <div className="space-y-3 pt-2 border-t border-gray-100">
                                    <div className="flex justify-between text-xs">
                                      <span className="text-gray-400 uppercase tracking-widest">Harga Paket</span>
                                      <span className="font-mono">{formatCurrency(b.totalPrice)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs font-bold pt-3 border-t border-gray-200">
                                      <span className="uppercase tracking-widest text-black">Total Tagihan</span>
                                      <span className="font-mono">{formatCurrency(b.totalPrice)}</span>
                                    </div>
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'packages' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isAddingPackage ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="border border-black p-10 bg-white space-y-6"
            >
              <h4 className="text-xs font-bold uppercase tracking-widest text-black mb-4">Fragment Koleksi Baru</h4>
              
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Identifikasi Visual</label>
                    <div className="flex items-center gap-4">
                      {imagePreview && (
                        <div className="w-20 h-20 border border-gray-100 rounded-sm overflow-hidden bg-gray-50">
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="space-y-2">
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleImageChange}
                          className="text-[10px] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800"
                        />
                        <p className="text-[8px] text-gray-400">Max size: 2MB</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Judul</label>
                  <input 
                    value={newPkg.name}
                    onChange={e => setNewPkg({...newPkg, name: e.target.value})}
                    placeholder="Signature Portrait"
                    className="w-full border-b border-gray-100 py-2 text-sm focus:border-black outline-none"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Narasi</label>
                  <textarea 
                    value={newPkg.description}
                    onChange={e => setNewPkg({...newPkg, description: e.target.value})}
                    placeholder="Deskripsi singkat yang puitis..."
                    className="w-full border-b border-gray-100 py-2 text-sm focus:border-black outline-none min-h-[60px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Nilai (IDR)</label>
                    <input 
                      type="number"
                      value={newPkg.price}
                      onChange={e => setNewPkg({...newPkg, price: Number(e.target.value)})}
                      className="w-full border-b border-gray-100 py-2 text-sm focus:border-black outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Durasi (Menit)</label>
                    <input 
                      type="number"
                      value={newPkg.duration}
                      onChange={e => setNewPkg({...newPkg, duration: Number(e.target.value)})}
                      className="w-full border-b border-gray-100 py-2 text-sm focus:border-black outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Kategori</label>
                  <select 
                    value={newPkg.category}
                    onChange={e => setNewPkg({...newPkg, category: e.target.value as any})}
                    className="w-full border-b border-gray-100 py-2 text-sm focus:border-black outline-none bg-transparent"
                  >
                    <option value="Self-Photo">Self-Photo</option>
                    <option value="Profesional">Profesional</option>
                    <option value="Event">Event</option>
                    <option value="Spesial">Spesial</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Fitur</label>
                  <div className="flex gap-2">
                    <input 
                      value={featureInput}
                      onChange={e => setFeatureInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addFeature())}
                      placeholder="Tambah fitur..."
                      className="flex-1 border-b border-gray-100 py-2 text-sm focus:border-black outline-none"
                    />
                    <button 
                      onClick={(e) => { e.preventDefault(); addFeature(); }}
                      className="px-3 bg-gray-50 text-xs font-bold"
                    >
                      +
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {newPkg.features?.map((f, i) => (
                      <span key={i} className="flex items-center gap-2 bg-gray-50 px-2 py-1 text-xs font-mono group">
                        {f}
                        <button onClick={() => removeFeature(i)} className="text-gray-300 hover:text-black">×</button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <button 
                  onClick={handleSavePackage}
                  disabled={isUploading}
                  className="flex-1 py-3 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50 relative overflow-hidden"
                >
                  {isUploading && (
                    <div 
                      className="absolute left-0 top-0 bottom-0 bg-green-600/30 transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  )}
                  <span className="relative z-10">
                    {isUploading 
                      ? `Memproses (${uploadProgress.toFixed(0)}%)` 
                      : (editingPackageId ? 'Perbarui Fragmen' : 'Integrasikan')}
                  </span>
                </button>
                <button 
                  onClick={() => {
                    setIsAddingPackage(false);
                    setEditingPackageId(null);
                    setNewPkg({ name: '', description: '', price: 0, duration: 30, features: [], category: 'Self-Photo' });
                    setImageFile(null);
                    setImagePreview(null);
                  }}
                  className="px-6 py-3 border border-gray-100 text-xs font-bold uppercase tracking-widest hover:bg-gray-50"
                >
                  Batal
                </button>
              </div>
            </motion.div>
          ) : (
            <div 
              onClick={() => setIsAddingPackage(true)}
              className="border border-dashed border-gray-200 p-10 flex flex-col items-center justify-center text-center opacity-40 hover:opacity-100 transition-opacity cursor-pointer hover:bg-gray-50"
            >
               <Camera className="w-8 h-8 mb-4 text-gray-300" />
               <p className="text-[10px] font-bold uppercase tracking-widest">New Package Fragment</p>
               <p className="text-[8px] text-gray-400 mt-2">Expansion Pack Required</p>
            </div>
          )}
          {packages.map(pkg => (
            <div key={pkg.id} className="border border-gray-100 p-10 bg-white group flex flex-col h-full overflow-hidden">
              <div className="flex justify-between items-start mb-8">
                <span className="text-[9px] font-bold uppercase tracking-[0.2em] px-2 py-1 bg-gray-50 text-gray-400">{pkg.category}</span>
                <button 
                  onClick={() => handleDeletePackage(pkg.id)}
                  className="text-gray-200 hover:text-red-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              {pkg.imageUrl && (
                <div className="aspect-[4/3] mb-8 overflow-hidden bg-gray-50 rounded-sm">
                   <img src={pkg.imageUrl} alt={pkg.name} className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-700 hover:scale-105" />
                </div>
              )}
              <h3 className="text-xl font-bold uppercase tracking-tight mb-2">{pkg.name}</h3>
              <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-4">{pkg.duration} Minute Experience</p>
              <p className="text-xs text-gray-500 mb-8 flex-grow italic">"{pkg.description}"</p>
              <div className="flex justify-between items-center pt-8 border-t border-gray-50">
                <span className="text-sm font-mono font-bold tracking-tighter">{formatCurrency(pkg.price)}</span>
                <button 
                  onClick={() => handleEditPackage(pkg)}
                  className="text-[10px] font-bold uppercase tracking-widest opacity-20 hover:opacity-100 transition-opacity"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-12">
          {isAddingShowcase ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="border border-black p-10 bg-white space-y-8 max-w-2xl mx-auto"
            >
              <h4 className="text-xs font-bold uppercase tracking-widest text-black mb-4">Tambah Koleksi Showcase</h4>
              
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Pilih Foto</label>
                  <div className="flex items-center gap-6">
                    {imagePreview && (
                      <div className="w-32 h-32 border border-gray-100 rounded-sm overflow-hidden bg-gray-50">
                        <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                      </div>
                    )}
                    <div className="space-y-2">
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={handleImageChange}
                        className="text-[10px] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-[10px] file:font-semibold file:bg-black file:text-white hover:file:bg-gray-800 transition-colors"
                      />
                      <p className="text-[8px] text-gray-400 uppercase tracking-widest">Ukuran Maksimal: 2MB</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Judul (Opsional)</label>
                    <input 
                      value={newShowcase.title}
                      onChange={e => setNewShowcase({...newShowcase, title: e.target.value})}
                      placeholder="Cth. The Silent Look"
                      className="w-full border-b border-gray-100 py-2 text-sm focus:border-black outline-none"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Kategori (Opsional)</label>
                    <input 
                      value={newShowcase.category}
                      onChange={e => setNewShowcase({...newShowcase, category: e.target.value})}
                      placeholder="Cth. Portrait / B&W"
                      className="w-full border-b border-gray-100 py-2 text-sm focus:border-black outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Orientasi Visual</label>
                  <div className="flex gap-4">
                    {['portrait', 'landscape', 'square'].map(ratio => (
                      <button
                        key={ratio}
                        onClick={() => setNewShowcase({...newShowcase, aspectRatio: ratio as any})}
                        className={cn(
                          "flex-1 py-3 border text-[10px] font-bold uppercase tracking-widest transition-all",
                          newShowcase.aspectRatio === ratio ? "bg-black text-white border-black" : "border-gray-100 hover:border-black"
                        )}
                      >
                        {ratio === 'portrait' && 'Tegak (3:4)'}
                        {ratio === 'landscape' && 'Lebar (16:9)'}
                        {ratio === 'square' && 'Kotak (1:1)'}
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] text-gray-400 italic mt-2">*Grid akan otomatis menyesuaikan diri berdasarkan orientasi yang Anda pilih.</p>
                </div>
              </div>

              <div className="flex gap-4 pt-6 border-t border-gray-50">
                <button 
                  onClick={handleSaveShowcase}
                  disabled={isUploading}
                  className="flex-1 py-4 bg-black text-white text-xs font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:opacity-50 relative overflow-hidden"
                >
                  {isUploading && (
                    <div 
                      className="absolute left-0 top-0 bottom-0 bg-white/20 transition-all duration-300" 
                      style={{ width: `${uploadProgress}%` }}
                    />
                  )}
                  <span className="relative z-10">{isUploading ? `Mengunggah...` : 'Simpan Foto'}</span>
                </button>
                <button 
                  onClick={() => setIsAddingShowcase(false)}
                  className="px-8 py-4 border border-gray-100 text-xs font-bold uppercase tracking-widest hover:bg-gray-50 transition-colors"
                >
                  Batal
                </button>
              </div>
            </motion.div>
          ) : (
            <div className="flex justify-between items-end mb-12">
               <div>
                 <h3 className="text-3xl font-serif italic mb-2">Galeri Etalase</h3>
                 <p className="text-[10px] text-gray-400 uppercase tracking-widest">Kuras foto-foto terbaik Anda untuk ditampilkan di halaman depan.</p>
               </div>
               <button 
                 onClick={() => setIsAddingShowcase(true)}
                 className="px-8 py-3 bg-black text-white text-[10px] font-bold uppercase tracking-widest hover:bg-gray-800 transition-transform active:scale-95"
               >
                 Tambah Foto Baru
               </button>
            </div>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {localShowcase.length > 0 ? (
              localShowcase.map(img => (
                <div key={img.id} className="group relative aspect-square bg-gray-50 border border-gray-100 rounded-sm overflow-hidden">
                  <img src={img.url} alt={img.title} className="w-full h-full object-cover grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-500" />
                  
                  {confirmDeleteId === img.id ? (
                    <div className="absolute inset-0 bg-black/90 z-40 flex flex-col items-center justify-center p-4 text-center">
                      <p className="text-white text-[10px] font-bold uppercase tracking-widest mb-4">Hapus Foto Ini?</p>
                      <div className="flex flex-col gap-2 w-full max-w-[120px]">
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleDeleteShowcase(img.id);
                          }}
                          className="w-full px-4 py-2 bg-red-600 text-white text-[9px] font-bold uppercase tracking-widest rounded-full hover:bg-red-700 active:scale-95 transition-all"
                        >
                          Ya, Hapus
                        </button>
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setConfirmDeleteId(null);
                          }}
                          className="w-full px-4 py-2 bg-white/10 text-white text-[9px] font-bold uppercase tracking-widest rounded-full hover:bg-white/20 active:scale-95 transition-all"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-4 text-center z-20 pointer-events-none group-hover:pointer-events-auto">
                      <p className="text-white text-[10px] font-bold uppercase tracking-widest mb-1">{img.aspectRatio}</p>
                      {img.title && <p className="text-white text-[11px] font-serif italic mb-4 line-clamp-1">{img.title}</p>}
                      <button 
                        type="button"
                        onClick={() => setConfirmDeleteId(img.id)}
                        className="px-6 py-2 bg-red-600 text-white text-[10px] font-bold uppercase tracking-widest rounded-full hover:bg-red-700 transition-all active:scale-95 shadow-xl relative z-30 pointer-events-auto cursor-pointer"
                      >
                        Hapus Foto
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="col-span-full py-32 text-center border border-dashed border-gray-100 rounded-sm opacity-30 italic text-xs uppercase tracking-widest">
                Belum ada foto di showcase.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
