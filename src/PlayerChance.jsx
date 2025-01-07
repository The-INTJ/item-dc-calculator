// PlayerChance.js

import React from 'react';
import {
  calculateD20Rolls,
  calculateDistinctShardColorsUsed,
  calculatePlayerChance
} from './playerChanceCalculations';

/**
 * Shows the "player chance" (number of d20 rolls, distinct colors, etc.).
 * 
 * Props:
 *   shardCounts:  array of { shardColor, shardValue, count }
 *   playerModifier: number
 *   onPlayerModifierChange: function(event) => void
 */
function PlayerChance({ shardCounts, playerModifier, onPlayerModifierChange }) {
  const totalD20Rolls = calculateD20Rolls(shardCounts);
  const distinctColorsUsed = calculateDistinctShardColorsUsed(shardCounts);
  const chanceValue = calculatePlayerChance(totalD20Rolls, playerModifier, distinctColorsUsed);

  return (
    <div style={{ marginTop: '20px', marginBottom: '20px' }}>
      <h2>Player Chance</h2>

      <div style={{ marginBottom: '10px' }}>
        <label style={{ fontWeight: 'bold', marginRight: '10px' }}>
          Player Modifier:
        </label>
        <input
          type="number"
          value={playerModifier}
          onChange={onPlayerModifierChange}
          style={{ width: '80px' }}
        />
      </div>

      <p>
        <strong>Total d20 Rolls:</strong> {totalD20Rolls}
        <br />
        <strong>Distinct Shard Colors Used:</strong> {distinctColorsUsed}
        <br />
        <strong>Player Modifier:</strong> {playerModifier}
        <br />
        <strong>Player Chance Formula:</strong> 
        {' '} (d20 rolls × 10) + (modifier × distinct colors)
        <br />
        <strong>Result:</strong> {chanceValue}
      </p>
    </div>
  );
}

export default PlayerChance;