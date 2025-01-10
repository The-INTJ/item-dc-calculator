// dcCalculations.js

import values from './values';

/**
 * Calculates the total DC by summing each effect's DC, 
 * then adds +5 for each effect.
 */
export function calculateBaseDC(effectsArray) {
  let accumulatedDC = 0;

  for (let i = 0; i < effectsArray.length; i++) {
    const currentEffect = effectsArray[i];
    // For now, we switch on effectType but always call original logic
    accumulatedDC += calculateEffectDC(currentEffect);
  }

  // Add 5 for each effect
  accumulatedDC += effectsArray.length * 5;

  return Math.ceil(accumulatedDC);
}

/**
 * Prepares the ground for multiple effect type calculations.
 * For now, just calls the original method for any effectType.
 */
function calculateEffectDC(effect) {
  switch (effect.effectType) {
    default:
      // In the future, add more cases here for unique effect calculations
      return originalEffectDCMethod(effect);
  }
}

/**
 * The original logic for calculating an effect's partial DC.
 * No changes here, just moved it into its own function.
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
    // Add a flat 10 if there's at least one die
    diceContribution += 10;
  }

  const partialDC =
    baseValue * powerLevelModifier * frequencyModifier * complexityModifier +
    diceContribution;

  return partialDC;
}
