import { z } from 'zod';

const TipText = z.string().trim().min(1).max(2400);

export const TipCardSchema = z.object({
  id: z.string().trim().min(1).max(80).optional(),
  title: z.string().trim().min(1).max(120),
  summary: z.string().trim().min(1).max(280),
  body: TipText,
  category: z.enum(['water', 'grow', 'weeds', 'sun', 'soil']),
  tags: z.array(z.string().trim().min(1).max(40)).max(12).default([]),
  source: z.string().trim().max(240).optional(),
});

export const TipCardPatchSchema = TipCardSchema.omit({ id: true }).partial();
