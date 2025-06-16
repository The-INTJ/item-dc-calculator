// /Effects/ResistanceUI.js

import React from 'react';
import { ComplexityPicker, DurationPicker, FrequencyPicker, ResistancePicker } from './Common';
import { GeneralEffectUIProps } from './Common';

function ResistanceUI({ effect, onEffectFieldChange }: GeneralEffectUIProps) {
  return (
    <div className="resistance-ui spacing">
      <ResistancePicker
        value={effect.resistanceType}
        onChange={(val) => onEffectFieldChange('resistanceType', val)}
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
