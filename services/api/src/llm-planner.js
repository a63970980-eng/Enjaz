const DEFAULT_MODEL='gpt-4.1-mini';

export function buildAgentPrompt({employee,task}){
  return `You are an AI employee inside ENJAZ.\nRole: ${employee.role}\nGoal: ${employee.goal||'Complete the assigned task safely.'}\nSkills: ${JSON.stringify(employee.skills||[])}\nAllowed tools: ${JSON.stringify(employee.tools||[])}\nTask: ${task.title}\nObjective: ${task.objective}\nReturn a concise execution plan and identify any action that requires human approval.`;
}

export async function planWithLLM({employee,task}){
  if(!process.env.OPENAI_API_KEY) return {provider:'stub',model:DEFAULT_MODEL,plan:[{step:'analyze_task'},{step:'select_allowed_tools'},{step:'execute_or_request_approval'}],requiresApproval:false};
  const response=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${process.env.OPENAI_API_KEY}`},body:JSON.stringify({model:process.env.OPENAI_MODEL||DEFAULT_MODEL,input:buildAgentPrompt({employee,task}),temperature:0.2})});
  if(!response.ok) throw new Error(`LLM request failed: ${response.status}`);
  const data=await response.json();
  return {provider:'openai',model:process.env.OPENAI_MODEL||DEFAULT_MODEL,output:data.output_text||''};
}
