import {
  DieValuePicker,
  DieAmountPicker,
  FrequencyPicker,
  ComplexityPicker,
  PowerLevelPicker
} from './Common';

import { Effect } from '../values';

type UtilityUIProps = {
  effect: Effect;
  onEffectFieldChange: (field: string, value: any) => void;
};

function UtilityUI({ effect, onEffectFieldChange }: UtilityUIProps) {
  return (
    <div className="utility-ui">
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
      <ComplexityPicker
        value={effect.complexity}
        onChange={(val) => onEffectFieldChange('complexity', val)}
      />
      <PowerLevelPicker
        value={effect.powerLevel}
        onChange={(val) => onEffectFieldChange('powerLevel', val)}
      />
    </div>
  );
}

export default UtilityUI;
