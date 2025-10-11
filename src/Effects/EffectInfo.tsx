import { Button, Tooltip } from '@mui/material';
import type { EffectType } from '../values';
import type { ActiveEffect } from '../context/EffectInfoContext';

// Descriptions for each effect type. These provide quick guidance on how
// to use the calculators fields for the selected ability.
const effectDescriptions: Record<EffectType, string> = {
  'delete': 'Remove this effect from the list.',
  'Sword +1': '+1 weapons alter bounded accuracy. These are expected for levels 1-7.',
  'Armor +1': '+1 armor alters bounded accuracy. These items suit levels 1-7.',
  'Sword +2': '+2 weapons are typical for levels 8-14 and have a high DC.',
  'Armor +2': '+2 armor is typical for levels 8-14 and significantly raises AC.',
  'Sword +3': '+3 weapons are reserved for tier 3 play (level 14+) and carry a massive DC.',
  'Armor +3': '+3 armor is reserved for tier 3 play (level 14+) and carries a massive DC.',
  'Dice attack damage': 'Add damage dice to attacks or spells. Choose die type and amount. Adding to unarmed strikes increases the DC.\nFor attack roll dice: add +2 AC for a d4 or +3 AC for larger dice. Each extra die consumes an attunement slot (maximum two).',
  'Move speed': 'Grants additional movement speed. Movement dramatically shifts combat and cannot be handled through Utility effects.',
  'Fly speed': 'Grants flying speed. Even more impactful than movement; follows the same restrictions and cannot be a utility effect.',
  'Resistance': 'Grant resistance to a damage type. These effects cannot be added as Utility and are often class restricted.',
  'Immunity': 'Grant immunity to a damage type. Typically a tier 3 benefit and not available through Utility.',
  'Cantrip': 'Allows casting a cantrip. Consider if non-casters can use it, whether it scales with level, and if it lies outside the normal class list.',
  'Spell slot': 'Provides use of a spell via slots. Spells using slots do not need the "Always" frequency modifier.',
  'Learn spell': 'Teaches a spell permanently. Outside-class spells or level-scaling increase the DC.',
  'Slight utility': 'Utility scoring: rate When, Where, and What from 0-8 and subtract Cost (0-6). Totals: 0-4 Slight, 5-9 Low, 10-13 Medium, 14-24 High.\nWhen: Always 8, Short rest 6, Long rest 4, Once daily 2, Single use 0-1.\nWhere: Combat 5, Social 2, Explore 1.\nWhat: Save bonus 6, Flat ability mods 6.',
  'Low utility': 'Utility scoring: rate When, Where, and What from 0-8 and subtract Cost (0-6). Totals: 0-4 Slight, 5-9 Low, 10-13 Medium, 14-24 High.\nWhen: Always 8, Short rest 6, Long rest 4, Once daily 2, Single use 0-1.\nWhere: Combat 5, Social 2, Explore 1.\nWhat: Save bonus 6, Flat ability mods 6.',
  'Medium utility': 'Utility scoring: rate When, Where, and What from 0-8 and subtract Cost (0-6). Totals: 0-4 Slight, 5-9 Low, 10-13 Medium, 14-24 High.\nWhen: Always 8, Short rest 6, Long rest 4, Once daily 2, Single use 0-1.\nWhere: Combat 5, Social 2, Explore 1.\nWhat: Save bonus 6, Flat ability mods 6.',
  'High utility': 'Utility scoring: rate When, Where, and What from 0-8 and subtract Cost (0-6). Totals: 0-4 Slight, 5-9 Low, 10-13 Medium, 14-24 High.\nWhen: Always 8, Short rest 6, Long rest 4, Once daily 2, Single use 0-1.\nWhere: Combat 5, Social 2, Explore 1.\nWhat: Save bonus 6, Flat ability mods 6.',
};

type EffectInfoProps = {
  effectType: ActiveEffect['effectType'] | null;
};

export default function EffectInfo({ effectType }: EffectInfoProps) {
  const info = effectType
    ? effectDescriptions[effectType] ?? 'No description available.'
    : 'Select an effect to view setup guidance.';

  return (
    <Tooltip
      title={<div style={{ maxWidth: 300, whiteSpace: 'normal' }}>{info}</div>}
      arrow
    >
      <span>
        <Button
          size="small"
          variant="outlined"
          disabled={!effectType}
          aria-label="Show guidance for the selected effect"
        >
          ?
        </Button>
      </span>
    </Tooltip>
  );
}

