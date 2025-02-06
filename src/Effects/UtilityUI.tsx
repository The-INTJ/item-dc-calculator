import {
  DieValuePicker,
  DieAmountPicker,
  FrequencyPicker,
  ComplexityPicker,
  PowerLevelPicker,
  GeneralEffectUIProps
} from './Common';
function UtilityUI({ effect, onEffectFieldChange }: GeneralEffectUIProps) {
  return (
    <div className="utility-ui spacing">
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
