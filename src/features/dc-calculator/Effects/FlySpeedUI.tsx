import { ValueInput, FrequencyPicker, ComplexityPicker } from './Common';
import { GeneralEffectUIProps } from './Common';

function FlySpeedUI({ effect, onEffectFieldChange }: GeneralEffectUIProps) {
  return (
    <div className="fly-speed-ui spacing">
      <ValueInput
        label="Fly Speed (units)"
        value={effect.amountValue || 0}
        onChange={(val) => onEffectFieldChange('amountValue', val)}
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

export default FlySpeedUI;
