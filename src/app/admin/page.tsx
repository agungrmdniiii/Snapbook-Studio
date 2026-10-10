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

  let allBookings = 0;
  let pendingCount = 0;
  let revenueAgg: any = { _sum: { totalPrice: 0 } };
  let todayBookings: any[] = [];
  let recentPending: any[] = [];

  try {
    [allBookings, pendingCount, revenueAgg, todayBookings] = await Promise.all([
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

    recentPending = await prisma.booking.findMany({
      where: { status: 'PENDING' },
      include: { package: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });
  } catch (err) {
    console.warn('Admin metrics query fallback:', err);
  }

  return (
    <div className="space-y-8 max-w-6xl">
      {/* Header */}
      <div>
        <h1 className="font-serif text-3xl font-normal text-white">Ringkasan Operasional</h1>
        <p className="text-xs sm:text-sm text-neutral-400 mt-1 font-light">
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
        />
        <StatsCard
          title="Menunggu Konfirmasi"
          value={pendingCount}
          subtitle="Butuh verifikasi DP"
          icon={Clock}
        />
        <StatsCard
          title="Sesi Hari Ini"
          value={todayBookings.length}
          subtitle={formatDateIndonesian(today)}
          icon={Users}
        />
        <StatsCard
          title="Estimasi Omset"
          value={formatIDR(revenueAgg._sum.totalPrice || 0)}
          subtitle="Booking Terkonfirmasi/Selesai"
          icon={DollarSign}
        />
      </div>

      {/* Grid: Today's Schedule & Pending Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Card 1: Today's Agenda */}
        <div className="bg-[#101013] border border-neutral-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div>
              <h3 className="font-serif text-lg font-normal text-white">Jadwal Sesi Hari Ini</h3>
              <p className="text-xs text-neutral-400 font-light">{todayBookings.length} klien terdaftar</p>
            </div>
            <Link
              href="/admin/bookings"
              className="text-xs uppercase tracking-wider text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>Semua Reservasi</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {todayBookings.length === 0 ? (
              <p className="py-8 text-center text-xs text-neutral-500 font-light">
                Tidak ada jadwal sesi foto untuk hari ini.
              </p>
            ) : (
              todayBookings.map((b) => (
                <div
                  key={b.id}
                  className="p-3.5 rounded-2xl bg-[#0a0a0c] border border-neutral-800 flex items-center justify-between"
                >
                  <div>
                    <span className="text-xs font-mono font-medium text-white">
                      {b.startTime} – {b.endTime} WIB
                    </span>
                    <p className="text-sm font-medium text-white mt-0.5">{b.clientName}</p>
                    <p className="text-xs text-neutral-400 font-light">{b.package.name}</p>
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
        <div className="bg-[#101013] border border-neutral-800 rounded-3xl p-6 sm:p-7 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
            <div>
              <h3 className="font-serif text-lg font-normal text-white">Menunggu Konfirmasi DP</h3>
              <p className="text-xs text-neutral-400 font-light">Verifikasi chat WA dan status booking</p>
            </div>
            <Link
              href="/admin/bookings?status=PENDING"
              className="text-xs uppercase tracking-wider text-neutral-400 hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>Lihat Pending</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-3">
            {recentPending.length === 0 ? (
              <p className="py-8 text-center text-xs text-neutral-500 font-light">
                Semua reservasi telah terkonfirmasi. Tidak ada antrean pending.
              </p>
            ) : (
              recentPending.map((b) => (
                <div
                  key={b.id}
                  className="p-3.5 rounded-2xl bg-[#0a0a0c] border border-neutral-800 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-medium text-white">
                        {b.bookingCode}
                      </span>
                      <span className="text-[11px] text-neutral-500 font-mono">• {b.date}</span>
                    </div>
                    <p className="text-sm font-medium text-white mt-0.5">{b.clientName}</p>
                    <p className="text-xs text-neutral-300">{formatIDR(b.totalPrice)}</p>
                  </div>
                  <Link
                    href={`/admin/bookings?search=${b.bookingCode}`}
                    className="px-3.5 py-1.5 rounded-full bg-neutral-900 hover:bg-neutral-800 text-xs text-neutral-200 border border-neutral-800 transition-colors uppercase tracking-wider"
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
