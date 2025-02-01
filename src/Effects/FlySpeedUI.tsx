import { ValueInput, FrequencyPicker } from './Common';

import { Effect } from '../values';

type FlySpeedUIProps = {
  effect: Effect;
  onEffectFieldChange: (field: string, value: any) => void;
};

function FlySpeedUI({ effect, onEffectFieldChange }: FlySpeedUIProps) {
  return (
    <div className="fly-speed-ui">
      <ValueInput
        label="Fly Speed (units)"
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

export default FlySpeedUI;
