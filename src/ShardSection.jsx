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
            <div
              className="shard-item"
              key={shardData.shardColor}
              style={{ backgroundColor: shardData.shardColor}}
            >
              <button
                className='shard-btn add'
                onClick={() => onShardCountChange(shardIndex, shardData.count + 1)}
              >
              +
              </button>
              <p className="shard-num">
                {shardData.count}
              </p>
              <button
                className='shard-btn sub'
                onClick={() => onShardCountChange(shardIndex, shardData.count - 1)}
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
