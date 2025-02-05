// EffectSection.js

import { useState } from 'react';
import EffectItem from './EffectItem';
import values, { defaultEffectState, Effect, EffectType } from './values';
import { Button, TextField, Typography } from '@mui/material';

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

function EffectSection({ effects, setEffects, itemName, setItemName }: EffectSectionProps) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);

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

  function EditableTitle () {
    return isEditingTitle ? (
      <TextField
        className="editable-title-input"
        value={itemName}
        onChange={(e) => setItemName(e.target.value)}
        onBlur={() => setIsEditingTitle(false)}
        autoFocus
      />
    ) : (
      <Typography 
        className="editable-title" 
        onClick={() => setIsEditingTitle(true)}
        component={'h2'}
        fontSize={'2rem'}
        sx={{ marginBottom: '0.5rem' }}
      >
        {itemName}
      </Typography>
    )
  }


  function addNewEffect() {
    setEffects([...effects, defaultEffectState]);
  }

  return (
    <div className="whole-item">
      <EditableTitle />
      <div className="effects-container">
        {effects.map((currentEffect, index) => (
          <EffectItem
            key={index}
            index={index}
            effect={currentEffect}
            onEffectChange={handleEffectChange}
          />
        ))}
        <Button className="add-effect-btn" onClick={addNewEffect}>
          + Add Another Effect
        </Button>
      </div>
    </div>
  );
}

export default EffectSection;
