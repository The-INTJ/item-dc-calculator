import type {
  Contest,
  Contestant,
  Entry,
  Matchup,
  MatchupPhase,
  RoundStatus,
} from '../../contexts/contest/contestTypes';
import type { BracketStructure } from '../domain/bracketMath';
import { computeBracketStructure } from '../domain/bracketMath';
import {
  getContestRounds,
  getEntryScore,
  getRoundById,
} from '../domain/contestGetters';
import { getEntryDisplayName } from '../domain/entryLabels';
import {
  getActiveRoundIdFromMatchups,
  getComputedRoundStatus,
  getMatchupsForRound,
} from '../domain/matchupGetters';
import { normalizeContestKind, type ContestDisplayKind } from './displaySurface';

export type FeaturedMatchupMode = 'shake' | 'standby';

export interface DisplayContestant {
  id: string;
  name: string;
  score: number | null;
  /** Changes whenever the raw cached aggregate changes, even if rounded score is unchanged. */
  scoreSignature: string;
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
  /** Stored matchup document id (present when a stored matchup drives this slot). */
  matchupId?: string;
  /** Matchup lifecycle phase (present when a stored matchup drives this slot). */
  phase?: MatchupPhase;
  /** True when this is a single-entry bye (auto-advance). */
  isBye?: boolean;
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

export interface DisplayChampion {
  /** The winning contestant entry from the final matchup. */
  contestant: DisplayContestant;
  /** The opponent in the final matchup (for the runner-up callout). */
  runnerUp: DisplayContestant | null;
  finalRoundName: string;
}

export interface DisplayModel {
  contestId: string;
  contestName: string;
  contestKind: ContestDisplayKind;
  rounds: DisplayRound[];
  activeRoundId: string | null;
  activeRoundName: string | null;
  nextRoundName: string | null;
  activeShakeMatchup: DisplayMatchup | null;
  featuredMatchup: DisplayMatchup | null;
  featuredMatchupMode: FeaturedMatchupMode;
  totalRounds: number;
  phase: MatchupPhase;
  /** The computed ideal bracket structure. */
  bracketStructure: BracketStructure;
  /** True when the active round is the final round in the bracket. */
  isFinalRoundActive: boolean;
  /** Set when the final round's matchup is scored with a winner — drives the crowning UI. */
  champion: DisplayChampion | null;
}

function buildDisplayContestant(
  entry: Entry | null,
  contestantsById: Map<string, Contestant>,
  fallbackId: string,
  winnerEntryId: string | null,
): DisplayContestant {
  const score = entry ? getEntryScore(entry) : null;
  const id = entry?.id ?? fallbackId;
  const contestant = entry ? contestantsById.get(entry.contestantId) ?? null : null;
  const drinkName = entry?.name?.trim();
  const displayName = drinkName
    ? contestant?.displayName
      ? `${drinkName} — ${contestant.displayName}`
      : drinkName
    : getEntryDisplayName(entry, contestant) ?? 'TBD';
  const scoreSignature = entry
    ? `${entry.id}:${entry.sumScore ?? 0}:${entry.voteCount ?? 0}`
    : `${fallbackId}:empty`;

  return {
    id,
    name: displayName,
    score,
    scoreSignature,
    isWinner: winnerEntryId === id,
  };
}

function getLeadingContestantId(
  firstEntry: Entry | null,
  secondEntry: Entry | null,
): string | null {
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
 * Build the display model for a contest from the stored matchup collection.
 * Matchups are the authoritative source for round status, seeding, and phase.
 */
export function buildDisplayModel(contest: Contest, matchups: Matchup[]): DisplayModel {
  const contestRounds = getContestRounds(contest);
  const bracketStructure = computeBracketStructure(contestRounds.length);
  const activeRoundId = getActiveRoundIdFromMatchups(contestRounds, matchups);
  const lastRoundId = contestRounds[contestRounds.length - 1]?.id ?? null;
  const contestantsById = new Map(contest.contestants.map((c) => [c.id, c]));
  const contestKind = normalizeContestKind(contest.config);

  const activeIndex = contestRounds.findIndex((round) => round.id === activeRoundId);
  const futureRoundId =
    activeIndex >= 0 && activeIndex + 1 < contestRounds.length
      ? contestRounds[activeIndex + 1].id
      : null;

  const displayRounds: DisplayRound[] = contestRounds.map((round, roundIndex) => {
    const structureRound = bracketStructure.rounds[roundIndex];
    const expectedMatchupCount = structureRound?.matchupCount ?? 0;

    const roundMatchups = getMatchupsForRound(matchups, round.id).sort(
      (a, b) => a.slotIndex - b.slotIndex,
    );

    const displayMatchups: DisplayMatchup[] = [];
    const slotCount = Math.max(expectedMatchupCount, roundMatchups.length);

    for (let slotIndex = 0; slotIndex < slotCount; slotIndex += 1) {
      const matchup = roundMatchups.find((m) => m.slotIndex === slotIndex) ?? null;
      const slot = structureRound?.slots[slotIndex];
      const sourceMatchups = slot?.sourceMatchups ?? null;

      const contestantAEntry = matchup?.entries?.[0] ?? null;
      const contestantBEntry = matchup?.entries?.[1] ?? null;

      const winnerId =
        matchup?.winnerEntryId ?? getLeadingContestantId(contestantAEntry, contestantBEntry);

      displayMatchups.push({
        id: matchup?.id ?? `${round.id}-slot-${slotIndex}`,
        contestantA: buildDisplayContestant(
          contestantAEntry,
          contestantsById,
          `${round.id}-${slotIndex}-a`,
          winnerId,
        ),
        contestantB: buildDisplayContestant(
          contestantBEntry,
          contestantsById,
          `${round.id}-${slotIndex}-b`,
          winnerId,
        ),
        winnerId: winnerId ?? null,
        sourceMatchups,
        slotIndex,
        ...(matchup
          ? { matchupId: matchup.id, phase: matchup.phase, isBye: (matchup.entries?.length ?? 0) === 1 }
          : {}),
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

  const activeRound = displayRounds.find((round) => round.id === activeRoundId) ?? null;
  const activeShakeMatchup =
    activeRound?.matchups.find((matchup) => matchup.phase === 'shake' && !matchup.isBye) ?? null;
  const featuredMatchup =
    activeShakeMatchup ??
    activeRound?.matchups.find((matchup) => !matchup.isBye) ??
    activeRound?.matchups[0] ??
    displayRounds.flatMap((round) => round.matchups).find((matchup) => !matchup.isBye) ??
    null;

  const finalRound = lastRoundId
    ? displayRounds.find((round) => round.id === lastRoundId) ?? null
    : null;
  const finalMatchup =
    finalRound?.matchups.find((m) => !m.isBye && m.phase === 'scored' && m.winnerId) ?? null;
  const champion: DisplayChampion | null = finalMatchup
    ? (() => {
        const winner =
          finalMatchup.contestantA.id === finalMatchup.winnerId
            ? finalMatchup.contestantA
            : finalMatchup.contestantB.id === finalMatchup.winnerId
              ? finalMatchup.contestantB
              : null;
        if (!winner) return null;
        const runnerUp =
          finalMatchup.contestantA.id === winner.id
            ? finalMatchup.contestantB
            : finalMatchup.contestantA;
        return {
          contestant: winner,
          runnerUp: runnerUp ?? null,
          finalRoundName: finalRound?.name ?? 'Finals',
        };
      })()
    : null;

  return {
    contestId: contest.id,
    contestName: contest.name,
    contestKind,
    rounds: displayRounds,
    activeRoundId,
    activeRoundName: getDisplayRoundName(contest, activeRoundId),
    nextRoundName: getDisplayRoundName(contest, futureRoundId),
    activeShakeMatchup,
    featuredMatchup,
    featuredMatchupMode: activeShakeMatchup ? 'shake' : 'standby',
    totalRounds: displayRounds.length,
    phase: derivePhaseFromMatchups(matchups, activeRoundId),
    bracketStructure,
    isFinalRoundActive: activeRoundId != null && activeRoundId === lastRoundId,
    champion,
  };
}

function derivePhaseFromMatchups(matchups: Matchup[], activeRoundId: string | null): MatchupPhase {
  if (!activeRoundId) return 'set';
  const activeMatchups = matchups.filter((m) => m.roundId === activeRoundId);
  if (activeMatchups.some((m) => m.phase === 'shake')) return 'shake';
  if (activeMatchups.length > 0 && activeMatchups.every((m) => m.phase === 'scored')) {
    return 'scored';
  }
  return 'set';
}
