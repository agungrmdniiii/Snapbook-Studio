import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="id">
      <body className="min-h-screen bg-[#0c0d0e] text-zinc-100 antialiased selection:bg-amber-500 selection:text-zinc-950">
        {children}
      </body>
    </html>
  );
}
