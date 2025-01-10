// /Effects/SaveBonusUI.js

import React from 'react';
import { DieValuePicker, DieAmountPicker, FrequencyPicker } from './Common';

/**
 * Save Bonus effect requires:
 * - Die Value
 * - Die Amount
 * - Frequency
 */
function SaveBonusUI({ effect, onEffectFieldChange }) {
  return (
    <div className="save-bonus-ui">
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
    </div>
  );
}

export default SaveBonusUI;
