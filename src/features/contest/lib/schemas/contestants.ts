import { z } from './registry';
import { UserRoleSchema } from './enums';

// ── Voters / contestants ────────────────────────────────────────────────────

export const VoterSchema = z
  .object({
    id: z.string().openapi({ example: 'user-1' }),
    displayName: z.string().openapi({ example: 'Jane Smith' }),
    role: UserRoleSchema,
    contact: z.string().optional().openapi({ example: 'jane@example.com' }),
  })
  .openapi('Voter');

export const ContestantSchema = z
  .object({
    id: z.string().openapi({ example: 'contestant-1' }),
    displayName: z.string().openapi({ example: 'Jane Smith' }),
    userId: z.string().optional().openapi({ example: 'firebase-uid-abc' }),
    contact: z.string().optional().openapi({ example: 'jane@example.com' }),
  })
  .openapi('Contestant', {
    description: 'A registered contestant. Identity record; per-game entries live on Matchups.',
  });

export const CreateContestantBodySchema = ContestantSchema.omit({ id: true }).openapi(
  'CreateContestantBody',
);
export const UpdateContestantBodySchema = ContestantSchema.partial()
  .omit({ id: true })
  .openapi('UpdateContestantBody');

// ── Register contestant ─────────────────────────────────────────────────────

export const RegisterContestantBodySchema = z
  .object({
    displayName: z.string().optional(),
    contact: z.string().optional(),
  })
  .openapi('RegisterContestantBody');
