import http from 'node:http';
import { createClient } from '@supabase/supabase-js';
import { createEmployee, listEmployees, createTask, listTasks, createApproval, decideApproval, listApprovals, listAudit, getWorkspaceAccess } from './workforce-repository.js';
import { runEmployeeTask } from './agent-runtime.js';
import { getHealth } from './health.js';
import { getOpsSnapshot } from './ops-runtime.js';
import './integrations/index.js';
const port=process.env.PORT||4000;
const supabase=(process.env.SUPABASE_URL&&process.env.SUPABASE_ANON_KEY)?createClient(process.env.SUPABASE_URL,process.env.SUPABASE_ANON_KEY,{auth:{persistSession:false}}):null;
const json=(res,code,data)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Authorization,Content-Type'});res.end(JSON.stringify(data));};
const body=req=>new Promise((resolve,reject)=>{let raw='';req.on('data',c=>{raw+=c;if(raw.length>1_000_000)reject(new Error('Request body too large'))});req.on('end',()=>{try{resolve(raw?JSON.parse(raw):{})}catch{reject(new Error('Invalid JSON body'))})});
async function authUser(req){if(!supabase)return null;const h=req.headers.authorization||'';if(!h.startsWith('Bearer '))return null;const {data,error}=await supabase.auth.getUser(h.slice(7));if(error||!data.user)return null;const {data:profile,error:e}=await supabase.from('users').select('id,organization_id').eq('auth_user_id',data.user.id).maybeSingle();if(e||!profile)return null;return {authId:data.user.id,id:profile.id,organizationId:profile.organization_id};}
async function requireWorkspace(req,workspaceId){const user=await authUser(req);if(!user)throw Object.assign(new Error('Authentication required'),{status:401});if(!workspaceId)throw Object.assign(new Error('workspaceId is required'),{status:400});const access=await getWorkspaceAccess(workspaceId,user.id);if(!access)throw Object.assign(new Error('Workspace access denied'),{status:403});return {...user,role:access.role};}
function requireManager(user){if(!['owner','admin','manager'].includes(user.role))throw Object.assign(new Error('Manager permission required'),{status:403});}
const server=http.createServer(async(req,res)=>{if(req.method==='OPTIONS')return json(res,204,{});const url=new URL(req.url,`http://${req.headers.host}`);try{
if(req.method==='GET'&&url.pathname==='/health'){const h=await getHealth();return json(res,h.status==='unhealthy'?503:200,h);}
if(req.method==='GET'&&url.pathname==='/ops/health')return json(res,200,await getOpsSnapshot());
if(req.method==='GET'&&url.pathname==='/api/v1')return json(res,200,{name:'ENJAZ API',version:'0.7.0',storage:'postgresql',auth:'supabase',runtime:'enabled',integrations:'enabled',status:'ready'});
const workspaceId=url.searchParams.get('workspaceId');const user=await requireWorkspace(req,workspaceId);
if(req.method==='GET'&&url.pathname==='/api/v1/employees')return json(res,200,{data:await listEmployees(workspaceId)});
if(req.method==='POST'&&url.pathname==='/api/v1/employees'){requireManager(user);return json(res,201,{data:await createEmployee({...await body(req),workspaceId})});}
if(req.method==='GET'&&url.pathname==='/api/v1/tasks')return json(res,200,{data:await listTasks(workspaceId)});
if(req.method==='POST'&&url.pathname==='/api/v1/tasks')return json(res,201,{data:await createTask({...await body(req),workspaceId})});
if(req.method==='POST'&&url.pathname.match(/^\/api\/v1\/tasks\/[^/]+\/run$/)){requireManager(user);const id=url.pathname.split('/')[4];const input=await body(req);return json(res,200,{data:await runEmployeeTask({workspaceId,taskId:id,employeeId:input.employeeId,action:input.action||'data.analyze',input:input.input||{}})});}
if(req.method==='GET'&&url.pathname==='/api/v1/approvals')return json(res,200,{data:await listApprovals(workspaceId)});
if(req.method==='POST'&&url.pathname==='/api/v1/approvals'){requireManager(user);return json(res,201,{data:await createApproval({...await body(req),workspaceId})});}
const match=url.pathname.match(/^\/api\/v1\/approvals\/([^/]+)\/(approve|reject)$/);if(req.method==='POST'&&match){requireManager(user);return json(res,200,{data:await decideApproval(match[1],workspaceId,match[2]==='approve'?'approved':'rejected',user.id)});}
if(req.method==='GET'&&url.pathname==='/api/v1/audit')return json(res,200,{data:await listAudit(workspaceId)});
return json(res,404,{error:'Not Found'});
}catch(e){return json(res,e.status||400,{error:e.message});}});
server.listen(port,()=>console.log(`ENJAZ API listening on ${port}`));
