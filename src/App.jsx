// App.js

import React, { useState } from 'react';
import './App.scss';

import { defaultEffectState, initialShardState } from './values';
import { saveEffectsToFile, loadEffectsFromFile } from './fileManipulations';

// Our custom modules
import { calculateFinalDC, calculateEffectDC, calculateEffectSum, calculateEffectCountDC } from './dcCalculations';
import EffectSection from './EffectSection';
import ShardSection from './ShardSection';
import PlayerChance from './PlayerChance';
import TitleBar from './Header/TitleBar';

/**
 * Main Application
 */
function App() {

  const [effects, setEffects] = useState([
    defaultEffectState
  ]);
  const [shardCounts, setShardCounts] = useState(initialShardState);
  const [playerModifier, setPlayerModifier] = useState(0);

  const baseDC = calculateEffectSum(effects);
  const effectCountDC = calculateEffectCountDC(effects);
  const finalDC = calculateFinalDC(effects);

  function handleShardCountChange(shardIndex, newCountString) {
    const newShardCounts = [...shardCounts];
    newShardCounts[shardIndex] = {
      ...newShardCounts[shardIndex],
      count: Number(newCountString),
    };
    setShardCounts(newShardCounts);
  }

  const handleSave = async () => {
      try {
        await saveEffectsToFile(effects);
        console.log('Effects saved successfully');
      } catch (error) {
        console.error('Error saving effects:', error);
      }
    };

  const handleLoad = async () => {
      try {
        const loadedEffects = await loadEffectsFromFile();
        setEffects(loadedEffects);
        console.log('Effects loaded successfully');
      } catch (error) {
        console.error('Error loading effects:', error);
      }
    };

  function handlePlayerModifierChange(event) {
    const newModifierValue = Number(event.target.value);
    setPlayerModifier(newModifierValue);
  }

  function renderEffectsBreakdown() {
    return effects.map((currentEffect, index) => {
      const partialDC = calculateEffectDC(currentEffect);

      return (
        <li key={`effect-${index}`}>
          <strong>Effect {index + 1}:</strong> {currentEffect.effectType} 
          {'\u00A0=>'} {partialDC.toFixed(2)}
        </li>
      );
    });
  }

  return (
    <div className="App-container">
      <TitleBar finalDC={finalDC} onSave={handleSave} onLoad={handleLoad} />

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
          <p><strong>Base DC:</strong> {baseDC.toFixed(2)}</p>
          <p>+5 DC for each new effect past the first: {effectCountDC.toFixed(2)}</p>
          <p><strong>Final DC:</strong> {finalDC.toFixed(2)}</p>
        </div>
    </div>
  );
}

export default App;
