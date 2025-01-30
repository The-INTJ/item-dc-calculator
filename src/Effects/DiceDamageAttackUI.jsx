// /Effects/DiceDamageAttackUI.js

import React from 'react';
import { DieValuePicker, DieAmountPicker, FrequencyPicker, Checkbox } from './Common';

/**
 * Dice Damage Attack effect requires:
 * - Die Value
 * - Die Amount
 * - Frequency
 */
function DiceDamageAttackUI({ effect, onEffectFieldChange }) {
  return (
    <div className="dice-damage-attack-ui">
      <DieValuePicker
        value={effect.dieValue}
        onChange={(val) => onEffectFieldChange('dieValue', val)}
      />
      <DieAmountPicker
        value={effect.dieAmount}
        onChange={(val) => onEffectFieldChange('dieAmount', val)}
      />
      <FrequencyPicker
        value={effect.frequency}
        onChange={(val) => onEffectFieldChange('frequency', val)}
      />
      <Checkbox
        label="Unarmed?"
        value={effect.unarmed}
        onChange={(val) => onEffectFieldChange('unarmed', val)}
      />
    </div>
  );
}

export default DiceDamageAttackUI;
