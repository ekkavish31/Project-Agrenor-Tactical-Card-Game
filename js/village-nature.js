/* v50: deterministic clustered planting on vacant ground; no navigation changes. */
(function(){'use strict';
const CELL=12,cols=Math.ceil(WORLD_W/CELL),rows=Math.ceil(WORLD_H/CELL),stride=cols+1;
let occupied=null,integral=null,oldRoads=null,oldLayout='',plants=[],details=[],renderables=[],generation=0,buildMS=0;
const sprites={broadleaf:TownArt.image('assets/village-town/nature/broadleaf.webp'),pine:TownArt.image('assets/village-town/nature/pine.webp'),oak:TownArt.image('assets/village-town/nature/old-oak.webp')};
const rng=(seed)=>()=>((seed=Math.imul(seed,1664525)+1013904223>>>0)/4294967296);
function layoutKey(){return JSON.stringify(locations.map(o=>[o.id,o.x,o.y,o.w,o.d,o.facing,...Object.values(TownUX.art(o)||{}).filter(v=>typeof v==='number')]))}
function rects(){return locations.map(o=>TownUX.art(o)).filter(Boolean)}
function roadPixel(x,y){x=Math.round(x);y=Math.round(y);return x>=0&&y>=0&&x<WORLD_W&&y<WORLD_H&&roadPixels?.[(y*WORLD_W+x)*4+3]>20}
function buildMask(){
 occupied=new Uint8Array(cols*rows);integral=new Uint32Array((cols+1)*(rows+1));
 const estates=locations.map(o=>({o,e:estate(o)})).filter(a=>a.e),buildings=rects(),square=locations.find(o=>o.id==='square'),sq=project(center(square).u,center(square).v);
 for(let y=0;y<rows;y++)for(let x=0;x<cols;x++){
  const px=(x+.5)*CELL,py=(y+.5)*CELL,q=inv(px,py);
  let blocked=px<24||py<24||px>WORLD_W-24||py>WORLD_H-24||Math.hypot(px-sq.x,(py-sq.y)*2)<200;
  // Include the visible stone shoulder, not only the walkable road centre.
  if(!blocked)for(const dx of[-18,0,18]){for(const dy of[-12,0,12])if(roadPixel(px+dx,py+dy)){blocked=true;break}if(blocked)break}
  if(!blocked)blocked=estates.some(({o,e})=>{const a=canonical(o,q.u,q.v);return a.u>e.u+e.left+.6&&a.u<e.u+e.right-.6&&a.v>e.v+e.back+.6&&a.v<e.v+e.front-.2});
  if(!blocked)blocked=buildings.some(r=>px>r.x-12&&px<r.x+r.w+12&&py>r.y-12&&py<r.y+r.h+12);
  if(!blocked)blocked=exits.some(e=>Math.hypot(px-e[1]*MX,(py-e[2]*MY)*2)<115);
  occupied[y*cols+x]=blocked?1:0;
  integral[(y+1)*stride+x+1]=occupied[y*cols+x]+integral[y*stride+x+1]+integral[(y+1)*stride+x]-integral[y*stride+x];
 }
}
function free(x,y,rx=12,ry=8){
 if(!integral||x-rx<24||y-ry<24||x+rx>WORLD_W-24||y+ry>WORLD_H-24)return false;
 const a=Math.floor((x-rx)/CELL),b=Math.floor((y-ry)/CELL),c=Math.min(cols,Math.floor((x+rx)/CELL)+1),d=Math.min(rows,Math.floor((y+ry)/CELL)+1);
 return integral[d*stride+c]-integral[b*stride+c]-integral[d*stride+a]+integral[b*stride+a]===0;
}
function ensure(){
 if(!roadPixels||!window.TownUX)return;
 const key=layoutKey();if(oldRoads===roadPixels&&oldLayout===key)return;
 const started=performance.now();oldRoads=roadPixels;oldLayout=key;buildMask();
 plants=[];details=[];const random=rng(502071),centres=[];
 for(let i=0;i<120;i++)centres.push({x:random()*WORLD_W,y:random()*WORLD_H,r:130+random()*230,rich:random()});
 const density=(x,y)=>{let best=0,near=null;for(const c of centres){const d=Math.hypot(x-c.x,(y-c.y)*1.35)/c.r;if(d<1&&1-d>best){best=1-d;near=c}}return{value:best,near}};
 const bins=new Map(),bin=180;
 function nearby(x,y,r){for(let by=Math.floor((y-r)/bin);by<=Math.floor((y+r)/bin);by++)for(let bx=Math.floor((x-r)/bin);bx<=Math.floor((x+r)/bin);bx++)for(const p of bins.get(bx+','+by)||[])if(Math.hypot(x-p.x,(y-p.y)*1.6)<r+p.space)return true;return false}
 function add(p){plants.push(p);const k=Math.floor(p.x/bin)+','+Math.floor(p.y/bin);if(!bins.has(k))bins.set(k,[]);bins.get(k).push(p)}
 const buildings=rects();
 // Broad crowns and young conifers form loose groves, leaving sunny glades.
 for(let i=0;i<7000&&plants.length<300;i++){
  const x=40+random()*(WORLD_W-80),y=160+random()*(WORLD_H-200),d=density(x,y),pick=random(),h=145+random()*105,flip=random()<.5;
  if(d.value<.1||pick>d.value*1.35)continue;
  const kind=pick<.11?'oak':pick<.35?'pine':'broadleaf',w=h*(kind==='pine'?.70:kind==='oak'?1.1:.86),space=w*.26;
  if(!free(x,y,w*.46,w*.23)||nearby(x,y,space+24))continue;
  if(buildings.some(r=>x+w/2>r.x-20&&x-w/2<r.x+r.w+20&&y>r.y-20&&y-h*.93<r.y+r.h+20))continue;
  add({x,y,w,h,kind,flip,space});
 }
 // v61 forest edge: dense, overlapping rows along the border (depth like a real woodland edge)
 for(let i=0;i<9000&&plants.length<560;i++){const side=Math.floor(random()*4),t=random(),depth=Math.pow(random(),1.6)*420;let x=side<2?t*WORLD_W:side===2?depth+30:WORLD_W-depth-30,y=side>=2?160+t*(WORLD_H-200):side===0?170+depth:WORLD_H-depth-30;const h=150+random()*130,pick=random(),kind=pick<.14?'oak':pick<.52?'pine':'broadleaf',w=h*(kind==='pine'?.7:kind==='oak'?1.1:.86),space=w*.16;if(!free(x,y,w*.3,w*.16)||nearby(x,y,space+6))continue;if(buildings.some(r=>x+w/2>r.x-10&&x-w/2<r.x+r.w+10&&y>r.y-10&&y-h*.93<r.y+r.h+10))continue;add({x,y,w,h,kind,flip:random()<.5,space})}
 // Low bushes prefer the same groves, but occasional isolated shrubs soften open lawns.
 for(let i=0;i<7000&&plants.length<620;i++){
  const x=30+random()*(WORLD_W-60),y=30+random()*(WORLD_H-60),d=density(x,y),pick=random(),w=48+random()*43,flip=random()<.5;
  if(pick>(.06+d.value*.55)||!free(x,y,w*.46,w*.22)||nearby(x,y,22))continue;
  add({x,y,w,h:w,kind:'bush',flip,space:20});
 }
 for(let i=0;i<9000&&details.length<1800;i++){
  const x=24+random()*(WORLD_W-48),y=24+random()*(WORLD_H-48),d=density(x,y),pick=random(),w=22+random()*28;
  if(pick>.045+d.value*.70||!free(x,y,w*.55,w*.38))continue;
  // Each patch favours one flower colour, avoiding multicoloured confetti everywhere.
  const index=d.near&&d.near.rich>.60&&d.value>.25?(d.near.rich>.82?2:1):0;
  details.push({x,y,w,index});
 }
 renderables=plants.map(p=>({y:p.y,plant:p,draw:()=>drawPlant(p)}));generation++;buildMS=performance.now()-started;
}
function drawPlant(p){
 const im=p.kind==='bush'?images.props:sprites[p.kind];if(!im?.complete||!im.naturalWidth)return;
 g.save();g.translate(p.x,p.y);if(p.flip)g.scale(-1,1);
 const crop=p.kind==='bush'?[im.naturalWidth/2,0,im.naturalWidth/4,im.naturalHeight/2]:null;
 TownArt.draw(g,im,crop,[-p.w/2,-p.h*.93,p.w,p.h],project(hero.u,hero.v));g.restore();
}
function ground(ctx){ensure();for(const p of details)TownArt.detail(ctx,p.index,p,p.w)}
function objects(){ensure();const m=g.getTransform(),left=(0-m.e)/m.a,right=(cv.width-m.e)/m.a,top=(0-m.f)/m.d,bottom=(cv.height-m.f)/m.d;return renderables.filter(o=>o.plant.x+o.plant.w/2>left&&o.plant.x-o.plant.w/2<right&&o.plant.y>top&&o.plant.y-o.plant.h<bottom)}
window.VillageNature={ground,objects,free,stats:()=>({generation,buildMS,trees:plants.filter(p=>p.kind!=='bush').length,bushes:plants.filter(p=>p.kind==='bush').length,ground:details.length}),snapshot:()=>({plants:plants.map(p=>({...p})),details:details.map(p=>({...p}))}),refresh:()=>{oldRoads=null;terrainDirty=true}};
})();
