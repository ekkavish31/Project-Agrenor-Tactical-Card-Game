/* Textured authored terrain, cached per tile at the current projection. */
(function(root){'use strict';
let mats=[],caches=new WeakMap();
function poly(g,p,fill,stroke,lw=1){g.beginPath();p.forEach((q,i)=>i?g.lineTo(q.x,q.y):g.moveTo(q.x,q.y));g.closePath();if(fill){g.fillStyle=fill;g.fill()}if(stroke){g.strokeStyle=stroke;g.lineWidth=lw;g.stroke()}}
function triangle(g,img,p,uv){let [a,b,c]=uv,[A,B,D]=p,d=a.x*(b.y-c.y)+b.x*(c.y-a.y)+c.x*(a.y-b.y);if(Math.abs(d)<1e-8)return;let aa=(A.x*(b.y-c.y)+B.x*(c.y-a.y)+D.x*(a.y-b.y))/d,cc=(A.x*(c.x-b.x)+B.x*(a.x-c.x)+D.x*(b.x-a.x))/d,ee=(A.x*(b.x*c.y-c.x*b.y)+B.x*(c.x*a.y-a.x*c.y)+D.x*(a.x*b.y-b.x*a.y))/d,bb=(A.y*(b.y-c.y)+B.y*(c.y-a.y)+D.y*(a.y-b.y))/d,dd=(A.y*(c.x-b.x)+B.y*(a.x-c.x)+D.y*(b.x-a.x))/d,ff=(A.y*(b.x*c.y-c.x*b.y)+B.y*(c.x*a.y-a.x*c.y)+D.y*(a.x*b.y-b.x*a.y))/d;g.save();poly(g,p);g.clip();g.transform(aa,bb,cc,dd,ee,ff);g.drawImage(img,0,0);g.restore()}
function texture(g,img,p,u,v,w,h){let uv=[{x:u,y:v},{x:u+w,y:v},{x:u+w,y:v+h},{x:u,y:v+h}];triangle(g,img,[p[0],p[1],p[2]],[uv[0],uv[1],uv[2]]);triangle(g,img,[p[0],p[2],p[3]],[uv[0],uv[2],uv[3]])}

const offsets=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]],edges=[[1,0,1,2,0,3],[0,1,2,3,1,0],[-1,0,3,0,2,1],[0,-1,0,1,3,2]];
function geometry(map,t,point,depth){const c=t.surfaceCorners,p=offsets.map(([x,y],i)=>point(t.x+x,t.y+y,c[i])),faces=[];
for(const [dx,dy,a,b,na,nb]of edges){if(depth(t.x+dx*.5,t.y+dy*.5)<=depth(t.x,t.y))continue;const n=root.TacticsCore.at(map,t.x+dx,t.y+dy),nc=n&&!n.void?n.surfaceCorners:[-1,-1,-1,-1];if(c[a]>nc[na]+.001||c[b]>nc[nb]+.001)faces.push([p[a],p[b],point(t.x+offsets[b][0],t.y+offsets[b][1],Math.min(c[b],nc[nb])),point(t.x+offsets[a][0],t.y+offsets[a][1],Math.min(c[a],nc[na]))]);}
return {p,faces};}
function paint(g,t,p,faces){
for(const f of faces){poly(g,f,'#817b64');if(mats[2])texture(g,mats[2],f,(t.x+t.y)%6*128,0,128,512);poly(g,f,'#17271b30');}
// FFT-style cliff tile: the whole top is an inclined rock face from the upper lip down to the ground, lit by its slope.
if(t.cliff){const c=t.surfaceCorners,hi=Math.max(...c),lo=Math.min(...c);poly(g,p,'#7b735f');if(mats[2])texture(g,mats[2],p,(t.x*3+t.y)%6*128,96,128,320);
 const nx=(c[0]+c[3])-(c[1]+c[2]),ny=(c[0]+c[1])-(c[3]+c[2]),light=(-nx*.6-ny*.8)/Math.max(.01,Math.hypot(nx,ny));poly(g,p,light>0?`rgba(255,240,200,${.10*light})`:`rgba(10,18,14,${-.30*light})`);
 g.strokeStyle='#5d7a3acc';g.lineWidth=2.4;g.lineCap='round';for(let i=0;i<4;i++){const j=(i+1)%4;if(c[i]>lo+.5&&c[j]>lo+.5&&Math.abs(c[i]-hi)<.01&&Math.abs(c[j]-hi)<.01){g.beginPath();g.moveTo(p[i].x,p[i].y);g.lineTo(p[j].x,p[j].y);g.stroke()}}
 return}
const water=t.kind==='water',stone=['stone','rubble'].includes(t.kind),earth=t.route||['path','mud'].includes(t.kind),idx=stone?3:earth?1:0;
poly(g,p,water?'#477f83':stone?'#939179':earth?'#baab78':'#7d8f4e');if(!water&&mats[idx])texture(g,mats[idx],p,t.x%16*64,t.y%16*64,64,64);
if(t.kind==='tallgrass')poly(g,p,'#536b2c30');if(t.kind==='snow')poly(g,p,'#eef3e3b0');if(t.kind==='mud')poly(g,p,'#57463355');
if(water){poly(g,p,'#4a9b9b30');g.strokeStyle='#bdd6bd77';g.lineWidth=1;g.beginPath();g.moveTo((p[0].x+p[3].x)/2,(p[0].y+p[3].y)/2);g.lineTo((p[1].x+p[2].x)/2,(p[1].y+p[2].y)/2);g.stroke();}
if(t.ramp==='steps'||t.bridge){let c=t.surfaceCorners,west=Math.abs(c[0]-c[1])>.01;for(let j=1;j<4;j++){let f=j/4,a=west?[0,1]:[0,3],b=west?[3,2]:[1,2];g.strokeStyle='#62594499';g.lineWidth=1;g.beginPath();g.moveTo(p[a[0]].x*(1-f)+p[a[1]].x*f,p[a[0]].y*(1-f)+p[a[1]].y*f);g.lineTo(p[b[0]].x*(1-f)+p[b[1]].x*f,p[b[0]].y*(1-f)+p[b[1]].y*f);g.stroke();}}
if(t.flowers){for(let i=0;i<3;i++){let x=(p[0].x+p[2].x)/2+(i-1)*3,y=(p[0].y+p[2].y)/2;g.fillStyle=i===1?'#dcb474':'#d9d8bd';g.beginPath();g.arc(x,y-i%2*2,1.4,0,7);g.fill();}}
}
function drawTile(ctx,map,t,point,depth){if(t.void)return;const anchor=point(t.x,t.y,0),local=(x,y,z)=>{let p=point(x,y,z);return {x:p.x-anchor.x,y:p.y-anchor.y}},geom=geometry(map,t,local,depth),signature=JSON.stringify([geom,t.cliff,t.kind,t.bridge,t.flowers,mats.filter(Boolean).length],(k,v)=>typeof v==='number'?Math.round(v*10000)/10000:v);let cache=caches.get(map);if(!cache){cache=new Map();caches.set(map,cache)}let old=cache.get(t);
if(!old||old.signature!==signature){if(old){old.img.width=old.img.height=1}const all=[...geom.p,...geom.faces.flat()],x=Math.floor(Math.min(...all.map(p=>p.x)))-2,y=Math.floor(Math.min(...all.map(p=>p.y)))-2,w=Math.ceil(Math.max(...all.map(p=>p.x))-x)+2,h=Math.ceil(Math.max(...all.map(p=>p.y))-y)+2,img=document.createElement('canvas');img.width=Math.max(1,w);img.height=Math.max(1,h);const g=img.getContext('2d');g.translate(-x,-y);paint(g,t,geom.p,geom.faces);old={signature,img,x,y};cache.set(t,old)}ctx.drawImage(old.img,anchor.x+old.x,anchor.y+old.y);}
const atlas=new Image();atlas.onload=()=>{for(let q=0;q<4;q++){const c=document.createElement('canvas');c.width=c.height=1024;const g=c.getContext('2d');for(let y=0;y<2;y++)for(let x=0;x<2;x++){g.save();g.translate(x?1024:0,y?1024:0);g.scale(x?-1:1,y?-1:1);g.drawImage(atlas,q%2*atlas.width/2,Math.floor(q/2)*atlas.height/2,atlas.width/2,atlas.height/2,0,0,512,512);g.restore()}const im=new Image();im.onload=()=>{mats[q]=im;caches=new WeakMap()};im.src=c.toDataURL('image/png');c.width=c.height=1}caches=new WeakMap()};atlas.src=document.currentScript?.src?new URL('../assets/terrain/hill-textures.jpg',document.currentScript.src).href:'assets/terrain/hill-textures.jpg';
root.TacticsHillArt={drawTile,geometry,get ready(){return mats.filter(Boolean).length===4}};
})(globalThis);
