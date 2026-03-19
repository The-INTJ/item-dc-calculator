import type { Contest, ContestPhase, Entry } from '../../contexts/contest/contestTypes';
import type { BracketStructure } from '../domain/bracketMath';
import { computeBracketStructure } from '../domain/bracketMath';
import {
  getActiveRoundId,
  getContestRounds,
  getEntriesForRound,
  getEntryScore,
  getFutureRoundId,
  getRoundById,
  getRoundStatus,
} from '../domain/contestGetters';
import { buildEntryPairs } from './uiMappings';

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
  /** Indices of the two feeder matchups from the previous round, or null for round 0. */
  sourceMatchups: [number, number] | null;
  /** Position within the round (for connector line layout). */
  slotIndex: number;
}

export interface DisplayRound {
  id: string;
  name: string;
  status: 'upcoming' | 'active' | 'closed';
  isActive: boolean;
  matchups: DisplayMatchup[];
  /** Expected number of matchups from bracket math (may exceed actual entries). */
  expectedMatchupCount: number;
  /** Zero-based position in the bracket (for CSS layout). */
  roundIndex: number;
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
  /** The computed ideal bracket structure. */
  bracketStructure: BracketStructure;
  /** True when the active round is the final round in the bracket. */
  isFinalRoundActive: boolean;
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

/**
 * Find the winner entry from a completed matchup in a previous display round.
 * Returns the Entry from the contest if found, or null.
 */
function getWinnerEntry(prevRoundMatchups: DisplayMatchup[], matchupIndex: number, contest: Contest): Entry | null {
  const matchup = prevRoundMatchups[matchupIndex];
  if (!matchup?.winnerId) return null;
  return contest.entries.find((e) => e.id === matchup.winnerId) ?? null;
}

export function buildDisplayModel(contest: Contest): DisplayModel {
  const activeRoundId = getActiveRoundId(contest);
  const futureRoundId = getFutureRoundId(contest);
  const contestRounds = getContestRounds(contest);
  const bracketStructure = computeBracketStructure(contestRounds.length);
  const lastRoundId = contestRounds[contestRounds.length - 1]?.id ?? null;

  const displayRounds: DisplayRound[] = [];

  for (let roundIndex = 0; roundIndex < contestRounds.length; roundIndex++) {
    const round = contestRounds[roundIndex];
    const structureRound = bracketStructure.rounds[roundIndex];
    const expectedMatchupCount = structureRound?.matchupCount ?? 0;

    // Get manually assigned entries for this round
    const entries = getEntriesForRound(contest, round.id);
    const entryPairs = buildEntryPairs(entries);
    const prevRound = roundIndex > 0 ? displayRounds[roundIndex - 1] : null;

    const matchups: DisplayMatchup[] = [];

    for (let slotIndex = 0; slotIndex < expectedMatchupCount; slotIndex++) {
      const existingPair = entryPairs[slotIndex];
      const slot = structureRound?.slots[slotIndex];
      const sourceMatchups = slot?.sourceMatchups ?? null;

      let contestantAEntry: Entry | null = existingPair?.contestantA ?? null;
      let contestantBEntry: Entry | null = existingPair?.contestantB ?? null;

      // Winner propagation: if no manual entry, pull winner from previous round
      if (!contestantAEntry && prevRound && sourceMatchups) {
        contestantAEntry = getWinnerEntry(prevRound.matchups, sourceMatchups[0], contest);
      }
      if (!contestantBEntry && prevRound && sourceMatchups) {
        contestantBEntry = getWinnerEntry(prevRound.matchups, sourceMatchups[1], contest);
      }

      const winnerId = getLeadingContestantId(contestantAEntry, contestantBEntry);
      const matchupId = existingPair?.id ?? `${round.id}-slot-${slotIndex}`;

      matchups.push({
        id: matchupId,
        contestantA: buildContestant(contestantAEntry, `${round.id}-${slotIndex}-a`, winnerId),
        contestantB: buildContestant(contestantBEntry, `${round.id}-${slotIndex}-b`, winnerId),
        winnerId,
        sourceMatchups,
        slotIndex,
      });
    }

    displayRounds.push({
      id: round.id,
      name: round.name || `Round ${roundIndex + 1}`,
      status: getRoundStatus(contest, round.id),
      isActive: round.id === activeRoundId,
      matchups,
      expectedMatchupCount,
      roundIndex,
    });
  }

  return {
    contestId: contest.id,
    contestName: contest.name,
    rounds: displayRounds,
    activeRoundId,
    activeRoundName: getDisplayRoundName(contest, activeRoundId),
    nextRoundName: getDisplayRoundName(contest, futureRoundId),
    totalRounds: displayRounds.length,
    phase: contest.phase,
    bracketStructure,
    isFinalRoundActive: activeRoundId != null && activeRoundId === lastRoundId,
  };
}
