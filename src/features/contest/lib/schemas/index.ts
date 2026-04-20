/**
 * Central schema registry for the contest API.
 *
 * This module is the single source of truth for:
 *   - Runtime validation of API request bodies (via zod)
 *   - TypeScript types (via `z.infer`)
 *   - OpenAPI schemas (via @asteasolutions/zod-to-openapi)
 *
 * When adding a new endpoint or changing a shape, edit this file first, then
 * regenerate the spec with `npm run docs:build`.
 */

import { extendZodWithOpenApi, OpenAPIRegistry } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

export const registry = new OpenAPIRegistry();

/**
 * Registers a schema with the OpenAPI registry under the given name so the
 * build step can emit it into `components.schemas`. Returns the same schema
 * so the registration inline with the definition.
 */
function register<S extends z.ZodType>(name: string, schema: S): S {
  registry.register(name, schema);
  return schema;
}

// ── Primitive enums ─────────────────────────────────────────────────────────

export const MatchupPhaseSchema = z
  .enum(['set', 'shake', 'scored'])
  .openapi('MatchupPhase', { description: 'Matchup lifecycle phase', example: 'shake' });

/** @deprecated Alias of MatchupPhaseSchema for backward compatibility. */
export const ContestPhaseSchema = MatchupPhaseSchema;

export const RoundStatusSchema = z
  .enum(['pending', 'upcoming', 'active', 'closed'])
  .openapi('RoundStatus', {
    description: 'Computed round status derived from constituent matchup phases',
    example: 'active',
  });

export const UserRoleSchema = z
  .enum(['admin', 'voter', 'competitor'])
  .openapi('UserRole', { example: 'voter' });

// ── Configs ─────────────────────────────────────────────────────────────────

export const AttributeConfigSchema = z
  .object({
    id: z.string().openapi({ description: 'Unique identifier (lowercase alphanumeric)', example: 'aroma' }),
    label: z.string().openapi({ description: 'Display name', example: 'Aroma' }),
    description: z.string().optional().openapi({ description: 'Helper text for voters', example: 'How appealing is the scent?' }),
    min: z.number().optional().openapi({ description: 'Minimum score value', example: 0 }),
    max: z.number().optional().openapi({ description: 'Maximum score value', example: 10 }),
  })
  .openapi('AttributeConfig', { description: 'Configuration for a single scoring attribute' });

export const ContestConfigSchema = z
  .object({
    topic: z.string().openapi({ example: 'Mixology' }),
    entryLabel: z.string().optional().openapi({ example: 'Drink' }),
    entryLabelPlural: z.string().optional().openapi({ example: 'Drinks' }),
    contestantLabel: z.string().optional(),
    contestantLabelPlural: z.string().optional(),
    attributes: z.array(AttributeConfigSchema).openapi({ description: 'Scoring dimensions' }),
  })
  .openapi('ContestConfig', {
    description: 'Configuration defining the contest type and scoring attributes',
  });

export const ContestConfigItemSchema = ContestConfigSchema.extend({
  id: z.string().openapi({ example: 'mixology' }),
}).openapi('ContestConfigItem', {
  description: 'Stored contest configuration with unique ID',
});

export const CreateContestConfigBodySchema = ContestConfigSchema.extend({
  id: z.string().optional(),
}).openapi('CreateContestConfigBody');

export const UpdateContestConfigBodySchema = ContestConfigItemSchema.partial().openapi(
  'UpdateContestConfigBody',
);

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
    matchupId: z.string().optional().openapi({
      description: 'Matchup this vote belongs to. Required for new votes.',
      example: 'matchup-1',
    }),
    /** @deprecated Use matchupId. Kept for legacy vote docs during the matchup refactor. */
    round: z.string().optional().openapi({ example: 'finals' }),
    breakdown: ScoreBreakdownSchema,
    notes: z.string().optional().openapi({ example: 'Excellent balance of flavors' }),
  })
  .openapi('ScoreEntry');

