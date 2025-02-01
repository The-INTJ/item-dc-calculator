import { DieValuePicker, DieAmountPicker, FrequencyPicker, Checkbox } from './Common';
import { Effect } from '../values';

type DiceDamageAttackUIProps = {
  effect: Effect;
  onEffectFieldChange: (field: string, value: any) => void;
};

function DiceDamageAttackUI({ effect, onEffectFieldChange }: DiceDamageAttackUIProps) {
  return (
    <div className="dice-damage-attack-ui">
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
      <Checkbox
        label="Unarmed?"
        value={effect.unarmed}
        onChange={(val) => onEffectFieldChange('unarmed', val)}
      />
    </div>
  );
}

export default DiceDamageAttackUI;
