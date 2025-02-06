// ShardSection.js

import PlayerChance from "./PlayerChance";
import { ShardState } from "./values";

/**
 * Renders inputs to select how many shards of each color to use.
 * 
 * Props:
 *   shards: array of { shardColor, shardValue, count }
 *   onShardCountChange: function(shardIndex, newValue)
 */

interface ShardSectionProps {
  shards: ShardState[];
  onShardChange: (shardIndex: number, newCount: number) => void;
  finalDC: number;
}

function ShardSection({ shards, onShardChange, finalDC }: ShardSectionProps) {
  return (
    <div>
      <PlayerChance 
        shards={shards} 
        playerModifier={0}
        finalDC={finalDC}
      />

      <div className="shard-container">
        <img className="img" src="/Dresser.png" alt="Dresser" />
        {shards.map((shardData, shardIndex) => {
            return (
            <div
              className={`shard-item shard-${shardIndex}`}
              key={shardData.shardColor}
            >
              <button
              className={`shard-btn add ${shardData.shardColor}`}
              onClick={() => onShardChange(shardIndex, shardData.count + 1)}
              >
              +
              </button>
              <p className="shard-num">
              {shardData.count}
              </p>
              <button
              className={`shard-btn sub ${shardData.shardColor}`}
              onClick={() => onShardChange(shardIndex, shardData.count - 1)}
              >
              -
              </button>
            </div>
            );
        })}
      </div>
    </div>
  );
}

export default ShardSection;
