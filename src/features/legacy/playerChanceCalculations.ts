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
export function calculatePlayerChance(
  totalD20Rolls: number,
  playerModifier: number,
  distinctShardColorsUsed: number,
  finalDC: number
): number {
  const baseChance = Math.ceil(totalD20Rolls * 10);
  const bonusFromColors = playerModifier * distinctShardColorsUsed;
  const penalty = 10 + playerModifier;
  const playerChanceScore = baseChance + bonusFromColors - penalty;
  const finalChance = finalDC - playerChanceScore;

  return finalChance;
}

/**
 * Returns a string indicating the trivality of the chance value.
 */
export function retrieveTriviality(chanceValue: number): string {
  if (chanceValue >= 40) {
    return "Be careful not to choke on your aspirations.";
  }
  if (chanceValue >= 30) {
    return 'Inconceivable! The word means what I think it does';
  }
  if (chanceValue >= 25) {
    return 'Nearly impossible -- I hope you submitted a session summary';
  }
  if (chanceValue >= 20) {
    return 'Rather daunting if I do say so';
  }
  if (chanceValue >= 15) {
    return 'Difficult tbh';
  }
  if (chanceValue >= 10) {
    return 'Moderatly challenging';
  }
  if (chanceValue >= 5) {
    return 'So easy';
  }
  return 'Psh, trivial';
}
