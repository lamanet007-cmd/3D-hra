const http=require('http'),fs=require('fs'),path=require('path'),{WebSocketServer}=require('ws');
const srv=http.createServer((q,s)=>{fs.readFile(path.join(__dirname,'index.html'),(e,d)=>{if(e){s.writeHead(500);return s.end('Chyba')}s.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});s.end(d)})});
const wss=new WebSocketServer({server:srv}),rooms={};let nid=1;
const bc=(ws,d,to)=>{const m=JSON.stringify(d);for(const o of rooms[ws.room]||[])if(o!==ws&&o.readyState===1&&(!to||o.id===to))o.send(m)};
wss.on('connection',ws=>{ws.id=nid++;ws.alive=true;ws.on('pong',()=>ws.alive=true);
ws.on('message',m=>{let d;try{d=JSON.parse(m)}catch{return}
if(d.t==='join'){if(ws.room)return;ws.room=String(d.room||'main').slice(0,16);ws.name=String(d.name||'Hráč').slice(0,14);const r=rooms[ws.room]=rooms[ws.room]||new Set();
if(r.size>=8){ws.close();return}
ws.send(JSON.stringify({t:'welcome',id:ws.id}));for(const o of r)ws.send(JSON.stringify({t:'join',id:o.id,name:o.name}));r.add(ws);bc(ws,{t:'join',id:ws.id,name:ws.name});return}
if(!ws.room)return;d.id=ws.id;
if(d.t==='st'||d.t==='kill')bc(ws,d);
else if(d.t==='hit'){d.dmg=Math.min(25,Math.max(0,+d.dmg||0));bc(ws,d,Number(d.to))}});
ws.on('close',()=>{const r=rooms[ws.room];if(!r)return;r.delete(ws);bc(ws,{t:'leave',id:ws.id});if(!r.size)delete rooms[ws.room]})});
setInterval(()=>wss.clients.forEach(w=>{if(!w.alive)return w.terminate();w.alive=false;w.ping()}),30000);
srv.listen(process.env.PORT||3000,()=>console.log('Server běží'));
