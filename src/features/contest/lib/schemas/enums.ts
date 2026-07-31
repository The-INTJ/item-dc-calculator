import { z } from './registry';

// ── Primitive enums ─────────────────────────────────────────────────────────

export const MatchupPhaseSchema = z
  .enum(['set', 'shake', 'scored'])
  .openapi('MatchupPhase', { description: 'Matchup lifecycle phase', example: 'shake' });

export const RoundStatusSchema = z
  .enum(['pending', 'upcoming', 'active', 'closed'])
  .openapi('RoundStatus', {
    description: 'Computed round status derived from constituent matchup phases',
    example: 'active',
  });

export const UserRoleSchema = z
  .enum(['admin', 'voter', 'competitor'])
  .openapi('UserRole', { example: 'voter' });
