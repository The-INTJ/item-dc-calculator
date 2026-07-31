import { z } from './registry';

// ── Error envelope ──────────────────────────────────────────────────────────

export const ErrorSchema = z
  .object({
    message: z.string().openapi({ example: 'Contest not found' }),
    code: z.string().optional().openapi({
      description: 'Machine-readable error code (e.g. MATCHUP_CLOSED, SCORE_INVALID)',
      example: 'MATCHUP_CLOSED',
    }),
  })
  .openapi('Error');
