import { runEmployeeTask } from './agent-runtime.js';
import { remember } from './ai-memory.js';

export async function executePlan({workspaceId,taskId,employeeId,plan}){
 const results=[];const completed=new Set();
 for(const step of plan.steps){for(const dep of step.depends_on||[])if(!completed.has(dep))throw new Error(`Plan dependency not completed: ${dep}`);const result=await runEmployeeTask({workspaceId,taskId,employeeId,action:step.action,input:step.input});results.push({stepId:step.id,result});if(result.status==='awaiting_approval')return {status:'awaiting_approval',results,pendingStep:step.id,approval:result.approval};completed.add(step.id);}
 await remember({workspaceId,employeeId,taskId,type:'execution',content:JSON.stringify(results),metadata:{steps:plan.steps.length}});return {status:'completed',results};
}
