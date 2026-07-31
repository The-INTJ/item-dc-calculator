import { z } from './registry';

// ── Entries ─────────────────────────────────────────────────────────────────

export const EntrySchema = z
  .object({
    id: z.string().openapi({ example: 'entry-1' }),
    contestantId: z.string().openapi({ example: 'contestant-1' }),
    matchupId: z.string().openapi({ example: 'matchup-1' }),
    name: z.string().openapi({
      description: 'Per-game name (e.g. drink name); empty string until contestant submits.',
      example: 'Summer Sunset',
    }),
    description: z.string().optional().openapi({ example: 'Citrus + lavender' }),
    slug: z.string().optional().openapi({ example: 'summer-sunset' }),
    sumScore: z.number().optional().openapi({
      description: 'Aggregate: sum of all vote totals for this matchup entry',
      example: 42.5,
    }),
    voteCount: z.number().int().optional().openapi({
      description: 'Aggregate: number of distinct voters for this matchup entry',
      example: 5,
    }),
  })
  .openapi('Entry', {
    description: 'A per-matchup entry submitted by a contestant for one specific game.',
  });

export const SetMatchupEntryNameBodySchema = z
  .object({
    name: z.string().min(1).max(80).openapi({ example: 'Summer Sunset' }),
    description: z.string().max(280).optional(),
  })
  .openapi('SetMatchupEntryNameBody');
