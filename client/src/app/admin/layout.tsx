'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { supabase } from '@/lib/supabaseClient';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (pathname === '/admin/login') {
      setAuthorized(true);
      return;
    }

    async function checkAdminAuth() {
      // 1. Check local admin token
      const hasLocalToken = typeof window !== 'undefined' && Boolean(localStorage.getItem('yazhisai_admin_auth'));

      // 2. Check Supabase session role
      const { data: { user } } = await supabase.auth.getUser();
      let isSupabaseAdmin = false;

      if (user) {
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
        if (profile && profile.role === 'ADMIN') {
          isSupabaseAdmin = true;
        }
      }

      if (hasLocalToken || isSupabaseAdmin) {
        setAuthorized(true);
      } else {
        setAuthorized(false);
        router.replace('/admin/login');
      }
    }

    checkAdminAuth();
  }, [pathname, router]);

  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (authorized === null) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center space-x-2 text-xs font-bold text-[#059669]">
        <Loader2 className="w-6 h-6 animate-spin text-[#059669]" />
        <span>Verifying Admin Authorization...</span>
      </div>
    );
  }

  if (!authorized) {
    return null;
  }

  return (
    <div className="flex min-h-screen bg-slate-100 text-slate-900">
      <AdminSidebar />
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto space-y-8">
          {children}
        </div>
      </main>
    </div>
  );
}
