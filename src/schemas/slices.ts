import { z } from 'zod';

export const SliceSchema = z.object({
  id: z.string().min(1),
  owner: z.string().min(1),
  paths: z.array(z.string().min(1)),
  contracts: z.array(z.string()).default([]),
  depends_on: z.array(z.string()).default([]),
  acceptance: z.array(z.string()).default([]),
  blocked: z.boolean().default(false),
}).strict();

export type Slice = z.infer<typeof SliceSchema>;

export const SlicesSchema = z.object({
  slices: z.array(SliceSchema),
}).strict();

export type Slices = z.infer<typeof SlicesSchema>;
