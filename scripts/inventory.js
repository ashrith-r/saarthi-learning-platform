import {readdirSync,readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {join} from 'node:path';
const files=[];function walk(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){const p=join(dir,entry.name);if(entry.isDirectory())walk(p);else if(p.endsWith('.ejs'))files.push(p);}}walk('views');
const inventory=files.map(file=>{const s=readFileSync(file,'utf8');return {file,links:[...s.matchAll(/<a\b[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/g)].map(m=>({target:m[1],label:m[2].replace(/<[^>]*>/g,'').trim()})),forms:[...s.matchAll(/<form\b([^>]*)>/g)].map(m=>m[1]),controls:[...s.matchAll(/<(input|textarea|select|button)\b([^>]*)>/g)].map(m=>({type:m[1],attributes:m[2]}))};});
const routes=['adminRoutes','auth_routes','render_index','studyRoutes'].flatMap(file=>[...readFileSync('routes/'+file+'.js','utf8').matchAll(/(?:adminRoute|authRouter|Route|router)\.(get|post)\(['"]([^'"]+)['"]/g)].map(m=>({file,method:m[1].toUpperCase(),path:m[2]})));
mkdirSync('.local/verification',{recursive:true});writeFileSync('.local/verification/control-inventory.json',JSON.stringify({routes,templates:inventory},null,2));
console.log(JSON.stringify({routes:routes.length,templates:inventory.length,links:inventory.reduce((n,x)=>n+x.links.length,0),forms:inventory.reduce((n,x)=>n+x.forms.length,0),controls:inventory.reduce((n,x)=>n+x.controls.length,0)}));
