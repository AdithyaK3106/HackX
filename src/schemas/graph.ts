import { z } from 'zod';

export const DependencyEdgeSchema = z.object({
  from: z.string().min(1),
  to: z.string().min(1),
}).strict();

export type DependencyEdge = z.infer<typeof DependencyEdgeSchema>;

export const GraphSchema = z.object({
  edges: z.array(DependencyEdgeSchema).default([]),
}).strict();

export type Graph = z.infer<typeof GraphSchema>;
