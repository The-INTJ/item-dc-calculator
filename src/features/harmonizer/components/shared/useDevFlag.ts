'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'harmonizer.dev.v1';

/**
 * Local developer view. Off by default so the workbench shows musicians only
 * musical facts; `?dev=1` in the URL turns the engine's own bookkeeping
 * (provenance badges, derivability chips) back on and remembers the choice,
 * `?dev=0` turns it back off.
 *
 * Always false on the server and on first paint — the URL/localStorage read
 * happens in an effect, so SSR and hydration agree.
 */
export function useDevFlag(): boolean {
  const [dev, setDev] = useState(false);

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('dev');
    if (requested !== null) {
      const next = requested !== '0' && requested !== 'false';
      setDev(next);
      try {
        window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
      } catch {
        // storage unavailable — the flag just won't outlive this page view
      }
      return;
    }
    try {
      setDev(window.localStorage.getItem(STORAGE_KEY) === '1');
    } catch {
      // storage unavailable — stay off
    }
  }, []);

  return dev;
}
