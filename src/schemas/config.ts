import { z } from 'zod';

const ConfigBaseSchema = z.object({
  stack: z.enum(['typescript', 'python', 'mixed']),
  team: z.array(z.string().min(1)),
  build: z.string().optional(),
  test: z.string().optional(),
  lint: z.string().optional(),
  policy: z.enum(['permissive', 'strict']).optional(),
}).strict();

export const ConfigSchema = ConfigBaseSchema.transform(d => ({
  ...d,
  policy: d.policy || 'permissive',
}));

export type Config = z.infer<typeof ConfigSchema>;
