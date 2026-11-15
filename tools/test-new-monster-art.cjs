const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const kinds=['murk','hunger','hungerRoot','alarmHorn','byrexael','soulCore'];
const root=require('node:path').resolve(__dirname,'..');
const c={window:{},performance:{now:()=>0},console};
class FakeImage{constructor(){this.naturalWidth=1536;this.naturalHeight=1024;this.complete=true}set src(v){this.onload?.()}}
c.Image=FakeImage;vm.createContext(c);
vm.runInContext(fs.readFileSync(root+'/js/asset-manifest.js','utf8'),c);
vm.runInContext(fs.readFileSync(root+'/js/monster-animation.js','utf8'),c);
const M=c.window.MonsterArt,registry=c.window.ASSET_MANIFEST.assets,j=JSON.parse(fs.readFileSync(root+'/data/asset-manifest.json'));
(async()=>{let n=0;for(const kind of kinds){await M.prepare(kind);for(const dir of ['SE','SW','NE','NW'])for(const pose of ['idle','walk','windup','strike','cast','special','guard','hit','down']){
const clip=M.resolveClip(kind,dir,pose);assert(clip,kind+' '+dir+' '+pose);assert.equal(clip.mirror,dir==='SW'||dir==='NW');
const frame=M.frame(kind,dir,{pose},pose==='down'?0:1,0,kind+dir+pose);assert(frame);assert(frame.sx>=0&&frame.sy>=0&&frame.sx+frame.sw<=1536&&frame.sy+frame.sh<=1024);assert(frame.pivot[1]>0&&frame.pivot[1]<=1);assert(frame.renderHeight>0);
const a=registry.find(a=>a.id===clip.id);assert(fs.existsSync(root+'/'+a.file));assert.deepEqual(JSON.parse(JSON.stringify(a)),j.assets.find(x=>x.id===a.id));n++;
}for(const suffix of ['.webp','-back.webp'])assert(fs.existsSync(root+'/assets/enemies/'+kind+suffix));assert(fs.existsSync(root+'/assets/cards/portraits/en-'+kind+'.webp'));}
console.log(n+' monster view/pose routes passed; both registries and fallback files present');})().catch(e=>{console.error(e);process.exitCode=1});
