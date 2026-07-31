'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ContestRound, Matchup } from '../../contexts/contest/contestTypes';
import { getActiveRoundIdFromMatchups } from '../../lib/domain/matchupGetters';

/**
 * Which round the admin is looking at. Defaults to the live one and follows it
 * back there if the round they had selected is deleted underneath them.
 */
export function useSelectedRound(rounds: ContestRound[], matchups: Matchup[]) {
  const activeRoundId = useMemo(
    () => getActiveRoundIdFromMatchups(rounds, matchups),
    [rounds, matchups],
  );

  const [selectedRoundId, setSelectedRoundId] = useState<string | null>(activeRoundId);

  useEffect(() => {
    if (selectedRoundId && !rounds.some((r) => r.id === selectedRoundId)) {
      setSelectedRoundId(activeRoundId);
    } else if (!selectedRoundId && activeRoundId) {
      setSelectedRoundId(activeRoundId);
    }
  }, [rounds, activeRoundId, selectedRoundId]);

  return { activeRoundId, selectedRoundId, setSelectedRoundId };
}
