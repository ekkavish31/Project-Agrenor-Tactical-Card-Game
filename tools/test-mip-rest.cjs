const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('js/mip-loader.js','utf8');
function setup(x=0,reduced=false,fail=false){
 let now=0,id=0;const callbacks=new Map(),images=[];
 const style=()=>({removeProperty(k){delete this[k.replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]}});
 const classes=new Set(),go={offsetWidth:100,style:style()},flip={style:style()};
 const track={isConnected:true,clientWidth:600,dataset:{},matches:s=>s==='.mip-track',classList:{add:(...a)=>a.forEach(v=>classes.add(v)),remove:(...a)=>a.forEach(v=>classes.delete(v))},querySelector:s=>s==='.mip-go'?go:s==='.mip-flip'?flip:null};
 const ctx={Image:class{constructor(){images.push(this)}},setTimeout:()=>1,clearTimeout(){},requestAnimationFrame:f=>{callbacks.set(++id,f);return id},cancelAnimationFrame:i=>callbacks.delete(i),performance:{now:()=>now},getComputedStyle:()=>({transform:`matrix(1,0,0,1,${x},0)`}),matchMedia:()=>({matches:reduced})};vm.createContext(ctx);vm.runInContext(src,ctx);
 const frame=async(dt=16)=>{now+=dt;const a=[...callbacks];callbacks.clear();a.forEach(([,f])=>f(now));await Promise.resolve();await Promise.resolve()};
 const art=async()=>{images.forEach(im=>fail?im.onerror():im.onload());for(let i=0;i<20;i++)await Promise.resolve()};
 return {ctx,track,go,flip,classes,frame,art,callbacks};
}
const watchdog=setTimeout(()=>{console.error("test did not finish");process.exit(1)},3000);
(async()=>{
 for(const start of [0,499,220,250]){
  const e=setup(start);await e.art();let resolved=false;const p=e.ctx.MipLoader.still(e.track).then(v=>{resolved=v});assert.equal(e.go.style.transform,`translateX(${start}px)`,'completion must preserve CSS position exactly');
  await Promise.resolve();await e.frame();assert.equal(e.track.dataset.mipState,start===250?'sitting':'walking');assert(!resolved,'must not hide cover before walking/sitting completes');
  let last=start,sawSit=false;for(let i=0;i<400&&!resolved;i++){await e.frame();const n=parseFloat((e.go.style.transform||'translateX(250px)').slice(11));assert(Math.abs(n-last)<=6.3,'bounded movement: no warp');last=n;if(e.track.dataset.mipState==='sitting')sawSit=true;}
  await p;assert(sawSit);assert.equal(e.track.dataset.mipState,'seated');assert(e.classes.has('mip-still'));assert(!e.classes.has('mip-sitting'));assert.equal(e.go.style.transform,undefined,'centred CSS stays responsive after arriving');assert.equal(e.callbacks.size,0,'idle uses CSS, no RAF leak');
  await e.ctx.MipLoader.still(e.track,false);assert(!e.classes.has('mip-still'));assert.equal(e.track.dataset.mipState,undefined);
 }
 {
  const e=setup(0);await e.art();const p=e.ctx.MipLoader.still(e.track);await e.frame(50);e.track.clientWidth=800;for(let i=0;i<400&&e.track.dataset.mipState!=='seated';i++)await e.frame();assert.equal(await p,true,'resize walks to new centre');
 }
 {
  const e=setup(400);const p=e.ctx.MipLoader.still(e.track);await e.frame();await e.ctx.MipLoader.still(e.track,false);assert.equal(await p,false,'new loading cycle cancels previous completion');assert.equal(e.callbacks.size,0);
 }
 {
  const e=setup(100);await e.art();const p=e.ctx.MipLoader.still(e.track);e.track.isConnected=false;await e.frame();assert.equal(await p,false,'removed cover releases completion');
 }
 {
  const e=setup(250,true);await e.art();const p=e.ctx.MipLoader.still(e.track);await e.frame();await e.frame();assert.equal(await p,true,'reduced motion rests without frame animation');
 }
 {
  const e=setup(250,false,true);await e.art();const p=e.ctx.MipLoader.still(e.track);await e.frame();await e.frame();assert.equal(await p,false);assert(e.classes.has('mip-art-failed'),'failed optional art keeps original mascot visible');
 }
 const title=fs.readFileSync('js/title-screen.js','utf8'),gate=fs.readFileSync('js/img-gate.js','utf8');assert(title.includes('await root.MipLoader?.still(el,true)'));assert(gate.includes('root.StdLoader?.finish(veil)'));
 clearTimeout(watchdog);console.log('PASS Mip completion from both sides/centre, no warp, sit-before-hide, resize, reset, removal, reduced motion, image fallback and loader wiring');
})().catch(e=>{console.error(e);process.exitCode=1});
