/** Request-body validation schemas for the donut rotation API. */

import { z } from 'zod';

import { ISO_DATE_PATTERN, isSunday } from './sundays';

const NameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(60, 'Name must be 60 characters or fewer');

const IdSchema = z.string().trim().min(1, 'A person must be selected');

const SundaySchema = z
  .string()
  .trim()
  .regex(ISO_DATE_PATTERN, 'Date must look like YYYY-MM-DD')
  .refine(isSunday, 'Donuts are only assigned on Sundays');

const NoteSchema = z
  .string()
  .trim()
  .max(300, 'Note must be 300 characters or fewer')
  .optional()
  .transform((value) => (value === '' ? undefined : value));

export const CreatePersonSchema = z.object({
  name: NameSchema,
  active: z.boolean().optional(),
});

export const UpdatePersonSchema = z
  .object({
    name: NameSchema.optional(),
    active: z.boolean().optional(),
  })
  .refine(
    (value) => value.name !== undefined || value.active !== undefined,
    'Provide a name or an active flag',
  );

export const SetRotationSchema = z.object({
  rotation: z
    .array(z.union([IdSchema, z.null()]))
    .length(5, 'The rotation covers the 1st through 5th Sunday'),
});

export const CreateOverrideSchema = z.object({
  date: SundaySchema,
  personId: IdSchema,
  note: NoteSchema,
});

/** The two buttons on the main page, expressed as one write. */
export const AssignmentSchema = z.discriminatedUnion('mode', [
  z.object({
    mode: z.literal('decline'),
    date: SundaySchema,
    reason: NoteSchema,
  }),
  z.object({
    mode: z.literal('volunteer'),
    date: SundaySchema,
    personId: IdSchema,
    note: NoteSchema,
  }),
]);

/**
 * Parsed shapes, as the stores see them. The optional-note transform makes the
 * parsed `note` present-but-possibly-undefined, so callers *sending* a body use
 * the `…Payload` input types below instead.
 */
export type AssignmentInput = z.output<typeof AssignmentSchema>;
export type CreateOverrideInput = z.output<typeof CreateOverrideSchema>;
export type UpdatePersonInput = z.output<typeof UpdatePersonSchema>;

/** Request shapes, as the client builds them. */
export type AssignmentPayload = z.input<typeof AssignmentSchema>;
export type CreateOverridePayload = z.input<typeof CreateOverrideSchema>;
