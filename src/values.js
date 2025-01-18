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
    'Save bonus': 6,
    'Move speed': 10,
    'Fly speed': 20,
    'Resistance': 15,
    'Immunity': 20,
    'Spell slot': 20,
    'Low utility': 10,
    'Medium utility': 15,
    'High utility': 20,
  },
  powerLevelModifiers: [0.5, 1.0, 2, 3, 4, 5, 6, 7, 8, 9],
  frequencyModifiers: {
    'always-on': 2.0,
    'short-rest': 1.5,
    'long-rest': 1.0,
    'once-daily': 0.75,
    'single-use': 0.125,
  },
  complexityModifiers: {
    'Always': 2.0,
    wearable: 1.5,
    usable: 1.25,
    situational: 1.0,
  },
  dieBonusValues: [6, 8, 10, 12, 20],
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
  },
  durationValues: {
    'NA': 0,
    '1 minute': 1,
    '10 minutes': 10,
    '1 hour': 60,
  },
  shardValues: [
    { shardColor: 'Blue',   shardValue:  1 },
    { shardColor: 'Red',  shardValue: 2 },
    { shardColor: 'Green',    shardValue: 3 },
    { shardColor: 'Purple', shardValue: 4 },
    { shardColor: 'Teal',   shardValue: 5 },
    { shardColor: 'Yellow', shardValue: 6 },
    { shardColor: 'Orange', shardValue: 7 },
    { shardColor: 'Silver', shardValue: 8 },
    { shardColor: 'Gold',   shardValue: 9 },
    { shardColor: 'White',  shardValue: 10 },
    { shardColor: 'Black',  shardValue: 12 },
  ],
};

export default values;

export const defaultEffectState = {
    effectType: 'Dice attack damage',
    baseValue: values.effectBaseValues['Dice attack damage'],
    dieValue: values.dieBonusValues[0],
    dieAmount: 0,
    powerLevel: 0,      // index in powerLevelModifiers
    frequency: 'always-on',
    complexity: 'Always',
    universal: false,
    duration: 'NA',
    resistanceType: 'Acid',
    cursed: false,
    isNew: true
  };

export const initialShardState = values.shardValues.map((shardObject) => {
    return {
      shardColor: shardObject.shardColor,
      shardValue: shardObject.shardValue,
      count: 0,
    };
  });