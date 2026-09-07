const env=typeof import.meta!=='undefined'&&import.meta.env?import.meta.env:{};
const API_BASE=window.ENJAZ_API_BASE||env.VITE_ENJAZ_API_BASE||'';
const SUPABASE_URL=window.ENJAZ_SUPABASE_URL||env.VITE_ENJAZ_SUPABASE_URL||'https://cqmwwrrmmqmgpnhnuxyu.supabase.co';
const SUPABASE_ANON_KEY=window.ENJAZ_SUPABASE_ANON_KEY||env.VITE_ENJAZ_SUPABASE_ANON_KEY||'';
const INDUSTRY_API_BASE=window.ENJAZ_INDUSTRY_API_BASE||env.VITE_ENJAZ_INDUSTRY_API_BASE||`${SUPABASE_URL}/functions/v1/enjaz-industry`;
export async function api(path,{token,method='GET',body}={}){const r=await fetch(`${API_BASE}${path}`,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});const data=await r.json().catch(()=>({}));if(!r.ok){const error=new Error(data.error||`Request failed (${r.status})`);if(data.code)error.code=data.code;if(r.headers.get('X-Request-Id'))error.requestId=r.headers.get('X-Request-Id');throw error;}return data}
async function supabaseCatalog(){if(!SUPABASE_ANON_KEY)return null;const url=`${SUPABASE_URL}/rest/v1/employee_role_templates?select=*&order=sector,name`;const r=await fetch(url,{headers:{apikey:SUPABASE_ANON_KEY,Authorization:`Bearer ${SUPABASE_ANON_KEY}`}});if(!r.ok)throw new Error(`Catalog request failed (${r.status})`);const rows=await r.json();return{data:{templates:rows}}}
export const apiClient={
 health:()=>api('/api/v1'),
 runtimeSummary:(workspaceId,token)=>api(`/api/v1/runtime/summary?workspaceId=${encodeURIComponent(workspaceId)}`,{token}),
 runtimeOps:(workspaceId,token)=>api(`/api/v1/runtime/ops?workspaceId=${encodeURIComponent(workspaceId)}`,{token}),
 tools:(workspaceId,token)=>api(`/api/v1/tools?workspaceId=${encodeURIComponent(workspaceId)}`,{token}),
 industryPacks:async(workspaceId,token)=>{if(API_BASE)return api(`/api/v1/industry-packs?workspaceId=${encodeURIComponent(workspaceId)}`,{token});return supabaseCatalog()},
 provisionIndustryPack:async(workspaceId,token,pack)=>api(`/api/v1/industry-packs/${encodeURIComponent(pack)}/provision?workspaceId=${encodeURIComponent(workspaceId)}`,{token,method:'POST',body:{}}),
 employees:(workspaceId,token)=>api(`/api/v1/employees?workspaceId=${encodeURIComponent(workspaceId)}`,{token}),
 createEmployee:(workspaceId,token,body)=>api(`/api/v1/employees?workspaceId=${encodeURIComponent(workspaceId)}`,{token,method:'POST',body}),
 getEmployee:(workspaceId,token,employeeId)=>api(`/api/v1/employees/${encodeURIComponent(employeeId)}?workspaceId=${encodeURIComponent(workspaceId)}`,{token}),
 updateEmployee:(workspaceId,token,employeeId,body)=>api(`/api/v1/employees/${encodeURIComponent(employeeId)}?workspaceId=${encodeURIComponent(workspaceId)}`,{token,method:'PATCH',body}),
 employeeStatus:(workspaceId,token,employeeId,action)=>api(`/api/v1/employees/${encodeURIComponent(employeeId)}/${action}?workspaceId=${encodeURIComponent(workspaceId)}`,{token,method:'POST',body:{}}),
 departments:(workspaceId,token)=>api(`/api/v1/departments?workspaceId=${encodeURIComponent(workspaceId)}`,{token}),
 createDepartment:(workspaceId,token,body)=>api(`/api/v1/departments?workspaceId=${encodeURIComponent(workspaceId)}`,{token,method:'POST',body}),
 employeeGoals:(workspaceId,token,employeeId)=>api(`/api/v1/employees/${encodeURIComponent(employeeId)}/goals?workspaceId=${encodeURIComponent(workspaceId)}`,{token}),
 createEmployeeGoal:(workspaceId,token,employeeId,body)=>api(`/api/v1/employees/${encodeURIComponent(employeeId)}/goals?workspaceId=${encodeURIComponent(workspaceId)}`,{token,method:'POST',body}),
 employeeKnowledge:(workspaceId,token,employeeId)=>api(`/api/v1/employees/${encodeURIComponent(employeeId)}/knowledge?workspaceId=${encodeURIComponent(workspaceId)}`,{token}),
 createEmployeeKnowledge:(workspaceId,token,employeeId,body)=>api(`/api/v1/employees/${encodeURIComponent(employeeId)}/knowledge?workspaceId=${encodeURIComponent(workspaceId)}`,{token,method:'POST',body}),
 tasks:(workspaceId,token)=>api(`/api/v1/tasks?workspaceId=${encodeURIComponent(workspaceId)}`,{token}),
 createTask:(workspaceId,token,body)=>api(`/api/v1/tasks?workspaceId=${encodeURIComponent(workspaceId)}`,{token,method:'POST',body}),
 getTask:(workspaceId,token,taskId)=>api(`/api/v1/tasks/${encodeURIComponent(taskId)}?workspaceId=${encodeURIComponent(workspaceId)}`,{token}),
 cancelTask:(workspaceId,token,taskId)=>api(`/api/v1/tasks/${encodeURIComponent(taskId)}?workspaceId=${encodeURIComponent(workspaceId)}`,{token,method:'DELETE'}),
 taskComments:(workspaceId,token,taskId)=>api(`/api/v1/tasks/${encodeURIComponent(taskId)}/comments?workspaceId=${encodeURIComponent(workspaceId)}`,{token}),
 createTaskComment:(workspaceId,token,taskId,body)=>api(`/api/v1/tasks/${encodeURIComponent(taskId)}/comments?workspaceId=${encodeURIComponent(workspaceId)}`,{token,method:'POST',body}),
 handoffs:(workspaceId,token,taskId='')=>api(`/api/v1/handoffs?workspaceId=${encodeURIComponent(workspaceId)}${taskId?`&taskId=${encodeURIComponent(taskId)}`:''}`,{token}),
 createHandoff:(workspaceId,token,body)=>api(`/api/v1/handoffs?workspaceId=${encodeURIComponent(workspaceId)}`,{token,method:'POST',body}),
 planTask:(workspaceId,token,taskId,body={})=>api(`/api/v1/tasks/${encodeURIComponent(taskId)}/plan?workspaceId=${encodeURIComponent(workspaceId)}`,{token,method:'POST',body}),
 runTask:(workspaceId,token,taskId,body)=>api(`/api/v1/tasks/${encodeURIComponent(taskId)}/run?workspaceId=${encodeURIComponent(workspaceId)}`,{token,method:'POST',body}),
 approvals:(workspaceId,token)=>api(`/api/v1/approvals?workspaceId=${encodeURIComponent(workspaceId)}`,{token}),
 decideApproval:(workspaceId,token,approvalId,decision)=>api(`/api/v1/approvals/${encodeURIComponent(approvalId)}/${decision}?workspaceId=${encodeURIComponent(workspaceId)}`,{token,method:'POST',body:{}}),
 workflows:(workspaceId,token)=>api(`/api/v1/workflows?workspaceId=${encodeURIComponent(workspaceId)}`,{token}),
 integrations:(workspaceId,token)=>api(`/api/v1/integrations?workspaceId=${encodeURIComponent(workspaceId)}`,{token}),
 createIntegration:(workspaceId,token,body)=>api(`/api/v1/integrations?workspaceId=${encodeURIComponent(workspaceId)}`,{token,method:'POST',body}),
 revokeIntegration:(workspaceId,token,connectionId)=>api(`/api/v1/integrations/${encodeURIComponent(connectionId)}/revoke?workspaceId=${encodeURIComponent(workspaceId)}`,{token,method:'DELETE'}),
 audit:(workspaceId,token)=>api(`/api/v1/audit?workspaceId=${encodeURIComponent(workspaceId)}`,{token}),
 billingPlans:(workspaceId,token)=>api('/api/v1/billing/plans',{token}),
 billingSubscription:(workspaceId,token)=>api(`/api/v1/billing/subscription?workspaceId=${encodeURIComponent(workspaceId)}`,{token}),
 billingUsage:(workspaceId,token)=>api(`/api/v1/billing/usage?workspaceId=${encodeURIComponent(workspaceId)}`,{token})
};
if(typeof window!=='undefined')window.apiClient=apiClient;
