// dcCalculations.js

import values from './values';

/**
 * Calculates sum of all effects' partial DCs
 * Calculate global effect changes here
 */
export function calculateEffectSum(effectsArray) {
let accumulatedDC = 0;

  for (let i = 0; i < effectsArray.length; i++) {
    let effectDC = calculateEffectDC(effectsArray[i]);
    if (effectsArray[i].cursed) {
      effectDC = -Math.abs(effectDC); // Make the effect negative if cursed
    }
    if (effectsArray[i].outsideClass) {
      effectDC += 20; // Effectively requires an additional shard investment from another class
    }
    accumulatedDC += effectDC;
  }
  return Math.ceil(accumulatedDC);
}

/**
 * Calculate additional DC from number of effects
 */
export function calculateEffectCountDC(effectsArray) {
  let accumulatedDC = 0;
  for (let i = 1; i < effectsArray.length; i++) {
    // Add +5 per effect, except the first one, and old effects
    if (effectsArray[i].isNew) {
      accumulatedDC += 5;
    }
  }
  return Math.ceil(accumulatedDC);
}
/**
 * Calculates the final DC
 */
export function calculateFinalDC(effectsArray) {
  const effectSum = calculateEffectSum(effectsArray);
  const effectCount = calculateEffectCountDC(effectsArray);
  return effectSum + effectCount;
}

/**
 * Routes to a specialized calculation based on effectType.
 * If none is matched, calls the originalEffectDCMethod as a fallback.
 */
export function calculateEffectDC(effect) {
  switch (effect.effectType) {
    case 'Dice attack damage':
      return calculateDiceDamageAttackDC(effect);
    case 'Save bonus':
      return calculateSaveBonusDC(effect);
    case 'Move speed':
      return calculateMoveSpeedDC(effect);
    case 'Fly speed':
      return calculateFlySpeedDC(effect);
    case 'Resistance':
      return calculateResistanceDC(effect);
    case 'Immunity':
      return calculateImmunityDC(effect);
    case 'Spell slot':
    case 'Cantrip':
      return calculateSpellSlotDC(effect);
    case 'Low utility':
    case 'Medium utility':
    case 'High utility':
      return calculateUtilityDC(effect);
    case 'Sword +1':
    case 'Armor +1':
    case 'Sword +2':
    case 'Armor +2':
    case 'Sword +3':
    case 'Armor +3':
      return calculatePlusXItemDC(effect);
    default:
      // By default, use your original calculation
      return originalEffectDCMethod(effect);
  }
}

// ------------------------------------------------------------------
//  Specialized calculation functions
// ------------------------------------------------------------------

function calculateDiceDamageAttackDC(effect) {
  // intended: Base + (DiceVal + 10) * numDice
  const freqMod = getFrequencyMod(effect.frequency);
  const dice = calculateDiceContribution(effect.dieValue, effect.dieAmount);

  let partialDC = dice * freqMod;
  if (partialDC > 0) {
    partialDC -= 14; // Magic amount that puts the DC for 1d6 in a good spot
  }
  if (effect.unarmed) {
    partialDC *= 1.65;
  }
  return partialDC;
}

function calculateMoveSpeedDC(effect) {
  const freqMod = getFrequencyMod(effect.frequency);
  const partialDC = effect.value * freqMod;
  return partialDC + effect.baseValue;
}

function calculateFlySpeedDC(effect) {
  // Same pattern as MoveSpeed
  const freqMod = getFrequencyMod(effect.frequency);
  const partialDC = effect.value * freqMod;
  return partialDC + effect.baseValue;
}

function calculateResistanceDC(effect) {
  // Uses effect.value & frequency
  const freqMod = getFrequencyMod(effect.frequency);
  const resistanceDC = values.resistanceRarity[effect.resistanceType];
  const durationMod = values.durationValues[effect.duration];
  const complexityMod = getComplexityMod(effect.complexity);
  const partialDC = resistanceDC * freqMod * complexityMod + durationMod;
  console.log('Resistance DC:', partialDC);
  return partialDC + effect.baseValue;
}

function calculateImmunityDC(effect) {
  return calculateResistanceDC(effect) * 2;
}

function calculateSpellSlotDC(effect) {
  // Both use powerLevel, frequency, complexity, baseValue
  const pwrMod = getPowerLevelMod(effect.powerLevel);
  const freqMod = getFrequencyMod(effect.frequency);
  const compMod = getComplexityMod(effect.complexity);

  let partialDC = 0;

  if (effect.effectType === 'Cantrip') {
    const scalesWithLevel = effect.scalesWithLevel ? 5 : 0;
    const alwaysChangeable = effect.frequency === 'Always' ? 50 : 0;
    partialDC = effect.baseValue + scalesWithLevel + alwaysChangeable;
    partialDC *= freqMod * compMod;
  } else {
    partialDC = effect.baseValue * pwrMod * freqMod * compMod;
  }

  partialDC += effect.caster ? 0 : 20; // additional shard investment from non-caster

  return partialDC;
}

function calculateUtilityDC(effect) {
  // Utilities: dieValue, dieAmount, frequency, complexity, powerLevel, baseValue
  // This is basically the "original" approach, but skipping any fields you don't track
  const dice = calculateDiceContribution(effect.dieValue, effect.dieAmount);
  const pwrMod = getPowerLevelMod(effect.powerLevel);
  const freqMod = getFrequencyMod(effect.frequency);
  const compMod = getComplexityMod(effect.complexity);

  const partialDC = (effect.baseValue * pwrMod * freqMod * compMod) + dice;
  return partialDC;
}

function calculatePlusXItemDC(effect) {
  return effect.baseValue;
}

// ------------------------------------------------------------------
//  Original fallback method (unchanged from your code).
// ------------------------------------------------------------------

/**
 * The original logic for calculating an effect's partial DC.
 * This is called if the effectType switch doesn't match.
 */
function originalEffectDCMethod(effect) {
  const baseValue = effect.baseValue;
  const dieValue = effect.dieValue;
  const dieAmount = effect.dieAmount;
  const powerLevel = effect.powerLevel;
  const frequency = effect.frequency;
  const complexity = effect.complexity;

  const powerLevelModifier = values.powerLevelModifiers[powerLevel];
  const frequencyModifier = values.frequencyModifiers[frequency];
  const complexityModifier = values.complexityModifiers[complexity];

  let diceContribution = dieValue * dieAmount;
  if (dieAmount >= 1) {
    diceContribution += 10;
  }

  const partialDC =
    baseValue * powerLevelModifier * frequencyModifier * complexityModifier +
    diceContribution;

  return partialDC;
}

// ------------------------------------------------------------------
//  Helper functions for repeated logic
// ------------------------------------------------------------------

function calculateDiceContribution(dieValue, dieAmount) {
  if (dieAmount >= 1) {
    return ((dieValue + 10) * dieAmount);
  }
  return 0;
}

function getFrequencyMod(frequencyKey) {
  // Look up the frequency modifier or default to 1
  if (values.frequencyModifiers[frequencyKey] != null) {
    return values.frequencyModifiers[frequencyKey];
  }
  return 1;
}

function getPowerLevelMod(powerLevelIndex) {
  // Some effect types might not define a powerLevel => default 1
  if (values.powerLevelModifiers[powerLevelIndex] != null) {
    return values.powerLevelModifiers[powerLevelIndex];
  }
  return 1;
}

function getComplexityMod(complexityKey) {
  if (values.complexityModifiers[complexityKey] != null) {
    return values.complexityModifiers[complexityKey];
  }
  return 1;
}
