import { z } from './registry';
import { ContestConfigSchema } from './config';
import { ContestRoundSchema } from './rounds';
import { ContestantSchema, VoterSchema } from './contestants';

// ── Contests ────────────────────────────────────────────────────────────────

export const ContestSchema = z
  .object({
    id: z.string().openapi({ example: 'contest-1' }),
    name: z.string().openapi({ example: 'Summer Mixoff 2024' }),
    slug: z.string().openapi({ example: 'summer-mixoff-2024' }),
    config: ContestConfigSchema.optional(),
    location: z.string().optional(),
    startTime: z.string().optional(),
    currentEntryId: z.string().optional(),
    defaultContest: z.boolean().optional(),
    rounds: z.array(ContestRoundSchema).optional(),
    contestants: z.array(ContestantSchema),
    voters: z.array(VoterSchema),
  })
  .openapi('Contest');

export const CreateContestBodySchema = ContestSchema.omit({
  id: true,
  contestants: true,
  voters: true,
}).openapi('CreateContestBody');

export const UpdateContestBodySchema = ContestSchema.partial().openapi('UpdateContestBody');
