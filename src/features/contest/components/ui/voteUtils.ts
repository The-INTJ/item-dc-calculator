import type { ScoreEntry, AttributeConfig } from '../../contexts/contest/contestTypes';
import type { VoteTotals } from '../../lib/helpers/uiMappings';

/**
 * Build per-entry, per-category totals from an array of score entries.
 * Used in admin views that need detailed breakdowns queried from the votes subcollection.
 */
export function buildTotalsFromScores(scores: ScoreEntry[], categories: AttributeConfig[]): VoteTotals[] {
  const totalsMap = new Map<string, number>();

  scores.forEach((score) => {
    categories.forEach((category) => {
      const value = score.breakdown[category.id];
      if (typeof value !== 'number') return;
      const entryId = score.entryId;
      const key = `${entryId}:${category.id}`;
      totalsMap.set(key, (totalsMap.get(key) ?? 0) + value);
    });
  });

  return Array.from(totalsMap.entries()).map(([key, total]) => {
    const [entryId, categoryId] = key.split(':');
    return {
      entryId,
      categoryId,
      total,
      userHasVoted: false,
    };
  });
}
