import type { DisplayChampion, DisplayRound } from './displayModelTypes';

/**
 * A champion exists only when the LAST round is a true 1-matchup final. An
 * under-provisioned bracket (last round still holds multiple matchups) has
 * no final to crown from. A trailing bye CAN crown — the sole survivor won.
 */
export function deriveChampion(
  finalRound: DisplayRound | null,
  lastRoundCapacity: number,
): DisplayChampion | null {
  const finalMatchup =
    lastRoundCapacity === 1
      ? finalRound?.matchups.find((m) => m.phase === 'scored' && m.winnerId) ?? null
      : null;
  if (!finalMatchup) return null;

  const winner =
    finalMatchup.contestantA.id === finalMatchup.winnerId
      ? finalMatchup.contestantA
      : finalMatchup.contestantB.id === finalMatchup.winnerId
        ? finalMatchup.contestantB
        : null;
  if (!winner) return null;
  const runnerUp = finalMatchup.isBye
    ? null
    : finalMatchup.contestantA.id === winner.id
      ? finalMatchup.contestantB
      : finalMatchup.contestantA;
  return {
    contestant: winner,
    runnerUp: runnerUp ?? null,
    finalRoundName: finalRound?.name ?? 'Finals',
  };
}

/**
 * The face-off panel replaces the last bracket column only for a real
 * 1-matchup, non-bye final that is currently the active round.
 */
export function deriveFaceOffRoundId(
  finalRound: DisplayRound | null,
  activeRoundId: string | null,
  lastRoundCapacity: number,
): string | null {
  const finalSlot = finalRound?.matchups[0] ?? null;
  return activeRoundId != null &&
    finalRound != null &&
    activeRoundId === finalRound.id &&
    lastRoundCapacity === 1 &&
    finalSlot != null &&
    !finalSlot.isBye
    ? finalRound.id
    : null;
}
