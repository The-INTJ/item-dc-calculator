// dcCalculations.js

import values from './values';

/**
 * Calculates the base DC from an array of effects.
 * Also adds +5 per effect (as requested).
 */
export function calculateBaseDC(effectsArray) {
  let accumulatedDC = 0;

  for (let effectIndex = 0; effectIndex < effectsArray.length; effectIndex++) {
    const currentEffect = effectsArray[effectIndex];
    console.log(currentEffect);

    const baseValue = currentEffect.baseValue;
    const dieValue = currentEffect.dieValue;
    const dieAmount = currentEffect.dieAmount;
    const powerLevel = currentEffect.powerLevel;
    const frequency = currentEffect.frequency;
    const complexity = currentEffect.complexity;

    // Retrieve multipliers
    const powerLevelModifier = values.powerLevelModifiers[powerLevel];
    const frequencyModifier = values.frequencyModifiers[frequency];
    const complexityModifier = values.complexityModifiers[complexity];

    // Die contribution
    let diceContribution = dieValue * dieAmount;
    if (dieAmount >= 1) {
      diceContribution += 10;
    }

    // Calculate partial DC for this effect
    const partialDC =
      (baseValue * powerLevelModifier * frequencyModifier * complexityModifier)
      + diceContribution;

    accumulatedDC += partialDC;
  }

  // Add 5 for each effect
  accumulatedDC += (effectsArray.length * 5);

  return Math.ceil(accumulatedDC);
}
