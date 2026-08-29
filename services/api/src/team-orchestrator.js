import { randomUUID } from 'node:crypto';
import { query } from './db.js';
import { runEmployeeTask } from './agent-runtime.js';

export async function runTeam({workspaceId,name,objective,employees=[]}) {
  if(!objective||!Array.isArray(employees)||employees.length<2) throw new Error('AI Team requires an objective and at least two employees');
  const ids=employees.map(e=>e.employeeId);
  const available=(await query("select id from ai_employees where workspace_id=$1 and id=any($2::uuid[]) and status='active'",[workspaceId,ids])).rows.map(r=>r.id);
  if(available.length!==ids.length) throw new Error('One or more AI employees are unavailable or inactive');
  const teamId=randomUUID(),results=[];
  for(const employee of employees){
    const task=(await query(`insert into tasks (id,workspace_id,employee_id,title,objective,input) values ($1,$2,$3,$4,$5,$6::jsonb) returning *`,[randomUUID(),workspaceId,employee.employeeId,`${name||'AI Team'} — ${employee.role||'worker'}`,objective,JSON.stringify({teamId,team:name||'AI Team'})])).rows[0];
    const result=await runEmployeeTask({workspaceId,taskId:task.id,employeeId:employee.employeeId,action:employee.action||'data.analyze',input:employee.input||{objective,teamId}});
    results.push({employeeId:employee.employeeId,taskId:task.id,result});
    if(result.status==='awaiting_approval') return {teamId,status:'awaiting_approval',results};
  }
  return {teamId,status:'completed',objective,results};
}
