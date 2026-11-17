// v98.123 · a place and its parts are one piece: a walker standing in the piece is ordered against the parts by GRID depth, never by a layer number.
// For hero positions around 7 places (front yard, corner of the yard, sides, back, inside), no part that is behind the hero may be drawn over it and no part in front may be drawn under it.
// Run: node tools/e2e-piece-occlusion.cjs   (needs Playwright + Chromium; serves the repo itself)
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const ROOT = path.join(__dirname, '..'), T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };
const serve = () => new Promise(r => { const s = http.createServer((q, res) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end() } res.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res) }); s.listen(0, () => r(s)) });
const { chromium } = require('playwright');(async()=>{const server = await serve(), base = 'http://localhost:' + server.address().port + '/', b = await chromium.launch(), p = await b.newPage({viewport:{width:1600,height:1000}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(base + 'village-town.html');await p.waitForTimeout(16000);
const res=await p.evaluate(async()=>{
 const cap={on:false,items:[],order:[]};const ds=window.drawSorted;
 window.drawSorted=function(objects,...r){if(!cap.on)return ds.call(this,objects,...r);cap.items=[];cap.order=[];const arr=[...objects];const back=[];
  arr.forEach((it,i)=>{if(it&&typeof it.draw==='function'){const meta={i,hero:!!it.hero,building:!!(it.building||it.isBuilding),place:it.place||null,owner:it.owner?.id||null,y0:it.y,x:it.x,mobile:!!it.mobile,id:it.id||null,kind:it.kind||null};cap.items.push(meta);const f=it.draw;it.__f=f;it.draw=function(...a){cap.order.push(i);return f.apply(this,a)};back.push(it)}});
  try{return ds.call(this,arr,...r)}finally{for(const it of back){it.draw=it.__f;delete it.__f}}};
 const wait=ms=>new Promise(r=>setTimeout(r,ms));const out=[];
 const places=locations.filter(o=>!o.npc&&['market','inn','forge','shop','temple','healer','guild'].includes(o.id));
 for(const o of places){const c=center(o),e=estate(o);if(!e)continue;
  for(const [du,dv,tag] of [[0,e.front+2.5,'front-far'],[0,e.front-1.5,'front-yard'],[e.right+1.5,0,'right'],[e.left-1.5,0,'left'],[0,e.back-1.5,'back'],[e.right-1,e.front-1,'corner-yard'],[0,0,'inside']]){
   const q=canonical(o,c.u+du,c.v+dv);const u=o.facing==='SE'?c.u+(dv)*1+0:c.u+du; // we pick in canonical space then convert back below
   // canonical -> world: for facing SE canonical(u,v)={u:a.u+v-a.v,v:a.v+u-a.u}; its own inverse
   const w=canonical(o,c.u+du,c.v+dv);hero.u=w.u;hero.v=w.v;
   cap.on=true;await wait(120);cap.on=false;const H=cap.items.find(x=>x.hero);if(!H)continue;const pos={};cap.order.forEach((id,k)=>pos[id]=k);
   const viol=[];for(const it of cap.items){if(it.hero||pos[it.i]==null)continue;const mine=it.place===o.id||it.owner===o.id;if(!mine)continue;
    if(Math.abs((it.x??H.x)-H.x)>140)continue; // only things that can overlap on screen
    const hy=H.y0,iy=it.y0;const hBefore=pos[H.i]<pos[it.i];
    if(it.building){ /* body: box rule expected */ continue }
    if(iy<hy-6&&hBefore)viol.push(['sub-behind-drawn-after-hero',it.kind||it.id,Math.round(iy),Math.round(hy)]);
    if(iy>hy+6&&!hBefore)viol.push(['sub-front-drawn-before-hero',it.kind||it.id,Math.round(iy),Math.round(hy)])}
   out.push({place:o.id,tag,n:cap.items.filter(x=>x.place===o.id||x.owner===o.id).length,viol:viol.length,ex:viol.slice(0,2)})}}
 return out});
const bad=res.filter(r=>r.tag!=='front-far'&&r.viol>0);console.log('positions checked',res.length,'· violations (excluding front-far, which follows the box rule)',bad.reduce((a,r)=>a+r.viol,0));assert.ok(res.length>=30,'enough positions');assert.deepEqual(bad.map(r=>r.place+':'+r.tag+':'+JSON.stringify(r.ex)),[], 'parts drawn on the wrong side of the walker');assert.deepEqual(errs,[],errs.join('|'));await b.close();server.close();console.log('piece occlusion e2e: all cases passed')})().catch(e=>{console.error('FAIL',e.message);process.exit(1)})
