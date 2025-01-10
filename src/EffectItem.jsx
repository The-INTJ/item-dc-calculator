// EffectItem.js
import './EffectItem.scss';

// Import each sub-component
import DiceDamageAttackUI from './Effects/DiceDamageAttackUI';
import SaveBonusUI from './Effects/SaveBonusUI';
import MoveSpeedUI from './Effects/MoveSpeedUI';
import FlySpeedUI from './Effects/FlySpeedUI';
import ResistanceUI from './Effects/ResistanceUI';
import ImmunityUI from './Effects/ImmunityUI';
import SpellSlotUI from './Effects/SpellSlotUI';
import UtilityUI from './Effects/UtilityUI';
import PlusXItemUI from './Effects/PlusXItemUI';

import values from './values';

/**
 * Renders the correct UI for the chosen effectType.
 * 
 * Props:
 *   effect: the current effect object
 *   onEffectChange: function(index, fieldName, newValue)
 *   index: the index of this effect
 */
function EffectItem({ effect, onEffectChange, index }) {
  // When user changes effectType in the dropdown
  function handleEffectTypeChange(e) {
    onEffectChange(index, 'effectType', e.target.value);
  }

  // Helper to pass changes to the parent
  function handleFieldChange(fieldName, newValue) {
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
      case 'Save bonus':
        return (
          <SaveBonusUI
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
        return (
          <ResistanceUI
            effect={effect}
            onEffectFieldChange={handleFieldChange}
          />
        );
      case 'Immunity':
        return (
          <ImmunityUI
            effect={effect}
            onEffectFieldChange={handleFieldChange}
          />
        );
      case 'Spell slot':
        return (
          <SpellSlotUI
            effect={effect}
            onEffectFieldChange={handleFieldChange}
          />
        );
      case 'Low utility':
      case 'Medium utility':
      case 'High utility':
        return (
          <UtilityUI
            effect={effect}
            onEffectFieldChange={handleFieldChange}
          />
        );
      case '+1 Sword':
      case '+1 Armor':
      case '+2 Sword':
      case '+2 Armor':
      case '+3 Sword':
      case '+3 Armor':
        return (
          <PlusXItemUI
        effect={effect}
        onEffectFieldChange={handleFieldChange}
          />
        );
      default:
        // If not recognized, just show nothing or a note
        return <p>No specialized UI for this effect type.</p>;
    }
  }

  return (
    <div className="effect-item">
      <div className="effect-field">
        <label>Effect Type:</label>
        <label>Effect Type:</label>
        <select
          value={effect.effectType}
          onChange={(event) => handleEffectTypeChange(event, 'effectType')}
        >
          {Object.keys(values.effectBaseValues).map((effectKey) => (
            <option key={effectKey} value={effectKey}>
              {effectKey}
            </option>
          ))}
        </select>
      </div>

      {/* Render sub-UI */}
      {renderEffectSpecificUI()}
    </div>
  );
}

export default EffectItem;
