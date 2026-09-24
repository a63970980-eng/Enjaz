import { randomUUID } from 'node:crypto';
import { query } from './db.js';

const MAX_INTERVAL_MINUTES=31_536_000;
const ALLOWED_STATUS=new Set(['active','paused','archived']);

function normalizeAction(action){return String(action||'data.analyze').trim()||'data.analyze';}
function normalizeInput(input){return input&&typeof input==='object'&&!Array.isArray(input)?input:{};}

export function validateRoutine({employeeId,name,objective,action='data.analyze',input={},intervalMinutes=1440,nextRunAt=null}){
  if(!employeeId) throw new Error('employeeId is required');
  if(!String(name||'').trim()||String(name).length>160) throw new Error('Routine name is required and must be 160 characters or fewer');
  if(!String(objective||'').trim()||String(objective).length>4000) throw new Error('Routine objective is required and must be 4000 characters or fewer');
  const interval=Number(intervalMinutes);
  if(!Number.isInteger(interval)||interval<1||interval>MAX_INTERVAL_MINUTES) throw new Error('intervalMinutes must be an integer between 1 and 31536000');
  if(nextRunAt&&Number.isNaN(new Date(nextRunAt).getTime())) throw new Error('Invalid nextRunAt');
  return {employeeId,name:String(name).trim(),objective:String(objective).trim(),action:normalizeAction(action),input:normalizeInput(input),intervalMinutes:interval,nextRunAt:nextRunAt?new Date(nextRunAt).toISOString():null};
}

export async function listEmployeeRoutines(workspaceId,employeeId=null){
  const args=[workspaceId]; let where='s.workspace_id=$1';
  if(employeeId){args.push(employeeId);where+=' and s.employee_id=$2';}
  return (await query(`select s.*,e.name as employee_name,e.role as employee_role
    from employee_schedules s
    join ai_employees e on e.id=s.employee_id and e.workspace_id=s.workspace_id
    where ${where}
    order by s.enabled desc, s.next_run_at asc nulls last, s.created_at desc`,args)).rows;
}

export async function createEmployeeRoutine({workspaceId,employeeId,name,objective,action='data.analyze',input={},intervalMinutes=1440,nextRunAt=null,timezone='UTC',enabled=true}){
  const employee=(await query("select id,status from ai_employees where id=$1 and workspace_id=$2",[employeeId,workspaceId])).rows[0];
  if(!employee||!ALLOWED_STATUS.has(employee.status)||employee.status!=='active') throw new Error('Active employee does not belong to this workspace');
  const routine=validateRoutine({employeeId,name,objective,action,input,intervalMinutes,nextRunAt});
  const schedule={title:routine.name,objective:routine.objective,action:routine.action,input:routine.input,intervalMinutes:routine.intervalMinutes,routine:true};
  const next=routine.nextRunAt||new Date(Date.now()+routine.intervalMinutes*60_000).toISOString();
  return (await query(`insert into employee_schedules(id,workspace_id,employee_id,timezone,schedule,enabled,next_run_at)
    values($1,$2,$3,$4,$5::jsonb,$6,$7) returning *`,
    [randomUUID(),workspaceId,employeeId,String(timezone||'UTC'),JSON.stringify(schedule),Boolean(enabled),next])).rows[0];
}

export async function updateEmployeeRoutine({workspaceId,routineId,patch={}}){
  const current=(await query('select * from employee_schedules where id=$1 and workspace_id=$2',[routineId,workspaceId])).rows[0];
  if(!current) throw new Error('Routine not found');
  const schedule={...(current.schedule||{})};
  for(const key of ['title','objective','action']) if(patch[key]!==undefined) schedule[key]=String(patch[key]);
  if(patch.input!==undefined) schedule.input=normalizeInput(patch.input);
  if(patch.intervalMinutes!==undefined){const interval=Number(patch.intervalMinutes);if(!Number.isInteger(interval)||interval<1||interval>MAX_INTERVAL_MINUTES)throw new Error('Invalid intervalMinutes');schedule.intervalMinutes=interval;}
  const enabled=patch.enabled===undefined?current.enabled:Boolean(patch.enabled);
  const nextRunAt=patch.nextRunAt===undefined?current.next_run_at:new Date(patch.nextRunAt).toISOString();
  return (await query(`update employee_schedules set timezone=coalesce($3,timezone),schedule=$4::jsonb,enabled=$5,next_run_at=$6,updated_at=now()
    where id=$1 and workspace_id=$2 returning *`,
    [routineId,workspaceId,patch.timezone||null,JSON.stringify(schedule),enabled,nextRunAt])).rows[0];
}

export async function deleteEmployeeRoutine({workspaceId,routineId}){
  const r=await query('delete from employee_schedules where id=$1 and workspace_id=$2 returning id',[routineId,workspaceId]);
  if(!r.rowCount) throw new Error('Routine not found');
  return r.rows[0];
}
