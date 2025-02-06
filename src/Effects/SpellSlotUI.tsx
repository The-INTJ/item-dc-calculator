import {
  PowerLevelPicker,
  FrequencyPicker,
  ComplexityPicker,
  Checkbox
} from './Common';
import { GeneralEffectUIProps } from './Common';

function SpellSlotUI({ effect, onEffectFieldChange }: GeneralEffectUIProps) {
  const isCantrip = effect.effectType === 'Cantrip';
  return (
    <div className="spell-slot-ui spacing">
      {!isCantrip &&
      <PowerLevelPicker
        value={effect.powerLevel}
        onChange={(val) => onEffectFieldChange('powerLevel', val)}
      />
      }
      <FrequencyPicker
        value={effect.frequency}
        onChange={(val) => onEffectFieldChange('frequency', val)}
        optionalTitle={isCantrip && 'Change Cantrip:'}
      />
      <ComplexityPicker
        value={effect.complexity}
        onChange={(val) => onEffectFieldChange('complexity', val)}
      />
      {isCantrip && 
      <Checkbox
        value={effect.scalesWithLevel}
        onChange={(val) => onEffectFieldChange('scalesWithLevel', val)}
        label="Scales with Level"
      />}
      <Checkbox
        value={effect.caster}
        onChange={(val) => onEffectFieldChange('caster', val)}
        label="Casting class?"
      />
    </div>
  );
}

export default SpellSlotUI;