export const SubmitScoreBodySchema = z
  .object({
    entryId: z.string().openapi({ description: 'Entry being scored' }),
    matchupId: z.string().optional().openapi({
      description: 'Matchup this score is cast against. Required starting in PR 4; optional now for backward compatibility.',
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
    /** @deprecated Use matchupId. */
    round: z.string().optional(),
    notes: z.string().optional(),
  })
  .openapi('SubmitScoreBody');

// ── Voters / entries ────────────────────────────────────────────────────────

export const VoterSchema = z
  .object({
    id: z.string().openapi({ example: 'user-1' }),
    displayName: z.string().openapi({ example: 'Jane Smith' }),
    role: UserRoleSchema,
    contact: z.string().optional().openapi({ example: 'jane@example.com' }),
  })
  .openapi('Voter');

export const EntrySchema = z
  .object({
    id: z.string().openapi({ example: 'entry-1' }),
    name: z.string().openapi({ example: 'Summer Sunset' }),
    slug: z.string().openapi({ example: 'summer-sunset' }),
    description: z.string().openapi({ example: 'A refreshing citrus cocktail with a hint of lavender' }),
    /** @deprecated Entries are contest-scoped; assignment is via Matchup.entryIds. Removed in PR 8. */
    round: z.string().optional().openapi({ example: 'finals' }),
    submittedBy: z.string().openapi({ example: 'John Doe' }),
    sumScore: z.number().optional().openapi({
      description: 'Aggregate: sum of all vote totals for this entry',
      example: 42.5,
    }),
    voteCount: z.number().int().optional().openapi({
      description: 'Aggregate: number of distinct voters',
      example: 5,
    }),
  })
  .openapi('Entry', { description: 'A contest entry (drink, chili, cosplay, performance, etc.)' });

export const CreateEntryBodySchema = EntrySchema.omit({ id: true }).openapi('CreateEntryBody');
export const UpdateEntryBodySchema = EntrySchema.partial()
  .omit({ id: true })
  .openapi('UpdateEntryBody');

// ── Contest rounds ──────────────────────────────────────────────────────────

export const ContestRoundSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    number: z.number().int().nullable().optional(),
    /** @deprecated Computed from matchup phases; removed in PR 8. */
    state: MatchupPhaseSchema.optional(),
    adminOverride: z.enum(['active', 'closed']).nullable().optional().openapi({
      description:
        "Admin escape hatch. 'active' forces the round open; 'closed' forces it closed; null/undefined uses computed status.",
    }),
  })
  .openapi('ContestRound');

// ── Matchups ────────────────────────────────────────────────────────────────

export const MatchupSchema = z
  .object({
    id: z.string().openapi({ example: 'matchup-1' }),
    contestId: z.string().openapi({ example: 'contest-1' }),
    roundId: z.string().openapi({ example: 'round-1' }),
    slotIndex: z.number().int().openapi({ example: 0 }),
    entryIds: z.array(z.string()).openapi({
      description: 'Entries competing in this matchup (length 2 for 1v1).',
      example: ['entry-1', 'entry-2'],
    }),
    phase: MatchupPhaseSchema,
    winnerEntryId: z.string().nullable().optional(),
    advancesToMatchupId: z.string().nullable().optional(),
    advancesToSlot: z.number().int().nullable().optional(),
  })
  .openapi('Matchup', { description: 'A first-class matchup between entries within a round.' });

export const CreateMatchupBodySchema = MatchupSchema.omit({ id: true, contestId: true })
  .partial({ entryIds: true, phase: true })
  .openapi('CreateMatchupBody');

export const UpdateMatchupBodySchema = MatchupSchema.partial()
  .omit({ id: true, contestId: true })
  .openapi('UpdateMatchupBody');

