import { z } from 'zod';

export const UpdateProfileSchema = z.object({
  fullName: z.string().optional(),
  bio: z.string().max(500).optional(),
  location: z.string().max(100).optional(),
});
