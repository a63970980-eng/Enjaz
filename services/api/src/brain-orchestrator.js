import { buildBrainContext, createDeterministicPlan, validatePlan } from './ai-brain.js';
import { recall, remember } from './ai-memory.js';
import { generatePlan } from './model-provider.js';

export async function planEmployeeTask({employee,workspaceId,employeeId,taskId,goal,provider='deterministic'}){
 const memory=await recall({workspaceId,employeeId,limit:20});
 const context=buildBrainContext({employee,goal,memory});
 let plan=await generatePlan({provider,context});
 if(!plan?.steps?.length)plan=createDeterministicPlan({employee,goal});
 plan=validatePlan(plan,employee);
 await remember({workspaceId,employeeId,taskId,type:'plan',content:JSON.stringify(plan),metadata:{provider,goal}});
 return {plan,memoryUsed:memory.length};
}
