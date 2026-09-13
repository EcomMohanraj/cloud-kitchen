'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function RegisterPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const redirect = searchParams ? searchParams.get('redirect') : null;
    const target = redirect ? `/account?mode=signup&redirect=${encodeURIComponent(redirect)}` : '/account?mode=signup';
    router.replace(target);
  }, [router, searchParams]);

  return (
    <div className="min-h-screen bg-[#fbf9f4] flex items-center justify-center font-sans text-slate-500 font-bold text-sm">
      Redirecting to Create Account...
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#fbf9f4] flex items-center justify-center font-sans text-slate-500 font-bold text-sm">Redirecting...</div>}>
      <RegisterPageContent />
    </Suspense>
  );
}
