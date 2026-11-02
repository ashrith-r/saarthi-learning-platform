import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {createServer} from 'node:net';
import mongoose from 'mongoose';
import {MongoMemoryServer} from 'mongodb-memory-server';

test('production authentication and saved work survive an application restart',{timeout:120000},async t=>{
 const db=await MongoMemoryServer.create();const uri=db.getUri();process.env.MONGO_URL=uri;process.env.JWT_SECRET='restart-test-secret';
 await mongoose.connect(uri);const {seedDemo}=await import('../../scripts/demo-data.js');await seedDemo();
 const {default:Chapter}=await import('../../models/chapter.js');const chapter=await Chapter.findOne();
 const portServer=createServer();await new Promise(r=>portServer.listen(0,'127.0.0.1',r));const port=portServer.address().port;await new Promise(r=>portServer.close(r));
 let child;async function start(){child=spawn(process.execPath,['server.js'],{cwd:process.cwd(),env:{...process.env,MONGO_URL:uri,PORT:String(port),NODE_ENV:'production',JWT_SECRET:'restart-test-secret',SESSION_SECRET:'restart-session-secret',TRUST_PROXY:'1'},stdio:['ignore','pipe','pipe']});await new Promise((resolve,reject)=>{let text='';const timer=setTimeout(()=>reject(new Error('Server startup timeout: '+text)),20000);child.stdout.on('data',chunk=>{text+=chunk;if(text.includes('Saarthi running')){clearTimeout(timer);resolve();}});child.on('exit',code=>{clearTimeout(timer);reject(new Error('Server exited '+code));});});}
 async function stop(){if(child&&child.exitCode===null){const exiting=new Promise(r=>child.once('exit',r));child.kill();await exiting;}}
 t.after(async()=>{await stop();await mongoose.disconnect();await db.stop();});
 await start();const base='http://127.0.0.1:'+port,origin='https://127.0.0.1:'+port;
 const login=await fetch(base+'/auth/login',{method:'POST',headers:{origin,'x-forwarded-proto':'https','content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({email:'learner@saarthi.demo',password:'SaarthiDemo!2026'}),redirect:'manual'});assert.equal(login.status,302);
 const cookies=login.headers.getSetCookie();assert.ok(cookies.some(c=>c.includes('Secure')));const cookie=cookies.map(c=>c.split(';')[0]).join('; ');
 const saved=await fetch(base+'/learn/'+chapter._id,{method:'POST',headers:{origin,cookie,'x-forwarded-proto':'https','content-type':'application/x-www-form-urlencoded'},body:new URLSearchParams({notes:'Survives production restart',bookmarked:'on'}),redirect:'manual'});assert.equal(saved.status,302);
 await stop();await start();
 const page=await fetch(base+'/learn/'+chapter._id,{headers:{cookie,'x-forwarded-proto':'https'},redirect:'manual'});assert.equal(page.status,200);assert.match(await page.text(),/Survives production restart/);
});
