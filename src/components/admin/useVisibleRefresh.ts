'use client';

import { useEffect, useRef } from 'react';

/** Keep polling independent of form renders; each caller guards its in-flight request. */
export function useVisibleRefresh(refresh: () => void) {
  const callback = useRef(refresh);
  useEffect(() => { callback.current = refresh; });
  useEffect(() => {
    const run = () => { if (document.visibilityState === 'visible') callback.current(); };
    const interval = window.setInterval(run, 30_000);
    window.addEventListener('focus', run);
    document.addEventListener('visibilitychange', run);
    return () => {
      window.clearInterval(interval);
      window.removeEventListener('focus', run);
      document.removeEventListener('visibilitychange', run);
    };
  }, []);
}
