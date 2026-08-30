import { enqueueJob } from './job-queue.js';

export async function enqueueWorkflowRun({workspaceId,workflowId,source='system',triggerId=null,payload={}}){return enqueueJob({workspaceId,jobType:'workflow.run',payload:{workspaceId,workflowId,source,triggerId,...payload}});}
