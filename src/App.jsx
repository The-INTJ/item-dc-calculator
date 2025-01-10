// App.js

import React, { useState } from 'react';
import './App.scss';

import values, { defaultEffectState } from './values';

// Our custom modules
import { calculateBaseDC } from './dcCalculations';
import EffectSection from './EffectSection';
import ShardSection from './ShardSection';
import PlayerChance from './PlayerChance';
import TitleBar from './Header/TitleBar';

/**
 * Main Application
 */
function App() {

  const [effects, setEffects] = useState([
    // We'll initialize with one effect
    defaultEffectState
  ]);

  const initialShardState = values.shardValues.map((shardObject) => {
    return {
      shardColor: shardObject.shardColor,
      shardValue: shardObject.shardValue,
      count: 0,
    };
  });
  const [shardCounts, setShardCounts] = useState(initialShardState);

  const [playerModifier, setPlayerModifier] = useState(0);

  const baseDC = calculateBaseDC(effects);
  const finalDC = baseDC; // In your new specs, shards do not affect DC

  function handleShardCountChange(shardIndex, newCountString) {
    const newShardCounts = [...shardCounts];
    newShardCounts[shardIndex] = {
      ...newShardCounts[shardIndex],
      count: Number(newCountString),
    };
    setShardCounts(newShardCounts);
  }

  function handlePlayerModifierChange(event) {
    const newModifierValue = Number(event.target.value);
    setPlayerModifier(newModifierValue);
  }

  // We'll compute a small breakdown for the effects only
  function renderEffectsBreakdown() {
    return effects.map((currentEffect, index) => {
      const partialDC = 
        (currentEffect.baseValue 
          * values.powerLevelModifiers[currentEffect.powerLevel]
          * values.frequencyModifiers[currentEffect.frequency]
          * values.complexityModifiers[currentEffect.complexity])
        + (currentEffect.dieValue * currentEffect.dieAmount);

      return (
        <li key={`effect-${index}`}>
          <strong>Effect {index + 1}:</strong> {currentEffect.effectType} 
          {'\u00A0=>'} {partialDC.toFixed(2)}
        </li>
      );
    });
  }

   function handleSave() {
    // Example: pop up an alert or do your actual save logic
    alert('Saving the current item...');
  }

  return (
    <div className="App-container">
      <TitleBar finalDC={finalDC} onSave={handleSave} />

      {/* Effects Section */}
      <EffectSection effects={effects} setEffects={setEffects} />

      <div className="player-effects-container">
        {/* Shards Section */}
        <ShardSection
          shardCounts={shardCounts}
          onShardCountChange={handleShardCountChange}
        />

        {/* Player Chance */}
        <PlayerChance
          shardCounts={shardCounts}
          playerModifier={playerModifier}
          onPlayerModifierChange={handlePlayerModifierChange}
          totalDC={finalDC}
        />
      </div>

        <div className="breakdown-container">
          <h2>Calculation Breakdown</h2>
          <ul>{renderEffectsBreakdown()}</ul>
          <p>+5 DC for each effect: {effects.length * 5}</p>
          <p><strong>Base DC (with effect additions):</strong> {baseDC.toFixed(2)}</p>
          <p><strong>Final DC:</strong> {finalDC.toFixed(2)}</p>
        </div>
    </div>
  );
}

export default App;
