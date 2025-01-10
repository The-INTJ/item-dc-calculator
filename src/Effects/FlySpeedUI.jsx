// /Effects/FlySpeedUI.js

import React from 'react';
import { ValueInput, FrequencyPicker } from './Common';

/**
 * Fly Speed effect requires:
 * - value
 * - frequency
 */
function FlySpeedUI({ effect, onEffectFieldChange }) {
  return (
    <div className="fly-speed-ui">
      <ValueInput
        label="Fly Speed (units)"
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

export default FlySpeedUI;
