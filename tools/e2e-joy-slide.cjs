// v98.112 · joystick wall sliding: pushing into an edge at any angle glides along it (before: only u-only / v-only moves, so most slanted edges held the hero still).
// Compares the new slideMove() with the old rule on ~230 real wall cases of the village; the hero must never end up inside a blocked cell.
// Run: node tools/e2e-joy-slide.cjs   (needs Playwright + Chromium; serves the repo itself)
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };
const serve = () => new Promise(r => { const s = http.createServer((q, res) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end() } res.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res) }); s.listen(0, () => r(s)) });
(async () => {const server = await serve(), base = 'http://localhost:' + server.address().port + '/', b = await chromium.launch(), p = await b.newPage({viewport:{width:1300,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(base+'village-town.html');await p.waitForTimeout(18000);
const r=await p.evaluate(()=>{
 window.TouchControls=window.TouchControls||{};let cur={x:0,y:0};TouchControls.moving=()=>true;TouchControls.vec=()=>cur;
 const old=(du,dv,sp)=>{const nu=hero.u+du*sp,nv=hero.v+dv*sp;if(!blockedFree(nu,nv)){hero.u=nu;hero.v=nv}else if(!blockedFree(nu,hero.v)){hero.u=nu}else if(!blockedFree(hero.u,nv)){hero.v=nv}};
 const cases=[];const u0=hero.u,v0=hero.v;
 for(let u=u0-14;u<u0+14&&cases.length<400;u+=.5)for(let v=v0-14;v<v0+14;v+=.5){if(blockedFree(u,v))continue;for(let k=0;k<16;k++){const a=k*Math.PI/8,du=Math.cos(a),dv=Math.sin(a);if(blockedFree(u+du*.6,v+dv*.6)&&!blockedFree(u+du*.3,v+dv*.3)===false){cases.push({u,v,du,dv});break}}}
 const run=(c,fn)=>{hero.u=c.u;hero.v=c.v;let bad=0,dist=0;for(let i=0;i<40;i++){const pu=hero.u,pv=hero.v;fn(c.du,c.dv,.12);if(blockedFree(hero.u,hero.v))bad++;dist+=Math.hypot(hero.u-pu,hero.v-pv)}return {dist,bad}};
 let oldTot=0,newTot=0,better=0,worse=0,badN=0,n=0;for(const c of cases.slice(0,300)){const o=run(c,old),nw=run(c,(du,dv,sp)=>slideMove(du,dv,sp));n++;oldTot+=o.dist;newTot+=nw.dist;badN+=nw.bad;if(nw.dist>o.dist+.2)better++;else if(nw.dist<o.dist-.2)worse++}
 hero.u=u0;hero.v=v0;return {n,oldAvg:oldTot/n,newAvg:newTot/n,better,worse,badN}});console.log('walls',r.n,'avg distance old',r.oldAvg.toFixed(2),'new',r.newAvg.toFixed(2),'better',r.better,'worse',r.worse);assert.ok(r.n>50,'enough wall cases');assert.equal(r.badN,0,'never inside a blocked cell');assert.ok(r.newAvg>=r.oldAvg,'slides at least as far overall');assert.ok(r.better>r.worse*3,'clearly more cases improved than worsened');assert.deepEqual(errs,[],errs.join('|'));await b.close();server.close();console.log('joystick slide e2e: all cases passed')})().catch(e=>{console.error('FAIL',e.message);process.exit(1)})
