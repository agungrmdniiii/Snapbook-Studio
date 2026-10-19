import React from 'react';
import { redirect } from 'next/navigation';
import { getAdminSession } from '@/lib/admin-session';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { ToastProvider } from '@/components/ui/Toast';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getAdminSession();

  // Let login page render without sidebar
  // But for protected pages, if not authenticated, redirect to /admin/login
  return (
    <ToastProvider><div className="min-h-screen bg-[#09090b] flex flex-col md:flex-row">
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
    </div></ToastProvider>
  );
}
