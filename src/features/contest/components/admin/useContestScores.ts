'use client';

import { useEffect, useState } from 'react';
import type { Matchup, ScoreEntry } from '../../contexts/contest/contestTypes';
import { contestApi } from '../../lib/api/contestApi';

/**
 * Every score cast in the contest, gathered per entry. Scores are stored under
 * the entry that received them, so there is no contest-wide read — the admin
 * view fans out over the entries in play and flattens the results.
 */
export function useContestScores(contestId: string, matchups: Matchup[]): ScoreEntry[] {
  const [contestScores, setContestScores] = useState<ScoreEntry[]>([]);

  useEffect(() => {
    if (!contestId) return;

    const fetchScores = async () => {
      const allEntryIds = matchups.flatMap((m) => m.entries.map((e) => e.id));
      const scoreGroups = await Promise.all(
        allEntryIds.map((entryId) => contestApi.getScoresForEntry(contestId, entryId)),
      );
      setContestScores(scoreGroups.flatMap((r) => (r.success ? r.data ?? [] : [])));
    };

    void fetchScores();
  }, [contestId, matchups]);

  return contestScores;
}
