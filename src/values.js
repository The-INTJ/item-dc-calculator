const values = {
  effectBaseValues: {
    attackBonus: 5,
    damageBonus: 5,
    acBonus: 8,
    skillSaveBonus: 6,
    movementSpeed: 10,
    resistances: 15,
    immunities: 20,
    extraDamage: 5,
    spellSlot: 10,
    LowUtilityEffect: 10,
    highUtilityEffect: 20
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
    'always-on': 2.0,
    wearable: 1.5,
    usable: 1.25,
    situational: 1.0,
  },
  dieBonusValues: [6, 8, 10, 12, 20],
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
