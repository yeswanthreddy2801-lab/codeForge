import { z } from 'zod';

export const CreateContestSchema = z.object({
  title: z.string().min(1),
  description: z.string().min(1),
  startTime: z.string().datetime(),
  endTime: z.string().datetime(),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  prizes: z.array(z.string()),
  isPublished: z.boolean().default(true),
  problemIds: z.array(z.object({
    id: z.number().int().positive(),
    points: z.number().int().positive(),
    order: z.number().int().positive()
  }))
});

export const UpdateContestSchema = CreateContestSchema.partial();
