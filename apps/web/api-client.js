const API_BASE=window.ENJAZ_API_BASE||'';
export async function api(path,{token,method='GET',body}={}){const r=await fetch(`${API_BASE}${path}`,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});const data=await r.json().catch(()=>({}));if(!r.ok)throw new Error(data.error||`Request failed (${r.status})`);return data}
export const apiClient={
 health:()=>api('/api/v1'),
 employees:(workspaceId,token)=>api(`/api/v1/employees?workspaceId=${encodeURIComponent(workspaceId)}`,{token}),
 createEmployee:(workspaceId,token,body)=>api(`/api/v1/employees?workspaceId=${encodeURIComponent(workspaceId)}`,{token,method:'POST',body}),
 tasks:(workspaceId,token)=>api(`/api/v1/tasks?workspaceId=${encodeURIComponent(workspaceId)}`,{token}),
 createTask:(workspaceId,token,body)=>api(`/api/v1/tasks?workspaceId=${encodeURIComponent(workspaceId)}`,{token,method:'POST',body}),
 approvals:(workspaceId,token)=>api(`/api/v1/approvals?workspaceId=${encodeURIComponent(workspaceId)}`,{token}),
 workflows:(workspaceId,token)=>api(`/api/v1/workflows?workspaceId=${encodeURIComponent(workspaceId)}`,{token}),
 integrations:(workspaceId,token)=>api(`/api/v1/integrations?workspaceId=${encodeURIComponent(workspaceId)}`,{token}),
 audit:(workspaceId,token)=>api(`/api/v1/audit?workspaceId=${encodeURIComponent(workspaceId)}`,{token})
};