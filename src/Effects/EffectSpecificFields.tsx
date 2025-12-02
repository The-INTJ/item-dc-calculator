import React from 'react';

import DiceDamageAttackUI from './DiceDamageAttackUI';
import MoveSpeedUI from './MoveSpeedUI';
import FlySpeedUI from './FlySpeedUI';
import ResistanceUI from './ResistanceUI';
import SpellSlotUI from './SpellSlotUI';
import UtilityUI from './UtilityUI';
import PlusXItemUI from './PlusXItemUI';
import { Effect } from '../values';

type EffectSpecificFieldsProps = {
  effect: Effect;
  onEffectFieldChange: <K extends keyof Effect>(fieldName: K, newValue: Effect[K]) => void;
};

function EffectSpecificFields({ effect, onEffectFieldChange }: EffectSpecificFieldsProps) {
  switch (effect.effectType) {
    case 'Dice attack damage':
      return (
        <DiceDamageAttackUI
          effect={effect}
          onEffectFieldChange={onEffectFieldChange}
        />
      );
    case 'Move speed':
      return (
        <MoveSpeedUI
          effect={effect}
          onEffectFieldChange={onEffectFieldChange}
        />
      );
    case 'Fly speed':
      return (
        <FlySpeedUI
          effect={effect}
          onEffectFieldChange={onEffectFieldChange}
        />
      );
    case 'Resistance':
    case 'Immunity':
      return (
        <ResistanceUI
          effect={effect}
          onEffectFieldChange={onEffectFieldChange}
        />
      );
    case 'Spell slot':
    case 'Cantrip':
    case 'Learn spell':
      return (
        <SpellSlotUI
          effect={effect}
          onEffectFieldChange={onEffectFieldChange}
        />
      );
    case 'Slight utility':
    case 'Low utility':
    case 'Medium utility':
    case 'High utility':
      return (
        <UtilityUI
          effect={effect}
          onEffectFieldChange={onEffectFieldChange}
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
          onEffectFieldChange={onEffectFieldChange}
        />
      );
    default:
      return <p>No specialized UI for this effect type.</p>;
  }
}

export default EffectSpecificFields;
