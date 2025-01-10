// EffectItem.js

import React from 'react';
import values from './values';

/**
 * Renders a single effect row (form controls for effect properties).
 * 
 * Props:
 *   effect: the current effect object
 *   onEffectChange: function(effectField, newValue) => void
 *   index: the index of this effect in the parent array
 */
function EffectItem({ effect, onEffectChange, index }) {
  function handleSelectChange(event, fieldName) {
    onEffectChange(index, fieldName, event.target.value);
  }

  function handleNumberChange(event, fieldName) {
    onEffectChange(index, fieldName, Number(event.target.value));
  }

  return (
    <div className="effect-row">
      {/* Effect Type */}
      <div className="effect-field">
        <label>Effect Type:</label>
        <select
          value={effect.effectType}
          onChange={(event) => handleSelectChange(event, 'effectType')}
        >
          {Object.keys(values.effectBaseValues).map((effectKey) => (
            <option key={effectKey} value={effectKey}>
              {effectKey}
            </option>
          ))}
        </select>
      </div>

      {/* Die Value */}
      <div className="effect-field">
        <label>Die Value:</label>
        <select
          value={effect.dieValue}
          onChange={(event) => handleNumberChange(event, 'dieValue')}
        >
          {values.dieBonusValues.map((dieOption) => (
            <option key={dieOption} value={dieOption}>
              {dieOption}
            </option>
          ))}
        </select>
      </div>

      {/* Die Amount */}
      <div className="effect-field">
        <label>Die Amount:</label>
        <input
          type="number"
          min="0"
          value={effect.dieAmount}
          onChange={(event) => handleNumberChange(event, 'dieAmount')}
        />
      </div>

      {/* Power Level */}
      <div className="effect-field">
        <label>Power Level:</label>
        <select
          value={effect.powerLevel}
          onChange={(event) => handleNumberChange(event, 'powerLevel')}
        >
          {values.powerLevelModifiers.map((powerModifier, powerIndex) => (
            <option key={powerIndex} value={powerIndex}>
              {`Index ${powerIndex} => x${powerModifier}`}
            </option>
          ))}
        </select>
      </div>

      {/* Frequency */}
      <div className="effect-field">
        <label>Frequency:</label>
        <select
          value={effect.frequency}
          onChange={(event) => handleSelectChange(event, 'frequency')}
        >
          {Object.keys(values.frequencyModifiers).map((freqKey) => (
            <option key={freqKey} value={freqKey}>
              {freqKey}
            </option>
          ))}
        </select>
      </div>

      {/* Complexity */}
      <div className="effect-field">
        <label>Complexity:</label>
        <select
          value={effect.complexity}
          onChange={(event) => handleSelectChange(event, 'complexity')}
        >
          {Object.keys(values.complexityModifiers).map((compKey) => (
            <option key={compKey} value={compKey}>
              {compKey}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default EffectItem;
