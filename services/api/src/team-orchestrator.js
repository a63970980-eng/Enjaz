import { randomUUID } from 'node:crypto';
import { query } from './db.js';
import { runEmployeeTask } from './agent-runtime.js';

export async function runTeam({workspaceId, name, objective, employees=[]}) {
  if (!objective || !Array.isArray(employees) || employees.length === 0) throw new Error('Team requires an objective and employees');
  const results=[];
  for (const employee of employees) {
    const task=(await query(`insert into tasks (id,workspace_id,employee_id,title,objective,input) values ($1,$2,$3,$4,$5,$6::jsonb) returning *`,[randomUUID(),workspaceId,employee.employeeId,`${name||'AI Team'} — ${employee.role||'worker'}`,objective,JSON.stringify({team:name||'AI Team'})])).rows[0];
    const result=await runEmployeeTask({workspaceId,taskId:task.id,employeeId:employee.employeeId,action:employee.action||'data.analyze',input:employee.input||{objective}});
    results.push({employeeId:employee.employeeId,taskId:task.id,result});
    if(result.status==='awaiting_approval') return {status:'awaiting_approval',results};
  }
  return {status:'completed',objective,results};
}
