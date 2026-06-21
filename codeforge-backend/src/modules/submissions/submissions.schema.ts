import { z } from 'zod';

export const SubmitCodeSchema = z.object({
  problemId: z.number().int().positive(),
  language: z.enum(['mylang', 'cpp', 'java', 'python']),
  code: z.string().min(1).max(50 * 1024), 
});

export const RunCodeSchema = z.object({
  problemId: z.number().int().positive().optional(),
  language: z.enum(['mylang', 'cpp', 'java', 'python']),
  code: z.string().min(1).max(50 * 1024),
  customInput: z.string().optional(),
});
