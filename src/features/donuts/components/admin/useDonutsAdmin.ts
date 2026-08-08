'use client';

import { useState } from 'react';

import type { DonutBoard, ProviderResult } from '../../lib/types';
import { useDonutBoard } from '../useDonutBoard';

export type RunMutation = (
  operation: () => Promise<ProviderResult<DonutBoard>>,
) => Promise<boolean>;

/**
 * Board state plus a single funnel for admin writes, so every editor shares
 * one busy flag and one error line instead of growing its own.
 */
export function useDonutsAdmin() {
  const { board, loading, error, reload, apply } = useDonutBoard();
  const [busy, setBusy] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const run: RunMutation = async (operation) => {
    setBusy(true);
    const message = apply(await operation());
    setBusy(false);
    setActionError(message);
    return message === null;
  };

  return { board, loading, error, reload, busy, actionError, run };
}
