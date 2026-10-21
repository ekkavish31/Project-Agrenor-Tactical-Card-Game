/* Textured authored terrain, cached per tile at the current projection. */
(function(root){'use strict';
let mats=[],caches=new WeakMap();
function poly(g,p,fill,stroke,lw=1){g.beginPath();p.forEach((q,i)=>i?g.lineTo(q.x,q.y):g.moveTo(q.x,q.y));g.closePath();if(fill){g.fillStyle=fill;g.fill()}if(stroke){g.strokeStyle=stroke;g.lineWidth=lw;g.stroke()}}
function triangle(g,img,p,uv){let [a,b,c]=uv,[A,B,D]=p,d=a.x*(b.y-c.y)+b.x*(c.y-a.y)+c.x*(a.y-b.y);if(Math.abs(d)<1e-8)return;let aa=(A.x*(b.y-c.y)+B.x*(c.y-a.y)+D.x*(a.y-b.y))/d,cc=(A.x*(c.x-b.x)+B.x*(a.x-c.x)+D.x*(b.x-a.x))/d,ee=(A.x*(b.x*c.y-c.x*b.y)+B.x*(c.x*a.y-a.x*c.y)+D.x*(a.x*b.y-b.x*a.y))/d,bb=(A.y*(b.y-c.y)+B.y*(c.y-a.y)+D.y*(a.y-b.y))/d,dd=(A.y*(c.x-b.x)+B.y*(a.x-c.x)+D.y*(b.x-a.x))/d,ff=(A.y*(b.x*c.y-c.x*b.y)+B.y*(c.x*a.y-a.x*c.y)+D.y*(a.x*b.y-b.x*a.y))/d;g.save();poly(g,p);g.clip();g.transform(aa,bb,cc,dd,ee,ff);g.drawImage(img,0,0);g.restore()}
function texture(g,img,p,u,v,w,h){let uv=[{x:u,y:v},{x:u+w,y:v},{x:u+w,y:v+h},{x:u,y:v+h}];triangle(g,img,[p[0],p[1],p[2]],[uv[0],uv[1],uv[2]]);triangle(g,img,[p[0],p[2],p[3]],[uv[0],uv[2],uv[3]])}

const offsets=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]],edges=[[1,0,1,2,0,3],[0,1,2,3,1,0],[-1,0,3,0,2,1],[0,-1,0,1,3,2]];
function geometry(map,t,point,depth){const c=t.surfaceCorners,p=offsets.map(([x,y],i)=>point(t.x+x,t.y+y,c[i])),faces=[],meta=[],fft=map.style==='fft',base=fft?(map.baseDepth??-3):-1;
for(const [dx,dy,a,b,na,nb]of edges){if(depth(t.x+dx*.5,t.y+dy*.5)<=depth(t.x,t.y))continue;const n=root.TacticsCore.at(map,t.x+dx,t.y+dy),nc=n&&!n.void?n.surfaceCorners:[base,base,base,base];if(c[a]>nc[na]+.001||c[b]>nc[nb]+.001){const f=[p[a],p[b],point(t.x+offsets[b][0],t.y+offsets[b][1],Math.min(c[b],nc[nb])),point(t.x+offsets[a][0],t.y+offsets[a][1],Math.min(c[a],nc[na]))];faces.push(f);meta.push({top:Math.max(c[a],c[b]),bot:Math.min(nc[na],nc[nb]),edge:!n||n.void,side:(f[1].x-f[0].x)*(f[1].y-f[0].y)>0?'R':'L'})}}
return {p,faces,meta};}
const GROUND_KIND={stairs:'stone',bridge:'stone',stone:'stone',rubble:'rubble',sand:'sand',ash:'ash',snow:'snow',thinsnow:'snow',ice:'ice',cave:'cave',crystal:'crystal-floor',rail:'rail',mud:'mud',shallow:'shallow',water:'water'},
 GROUND_TINT={stone:'#8f8a76',rubble:'#857c64',sand:'#d8c08a',ash:'#4a4038',snow:'#e8eef0',thinsnow:'#cfd8d2',ice:'#a8cfe0',cave:'#6b5843',crystal:'#4b3a6a',rail:'#55483a',mud:'#5a4630',shallow:'#5ea8a0',water:'#2f6f86'},ground={};
