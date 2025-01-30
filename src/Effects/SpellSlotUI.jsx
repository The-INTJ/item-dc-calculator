// /Effects/SpellSlotUI.js

import React from 'react';
import {
  PowerLevelPicker,
  FrequencyPicker,
  ComplexityPicker,
  Checkbox
} from './Common';

/**
 * Spell Slot effect requires:
 * - Power Level
 * - Frequency
 * - Complexity
 */
function SpellSlotUI({ effect, onEffectFieldChange }) {
  const isCantrip = effect.effectType === 'Cantrip';
  return (
    <div className="spell-slot-ui">
      <PowerLevelPicker
        value={effect.powerLevel}
        onChange={(val) => onEffectFieldChange('powerLevel', val)}
      />
      <FrequencyPicker
        value={effect.frequency}
        onChange={(val) => onEffectFieldChange('frequency', val)}
        optionalTitle={isCantrip && 'Change Cantrip:'}
      />
      <ComplexityPicker
        value={effect.complexity}
        onChange={(val) => onEffectFieldChange('complexity', val)}
      />
      <Checkbox
        value={effect.scalesWithLevel}
        onChange={(val) => onEffectFieldChange('scalesWithLevel', val)}
        title="Scales with Level"
      />
    </div>
  );
}

export default SpellSlotUI;
