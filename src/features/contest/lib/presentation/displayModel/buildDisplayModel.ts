import type {
  Contest,
  Matchup,
  MatchupPhase,
} from '../../../contexts/contest/contestTypes';
import {
  computeBracketStructureFromShape,
  getBracketGridRowCountForShape,
} from '../../domain/bracketMath';
import { getContestRounds, getRoundById } from '../../domain/contestGetters';
import { getActiveRoundIdFromMatchups } from '../../domain/matchupGetters';
import { normalizeContestKind } from '../displaySurface';
import { deriveChampion, deriveFaceOffRoundId } from './displayFinale';
import type {
  DisplayMatchup,
  DisplayModel,
  DisplayRound,
} from './displayModelTypes';
import { buildDisplayRounds, deriveBracketShape } from './displayRounds';

function getDisplayRoundName(contest: Contest, roundId: string | null): string | null {
  if (!roundId) return null;
  return getRoundById(contest, roundId)?.name ?? null;
}

/** Pick the shake matchup (if one is live) and the fallback spotlight matchup. */
function selectFeaturedMatchups(
  displayRounds: DisplayRound[],
  activeRoundId: string | null,
): {
  activeShakeMatchup: DisplayMatchup | null;
  featuredMatchup: DisplayMatchup | null;
} {
  const activeRound = displayRounds.find((round) => round.id === activeRoundId) ?? null;
  const activeShakeMatchup =
    activeRound?.matchups.find((matchup) => matchup.phase === 'shake' && !matchup.isBye) ?? null;
  const featuredMatchup =
    activeShakeMatchup ??
    activeRound?.matchups.find((matchup) => !matchup.isBye) ??
    activeRound?.matchups[0] ??
    displayRounds.flatMap((round) => round.matchups).find((matchup) => !matchup.isBye) ??
    null;
  return { activeShakeMatchup, featuredMatchup };
}

/**
 * Build the display model for a contest from the stored matchup collection.
 * Matchups are the authoritative source for round status, seeding, and phase.
 */
export function buildDisplayModel(contest: Contest, matchups: Matchup[]): DisplayModel {
  const contestRounds = getContestRounds(contest);

  const shape = deriveBracketShape(contest, matchups);
  const bracketStructure = computeBracketStructureFromShape(shape);
  const gridRowCount = getBracketGridRowCountForShape(shape);

  const activeRoundId = getActiveRoundIdFromMatchups(contestRounds, matchups);
  const lastRoundId = contestRounds[contestRounds.length - 1]?.id ?? null;
  const contestKind = normalizeContestKind(contest.config);

  const activeIndex = contestRounds.findIndex((round) => round.id === activeRoundId);
  const futureRoundId =
    activeIndex >= 0 && activeIndex + 1 < contestRounds.length
      ? contestRounds[activeIndex + 1].id
      : null;

  const displayRounds = buildDisplayRounds(contest, matchups, bracketStructure, activeRoundId);

  const { activeShakeMatchup, featuredMatchup } = selectFeaturedMatchups(
    displayRounds,
    activeRoundId,
  );

  const finalRound = lastRoundId
    ? displayRounds.find((round) => round.id === lastRoundId) ?? null
    : null;
  const lastRoundCapacity = shape[shape.length - 1] ?? 0;
  const champion = deriveChampion(finalRound, lastRoundCapacity);
  const faceOffRoundId = deriveFaceOffRoundId(finalRound, activeRoundId, lastRoundCapacity);

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
    gridRowCount,
    isFinalRoundActive: activeRoundId != null && activeRoundId === lastRoundId,
    faceOffRoundId,
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
