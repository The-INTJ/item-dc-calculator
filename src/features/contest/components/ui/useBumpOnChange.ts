'use client';

import { useEffect, useRef, useState } from 'react';

/** Pulses true for ~760ms whenever the given signature changes after mount. */
export function useBumpOnChange(signature: string) {
  const [bumping, setBumping] = useState(false);
  const previous = useRef(signature);
  const mounted = useRef(false);

  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true;
      previous.current = signature;
      return undefined;
    }

    if (previous.current === signature) return undefined;
    previous.current = signature;

    setBumping(false);
    const start = window.setTimeout(() => setBumping(true), 0);
    const clear = window.setTimeout(() => setBumping(false), 760);

    return () => {
      window.clearTimeout(start);
      window.clearTimeout(clear);
    };
  }, [signature]);

  return bumping;
}
