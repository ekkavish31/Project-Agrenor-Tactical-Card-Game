const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const src=fs.readFileSync('js/field-host.js','utf8');const code=src.match(/function marketStallView\([\s\S]*?\n\}/)[0]+'\n'+src.match(/function prop\(ctx,[\s\S]*?\n\}/)[0];
const images=new Map(),calls=[];let missingRear=false;
const ctx={ROT:0,propSpec:k=>['village-town/decor/market-stall-'+(k==='stallR'?'red':'blue'),104,'w'],propImg:f=>{if(missingRear&&f.endsWith('-ne'))return null;if(!images.has(f))images.set(f,{file:f,base:f.endsWith('-ne')?.8:.98});return images.get(f)},propBox:()=>({w:104,h:114}),project:()=>({x:20,y:30}),propCode:()=>{throw Error('unexpected placeholder')}};
vm.createContext(ctx);vm.runInContext(code,ctx);
const painter={save(){},restore(){},translate(){},transform(){throw Error('rigid stall must not sway')},scale(x,y){calls.push(['flip',x,y])},drawImage(im,...args){calls.push(['draw',im.file,...args])}};
for(const kind of ['stallR','stallB'])for(const seed of [.0015,.002]){
 const base=ctx.marketStallView(kind,seed,0);assert(!base.rear);assert.equal(base.flip,seed*1000%2<1);
 const seen=new Set();for(let r=0;r<4;r++){
  ctx.ROT=r;const view=ctx.marketStallView(kind,seed);seen.add(view.file+view.flip);
  // The stall facing vector rotates with the same transform as rotUV.
  let [u,v]=base.flip?[1,0]:[0,1];for(let i=0;i<r;i++)[u,v]=[-v,u];
  assert.equal(view.rear,u<0||v<0);assert.equal(view.flip,u!==0);
  calls.length=0;ctx.prop(painter,kind,0,0,seed,500,false);const draw=calls.find(x=>x[0]==='draw');assert.equal(draw[1],view.file);assert.equal(calls.some(x=>x[0]==='flip'),view.flip);assert.equal(draw[3],-114*.98,'front datum remains stable even if back alpha differs');assert.equal(draw[4],104);assert.equal(draw[5],114);
 }assert.equal(seen.size,4);assert.deepEqual(ctx.marketStallView(kind,seed,4),base);
}
assert.equal(ctx.marketStallView('crates',.5),null);
ctx.ROT=2;missingRear=true;calls.length=0;ctx.prop(painter,'stallR',0,0,.0015,0,false);assert(!calls.find(x=>x[0]==='draw')[1].endsWith('-ne'),'slow rear falls back to existing front');
const M=JSON.parse(fs.readFileSync('data/asset-manifest.json')),warm=JSON.parse(fs.readFileSync('data/warm-battle.json'));
for(const color of ['red','blue']){const f=`assets/village-town/decor/market-stall-${color}-ne.webp`;assert(fs.existsSync(f));assert(M.assets.some(a=>a.file===f));assert(warm.goat.includes(f));}
console.log('PASS red/blue × two seeded facings × four rotations; mirror, stable base/size, rigid art, fallback, manifest/preload');
