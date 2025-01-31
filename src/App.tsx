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

/**
 * Main Application
 */
function App() {

  const [itemName, setItemName] = useState('Glamdring');
  const [effects, setEffects] = useState([
    defaultEffectState
  ]);
  const [shardCounts, setShardCounts] = useState(initialShardState);
  const [playerModifier, setPlayerModifier] = useState(0);

  const baseDC = calculateEffectSum(effects);
  const effectCountDC = calculateEffectCountDC(effects);
  const finalDC = calculateFinalDC(effects);

  function handleShardCountChange(shardIndex: number, newCountString: string) {
    const newShardCounts = [...shardCounts];
    newShardCounts[shardIndex] = {
      ...newShardCounts[shardIndex],
      count: Number(newCountString),
    };
    setShardCounts(newShardCounts);
  }

    // Save the item to the server by name
  async function handleSave() {
    try {
      const response = await fetch('http://localhost:3000/save-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: itemName,
          effectsArray: effects,
        }),
      });
      console.log('Item saved successfully');
      return response;
    } catch (error) {
      console.error('Error saving item:', error);
      return { status: 500 };
    }
  }

  const handleItemLoad = async (item: {name: string, effectsArray: Effect[]}) => {
      try {
        const response = await fetch(`http://localhost:3000/load-item/${item.name}`);
        if (!response.ok) {
          throw new Error('Failed to load item');
        }
        const loadedItem = await response.json();
        setEffects(loadedItem.effectsArray);
        setItemName(loadedItem.name);
        console.log('Effects loaded successfully');
      } catch (error) {
        console.error('Error loading effects:', error);
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
