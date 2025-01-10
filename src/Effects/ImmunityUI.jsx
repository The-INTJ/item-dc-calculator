// /Effects/ResistanceUI.js

import React from 'react';
import { ValueInput, FrequencyPicker } from './Common';

/**
 * Resistance effect requires:
 * - value
 * - frequency
 */
function ResistanceUI({ effect, onEffectFieldChange }) {
  return (
    <div className="resistance-ui">
      <ValueInput
        label="Resistance Value"
        value={effect.value || 0}
        onChange={(val) => onEffectFieldChange('value', val)}
      />
      <FrequencyPicker
        value={effect.frequency}
        onChange={(val) => onEffectFieldChange('frequency', val)}
      />
    </div>
  );
}

export default ResistanceUI;
