import values, { ComplexityType, Effect, FrequencyType } from './values';

/**
 * Calculates sum of all effects' partial DCs
 * Calculate global effect changes here
 */
export function calculateEffectSum(effectsArray: Effect[]): number {
  let accumulatedDC = 0;

  for (let i = 0; i < effectsArray.length; i++) {
    let effectDC = calculateEffectDC(effectsArray[i]);
    if (effectsArray[i].cursed) {
      // not sure about this yet
      // effectDC = -Math.abs(effectDC); // Make the effect negative if cursed
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
export function calculateEffectCountDC(effectsArray: Effect[]): number {
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
export function calculateFinalDC(effectsArray: Effect[]): number {
  const effectSum = calculateEffectSum(effectsArray);
  const effectCount = calculateEffectCountDC(effectsArray);
  return effectSum + effectCount;
}

/**
 * Routes to a specialized calculation based on effectType.
 * If none is matched, calls the originalEffectDCMethod as a fallback.
 */
export function calculateEffectDC(effect: Effect): number {
  switch (effect.effectType) {
    case 'Dice attack damage':
      return calculateDiceDamageAttackDC(effect);
    case 'Move speed':
    case 'Fly speed':
      return calculateSpeedDC(effect);
    case 'Resistance':
      return calculateResistanceDC(effect);
    case 'Immunity':
      return calculateImmunityDC(effect);
    case 'Spell slot':
    case 'Cantrip':
    case 'Learn spell':
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

function calculateDiceDamageAttackDC(effect: Effect): number {
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

function calculateSpeedDC(effect: Effect): number {
  const freqMod = getFrequencyMod(effect.frequency);
  const partialDC = effect.amountValue * freqMod;
  return partialDC + (effect.baseValue * freqMod);
}

function calculateResistanceDC(effect: Effect): number {
  // Uses effect.value & frequency
  const freqMod = getFrequencyMod(effect.frequency);
  const resistanceDC = values.resistanceRarity[effect.resistanceType];
  const durationMod = values.durationValues[effect.duration];
  const complexityMod = getComplexityMod(effect.complexity);
  const partialDC = resistanceDC * freqMod * complexityMod + durationMod;
  return partialDC + effect.baseValue;
}

function calculateImmunityDC(effect: Effect): number {
  return calculateResistanceDC(effect) * 2;
}

function calculateSpellSlotDC(effect: Effect): number {
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
  } else if (effect.effectType === 'Learn spell') {
    partialDC = 20;
  } else {
    partialDC = effect.baseValue * pwrMod * freqMod * compMod;
  }

  partialDC += effect.caster || effect.outsideClass ? 0 : 20; // additional shard investment from non-caster

  return partialDC;
}

function calculateUtilityDC(effect: Effect): number {
  // Utilities: dieValue, dieAmount, frequency, complexity, powerLevel, baseValue
  // This is basically the "original" approach, but skipping any fields you don't track
  const dice = calculateDiceContribution(effect.dieValue, effect.dieAmount);
  const pwrMod = getPowerLevelMod(effect.powerLevel);
  const freqMod = getFrequencyMod(effect.frequency);
  const compMod = getComplexityMod(effect.complexity);

  const partialDC = (effect.baseValue * pwrMod * freqMod * compMod) + dice;
  return partialDC;
}

function calculatePlusXItemDC(effect: Effect): number {
  return effect.baseValue;
}

// ------------------------------------------------------------------
//  Original fallback method (unchanged from your code).
// ------------------------------------------------------------------

/**
 * The original logic for calculating an effect's partial DC.
 * This is called if the effectType switch doesn't match.
 */
function originalEffectDCMethod(effect: Effect): number {
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

function calculateDiceContribution(dieValue: number, dieAmount: number): number {
  if (dieAmount >= 1) {
    return ((dieValue + 10) * dieAmount);
  }
  return 0;
}

function getFrequencyMod(frequencyKey: FrequencyType): number {
    return values.frequencyModifiers[frequencyKey] || 1;
}

function getPowerLevelMod(powerLevelIndex: number): number {
    return values.powerLevelModifiers[powerLevelIndex] || 0.5;
}

function getComplexityMod(complexityKey: ComplexityType): number {
    return values.complexityModifiers[complexityKey] || 2;
}
