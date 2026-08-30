import { randomUUID } from 'node:crypto';
import { query } from './db.js';
import { callMcpTool } from './mcp-adapter.js';
import { authorizeTool } from './secure-integrations.js';
import { resolveCredentialForIntegration } from './credential-guard.js';

export async function executeSecureIntegration({workspaceId,taskId,employee,employeeId,connectionId,toolName,input={},requiredScope}){
 const connection=await authorizeTool({workspaceId,connectionId,employee,requiredScope});
 const credential=await resolveCredentialForIntegration({workspaceId,connectionId,employeeId});
 const action=toolName||`integration.${connection.provider}.request`;
 const started=Date.now();
 try{
  const result=await callMcpTool({name:action,config:{baseUrl:connection.metadata?.baseUrl,credential},input});
  await query('insert into audit_events (id,workspace_id,task_id,employee_id,event_type,actor_type,action,metadata) values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)',[randomUUID(),workspaceId,taskId,employeeId,'integration.executed','ai_employee',action,JSON.stringify({connectionId,durationMs:Date.now()-started,scope:requiredScope||null})]);
  return result;
 }catch(error){
  await query('insert into audit_events (id,workspace_id,task_id,employee_id,event_type,actor_type,action,metadata) values ($1,$2,$3,$4,$5,$6,$7,$8::jsonb)',[randomUUID(),workspaceId,taskId,employeeId,'integration.failed','ai_employee',action,JSON.stringify({connectionId,durationMs:Date.now()-started,error:error.message})]);
  throw error;
 }
}
