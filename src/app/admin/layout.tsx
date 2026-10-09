import React from 'react';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifySessionToken, SESSION_COOKIE_NAME } from '@/lib/auth';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? verifySessionToken(token) : null;

  // Let login page render without sidebar
  // But for protected pages, if not authenticated, redirect to /admin/login
  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col md:flex-row">
      {session ? (
        <>
          <AdminSidebar username={session.username} />
          <main className="flex-1 p-6 md:p-10 overflow-y-auto max-h-screen animate-studio-fade">
            {children}
          </main>
        </>
      ) : (
        <div className="w-full">{children}</div>
      )}
    </div>
  );
}
