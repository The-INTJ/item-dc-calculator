/**
 * Pure bracket structure computation.
 * Given a number of rounds, computes the ideal tournament bracket skeleton:
 * matchup counts per round, and which matchups feed into which.
 *
 * Zero dependencies on contest data — just math.
 */

export interface BracketSlot {
  roundIndex: number;
  slotIndex: number;
  /**
   * Indices of the previous-round matchups that feed into this one — usually
   * two, but one for slots fed by a lone bye in odd shapes. null for round 0
   * (seeded).
   */
  sourceMatchups: number[] | null;
}

export interface BracketSlotRound {
  roundIndex: number;
  matchupCount: number;
  slots: BracketSlot[];
}

export interface BracketStructure {
  totalRounds: number;
  totalContestants: number;
  rounds: BracketSlotRound[];
}

/**
 * Compute the ideal bracket structure for a given number of rounds.
 *
 * - Round i has 2^(numRounds - 1 - i) matchups
 * - Each matchup in round i>0 sources from matchups [j*2, j*2+1] in round i-1
 * - totalContestants = 2^numRounds
 *
 * Examples:
 *   1 round  → 2 contestants, [1 matchup]
 *   2 rounds → 4 contestants, [2 matchups, 1 matchup]
 *   3 rounds → 8 contestants, [4, 2, 1]
 */
export function computeBracketStructure(numRounds: number): BracketStructure {
  if (numRounds <= 0) {
    return { totalRounds: 0, totalContestants: 0, rounds: [] };
  }

  const shape: number[] = [];
  for (let i = 0; i < numRounds; i++) {
    shape.push(2 ** (numRounds - 1 - i));
  }
  return computeBracketStructureFromShape(shape);
}

/**
 * Per-round matchup capacities derived from the actual first-round size:
 * `c0 = firstRoundMatchupCount`, `c(i+1) = ceil(ci / 2)`. This is what
 * seeding actually produces (pairWithByes on the previous round's winners),
 * so a display grid built from this shape can never be over-filled by the
 * seeding flow. Zero propagates zero (unseeded contest).
 */
export function computeBracketShape(
  firstRoundMatchupCount: number,
  totalRounds: number,
): number[] {
  const shape: number[] = [];
  let current = Math.max(0, firstRoundMatchupCount);
  for (let i = 0; i < totalRounds; i++) {
    shape.push(current);
    current = Math.ceil(current / 2);
  }
  return shape;
}

/**
 * Bracket structure for an arbitrary per-round shape (not just power-of-2).
 * Round i>0 slot j is fed by previous-round slots [2j, 2j+1], filtered to the
 * slots that actually exist — a slot fed only by a bye has a single source.
 */
export function computeBracketStructureFromShape(shape: number[]): BracketStructure {
  const rounds: BracketSlotRound[] = [];

  for (let i = 0; i < shape.length; i++) {
    const matchupCount = Math.max(0, shape[i]);
    const slots: BracketSlot[] = [];

    for (let j = 0; j < matchupCount; j++) {
      let sourceMatchups: number[] | null = null;
      if (i > 0) {
        const sources = [j * 2, j * 2 + 1].filter((s) => s < shape[i - 1]);
        sourceMatchups = sources.length > 0 ? sources : null;
      }
      slots.push({ roundIndex: i, slotIndex: j, sourceMatchups });
    }

    rounds.push({ roundIndex: i, matchupCount, slots });
  }

  return {
    totalRounds: shape.length,
    totalContestants: (shape[0] ?? 0) * 2,
    rounds,
  };
}

/**
 * Rounds needed to crown a champion from a field of `contestantCount`:
 * ceil(log2(n)), 0 when there is nothing to bracket.
 */
export function getRequiredRoundCount(contestantCount: number): number {
  if (contestantCount < 2) return 0;
  return 32 - Math.clz32(contestantCount - 1);
}

export interface MatchupGridPlacement {
  rowStart: number;
  rowSpan: number;
}

/**
 * Placement of a single matchup inside a CSS Grid column. Each subsequent
 * round doubles the span, which naturally vertically centers a winner between
 * its two feeders. When `gridRowCount` is provided, the span clamps to the
 * grid so odd-shape slots (fed by a lone bye, or a surplus final) stay
 * in-grid instead of spilling into implicit rows.
 */
export function getMatchupGridPlacement(
  roundIndex: number,
  slotIndex: number,
  gridRowCount?: number,
): MatchupGridPlacement {
  const naturalSpan = 2 ** (roundIndex + 1);
  const rowStart = slotIndex * naturalSpan + 1;
  if (gridRowCount === undefined) {
    return { rowStart, rowSpan: naturalSpan };
  }
  const rowEnd = Math.min(rowStart + naturalSpan - 1, gridRowCount);
  return { rowStart, rowSpan: Math.max(1, rowEnd - rowStart + 1) };
}

/**
 * Total number of rows a bracket of `totalRounds` rounds needs for matchup
 * placement. Matches `2 ** totalRounds` (the number of round-0 contestants).
 */
export function getBracketGridRowCount(totalRounds: number): number {
  return totalRounds > 0 ? 2 ** totalRounds : 0;
}

/**
 * Rows an arbitrary-shape bracket needs: every slot keeps at least its
 * two-row footprint (`rowStart + 1`), and power-of-2 shapes reduce to the
 * classic `2^totalRounds`.
 */
export function getBracketGridRowCountForShape(shape: number[]): number {
  let rows = 0;
  for (let i = 0; i < shape.length; i++) {
    if (shape[i] <= 0) continue;
    rows = Math.max(rows, (shape[i] - 1) * 2 ** (i + 1) + 2);
  }
  return rows;
}

/**
 * Pair entries for a round, leaving one bye if the count is odd.
 * The last entry gets the bye (caller can shuffle/order the input first if random byes are desired).
 */
export function pairWithByes(entryIds: string[]): {
  pairs: Array<[string, string]>;
  byeId: string | null;
} {
  const pairs: Array<[string, string]> = [];
  const evenCount = entryIds.length - (entryIds.length % 2);
  for (let i = 0; i < evenCount; i += 2) {
    pairs.push([entryIds[i], entryIds[i + 1]]);
  }
  const byeId = entryIds.length % 2 === 1 ? entryIds[entryIds.length - 1] : null;
  return { pairs, byeId };
}

export interface MatchupPairingInput {
  id: string;
  slotIndex: number;
}

export interface MatchupPairing {
  /** ID of the downstream matchup this one's winner advances into. */
  advancesToMatchupId: string;
  /** Slot (0 or 1) of the downstream matchup the winner fills. */
  advancesToSlot: number;
}

/**
 * Given the matchups of round N and the matchups of round N+1 (both ordered by slotIndex),
 * compute the advancement pointer (`advancesToMatchupId`, `advancesToSlot`) for each
 * round-N matchup using the canonical bracket pairing (slot 2k and 2k+1 feed slot k).
 *
 * Returns a map keyed by the source matchup id.
 */
export function pairMatchupsAcrossRounds(
  fromRound: MatchupPairingInput[],
  toRound: MatchupPairingInput[],
): Map<string, MatchupPairing> {
  const bySlot = new Map<number, MatchupPairingInput>();
  for (const m of toRound) bySlot.set(m.slotIndex, m);

  const out = new Map<string, MatchupPairing>();
  for (const source of fromRound) {
    const targetSlot = Math.floor(source.slotIndex / 2);
    const target = bySlot.get(targetSlot);
    if (!target) continue;
    out.set(source.id, {
      advancesToMatchupId: target.id,
      advancesToSlot: source.slotIndex % 2,
    });
  }
  return out;
}
