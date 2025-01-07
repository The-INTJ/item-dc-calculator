// EffectSection.js

import React from 'react';
import EffectRow from './EffectRow';
import values from './values';

/**
 * Container for an array of effects.
 * 
 * Props:
 *   effects: Array of effect objects
 *   setEffects: function(newEffectsArray) => void
 */
function EffectSection({ effects, setEffects }) {

  // Default shape for a new Effect
  const defaultEffect = {
    effectType: 'attackBonus',
    baseValue: values.effectBaseValues['attackBonus'],
    dieValue: values.dieBonusValues[0],
    dieAmount: 0,
    powerLevel: 0,      // index in powerLevelModifiers
    frequency: 'always-on',
    complexity: 'always-on',
  };

  function handleEffectChange(effectIndex, fieldName, newValue) {
    const clonedEffects = [...effects];
    const effectToUpdate = { ...clonedEffects[effectIndex] };

    if (fieldName === 'effectType') {
      effectToUpdate.effectType = newValue;
      effectToUpdate.baseValue = values.effectBaseValues[newValue];
    } else {
      // For numeric fields, we might already have done Number() in EffectRow
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
      {effects.map((currentEffect, index) => {
        return (
          <EffectRow
            key={index}
            index={index}
            effect={currentEffect}
            onEffectChange={handleEffectChange}
          />
        );
      })}
      <button className="add-effect-btn" onClick={addNewEffect}>
        + Add Another Effect
      </button>
    </div>
  );
}

export default EffectSection;