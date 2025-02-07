import './PlayerChance.scss';
import {
  calculateD20Rolls,
  calculateDistinctShardColorsUsed,
  calculatePlayerChance,
  retrieveTriviality,
} from './playerChanceCalculations';
import { ShardState } from './values';
import { Typography } from '@mui/material';
import { useState, useEffect } from 'react';

type PlayerChanceProps = {
  shards: ShardState[];
  playerModifier: number;
  finalDC: number;
};

function PlayerChance({ shards, finalDC }: PlayerChanceProps) {
  const [playerModifier, setPlayerModifier] = useState(0);
  // internal value can be a string or a number – used directly in the input
  const [internalModifier, setInternalModifier] = useState<string | number>(playerModifier);

  // Debounce effect: update playerModifier after 300ms of no changes to internalModifier
  useEffect(() => {
    const handler = setTimeout(() => {
      // Convert internalModifier to a number; if conversion fails, use 0
      let numeric = typeof internalModifier === 'string' ? Number(internalModifier) : internalModifier;
      if (isNaN(numeric)) {
        numeric = 0;
      }
      setPlayerModifier(numeric);
      setInternalModifier(numeric);
    }, 1000);
    return () => clearTimeout(handler);
  }, [internalModifier]);

  const totalD20Rolls = calculateD20Rolls(shards);
  const distinctColorsUsed = calculateDistinctShardColorsUsed(shards);
  const chanceValue = calculatePlayerChance(totalD20Rolls, playerModifier, distinctColorsUsed, finalDC);
  const trivality = retrieveTriviality(chanceValue);

  // Update the internal modifier immediately on input changes
  function safeSetModifier(value: string | number) {
    setInternalModifier(value);
  }

  return (
    <div className="player-chance-container">
      <div className="player-chance-details">
        <strong>+</strong>
        <input
          className="player-mod-input"
          value={internalModifier}
          onChange={(event) => safeSetModifier(event.target.value)}
        />
      </div>

      {totalD20Rolls > 0 && (
        <Typography
          className="player-chance-text"
          fontSize={'1.3rem'}
        >
          <strong>{trivality} <br />({chanceValue})</strong>
        </Typography>
      )}
    </div>
  );
}

export default PlayerChance;
