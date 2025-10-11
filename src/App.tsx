// App.js

import { useState } from 'react';
import './App.scss';

import { defaultEffectState, type Effect, initialShardState } from './values';

// Our custom modules
import { calculateFinalDC } from './dcCalculations';
import EffectSection from './EffectSection';
import ShardSection from './ShardSection';
import TitleBar from './Header/TitleBar';
import { db } from './server';
import { EffectInfoProvider } from './context/EffectInfoContext';

/**
 * Main Application
 */
function App() {

  const [itemName, setItemName] = useState('Glamdring');
  const [effects, setEffects] = useState([
    defaultEffectState
  ]);
  const [shards, setShards] = useState(initialShardState);

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
    } catch {
      return { status: 500 };
    }
  }

  // Load a specific item from localStorage
  const handleItemLoad = async (item: { name: string; effectsArray: Effect[] }) => {
    try {
      const response = await db.loadItem(item.name);
      if (response.status !== 200) {
        throw new Error('Failed to load item');
      }
      setEffects(response.item.effectsArray);
      setItemName(response.item.name);
    } catch {
      // Failed loads leave the existing item untouched.
    }
  };

  return (
    <EffectInfoProvider>
      <TitleBar
        finalDC={finalDC}
        handleSave={handleSave}
        handleItemLoad={handleItemLoad}
        itemName={itemName}
        setItemName={setItemName}
      />
      <div className="App-container">

        {/* Effects Section */}
        <EffectSection 
          effects={effects} 
          setEffects={setEffects} 
          itemName={itemName}
          setItemName={setItemName}
        />

      </div>
      <div className="player-effects-container">
        {/* Shards Section */}
        <ShardSection
          shards={shards}
          onShardChange={handleShardCountChange}
          finalDC={finalDC}
        />
      </div>
    </EffectInfoProvider>
  );
}

export default App;
