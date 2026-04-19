import type { ScoreBreakdown, ScoreEntry } from '../../contexts/contest/contestTypes';

export function computeVoteTotal(breakdown: ScoreBreakdown): number {
  const values = Object.values(breakdown).filter(
    (v): v is number => typeof v === 'number' && Number.isFinite(v),
  );
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function makeVoteDocId(userId: string, entryId: string): string {
  return `${userId}_${entryId}`;
}

export function docToScoreEntry(docId: string, data: Record<string, unknown>): ScoreEntry {
  return {
    id: docId,
    entryId: (data.entryId as string) ?? '',
    userId: (data.userId as string) ?? '',
    round: (data.round as string) ?? '',
    breakdown: (data.breakdown as ScoreBreakdown) ?? {},
    ...(data.notes ? { notes: data.notes as string } : {}),
  };
}
