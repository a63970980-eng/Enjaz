import { randomUUID } from 'node:crypto';
import { enqueueJob } from './job-queue.js';
import { validatePlan, nextRunnableSteps } from './employee-planner.js';

export async function materializePlan({workspaceId,employeeId,taskId,plan}){
 validatePlan(plan);
 const graphId=randomUUID();
 const jobs=[];
 for(const step of plan.steps){
  jobs.push(await enqueueJob({workspaceId,jobType:'employee.step',payload:{graphId,taskId,employeeId,step},availableAt:null,maxAttempts:3}));
 }
 return {graphId,taskId,employeeId,jobs};
}

export function getReadySteps(plan,completedIds){return nextRunnableSteps(plan,new Set(completedIds));}
