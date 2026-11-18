import { test } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import net from 'node:net';
import { once } from 'node:events';
import { createState } from '../src/game.js';

async function freePort(){const s=net.createServer();s.listen(0,'127.0.0.1');await once(s,'listening');const port=s.address().port;await new Promise(r=>s.close(r));return port;}
test('API serves assets, rejects bad inputs, serializes actions, and persists across restarts', async()=>{
  const dir=await mkdtemp(path.join(os.tmpdir(),'nurture-test-')),port=await freePort();let child;
  async function start(){
    child=spawn(process.execPath,['src/server.js'],{env:{...process.env,PORT:String(port),NURTURE_DATA_DIR:dir},stdio:['ignore','pipe','pipe']});
    await new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(new Error('Startup timed out')),5000);child.stdout.once('data',()=>{clearTimeout(timer);resolve();});child.once('exit',code=>{clearTimeout(timer);reject(new Error(`Exited ${code}`));});});
  }
  async function stop(){if(child&&child.exitCode===null){const done=once(child,'exit');child.kill();await done;}}
  const base=`http://127.0.0.1:${port}`;
  try{
    const legacy=createState();legacy.version=1;delete legacy.habitat;legacy.care=9;
    const original=JSON.stringify(legacy);await writeFile(path.join(dir,'save.json'),original);
    await start();assert.equal(await readFile(path.join(dir,'save.json.v1-backup'),'utf8'),original);
    assert.equal((await fetch(base+'/')).status,200);assert.equal((await fetch(base+'/style.css')).status,200);
    assert.equal((await fetch(base+'/api/action',{method:'POST',headers:{'Content-Type':'application/json'},body:'{'})).status,400);
    assert.equal((await fetch(base+'/api/action',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://example.com'},body:'{}'})).status,403);
    assert.equal((await fetch(base+'/api/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'select',id:'unknown'})})).status,400);
    const results=await Promise.all(Array.from({length:5},()=>fetch(base+'/api/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'pet'})})));
    assert.ok(results.every(r=>r.status===200));
    const data=await(await fetch(base+'/api/state')).json();assert.equal(data.state.creatures[0].mood,'cracked');
    const saved=JSON.parse(await readFile(path.join(dir,'save.json'),'utf8'));assert.equal(saved.creatures[0].mood,'cracked');
    await stop();await start();const restored=await(await fetch(base+'/api/state')).json();assert.equal(restored.state.creatures[0].recoverAt,saved.creatures[0].recoverAt);
    assert.equal(restored.state.care,9);
    const placed=await(await fetch(base+'/api/action',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({type:'move-object',id:'plant',x:45,y:60})})).json();
    assert.equal(placed.state.habitat.objects.find(o=>o.id==='plant').x,45);
    assert.equal((await fetch(base+'/.git/config')).status,404);
  }finally{await stop();await rm(dir,{recursive:true,force:true});}
});
