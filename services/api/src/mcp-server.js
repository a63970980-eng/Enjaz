import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';
import { query } from './db.js';
import { executeTool, listTools } from './tool-registry.js';
import { listEmployeeRoutines } from './employee-routines.js';
import { createTask, listTasks, createTaskComment } from './workforce-repository.js';

const workspaceId = process.env.ENJAZ_MCP_WORKSPACE_ID;
const employeeId = process.env.ENJAZ_MCP_EMPLOYEE_ID;

if (!workspaceId || !employeeId) {
  throw new Error('ENJAZ_MCP_WORKSPACE_ID and ENJAZ_MCP_EMPLOYEE_ID are required for the local MCP bridge');
}

const employeeRow = (await query(
  `select id, workspace_id, name, role, status, tools, policy
   from ai_employees
   where id=$1 and workspace_id=$2 and status='active'`,
  [employeeId, workspaceId],
)).rows[0];

if (!employeeRow) {
  throw new Error('Configured MCP employee is not active in the requested workspace');
}

const server = new McpServer({
  name: 'enjaz-workforce',
  version: '1.0.0',
});

server.registerTool(
  'enjaz.list_tools',
  { description: 'List the ENJAZ tools exposed to the configured digital employee.' },
  async () => ({
    content: [{
      type: 'text',
      text: JSON.stringify(listTools().filter(tool => Array.isArray(employeeRow.tools) && employeeRow.tools.some(allowed => (typeof allowed === 'string' ? allowed : allowed?.name) === tool.name))),
    }],
  }),
);

server.registerTool(
  'enjaz.list_routines',
  { description: 'List scheduled routines assigned to the configured digital employee.' },
  async () => ({
    content: [{ type: 'text', text: JSON.stringify(await listEmployeeRoutines(workspaceId, employeeId)) }],
  }),
);

server.registerTool(
  'enjaz.create_task',
  {
    description: 'Create a new task for the configured digital employee.',
    inputSchema: {
      title: z.string().min(1).max(200),
      objective: z.string().min(3).max(4000),
      priority: z.number().int().min(1).max(10).default(5),
    },
  },
  async ({ title, objective, priority }) => ({
    content: [{
      type: 'text',
      text: JSON.stringify(await createTask({ workspaceId, employeeId, title, objective, priority })),
    }],
  }),
);

server.registerTool(
  'enjaz.list_my_tasks',
  { description: 'List recent tasks assigned to the configured digital employee.' },
  async () => ({
    content: [{ type: 'text', text: JSON.stringify((await listTasks(workspaceId)).filter(task => String(task.employee_id) === String(employeeId)).slice(0, 50)) }],
  }),
);

server.registerTool(
  'enjaz.add_task_comment',
  {
    description: 'Write a persistent note to one of the configured employee\'s tasks.',
    inputSchema: {
      taskId: z.string().uuid(),
      body: z.string().min(1).max(4000),
    },
  },
  async ({ taskId, body }) => ({
    content: [{
      type: 'text',
      text: JSON.stringify(await createTaskComment({ workspaceId, taskId, employeeId, body })),
    }],
  }),
);

server.registerTool(
  'enjaz.execute_tool',
  {
    description: 'Execute an allowed ENJAZ tool. High-risk tools remain blocked unless a valid human approval is supplied by the core runtime.',
    inputSchema: {
      name: z.string().min(1),
      input: z.record(z.string(), z.unknown()).default({}),
      context: z.record(z.string(), z.unknown()).default({}),
    },
  },
  async ({ name, input, context }) => {
    const result = await executeTool({
      employee: employeeRow,
      name,
      input,
      context: { workspaceId, employeeId, ...context },
      approved: false,
    });
    return {
      content: [{ type: 'text', text: JSON.stringify(result) }],
    };
  },
);

await serveStdio(() => server);
