// ShardSection.js

import React from 'react';

/**
 * Renders inputs to select how many shards of each color to use.
 * 
 * Props:
 *   shardCounts: array of { shardColor, shardValue, count }
 *   onShardCountChange: function(shardIndex, newValue)
 */
function ShardSection({ shardCounts, onShardCountChange }) {
  return (
    <div>
      <h2>Shards</h2>
      <p>
        Select how many of each shard color to use. Each shard color grants a certain 
        number of d20 rolls.
      </p>

      <div className="shard-container">
        {shardCounts.map((shardData, shardIndex) => {
          return (
            <div className="shard-row" key={shardData.shardColor}>
              <label>
                {shardData.shardColor} ({shardData.shardValue} rolls):
              </label>
              <input
                type="number"
                min="0"
                value={shardData.count}
                onChange={(event) =>
                  onShardCountChange(shardIndex, event.target.value)
                }
                style={{ width: '60px', marginLeft: '5px' }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ShardSection;
