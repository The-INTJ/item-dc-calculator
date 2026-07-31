/**
 * Central schema registry for the contest API.
 *
 * This module is the single source of truth for:
 *   - Runtime validation of API request bodies (via zod)
 *   - TypeScript types (via `z.infer`)
 *   - OpenAPI schemas (via @asteasolutions/zod-to-openapi)
 *
 * When adding a new endpoint or changing a shape, edit the concept module
 * (e.g. `matchups.ts`, `scoring.ts`) first, then regenerate the spec with
 * `npm run docs:build`. This barrel re-exports every schema and inferred type
 * and performs the registry registrations.
 */

import { register, registry, z } from './registry';
import { MatchupPhaseSchema, RoundStatusSchema, UserRoleSchema } from './enums';
import {
  AttributeConfigSchema,
  ContestConfigSchema,
  ContestConfigItemSchema,
  CreateContestConfigBodySchema,
  UpdateContestConfigBodySchema,
} from './config';
import {
  ScoreBreakdownSchema,
  ScoreEntrySchema,
  SubmitScoreBodySchema,
  SubmitBallotBodySchema,
} from './scoring';
import {
  VoterSchema,
  ContestantSchema,
  CreateContestantBodySchema,
  UpdateContestantBodySchema,
  RegisterContestantBodySchema,
} from './contestants';
import { EntrySchema, SetMatchupEntryNameBodySchema } from './entries';
import { ContestRoundSchema, SeedRoundBodySchema, UpdateRoundBodySchema } from './rounds';
import { MatchupSchema, CreateMatchupBodySchema, UpdateMatchupBodySchema } from './matchups';
import { ContestSchema, CreateContestBodySchema, UpdateContestBodySchema } from './contest';
import {
  UserProfileSchema,
  UpdateProfileBodySchema,
  RegisterProfileBodySchema,
  CreateSessionBodySchema,
} from './profiles';
import { ErrorSchema } from './errors';

export { registry };
export * from './enums';
export * from './config';
export * from './scoring';
export * from './contestants';
export * from './entries';
export * from './rounds';
export * from './matchups';
export * from './contest';
export * from './profiles';
export * from './errors';

// ── Inferred TypeScript types ───────────────────────────────────────────────
// These replace the hand-written interfaces in contestTypes.ts / auth/types.ts
// as new code is migrated. For now they coexist — the shapes are identical.

export type MatchupPhase = z.infer<typeof MatchupPhaseSchema>;
export type RoundStatus = z.infer<typeof RoundStatusSchema>;
export type UserRole = z.infer<typeof UserRoleSchema>;
export type AttributeConfig = z.infer<typeof AttributeConfigSchema>;
export type ContestConfig = z.infer<typeof ContestConfigSchema>;
export type ContestConfigItem = z.infer<typeof ContestConfigItemSchema>;
export type ScoreBreakdown = z.infer<typeof ScoreBreakdownSchema>;
export type ScoreEntry = z.infer<typeof ScoreEntrySchema>;
export type Voter = z.infer<typeof VoterSchema>;
export type Contestant = z.infer<typeof ContestantSchema>;
export type CreateContestantBody = z.infer<typeof CreateContestantBodySchema>;
export type UpdateContestantBody = z.infer<typeof UpdateContestantBodySchema>;
export type Entry = z.infer<typeof EntrySchema>;
export type SetMatchupEntryNameBody = z.infer<typeof SetMatchupEntryNameBodySchema>;
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
export type SubmitScoreBody = z.infer<typeof SubmitScoreBodySchema>;
export type SubmitBallotBody = z.infer<typeof SubmitBallotBodySchema>;
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
register('SubmitBallotBody', SubmitBallotBodySchema);
register('Voter', VoterSchema);
register('Contestant', ContestantSchema);
register('CreateContestantBody', CreateContestantBodySchema);
register('UpdateContestantBody', UpdateContestantBodySchema);
register('Entry', EntrySchema);
register('SetMatchupEntryNameBody', SetMatchupEntryNameBodySchema);
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
