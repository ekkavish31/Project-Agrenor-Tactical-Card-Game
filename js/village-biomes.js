/* v69 · The world shows through at each exit: the ground around a gate turns into the land it leads to.
   N mine → packed dirt · NE frost pass → snow (snow pines, snowy rocks, drifts, a signpost, a frozen puddle)
   SE coast → sand and a patch of sea · W swamp → swamp water · SW ruins → old slabs · E forest stays forest.
   ground(g) paints soft-edged texture patches into the cached terrain; at(x,y) tells VillageNature which biome a
   plant stands in (snow → snow variants, water → nothing grows); objects() adds a few biome props.
   Textures: assets/village-town/ground/*.png · props: assets/village-town/edge/*.png */
(function(root){'use strict';
const sprite={};for(const n of ['snow-rock-s','snow-rock-m','snow-rock-l','snow-pine-s','snow-pine-m','snow-pine-l','frozen-bush','snow-log','snow-ridge','snowdrift','snow-sign','frozen-puddle',...['pier','pier-end','boat','fish-net','crates-barrel','rocks-l','rocks-s','driftwood','beach-grass','lobster-trap','foam-edge','lantern-post'].map(n=>'coast-'+n)]){const im=new Image();im.onload=()=>{sprite[n]=im;root.VillageNature?.refresh?.()};im.src='assets/village-town/edge/'+n+'.png'}
const tex={};for(const n of ['snow','sand','sea','swamp-water','dirt-road','plaza-slabs']){const im=new Image();im.onload=()=>{tex[n]=im;terrainDirty=true};im.src='assets/village-town/ground/'+n+'.png'}
// biome per exit, in the exit order N, NE, E, SE, SW, W
const PLAN=[[{t:'dirt-road',r:380,out:120,a:.85}],[{t:'snow',r:640,out:200,a:1,kind:'snow'}],[],[{t:'sand',r:560,out:160,a:1,kind:'sand'},{t:'sea',r:330,out:430,a:1,kind:'water'}],[{t:'plaza-slabs',r:260,out:60,a:.55}],[{t:'dirt-road',r:420,out:-120,a:.4},{t:'swamp-water',r:300,out:-230,side:1,a:1,kind:'water'},{t:'swamp-water',r:240,out:-170,side:-1,a:1,kind:'water'}]];
let zones=null;
function build(){const V=root.Village25D;if(!V)return null;const ex=V.getExits(),mid={x:WORLD_W/2,y:WORLD_H/2};zones=[];
 ex.forEach((e,i)=>{const p=V.project(e.u,e.v);let dx=p.x-mid.x,dy=(p.y-mid.y)*2;const L=Math.hypot(dx,dy)||1;dx/=L;dy/=L;
  for(const z of PLAN[i]||[]){const sx=z.side?-dy*z.r*1.3*z.side:0,sy=z.side?dx*z.r*1.3*z.side:0;zones.push({...z,x:p.x+dx*z.out+sx,y:p.y+(dy*z.out+sy)/2,exit:i})}});return zones}
function rng(s){return ()=>{s=Math.imul(s^s>>>15,2246822507)+0x9e3779b9|0;return ((s>>>0)%100000)/100000}}
function ground(g){if(!build())return;for(const z of zones){const im=tex[z.t];if(!im)continue;const R=z.r,w=R*2.6,h=R*1.5,c=document.createElement('canvas');c.width=w;c.height=h;const q=c.getContext('2d');
  const pat=q.createPattern(im,'repeat');pat.setTransform(new DOMMatrix().translate(-z.x%256,-z.y%128).rotate(0).scale(.55,.32));q.fillStyle=pat;q.fillRect(0,0,w,h);if(z.t==='swamp-water'){q.fillStyle='rgba(18,34,30,.42)';q.fillRect(0,0,w,h);const sh=q.createLinearGradient(0,0,w,h);sh.addColorStop(0,'rgba(190,220,200,.18)');sh.addColorStop(.5,'rgba(190,220,200,0)');q.fillStyle=sh;q.fillRect(0,0,w,h)}
  // ragged soft mask: a few overlapping blobs
  const m=document.createElement('canvas');m.width=w;m.height=h;const mq=m.getContext('2d'),r=rng(z.x*7+z.y|0);mq.filter='blur(18px)';
  for(let k=0;k<7;k++){const bx=w/2+(r()-.5)*R*.9,by=h/2+(r()-.5)*R*.45,br=R*(.45+r()*.4),gr=mq.createRadialGradient(bx,by,0,bx,by,br);gr.addColorStop(0,'#000');gr.addColorStop(.7,'rgba(0,0,0,.85)');gr.addColorStop(1,'rgba(0,0,0,0)');mq.fillStyle=gr;mq.save();mq.translate(bx,by);mq.scale(1.25,.62);mq.translate(-bx,-by);mq.beginPath();mq.arc(bx,by,br,0,Math.PI*2);mq.fill();mq.restore()}
  q.globalCompositeOperation='destination-in';q.drawImage(m,0,0);g.save();g.globalAlpha=z.a;g.drawImage(c,z.x-w/2,z.y-h/2);g.restore();
}}
function strength(z,x,y){return 1-Math.hypot((x-z.x)/(z.r*1.15),(y-z.y)/(z.r*.6))}
function at(x,y){if(!zones&&!build())return null;let best=null,bs=.18;for(const z of zones){if(!z.kind)continue;const s=strength(z,x,y);if(s>bs){bs=s;best=z.kind}}return best}
// snow look-alikes for forest plants
function snowSprite(p){const sel=Math.round(p.x*3+p.y*7);if(p.kind==='pine'||p.kind==='broadleaf'||p.kind==='oak'){return sprite[p.h>230?'snow-pine-l':p.h>185?'snow-pine-m':'snow-pine-s']}if(p.kind==='rock')return sprite[sel%2?'snow-rock-m':'snow-rock-l'];if(p.kind==='tallgrass')return sprite.snowdrift;return sprite[sel%3===0?'snow-rock-s':'frozen-bush']}
function drawPlant(g,p,heroPt){if(beach(g,p,heroPt))return true;if(at(p.x,p.y)!=='snow')return false;const im=snowSprite(p);if(!im)return false;const tree=['pine','broadleaf','oak'].includes(p.kind),h=tree?p.h:p.w*im.naturalHeight/im.naturalWidth*1.1,w=h*im.naturalWidth/im.naturalHeight;g.save();g.translate(p.x,p.y);if(p.flip)g.scale(-1,1);TownArt.draw(g,im,null,[-w/2,-h*.93,w,h],heroPt);g.restore();return true}
// hand-placed biome props: [sprite, width, where, anchor]; where = near (gate) · land (in the zone, free ground) · water · shore
const PROPS={snow:{exit:1,list:[['snow-sign',120,'near'],['frozen-puddle',190,'land',.6],['snow-ridge',220,'land'],['snow-log',170,'land'],['snowdrift',150,'land'],['snow-rock-l',170,'land'],['snowdrift',130,'land']]},
 sand:{exit:3,list:[['coast-lantern-post',105,'near'],['coast-crates-barrel',125,'land'],['coast-fish-net',150,'land'],['coast-lobster-trap',125,'land'],['coast-driftwood',150,'land',.75],['coast-beach-grass',105,'land',.8],['coast-beach-grass',95,'land',.8],['coast-beach-grass',90,'land',.8],
  ['coast-pier',210,'shore',.8],['coast-pier-end',210,'shore',.8],['coast-boat',190,'water',.7],['coast-rocks-l',190,'water',.8],['coast-rocks-s',140,'water',.8],['coast-foam-edge',230,'shore',.55],['coast-foam-edge',210,'shore',.55],['coast-foam-edge',200,'shore',.55]]}};
let props=null;
function place(){const V=root.Village25D;props=[];const r=rng(99);
 for(const [kind,spec] of Object.entries(PROPS)){const ex=V.getExits()[spec.exit],z=zones.find(z=>z.kind===kind);if(!ex||!z)continue;const g=V.project(ex.u,ex.v),sea=zones.find(q=>q.exit===spec.exit&&q.kind==='water');
  for(const [n,w,where,anchor] of spec.list){for(let k=0;k<160;k++){const base=where==='water'||where==='shore'?sea:z;if(!base)break;const x=base.x+(r()-.5)*base.r*1.8,y=base.y+(r()-.5)*base.r*.9;
    if(x<w*.6+40||x>WORLD_W-w*.6-40||y<60||y>WORLD_H-30)continue;const gd=Math.hypot(x-g.x,(y-g.y)*2);if(where==='near'?gd<170:gd<270)continue;
    const ss=sea?strength(sea,x,y):-1;
    if(where==='near'&&Math.hypot(x-g.x,(y-g.y)*2)>340)continue;
    if(where==='water'&&ss<.3)continue;if(where==='shore'&&(ss<-.06||ss>.18))continue;
    if((where==='land'||where==='near')&&(strength(z,x,y)<.12||ss>-.05||(root.VillageNature&&!root.VillageNature.free(x,y,w*.4,w*.18))))continue;
    if(roadPixels&&roadPixels[(Math.round(y)*WORLD_W+Math.round(x))*4+3]>40)continue;
    if(props.some(q=>Math.hypot(q.x-x,(q.y-y)*2)<(q.w+w)*.42))continue;props.push({x,y,n,w,a:anchor||.9,flip:where!=='shore'&&r()<.5});break}}}}
function objects(){if(!zones&&!build())return[];if(!root.Village25D)return[];if(!props)place();
 return props.filter(q=>sprite[q.n]).map(q=>({x:q.x,y:q.n==='coast-foam-edge'?q.y-40:q.y,draw:g=>{const im=sprite[q.n],h=q.w*im.naturalHeight/im.naturalWidth;g.save();g.translate(q.x,q.y);if(q.flip)g.scale(-1,1);TownArt.draw(g,im,null,[-q.w/2,-h*q.a,q.w,h],null);g.restore()}}))}
// beach: no trees on the sand, shrubs become beach grass, rocks become sea rocks
function beach(g,p,heroPt){if(at(p.x,p.y)!=='sand')return false;if(['pine','broadleaf','oak'].includes(p.kind))return true;const im=sprite[p.kind==='rock'?'coast-rocks-s':'coast-beach-grass'];if(!im)return false;const w=p.w*1.2,h=w*im.naturalHeight/im.naturalWidth;g.save();g.translate(p.x,p.y);if(p.flip)g.scale(-1,1);TownArt.draw(g,im,null,[-w/2,-h*.8,w,h],heroPt);g.restore();return true}
root.TownBiome={reset:()=>{props=null;zones=null},ground,at,drawPlant,objects,zones:()=>zones?.map(z=>({...z}))};
})(globalThis);
