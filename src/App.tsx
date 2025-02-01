// App.js

import { useState } from 'react';
import './App.scss';

import { defaultEffectState, Effect, initialShardState } from './values';

// Our custom modules
import { calculateFinalDC, calculateEffectDC, calculateEffectSum, calculateEffectCountDC } from './dcCalculations';
import EffectSection from './EffectSection';
import ShardSection from './ShardSection';
import PlayerChance from './PlayerChance';
import TitleBar from './Header/TitleBar';
import { db } from './server';

/**
 * Main Application
 */
function App() {

  const [itemName, setItemName] = useState('Glamdring');
  const [effects, setEffects] = useState([
    defaultEffectState
  ]);
  const [shards, setShards] = useState(initialShardState);
  const [playerModifier, setPlayerModifier] = useState(0);

  const baseDC = calculateEffectSum(effects);
  const effectCountDC = calculateEffectCountDC(effects);
  const finalDC = calculateFinalDC(effects);

  function handleShardCountChange(shardIndex: number, newCountString: number) {
    const newShards = [...shards];
    newShards[shardIndex] = {
      ...newShards[shardIndex],
      count: newCountString,
    };
    setShards(newShards);
  }

  // Save the item to localStorage by name
  async function handleSave() {
    try {
      const response = await db.saveItem(itemName, effects);
      return response;
    } catch (error) {
      return { status: 500 };
    }
  }

  // Load a specific item from localStorage
  const handleItemLoad = async (item: { name: string; effectsArray: any[] }) => {
    try {
      const response = await db.loadItem(item.name);
      if (response.status !== 200) {
        throw new Error('Failed to load item');
      }
      setEffects(response.item.effectsArray);
      setItemName(response.item.name);
    } catch (error) {
    }
  };

  function handlePlayerModifierChange(event: React.ChangeEvent<HTMLInputElement>) {
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
      <TitleBar 
        finalDC={finalDC} 
        handleSave={handleSave} 
        handleItemLoad={handleItemLoad}
      />

      {/* Effects Section */}
      <EffectSection 
        effects={effects} 
        setEffects={setEffects} 
        itemName={itemName}
        setItemName={setItemName}
      />

      <div className="player-effects-container">
        {/* Shards Section */}
        <ShardSection
          shards={shards}
          onShardChange={handleShardCountChange}
        />

        {/* Player Chance */}
        <PlayerChance
          shards={shards}
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
