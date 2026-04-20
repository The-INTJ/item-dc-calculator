import type {
  Contest,
  ContestPhase,
  Entry,
  Matchup,
  MatchupPhase,
  RoundStatus,
} from '../../contexts/contest/contestTypes';
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
import {
  getActiveRoundIdFromMatchups,
  getComputedRoundStatus,
  getMatchupsForRound,
} from '../domain/matchupGetters';
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
  /** Stored matchup document id (present when driven from Matchup[]). */
  matchupId?: string;
  /** Matchup lifecycle phase (present when driven from Matchup[]). */
  phase?: MatchupPhase;
}

export interface DisplayRound {
  id: string;
  name: string;
  status: RoundStatus;
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
 * Build the display model for a contest. When `matchups` is provided and
 * non-empty, rounds are driven from the stored matchup collection (matchupId
 * and phase are populated on each DisplayMatchup). When omitted or empty, the
 * builder falls back to legacy entry-pair inference so existing callers keep
 * working during the matchup refactor.
 */
export function buildDisplayModel(contest: Contest, matchups: Matchup[] = []): DisplayModel {
  if (matchups.length > 0) {
    return buildFromMatchups(contest, matchups);
  }
  return buildLegacy(contest);
}

function buildFromMatchups(contest: Contest, matchups: Matchup[]): DisplayModel {
  const contestRounds = getContestRounds(contest);
  const bracketStructure = computeBracketStructure(contestRounds.length);
  const activeRoundId = getActiveRoundIdFromMatchups(contestRounds, matchups);
  const activeIndex = contestRounds.findIndex((round) => round.id === activeRoundId);
  const futureRoundId =
    activeIndex >= 0 && activeIndex + 1 < contestRounds.length
      ? contestRounds[activeIndex + 1].id
      : null;
  const lastRoundId = contestRounds[contestRounds.length - 1]?.id ?? null;
  const entriesById = new Map(contest.entries.map((entry) => [entry.id, entry]));

  const displayRounds: DisplayRound[] = contestRounds.map((round, roundIndex) => {
    const structureRound = bracketStructure.rounds[roundIndex];
    const expectedMatchupCount = structureRound?.matchupCount ?? 0;

    const roundMatchups = getMatchupsForRound(matchups, round.id).sort(
      (a, b) => a.slotIndex - b.slotIndex,
    );

    const displayMatchups: DisplayMatchup[] = [];
    const byIndex = Math.max(expectedMatchupCount, roundMatchups.length);

    for (let slotIndex = 0; slotIndex < byIndex; slotIndex += 1) {
      const matchup = roundMatchups.find((m) => m.slotIndex === slotIndex) ?? null;
      const slot = structureRound?.slots[slotIndex];
      const sourceMatchups = slot?.sourceMatchups ?? null;

      const contestantAEntry = matchup ? entriesById.get(matchup.entryIds[0] ?? '') ?? null : null;
      const contestantBEntry = matchup ? entriesById.get(matchup.entryIds[1] ?? '') ?? null : null;

      const winnerId =
        matchup?.winnerEntryId ?? getLeadingContestantId(contestantAEntry, contestantBEntry);

      displayMatchups.push({
        id: matchup?.id ?? `${round.id}-slot-${slotIndex}`,
        contestantA: buildContestant(contestantAEntry, `${round.id}-${slotIndex}-a`, winnerId),
        contestantB: buildContestant(contestantBEntry, `${round.id}-${slotIndex}-b`, winnerId),
        winnerId: winnerId ?? null,
        sourceMatchups,
        slotIndex,
        ...(matchup ? { matchupId: matchup.id, phase: matchup.phase } : {}),
      });
    }

    return {
      id: round.id,
      name: round.name || `Round ${roundIndex + 1}`,
      status: getComputedRoundStatus(round, matchups),
      isActive: round.id === activeRoundId,
      matchups: displayMatchups,
      expectedMatchupCount,
      roundIndex,
    };
  });

  return {
    contestId: contest.id,
    contestName: contest.name,
    rounds: displayRounds,
    activeRoundId,
    activeRoundName: getDisplayRoundName(contest, activeRoundId),
    nextRoundName: getDisplayRoundName(contest, futureRoundId),
    totalRounds: displayRounds.length,
    phase: derivePhaseFromMatchups(matchups, activeRoundId),
    bracketStructure,
    isFinalRoundActive: activeRoundId != null && activeRoundId === lastRoundId,
  };
}

function derivePhaseFromMatchups(matchups: Matchup[], activeRoundId: string | null): MatchupPhase {
  if (!activeRoundId) return 'set';
  const activeMatchups = matchups.filter((m) => m.roundId === activeRoundId);
  if (activeMatchups.some((m) => m.phase === 'shake')) return 'shake';
  if (activeMatchups.length > 0 && activeMatchups.every((m) => m.phase === 'scored')) return 'scored';
  return 'set';
}

/**
 * Legacy entry-pair display model. Retained so callers that have not yet
 * migrated to passing matchups keep rendering the bracket view. Once PR 6
 * migrates every caller, the legacy branch can be removed.
 */
function buildLegacy(contest: Contest): DisplayModel {
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
    phase: contest.phase ?? 'set',
    bracketStructure,
    isFinalRoundActive: activeRoundId != null && activeRoundId === lastRoundId,
  };
}

function getWinnerEntry(prevRoundMatchups: DisplayMatchup[], matchupIndex: number, contest: Contest): Entry | null {
  const matchup = prevRoundMatchups[matchupIndex];
  if (!matchup?.winnerId) return null;
  return contest.entries.find((e) => e.id === matchup.winnerId) ?? null;
}
