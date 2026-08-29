import http from 'node:http';
import { createClient } from '@supabase/supabase-js';
import { createEmployee, listEmployees, createTask, listTasks, createApproval, decideApproval, listApprovals, listAudit } from './workforce-repository.js';

const port=process.env.PORT||4000;
const supabase=(process.env.SUPABASE_URL&&process.env.SUPABASE_ANON_KEY)?createClient(process.env.SUPABASE_URL,process.env.SUPABASE_ANON_KEY,{auth:{persistSession:false}}):null;
const json=(res,code,data)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Authorization,Content-Type'});res.end(JSON.stringify(data));};
const body=req=>new Promise((resolve,reject)=>{let raw='';req.on('data',c=>raw+=c);req.on('end',()=>{try{resolve(raw?JSON.parse(raw):{})}catch{reject(new Error('Invalid JSON body'))}})});
async function authUser(req){
 if(!supabase) return null;
 const header=req.headers.authorization||'';
 if(!header.startsWith('Bearer ')) return null;
 const {data,error}=await supabase.auth.getUser(header.slice(7));
 if(error||!data.user) return null;
 const {data:profile,error:profileError}=await supabase.from('users').select('id,organization_id').eq('auth_user_id',data.user.id).maybeSingle();
 if(profileError||!profile) return null;
 return {authId:data.user.id,id:profile.id,organizationId:profile.organization_id};
}
const server=http.createServer(async(req,res)=>{
 if(req.method==='OPTIONS') return json(res,204,{});
 const url=new URL(req.url,`http://${req.headers.host}`);
 try{
  if(req.method==='GET'&&url.pathname==='/health') return json(res,200,{status:'ok',service:'enjaz-api',version:'0.5.0',storage:'postgresql',auth:'supabase'});
  if(req.method==='GET'&&url.pathname==='/api/v1') return json(res,200,{name:'ENJAZ API',version:'0.5.0',storage:'postgresql',auth:'supabase',status:'ready'});
  const user=await authUser(req);
  if(!user) return json(res,401,{error:'Authentication required'});
  const workspaceId=url.searchParams.get('workspaceId');
  if(!workspaceId) return json(res,400,{error:'workspaceId is required'});
  if(req.method==='GET'&&url.pathname==='/api/v1/employees') return json(res,200,{data:await listEmployees(workspaceId)});
  if(req.method==='POST'&&url.pathname==='/api/v1/employees') return json(res,201,{data:await createEmployee({...await body(req),workspaceId})});
  if(req.method==='GET'&&url.pathname==='/api/v1/tasks') return json(res,200,{data:await listTasks(workspaceId)});
  if(req.method==='POST'&&url.pathname==='/api/v1/tasks') return json(res,201,{data:await createTask({...await body(req),workspaceId})});
  if(req.method==='GET'&&url.pathname==='/api/v1/approvals') return json(res,200,{data:await listApprovals(workspaceId)});
  if(req.method==='POST'&&url.pathname==='/api/v1/approvals') return json(res,201,{data:await createApproval({...await body(req),workspaceId})});
  const match=url.pathname.match(/^\/api\/v1\/approvals\/([^/]+)\/(approve|reject)$/);
  if(req.method==='POST'&&match) return json(res,200,{data:await decideApproval(match[1],workspaceId,match[2]==='approve'?'approved':'rejected',user.id)});
  if(req.method==='GET'&&url.pathname==='/api/v1/audit') return json(res,200,{data:await listAudit(workspaceId)});
  return json(res,404,{error:'Not Found'});
 }catch(e){return json(res,400,{error:e.message});}
});
server.listen(port,()=>console.log(`ENJAZ API listening on ${port}`));
