const http = require('node:http');
const port = process.env.PORT || 4000;
const server = http.createServer((req,res)=>{
  res.setHeader('Content-Type','application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin','*');
  if(req.method==='OPTIONS'){res.writeHead(204);return res.end();}
  if(req.url==='/health') return res.end(JSON.stringify({status:'ok',service:'enjaz-api',version:'0.1.0'}));
  if(req.url==='/api/v1') return res.end(JSON.stringify({name:'ENJAZ API',status:'ready',domains:['organizations','workspaces','employees','tasks','workflows','approvals','audit']}));
  res.writeHead(404);res.end(JSON.stringify({error:'Not Found'}));
});
server.listen(port,()=>console.log(`ENJAZ API listening on ${port}`));
