import { DieValuePicker, DieAmountPicker, FrequencyPicker, Checkbox } from './Common';
import { GeneralEffectUIProps } from './Common';

function DiceDamageAttackUI({ effect, onEffectFieldChange }: GeneralEffectUIProps) {
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
