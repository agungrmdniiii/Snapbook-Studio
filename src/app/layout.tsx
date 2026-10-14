import type { Metadata } from 'next';
import { Playfair_Display, Plus_Jakarta_Sans } from 'next/font/google';
import './globals.css';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Snapbook Studio - Modern Photo Studio & Booking',
  description: 'Pesan sesi foto studio modern, self-photo, wisuda, dan keluarga secara online tanpa antre.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className={`${playfair.variable} ${plusJakarta.variable}`}>
      <body className="min-h-screen bg-[#09090b] text-neutral-100 antialiased selection:bg-neutral-800 selection:text-white">
        {children}
      </body>
    </html>
  );
}
