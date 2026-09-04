const API_BASE=window.ENJAZ_API_BASE||'';
const localKey=workspaceId=>`ENJAZ_LOCAL_EMPLOYEES:${workspaceId||'preview'}`;
const localEmployees=workspaceId=>{try{return JSON.parse(localStorage.getItem(localKey(workspaceId)||'[]'))}catch{return[]}};
const saveLocalEmployees=(workspaceId,data)=>localStorage.setItem(localKey(workspaceId),JSON.stringify(data));
export async function api(path,{token,method='GET',body}={}){const r=await fetch(`${API_BASE}${path}`,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});const data=await r.json().catch(()=>({}));if(!r.ok){const error=new Error(data.error||`Request failed (${r.status})`);if(r.headers.get('X-Request-Id'))error.requestId=r.headers.get('X-Request-Id');throw error;}return data}
export const apiClient={
 health:()=>api('/api/v1'),
 runtimeSummary:(workspaceId,token)=>api(`/api/v1/runtime/summary?workspaceId=${encodeURIComponent(workspaceId)}`,{token}),
 runtimeOps:(workspaceId,token)=>api(`/api/v1/runtime/ops?workspaceId=${encodeURIComponent(workspaceId)}`,{token}),
 tools:(workspaceId,token)=>api(`/api/v1/tools?workspaceId=${encodeURIComponent(workspaceId)}`,{token}),
 industryPacks:(workspaceId,token)=>api(`/api/v1/industry-packs?workspaceId=${encodeURIComponent(workspaceId)}`,{token}),
 provisionIndustryPack:(workspaceId,token,pack)=>api(`/api/v1/industry-packs/${encodeURIComponent(pack)}/provision?workspaceId=${encodeURIComponent(workspaceId)}`,{token,method:'POST',body:{}}),
 employees:async(workspaceId,token)=>API_BASE?api(`/api/v1/employees?workspaceId=${encodeURIComponent(workspaceId)}`,{token}):{data:localEmployees(workspaceId)},
 createEmployee:async(workspaceId,token,body)=>{if(API_BASE)return api(`/api/v1/employees?workspaceId=${encodeURIComponent(workspaceId)}`,{token,method:'POST',body});const employee={id:`local-${Date.now()}-${Math.random().toString(36).slice(2,8)}`,name:body.name,role:body.role,goal:body.goal,model:body.model||'auto',autonomy:body.autonomy||'balanced',skills:Array.isArray(body.skills)?body.skills:[],tools:Array.isArray(body.tools)?body.tools:[],budgetCents:body.budgetCents||0,schedule:body.schedule||{type:'always'},policy:body.policy||{approvalMode:'required'},status:'active',created_at:new Date().toISOString()};const data=localEmployees(workspaceId);data.unshift(employee);saveLocalEmployees(workspaceId,data);return{data:employee};},
 departments:(workspaceId,token)=>api(`/api/v1/departments?workspaceId=${encodeURIComponent(workspaceId)}`,{token}),
 createDepartment:(workspaceId,token,body)=>api(`/api/v1/departments?workspaceId=${encodeURIComponent(workspaceId)}`,{token,method:'POST',body}),
 employeeGoals:(workspaceId,token,employeeId)=>api(`/api/v1/employees/${encodeURIComponent(employeeId)}/goals?workspaceId=${encodeURIComponent(workspaceId)}`,{token}),
 createEmployeeGoal:(workspaceId,token,employeeId,body)=>api(`/api/v1/employees/${encodeURIComponent(employeeId)}/goals?workspaceId=${encodeURIComponent(workspaceId)}`,{token,method:'POST',body}),
 employeeKnowledge:(workspaceId,token,employeeId)=>api(`/api/v1/employees/${encodeURIComponent(employeeId)}/knowledge?workspaceId=${encodeURIComponent(workspaceId)}`,{token}),
 createEmployeeKnowledge:(workspaceId,token,employeeId,body)=>api(`/api/v1/employees/${encodeURIComponent(employeeId)}/knowledge?workspaceId=${encodeURIComponent(workspaceId)}`,{token,method:'POST',body}),
 tasks:(workspaceId,token)=>api(`/api/v1/tasks?workspaceId=${encodeURIComponent(workspaceId)}`,{token}),
 createTask:(workspaceId,token,body)=>api(`/api/v1/tasks?workspaceId=${encodeURIComponent(workspaceId)}`,{token,method:'POST',body}),
 getTask:(workspaceId,token,taskId)=>api(`/api/v1/tasks/${encodeURIComponent(taskId)}?workspaceId=${encodeURIComponent(workspaceId)}`,{token}),
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
 billingPlans:(workspaceId,token)=>api(`/api/v1/billing/plans?workspaceId=${encodeURIComponent(workspaceId)}`,{token}),
 billingSubscription:(workspaceId,token)=>api(`/api/v1/billing/subscription?workspaceId=${encodeURIComponent(workspaceId)}`,{token}),
 billingUsage:(workspaceId,token)=>api(`/api/v1/billing/usage?workspaceId=${encodeURIComponent(workspaceId)}`,{token})
};
if(typeof window!=='undefined')window.apiClient=apiClient;