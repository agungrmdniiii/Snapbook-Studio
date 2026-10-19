import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/admin-session';
import { OperationalCalendar } from '@/components/admin/OperationalCalendar';

export const dynamic = 'force-dynamic';

export default async function AdminCalendarPage({searchParams}:{searchParams:Promise<{date?:string;bookingId?:string}>}) {
  if (!await getAdminSession()) redirect('/admin/login');
  const params=await searchParams;
  return <OperationalCalendar initialDate={params.date} initialBookingId={params.bookingId} />;
}
