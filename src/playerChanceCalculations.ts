import { ShardState } from './values';

/**
 * Returns total d20 rolls from the shard array.
 * shard.shardValue = how many d20 rolls that color grants
 * shard.count = how many shards of that color
 */
export function calculateD20Rolls(shardArray: ShardState[]): number {
  return shardArray.reduce((accumulatedRolls, shard) => {
    const totalForColor = shard.shardValue * shard.count;
    return accumulatedRolls + totalForColor;
  }, 0);
}

/**
 * Returns how many *distinct* shard colors have count > 0
 */
export function calculateDistinctShardColorsUsed(shardArray: ShardState[]): number {
  return shardArray.reduce((distinctCount, shard) => {
    if (shard.count > 0) {
      return distinctCount + 1;
    }
    return distinctCount;
  }, 0);
}

/**
 * The final "player chance" formula:
 *  (totalD20Rolls * 10) + (playerModifier * numberOfDistinctColorsUsed)
 */
export function calculatePlayerChance(totalD20Rolls: number, playerModifier: number, distinctShardColorsUsed: number, totalDC: number): number {
  const playerChance = Math.ceil((totalD20Rolls * 10)) + (playerModifier * distinctShardColorsUsed) - (10 + playerModifier);
  return totalDC - playerChance;
}

/**
 * Returns a string indicating the trivality of the chance value.
 */
export function retrieveTriviality(chanceValue: number): string {
  if (chanceValue >= 30) {
    return 'Inconceivable effort';
  }
  if (chanceValue >= 25) {
    return 'Nearly Impossible';
  }
  if (chanceValue >= 20) {
    return 'Daunting';
  }
  if (chanceValue >= 15) {
    return 'Difficult';
  }
  if (chanceValue >= 10) {
    return 'Moderate';
  }
  if (chanceValue >= 5) {
    return 'Easy';
  }
  return 'Trivial';
}
