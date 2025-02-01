import { ValueInput, FrequencyPicker } from './Common';
import { GeneralEffectUIProps } from './Common';

function ResistanceUI({ effect, onEffectFieldChange }: GeneralEffectUIProps) {
  return (
    <div className="resistance-ui">
      <ValueInput
        label="Resistance Value"
        value={effect.amountValue || 0}
        onChange={(val) => onEffectFieldChange('amountValue', val)}
      />
      <FrequencyPicker
        value={effect.frequency}
        onChange={(val) => onEffectFieldChange('frequency', val)}
      />
    </div>
  );
}

export default ResistanceUI;
