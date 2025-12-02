// App.js
'use client';
import { CssBaseline, ThemeProvider } from '@mui/material';

import { useMemo, useState } from 'react';

import { defaultEffectState, type Effect, initialShardState } from './values';

// Our custom modules
import { calculateFinalDC } from './dcCalculations';
import EffectSection from './EffectSection';
import ShardSection from './ShardSection';
import TitleBar from './Header/TitleBar';
import { db } from './server';
import { EffectInfoProvider } from './context/EffectInfoContext';
import { themeMap, type ThemeName } from './theme';

/**
 * Main Application
 */
function App() {

  const [itemName, setItemName] = useState('Glamdring');
  const [effects, setEffects] = useState([
    defaultEffectState
  ]);
  const [shards, setShards] = useState(initialShardState);
  const [themeName, setThemeName] = useState<ThemeName>('mixology');

  const theme = useMemo(() => themeMap[themeName], [themeName]);

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
      if (response.status !== 200 || !response.item) {
        throw new Error('Failed to load item');
      }
      const loadedItem = response.item;
      setEffects(loadedItem.effectsArray);
      setItemName(loadedItem.name);
    } catch {
      // Failed loads leave the existing item untouched.
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <EffectInfoProvider>
        <TitleBar
          finalDC={finalDC}
          handleSave={handleSave}
          handleItemLoad={handleItemLoad}
          itemName={itemName}
          setItemName={setItemName}
          onThemeChange={setThemeName}
          themeName={themeName}
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
    </ThemeProvider>
  );
}

export default App;
