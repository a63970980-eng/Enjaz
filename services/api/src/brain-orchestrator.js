import { buildBrainContext, createDeterministicPlan, validatePlan } from './ai-brain.js';
import { recall, remember } from './ai-memory.js';
import { generatePlan } from './model-provider.js';
import { materializePlan } from './execution-graph.js';

export async function planEmployeeTask({employee,workspaceId,employeeId,taskId,goal,provider=process.env.ENJAZ_MODEL_PROVIDER||'deterministic'}){
 const memory=await recall({workspaceId,employeeId,limit:20});
 const context=buildBrainContext({employee,goal,memory});
 let plan=await generatePlan({provider,context});
 if(!plan?.steps?.length){if(provider!=='deterministic')throw new Error(`AI provider ${provider} returned an empty plan`);plan=createDeterministicPlan({employee,goal});}
 plan=validatePlan(plan,employee);
 const execution=await materializePlan({workspaceId,employeeId,taskId,plan});
 await remember({workspaceId,employeeId,taskId,type:'plan',content:JSON.stringify(plan),metadata:{provider,goal,graphId:execution.graphId}});
 return {plan,memoryUsed:memory.length,provider,execution};
}
