/** Request-body validation schemas for the plant tracker API. */

import { z } from 'zod';

import { PLANT_EVENT_TYPES } from './types';

const PlantNameSchema = z
  .string()
  .trim()
  .min(1, 'Name is required')
  .max(80, 'Name must be 80 characters or fewer');

export const CreatePlantSchema = z.object({
  name: PlantNameSchema,
});

export const UpdatePlantSchema = z.object({
  name: PlantNameSchema,
});

export const AddEventSchema = z.object({
  type: z.enum(PLANT_EVENT_TYPES),
});
