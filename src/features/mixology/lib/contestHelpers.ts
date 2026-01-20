import type { Contest, ContestRound, Drink, ScoreEntry } from '../types';
import { calculateScore } from './scoreUtils';

export function getContestRounds(contest: Contest): ContestRound[] {
  return contest.rounds ?? [];
}

export function getActiveRoundId(contest: Contest): string | null {
  const rounds = getContestRounds(contest);
  return contest.activeRoundId ?? rounds[0]?.id ?? null;
}

export function getFutureRoundId(contest: Contest): string | null {
  const rounds = getContestRounds(contest);
  const activeRoundId = getActiveRoundId(contest);
  if (contest.futureRoundId) return contest.futureRoundId;
  const activeIndex = rounds.findIndex((round) => round.id === activeRoundId);
  return rounds[activeIndex + 1]?.id ?? null;
}

export function getRoundById(contest: Contest, roundId: string | null | undefined): ContestRound | null {
  if (!roundId) return null;
  return getContestRounds(contest).find((round) => round.id === roundId) ?? null;
}

export function getRoundLabel(contest: Contest, roundId: string | null | undefined): string {
  const round = getRoundById(contest, roundId);
  if (round) return round.name;
  return roundId ?? 'Unassigned';
}

export function getDrinksForRound(contest: Contest, roundId: string | null | undefined): Drink[] {
  if (!roundId) return [];
  const round = getRoundById(contest, roundId);
  return contest.drinks.filter((drink) => drink.round === roundId || drink.round === round?.name);
}

export function getRoundStatus(contest: Contest, roundId: string): 'upcoming' | 'active' | 'closed' {
  const rounds = getContestRounds(contest);
  const activeRoundId = getActiveRoundId(contest);
  const futureRoundId = getFutureRoundId(contest);

  if (roundId === activeRoundId) return 'active';
  if (roundId === futureRoundId) return 'upcoming';

  const activeIndex = rounds.findIndex((round) => round.id === activeRoundId);
  const roundIndex = rounds.findIndex((round) => round.id === roundId);

  if (activeIndex === -1 || roundIndex === -1) return 'upcoming';
  return roundIndex < activeIndex ? 'closed' : 'upcoming';
}

export function getDrinkScore(entries: ScoreEntry[], drinkId: string): number | null {
  const scores = entries
    .filter((entry) => entry.drinkId === drinkId)
    .map((entry) => calculateScore(entry.breakdown))
    .filter((score) => Number.isFinite(score));

  if (scores.length === 0) return null;
  const total = scores.reduce((sum, score) => sum + score, 0);
  return Math.round(total / scores.length);
}
