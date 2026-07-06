import { z } from 'zod';

export const OwnershipRuleSchema = z.object({
  glob: z.string().min(1),
  owner: z.string().min(1),
  policy: z.enum(['permissive', 'strict']).optional(),
}).strict();

export type OwnershipRule = z.infer<typeof OwnershipRuleSchema>;

export const OwnershipSchema = z.object({
  rules: z.array(OwnershipRuleSchema),
}).strict();

export type Ownership = z.infer<typeof OwnershipSchema>;
