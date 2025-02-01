import { ValueInput, FrequencyPicker } from './Common';

import { Effect } from '../values';

type ResistanceUIProps = {
  effect: Effect;
  onEffectFieldChange: (field: string, value: any) => void;
};

function ResistanceUI({ effect, onEffectFieldChange }: ResistanceUIProps) {
  return (
    <div className="resistance-ui">
      <ValueInput
        label="Resistance Value"
        value={effect.amountValue || 0}
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
