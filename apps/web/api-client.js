const env=typeof import.meta!=='undefined'&&import.meta.env?import.meta.env:{};
const API_BASE=window.ENJAZ_API_BASE||env.VITE_ENJAZ_API_BASE||'';
const SUPABASE_URL=window.ENJAZ_SUPABASE_URL||env.VITE_SUPABASE_URL||'https://cqmwwrrmmqmgpnhnuxyu.supabase.co';
const AUTH_BRIDGE=`${SUPABASE_URL.replace(/\/$/,'')}/functions/v1/enjaz-auth-bridge`;
const INDUSTRY_API=`${SUPABASE_URL.replace(/\/$/,'')}/functions/v1/enjaz-industry`;
const AI_API=`${SUPABASE_URL.replace(/\/$/,'')}/functions/v1/enjaz-ai`;
const REQUEST_TIMEOUT=15000;
async function request(url,options={}){const controller=new AbortController();const timer=setTimeout(()=>controller.abort(),REQUEST_TIMEOUT);try{return await fetch(url,{...options,signal:controller.signal})}catch(error){if(error?.name==='AbortError')throw new Error('انتهت مهلة الاتصال بالخدمة. حاول مرة أخرى.');throw error}finally{clearTimeout(timer)}}
export async function api(path,{token,method='GET',body}={}){const r=await request(`${API_BASE}${path}`,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body!==undefined?{body:JSON.stringify(body)}:{})});const data=await r.json().catch(()=>({}));if(!r.ok){const error=new Error(data.error||`Request failed (${r.status})`);if(data.code)error.code=data.code;if(r.headers.get('X-Request-Id'))error.requestId=r.headers.get('X-Request-Id');throw error;}return data}
async function authBridge(action,token,body={}){const r=await request(AUTH_BRIDGE,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({action,...body})});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||'تعذر تهيئة مساحة العمل.');return data}
async function industry(path,{token,method='GET',body}={}){const r=await request(`${INDUSTRY_API}${path}`,{method,headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},...(body!==undefined?{body:JSON.stringify(body)}:{})});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||`Request failed (${r.status})`);return data}
async function ai(action,token,body){const r=await request(AI_API,{method:'POST',headers:{'Content-Type':'application/json',Authorization:`Bearer ${token}`},body:JSON.stringify({action,...body})});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||`AI request failed (${r.status})`);return data}
const q=v=>encodeURIComponent(v||'');
export const apiClient={
 health:()=>api('/api/v1'),
 onboardingBootstrap:(token,body)=>authBridge('bootstrap',token,body),
 runtimeSummary:(workspaceId,token)=>api(`/api/v1/runtime/summary?workspaceId=${q(workspaceId)}`,{token}),
 runtimeOps:(workspaceId,token)=>api(`/api/v1/runtime/ops?workspaceId=${q(workspaceId)}`,{token}),
 tools:(workspaceId,token)=>api(`/api/v1/tools?workspaceId=${q(workspaceId)}`,{token}),
 industryPacks:(workspaceId,token)=>industry(`/industry-packs?workspaceId=${q(workspaceId)}`,{token}),
 provisionIndustryPack:(workspaceId,token,pack)=>industry(`/industry-packs/${q(pack)}/provision?workspaceId=${q(workspaceId)}`,{token,method:'POST',body:{}}),
 employees:(workspaceId,token)=>api(`/api/v1/employees?workspaceId=${q(workspaceId)}`,{token}),
 createEmployee:(workspaceId,token,body)=>api(`/api/v1/employees?workspaceId=${q(workspaceId)}`,{token,method:'POST',body}),
 getEmployee:(workspaceId,token,employeeId)=>api(`/api/v1/employees/${q(employeeId)}?workspaceId=${q(workspaceId)}`,{token}),
 updateEmployee:(workspaceId,token,employeeId,body)=>api(`/api/v1/employees/${q(employeeId)}?workspaceId=${q(workspaceId)}`,{token,method:'PATCH',body}),
 employeeStatus:(workspaceId,token,employeeId,action)=>api(`/api/v1/employees/${q(employeeId)}/${q(action)}?workspaceId=${q(workspaceId)}`,{token,method:'POST',body:{}}),
 employeeGoals:(workspaceId,token,employeeId)=>api(`/api/v1/employees/${q(employeeId)}/goals?workspaceId=${q(workspaceId)}`,{token}),
 createEmployeeGoal:(workspaceId,token,employeeId,body)=>api(`/api/v1/employees/${q(employeeId)}/goals?workspaceId=${q(workspaceId)}`,{token,method:'POST',body}),
 employeeKnowledge:(workspaceId,token,employeeId)=>api(`/api/v1/employees/${q(employeeId)}/knowledge?workspaceId=${q(workspaceId)}`,{token}),
 createEmployeeKnowledge:(workspaceId,token,employeeId,body)=>api(`/api/v1/employees/${q(employeeId)}/knowledge?workspaceId=${q(workspaceId)}`,{token,method:'POST',body}),
 tasks:(workspaceId,token)=>api(`/api/v1/tasks?workspaceId=${q(workspaceId)}`,{token}),
 createTask:(workspaceId,token,body)=>api(`/api/v1/tasks?workspaceId=${q(workspaceId)}`,{token,method:'POST',body}),
 getTask:(workspaceId,token,taskId)=>api(`/api/v1/tasks/${q(taskId)}?workspaceId=${q(workspaceId)}`,{token}),
 cancelTask:(workspaceId,token,taskId)=>api(`/api/v1/tasks/${q(taskId)}?workspaceId=${q(workspaceId)}`,{token,method:'DELETE'}),
 planTask:(workspaceId,token,taskId,body={})=>ai('plan',token,{workspaceId,taskId,...body}),
 runTask:async(workspaceId,token,taskId,body={})=>{const input={...(body||{})};if(!input.employeeId){const task=await apiClient.getTask(workspaceId,token,taskId);input.employeeId=task?.data?.employee_id||task?.employee_id;}if(!input.employeeId)throw new Error('المهمة غير مرتبطة بموظف رقمي.');return api(`/api/v1/tasks/${q(taskId)}/run?workspaceId=${q(workspaceId)}`,{token,method:'POST',body:input});},
 taskComments:(workspaceId,token,taskId)=>api(`/api/v1/tasks/${q(taskId)}/comments?workspaceId=${q(workspaceId)}`,{token}),
 createTaskComment:(workspaceId,token,taskId,body)=>api(`/api/v1/tasks/${q(taskId)}/comments?workspaceId=${q(workspaceId)}`,{token,method:'POST',body}),
 workflows:(workspaceId,token)=>api(`/api/v1/workflows?workspaceId=${q(workspaceId)}`,{token}),
 approvals:(workspaceId,token)=>api(`/api/v1/approvals?workspaceId=${q(workspaceId)}`,{token}),
 decideApproval:(workspaceId,token,approvalId,decision)=>api(`/api/v1/approvals/${q(approvalId)}/${q(decision)}?workspaceId=${q(workspaceId)}`,{token,method:'POST',body:{}}),
 integrations:(workspaceId,token)=>api(`/api/v1/integrations?workspaceId=${q(workspaceId)}`,{token}),
 createIntegration:(workspaceId,token,body)=>api(`/api/v1/integrations?workspaceId=${q(workspaceId)}`,{token,method:'POST',body}),
 revokeIntegration:(workspaceId,token,integrationId)=>api(`/api/v1/integrations/${q(integrationId)}?workspaceId=${q(workspaceId)}`,{token,method:'DELETE'}),
 audit:(workspaceId,token)=>api(`/api/v1/audit?workspaceId=${q(workspaceId)}`,{token}),
 billingPlans:(workspaceId,token)=>api('/api/v1/billing/plans',{token}),
 billingSubscription:(workspaceId,token)=>api(`/api/v1/billing/subscription?workspaceId=${q(workspaceId)}`,{token}),
 billingUsage:(workspaceId,token)=>api(`/api/v1/billing/usage?workspaceId=${q(workspaceId)}`,{token})
};
if(typeof window!=='undefined')window.apiClient=apiClient;
