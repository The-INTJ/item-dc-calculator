import type { Contest, ContestPhase, Entry } from '../../contexts/contest/contestTypes';
import {
  getActiveRoundId,
  getContestRounds,
  getEntriesForRound,
  getEntryScore,
  getFutureRoundId,
  getRoundById,
  getRoundStatus,
} from './contestGetters';
import { buildMatchupsFromEntries } from './uiMappings';

export interface DisplayContestant {
  id: string;
  name: string;
  score: number | null;
  isWinner: boolean;
}

export interface DisplayMatchup {
  id: string;
  contestantA: DisplayContestant;
  contestantB: DisplayContestant;
  winnerId: string | null;
}

export interface DisplayRound {
  id: string;
  name: string;
  status: 'upcoming' | 'active' | 'closed';
  isActive: boolean;
  matchups: DisplayMatchup[];
}

export interface DisplayModel {
  contestId: string;
  contestName: string;
  rounds: DisplayRound[];
  activeRoundId: string | null;
  activeRoundName: string | null;
  nextRoundName: string | null;
  totalRounds: number;
  phase: ContestPhase;
}

function buildContestant(entry: Entry | null, fallbackId: string, winnerId: string | null): DisplayContestant {
  const score = entry ? getEntryScore(entry) : null;
  const id = entry?.id ?? fallbackId;

  return {
    id,
    name: entry?.name ?? 'TBD',
    score,
    isWinner: winnerId === id,
  };
}

function getLeadingContestantId(firstEntry: Entry | null, secondEntry: Entry | null): string | null {
  if (!firstEntry || !secondEntry) return null;

  const firstScore = getEntryScore(firstEntry);
  const secondScore = getEntryScore(secondEntry);

  if (firstScore === null && secondScore === null) return null;
  if (firstScore === secondScore) return null;
  if (firstScore === null) return secondEntry.id;
  if (secondScore === null) return firstEntry.id;
  return firstScore > secondScore ? firstEntry.id : secondEntry.id;
}

function getDisplayRoundName(contest: Contest, roundId: string | null): string | null {
  if (!roundId) return null;
  return getRoundById(contest, roundId)?.name ?? null;
}

export function buildDisplayModel(contest: Contest): DisplayModel {
  const activeRoundId = getActiveRoundId(contest);
  const futureRoundId = getFutureRoundId(contest);
  const rounds = getContestRounds(contest).map((round, roundIndex) => {
    const entries = getEntriesForRound(contest, round.id);
    const matchups = buildMatchupsFromEntries(entries).map((matchup, matchupIndex) => {
      const [firstId, secondId] = matchup.entryIds;
      const firstEntry = firstId ? entries.find((entry) => entry.id === firstId) ?? null : null;
      const secondEntry = secondId ? entries.find((entry) => entry.id === secondId) ?? null : null;
      const winnerId = getLeadingContestantId(firstEntry, secondEntry);

      return {
        id: matchup.id,
        contestantA: buildContestant(firstEntry, `${round.id}-${matchupIndex}-a`, winnerId),
        contestantB: buildContestant(secondEntry, `${round.id}-${matchupIndex}-b`, winnerId),
        winnerId,
      };
    });

    return {
      id: round.id,
      name: round.name || `Round ${roundIndex + 1}`,
      status: getRoundStatus(contest, round.id),
      isActive: round.id === activeRoundId,
      matchups,
    };
  });

  return {
    contestId: contest.id,
    contestName: contest.name,
    rounds,
    activeRoundId,
    activeRoundName: getDisplayRoundName(contest, activeRoundId),
    nextRoundName: getDisplayRoundName(contest, futureRoundId),
    totalRounds: rounds.length,
    phase: contest.phase,
  };
}