/** Request-body validation schemas for the plant tracker API. */

import { z } from 'zod';

const PlantNameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(80, 'Name must be 80 characters or fewer');

const NoteSchema = z
  .string()
  .trim()
  .min(1, 'Note is required')
  .max(2000, 'Note must be 2,000 characters or fewer');

const VibeRatingSchema = z.coerce
  .number()
  .int('Rating must be a whole number')
  .min(0, 'Rating must be at least 0')
  .max(10, 'Rating must be 10 or lower');

export const CreatePlantSchema = z.object({
  name: PlantNameSchema,
});

export const UpdatePlantSchema = z.object({
  name: PlantNameSchema,
});

export const AddEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('watered') }),
  z.object({ type: z.literal('watered_nutrition') }),
  z.object({ type: z.literal('fertilized') }),
  z.object({ type: z.literal('replanted') }),
  z.object({ type: z.literal('note'), note: NoteSchema }),
  z.object({ type: z.literal('vibe_check'), rating: VibeRatingSchema }),
]);
