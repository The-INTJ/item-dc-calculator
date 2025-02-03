// EffectItem.tsx
import './EffectItem.scss';
import './Effects/Effects.scss';

// Import each sub-component
import DiceDamageAttackUI from './Effects/DiceDamageAttackUI';
import SaveBonusUI from './Effects/SaveBonusUI';
import MoveSpeedUI from './Effects/MoveSpeedUI';
import FlySpeedUI from './Effects/FlySpeedUI';
import ResistanceUI from './Effects/ResistanceUI';
import SpellSlotUI from './Effects/SpellSlotUI';
import UtilityUI from './Effects/UtilityUI';
import PlusXItemUI from './Effects/PlusXItemUI';
import { Checkbox } from './Effects/Common';
import Select, { SelectChangeEvent } from '@mui/material/Select';
import values, { Effect, EffectType } from './values';
import Description from './Effects/Description';

/**
 * Renders the correct UI for the chosen effectType.
 * 
 * Props:
 *   effect: the current effect object
 *   onEffectChange: function(index, fieldName, newValue)
 *   index: the index of this effect
 */
type EffectItemProps = {
  effect: Effect;
  onEffectChange: (index: number, fieldName: keyof Effect, newValue: any) => void;
  index: number;
};

function EffectItem({ effect, onEffectChange, index }: EffectItemProps) {
  // When user changes effectType in the dropdown
  function handleEffectTypeChange(e: React.ChangeEvent<HTMLSelectElement>) {
    onEffectChange(index, 'effectType', e.target.value as EffectType);
  }

  // Helper to pass changes to the parent
  function handleFieldChange(fieldName: keyof Effect, newValue: any) {
    onEffectChange(index, fieldName, newValue);
  }

  // Renders the sub-UI based on effectType
  function renderEffectSpecificUI() {
    switch (effect.effectType) {
      case 'Dice attack damage':
        return (
          <DiceDamageAttackUI
            effect={effect}
            onEffectFieldChange={handleFieldChange}
          />
        );
      case 'Move speed':
        return (
          <MoveSpeedUI
            effect={effect}
            onEffectFieldChange={handleFieldChange}
          />
        );
      case 'Fly speed':
        return (
          <FlySpeedUI
            effect={effect}
            onEffectFieldChange={handleFieldChange}
          />
        );
      case 'Resistance':
      case 'Immunity':
        return (
          <ResistanceUI
            effect={effect}
            onEffectFieldChange={handleFieldChange}
          />
        );
      case 'Spell slot':
      case 'Cantrip':
        return (
          <SpellSlotUI
            effect={effect}
            onEffectFieldChange={handleFieldChange}
          />
        );
      case 'Slight utility':
      case 'Low utility':
      case 'Medium utility':
      case 'High utility':
        return (
          <UtilityUI
            effect={effect}
            onEffectFieldChange={handleFieldChange}
          />
        );
      case 'Sword +1':
      case 'Armor +1':
      case 'Sword +2':
      case 'Armor +2':
      case 'Sword +3':
      case 'Armor +3':
        return (
          <PlusXItemUI
            effect={effect}
            onEffectFieldChange={handleFieldChange}
          />
        );
      default:
        // If not recognized, just show nothing or a note
        // This catches naming errors pretty well too
        return <p>No specialized UI for this effect type.</p>;
    }
  }

  return (
    <div
      className={`effect-item ${effect.effectType.replace(/\s+/g, '-').replace(/\+/g, '').toLowerCase()}`}
    >
      <div className="effect-field">
        <label>Effect Type:</label>
        <select
          value={effect.effectType}
          onChange={handleEffectTypeChange}
        >
          {Object.keys(values.effectBaseValues).map((effectKey) => (
            <option key={effectKey} value={effectKey}>
              {effectKey}
            </option>
          ))}
        </select>
        <Checkbox
          label="Cursed?"
          value={effect.cursed}
          onChange={(val: boolean) => handleFieldChange('cursed', val)}
        />
        <Checkbox
          label="New Effect?"
          value={effect.isNew}
          onChange={(val: boolean) => handleFieldChange('isNew', val)}
        />
        <Checkbox
          label="Non-class ability?"
          value={effect.outsideClass}
          onChange={(val: boolean) => handleFieldChange('outsideClass', val)}
        />
      </div>

      {/* Render sub-UI */}
      {renderEffectSpecificUI()}

      <Description
        effect={effect}
        onEffectFieldChange={handleFieldChange}
      />
    </div>
  );
}

export default EffectItem;
