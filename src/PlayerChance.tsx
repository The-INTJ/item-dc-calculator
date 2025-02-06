import './PlayerChance.scss';
import {
  calculateD20Rolls,
  calculateDistinctShardColorsUsed,
  calculatePlayerChance,
  retrieveTriviality,
} from './playerChanceCalculations';
import { ShardState } from './values';
import { InputLabel, TextField, Typography } from '@mui/material';
import { useState } from 'react';

type PlayerChanceProps = {
  shards: ShardState[];
  playerModifier: number;
  finalDC: number;
};
function PlayerChance({ shards, finalDC }: PlayerChanceProps) {
  const [playerModifier, setPlayerModifier] = useState(0);
  const totalD20Rolls = calculateD20Rolls(shards);
  const distinctColorsUsed = calculateDistinctShardColorsUsed(shards);
  const chanceValue = calculatePlayerChance(totalD20Rolls, playerModifier, distinctColorsUsed, finalDC);
  const trivality = retrieveTriviality(chanceValue);

  return (
    <div className="player-chance-container">
      <div className="player-chance-details">
        <InputLabel 
          className="player-chance-label"
          sx={{ color: 'white' }}
        >
          Player Modifier
        </InputLabel>
        <TextField
          sx={{ 'input': { color: 'white' } } }
          type="number"
          value={playerModifier}
          onChange={(event) => setPlayerModifier(Number(event.target.value))}
          variant="standard"
        />
      </div>

      {totalD20Rolls > 0 && (
        <Typography 
          className="player-chance-text"
          fontSize={'1.3rem'}
        >
          <strong>{trivality} <br/>({chanceValue})</strong>
        </Typography>
      )}
    </div>
  );
}

export default PlayerChance;
