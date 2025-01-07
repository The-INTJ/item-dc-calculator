import React, { useState } from 'react';
import './App.css';
import values from './values';

function App() {
  // --------------------------
  //  Effects State
  // --------------------------
  const defaultEffectState = {
    effectType: 'attackBonus',
    baseValue: values.effectBaseValues['attackBonus'],
    dieValue: values.dieBonusValues[0],
    dieAmount: 0,
    powerLevel: 0, // index in powerLevelModifiers
    frequency: 'always-on',
    complexity: 'always-on',
  };
  const [effects, setEffects] = useState([
    defaultEffectState,
  ]);

  const [effectNumber, setEffectNumber] = useState(1);

  // --------------------------
  //  Shards State
  // --------------------------
  // We create a piece of state that tracks the shard counts for each shard color
  const [shardCounts, setShardCounts] = useState(
    values.shardValues.map((shardObj) => ({
      ...shardObj,
      count: 0, // start at zero
    }))
  );

  // Handler to change the count of a specific shard
  const handleShardCountChange = (index, newCount) => {
    setShardCounts((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], count: Number(newCount) };
      return updated;
    });
  };

  // Optional: show/hide Calculation Breakdown
  const [showBreakdown, setShowBreakdown] = useState(false);

  // --------------------------------------------------
  //  Calculation Logic
  // --------------------------------------------------
  function calculateBaseDC(effectsArray) {
    return effectsArray.reduce((totalDC, effect) => {
      const { baseValue, dieValue, dieAmount, powerLevel, frequency, complexity } = effect;

      const powerLevelModifier = values.powerLevelModifiers[powerLevel];
      const frequencyModifier = values.frequencyModifiers[frequency];
      const complexityModifier = values.complexityModifiers[complexity];
      const dieBonus = dieValue * dieAmount;

      const dc =
        baseValue * powerLevelModifier * frequencyModifier * complexityModifier + dieBonus;

      return totalDC + dc;
    }, 0);
  }

  // Fibonacci sum for discount, given total shard count
  // If totalShards = 3, we sum the first 3 fibonacci numbers: 1 + 1 + 2 = 4
  function shardAccumulationBonus(n) {
    if (n <= 0) return 0;
    if (n === 1) return 3;
    if (n >= 50) return n + 50; // Cap at 50 per shard

    const fibArr = [3, 5];
    // Build up to n terms
    for (let i = 2; i < n; i++) {
      fibArr.push(fibArr[i - 1] + fibArr[i - 2]);
    }
    // Sum of the first n fibonacci numbers
    return fibArr.reduce((acc, val) => acc + val, 0);
  }

  // Calculate the final DC
  const baseDC = calculateBaseDC(effects);

  // Sum of shard-based DC offsets (each shardValue * shardCount).
  // shardValue is negative or zero, so it will *reduce* the DC.
  const shardsModifier = shardCounts.reduce(
    (acc, shard) => acc + shard.shardValue * shard.count,
    0
  );

  // Decrease the DC further by the fibonacci sum of total shard count
  const totalShardCount = shardCounts.reduce((sum, s) => sum + s.count, 0);
  const shardAccumulationDiscount = shardAccumulationBonus(totalShardCount);

  // final DC = baseDC + shardsModifier - fibDiscount
  const finalDC = baseDC + shardsModifier + (effectNumber * 5) - shardAccumulationDiscount;

  // --------------------------------------------------
  //  Event Handlers for Effects
  // --------------------------------------------------
  const handleEffectChange = (index, field, value) => {
    setEffects((prevEffects) => {
      const updated = [...prevEffects];
      const effectToUpdate = { ...updated[index] };

      if (field === 'effectType') {
        effectToUpdate.effectType = value;
        effectToUpdate.baseValue = values.effectBaseValues[value];
      } else if (field === 'powerLevel') {
        effectToUpdate.powerLevel = Number(value);
      } else {
        effectToUpdate[field] = value;
      }

      updated[index] = effectToUpdate;
      return updated;
    });
  };

  const addNewEffect = () => {
    setEffects((prev) => [
      ...prev,
      defaultEffectState,
    ]);
    setEffectNumber((prev) => prev + 1);
  };

  // --------------------------------------------------
  //  Optional Calculation Breakdown
  // --------------------------------------------------
  // Breakdown for each effect
  const effectsBreakdown = effects.map((effect, idx) => {
    const { effectType, dieValue, dieAmount, baseValue, powerLevel, frequency, complexity } = effect;
    const powerLevelMod = values.powerLevelModifiers[powerLevel];
    const freqMod = values.frequencyModifiers[frequency];
    const compMod = values.complexityModifiers[complexity];
    const dieBonus = dieValue * dieAmount;
    const partialDC = baseValue * powerLevelMod * freqMod * compMod + dieBonus;

    return (
      <li key={`effect-${idx}`}>
        <strong>Effect {idx + 1}:</strong> {effectType}
        <br />
        {baseValue} (base) &times; {powerLevelMod} (power) &times; {freqMod} (freq)
        &times; {compMod} (complex) + {dieBonus} (die)
        <br />= <strong>{partialDC.toFixed(2)}</strong>
      </li>
    );
  });

  // Breakdown for shards
  const shardsBreakdown = shardCounts
    .filter((shard) => shard.count > 0)
    .map((shard, idx) => (
      <li key={`shard-${shard.shardColor}-${idx}`}>
        <strong>{shard.shardColor} x {shard.count}</strong>&nbsp;
        ({shard.shardValue} each) ={' '}
        {(shard.shardValue * shard.count).toFixed(2)}
      </li>
    ));

  return (
    <div className="App-container">
      {/* Top Section: Display Final DC */}
      <h1 className="dc-display">Final DC: {finalDC.toFixed(2)}</h1>

    <div className="effects-container">
      {/* --- Effects Section --- */}
      {effects.map((effect, index) => (
        <div className="effect-row" key={index}>
          <div className="effect-field">
            <label>Effect Type:</label>
            <select
              value={effect.effectType}
              onChange={(e) =>
                handleEffectChange(index, 'effectType', e.target.value)
              }
            >
              {Object.keys(values.effectBaseValues).map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </div>

          <div className="effect-field">
            <label>Die Value:</label>
            <select
              value={effect.dieValue}
              onChange={(e) =>
                handleEffectChange(index, 'dieValue', e.target.value)
              }
            >
              {values.dieBonusValues.map((die, i) => (
                <option key={i} value={die}>
                  {die}
                </option>
              ))}
            </select>
          </div>

          <div className="effect-field">
            <label>Die Amount:</label>
            <input
              type="number"
              min="0"
              value={effect.dieAmount}
              onChange={(e) =>
                handleEffectChange(index, 'dieAmount', e.target.value)
              }
            />
          </div>

          <div className="effect-field">
            <label>Power Level:</label>
            <select
              value={effect.powerLevel}
              onChange={(e) =>
                handleEffectChange(index, 'powerLevel', e.target.value)
              }
            >
              {values.powerLevelModifiers.map((pl, i) => (
                <option key={i} value={i}>
                  Lvl {pl} / Mult: {pl}
                </option>
              ))}
            </select>
          </div>

          <div className="effect-field">
            <label>Frequency:</label>
            <select
              value={effect.frequency}
              onChange={(e) =>
                handleEffectChange(index, 'frequency', e.target.value)
              }
            >
              {Object.keys(values.frequencyModifiers).map((freq) => (
                <option key={freq} value={freq}>
                  {freq}
                </option>
              ))}
            </select>
          </div>

          <div className="effect-field">
            <label>Complexity:</label>
            <select
              value={effect.complexity}
              onChange={(e) =>
                handleEffectChange(index, 'complexity', e.target.value)
              }
            >
              {Object.keys(values.complexityModifiers).map((comp) => (
                <option key={comp} value={comp}>
                  {comp}
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}
    </div>

      <button className="add-effect-btn" onClick={addNewEffect}>
        + Add Another Effect
      </button>

      {/* --- Shards Section --- */}
      <h2>Shards</h2>
      <p>Select how many of each shard you want to use:</p>
      <div className="shard-container">
        {shardCounts.map((shard, index) => (
          <div className="shard-row" key={shard.shardColor}>
            <label>
              {shard.shardColor} ({shard.shardValue}):{' '}
              <input
                type="number"
                min="0"
                value={shard.count}
                onChange={(e) => handleShardCountChange(index, e.target.value)}
                style={{ width: '60px', marginLeft: '5px' }}
              />
            </label>
          </div>
        ))}
      </div>

      {/* --- Toggle Breakdown --- */}
      <button
        className="toggle-breakdown-btn"
        onClick={() => setShowBreakdown((prev) => !prev)}
      >
        {showBreakdown ? 'Hide' : 'Show'} Calculation Breakdown
      </button>

      {/* --- Breakdown Display --- */}
      {showBreakdown && (
        <div className="breakdown-container">
          <h2>Calculation Breakdown</h2>
          <ul>
            {effectsBreakdown}
            {shardsBreakdown.length > 0 && (
              <>
                <li>
                  <strong>Total Shard Modifier:</strong> {shardsModifier}
                </li>
                {shardsBreakdown}
              </>
            )}
            {totalShardCount > 0 && (
              <li>
                <strong>Fibonacci Discount for {totalShardCount} shard(s):</strong>{' '}
                -{shardAccumulationDiscount}
              </li>
            )}
          </ul>
          <p>
            <strong>Base DC:</strong> {baseDC.toFixed(2)}<br />
            <strong>Number of effects ({effectNumber}): </strong> {effectNumber * 5}<br />
            <strong>Shards Modifier:</strong> {shardsModifier.toFixed(2)}<br />
            <strong>Shard Total Discount:</strong> -{shardAccumulationDiscount}<br />
            <strong>Final DC:</strong> {finalDC.toFixed(2)}
          </p>
        </div>
      )}
    </div>
  );
}

export default App;