export const SeedRoundBodySchema = z
  .object({
    entryIdPairs: z
      .array(z.tuple([z.string(), z.string()]))
      .optional()
      .openapi({
        description:
          'Explicit entry pairs for round-1 seeding. Omit for rounds > 1 (propagated from previous round winners).',
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

// ── Contests ────────────────────────────────────────────────────────────────

export const ContestSchema = z
  .object({
    id: z.string().openapi({ example: 'contest-1' }),
    name: z.string().openapi({ example: 'Summer Mixoff 2024' }),
    slug: z.string().openapi({ example: 'summer-mixoff-2024' }),
    /** @deprecated Derive from active round's matchup phases. Removed in PR 8. */
    phase: MatchupPhaseSchema.optional(),
    config: ContestConfigSchema.optional(),
    location: z.string().optional(),
    startTime: z.string().optional(),
    /** @deprecated Vestigial. Removed in PR 8. */
    bracketRound: z.string().optional(),
    currentEntryId: z.string().optional(),
    defaultContest: z.boolean().optional(),
    rounds: z.array(ContestRoundSchema).optional(),
    /** @deprecated Derived. Removed in PR 8. */
    activeRoundId: z.string().nullable().optional(),
    /** @deprecated Derived. Removed in PR 8. */
    futureRoundId: z.string().nullable().optional(),
    entries: z.array(EntrySchema),
    voters: z.array(VoterSchema),
  })
  .openapi('Contest');

export const CreateContestBodySchema = ContestSchema.omit({
  id: true,
  entries: true,
  voters: true,
}).openapi('CreateContestBody');

export const UpdateContestBodySchema = ContestSchema.partial().openapi('UpdateContestBody');

// ── Auth / profiles ─────────────────────────────────────────────────────────

export const UserProfileSchema = z
  .object({
    displayName: z.string().openapi({ example: 'Jane Smith' }),
    email: z.string().optional().openapi({ example: 'jane@example.com' }),
    role: UserRoleSchema,
    avatarUrl: z.string().optional().openapi({ example: 'https://example.com/avatar.png' }),
  })
  .openapi('UserProfile', {
    description:
      'User profile document. Writes are only possible through the API; clients may read their own document.',
  });

export const UpdateProfileBodySchema = UserProfileSchema.pick({
  displayName: true,
  avatarUrl: true,
})
  .partial()
  .openapi('UpdateProfileBody');

export const RegisterProfileBodySchema = z
  .object({
    displayName: z.string().optional(),
    email: z.string().optional(),
    avatarUrl: z.string().optional(),
  })
  .openapi('RegisterProfileBody');

export const CreateSessionBodySchema = z
  .object({
    idToken: z.string().min(1).openapi({
      description: 'Firebase ID token obtained client-side via `user.getIdToken()`',
    }),
  })
  .openapi('CreateSessionBody', {
    description:
      'Payload for POST /auth/session. The server exchanges the ID token for a long-lived session cookie so server-rendered pages can authenticate the user.',
  });

// ── Register contestant ─────────────────────────────────────────────────────

export const RegisterContestantBodySchema = z
  .object({
    displayName: z.string().optional(),
    entryName: z.string().optional(),
  })
  .openapi('RegisterContestantBody');

// ── Error envelope ──────────────────────────────────────────────────────────

export const ErrorSchema = z
  .object({ message: z.string().openapi({ example: 'Contest not found' }) })
  .openapi('Error');

// ── Inferred TypeScript types ───────────────────────────────────────────────
// These replace the hand-written interfaces in contestTypes.ts / auth/types.ts
// as new code is migrated. For now they coexist — the shapes are identical.

export type MatchupPhase = z.infer<typeof MatchupPhaseSchema>;
/** @deprecated Use {@link MatchupPhase}. */
export type ContestPhase = MatchupPhase;
export type RoundStatus = z.infer<typeof RoundStatusSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type AttributeConfig = z.infer<typeof AttributeConfigSchema>;
export type ContestConfig = z.infer<typeof ContestConfigSchema>;
export type ContestConfigItem = z.infer<typeof ContestConfigItemSchema>;
export type ScoreBreakdown = z.infer<typeof ScoreBreakdownSchema>;
export type ScoreEntry = z.infer<typeof ScoreEntrySchema>;
export type Voter = z.infer<typeof VoterSchema>;
export type Entry = z.infer<typeof EntrySchema>;
export type ContestRound = z.infer<typeof ContestRoundSchema>;
export type Matchup = z.infer<typeof MatchupSchema>;
export type CreateMatchupBody = z.infer<typeof CreateMatchupBodySchema>;
export type UpdateMatchupBody = z.infer<typeof UpdateMatchupBodySchema>;
export type SeedRoundBody = z.infer<typeof SeedRoundBodySchema>;
export type UpdateRoundBody = z.infer<typeof UpdateRoundBodySchema>;
export type Contest = z.infer<typeof ContestSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type CreateContestBody = z.infer<typeof CreateContestBodySchema>;
export type UpdateContestBody = z.infer<typeof UpdateContestBodySchema>;
export type CreateEntryBody = z.infer<typeof CreateEntryBodySchema>;
export type UpdateEntryBody = z.infer<typeof UpdateEntryBodySchema>;
export type SubmitScoreBody = z.infer<typeof SubmitScoreBodySchema>;
export type CreateContestConfigBody = z.infer<typeof CreateContestConfigBodySchema>;
export type UpdateContestConfigBody = z.infer<typeof UpdateContestConfigBodySchema>;
export type RegisterProfileBody = z.infer<typeof RegisterProfileBodySchema>;
export type CreateSessionBody = z.infer<typeof CreateSessionBodySchema>;
export type UpdateProfileBody = z.infer<typeof UpdateProfileBodySchema>;
export type RegisterContestantBody = z.infer<typeof RegisterContestantBodySchema>;

// ── Registry entries ────────────────────────────────────────────────────────
// Registering schemas here (in addition to the .openapi() metadata calls above)
// is what makes them appear in the generated components.schemas block.

register('MatchupPhase', MatchupPhaseSchema);
register('RoundStatus', RoundStatusSchema);
register('UserRole', UserRoleSchema);
register('AttributeConfig', AttributeConfigSchema);
register('ContestConfig', ContestConfigSchema);
register('ContestConfigItem', ContestConfigItemSchema);
register('CreateContestConfigBody', CreateContestConfigBodySchema);
register('UpdateContestConfigBody', UpdateContestConfigBodySchema);
register('ScoreBreakdown', ScoreBreakdownSchema);
register('ScoreEntry', ScoreEntrySchema);
register('SubmitScoreBody', SubmitScoreBodySchema);
register('Voter', VoterSchema);
register('Entry', EntrySchema);
register('CreateEntryBody', CreateEntryBodySchema);
register('UpdateEntryBody', UpdateEntryBodySchema);
register('ContestRound', ContestRoundSchema);
register('Matchup', MatchupSchema);
register('CreateMatchupBody', CreateMatchupBodySchema);
register('UpdateMatchupBody', UpdateMatchupBodySchema);
register('SeedRoundBody', SeedRoundBodySchema);
register('UpdateRoundBody', UpdateRoundBodySchema);
register('Contest', ContestSchema);
register('CreateContestBody', CreateContestBodySchema);
register('UpdateContestBody', UpdateContestBodySchema);
register('UserProfile', UserProfileSchema);
register('UpdateProfileBody', UpdateProfileBodySchema);
register('RegisterProfileBody', RegisterProfileBodySchema);
register('CreateSessionBody', CreateSessionBodySchema);
register('RegisterContestantBody', RegisterContestantBodySchema);
register('Error', ErrorSchema);
