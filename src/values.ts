export type EffectType = keyof typeof values.effectBaseValues;
export type FrequencyType = keyof typeof values.frequencyModifiers;
export type ComplexityType = keyof typeof values.complexityModifiers;
export type DurationType = keyof typeof values.durationValues;
export type ResistanceType = keyof typeof values.resistanceRarity;
export type ShardColor = (typeof values.shardValues)[number]['shardColor'];

export interface Effect {
  effectType: EffectType;
  baseValue: number;
  dieValue: number;
  dieAmount: number;
  powerLevel: number; // index in powerLevelModifiers
  frequency: FrequencyType;
  complexity: ComplexityType;
  duration: DurationType;
  resistanceType: ResistanceType;
  cursed: boolean;
  isNew: boolean;
  scalesWithLevel: boolean;
  caster: boolean;
  unarmed: boolean;
  outsideClass: boolean;
  description: string;
}

export interface ShardState {
  shardColor: ShardColor;
  shardValue: number;
  count: number;
}

const values = {
  effectBaseValues: {
    'delete': 0,
    'Sword +1': 10,
    'Armor +1': 10,
    'Sword +2': 100,
    'Armor +2': 120,
    'Sword +3': 200,
    'Armor +3': 240,
    'Dice attack damage': 0,
    'Move speed': 10,
    'Fly speed': 20,
    'Resistance': 15,
    'Immunity': 20,
    'Cantrip': 5,
    'Spell slot': 20,
    'Slight utility': 5,
    'Low utility': 7,
    'Medium utility': 17,
    'High utility': 30,
  } as const,
  powerLevelModifiers: [0.5, 1.0, 2, 3, 4, 5, 6, 7, 8, 9] as const,
  frequencyModifiers: {
    'Always': 2.0,
    'Short-rest': 1.5,
    'Long-rest': 1.0,
    'Once-daily': 0.75,
    'Single-use': 0.125,
  } as const,
  complexityModifiers: {
    'Always': 2.0,
    'When Equipped': 1.5,
    'When equipped and activated': 1.25,
    situational: 1.0,
  } as const,
  dieBonusValues: [4, 6, 8, 10, 12, 20] as const,
  resistanceRarity: {
    'Acid': 15,
    'Cold': 15,
    'Fire': 15,
    'Lightning': 15,
    'Poison': 15,
    'Psychic': 20,
    'Thunder': 20,
    'Force': 25,
    'Necrotic': 25,
    'Radiant': 25,
    'Bludgeoning': 30,
    'Piercing': 30,
    'Slashing': 30,
    'Nonmagical': 40,
    'Magical': 50,
    'All': 100
  } as const,
  durationValues: {
    'NA': 0,
    '1 minute': 1,
    '10 minutes': 10,
    '1 hour': 60,
  } as const,
  shardValues: [
  { shardColor: 'Blue',   shardValue:  1, shardHexColor: '#3498DB' },  // A clear, magical blue
  { shardColor: 'Red',    shardValue:  2, shardHexColor: '#E74C3C' },  // A warm, vibrant scarlet
  { shardColor: 'Green',  shardValue:  3, shardHexColor: '#2ECC71' },  // A lush, enchanted green
  { shardColor: 'Purple', shardValue:  4, shardHexColor: '#9B59B6' },  // A mystical amethyst purple
  { shardColor: 'Teal',   shardValue:  5, shardHexColor: '#1ABC9C' },  // A deep, watery teal
  { shardColor: 'Yellow', shardValue:  6, shardHexColor: '#F1C40F' },  // A radiant, otherworldly yellow
  { shardColor: 'Orange', shardValue:  7, shardHexColor: '#E67E22' },  // A fiery, adventurous orange
  { shardColor: 'Silver', shardValue:  8, shardHexColor: '#BDC3C7' },  // A soft, enchanted silver
  { shardColor: 'Gold',   shardValue:  9, shardHexColor: '#D4AF37' },  // A classic, mystic gold
  { shardColor: 'White',  shardValue: 10, shardHexColor: '#ECF0F1' },  // A gentle, moonlit white
  { shardColor: 'Black',  shardValue: 12, shardHexColor: '#2C3E50' },  // A deep, shadowed black-blue
] as const,
};

export default values;

export const defaultEffectState: Effect = {
  effectType: 'Dice attack damage',
  baseValue: values.effectBaseValues['Dice attack damage'],
  dieValue: values.dieBonusValues[0],
  dieAmount: 0,
  powerLevel: 0, // index in powerLevelModifiers
  frequency: 'Always',
  complexity: 'Always',
  duration: 'NA',
  resistanceType: 'Acid',
  cursed: false,
  isNew: true,
  scalesWithLevel: false,
  caster: true,
  unarmed: false,
  outsideClass: false,
  description: 'Effect description here',
};

export const initialShardState: ShardState[] = values.shardValues.map((shardObject) => ({
  shardColor: shardObject.shardColor,
  shardValue: shardObject.shardValue,
  shardHexColor: shardObject.shardHexColor,
  count: 0,
}));
