import type { DisplayMatchup } from '@/contest/lib/presentation/displayModel';

/** Uppercase the first letter of a status/phase word for on-screen labels. */
export function formatLabel(value: string) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

/** "A vs B" label for a matchup, with a standby fallback. */
export function matchupLabel(matchup: DisplayMatchup | null) {
  if (!matchup) return 'Waiting for active round';
  return `${matchup.contestantA.name} vs ${matchup.contestantB.name}`;
}
