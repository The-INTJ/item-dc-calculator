/**
 * The rule-set schema. Every RuleSet the engine receives — from a game
 * style, a player's tweaks, a setup link, the create API or a stored game —
 * passes through it first.
 *
 * Adding a rule: add its field with `.default(<how games played before the
 * rule existed>)`, so every stored game still parses (see README "Styles").
 */

import { z } from 'zod';

import { FREE_STEP, KING_MEMORY, MAX_PATH_LENGTH } from '../engine';
import type { Layout, PieceKind, RuleSet } from '../engine';

const ID_LETTER: Record<PieceKind, string> = { king: 'K', tracer: 'T', warden: 'W' };

/** Tiers index `tracerReach.limits`; eight is far more than any layout needs. */
export const MAX_TIERS = 8;

const PlacementSchema = z.object({
  id: z.string().regex(/^[KTW]\d{0,2}$/, 'Not a piece id'),
  kind: z.enum(['king', 'tracer', 'warden']),
  file: z.string().regex(/^[a-h]$/, 'Not a file'),
  row: z.union([z.literal(0), z.literal(1)]),
  tier: z.number().int().min(0).max(MAX_TIERS - 1).nullable(),
});

/** What is wrong with a layout's pieces, if anything. */
export function layoutProblems(pieces: Layout['pieces']): string[] {
  const problems: string[] = [];
  if (pieces.filter((p) => p.kind === 'king').length !== 1) problems.push('A layout needs exactly one king.');
  if (!pieces.some((p) => p.kind !== 'king')) problems.push('A layout needs a piece besides the king.');
  if (new Set(pieces.map((p) => p.id)).size !== pieces.length) problems.push('Piece ids must be unique.');
  if (new Set(pieces.map((p) => `${p.file}${p.row}`)).size !== pieces.length) problems.push('Two pieces share a square.');
  for (const p of pieces) {
    if (p.id[0] !== ID_LETTER[p.kind]) problems.push(`Piece ${p.id} is not named for a ${p.kind}.`);
    if (p.kind !== 'tracer' && p.tier !== null) problems.push(`Only Tracers have tiers (${p.id}).`);
  }
  return problems;
}

export const LayoutSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9-]{1,32}$/, 'Not a layout id'),
    name: z.string().min(1).max(40),
    pieces: z.array(PlacementSchema).min(2).max(16),
  })
  .superRefine((layout, ctx) => {
    layoutProblems(layout.pieces).forEach((message) => ctx.addIssue({ code: 'custom', message }));
  });

export const RuleSetSchema = z.object({
  layout: LayoutSchema,
  tracerReach: z.object({
    limited: z.boolean(),
    limits: z.array(z.number().int().min(1).max(MAX_PATH_LENGTH).nullable()).max(MAX_TIERS),
  }),
  kingMemory: z.enum(KING_MEMORY),
  freeStep: z.enum(FREE_STEP),
  loneKingWins: z.boolean(),
  dodgeDraw: z.number().int().min(0).max(99),
}) satisfies z.ZodType<RuleSet>;
