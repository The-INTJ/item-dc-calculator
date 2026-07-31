import { z } from './registry';
import { UserRoleSchema } from './enums';

// ── Scoring ─────────────────────────────────────────────────────────────────

export const ScoreBreakdownSchema = z
  .record(z.string(), z.number())
  .openapi('ScoreBreakdown', {
    description: 'Dynamic score breakdown — keys are attribute IDs from the contest config',
    example: { aroma: 8, balance: 7, presentation: 9, creativity: 8, overall: 8 },
  });

export const ScoreEntrySchema = z
  .object({
    id: z.string().openapi({ example: 'user1_matchup1_entry1' }),
    entryId: z.string().openapi({ example: 'entry-1' }),
    userId: z.string().openapi({ example: 'user-1' }),
    matchupId: z.string().openapi({
      description: 'Matchup this vote belongs to.',
      example: 'matchup-1',
    }),
    breakdown: ScoreBreakdownSchema,
    notes: z.string().optional().openapi({ example: 'Excellent balance of flavors' }),
  })
  .openapi('ScoreEntry');

export const SubmitScoreBodySchema = z
  .object({
    entryId: z.string().openapi({ description: 'Entry being scored' }),
    matchupId: z.string().openapi({
      description: 'Matchup this score is cast against. Required.',
    }),
    userName: z.string().optional().openapi({
      description: 'Display name for auto-registered voter (defaults to token display name)',
    }),
    userRole: UserRoleSchema.optional(),
    categoryId: z.string().optional().openapi({
      description: 'Single category to update (must match a config attribute ID)',
    }),
    value: z.number().optional().openapi({ description: 'Score value for single category' }),
    breakdown: z
      .record(z.string(), z.number())
      .optional()
      .openapi({ description: 'Partial or full ScoreBreakdown' }),
    notes: z.string().optional(),
  })
  .openapi('SubmitScoreBody');

export const SubmitBallotBodySchema = z
  .object({
    userName: z.string().optional().openapi({
      description: 'Display name for auto-registered voter (defaults to token display name)',
    }),
    userRole: UserRoleSchema.optional(),
    scores: z
      .array(
        z.object({
          entryId: z.string().openapi({ description: 'Entry being scored' }),
          breakdown: z.record(z.string(), z.number()).openapi({
            description: 'Full ScoreBreakdown for this entry',
          }),
        }),
      )
      .min(1)
      .max(4)
      .openapi({ description: 'One element per matchup entry the voter is scoring' }),
  })
  .openapi('SubmitBallotBody', {
    description:
      "A voter's complete ballot for one matchup. Committed atomically — if the matchup closes mid-submit, the whole ballot is rejected (no partial ballots).",
  });