for(const f of new Set(Object.values(GROUND_KIND))){const im=new Image();im.onload=()=>{caches=new WeakMap()};im.src=(document.currentScript?.src?new URL('../assets/tactics/ground/'+f+'.webp',document.currentScript.src).href:'assets/tactics/ground/'+f+'.webp');ground[f]=im}
// ---------- v56 FFT style: grass lips, layered rock walls, contact shadows, blended ground patches, deep diorama base ----------
const GROUP=k=>['grass','tallgrass'].includes(k)?'grass':['path','mud','stairs'].includes(k)?'earth':['shallow','water','ice'].includes(k)?'water':'stone';
function rnd(x,y,i){let h=Math.imul(x*73856093^y*19349663^i*83492791,2654435761)>>>0;return (h%10000)/10000}
const mid=(a,b,f=.5)=>({x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f});
function fillTop(g,t,p){const gk=GROUND_KIND[t.kind],gi=gk&&ground[gk];if(t.kind!=='path'&&!t.route&&gi?.complete&&gi.naturalWidth){poly(g,p,GROUND_TINT[t.kind]||'#777');const n=gi.naturalWidth/4;texture(g,gi,p,(t.x&3)*n,(t.y&3)*n,n,n);return}
 const earth=t.route||['path','mud'].includes(t.kind),idx=earth?1:0;poly(g,p,earth?'#a8915e':'#6f8a44');if(mats[idx])texture(g,mats[idx],p,t.x%16*64,t.y%16*64,64,64);if(t.kind==='tallgrass')poly(g,p,'#3d5a1e55')}
