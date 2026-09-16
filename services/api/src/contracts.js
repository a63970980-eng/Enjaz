import { z } from 'zod';

const id = z.string().trim().min(1).max(200);
const text = z.string().trim().max(20_000);

export const AgentActionSchema = z.object({
  name: id,
  input: z.record(z.string(), z.unknown()).default({}),
});

export const AgentTaskSchema = z.object({
  workspaceId: id,
  taskId: id,
  employeeId: id,
  goal: text.min(1).max(5_000),
  action: id.default('data.analyze'),
  input: z.record(z.string(), z.unknown()).default({}),
});

export const EmployeeConfigSchema = z.object({
  name: text.min(1).max(160),
  role: text.min(1).max(160),
  goal: text.max(5_000).optional().default(''),
  autonomy: z.enum(['supervised', 'guided', 'autonomous']).default('supervised'),
  tools: z.array(z.union([id, z.object({ name: id })])).default([]),
  policy: z.record(z.string(), z.unknown()).optional().default({}),
});

export const ToolCallSchema = z.object({
  tool: id,
  input: z.record(z.string(), z.unknown()).default({}),
  approved: z.boolean().default(false),
});

export function parseContract(schema, value, label = 'contract') {
  const result = schema.safeParse(value);
  if (!result.success) {
    const error = new Error(`${label} validation failed`);
    error.status = 400;
    error.code = 'CONTRACT_VALIDATION_FAILED';
    error.issues = result.error.issues;
    throw error;
  }
  return result.data;
}
