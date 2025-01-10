// EffectSection.js

import React from 'react';
import EffectItem from './EffectItem';
import values, { defaultEffectState } from './values';

/**
 * Container for an array of effects.
 *
 * Props:
 *   effects: Array of effect objects
 *   setEffects: function(newEffectsArray) => void
 */
function EffectSection({ effects, setEffects }) {
  // Default shape for a new Effect
  const defaultEffect = defaultEffectState;

  function handleEffectChange(effectIndex, fieldName, newValue) {
    const clonedEffects = [...effects];
    const effectToUpdate = { ...clonedEffects[effectIndex] };

    if (fieldName === 'effectType') {
      // Update effectType and baseValue at the same time
      effectToUpdate.effectType = newValue;
      effectToUpdate.baseValue = values.effectBaseValues[newValue];
    } else {
      effectToUpdate[fieldName] = newValue;
    }

    clonedEffects[effectIndex] = effectToUpdate;
    setEffects(clonedEffects);
  }

  function addNewEffect() {
    setEffects([...effects, defaultEffect]);
  }

  return (
    <div className="effects-container">
      {effects.map((currentEffect, index) => (
        <EffectItem
          key={index}
          index={index}
          effect={currentEffect}
          onEffectChange={handleEffectChange}
        />
      ))}
      <button className="add-effect-btn" onClick={addNewEffect}>
        + Add Another Effect
      </button>
    </div>
  );
}

export default EffectSection;
