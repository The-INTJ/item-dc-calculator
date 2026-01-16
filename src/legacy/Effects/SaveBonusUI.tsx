import { DieValuePicker, DieAmountPicker, FrequencyPicker } from './Common';
import { Effect } from '../values';

type SaveBonusUIProps = {
  effect: Effect;
  onEffectFieldChange: <K extends keyof Effect>(field: K, value: Effect[K]) => void;
};

function SaveBonusUI({ effect, onEffectFieldChange }: SaveBonusUIProps) {
  return (
    <div className="save-bonus-ui spacing">
      <DieValuePicker
        value={effect.dieValue}
        onChange={(val) => onEffectFieldChange('dieValue', val)}
      />
      <DieAmountPicker
        value={effect.dieAmount}
        onChange={(val) => onEffectFieldChange('dieAmount', val)}
      />
      <FrequencyPicker
        value={effect.frequency}
        onChange={(val) => onEffectFieldChange('frequency', val)}
      />
    </div>
  );
}

export default SaveBonusUI;
