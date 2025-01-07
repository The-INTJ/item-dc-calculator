// playerChanceCalculations.js

/**
 * Returns total d20 rolls from the shard array.
 * shard.shardValue = how many d20 rolls that color grants
 * shard.count = how many shards of that color
 */
export function calculateD20Rolls(shardArray) {
  return shardArray.reduce((accumulatedRolls, shard) => {
    const totalForColor = shard.shardValue * shard.count;
    return accumulatedRolls + totalForColor;
  }, 0);
}

/**
 * Returns how many *distinct* shard colors have count > 0
 */
export function calculateDistinctShardColorsUsed(shardArray) {
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
export function calculatePlayerChance(totalD20Rolls, playerModifier, distinctShardColorsUsed) {
  return Math.ceil((totalD20Rolls * 10)) + (playerModifier * distinctShardColorsUsed);
}