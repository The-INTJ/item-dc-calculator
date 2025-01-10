// /Effects/UtilityUI.js

import React from 'react';
import {
  DieValuePicker,
  DieAmountPicker,
  FrequencyPicker,
  ComplexityPicker,
  PowerLevelPicker
} from './Common';

/**
 * LowUtility, MediumUtility, HighUtility share the same UI:
 * - Die Value
 * - Die Amount
 * - Frequency
 * - Complexity
 * - Power Level
 */
function UtilityUI({ effect, onEffectFieldChange }) {
  return (
    <div className="utility-ui">
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
      <ComplexityPicker
        value={effect.complexity}
        onChange={(val) => onEffectFieldChange('complexity', val)}
      />
      <PowerLevelPicker
        value={effect.powerLevel}
        onChange={(val) => onEffectFieldChange('powerLevel', val)}
      />
    </div>
  );
}

export default UtilityUI;
