import http from 'node:http';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
const root=path.resolve(fileURLToPath(new URL('../dist/',import.meta.url)));
const port=Number(process.env.PORT||4174);
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.mp4':'video/mp4','.gif':'image/gif','.png':'image/png','.svg':'image/svg+xml','.json':'application/json'};
http.createServer(async(req,res)=>{
 try{
  const url=new URL(req.url,`http://127.0.0.1:${port}`),relative=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname),file=path.resolve(root,`.${relative}`);
  if(!file.startsWith(root+path.sep)){res.writeHead(403);return res.end();}
  const content=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'text/plain','Cache-Control':'no-cache'});res.end(content);
 }catch{res.writeHead(404);res.end('Build the demo with npm run build first.');}
}).listen(port,'127.0.0.1',()=>console.log(`Browser-only demo: http://127.0.0.1:${port}`));
