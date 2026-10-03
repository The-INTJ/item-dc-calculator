/** Request-body validation for the Tracer API. */

import { z } from 'zod';

import { MAX_PATH_LENGTH } from '../engine';
import type { TurnInput } from '../engine';
import { SideSchema, SquareSchema } from './storage/stateSchema';

export const DISPLAY_NAME_MAX = 24;

// Letters, marks, numbers, punctuation, symbols and plain spaces — no control
// characters or line breaks in a name that ends up on everyone's screen.
const PRINTABLE_NAME = /^[\p{L}\p{M}\p{N}\p{P}\p{S} ]+$/u;

export const DisplayNameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(DISPLAY_NAME_MAX, `Name must be ${DISPLAY_NAME_MAX} characters or fewer`)
  .regex(PRINTABLE_NAME, 'Name contains characters that cannot be shown');

export const CreateGameSchema = z.object({
  displayName: DisplayNameSchema,
  seat: z.enum(['w', 'b', 'random']),
  mode: z.enum(['online', 'hotseat']),
});

export const JoinGameSchema = z.object({
  displayName: DisplayNameSchema,
});

const StepsSchema = z
  .string()
  .regex(new RegExp(`^[1-46-9]{1,${MAX_PATH_LENGTH}}$`), 'Not a path');

const MainActionSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('move'), from: SquareSchema, to: SquareSchema }),
  z.object({ kind: z.literal('chart'), from: SquareSchema, steps: StepsSchema }),
  z.object({ kind: z.literal('pass') }),
]);

export const TurnInputSchema = z.object({
  ply: z.number().int().min(0),
  main: MainActionSchema,
  freeStep: z.object({ to: SquareSchema, when: z.enum(['before', 'after']) }).nullable(),
}) satisfies z.ZodType<TurnInput>;

export const SubmitTurnSchema = z.object({
  clientTurnId: z.string().regex(/^[A-Za-z0-9_-]{8,64}$/, 'Bad turn id'),
  turn: TurnInputSchema,
});

export const DrawActionSchema = z.object({
  action: z.enum(['offer', 'accept', 'decline', 'withdraw']),
});

export const ReleaseSeatSchema = z.object({
  side: SideSchema,
});

export type CreateGameInput = z.infer<typeof CreateGameSchema>;
export type SubmitTurnInput = z.infer<typeof SubmitTurnSchema>;
export type DrawAction = z.infer<typeof DrawActionSchema>['action'];

/** Admin SDK auto-ids: 20 characters of [A-Za-z0-9]. */
export function isGameId(value: unknown): value is string {
  return typeof value === 'string' && /^[A-Za-z0-9]{20}$/.test(value);
}
