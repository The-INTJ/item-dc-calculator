import { z } from './registry';
import { MatchupPhaseSchema } from './enums';
import { EntrySchema } from './entries';

// ── Matchups ────────────────────────────────────────────────────────────────

export const MatchupSchema = z
  .object({
    id: z.string().openapi({ example: 'matchup-1' }),
    contestId: z.string().openapi({ example: 'contest-1' }),
    roundId: z.string().openapi({ example: 'round-1' }),
    slotIndex: z.number().int().openapi({ example: 0 }),
    entries: z.array(EntrySchema).openapi({
      description: 'Per-contestant entries inline on this matchup (length 2 for 1v1).',
    }),
    phase: MatchupPhaseSchema,
    winnerEntryId: z.string().nullable().optional(),
    advancesToMatchupId: z.string().nullable().optional(),
    advancesToSlot: z.number().int().nullable().optional(),
  })
  .openapi('Matchup', { description: 'A first-class matchup between contestants within a round.' });

export const CreateMatchupBodySchema = z
  .object({
    roundId: z.string(),
    slotIndex: z.number().int(),
    contestantIds: z.array(z.string()).min(1).max(2),
    phase: MatchupPhaseSchema.optional(),
    winnerEntryId: z.string().nullable().optional(),
  })
  .openapi('CreateMatchupBody');

export const UpdateMatchupBodySchema = MatchupSchema.partial()
  .omit({ id: true, contestId: true })
  .openapi('UpdateMatchupBody');
