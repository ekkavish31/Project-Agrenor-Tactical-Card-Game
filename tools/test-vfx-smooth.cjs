const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
function setup({rm=false,low=false,loaded=true}={}){
 const draws=[],surfaces=[];
 function context(){const stack=[];return new Proxy({globalAlpha:1,globalCompositeOperation:'source-over',save(){stack.push([this.globalAlpha,this.globalCompositeOperation])},restore(){[this.globalAlpha,this.globalCompositeOperation]=stack.pop()},drawImage(...a){draws.push({args:a,alpha:this.globalAlpha,blend:this.globalCompositeOperation})},createRadialGradient(){return{addColorStop(){}}}}, {get(t,k){return k in t?t[k]:()=>{}}})}
 class Image{constructor(){this.complete=loaded;this.naturalWidth=1600;this.naturalHeight=800}}
 const doc={currentScript:null,createElement(){const c={width:0,height:0,getContext(){return this.g||(this.g=context())}};surfaces.push(c);return c}};
 const env={Image,document:doc,location:{search:''},URLSearchParams,matchMedia:()=>({matches:rm}),BattlePolish:{quality:low?'low':'standard'},localStorage:{getItem(){return null}}};vm.createContext(env);vm.runInContext(fs.readFileSync('js/vfx-kit.js','utf8'),env);return{v:env.VfxKit,draws,surfaces,g:context()};
}
const point={x:200,y:180},e={kind:'ice',seed:22},camera={w:60};
const a=setup();assert(a.v.uses('ice'));assert(a.v.draw(e,1/14,point,point,a.g,camera,'painted8'));
const blend=a.draws.filter(x=>x.args.length===9);assert.equal(blend.length,2);assert(Math.abs(blend[0].alpha-.5)<1e-8);assert(Math.abs(blend[1].alpha-.5)<1e-8);assert.equal(blend[1].blend,'lighter');assert.equal(blend[0].args[1],0);assert.equal(blend[1].args[1],400);
// A shared buffer is bounded and reused for multiple events / spell kinds.
for(const kind of ['ice','lightning','water','wind','earth','dark','heal','shield'])for(const t of [0,.04,.125,.3,.6,.95,1])assert(a.v.draw({...e,kind},t,point,point,a.g,camera,'painted8'));
assert.equal(a.surfaces.length,1);assert(a.surfaces[0].width<=384);
// Reduced motion draws exactly one still, without interpolation / particles.
const r=setup({rm:true});assert(r.v.draw(e,.4,point,point,r.g,camera,'painted8'));assert.equal(r.draws.length,1);assert.equal(r.surfaces.length,0);
const explicit=setup();assert(explicit.v.draw({...e,reducedMotion:true},.4,point,point,explicit.g,camera,'painted8'));assert.equal(explicit.draws.length,1);
const lo=setup({low:true});assert(lo.v.draw(e,.3,point,point,lo.g,camera,'painted8'));assert(lo.surfaces[0].width<=192);
assert(!setup({loaded:false}).v.draw(e,.4,point,point,a.g,camera,'painted8'));
// Existing explicit choices continue to select old/code/atlas looks.
a.v.setChoice('ice','old');assert(a.v.variants('ice').some(x=>x[0]==='painted8'));
const fire=setup();assert(fire.v.draw({kind:'fire',seed:2},.22,point,point,fire.g,camera,'atlas'));assert.equal(fire.surfaces.length,1);
const fireRM=setup({rm:true});assert(fireRM.v.draw({kind:'fire'},.5,point,point,fireRM.g,camera,'atlas'));assert.equal(fireRM.draws.length,1);
console.log('VFX: weighted adjacent cells, shared bounded surface, eight spells, fire, reduced motion, quality and missing-sheet fallback passed');
