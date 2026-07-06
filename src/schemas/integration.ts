import { z } from 'zod';

export const CheckResultSchema = z.object({
  name: z.string().min(1),
  passed: z.boolean(),
  message: z.string().optional(),
}).strict();

export type CheckResult = z.infer<typeof CheckResultSchema>;

export const MergeHistoryEntrySchema = z.object({
  commit: z.string().min(1),
  at: z.string().datetime(),
  author: z.string().min(1),
  results: z.array(CheckResultSchema),
}).strict();

export type MergeHistoryEntry = z.infer<typeof MergeHistoryEntrySchema>;

export const IntegrationStateSchema = z.object({
  last_validated_commit: z.string().nullable().default(null),
  merge_history: z.array(MergeHistoryEntrySchema).default([]),
}).strict();

export type IntegrationState = z.infer<typeof IntegrationStateSchema>;
