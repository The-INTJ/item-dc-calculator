'use client';

import { useState } from 'react';

import { donutsApi } from '../lib/api/donutsApi';
import type { DonutBoard, IsoDate, ProviderResult } from '../lib/types';

export type SwapDialog = 'decline' | 'volunteer' | null;

type ApplyResult = (result: ProviderResult<DonutBoard>) => string | null;

/** Dialog + request state for the two buttons on the upcoming-Sunday card. */
export function useSwapActions(date: IsoDate | null, apply: ApplyResult) {
  const [dialog, setDialog] = useState<SwapDialog>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function open(next: Exclude<SwapDialog, null>) {
    setError(null);
    setDialog(next);
  }

  function close() {
    setDialog(null);
    setError(null);
  }

  async function run(send: (target: IsoDate) => Promise<ProviderResult<DonutBoard>>) {
    if (!date) {
      return;
    }
    setBusy(true);
    const message = apply(await send(date));
    setBusy(false);
    if (message) {
      setError(message);
    } else {
      close();
    }
  }

  return {
    dialog,
    busy,
    error,
    open,
    close,
    decline: (reason?: string) => run((target) => donutsApi.decline(target, reason)),
    volunteer: (personId: string) =>
      run((target) => donutsApi.volunteer(target, personId)),
  };
}
