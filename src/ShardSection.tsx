// ShardSection.js

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
}

function ShardSection({ shards, onShardChange }: ShardSectionProps) {
  return (
    <div>
      <h2>Shards</h2>
      <p>
        Select how many of each shard color to use. Each shard color grants a certain 
        number of d20 rolls.
      </p>

      <div className="shard-container">
        {shards.map((shardData, shardIndex) => {
            return (
            <div
              className="shard-item"
              key={shardData.shardColor}
              style={{ backgroundColor: shardData.shardHexColor}}
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
