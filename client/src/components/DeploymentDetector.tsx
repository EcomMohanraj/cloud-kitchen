'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { RefreshCw, X, Sparkles } from 'lucide-react';

export function DeploymentDetector() {
  const [newVersionAvailable, setNewVersionAvailable] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const pathname = usePathname();

  // Paths where auto-update banner should be suppressed to avoid disrupting sensitive user flows
  const isSensitivePath =
    pathname?.startsWith('/checkout') ||
    pathname?.startsWith('/order') ||
    pathname?.startsWith('/payment');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const currentBuildId = process.env.NEXT_PUBLIC_APP_BUILD_ID;
    if (!currentBuildId) return;

    const checkVersion = async () => {
      try {
        const res = await fetch(`/api/app-version?t=${Date.now()}`, { cache: 'no-store' });
        if (!res.ok) return;
        const data = await res.json();
        if (data.buildId && data.buildId !== currentBuildId) {
          setNewVersionAvailable(true);
        }
      } catch (err) {
        // Silently catch fetch errors
      }
    };

    const timer = setTimeout(checkVersion, 2000);
    const interval = setInterval(checkVersion, 4000);

    const onFocus = () => checkVersion();
    window.addEventListener('focus', onFocus);

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  if (!newVersionAvailable || dismissed || isSensitivePath) {
    return null;
  }

  const handleUpdate = () => {
    window.location.reload();
  };

  return (
    <div id="deployment-update-toast" className="fixed bottom-4 right-4 z-50 max-w-md bg-slate-900 text-white p-4 rounded-xl shadow-2xl border border-amber-500/40 flex items-center justify-between gap-3 transition-all animate-bounce-short">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-amber-500/20 rounded-lg text-amber-400">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-white">New Version Available</p>
          <p className="text-xs text-slate-300">An update to Yazhisai Cloud Kitchen has been deployed.</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <button
          id="update-app-btn"
          onClick={handleUpdate}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg transition-colors shadow"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Update
        </button>
        <button
          id="dismiss-app-update-btn"
          onClick={() => setDismissed(true)}
          className="p-1.5 text-slate-400 hover:text-white transition-colors"
          aria-label="Dismiss update notification"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