function paintFFT(g,t,p,faces,meta,map){const at=(x,y)=>root.TacticsCore.at(map,x,y),grp=GROUP(t.route?'path':t.kind);
 faces.forEach((f,i)=>{const m=meta[i]||{top:1,bot:0},lv=Math.max(.5,m.top-m.bot),topM=mid(f[0],f[1]),botM=mid(f[3],f[2]);
  poly(g,f,'#6d6450');if(mats[2])texture(g,mats[2],f,(t.x*2+t.y)%6*128,(t.x+t.y*3)%4*96,128,Math.min(900,lv*120));
  // strata: a darker seam with a lit lip at every level
  for(let k=1;k<lv;k++){const fr=k/lv,a=mid(f[0],f[3],fr),b=mid(f[1],f[2],fr);g.strokeStyle='rgba(38,28,18,.42)';g.lineWidth=1.3;g.beginPath();g.moveTo(a.x,a.y);g.lineTo(b.x,b.y);g.stroke();g.strokeStyle='rgba(255,236,200,.10)';g.lineWidth=1;g.beginPath();g.moveTo(a.x,a.y-1.2);g.lineTo(b.x,b.y-1.2);g.stroke()}
  poly(g,f,m.side==='R'?'rgba(18,22,16,.34)':'rgba(255,240,210,.05)');
  // contact shadow at the foot (or fade into the dark plinth on the map edge)
  const gr=g.createLinearGradient(topM.x,topM.y,botM.x,botM.y);if(m.edge){gr.addColorStop(0,'rgba(8,10,8,0)');gr.addColorStop(.35,'rgba(8,10,8,.35)');gr.addColorStop(1,'rgba(6,8,6,.92)')}else{gr.addColorStop(0,'rgba(8,10,8,0)');gr.addColorStop(.6,'rgba(8,10,8,0)');gr.addColorStop(1,'rgba(8,10,8,.42)')}g.save();g.beginPath();f.forEach((q,j)=>j?g.lineTo(q.x,q.y):g.moveTo(q.x,q.y));g.closePath();g.fillStyle=gr;g.fill();g.restore();
  // lip: grass (or dirt) hangs over the top edge with a ragged bottom
  if(grp==='grass'||grp==='earth'){const px=Math.hypot(botM.x-topM.x,botM.y-topM.y)/lv,n=9,band=[];for(let k=0;k<=n;k++){const a=mid(f[0],f[1],k/n);band.push(a)}for(let k=n;k>=0;k--){const a=mid(f[0],f[1],k/n),d=px*(.16+.26*rnd(t.x*13+i,t.y*7+k,3))*(k===0||k===n?.4:1);band.push({x:a.x+(botM.x-topM.x)/Math.hypot(botM.x-topM.x,botM.y-topM.y||1)*d*0,y:a.y+d})}
   g.save();g.beginPath();band.forEach((q,j)=>j?g.lineTo(q.x,q.y):g.moveTo(q.x,q.y));g.closePath();g.clip();const lipQuad=[f[0],f[1],{x:f[1].x,y:f[1].y+px},{x:f[0].x,y:f[0].y+px}];poly(g,lipQuad,grp==='grass'?'#5d7a34':'#9a8256');if(mats[grp==='grass'?0:1])texture(g,mats[grp==='grass'?0:1],lipQuad,t.x%16*64,t.y%16*64,64,40);poly(g,lipQuad,m.side==='R'?'rgba(20,30,10,.22)':'rgba(255,250,210,.06)');g.restore();
   g.strokeStyle=grp==='grass'?'rgba(32,50,14,.65)':'rgba(70,50,28,.6)';g.lineWidth=1.3;g.beginPath();band.slice(n+1).forEach((q,j)=>j?g.lineTo(q.x,q.y):g.moveTo(q.x,q.y));g.stroke()}
  g.strokeStyle='rgba(255,246,210,.28)';g.lineWidth=1;g.beginPath();g.moveTo(f[0].x,f[0].y);g.lineTo(f[1].x,f[1].y);g.stroke()});
 // top
 fillTop(g,t,p);
 if(t.kind==='shallow'){poly(g,p,'rgba(120,200,190,.18)');g.strokeStyle='rgba(220,245,235,.35)';g.lineWidth=.9;for(let k=0;k<2;k++){const a=mid(p[0],p[3],.3+.4*k),b=mid(p[1],p[2],.3+.4*k);g.beginPath();g.moveTo(a.x,a.y);g.quadraticCurveTo((a.x+b.x)/2,(a.y+b.y)/2-2,b.x,b.y);g.stroke()}}
 // organic patches: neighbouring ground of another kind (same height) bleeds in as rounded blobs — no hard tile seams
 const E=[[0,-1,0,1],[1,0,1,2],[0,1,2,3],[-1,0,3,0]];for(const [dx,dy,a,b] of E){const n=at(t.x+dx,t.y+dy);if(!n||n.void||n.cliff||Math.abs(n.h-t.h)>.01||GROUP(n.route?'path':n.kind)===grp||t.ramp||n.ramp)continue;
  const A=p[a],B=p[b],C0=mid(p[0],p[2]);g.save();g.beginPath();p.forEach((q,j)=>j?g.lineTo(q.x,q.y):g.moveTo(q.x,q.y));g.closePath();g.clip();g.beginPath();
  for(let k=0;k<3;k++){const along=mid(A,B,.18+.32*k+(rnd(t.x,t.y,k+dx*5+dy*9)-.5)*.12),inward=.08+.22*rnd(t.x+dx,t.y+dy,k),c=mid(along,C0,inward),r=Math.hypot(B.x-A.x,B.y-A.y)*(.13+.12*rnd(n.x,n.y,k));g.moveTo(c.x+r,c.y);g.ellipse(c.x,c.y,r,r*.55,0,0,Math.PI*2)}
  g.clip();fillTop(g,n,p);g.restore()}
 // terrace brightness: higher = a touch brighter (reads like FFT's lit plateaus)
 poly(g,p,t.h>0?`rgba(255,246,222,${Math.min(.16,.026*t.h)})`:'rgba(10,20,10,.06)');
 if(t.ramp==='steps'){let c=t.surfaceCorners,west=Math.abs(c[0]-c[1])>.01;for(let j=1;j<4;j++){let f=j/4,a=west?[0,1]:[0,3],b=west?[3,2]:[1,2];g.strokeStyle='rgba(60,46,30,.55)';g.lineWidth=1.2;g.beginPath();g.moveTo(p[a[0]].x*(1-f)+p[a[1]].x*f,p[a[0]].y*(1-f)+p[a[1]].y*f);g.lineTo(p[b[0]].x*(1-f)+p[b[1]].x*f,p[b[0]].y*(1-f)+p[b[1]].y*f);g.stroke()}}}
