// /Effects/SpellSlotUI.js

import React from 'react';
import {
  PowerLevelPicker,
  FrequencyPicker,
  ComplexityPicker
} from './Common';

/**
 * Spell Slot effect requires:
 * - Power Level
 * - Frequency
 * - Complexity
 */
function SpellSlotUI({ effect, onEffectFieldChange }) {
  return (
    <div className="spell-slot-ui">
      <PowerLevelPicker
        value={effect.powerLevel}
        onChange={(val) => onEffectFieldChange('powerLevel', val)}
      />
      <FrequencyPicker
        value={effect.frequency}
        onChange={(val) => onEffectFieldChange('frequency', val)}
      />
      <ComplexityPicker
        value={effect.complexity}
        onChange={(val) => onEffectFieldChange('complexity', val)}
      />
    </div>
  );
}

export default SpellSlotUI;
