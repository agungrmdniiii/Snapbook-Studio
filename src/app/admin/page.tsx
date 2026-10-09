import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { StatsCard } from '@/components/admin/StatsCard';
import { CalendarCheck, Clock, DollarSign, Users, ArrowRight } from 'lucide-react';
import { formatIDR, formatDateIndonesian } from '@/lib/utils';
import Link from 'next/link';
import { Badge } from '@/components/ui/Badge';

export const dynamic = 'force-dynamic';

export default async function AdminDashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifySessionToken(token) : null;

  if (!session) {
    redirect('/admin/login');
  }

  const today = new Date().toISOString().split('T')[0];

  const [allBookings, pendingCount, revenueAgg, todayBookings] = await Promise.all([
    prisma.booking.count(),
    prisma.booking.count({ where: { status: 'PENDING' } }),
    prisma.booking.aggregate({
      where: { status: { in: ['CONFIRMED', 'COMPLETED'] } },
      _sum: { totalPrice: true },
    }),
    prisma.booking.findMany({
      where: { date: today },
      include: { package: true },
      orderBy: { startTime: 'asc' },
    }),
  ]);

  const recentPending = await prisma.booking.findMany({
    where: { status: 'PENDING' },
    include: { package: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  });

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white">Ringkasan Operasional</h1>
        <p className="text-xs sm:text-sm text-zinc-400 mt-1">
          Pantau statistik reservasi dan jadwal sesi foto studio hari ini.
        </p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatsCard
          title="Total Reservasi"
          value={allBookings}
          subtitle="Seluruh waktu"
          icon={CalendarCheck}
          variant="amber"
        />
        <StatsCard
          title="Menunggu Konfirmasi"
          value={pendingCount}
          subtitle="Butuh verifikasi DP"
          icon={Clock}
          variant="rose"
        />
        <StatsCard
          title="Sesi Hari Ini"
          value={todayBookings.length}
          subtitle={formatDateIndonesian(today)}
          icon={Users}
          variant="sky"
        />
        <StatsCard
          title="Estimasi Omset"
          value={formatIDR(revenueAgg._sum.totalPrice || 0)}
          subtitle="Booking Terkonfirmasi/Selesai"
          icon={DollarSign}
          variant="emerald"
        />
      </div>

      {/* Grid: Today's Schedule & Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Card 1: Today's Agenda */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div>
              <h3 className="text-base font-bold text-white">Jadwal Sesi Hari Ini</h3>
              <p className="text-xs text-zinc-400">{todayBookings.length} klien terdaftar</p>
            </div>
            <Link
              href="/admin/bookings"
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <span>Semua Reservasi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {todayBookings.length === 0 ? (
              <p className="py-8 text-center text-xs text-zinc-500">
                Tidak ada jadwal sesi foto untuk hari ini.
              </p>
            ) : (
              todayBookings.map((b) => (
                <div
                  key={b.id}
                  className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-850 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-mono font-bold text-amber-400">
                      {b.startTime} - {b.endTime} WIB
                    </span>
                    <p className="text-sm font-semibold text-white mt-0.5">{b.clientName}</p>
                    <p className="text-xs text-zinc-400">{b.package.name}</p>
                  </div>
                  <Badge variant={b.status === 'CONFIRMED' ? 'success' : 'warning'}>
                    {b.status}
                  </Badge>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Card 2: Recent Pending */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
            <div>
              <h3 className="text-base font-bold text-white">Menunggu Konfirmasi DP</h3>
              <p className="text-xs text-zinc-400">Verifikasi chat WA dan status booking</p>
            </div>
            <Link
              href="/admin/bookings?status=PENDING"
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1"
            >
              <span>Lihat Pending</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentPending.length === 0 ? (
              <p className="py-8 text-center text-xs text-zinc-500">
                Semua reservasi telah terkonfirmasi. Tidak ada antrean pending.
              </p>
            ) : (
              recentPending.map((b) => (
                <div
                  key={b.id}
                  className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-850 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-zinc-200">
                        {b.bookingCode}
                      </span>
                      <span className="text-[11px] text-zinc-500">• {b.date}</span>
                    </div>
                    <p className="text-sm font-semibold text-white mt-0.5">{b.clientName}</p>
                    <p className="text-xs text-emerald-400 font-semibold">{formatIDR(b.totalPrice)}</p>
                  </div>
                  <Link
                    href={`/admin/bookings?search=${b.bookingCode}`}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-200 font-medium transition-colors"
                  >
                    Tinjau
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
