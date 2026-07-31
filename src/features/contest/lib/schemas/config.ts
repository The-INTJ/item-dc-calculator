import { z } from './registry';

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
