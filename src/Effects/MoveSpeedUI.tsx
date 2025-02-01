import { ValueInput, FrequencyPicker } from './Common';
import { Effect } from '../values';

type MoveSpeedUIProps = {
  effect: Effect;
  onEffectFieldChange: (field: string, value: any) => void;
};

function MoveSpeedUI({ effect, onEffectFieldChange }: MoveSpeedUIProps) {
  return (
    <div className="move-speed-ui">
      <ValueInput
        label="Move Speed (units)"
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

export default MoveSpeedUI;
