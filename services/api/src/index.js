import http from 'node:http';
import { createClient } from '@supabase/supabase-js';
import { createEmployee, listEmployees, createTask, listTasks, createApproval, decideApproval, listApprovals, listAudit, getWorkspaceAccess } from './workforce-repository.js';
import { runEmployeeTask, executeApprovedTask } from './agent-runtime.js';
import { listTools } from './tool-registry.js';
import { saveConnection, listConnections } from './credentials-vault.js';
import { getHealth } from './health.js';
import { getOpsSnapshot } from './ops-runtime.js';
import { rateLimit } from './rate-limit.js';
import { requestContext } from './request-context.js';
import { closeDb, db } from './db.js';
import './integrations/index.js';
const port=process.env.PORT||4000;
const supabase=(process.env.SUPABASE_URL&&process.env.SUPABASE_ANON_KEY)?createClient(process.env.SUPABASE_URL,process.env.SUPABASE_ANON_KEY,{auth:{persistSession:false}}):null;
const allowedOrigins=new Set((process.env.CORS_ORIGINS||'').split(',').map(v=>v.trim()).filter(Boolean));
const limiter=rateLimit({windowMs:60_000,max:Number(process.env.RATE_LIMIT_PER_MINUTE||120)});
const json=(res,code,data,origin='',requestId='')=>{const cors=origin&&allowedOrigins.has(origin)?origin:'null';res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':cors,'Vary':'Origin','Access-Control-Allow-Methods':'GET,POST,DELETE,OPTIONS','Access-Control-Allow-Headers':'Authorization,Content-Type,X-Request-Id','X-Request-Id':requestId,'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer'});res.end(JSON.stringify(data));};
const body=req=>new Promise((resolve,reject)=>{let raw='';req.on('data',c=>{raw+=c;if(raw.length>1_000_000){reject(Object.assign(new Error('Request body too large'),{status:413}));req.destroy();}});req.on('end',()=>{try{resolve(raw?JSON.parse(raw):{})}catch{reject(Object.assign(new Error('Invalid JSON body'),{status:400}))}});});
async function authUser(req){if(!supabase)return null;const h=req.headers.authorization||'';if(!h.startsWith('Bearer '))return null;const {data,error}=await supabase.auth.getUser(h.slice(7));if(error||!data.user)return null;const {data:profile,error:e}=await supabase.from('users').select('id,organization_id').eq('auth_user_id',data.user.id).maybeSingle();if(e||!profile)return null;return {authId:data.user.id,id:profile.id,organizationId:profile.organization_id};}
async function requireWorkspace(req,workspaceId){const user=await authUser(req);if(!user)throw Object.assign(new Error('Authentication required'),{status:401});if(!workspaceId)throw Object.assign(new Error('workspaceId is required'),{status:400});const access=await getWorkspaceAccess(workspaceId,user.id);if(!access)throw Object.assign(new Error('Workspace access denied'),{status:403});return {...user,role:access.role};}
function requireManager(user){if(!['owner','admin','manager'].includes(user.role))throw Object.assign(new Error('Manager permission required'),{status:403});}
async function listWorkflows(workspaceId){const {rows}=await db.query(`select g.id,g.task_id,g.employee_id,g.goal,g.status,g.created_at,g.updated_at,count(s.id)::int as step_count,count(s.id) filter (where s.status='succeeded')::int as succeeded_steps from execution_graphs g left join execution_steps s on s.graph_id=g.id where g.workspace_id=$1 group by g.id order by g.created_at desc limit 100`,[workspaceId]);return rows;}
const server=http.createServer(async(req,res)=>{const context=requestContext(req);const origin=req.headers.origin||'';if(req.method==='OPTIONS')return json(res,204,{},origin,context.id);const ip=req.socket.remoteAddress||'unknown';const rl=limiter(ip);if(!rl.allowed){res.setHeader('Retry-After',Math.ceil((rl.resetAt-Date.now())/1000));return json(res,429,{error:'Rate limit exceeded',requestId:context.id},origin,context.id);}const url=new URL(req.url,`http://${req.headers.host}`);try{
if(req.method==='GET'&&url.pathname==='/health'){const h=await getHealth();return json(res,h.status==='unhealthy'?503:200,h,origin,context.id);}
if(req.method==='GET'&&url.pathname==='/ops/health'){const user=await authUser(req);if(!user)throw Object.assign(new Error('Authentication required'),{status:401});const workspaceId=url.searchParams.get('workspaceId');if(!workspaceId)throw Object.assign(new Error('workspaceId is required'),{status:400});const access=await getWorkspaceAccess(workspaceId,user.id);if(!access)throw Object.assign(new Error('Workspace access denied'),{status:403});requireManager({...user,role:access.role});return json(res,200,await getOpsSnapshot({workspaceId}),origin,context.id);}
if(req.method==='GET'&&url.pathname==='/api/v1')return json(res,200,{name:'ENJAZ API',version:'0.7.0',storage:'postgresql',auth:'supabase',runtime:'enabled',integrations:'enabled',status:'ready'},origin,context.id);
const workspaceId=url.searchParams.get('workspaceId');const user=await requireWorkspace(req,workspaceId);
if(req.method==='GET'&&url.pathname==='/api/v1/tools')return json(res,200,{data:listTools()},origin,context.id);
if(req.method==='GET'&&url.pathname==='/api/v1/employees')return json(res,200,{data:await listEmployees(workspaceId)},origin,context.id);
if(req.method==='POST'&&url.pathname==='/api/v1/employees'){requireManager(user);return json(res,201,{data:await createEmployee({...await body(req),workspaceId})},origin,context.id);}
if(req.method==='GET'&&url.pathname==='/api/v1/tasks')return json(res,200,{data:await listTasks(workspaceId)},origin,context.id);
if(req.method==='POST'&&url.pathname==='/api/v1/tasks')return json(res,201,{data:await createTask({...await body(req),workspaceId})},origin,context.id);
if(req.method==='POST'&&url.pathname.match(/^\/api\/v1\/tasks\/[^/]+\/run$/)){requireManager(user);const id=url.pathname.split('/')[4];const input=await body(req);return json(res,200,{data:await runEmployeeTask({workspaceId,taskId:id,employeeId:input.employeeId,action:input.action||'data.analyze',input:input.input||{}})},origin,context.id);}
if(req.method==='GET'&&url.pathname==='/api/v1/workflows')return json(res,200,{data:await listWorkflows(workspaceId)},origin,context.id);
if(req.method==='GET'&&url.pathname==='/api/v1/approvals')return json(res,200,{data:await listApprovals(workspaceId)},origin,context.id);
if(req.method==='POST'&&url.pathname==='/api/v1/approvals'){requireManager(user);return json(res,201,{data:await createApproval({...await body(req),workspaceId})},origin,context.id);}
const match=url.pathname.match(/^\/api\/v1\/approvals\/([^/]+)\/(approve|reject)$/);if(req.method==='POST'&&match){requireManager(user);const approvalId=match[1];const status=match[2]==='approve'?'approved':'rejected';const approval=await decideApproval(approvalId,workspaceId,status,user.id);if(status==='approved')return json(res,200,{data:await executeApprovedTask({workspaceId,approvalId,actorUserId:user.id})},origin,context.id);return json(res,200,{data:approval},origin,context.id);}
if(req.method==='GET'&&url.pathname==='/api/v1/integrations')return json(res,200,{data:await listConnections(workspaceId)},origin,context.id);
if(req.method==='POST'&&url.pathname==='/api/v1/integrations'){requireManager(user);const input=await body(req);return json(res,201,{data:await saveConnection({...input,workspaceId})},origin,context.id);}
if(req.method==='GET'&&url.pathname==='/api/v1/audit')return json(res,200,{data:await listAudit(workspaceId)},origin,context.id);
return json(res,404,{error:'Not Found',requestId:context.id},origin,context.id);
}catch(e){return json(res,e.status||400,{error:e.message,requestId:context.id},origin,context.id);}});
server.requestTimeout=30_000;server.headersTimeout=15_000;server.keepAliveTimeout=5_000;server.maxRequestsPerSocket=1000;
let shuttingDown=false;
async function shutdown(signal){if(shuttingDown)return;shuttingDown=true;console.log(`ENJAZ API shutting down (${signal})`);server.close(async()=>{try{await closeDb();process.exit(0);}catch(error){console.error('Database shutdown failed',error);process.exit(1);}});setTimeout(()=>process.exit(1),10_000).unref();}
process.once('SIGTERM',()=>void shutdown('SIGTERM'));process.once('SIGINT',()=>void shutdown('SIGINT'));
server.listen(port,()=>console.log(`ENJAZ API listening on ${port}`));
