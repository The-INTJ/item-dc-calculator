const values = {
  effectBaseValues: {
    'Dice attack damage': 5,
    'Save bonus': 6,
    'Move speed': 10,
    'Fly speed': 20,
    'Resistance': 15,
    'Immunity': 20,
    'Spell slot': 20,
    'Low utility': 10,
    'Medium utility': 15,
    'High utility': 20,
    '+1 Sword': 5,
    '+1 Armor': 10,
    '+2 Sword': 100,
    '+2 Armor': 120,
    '+3 Sword': 200,
    '+3 Armor': 240,
  },
  powerLevelModifiers: [0.5, 1.0, 1.5, 2.0, 3.0, 5.0],
  frequencyModifiers: {
    'always-on': 2.0,
    'short-rest': 1.5,
    'long-rest': 1.0,
    'once-daily': 0.75,
    'single-use': 0.5,
  },
  complexityModifiers: {
    'Always': 2.0,
    wearable: 1.5,
    usable: 1.25,
    situational: 1.0,
  },
  dieBonusValues: [16, 18, 20, 22, 30],
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
  };