import { z } from 'zod';

export const CreateProblemSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  statement: z.string().min(1),
  difficulty: z.enum(['EASY', 'MEDIUM', 'HARD']),
  category: z.string().min(1),
  tags: z.array(z.string()),
  constraints: z.array(z.string()),
  examples: z.array(z.any()),
  testCases: z.array(z.any()), 
  starterCode: z.any(),
  isPublished: z.boolean().default(true),
});

export const UpdateProblemSchema = CreateProblemSchema.partial();
