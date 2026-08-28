const tools = new Map();
export function registerTool(definition, handler){ if(!definition?.name) throw new Error('Tool name is required'); tools.set(definition.name,{definition,handler}); }
export function getTool(name){ return tools.get(name); }
export function listTools(){ return [...tools.values()].map(x=>x.definition); }
export async function invokeTool(name,input,context){
  const entry=getTool(name); if(!entry) throw new Error(`Unknown tool: ${name}`);
  if(!context?.permissions?.includes(name)) throw new Error(`Permission denied: ${name}`);
  if(entry.definition.requiresApproval && context.approvalStatus!=='approved') return {status:'awaiting_approval',tool:name};
  return {status:'completed',tool:name,result:await entry.handler(input,context)};
}
registerTool({name:'crm.search',description:'Search customer records',risk:'low',requiresApproval:false}, async input=>({query:input?.query??'',records:[]}));
registerTool({name:'crm.create_lead',description:'Create a CRM lead',risk:'medium',requiresApproval:false}, async input=>({created:true,lead:input}));
registerTool({name:'finance.payment',description:'Initiate a payment',risk:'critical',requiresApproval:true}, async input=>({submitted:true,amount:input?.amount}));
