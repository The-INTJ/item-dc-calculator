/**
 * Structural check for a turn submission. The API validates with zod before
 * the engine runs, but the engine must never throw on garbage, so it guards
 * its own door too.
 */

import type { TurnInput } from './types';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function isMainAction(value: unknown): boolean {
  if (!isRecord(value)) return false;
  switch (value.kind) {
    case 'move':
      return typeof value.from === 'string' && typeof value.to === 'string';
    case 'chart':
      return (
        typeof value.from === 'string' &&
        typeof value.steps === 'string' &&
        (value.land === undefined || Number.isInteger(value.land))
      );
    case 'declare':
      return typeof value.pattern === 'string';
    case 'pass':
      return true;
    default:
      return false;
  }
}

function isFreeStep(value: unknown): boolean {
  if (value === null) return true;
  if (!isRecord(value)) return false;
  return typeof value.to === 'string' && (value.when === 'before' || value.when === 'after');
}

export function isTurnInput(value: unknown): value is TurnInput {
  return (
    isRecord(value) &&
    Number.isInteger(value.ply) &&
    isMainAction(value.main) &&
    isFreeStep(value.freeStep)
  );
}
