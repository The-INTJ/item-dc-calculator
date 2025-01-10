// /Effects/MoveSpeedUI.js

import React from 'react';
import { ValueInput, FrequencyPicker } from './Common';

/**
 * Move Speed effect requires:
 * - value (numeric input)
 * - frequency
 */
function MoveSpeedUI({ effect, onEffectFieldChange }) {
  return (
    <div className="move-speed-ui">
      <ValueInput
        label="Move Speed (units)"
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

export default MoveSpeedUI;
