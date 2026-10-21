/* v56 · FFT-style random terrain (preview: forest). Rules, then a map:
   1. Height field from smooth noise, cut into terraces → big plateaus with natural ragged outlines, not per-tile speckle.
      Levels map to heights 0,1,3,4,6 so neighbouring terraces are either a walkable step (1) or a cliff (2+).
   2. Majority smoothing and tiny-island removal keep plateaus chunky.
   3. Every plateau is joined to the start by stairs cut into the cliff (one level per tile) — the map is always fully walkable.
   4. Ground kinds are blended patches (dirt, moss/tall grass, shallow water in the lowest basins) + a worn path linking both camps.
   5. Few, large props: trees on plateau rims, rocks at cliff feet, fallen logs — never cutting a route.
   Drawn by TacticsHillArt with style 'fft' (grass lips, layered rock walls, contact shadow, thick diorama base). */
(function(root){'use strict';
const HEIGHTS=[0,1,3,4,6];
function rng(seed){let h=2166136261;for(const c of String(seed))h=Math.imul(h^c.charCodeAt(0),16777619);return ()=>{h+=0x6D2B79F5;let t=h;t=Math.imul(t^t>>>15,t|1);t^=t+Math.imul(t^t>>>7,t|61);return ((t^t>>>14)>>>0)/4294967296}}
function noise(seed,W,H,scale){const r=rng(seed),gw=Math.ceil(W/scale)+2,gh=Math.ceil(H/scale)+2,g=Array.from({length:gw*gh},r),s=t=>t*t*(3-2*t);
 return (x,y)=>{const fx=x/scale,fy=y/scale,ix=Math.floor(fx),iy=Math.floor(fy),tx=s(fx-ix),ty=s(fy-iy),v=(a,b)=>g[(iy+b)*gw+ix+a];return (v(0,0)*(1-tx)+v(1,0)*tx)*(1-ty)+(v(0,1)*(1-tx)+v(1,1)*tx)*ty}}
function create(seed='FFT-01',mode='training'){
 const W=mode==='battle'?23:18,H=mode==='battle'?24:19,R=rng(seed+'|fft'),tiles=[],at=(x,y)=>x>=0&&y>=0&&x<W&&y<H?tiles[y*W+x]:null,key=(x,y)=>x+','+y,N4=[[1,0],[-1,0],[0,1],[0,-1]];
 const n1=noise(seed+'|h1',W,H,7),n2=noise(seed+'|h2',W,H,3.5),n3=noise(seed+'|h3',W,H,4),n4=noise(seed+'|h4',W,H,5);
 // 1. terraces (camps sit lower so battles start on open ground and climb)
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){let f=n1(x,y)*.75+n2(x,y)*.25;const camp=Math.min(Math.abs(y-(H-2)),Math.abs(y-1));f-=Math.max(0,3-camp)*.08;const L=Math.max(0,Math.min(4,Math.floor(f*5.4-.6)));tiles.push({x,y,L,h:0,kind:'grass',prop:null,blocked:false,variation:((x*71+y*37)%101)/101})}
 // 2. majority smoothing + island removal
 for(let pass=0;pass<3;pass++){const next=tiles.map(t=>{const c={};for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const n=at(t.x+dx,t.y+dy);if(n)c[n.L]=(c[n.L]||0)+1}const [best,count]=Object.entries(c).sort((a,b)=>b[1]-a[1])[0];return count>=5&&+best!==t.L?+best:t.L});tiles.forEach((t,i)=>t.L=next[i])}
 const seen=new Set();for(const t of tiles){if(seen.has(t))continue;const comp=[t],q=[t];seen.add(t);while(q.length){const c=q.pop();for(const[dx,dy]of N4){const n=at(c.x+dx,c.y+dy);if(n&&!seen.has(n)&&n.L===t.L){seen.add(n);comp.push(n);q.push(n)}}}
  if(comp.length<5){const around={};for(const c of comp)for(const[dx,dy]of N4){const n=at(c.x+dx,c.y+dy);if(n&&n.L!==t.L)around[n.L]=(around[n.L]||0)+1}const to=Object.entries(around).sort((a,b)=>b[1]-a[1])[0];if(to)comp.forEach(c=>c.L=+to[0])}}
 tiles.forEach(t=>{t.h=HEIGHTS[t.L]});
 // camps
 const pickCamp=(cy,n)=>{const out=[],cx=Math.floor(W/2),order=tiles.slice().sort((a,b)=>(Math.abs(a.y-cy)*1.6+Math.abs(a.x-cx))-(Math.abs(b.y-cy)*1.6+Math.abs(b.x-cx)));const base=order[0].h;for(const t of order){if(out.length>=n)break;if(t.h===base)out.push(t)}return out};
 let allies=pickCamp(H-2,5),enemies=pickCamp(1,10);
 // 3. connect: BFS by the |dh|<=1 walk rule; cut stairs into the cliff toward unreachable plateaus
 const walk=(a,b)=>!a.blocked&&!b.blocked&&Math.abs(a.h-b.h)<=1;
 const flood=()=>{const s=new Set([allies[0]]),q=[allies[0]];while(q.length){const c=q.pop();for(const[dx,dy]of N4){const n=at(c.x+dx,c.y+dy);if(n&&!s.has(n)&&walk(c,n)){s.add(n);q.push(n)}}}return s};
 const ramp=(cells,from,to)=>{const dir=[cells[0].x-from.x,cells[0].y-from.y];cells.forEach((c,i)=>{const lo=from.h+(to-from.h)*i/cells.length,hi=from.h+(to-from.h)*(i+1)/cells.length,mid=Math.round(from.h+(to-from.h)*(i+1)/(cells.length+1)*1);c.h=Math.round((lo+hi)/2);c.kind='path';c.route=true;c.ramp='steps';c.rampDir=dir;c.rampFrom=lo;c.rampTo=hi;c.L=-1})};
 for(let guard=0;guard<80;guard++){const reach=flood(),lost=tiles.filter(t=>!reach.has(t)&&!t.blocked);if(!lost.length)break;
  // all candidate (reachable a) → (lost b) contacts, shortest climb first
  const cand=[];for(const b of lost)for(const[dx,dy]of N4){const a=at(b.x-dx,b.y-dy);if(a&&reach.has(a))cand.push({a,b,dx,dy,d:Math.abs(b.h-a.h)})}cand.sort((p,q)=>p.d-q.d||R()-.5);let done=false;
  for(const {a,b,dx,dy,d} of cand){const steps=d-1,cells=[];let ok=true;for(let k=0;k<steps;k++){const c=at(b.x+dx*k,b.y+dy*k);if(!c||c.h!==b.h||reach.has(c)||c.ramp){ok=false;break}cells.push(c)}const land=at(b.x+dx*steps,b.y+dy*steps);if(!ok||!land||land.h!==b.h)continue;
   if(!cells.length){done=true;break}ramp(cells,a,b.h);done=true;break}
  if(!done){const c=cand[0];if(!c)break;c.b.h=c.a.h+Math.sign(c.b.h-c.a.h);c.b.L=-1}}
 // 4. ground: dirt + moss patches, shallow water in low basins, a worn path between camps
 for(const t of tiles){if(t.ramp)continue;const g=n3(t.x,t.y),w=n4(t.x,t.y);if(t.h===0&&w>.66)t.kind='shallow';else if(g>.7)t.kind='path';else if(g<.22)t.kind='tallgrass';else if(t.h>=4&&g>.58)t.kind='stone'}
 {const goal=enemies[0],dist=new Map([[allies[0],0]]),prev=new Map(),open=[allies[0]];while(open.length){open.sort((a,b)=>dist.get(a)-dist.get(b));const c=open.shift();if(c===goal)break;for(const[dx,dy]of N4){const n=at(c.x+dx,c.y+dy);if(!n||!walk(c,n))continue;const cost=dist.get(c)+1+Math.abs(n.h-c.h)*.6+(n.kind==='shallow'?3:0);if(cost<(dist.get(n)??Infinity)){dist.set(n,cost);prev.set(n,c);open.push(n)}}}
  for(let c=goal;c;c=prev.get(c))if(c.kind!=='shallow'){c.kind='path';c.route=true}}
 // 5. props — few and large, never cutting the map apart
 const camp=new Set([...allies,...enemies]),total=()=>tiles.filter(t=>!t.blocked).length;
 const tryProp=(t,prop,height)=>{if(t.blocked||t.prop||t.route||t.ramp||camp.has(t)||t.kind==='shallow')return false;Object.assign(t,{prop,blocked:true,obstacleHeight:height});const r=flood();if(r.size!==total()){Object.assign(t,{prop:null,blocked:false,obstacleHeight:undefined});return false}return true};
 const rim=t=>N4.some(([dx,dy])=>{const n=at(t.x+dx,t.y+dy);return n&&n.h<=t.h-2}),foot=t=>N4.some(([dx,dy])=>{const n=at(t.x+dx,t.y+dy);return n&&n.h>=t.h+2});
 const order=tiles.slice().sort(()=>R()-.5),limit=Math.round(W*H/38);let placed=0;
 for(const t of order){if(placed>=limit)break;if(rim(t)&&R()<.35&&tryProp(t,R()<.5?'tree':'pine',2))placed++;else if(foot(t)&&R()<.3&&tryProp(t,R()<.6?'mossrock':'rock',1))placed++;else if(!rim(t)&&!foot(t)&&R()<.04&&tryProp(t,R()<.5?'log':'bush',1))placed++}
 // ramp tiles: tilted tops along the climb; everything else flat
 for(const t of tiles){if(t.ramp){const [dx,dy]=t.rampDir,off=[[-.5,-.5],[.5,-.5],[.5,.5],[-.5,.5]];t.surfaceCorners=off.map(([ox,oy])=>{const s=ox*dx+oy*dy;return s<0?t.rampFrom:s>0?t.rampTo:(t.rampFrom+t.rampTo)/2})}else t.surfaceCorners=[t.h,t.h,t.h,t.h];delete t.L}
 allies=allies.filter(t=>!t.blocked);enemies=enemies.filter(t=>!t.blocked);
 const P=t=>({x:t.x,y:t.y});
 return {size:Math.max(W,H),width:W,height:H,tiles,objects:[],seed:String(seed),theme:'forest',style:'fft',hillArt:true,stepRule:'height',baseDepth:-3,mode,clearance:[1,1],start:P(allies[0]),enemy:P(enemies[0]),spawns:{allies:allies.map(P),enemies:enemies.map(P)}}}
root.TacticsFFTTerrain={create,HEIGHTS};if(typeof module!=='undefined')module.exports=root.TacticsFFTTerrain;
})(globalThis);
