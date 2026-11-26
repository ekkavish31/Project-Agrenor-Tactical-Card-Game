const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const source=fs.readFileSync('js/game-cursor.js','utf8');
function setup(reduced=false){
 const events={},raf=new Map(),images=[];let rid=0;
 const classes=()=>{const s=new Set();return {add:(...a)=>a.forEach(x=>s.add(x)),remove:(...a)=>a.forEach(x=>s.delete(x)),contains:x=>s.has(x),toggle:(x,v)=>{v??=!s.has(x);v?s.add(x):s.delete(x);return v},[Symbol.iterator]:()=>s.values()}};
 const node=()=>({nodeType:1,tagName:'CANVAS',dataset:{},style:{},classList:classes(),setAttribute(){},hasAttribute:()=>false,closest:()=>null,appendChild(n){n.parentNode=this},parentElement:null});
 const html=node(),body=node(),head=node(),add=(k,f)=>(events[k]??=[]).push(f);
 const document={documentElement:html,body,head,createElement:()=>node(),querySelectorAll:()=>[],addEventListener:add};
 const ctx={document,location:{search:''},localStorage:{getItem:()=>null,setItem(){}},matchMedia:q=>({matches:q.includes('pointer:fine')||reduced}),Image:class{constructor(){images.push(this)}},addEventListener:add,getComputedStyle:()=>({cursor:'default'}),requestAnimationFrame:f=>{raf.set(++rid,f);return rid},cancelAnimationFrame:i=>raf.delete(i),performance:{now:()=>0},innerWidth:1000,innerHeight:800};
 vm.runInNewContext(source,ctx);
 const fire=(name,target)=>{for(const f of events[name]||[])f({target,clientX:200,clientY:200,pointerType:'mouse',button:0})};
 const tick=t=>{const pending=[...raf];raf.clear();pending.forEach(([,f])=>f(t))};
 const target=node();target.dataset.agc='door';return {ctx,html,images,target,fire,tick};
}
{
 const e=setup();e.fire('pointermove',e.target);e.tick(0);
 assert.equal(e.ctx.GameCursor.kind(),'door');assert.equal(e.ctx.GameCursor.debug().seq,null,'image loading keeps OS fallback');
 e.images.find(x=>x.src.endsWith('/door-atlas.webp')).onload();
 assert(e.ctx.GameCursor.debug().seq.loop);assert(e.html.classList.contains('agc-hide'),'one animated cursor, OS hidden');
 e.tick(700);const seq=e.ctx.GameCursor.debug().seq;assert.equal(seq.frames[7],6);assert(seq.frames.includes(7),'fully open pose');
 e.target.dataset.agc='walk';e.fire('pointermove',e.target);e.tick(800);assert.equal(e.ctx.GameCursor.kind(),'walk');assert.equal(e.ctx.GameCursor.debug().seq,null);assert(!e.html.classList.contains('agc-hide'));
 e.target.dataset.agc='door';e.fire('pointermove',e.target);e.tick(900);assert(e.ctx.GameCursor.debug().seq);e.fire('blur',e.target);assert.equal(e.ctx.GameCursor.debug().seq,null);
 e.fire('pointermove',e.target);assert(e.ctx.GameCursor.debug().seq,'return restarts door');e.ctx.GameCursor.enable(false);assert.equal(e.ctx.GameCursor.kind(),'');assert.equal(e.ctx.GameCursor.debug().seq,null);
}
{
 const e=setup(true);e.images.find(x=>x.src.endsWith('/door-atlas.webp')).onload();e.fire('pointermove',e.target);e.tick(0);assert.equal(e.ctx.GameCursor.kind(),'door');assert.equal(e.ctx.GameCursor.debug().seq,null,'reduced motion uses static door');assert(e.html.classList.contains('agc-os-door'));
}
for(const file of ['assets/cursor/door-atlas.webp','assets/cursor/os-door.png','assets/cursor/os-door@2x.png'])assert(fs.existsSync(file));
console.log('PASS door animation/fallback, delayed art, hover transition, blur/re-entry, disable and reduced motion');
