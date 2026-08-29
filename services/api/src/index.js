import http from 'node:http';
import { createEmployee, listEmployees, createTask, listTasks, createApproval, decideApproval, listApprovals, listAudit } from './workforce.js';
const port=process.env.PORT||4000;
const json=(res,code,data)=>{res.writeHead(code,{'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'});res.end(JSON.stringify(data));};
const body=req=>new Promise((resolve,reject)=>{let raw='';req.on('data',c=>raw+=c);req.on('end',()=>{try{resolve(raw?JSON.parse(raw):{})}catch{reject(new Error('Invalid JSON body'))}})});
const workspace=url=>url.searchParams.get('workspaceId')||'demo-workspace';
const server=http.createServer(async(req,res)=>{
 if(req.method==='OPTIONS') return json(res,204,{});
 const url=new URL(req.url,`http://${req.headers.host}`),ws=workspace(url);
 try {
  if(req.method==='GET'&&url.pathname==='/health') return json(res,200,{status:'ok',service:'enjaz-api',version:'0.3.0'});
  if(req.method==='GET'&&url.pathname==='/api/v1') return json(res,200,{name:'ENJAZ API',version:'0.3.0',status:'ready'});
  if(req.method==='GET'&&url.pathname==='/api/v1/employees') return json(res,200,{data:listEmployees(ws)});
  if(req.method==='POST'&&url.pathname==='/api/v1/employees') return json(res,201,{data:createEmployee({...await body(req),workspaceId:ws})});
  if(req.method==='GET'&&url.pathname==='/api/v1/tasks') return json(res,200,{data:listTasks(ws)});
  if(req.method==='POST'&&url.pathname==='/api/v1/tasks') return json(res,201,{data:createTask({...await body(req),workspaceId:ws})});
  if(req.method==='GET'&&url.pathname==='/api/v1/approvals') return json(res,200,{data:listApprovals(ws)});
  if(req.method==='POST'&&url.pathname==='/api/v1/approvals') return json(res,201,{data:createApproval({...await body(req),workspaceId:ws})});
  const match=url.pathname.match(/^\/api\/v1\/approvals\/([^/]+)\/(approve|reject)$/);
  if(req.method==='POST'&&match) return json(res,200,{data:decideApproval(match[1],ws,match[2]==='approve'?'approved':'rejected')});
  if(req.method==='GET'&&url.pathname==='/api/v1/audit') return json(res,200,{data:listAudit(ws)});
  return json(res,404,{error:'Not Found'});
 } catch(e){return json(res,400,{error:e.message});}
});
server.listen(port,()=>console.log(`ENJAZ API listening on ${port}`));
