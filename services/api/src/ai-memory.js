import { randomUUID } from 'node:crypto';
import { query } from './db.js';

export async function remember({workspaceId,employeeId,taskId,type='task',content,metadata={}}){if(!content)throw new Error('Memory content is required');return (await query('insert into ai_employee_memory (id,workspace_id,employee_id,task_id,memory_type,content,metadata) values ($1,$2,$3,$4,$5,$6,$7::jsonb) returning *',[randomUUID(),workspaceId,employeeId,taskId,type,content,JSON.stringify(metadata)])).rows[0];}
export async function recall({workspaceId,employeeId,limit=20}){return (await query('select id,memory_type,content,metadata,created_at from ai_employee_memory where workspace_id=$1 and employee_id=$2 order by created_at desc limit $3',[workspaceId,employeeId,Math.min(Math.max(limit,1),100)])).rows;}
