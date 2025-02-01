import './PlayerChance.scss';
import {
  calculateD20Rolls,
  calculateDistinctShardColorsUsed,
  calculatePlayerChance,
  retrieveTriviality,
} from './playerChanceCalculations';
import { ShardState } from './values';

type PlayerChanceProps = {
  shards: ShardState[];
  playerModifier: number;
  onPlayerModifierChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  totalDC: number;
};
function PlayerChance({ shards, playerModifier, onPlayerModifierChange, totalDC }: PlayerChanceProps) {
  const totalD20Rolls = calculateD20Rolls(shards);
  const distinctColorsUsed = calculateDistinctShardColorsUsed(shards);
  const chanceValue = calculatePlayerChance(totalD20Rolls, playerModifier, distinctColorsUsed, totalDC);
  const trivality = retrieveTriviality(chanceValue);

  return (
    <div className="player-chance-container">
      <h2>Player Chance</h2>

      <div className="player-chance-details">
        <label className="player-chance-label">
          Player Modifier:
        </label>
        <input
          type="number"
          value={playerModifier}
          onChange={onPlayerModifierChange}
          className="player-chance-input"
        />
      </div>

      <p>
        <strong>Total d20 Rolls:</strong> {totalD20Rolls}
        <br />
        <strong>Distinct Shard Colors Used:</strong> {distinctColorsUsed}
        <br />
        <strong>Player Modifier:</strong>   {playerModifier}
        <br />
        <strong>Player Chance Formula:</strong> 
        {' '} Total DC - ((d20 rolls × 10) - 10) + ((modifier × distinct colors) - modifier)
        <br />
        <strong>Result:</strong> {chanceValue} ({trivality})
      </p>
    </div>
  );
}

export default PlayerChance;
