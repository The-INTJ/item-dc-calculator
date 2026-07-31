import { z } from './registry';

// ── Contest rounds ──────────────────────────────────────────────────────────

export const ContestRoundSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    number: z.number().int().nullable().optional(),
    adminOverride: z.enum(['active', 'closed']).nullable().optional().openapi({
      description:
        "Admin escape hatch. 'active' forces the round open; 'closed' forces it closed; null/undefined uses computed status.",
    }),
  })
  .openapi('ContestRound');

export const SeedRoundBodySchema = z
  .object({
    entryIdPairs: z
      .array(
        z.union([
          z.tuple([z.string(), z.string()]),
          z.tuple([z.string()]),
        ]),
      )
      .optional()
      .openapi({
        description:
          'Explicit contestant-id pairs for round-1 seeding. A 2-tuple is a regular matchup; a 1-tuple is a bye (auto-advance). Omit for rounds > 1 (propagated from previous round winners).',
      }),
  })
  .openapi('SeedRoundBody');

export const UpdateRoundBodySchema = z
  .object({
    adminOverride: z.enum(['active', 'closed']).nullable().optional(),
    name: z.string().optional(),
    number: z.number().int().nullable().optional(),
  })
  .openapi('UpdateRoundBody');
