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

  function handleEffectChange(effectIndex, fieldName, newValue) {
    // Make a shallow copy of the effects array
    const clonedEffects = [...effects];

    // If the user wants to delete this effect, remove it and return
    if (fieldName === 'effectType' && newValue === 'delete') {
      clonedEffects.splice(effectIndex, 1);
      setEffects(clonedEffects);
      return;
    }

    // Otherwise, update the specified effect
    const effectToUpdate = { ...clonedEffects[effectIndex] };

    if (fieldName === 'effectType') {
      // Update effectType and baseValue together
      effectToUpdate.effectType = newValue;
      effectToUpdate.baseValue = values.effectBaseValues[newValue];
    } else {
      // Just change the single field
      effectToUpdate[fieldName] = newValue;
    }

    // Place the updated effect back into the array
    clonedEffects[effectIndex] = effectToUpdate;
    setEffects(clonedEffects);
  }


  function addNewEffect() {
    setEffects([...effects, defaultEffectState]);
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
