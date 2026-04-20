import type { ScoreBreakdown, ScoreEntry } from '../../contexts/contest/contestTypes';

export function computeVoteTotal(breakdown: ScoreBreakdown): number {
  const values = Object.values(breakdown).filter(
    (v): v is number => typeof v === 'number' && Number.isFinite(v),
  );
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

/**
 * Deterministic vote doc id: `{userId}_{matchupId}_{entryId}`.
 *
 * The matchup segment makes "one vote per voter, per entry, per matchup" the
 * natural uniqueness constraint — which matters once an entry can appear in
 * multiple matchups over a tournament's rounds.
 */
export function makeVoteDocId(userId: string, matchupId: string, entryId: string): string {
  return `${userId}_${matchupId}_${entryId}`;
}

export function docToScoreEntry(docId: string, data: Record<string, unknown>): ScoreEntry {
  return {
    id: docId,
    entryId: (data.entryId as string) ?? '',
    userId: (data.userId as string) ?? '',
    ...(data.matchupId ? { matchupId: data.matchupId as string } : {}),
    round: (data.round as string) ?? '',
    breakdown: (data.breakdown as ScoreBreakdown) ?? {},
    ...(data.notes ? { notes: data.notes as string } : {}),
  };
}
