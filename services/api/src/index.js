import http from 'node:http';
import { createEmployee, listEmployees, createTask, listTasks, listAudit } from './workforce.js';
const port = process.env.PORT || 4000;
const json = (res, code, data) => { res.writeHead(code, {'Content-Type':'application/json; charset=utf-8','Access-Control-Allow-Origin':'*'}); res.end(JSON.stringify(data)); };
const body = req => new Promise((resolve,reject)=>{ let raw=''; req.on('data',c=>raw+=c); req.on('end',()=>{try{resolve(raw?JSON.parse(raw):{})}catch(e){reject(e)}}); });
const server = http.createServer(async (req,res)=>{
  if(req.method==='OPTIONS'){res.writeHead(204,{'Access-Control-Allow-Origin':'*','Access-Control-Allow-Methods':'GET,POST,OPTIONS','Access-Control-Allow-Headers':'Content-Type'});return res.end();}
  const url = new URL(req.url, `http://${req.headers.host}`);
  if(req.method==='GET' && url.pathname==='/health') return json(res,200,{status:'ok',service:'enjaz-api',version:'0.2.0'});
  const workspaceId = url.searchParams.get('workspaceId') || 'demo-workspace';
  try {
    if(req.method==='GET' && url.pathname==='/api/v1/employees') return json(res,200,{data:listEmployees(workspaceId)});
    if(req.method==='POST' && url.pathname==='/api/v1/employees') return json(res,201,{data:createEmployee({...await body(req),workspaceId})});
    if(req.method==='GET' && url.pathname==='/api/v1/tasks') return json(res,200,{data:listTasks(workspaceId)});
    if(req.method==='POST' && url.pathname==='/api/v1/tasks') return json(res,201,{data:createTask({...await body(req),workspaceId})});
    if(req.method==='GET' && url.pathname==='/api/v1/audit') return json(res,200,{data:listAudit(workspaceId)});
    if(req.method==='GET' && url.pathname==='/api/v1') return json(res,200,{name:'ENJAZ API',status:'ready',version:'0.2.0'});
    json(res,404,{error:'Not Found'});
  } catch (error) { json(res,400,{error:error.message}); }
});
server.listen(port,()=>console.log(`ENJAZ API listening on ${port}`));
