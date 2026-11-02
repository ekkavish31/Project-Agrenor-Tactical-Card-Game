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
 for(const o of V().getLocations().sort((a,b)=>a.y-b.y)){const r=root.TownUX?.art(o);if(!r?.im?.complete||!r.im.naturalWidth)continue;g.save();if((o.facing==='SE')!==!!o.flipArt){g.translate((r.x+r.w/2)*sx*2,0);g.scale(-1,1)}g.drawImage(r.im,r.x*sx,r.y*sx,r.w*sx,r.h*sx);g.restore()}
 for(const e of V().getExits()){if(e.off)continue;const p=V().project(e.u,e.v);g.fillStyle='#f2e5be';g.font='bold 18px VillageThai,system-ui';g.textAlign='center';g.fillText('⛩',p.x*sx,p.y*sx)}
 return base}
function drawOverview(){if(!menu.classList.contains('open'))return;const W=world(),sx=mc.width/W.width;mg.clearRect(0,0,mc.width,mc.height);mg.drawImage(snapshot(),0,0);
 const hov=mapHover||root.__townHovered;for(const o of V().getLocations()){const r=root.TownUX?.art(o);if(!r?.im?.complete)continue;if(o.id!==hov)continue;
  // white outline: draw a white silhouette offset in 8 directions, then the building again
  const sil=silhouette(r.im);mg.save();if((o.facing==='SE')!==!!o.flipArt){mg.translate((r.x+r.w/2)*sx*2,0);mg.scale(-1,1)}for(const[dx,dy]of[[3,0],[-3,0],[0,3],[0,-3],[2,2],[-2,2],[2,-2],[-2,-2]])mg.drawImage(sil,r.x*sx+dx,r.y*sx+dy,r.w*sx,r.h*sx);mg.drawImage(r.im,r.x*sx,r.y*sx,r.w*sx,r.h*sx);mg.restore();
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
// v64: themed gate art per adventure area (assets/village-town/decor/gate-<area>.png) replaces the code-drawn gate when present
const GATE_AREA=['mine','frost','forest','coast','ruins','swamp'],gateImg={};
/* v98.20 · the six themed adventure-gate pictures are no longer loaded: the two town gates are drawn by code */
function gateSprite(g,pa,pb,im,flip){const mx=(pa.x+pb.x)/2,my=(pa.y+pb.y)/2,w=(Math.abs(pb.x-pa.x)+90)*1.3,h=w*im.naturalHeight/im.naturalWidth;g.save();g.translate(mx,my+10);if(flip)g.scale(-1,1);root.TownArt.draw(g,im,null,[-w/2,-h*.9,w,h],null);g.restore()}
function gateObjects(){const out=[];V().getExits().forEach((e,i)=>{if(e.off)return;const axis=gateAxis(e),span=1.9,A=axis==='v'?{u:e.u,v:e.v-span}:{u:e.u-span,v:e.v},B=axis==='v'?{u:e.u,v:e.v+span}:{u:e.u+span,v:e.v},pa=V().project(A.u,A.v),pb=V().project(B.u,B.v),pc=V().project(e.u,e.v);
  out.push({i,x:pc.x,y:Math.max(pa.y,pb.y)+420,draw:g=>{g.__gateK=i;gate(g,pa,pb,pc,'ประตูเมือง')}})   /* +420: drawn in front of the border forest */});return out}
/* v98.20 · the town gate, drawn by code: two stone towers with battlements, a timber lintel under a red tiled roof (same tiles as the village), a hanging name board,
   a pennant and a lantern. pa/pb = foot of the left/right tower on screen (the gate spans the road), pc = the middle of the opening. */
function tower(g,p,h,w=38,c=['#d6cbad','#a99d7e','#e4dbc0']){
 const q=w/4,L={x:p.x-w/2,y:p.y},F={x:p.x,y:p.y+q},R={x:p.x+w/2,y:p.y},B={x:p.x,y:p.y-q};
 const face=(pts,c1,c2)=>{const gr=g.createLinearGradient(0,pts[0].y-h,0,pts[0].y);gr.addColorStop(0,c1);gr.addColorStop(1,c2);g.fillStyle=gr;g.beginPath();pts.forEach((a,i)=>g[i?'lineTo':'moveTo'](a.x,a.y));g.closePath();g.fill()};
 const up=(a,d)=>({x:a.x,y:a.y-d});
 face([L,F,up(F,h),up(L,h)],c[0],shade(c[0],-.22));face([F,R,up(R,h),up(F,h)],c[1],shade(c[1],-.22));
 if(w>20){g.strokeStyle='rgba(70,60,44,.55)';g.lineWidth=1;for(let y=13,r=0;y<h;y+=13,r++){for(const [A,Z] of [[L,F],[F,R]]){g.beginPath();g.moveTo(A.x,A.y-y);g.lineTo(Z.x,Z.y-y);g.stroke();
   for(let t=(r%2?.25:.55);t<1;t+=.5){const x=A.x+(Z.x-A.x)*t,yy=A.y+(Z.y-A.y)*t-y;g.beginPath();g.moveTo(x,yy);g.lineTo(x,yy+13);g.stroke()}}}}
 g.fillStyle=c[2];g.beginPath();g.moveTo(L.x,L.y-h);g.lineTo(B.x,B.y-h);g.lineTo(R.x,R.y-h);g.lineTo(F.x,F.y-h);g.closePath();g.fill();g.strokeStyle='rgba(70,60,44,.5)';g.stroke()}
function shade(hex,k){const n=parseInt(hex.slice(1),16),f=v=>Math.max(0,Math.min(255,Math.round(v*(1+k))));return '#'+[(n>>16)&255,(n>>8)&255,n&255].map(f).map(v=>v.toString(16).padStart(2,'0')).join('')}
const GATE_SPR=['v1-town-gate-stone','v1-town-gate-timber'],gateSprImg={};
function gateSpr(k){const n=GATE_SPR[k%2];let im=gateSprImg[n];if(!im){im=gateSprImg[n]=new Image();im.src='assets/village-town/decor/'+n+'.webp'}return im.complete&&im.naturalWidth?im:null}
function gate(g,pa,pb,pc,name){if(pa.x>pb.x)[pa,pb]=[pb,pa];
 /* v98.63 · hand-painted town gates (sheet V1): stone gate for the first open exit, timber-and-stone for the second; drawn across the road, mirrored when the road runs the other way */
 { const im=gateSpr(name==='ประตูเมือง'&&g.__gateK||0); if(im){const w=(Math.abs(pb.x-pa.x))*1.7+40,h=w*im.naturalHeight/im.naturalWidth,flip=pb.y<pa.y;
   g.fillStyle='rgba(0,0,0,.22)';g.beginPath();g.ellipse(pc.x,pc.y+4,w*.42,w*.1,0,0,Math.PI*2);g.fill();
   g.save();g.translate(pc.x,pc.y+w*.1);if(flip)g.scale(-1,1);g.drawImage(im,-w/2,-h,w,h);g.restore();return}}
 const H=150,t=performance.now(),back=pa.y<pb.y?pa:pb,front=back===pa?pb:pa;
 // ground shadow of the whole gate
 g.fillStyle='rgba(0,0,0,.22)';g.beginPath();g.ellipse(pc.x,pc.y+4,Math.abs(pb.x-pa.x)/2+30,16,0,0,Math.PI*2);g.fill();
 // back tower, lintel + roof, then the front tower (so the near tower overlaps the beam)
 const merl=(p)=>{for(const [dx,dy] of [[-12,0],[0,-7],[12,0],[0,7]])tower(g,{x:p.x+dx,y:p.y-H+dy-3},8,10,['#cfc4a6','#9d9174','#ddd3b8'])};
 tower(g,back,H);merl(back);
 // timber lintel (follows the slope between the towers) with tiled roof above it
 const A={x:pa.x,y:pa.y-H+22},B={x:pb.x,y:pb.y-H+22};
 g.fillStyle='#5a3d22';g.beginPath();g.moveTo(A.x-6,A.y-6);g.lineTo(B.x+6,B.y-6);g.lineTo(B.x+6,B.y+16);g.lineTo(A.x-6,A.y+16);g.closePath();g.fill();
 g.strokeStyle='#3a2614';g.lineWidth=1.2;g.stroke();g.strokeStyle='#7b5632';for(let k=1;k<5;k++){const f=k/5;g.beginPath();g.moveTo(A.x+(B.x-A.x)*f,A.y+(B.y-A.y)*f-5);g.lineTo(A.x+(B.x-A.x)*f,A.y+(B.y-A.y)*f+15);g.stroke()}
 const R1={x:A.x-18,y:A.y-4},R2={x:B.x+18,y:B.y-4},rh=30;
 g.fillStyle='#9a3f2c';g.beginPath();g.moveTo(R1.x,R1.y);g.lineTo(R2.x,R2.y);g.lineTo(R2.x-14,R2.y-rh);g.lineTo(R1.x+14,R1.y-rh);g.closePath();g.fill();g.strokeStyle='#5e2418';g.lineWidth=1.5;g.stroke();
 g.strokeStyle='#c25f45';g.lineWidth=1;for(let k=1;k<9;k++){const f=k/9;g.beginPath();g.moveTo(R1.x+(R2.x-R1.x)*f,R1.y+(R2.y-R1.y)*f);g.lineTo(R1.x+14+(R2.x-R1.x-28)*f,R1.y-rh+(R2.y-R1.y)*f);g.stroke()}
 g.fillStyle='#6d2a1c';g.beginPath();g.moveTo(R1.x+14,R1.y-rh);g.lineTo(R2.x-14,R2.y-rh);g.lineTo(R2.x-14,R2.y-rh-5);g.lineTo(R1.x+14,R1.y-rh-5);g.closePath();g.fill();
 tower(g,front,H);merl(front);
 // name board hanging under the lintel
 const mx=(pa.x+pb.x)/2,my=(pa.y+pb.y)/2-H+44;g.strokeStyle='#2a1d12';g.lineWidth=1.5;g.beginPath();g.moveTo(mx-30,my-22);g.lineTo(mx-30,my);g.moveTo(mx+30,my-22);g.lineTo(mx+30,my);g.stroke();
 g.fillStyle='#3b2a18';g.fillRect(mx-44,my,88,23);g.strokeStyle='#d9b66b';g.lineWidth=1;g.strokeRect(mx-43.5,my+.5,87,22);g.fillStyle='#f0dca3';g.font='bold 13px VillageThai,system-ui';g.textAlign='center';g.fillText(name,mx,my+16);
 // pennants on both towers
 for(const [p,dir] of [[pa,-1],[pb,1]]){const top={x:p.x,y:p.y-H-14},sway=Math.sin(t*.003+p.x)*3;g.strokeStyle='#2a1d12';g.lineWidth=2;g.beginPath();g.moveTo(top.x,top.y+14);g.lineTo(top.x,top.y-22);g.stroke();
  g.fillStyle='#2f6b4a';g.beginPath();g.moveTo(top.x,top.y-22);g.lineTo(top.x+dir*(26+sway),top.y-16);g.lineTo(top.x+dir*(20+sway),top.y-10);g.lineTo(top.x+dir*(26+sway),top.y-4);g.lineTo(top.x,top.y-6);g.closePath();g.fill();g.fillStyle='#e8c46a';g.fillRect(top.x+dir*4-1,top.y-17,3,6)}
 // lantern on the near tower
 const fl=.8+.2*Math.sin(t*.008+pa.x),lx=front.x+(front===pb?24:-24),ly=front.y-H*.45;g.strokeStyle='#2a1d12';g.lineWidth=2;g.beginPath();g.moveTo(front.x+(front===pb?14:-14),ly-6);g.lineTo(lx,ly-6);g.lineTo(lx,ly);g.stroke();g.fillStyle='#2a1d12';g.fillRect(lx-6,ly,12,15);g.fillStyle=`rgba(255,${190*fl|0},90,${fl})`;g.fillRect(lx-4,ly+2,8,11);
 const glow=g.createRadialGradient(lx,ly+8,0,lx,ly+8,38);glow.addColorStop(0,`rgba(255,200,110,${.38*fl})`);glow.addColorStop(1,'rgba(255,200,110,0)');g.fillStyle=glow;g.beginPath();g.arc(lx,ly+8,38,0,Math.PI*2);g.fill()}
root.TownMenu={gateObjects,drawOverview};
})(globalThis);
