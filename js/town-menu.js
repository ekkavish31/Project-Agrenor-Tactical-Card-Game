/* v57 · Village: places menu with a village overview map, larger preview card, and gates at every exit.
   • The ☰ สถานที่ menu opens next to an overview of the whole village; pointing at a place (in the list or on the
     overview) outlines that building in white on the overview and on the village itself, and marks where the hero is.
   • The hover preview card is twice as large and sits beside the screen centre (right of the hero, never over him).
   • Small floating name tags on hover are gone (the preview card names the place); tags still show in edit / label mode.
   • Every exit to the adventure map gets a village gate: two stone posts, a timber beam with a little roof, a lantern
     and a name board — drawn in depth order with the rest of the village. */
(function(root){'use strict';
const V=()=>root.Village25D,$=id=>document.getElementById(id);
const css=document.createElement('style');css.textContent=`
#locationMenu.open{display:grid!important;grid-template-columns:230px auto;gap:14px;width:auto!important;max-width:calc(100vw - 48px)}
#locationMenu .tm-map{position:relative;align-self:start;border-radius:10px;overflow:hidden;border:1px solid #c7c6a066;background:#2b3f2f;box-shadow:inset 0 0 30px #0006}
#locationMenu .tm-map canvas{display:block;width:min(560px,calc(100vw - 340px));height:auto;cursor:pointer}
#locationMenu .tm-map small{position:absolute;left:10px;bottom:8px;color:#f2e5be;font-size:11px;text-shadow:0 1px 3px #000;pointer-events:none}
#locationMenu>h2,#locationMenu>#places,#locationMenu>.hint{grid-column:1}
#locationMenu .tm-map{grid-column:2;grid-row:1 / span 3}
#townPreview{left:calc(50% + 70px)!important;right:auto!important;top:50%!important;transform:translateY(-58%);width:560px!important;padding:20px!important}
#townPreview img{height:260px!important}
#townPreview h3{font-size:22px!important}
#townPreview p{font-size:15px!important}
@media(max-width:1100px){#townPreview{width:min(420px,calc(50vw - 90px))!important}#townPreview img{height:180px!important}}
@media(max-width:760px){#locationMenu.open{grid-template-columns:1fr}#locationMenu .tm-map{grid-column:1;grid-row:auto}#locationMenu .tm-map canvas{width:calc(100vw - 70px)}#townPreview{left:auto!important;right:12px!important;top:auto!important;bottom:70px;transform:none;width:min(320px,calc(100vw - 24px))!important}}`;
document.head.appendChild(css);

/* ---------- overview map ---------- */
const menu=$('locationMenu'),box=document.createElement('div');box.className='tm-map';box.innerHTML='<canvas width="1120" height="630" aria-label="แผนที่รวมหมู่บ้าน"></canvas><small>ชี้สถานที่เพื่อดูตำแหน่ง · คลิกเพื่อเดินไป</small>';menu.appendChild(box);
const mc=box.querySelector('canvas'),mg=mc.getContext('2d');let mapHover=null,base=null,baseStamp='';
function world(){return V().worldSize()}
function snapshot(){// ground (roads, plots) + building art at overview scale, cached until the layout changes
 const W=world(),sx=mc.width/W.width,stamp=JSON.stringify(V().getLocations().map(o=>[o.id,o.x,o.y,o.facing]))+(root.TownArt?.image?1:0);if(base&&stamp===baseStamp)return base;baseStamp=stamp;
 base=document.createElement('canvas');base.width=mc.width;base.height=mc.height;const g=base.getContext('2d');g.fillStyle='#4f6b45';g.fillRect(0,0,base.width,base.height);
 const terrain=root.__townTerrain;if(terrain)g.drawImage(terrain,0,0,base.width,base.height);
 for(const o of V().getLocations().sort((a,b)=>a.y-b.y)){const r=root.TownUX?.art(o);if(!r?.im?.complete||!r.im.naturalWidth)continue;g.save();if(o.facing==='SE'){g.translate((r.x+r.w/2)*sx*2,0);g.scale(-1,1)}g.drawImage(r.im,r.x*sx,r.y*sx,r.w*sx,r.h*sx);g.restore()}
 for(const e of V().getExits()){const p=V().project(e.u,e.v);g.fillStyle='#f2e5be';g.font='bold 18px VillageThai,system-ui';g.textAlign='center';g.fillText('⛩',p.x*sx,p.y*sx)}
 return base}
function drawOverview(){if(!menu.classList.contains('open'))return;const W=world(),sx=mc.width/W.width;mg.clearRect(0,0,mc.width,mc.height);mg.drawImage(snapshot(),0,0);
 const hov=mapHover||root.__townHovered;for(const o of V().getLocations()){const r=root.TownUX?.art(o);if(!r?.im?.complete)continue;if(o.id!==hov)continue;
  // white outline: draw a white silhouette offset in 8 directions, then the building again
  const sil=silhouette(r.im);mg.save();if(o.facing==='SE'){mg.translate((r.x+r.w/2)*sx*2,0);mg.scale(-1,1)}for(const[dx,dy]of[[3,0],[-3,0],[0,3],[0,-3],[2,2],[-2,2],[2,-2],[-2,-2]])mg.drawImage(sil,r.x*sx+dx,r.y*sx+dy,r.w*sx,r.h*sx);mg.drawImage(r.im,r.x*sx,r.y*sx,r.w*sx,r.h*sx);mg.restore();
  const l=root.TownUX.labelPoint(o);mg.font='bold 22px VillageThai,system-ui';mg.textAlign='center';const tw=mg.measureText(o.name).width+24;mg.fillStyle='#20382df0';mg.fillRect(l.x*sx-tw/2,l.y*sx+14,tw,32);mg.fillStyle='#fff3c8';mg.fillText(o.name,l.x*sx,l.y*sx+38)}
 const h=V().getHero(),hp=V().project(h.u,h.v),t=performance.now();mg.fillStyle='#ffd45a';mg.strokeStyle='#3b2a10';mg.lineWidth=3;mg.beginPath();mg.arc(hp.x*sx,hp.y*sx,9+Math.sin(t*.006)*2,0,Math.PI*2);mg.fill();mg.stroke();
 requestAnimationFrame(drawOverview)}
const sils=new WeakMap();function silhouette(im){let c=sils.get(im);if(!c){c=document.createElement('canvas');c.width=Math.min(512,im.naturalWidth);c.height=Math.round(c.width*im.naturalHeight/im.naturalWidth);const g=c.getContext('2d');g.drawImage(im,0,0,c.width,c.height);g.globalCompositeOperation='source-in';g.fillStyle='#fff';g.fillRect(0,0,c.width,c.height);sils.set(im,c)}return c}
function overviewHit(e){const r=mc.getBoundingClientRect(),W=world(),sx=mc.width/W.width,x=(e.clientX-r.left)*mc.width/r.width/sx,y=(e.clientY-r.top)*mc.height/r.height/sx;return root.TownUX?.hitObject({x,y})}
mc.addEventListener('pointermove',e=>{const o=overviewHit(e);mapHover=o?.id||null;setHover(o)});mc.addEventListener('pointerleave',()=>{mapHover=null;setHover(null)});
mc.addEventListener('click',e=>{const o=overviewHit(e);if(o){setHover(null);V().travel(V().getLocations().find(x=>x.id===o.id))}});
function setHover(o){root.__townHovered=o?.id||null;for(const x of V().getLocations()){const r=root.TownUX?.art(x);if(r?.im)r.im._townHovered=x.id===root.__townHovered}}
// list hover → same highlight
$('places').addEventListener('pointerover',e=>{const b=e.target.closest('[data-id]');if(!b)return;const o=V().getLocations().find(x=>x.id===b.dataset.id);mapHover=o?.id||null;setHover(o)});
$('places').addEventListener('pointerleave',()=>{mapHover=null;setHover(null)});
new MutationObserver(()=>{if(menu.classList.contains('open')){base=null;requestAnimationFrame(drawOverview)}else{mapHover=null;setHover(null)}}).observe(menu,{attributes:true,attributeFilter:['class']});

/* ---------- gates at the exits ---------- */
function gateAxis(e){// the road leaves along u or v: the gate spans across it
 const cells=V().getRoadCells?.()||[],near=cells.filter(c=>Math.abs(c.u-e.u)+Math.abs(c.v-e.v)<6);let du=0,dv=0;for(const c of near){du+=Math.abs(c.u-e.u);dv+=Math.abs(c.v-e.v)}return du>=dv?'v':'u'}
function gateObjects(){const out=[];for(const e of V().getExits()){const axis=gateAxis(e),span=1.9,A=axis==='v'?{u:e.u,v:e.v-span}:{u:e.u-span,v:e.v},B=axis==='v'?{u:e.u,v:e.v+span}:{u:e.u+span,v:e.v},pa=V().project(A.u,A.v),pb=V().project(B.u,B.v),pc=V().project(e.u,e.v);
  out.push({y:Math.max(pa.y,pb.y)+2,draw:g=>gate(g,pa,pb,pc,e.name)})}return out}
function post(g,p,h){const w=18;g.fillStyle='#00000040';g.beginPath();g.ellipse(p.x,p.y+2,w,w*.45,0,0,Math.PI*2);g.fill();
 const grd=g.createLinearGradient(p.x-w/2,0,p.x+w/2,0);grd.addColorStop(0,'#cfc4a8');grd.addColorStop(.5,'#a99d80');grd.addColorStop(1,'#7a705a');g.fillStyle=grd;g.fillRect(p.x-w/2,p.y-h,w,h);
 g.strokeStyle='#5d5444';g.lineWidth=1;for(let k=1;k<5;k++){g.beginPath();g.moveTo(p.x-w/2,p.y-h*k/5);g.lineTo(p.x+w/2,p.y-h*k/5);g.stroke()}g.fillStyle='#e2d8bd';g.fillRect(p.x-w/2-3,p.y-h-6,w+6,7)}
function gate(g,pa,pb,pc,name){if(pa.x>pb.x)[pa,pb]=[pb,pa];// left post first, so beam/roof polygons never cross
 const H=128,t=performance.now();post(g,pa,H);post(g,pb,H);
 // beam + roof
 g.fillStyle='#5a3d22';g.beginPath();g.moveTo(pa.x-14,pa.y-H-6);g.lineTo(pb.x+14,pb.y-H-6);g.lineTo(pb.x+14,pb.y-H+8);g.lineTo(pa.x-14,pa.y-H+8);g.closePath();g.fill();
 g.fillStyle='#8a3b2a';g.beginPath();g.moveTo(pa.x-24,pa.y-H-4);g.lineTo(pb.x+24,pb.y-H-4);g.lineTo(pb.x+8,pb.y-H-28);g.lineTo(pa.x-8,pa.y-H-28);g.closePath();g.fill();g.strokeStyle='#5e2418';g.lineWidth=1.5;g.stroke();
 g.strokeStyle='#b8573e';g.lineWidth=1;for(let k=1;k<6;k++){const f=k/6;g.beginPath();g.moveTo(pa.x-24+(pb.x-pa.x+48)*f,pa.y-H-4+(pb.y-pa.y)*f);g.lineTo(pa.x-8+(pb.x-pa.x+16)*f,pa.y-H-28+(pb.y-pa.y)*f);g.stroke()}
 // name board
 const mx=(pa.x+pb.x)/2,my=(pa.y+pb.y)/2-H+22;g.fillStyle='#3b2a18';g.fillRect(mx-46,my-2,92,22);g.fillStyle='#e9d39a';g.font='bold 12px VillageThai,system-ui';g.textAlign='center';g.fillText(name.replace(/^ทาง/,''),mx,my+14);
 // lantern
 const fl=.8+.2*Math.sin(t*.008+pa.x),lx=pb.x,ly=pb.y-H+14;g.strokeStyle='#2a1d12';g.lineWidth=1.5;g.beginPath();g.moveTo(lx,pb.y-H+8);g.lineTo(lx,ly);g.stroke();g.fillStyle='#2a1d12';g.fillRect(lx-6,ly,12,15);g.fillStyle=`rgba(255,${190*fl|0},90,${fl})`;g.fillRect(lx-4,ly+2,8,11);
 const glow=g.createRadialGradient(lx,ly+8,0,lx,ly+8,34);glow.addColorStop(0,`rgba(255,200,110,${.35*fl})`);glow.addColorStop(1,'rgba(255,200,110,0)');g.fillStyle=glow;g.beginPath();g.arc(lx,ly+8,34,0,Math.PI*2);g.fill()}
root.TownMenu={gateObjects,drawOverview};
})(globalThis);
