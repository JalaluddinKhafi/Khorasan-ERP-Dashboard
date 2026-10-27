'use strict';
const http=require('node:http');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const port=Number(process.env.PORT || 8765);
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.json':'application/json; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.jpg':'image/jpeg','.woff2':'font/woff2','.ttf':'font/ttf','.ico':'image/x-icon'};
http.createServer((req,res)=>{
 let pathname;
 try{pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);}catch{res.writeHead(400).end();return;}
 if(pathname==='/'){res.writeHead(302,{Location:'/public-site/index.html'}).end();return;}
 if(!/^\/(?:assets|dashboard|public-site)\//.test(pathname)){res.writeHead(404).end('Not found');return;}
 const target=path.resolve(root,'.'+pathname);
 if(!target.startsWith(root+path.sep)){res.writeHead(403).end();return;}
 fs.readFile(target,(error,data)=>{
  if(error){res.writeHead(404).end('Not found');return;}
  res.writeHead(200,{'Content-Type':types[path.extname(target).toLowerCase()] || 'application/octet-stream','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(data);
 });
}).listen(port,'127.0.0.1',()=>console.log(`Khorasan frontend: http://127.0.0.1:${port}/public-site/index.html\nDashboard: http://127.0.0.1:${port}/dashboard/dashboard.html`));
