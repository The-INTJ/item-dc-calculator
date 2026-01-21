import type { ScoreEntry, ScoreBreakdown } from '../../types';
import type { VoteCategory, VoteTotals } from '../../types/uiTypes';

const breakdownOrder: Array<keyof ScoreBreakdown> = [
  'aroma',
  'balance',
  'presentation',
  'creativity',
  'overall',
];

const breakdownKeySet = new Set<string>(breakdownOrder);

function isBreakdownKey(value: string): value is keyof ScoreBreakdown {
  return breakdownKeySet.has(value);
}

function formatLabel(value: string): string {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function buildDefaultVoteCategories(): VoteCategory[] {
  return breakdownOrder.map((key, index) => ({
    id: key,
    label: formatLabel(key),
    sortOrder: index,
  }));
}

export function buildTotalsFromScores(scores: ScoreEntry[], categories: VoteCategory[]): VoteTotals[] {
  const totalsMap = new Map<string, number>();

  scores.forEach((score) => {
    categories.forEach((category) => {
      if (!isBreakdownKey(category.id)) return;
      const value = score.breakdown[category.id];
      if (typeof value !== 'number') return;
      const entryId = score.entryId ?? score.drinkId;
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