function paint(g,t,p,faces){
for(const f of faces){poly(g,f,'#817b64');if(mats[2])texture(g,mats[2],f,(t.x+t.y)%6*128,0,128,512);poly(g,f,'#17271b30');}
// FFT-style cliff tile: the whole top is an inclined rock face from the upper lip down to the ground, lit by its slope.
if(t.cliff){const c=t.surfaceCorners,hi=Math.max(...c),lo=Math.min(...c);poly(g,p,'#7b735f');if(mats[2])texture(g,mats[2],p,(t.x*3+t.y)%6*128,96,128,320);
 const nx=(c[0]+c[3])-(c[1]+c[2]),ny=(c[0]+c[1])-(c[3]+c[2]),light=(-nx*.6-ny*.8)/Math.max(.01,Math.hypot(nx,ny));poly(g,p,light>0?`rgba(255,240,200,${.10*light})`:`rgba(10,18,14,${-.30*light})`);
 g.strokeStyle='#5d7a3acc';g.lineWidth=2.4;g.lineCap='round';for(let i=0;i<4;i++){const j=(i+1)%4;if(c[i]>lo+.5&&c[j]>lo+.5&&Math.abs(c[i]-hi)<.01&&Math.abs(c[j]-hi)<.01){g.beginPath();g.moveTo(p[i].x,p[i].y);g.lineTo(p[j].x,p[j].y);g.stroke()}}
 return}
const water=t.kind==='water';
// v52: every tile kind of every theme. Grass and dirt keep the painted hill atlas; the rest use the battle ground set.
const gk=GROUND_KIND[t.kind],gi=gk&&ground[gk];
if(gi?.complete&&gi.naturalWidth){let q=p;if(t.kind==='rail'&&t.railAxis==='y')q=[p[1],p[2],p[3],p[0]];poly(g,q,GROUND_TINT[t.kind]||'#777');const n=gi.naturalWidth/4;texture(g,gi,q,(t.x&3)*n,(t.y&3)*n,n,n);if(t.kind==='tallgrass')poly(g,p,'#2f4a1a40')}
else{const earth=t.route||['path','mud'].includes(t.kind),idx=earth?1:0;poly(g,p,water?'#477f83':GROUND_TINT[t.kind]||(earth?'#baab78':'#7d8f4e'));if(!water&&mats[idx])texture(g,mats[idx],p,t.x%16*64,t.y%16*64,64,64);}
if(t.kind==='tallgrass')poly(g,p,'#536b2c30');if(t.kind==='mud')poly(g,p,'#57463355');
if(water){poly(g,p,'#4a9b9b30');g.strokeStyle='#bdd6bd77';g.lineWidth=1;g.beginPath();g.moveTo((p[0].x+p[3].x)/2,(p[0].y+p[3].y)/2);g.lineTo((p[1].x+p[2].x)/2,(p[1].y+p[2].y)/2);g.stroke();}
if(t.ramp==='steps'||t.bridge){let c=t.surfaceCorners,west=Math.abs(c[0]-c[1])>.01;for(let j=1;j<4;j++){let f=j/4,a=west?[0,1]:[0,3],b=west?[3,2]:[1,2];g.strokeStyle='#62594499';g.lineWidth=1;g.beginPath();g.moveTo(p[a[0]].x*(1-f)+p[a[1]].x*f,p[a[0]].y*(1-f)+p[a[1]].y*f);g.lineTo(p[b[0]].x*(1-f)+p[b[1]].x*f,p[b[0]].y*(1-f)+p[b[1]].y*f);g.stroke();}}
if(t.flowers){for(let i=0;i<3;i++){let x=(p[0].x+p[2].x)/2+(i-1)*3,y=(p[0].y+p[2].y)/2;g.fillStyle=i===1?'#dcb474':'#d9d8bd';g.beginPath();g.arc(x,y-i%2*2,1.4,0,7);g.fill();}}
}
function drawTile(ctx,map,t,point,depth){if(t.void)return;const anchor=point(t.x,t.y,0),local=(x,y,z)=>{let p=point(x,y,z);return {x:p.x-anchor.x,y:p.y-anchor.y}},geom=geometry(map,t,local,depth),fft=map.style==='fft',nsig=fft?[[0,-1],[1,0],[0,1],[-1,0]].map(([dx,dy])=>{const n=root.TacticsCore.at(map,t.x+dx,t.y+dy);return n?n.kind+n.h+(n.route?'r':''):'-'}).join():'',signature=JSON.stringify([geom,nsig,t.route,t.ramp,t.cliff,t.kind,t.bridge,t.flowers,mats.filter(Boolean).length],(k,v)=>typeof v==='number'?Math.round(v*10000)/10000:v);let cache=caches.get(map);if(!cache){cache=new Map();caches.set(map,cache)}let old=cache.get(t);
if(!old||old.signature!==signature){if(old){old.img.width=old.img.height=1}const all=[...geom.p,...geom.faces.flat()],x=Math.floor(Math.min(...all.map(p=>p.x)))-2,y=Math.floor(Math.min(...all.map(p=>p.y)))-2,w=Math.ceil(Math.max(...all.map(p=>p.x))-x)+2,h=Math.ceil(Math.max(...all.map(p=>p.y))-y)+2,img=document.createElement('canvas');img.width=Math.max(1,w);img.height=Math.max(1,h);const g=img.getContext('2d');g.translate(-x,-y);if(fft)paintFFT(g,t,geom.p,geom.faces,geom.meta,map);else paint(g,t,geom.p,geom.faces);old={signature,img,x,y};cache.set(t,old)}ctx.drawImage(old.img,anchor.x+old.x,anchor.y+old.y);}
const atlas=new Image();atlas.onload=()=>{for(let q=0;q<4;q++){const c=document.createElement('canvas');c.width=c.height=1024;const g=c.getContext('2d');for(let y=0;y<2;y++)for(let x=0;x<2;x++){g.save();g.translate(x?1024:0,y?1024:0);g.scale(x?-1:1,y?-1:1);g.drawImage(atlas,q%2*atlas.width/2,Math.floor(q/2)*atlas.height/2,atlas.width/2,atlas.height/2,0,0,512,512);g.restore()}const im=new Image();im.onload=()=>{mats[q]=im;caches=new WeakMap()};im.src=c.toDataURL('image/png');c.width=c.height=1}caches=new WeakMap()};atlas.src=document.currentScript?.src?new URL('../assets/terrain/hill-textures.jpg',document.currentScript.src).href:'assets/terrain/hill-textures.jpg';
root.TacticsHillArt={drawTile,geometry,get ready(){return mats.filter(Boolean).length===4}};
})(globalThis);
