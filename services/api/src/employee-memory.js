import { randomUUID } from 'node:crypto';
import { query } from './db.js';

const MAX_CONTENT=12000;
export async function remember({workspaceId,employeeId,type='fact',key,content,importance=3,sourceTaskId=null,expiresAt=null}){
 if(!workspaceId||!employeeId||!key||!content) throw new Error('Memory requires workspace, employee, key and content');
 if(String(content).length>MAX_CONTENT) throw new Error('Memory content exceeds limit');
 if(!['fact','preference','decision','summary','instruction'].includes(type)) throw new Error('Invalid memory type');
 const result=await query(`insert into ai_employee_memory(id,workspace_id,employee_id,memory_type,key,content,importance,source_task_id,expires_at,updated_at) values($1,$2,$3,$4,$5,$6,$7,$8,$9,now()) on conflict(employee_id,key) do update set memory_type=excluded.memory_type,content=excluded.content,importance=excluded.importance,source_task_id=excluded.source_task_id,expires_at=excluded.expires_at,updated_at=now() returning *`,[randomUUID(),workspaceId,employeeId,type,key,String(content),importance,sourceTaskId,expiresAt]);
 return result.rows[0];
}
export async function recall({workspaceId,employeeId,limit=12}){
 const safeLimit=Math.min(Math.max(Number(limit)||12,1),50);
 const result=await query(`select id,memory_type,key,content,importance,source_task_id,expires_at,updated_at from ai_employee_memory where workspace_id=$1 and employee_id=$2 and (expires_at is null or expires_at>now()) order by importance desc,updated_at desc limit $3`,[workspaceId,employeeId,safeLimit]);
 return result.rows;
}
export async function forget({workspaceId,employeeId,key}){
 await query('delete from ai_employee_memory where workspace_id=$1 and employee_id=$2 and key=$3',[workspaceId,employeeId,key]);
}
