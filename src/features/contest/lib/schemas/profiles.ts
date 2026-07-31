import { z } from './registry';
import { UserRoleSchema } from './enums';

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
