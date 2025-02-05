import './PlayerChance.scss';
import {
  calculateD20Rolls,
  calculateDistinctShardColorsUsed,
  calculatePlayerChance,
  retrieveTriviality,
} from './playerChanceCalculations';
import { ShardState } from './values';
import { TextField, Typography } from '@mui/material';
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
        <label className="player-chance-label">
          Player Modifier:
        </label>
        <TextField
          type="number"
          value={playerModifier}
          onChange={(event) => setPlayerModifier(Number(event.target.value))}
          variant="standard"
          slotProps={{
            input: {
              style: {
                color: window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'white' : 'black',
              },
            },  
          }}
        />
      </div>

      {totalD20Rolls > 0 && (
        <Typography>
          <strong>{trivality} ({chanceValue})</strong>
        </Typography>
      )}
    </div>
  );
}

export default PlayerChance;
