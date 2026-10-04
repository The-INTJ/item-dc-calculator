/**
 * Zod schemas for the engine's persisted shapes. They validate every game
 * document the server reads and every snapshot the browser receives, so a
 * malformed document fails loudly instead of corrupting a game.
 */

import { z } from 'zod';

import { isStepString, parsePattern } from '../../engine';
import type { ActionRecord, GameResult, GameState, Piece, TurnRecord } from '../../engine';
import { MAX_TIERS, RuleSetSchema } from '../../variants';

export const SideSchema = z.enum(['w', 'b']);
export const SquareSchema = z.string().regex(/^[a-h][1-8]$/, 'Not a square');
const StepsSchema = z.string().refine(isStepString, 'Not a path');
const PatternSchema = z.string().refine((code) => parsePattern(code) !== null, 'Not a pattern');
const PieceKindSchema = z.enum(['king', 'tracer', 'warden']);

const PieceSchema: z.ZodType<Piece> = z.object({
  id: z.string().min(1),
  side: SideSchema,
  kind: PieceKindSchema,
  at: SquareSchema,
  pattern: PatternSchema.nullable(),
  tier: z.number().int().min(0).max(MAX_TIERS - 1).nullable(),
});

const PatternsByTracerSchema = z.record(z.string(), PatternSchema);
const PatternListSchema = z.array(PatternSchema);

const ResultSchema: z.ZodType<GameResult> = z.union([
  z.object({ status: z.literal('active') }),
  z.object({
    status: z.literal('won'),
    winner: SideSchema,
    reason: z.enum(['king-capture', 'lone-king', 'resignation']),
    atPly: z.number().int().min(0),
  }),
  z.object({
    status: z.literal('drawn'),
    reason: z.enum(['step-streak', 'agreement']),
    atPly: z.number().int().min(0),
  }),
]);

export const GameStateSchema: z.ZodType<GameState> = z.object({
  rules: RuleSetSchema,
  ply: z.number().int().min(0),
  pieces: z.array(PieceSchema),
  lastCharted: z.object({ w: PatternsByTracerSchema, b: PatternsByTracerSchema }),
  chartedKeys: z.object({ w: PatternListSchema, b: PatternListSchema }),
  stepStreak: z.object({ w: z.number().int().min(0), b: z.number().int().min(0) }),
  result: ResultSchema,
});

const CapturedSchema = z.object({ id: z.string(), kind: PieceKindSchema }).nullable();

const MoveRecordSchema = z.object({
  kind: z.enum(['warden', 'strike', 'king']),
  pieceId: z.string(),
  from: SquareSchema,
  to: SquareSchema,
  via: z.string(),
  path: StepsSchema.nullable(),
  captured: CapturedSchema,
});

const ActionRecordSchema: z.ZodType<ActionRecord> = z.union([
  z.object({ kind: z.literal('step'), from: SquareSchema, to: SquareSchema }),
  MoveRecordSchema,
  z.object({
    kind: z.literal('chart'),
    pieceId: z.string(),
    from: SquareSchema,
    to: SquareSchema,
    steps: StepsSchema,
    pattern: PatternSchema,
  }),
  z.object({ kind: z.literal('pass') }),
]);

export const TurnRecordShape = {
  ply: z.number().int().min(0),
  side: SideSchema,
  actions: z.array(ActionRecordSchema),
  result: ResultSchema,
};

export const TurnRecordSchema: z.ZodType<TurnRecord> = z.object(TurnRecordShape);
