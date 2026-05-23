'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { FitSidebar } from '@/components/layout/fit-sidebar';
import { SiteHeader } from '@/components/layout/site-header';
import { FamilyGroupSetupDialog } from '@/components/layout/family-group-setup-dialog';
import { useAuth } from '@/hooks/use-auth';
import { Skeleton } from '@/components/ui/skeleton';

export default function FitLayout({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-100">
        <div className="space-y-3 w-64">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-4 w-3/5" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <SidebarProvider>
      <FitSidebar />
      <SidebarInset>
        <SiteHeader />
        <main className="flex-1 p-6 animate-fade-in-up">
          {children}
        </main>
        <FamilyGroupSetupDialog />
      </SidebarInset>
    </SidebarProvider>
  );
}
