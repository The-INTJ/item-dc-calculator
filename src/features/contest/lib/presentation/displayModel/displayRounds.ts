import type {
  Contest,
  Contestant,
  Entry,
  Matchup,
} from '../../../contexts/contest/contestTypes';
import type { BracketStructure } from '../../domain/bracketMath';
import { getContestRounds, getEntryScore } from '../../domain/contestGetters';
import { getEntryDisplayName } from '../../domain/entryLabels';
import {
  getComputedRoundStatus,
  getMatchupsForRound,
} from '../../domain/matchupGetters';
import type {
  DisplayContestant,
  DisplayMatchup,
  DisplayRound,
} from './displayModelTypes';

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

/**
 * Derive the bracket shape from what seeding actually produces: round 0's
 * real matchup count (falling back to ceil(contestants/2) pre-seed), then a
 * ceil(n/2) cascade. Per-round actual counts overlay the cascade so manual
 * over-filled rounds still render in-grid instead of spilling off it.
 */
export function deriveBracketShape(contest: Contest, matchups: Matchup[]): number[] {
  const contestRounds = getContestRounds(contest);
  const roundMatchupCounts = contestRounds.map(
    (round) => getMatchupsForRound(matchups, round.id).length,
  );
  const firstRoundCount =
    (roundMatchupCounts[0] ?? 0) > 0
      ? roundMatchupCounts[0]
      : Math.max(1, Math.ceil((contest.contestants?.length ?? 0) / 2));
  const shape: number[] = [];
  for (let i = 0; i < contestRounds.length; i += 1) {
    const derived = i === 0 ? firstRoundCount : Math.ceil(shape[i - 1] / 2);
    shape.push(Math.max(derived, roundMatchupCounts[i] ?? 0));
  }
  return shape;
}

/** Build the per-round display structures from stored matchups and bracket math. */
export function buildDisplayRounds(
  contest: Contest,
  matchups: Matchup[],
  bracketStructure: BracketStructure,
  activeRoundId: string | null,
): DisplayRound[] {
  const contestRounds = getContestRounds(contest);
  const contestantsById = new Map(contest.contestants.map((c) => [c.id, c]));

  return contestRounds.map((round, roundIndex) => {
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
}
