/**
 * Pure bracket structure computation.
 * Given a number of rounds, computes the ideal tournament bracket skeleton:
 * matchup counts per round, and which matchups feed into which.
 *
 * Zero dependencies on contest data — just math.
 */

export interface BracketSlot {
  roundIndex: number;
  matchupIndex: number;
  /** Indices of the two matchups from the previous round that feed into this one. null for round 0 (seeded). */
  sourceMatchups: [number, number] | null;
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

  const totalContestants = 2 ** numRounds;
  const rounds: BracketSlotRound[] = [];

  for (let i = 0; i < numRounds; i++) {
    const matchupCount = 2 ** (numRounds - 1 - i);
    const slots: BracketSlot[] = [];

    for (let j = 0; j < matchupCount; j++) {
      slots.push({
        roundIndex: i,
        matchupIndex: j,
        sourceMatchups: i === 0 ? null : [j * 2, j * 2 + 1],
      });
    }

    rounds.push({ roundIndex: i, matchupCount, slots });
  }

  return { totalRounds: numRounds, totalContestants, rounds };
}

export interface MatchupGridPlacement {
  rowStart: number;
  rowSpan: number;
}

/**
 * Placement of a single matchup inside a CSS Grid column whose row count is
 * `getBracketGridRowCount(totalRounds)`. Each subsequent round doubles the
 * span, which naturally vertically centers a winner between its two feeders.
 */
export function getMatchupGridPlacement(roundIndex: number, slotIndex: number): MatchupGridPlacement {
  const rowSpan = 2 ** (roundIndex + 1);
  const rowStart = slotIndex * rowSpan + 1;
  return { rowStart, rowSpan };
}

/**
 * Total number of rows a bracket of `totalRounds` rounds needs for matchup
 * placement. Matches `2 ** totalRounds` (the number of round-0 contestants).
 */
export function getBracketGridRowCount(totalRounds: number): number {
  return totalRounds > 0 ? 2 ** totalRounds : 0;
}
