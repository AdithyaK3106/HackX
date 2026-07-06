import { z } from 'zod';

export const RequestResponseSchema = z.object({
  type: z.enum(['string', 'number', 'boolean', 'object', 'array']),
  description: z.string().optional(),
  properties: z.record(z.any()).optional(),
  required: z.array(z.string()).optional(),
}).strict();

export type RequestResponse = z.infer<typeof RequestResponseSchema>;

export const EndpointSchema = z.object({
  id: z.string().min(1),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  path: z.string().min(1),
  request: RequestResponseSchema.optional(),
  response: RequestResponseSchema,
  description: z.string().optional(),
}).strict();

export type Endpoint = z.infer<typeof EndpointSchema>;

export const ContractsSchema = z.object({
  version: z.string().default('1.0.0'),
  endpoints: z.array(EndpointSchema),
  enums: z.record(z.array(z.string())).optional(),
}).strict();

export type Contracts = z.infer<typeof ContractsSchema>;
