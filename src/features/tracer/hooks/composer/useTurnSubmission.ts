'use client';

import { useState } from 'react';

import { isKingInDanger, type Side, type TurnInput, type TurnOutcome } from '../../engine';
import { errorCopy, tracerApi } from '../../lib/api/tracerApi';

export type TurnWarning = 'king-in-danger' | 'streak-draw';

export type SubmitPhase =
  | { kind: 'idle' }
  | { kind: 'confirm'; warnings: TurnWarning[] }
  | { kind: 'sending' }
  | { kind: 'sent' }
  | { kind: 'failed'; message: string; retryable: boolean };

/** Reasons to double-check before sending a legal turn. */
export function turnWarnings(outcome: TurnOutcome | null, side: Side | null): TurnWarning[] {
  if (!outcome?.ok || !side) return [];
  const result = outcome.state.result;
  if (result.status === 'drawn' && result.reason === 'step-streak') return ['streak-draw'];
  if (result.status === 'active' && isKingInDanger(outcome.state, side)) return ['king-in-danger'];
  return [];
}

function newTurnId(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Sending the staged turn. A retry after a network failure reuses the same
 * turn id, so the server can recognise a turn it already applied.
 */
export function useTurnSubmission(gameId: string, side: Side | null, onStale: () => void) {
  const [phase, setPhase] = useState<SubmitPhase>({ kind: 'idle' });
  const [pending, setPending] = useState<{ key: string; id: string } | null>(null);

  async function send(turn: TurnInput) {
    const key = JSON.stringify(turn);
    const id = pending?.key === key ? pending.id : newTurnId();
    setPending({ key, id });
    setPhase({ kind: 'sending' });
    const result = await tracerApi.submitTurn(gameId, { clientTurnId: id, turn });
    if (result.ok) {
      setPhase({ kind: 'sent' });
      return;
    }
    if (result.code === 'STALE_PLY') onStale();
    setPhase({ kind: 'failed', message: errorCopy(result), retryable: result.code === 'NETWORK' });
  }

  function submit(turn: TurnInput | null, outcome: TurnOutcome | null, confirmed = false) {
    if (!turn || !outcome?.ok) return;
    const warnings = confirmed ? [] : turnWarnings(outcome, side);
    if (warnings.length > 0) {
      setPhase({ kind: 'confirm', warnings });
      return;
    }
    void send(turn);
  }

  return { phase, submit, dismiss: () => setPhase({ kind: 'idle' }) };
}
