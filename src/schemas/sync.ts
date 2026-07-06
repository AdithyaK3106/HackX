import { z } from 'zod';

export const SyncEventSchema = z.object({
  author: z.string().min(1),
  at: z.string().datetime(),
  contract_changes: z.array(z.string()).default([]),
  files_changed: z.array(z.string()).default([]),
  blocked: z.string().nullable().default(null),
}).strict();

export type SyncEvent = z.infer<typeof SyncEventSchema>;
