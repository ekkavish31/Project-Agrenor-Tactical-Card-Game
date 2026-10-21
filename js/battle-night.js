/* v54 · Night battles (visual only). About 1 in 4 maps has map.night (seeded in TacticsCore.generate).
   A darkness layer is drawn over the scene with soft light pools cut out of it, then warm/cold glows are added:
   • your units carry a lantern glow · crystals, rune stones, mine beams, braziers on pillars and embers light up
   • a few lantern posts are placed on free tiles (seeded) so every night map has warm islands of light
   • fireflies drift in forest / swamp / ruins, sparks in the mine
   HP bars, range tiles' outlines and the UI are drawn after this layer, so they stay readable.
   Override for testing: the field-tools select #nightMode (random / night / day) or BattleNight.force = true|false. */
(function(root){'use strict';
const TINT={forest:[10,24,34],swamp:[12,26,24],frost:[16,28,52],mine:[14,10,8],quarry:[18,18,30],coast:[10,20,40],ruins:[22,14,36],crag:[10,24,34]};
const LIGHT={hero:{r:2.6,c:[255,196,120],a:.55},ally:{r:2,c:[255,196,120],a:.42},lantern:{r:3,c:[255,176,90],a:.75},crystal:{r:2.4,c:[190,120,255],a:.6},standstone:{r:1.7,c:[120,255,170],a:.45},beam:{r:2.6,c:[255,170,80],a:.65},pillar:{r:2.2,c:[255,140,60],a:.55},orepile:{r:1.3,c:[255,150,90],a:.35},ash:{r:1,c:[255,90,40],a:.3}};
const reduced=()=>root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
let layer=null,lanternCache=null,flies=[],lastMap=null;
const BattleNight={force:null,
 active(st){const sel=document.getElementById('nightMode')?.value;if(this.force!=null)return !!this.force;if(sel==='night')return true;if(sel==='day')return false;return !!st?.map?.night},
 draw(ctx,r,st,point,camera,now){if(!st?.map||!this.active(st))return;const map=st.map,area=map.variant||map.theme,tint=TINT[area]||TINT.forest,w=camera.w;
  if(map!==lastMap){lastMap=map;lanternCache=placeLanterns(map);flies=[]}
  // light list in screen space
  const lights=[],add=(x,y,h,def,flick=0)=>{const p=point(x,y,h);lights.push({x:p.x,y:p.y-w*.35,r:def.r*w,c:def.c,a:def.a*(1+flick)})};
  const fl=k=>reduced()?0:Math.sin(now*.011+k*1.7)*.06+Math.sin(now*.023+k)*.04;
  for(const u of st.units)if(!u.removed&&u.hp>0&&u.side==='ally')add(u.x,u.y,(root.TacticsCore.at(map,u.x,u.y)?.h||0)+.6,u===st.hero?LIGHT.hero:LIGHT.ally,fl(u.x*3+u.y));
  for(const t of map.tiles){const d=t.prop&&LIGHT[t.prop]||(t.kind==='ash'?LIGHT.ash:null);if(d)add(t.x,t.y,t.h+(t.prop?.8:0),d,fl(t.x+t.y*7))}
  for(const L of lanternCache)add(L.x,L.y,L.h+1.1,LIGHT.lantern,fl(L.x*5+L.y*3));
  // 1) lantern posts (drawn before the darkness so they sit in their own pool)
  for(const L of lanternCache)post(ctx,point(L.x,L.y,L.h),w,now,L.k);
  // 2) darkness with light pools cut out
  const dpr=ctx.getTransform().a||1,W=Math.ceil(r.width*dpr),H=Math.ceil(r.height*dpr);if(!layer)layer=document.createElement('canvas');if(layer.width!==W||layer.height!==H){layer.width=W;layer.height=H}
  const g=layer.getContext('2d');g.setTransform(1,0,0,1,0,0);g.globalCompositeOperation='source-over';g.clearRect(0,0,W,H);g.setTransform(ctx.getTransform());
  const sky=g.createLinearGradient(0,0,r.width*.4,r.height);sky.addColorStop(0,`rgba(${tint.map(v=>v+18)},.58)`);sky.addColorStop(1,`rgba(${tint},.74)`);g.fillStyle=sky;g.fillRect(-r.width,-r.height,r.width*3,r.height*3);
  g.globalCompositeOperation='destination-out';for(const L of lights){const gr=g.createRadialGradient(L.x,L.y,0,L.x,L.y,L.r);gr.addColorStop(0,`rgba(0,0,0,${Math.min(.95,L.a+.3)})`);gr.addColorStop(.55,`rgba(0,0,0,${L.a*.55})`);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.beginPath();g.ellipse(L.x,L.y+L.r*.15,L.r,L.r*.62,0,0,Math.PI*2);g.fill()}
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.drawImage(layer,0,0);ctx.restore();
  // 3) coloured glow on top
  ctx.save();ctx.globalCompositeOperation='lighter';for(const L of lights){const gr=ctx.createRadialGradient(L.x,L.y,0,L.x,L.y,L.r*.75);gr.addColorStop(0,`rgba(${L.c},${L.a*.32})`);gr.addColorStop(1,`rgba(${L.c},0)`);ctx.fillStyle=gr;ctx.beginPath();ctx.ellipse(L.x,L.y+L.r*.1,L.r*.75,L.r*.48,0,0,Math.PI*2);ctx.fill()}
  // 4) fireflies / sparks
  if(!reduced()){const kind=area==='mine'?'spark':['forest','swamp','ruins','crag'].includes(area)?'fly':null;if(kind){if(!flies.length)for(let i=0;i<22;i++)flies.push({t:root.TacticsCore.random?.(map.seed+'|fly'+i)||Math.random,u:Math.random(),v:Math.random(),p:Math.random()*6});
    const tiles=map.tiles.filter(t=>!t.void),xs=tiles.map(t=>point(t.x,t.y,t.h)),minX=Math.min(...xs.map(p=>p.x)),maxX=Math.max(...xs.map(p=>p.x)),minY=Math.min(...xs.map(p=>p.y)),maxY=Math.max(...xs.map(p=>p.y));
    for(const f of flies){const x=minX+(maxX-minX)*((f.u+Math.sin(now*.00011+f.p)*.05+1)%1),y=minY-w+(maxY-minY+w)*((f.v+(kind==='spark'?-now*.00004:Math.cos(now*.00013+f.p)*.04)+1)%1),blink=kind==='fly'?Math.max(0,Math.sin(now*.003+f.p*3)):(.5+.5*Math.sin(now*.01+f.p)),col=kind==='fly'?'200,255,150':'255,170,80',rad=w*.09;
     const gr=ctx.createRadialGradient(x,y,0,x,y,rad*3);gr.addColorStop(0,`rgba(${col},${.9*blink})`);gr.addColorStop(1,`rgba(${col},0)`);ctx.fillStyle=gr;ctx.beginPath();ctx.arc(x,y,rad*3,0,Math.PI*2);ctx.fill()}}}
  ctx.restore()}};
// seeded lantern posts on free tiles, spread apart, avoiding spawns and paths
function placeLanterns(map){const C=root.TacticsCore,rnd=C.random?C.random(String(map.seed)+'|lanterns'):Math.random,spawn=new Set([...(map.spawns?.allies||[]),...(map.spawns?.enemies||[]),map.start,map.enemy].filter(Boolean).map(p=>p.x+','+p.y));
 const free=map.tiles.filter(t=>!t.void&&!t.blocked&&!t.prop&&!t.cliff&&!['water','shallow','ice','rail'].includes(t.kind)&&!spawn.has(t.x+','+t.y)),n=Math.max(3,Math.round(free.length/70)),out=[];
 for(let tries=0;tries<400&&out.length<n&&free.length;tries++){const t=free[Math.floor(rnd()*free.length)];if(out.some(o=>Math.abs(o.x-t.x)+Math.abs(o.y-t.y)<6))continue;out.push({x:t.x,y:t.y,h:t.h,k:out.length})}return out}
function post(ctx,p,w,now,k){const hgt=w*1.15,x=p.x+w*.18,y=p.y-w*.05,fl=reduced()?1:.85+.15*Math.sin(now*.013+k*2);ctx.save();
 ctx.fillStyle='#00000055';ctx.beginPath();ctx.ellipse(x,y+w*.03,w*.16,w*.07,0,0,Math.PI*2);ctx.fill();
 ctx.fillStyle='#3b2a1c';ctx.fillRect(x-w*.035,y-hgt,w*.07,hgt);ctx.fillRect(x-w*.035,y-hgt,w*.2,w*.05);
 const lx=x+w*.15,ly=y-hgt+w*.05;ctx.strokeStyle='#2a1d12';ctx.lineWidth=Math.max(1,w*.02);ctx.beginPath();ctx.moveTo(lx,y-hgt+w*.03);ctx.lineTo(lx,ly+w*.04);ctx.stroke();
 ctx.fillStyle='#2a1d12';ctx.fillRect(lx-w*.08,ly+w*.04,w*.16,w*.2);ctx.fillStyle=`rgba(255,${190*fl|0},90,${.95*fl})`;ctx.fillRect(lx-w*.06,ly+w*.06,w*.12,w*.15);ctx.restore()}
root.BattleNight=BattleNight;
})(globalThis);
