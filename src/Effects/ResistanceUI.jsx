// /Effects/ResistanceUI.js

import React from 'react';
import { ComplexityPicker, DurationPicker, FrequencyPicker, ResistancePicker } from './Common';

/**
 * Resistance effect requires:
 * - value
 * - frequency
 */
function ResistanceUI({ effect, onEffectFieldChange }) {
  return (
    <div className="resistance-ui">
      <ResistancePicker
        value={effect.resistanceType}
        onChange={(val) => onEffectFieldChange('value', val)}
      />
      <FrequencyPicker
        value={effect.frequency}
        onChange={(val) => onEffectFieldChange('frequency', val)}
      />
      <DurationPicker
        value={effect.duration}
        onChange={(val) => onEffectFieldChange('duration', val)}
      />
      <ComplexityPicker
        value={effect.complexity}
        onChange={(val) => onEffectFieldChange('complexity', val)}
      />
    </div>
  );
}

export default ResistanceUI;
