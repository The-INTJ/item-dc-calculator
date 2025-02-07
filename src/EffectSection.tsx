// EffectSection.js

import { useState } from 'react';
import EffectItem from './EffectItem';
import values, { defaultEffectState, Effect, EffectType } from './values';
import { Button, TextField, Typography } from '@mui/material';
import { calculateFinalDC } from './dcCalculations';

/**
 * Container for an array of effects.
 *
 * Props:
 *   effects: Array of effect objects
 *   setEffects: function(newEffectsArray) => void
 */
type EffectSectionProps = {
  effects: Effect[];
  setEffects: (effects: Effect[]) => void;
  itemName: string;
  setItemName: (name: string) => void;
}

function EffectSection({ effects, setEffects }: EffectSectionProps) {
  
  function handleEffectChange<T extends keyof Effect>(
    effectIndex: number,
    fieldName: T,
    newValue: Effect[T]
  ) {
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
      effectToUpdate.effectType = newValue as EffectType;
      effectToUpdate.baseValue = values.effectBaseValues[newValue as EffectType];
    } else {
      // Just change the single field
      (effectToUpdate[fieldName]) = newValue;
    }

    // Place the updated effect back into the array
    clonedEffects[effectIndex] = effectToUpdate;
    setEffects(clonedEffects);
  }

  function addNewEffect() {
    setEffects([...effects, defaultEffectState]);
  }

  return (
    <div className="whole-item">
      <div className="effects-container">
        {effects.map((currentEffect, index) => (
          <EffectItem
            key={index}
            index={index}
            effect={currentEffect}
            onEffectChange={handleEffectChange}
          />
        ))}
        <Button 
          className="add-effect-btn" 
          onClick={addNewEffect}
          sx={{ color: 'white'}}
        >
          + Add Another Effect
        </Button>
      </div>
    </div>
  );
}

export default EffectSection;
