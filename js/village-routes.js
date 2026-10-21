// v05: running routes on the village map.
// Developer → "จัดตำแหน่งแผนที่หมู่บ้าน" now has tools to draw a road network, erase points,
// test-run and set the run speed. Travel follows the shortest path along the drawn roads
// (straight line when nothing is drawn), kicks up a little dust, and stops facing front.
const VROUTE_KEY='everyday-village-routes-v1';
function emptyVillageRoutes(){return {version:1,nodes:[],edges:[],curves:{},speed:22}}
function validVillageRoutes(r){if(!r||r.version!==1||!Array.isArray(r.nodes)||!Array.isArray(r.edges))throw Error('รูปแบบเส้นทางแผนที่ไม่ถูกต้อง');let ok=v=>Number.isFinite(v)&&v>=0&&v<=100;if(r.nodes.length>300||!r.nodes.every(n=>ok(n?.x)&&ok(n?.y)))throw Error('จุดเส้นทางไม่ถูกต้อง');if(!r.edges.every(e=>Array.isArray(e)&&e.length===2&&e.every(i=>Number.isInteger(i)&&i>=0&&i<r.nodes.length)&&e[0]!==e[1]))throw Error('เส้นเชื่อมไม่ถูกต้อง');let speed=Number(r.speed);let curves={};for(let [k,c] of Object.entries(r.curves||{})){let m=/^(\d+),(\d+)$/.exec(k);if(m&&+m[1]<r.nodes.length&&+m[2]<r.nodes.length&&ok(c?.x)&&ok(c?.y))curves[k]={x:+c.x,y:+c.y}}return {version:1,nodes:r.nodes.map(n=>({x:+n.x,y:+n.y})),edges:r.edges.map(e=>[e[0],e[1]]),curves,speed:Number.isFinite(speed)?Math.max(6,Math.min(80,speed)):22}}
let villageRoutes=emptyVillageRoutes();
try{let saved=localStorage.getItem(VROUTE_KEY);villageRoutes=validVillageRoutes(saved?JSON.parse(saved):typeof DEFAULT_VILLAGE_ROUTES!=='undefined'?DEFAULT_VILLAGE_ROUTES:emptyVillageRoutes())}catch(e){villageRoutes=emptyVillageRoutes()}
function saveVillageRoutes(msg){try{localStorage.setItem(VROUTE_KEY,JSON.stringify(villageRoutes));if($('mapStatus'))$('mapStatus').textContent=msg||'✓ บันทึกเส้นทางแล้ว'}catch(e){if($('mapStatus'))$('mapStatus').textContent='บันทึกไม่ได้: '+e.message}drawVillageRouteOverlay()}

// Distance in map units (percent of map width) so diagonal speed matches the image aspect.
function mapAspect(){let m=$('villageMap');if(!m)return 1;let r=m.getBoundingClientRect();return r.width?r.height/r.width:1}
function mapDist(a,b){let k=mapAspect();return Math.hypot(a.x-b.x,(a.y-b.y)*k)}
const ekey=(a,b)=>a<b?a+','+b:b+','+a;
function curveOf(a,b){return villageRoutes.curves?.[ekey(a,b)]||null}
function bez(a,c,b,t){let u=1-t;return {x:u*u*a.x+2*u*t*c.x+t*t*b.x,y:u*u*a.y+2*u*t*c.y+t*t*b.y}}
function edgePoints(a,b,steps=10){let A=villageRoutes.nodes[a],B=villageRoutes.nodes[b],c=curveOf(a,b);if(!c)return [A,B];let out=[];for(let i=0;i<=steps;i++)out.push(bez(A,c,B,i/steps));return out}
function edgeLength(a,b){let pts=edgePoints(a,b),L=0;for(let i=1;i<pts.length;i++)L+=mapDist(pts[i-1],pts[i]);return L}
function villageRoutePath(from,to){let R=villageRoutes,n=R.nodes.length;if(n<2||!R.edges.length||mapDist(from,to)<3)return [from,to];
 let near=p=>{let best=-1,d=Infinity;R.nodes.forEach((q,i)=>{let v=mapDist(p,q);if(v<d){d=v;best=i}});return best},a=near(from),b=near(to);
 let dist=Array(n).fill(Infinity),prev=Array(n).fill(-1),done=Array(n).fill(false),adj=Array.from({length:n},()=>[]);for(let [u,v] of R.edges){let w=edgeLength(u,v);adj[u].push([v,w]);adj[v].push([u,w])}dist[a]=0;
 for(;;){let u=-1;for(let i=0;i<n;i++)if(!done[i]&&dist[i]<Infinity&&(u<0||dist[i]<dist[u]))u=i;if(u<0||u===b)break;done[u]=true;for(let [v,w] of adj[u])if(dist[u]+w<dist[v]){dist[v]=dist[u]+w;prev[v]=u}}
 if(dist[b]===Infinity)return [from,to];let ids=[];for(let u=b;u>=0;u=prev[u])ids.unshift(u);let pts=[from,R.nodes[ids[0]]];for(let i=1;i<ids.length;i++)pts.push(...edgePoints(ids[i-1],ids[i]).slice(1));pts.push(to);return pts}

function mapDust(p,dir){let m=$('villageMap');if(!m||reduced)return;let d=document.createElement('i');d.className='map-dust';d.style.left=p.x+'%';d.style.top=p.y+'%';m.appendChild(d);animate(d,[{opacity:.95,transform:'translate(-50%,-50%) scale(.5)'},{opacity:0,transform:`translate(calc(-50% + ${-dir*16}px),calc(-50% - 10px)) scale(1.8)`}],{duration:600,easing:'ease-out'}).then(()=>d.remove())}
// Frame-stepped runner so the destination can change mid-run (re-routes from where the hero is now).
let mapRun=null;
function runMapTo(target,onArrive){let avatar=$('mapAvatar'),img=$('mapRunner');let cur={x:parseFloat(avatar.style.left),y:parseFloat(avatar.style.top)};
 let run={target,path:villageRoutePath(cur,target).slice(1),last:performance.now(),dustAt:0,done:null};run.promise=new Promise(r=>run.done=r);mapRun=run;
 let step=now=>{if(mapRun!==run)return run.done(false);let dt=Math.min(.05,(now-run.last)/1000);run.last=now;let move=(reduced?villageRoutes.speed*6:villageRoutes.speed)*dt;
  while(move>0&&run.path.length){let next=run.path[0],d=mapDist(cur,next);if(d<.0001){run.path.shift();continue}let dir=next.x<cur.x-.05?-1:next.x>cur.x+.05?1:0;if(dir)img.style.transform=dir<0?'scaleX(-1)':'scaleX(1)';if(d<=move){cur={...next};run.path.shift();move-=d}else{let f=move/d;cur={x:cur.x+(next.x-cur.x)*f,y:cur.y+(next.y-cur.y)*f};move=0}}
  avatar.style.left=cur.x+'%';avatar.style.top=cur.y+'%';run.cur=cur;
  if(now-run.dustAt>90&&run.path.length){run.dustAt=now;let back=img.style.transform.includes('-1')?1:-1;mapDust({x:cur.x+back*1.2,y:cur.y-.6},-back)}
  if(!run.path.length){mapRun=null;return run.done(true)}requestAnimationFrame(step)};
 requestAnimationFrame(step);return run.promise}
function retargetMapRun(target){if(!mapRun)return false;let avatar=$('mapAvatar'),cur={x:parseFloat(avatar.style.left),y:parseFloat(avatar.style.top)};mapRun.target=target;mapRun.path=villageRoutePath(cur,target).slice(1);return true}
async function runMapPath(path){let to=path.at(-1);await runMapTo(to)}
function faceFront(){let img=$('mapRunner');if(!img)return;img.style.transform='scaleX(1)';img.src=HERO_ANIMATIONS.clips['daily.idle'].frames[0].src}

let mapDestination=null;
villageTravel=async function(to){if(busy||devActive)return;let reason=travelReason(to);if(reason){if($('mapStatus'))$('mapStatus').textContent=reason;return}if(!$('panel').open||!$('mapAvatar'))renderMap();busy=true;stopIdle();mapDestination=to;let player=new FramePlayer($('mapRunner'));$('mapStatus').textContent='กำลังวิ่งไป'+VILLAGE_NODES[to].name+' · แตะสถานที่อื่นเพื่อเปลี่ยนจุดหมาย';document.body.classList.add('busy');let close=$('panel').querySelector('.panelhead button');close.disabled=true;
 try{player.play('adventure.run',{loop:true});
  // Keep running until we arrive at whatever the destination is at that moment.
  for(;;){let goal=mapDestination,ok=await runMapTo(mapPoint(goal));if(ok&&goal===mapDestination)break}
  to=mapDestination;player.stop();faceFront();
  if(to===s.village.location){$('mapStatus').textContent='กลับมาที่'+VILLAGE_NODES[to].name+' · ไม่ใช้เวลา';return}
  $('mapStatus').textContent='ถึง'+VILLAGE_NODES[to].name+'แล้ว';await wait(reduced?60:450);let r=travel(to);if(!r.ok){$('mapStatus').textContent=r.reason;return}$('panel').close();closeCardFocus();hideEntityPeek();render();applySceneLayout(true);$('dummy').hidden=to!=='forge'}
 finally{player.stop();mapRun=null;mapDestination=null;busy=false;close.disabled=false;document.body.classList.remove('busy');render();scheduleIdle()}};
const vrBaseChooseNode=chooseMapNode;
chooseMapNode=function(k){if(mapDestination&&!mapEditing){let n=VILLAGE_NODES[k];if(!n?.live){$('mapStatus').textContent=(n?.name||'')+' · ยังไม่เปิดให้เดินทาง';return}if(k===mapDestination)return;let reason=k===s.village.location?'':travelReason(k);if(reason){$('mapStatus').textContent=reason;return}mapDestination=k;retargetMapRun(mapPoint(k));$('mapStatus').textContent='เปลี่ยนจุดหมาย → '+n.name;document.querySelectorAll('#villageMap .map-node').forEach(b=>b.classList.toggle('heading',b.dataset.node===k));return}return vrBaseChooseNode(k)};

// ---- editor (inside the existing map editor dialog) ----
let vrTool='nodes',vrActive=null,vrUndo=[],vrDrag=null;
function vrSnap(){vrUndo.push(JSON.stringify(villageRoutes));if(vrUndo.length>60)vrUndo.shift()}
function vrPoint(e){let r=$('villageMap').getBoundingClientRect();return {x:Math.round(Math.max(0,Math.min(100,(e.clientX-r.left)/r.width*100))*10)/10,y:Math.round(Math.max(0,Math.min(100,(e.clientY-r.top)/r.height*100))*10)/10}}
function drawVillageRouteOverlay(){let m=$('villageMap');if(!m)return;let o=$('vrOverlay');if(!mapEditing){o?.remove();return}if(!o){o=document.createElement('div');o.id='vrOverlay';m.appendChild(o)}let R=villageRoutes;o.className='vr-overlay tool-'+vrTool;
 o.innerHTML=`<svg viewBox="0 0 100 100" preserveAspectRatio="none">${R.edges.map(([a,b])=>{let A=R.nodes[a],B=R.nodes[b],c=curveOf(a,b);return `<path d="M${A.x} ${A.y} ${c?`Q${c.x} ${c.y} `:'L'}${B.x} ${B.y}"/>`}).join('')}</svg>${R.nodes.map((n,i)=>`<i class="route-node ${i===vrActive?'active':''}" data-vr-node="${i}" style="left:${n.x}%;top:${n.y}%"></i>`).join('')}${vrTool==='draw'?R.edges.map(([a,b])=>{let A=R.nodes[a],B=R.nodes[b],c=curveOf(a,b),m=c?bez(A,c,B,.5):{x:(A.x+B.x)/2,y:(A.y+B.y)/2};return `<b class="route-bend ${c?'curved':''}" data-vr-edge="${ekey(a,b)}" style="left:${m.x}%;top:${m.y}%" title="ลากเพื่อดัดโค้ง · ดับเบิลคลิกให้ตรง"></b>`}).join(''):''}`;
 m.classList.toggle('route-tool',vrTool!=='nodes')}
function vrControls(){return `<div class="vr-tools"><b>เส้นทางวิ่ง</b>${[['nodes','◆ ย้ายหมุดสถานที่'],['draw','✎ วาดทาง'],['erase','✕ ลบจุด'],['test','▶ ทดลองวิ่ง']].map(([t,n])=>`<button class="${vrTool===t?'active':''}" onclick="vrTool='${t}';vrActive=null;renderMap(true)">${n}</button>`).join('')}<button onclick="vrActive=null;drawVillageRouteOverlay()">จบเส้น</button><button onclick="if(vrUndo.length){villageRoutes=JSON.parse(vrUndo.pop());vrActive=null;saveVillageRoutes('↶ ย้อนแล้ว')}">↶ Undo</button><button onclick="if(confirm('ลบเส้นทางวิ่งทั้งหมดบนแผนที่?')){vrSnap();villageRoutes={...emptyVillageRoutes(),speed:villageRoutes.speed};vrActive=null;saveVillageRoutes('ล้างเส้นทางแล้ว')}">ล้างเส้นทาง</button><label>ความเร็ววิ่ง <input type="range" min="6" max="80" step="1" value="${villageRoutes.speed}" oninput="villageRoutes.speed=Number(this.value);this.nextElementSibling.textContent=this.value" onchange="saveVillageRoutes('✓ ความเร็ว '+this.value)"><output>${villageRoutes.speed}</output></label></div><p class="small muted vr-help">${{nodes:'ลากหมุดสถานที่เพื่อจัดตำแหน่ง (แบบเดิม)',draw:'แตะแผนที่เพื่อวางจุดต่อกันตามถนน • แตะจุดเดิมเพื่อเชื่อม/แตกกิ่ง • ลากจุดเพื่อย้าย • ลากเพชรกลางเส้นเพื่อดัดโค้ง (ดับเบิลคลิกให้ตรง) • "จบเส้น" หรือ Esc เพื่อเริ่มเส้นใหม่ • ตัวละครวิ่งตามเส้นที่สั้นที่สุด โดยเข้า/ออกที่จุดใกล้สถานที่ที่สุด',erase:'แตะจุดเพื่อลบ (เส้นที่ต่อกับจุดนั้นหายด้วย)',test:'แตะที่ใดก็ได้ ตัวละครจะวิ่งตามเส้นทางไปที่นั่น (ไม่ใช้เวลาในเกม)'}[vrTool]} · จุด ${villageRoutes.nodes.length} · เส้น ${villageRoutes.edges.length}</p>`}
const vrBaseRenderMap=renderMap;
renderMap=function(edit=false){vrBaseRenderMap(edit);mapEditing=!!edit;/* v35: villageDialog (layout-v08) clears mapEditing — restore it so route tools receive input */let runner=$('mapRunner');if(runner&&!mapRun&&HERO_ANIMATIONS.clips['daily.idle'])runner.src=HERO_ANIMATIONS.clips['daily.idle'].frames[0].src;if(!edit)return;let host=$('villageMap');host.insertAdjacentHTML('afterend',vrControls());drawVillageRouteOverlay();if(vrTool!=='nodes')host.querySelectorAll('.map-node').forEach(b=>b.style.pointerEvents='none')};
document.addEventListener('pointerdown',e=>{if(!mapEditing||vrTool==='nodes'||busy)return;let m=e.target.closest('#villageMap');if(!m)return;e.preventDefault();let R=villageRoutes,p=vrPoint(e),node=e.target.closest('[data-vr-node]');
 if(vrTool==='test'){testVillageRun(p);return}
 if(vrTool==='erase'){if(!node)return;vrSnap();let i=Number(node.dataset.vrNode);R.nodes.splice(i,1);let nc={};for(let [k,c] of Object.entries(R.curves||{})){let [a,b]=k.split(',').map(Number);if(a===i||b===i)continue;nc[ekey(a>i?a-1:a,b>i?b-1:b)]=c}R.curves=nc;R.edges=R.edges.filter(ed=>!ed.includes(i)).map(ed=>ed.map(x=>x>i?x-1:x));vrActive=null;saveVillageRoutes('ลบจุดแล้ว');return}
 let bend=e.target.closest('[data-vr-edge]');if(vrTool==='draw'&&bend){vrSnap();let [a,b]=bend.dataset.vrEdge.split(',').map(Number);vrDrag={id:e.pointerId,bend:[a,b],x:e.clientX,y:e.clientY,moved:false};return}
 vrSnap();let link=(a,b)=>{if(a===null||a===b||R.edges.some(([u,v])=>u===a&&v===b||u===b&&v===a))return;R.edges.push([a,b])};
 if(node){let i=Number(node.dataset.vrNode);vrDrag={id:e.pointerId,i,x:e.clientX,y:e.clientY,moved:false};link(vrActive,i);vrActive=i}else{if(R.nodes.length>=300)return;R.nodes.push(p);link(vrActive,R.nodes.length-1);vrActive=R.nodes.length-1}saveVillageRoutes()},true);
document.addEventListener('pointermove',e=>{let d=vrDrag;if(!d||e.pointerId!==d.id||!$('villageMap'))return;if(!d.moved&&Math.hypot(e.clientX-d.x,e.clientY-d.y)<5)return;d.moved=true;let p=vrPoint(e);if(d.bend){let [a,b]=d.bend,A=villageRoutes.nodes[a],B=villageRoutes.nodes[b];villageRoutes.curves=villageRoutes.curves||{};villageRoutes.curves[ekey(a,b)]={x:Math.max(0,Math.min(100,2*p.x-(A.x+B.x)/2)),y:Math.max(0,Math.min(100,2*p.y-(A.y+B.y)/2))}}else villageRoutes.nodes[d.i]=p;drawVillageRouteOverlay()});
document.addEventListener('pointerup',e=>{if(vrDrag&&e.pointerId===vrDrag.id){if(vrDrag.moved)saveVillageRoutes(vrDrag.bend?'✓ ดัดโค้งแล้ว':'✓ ย้ายจุดแล้ว');vrDrag=null}});
document.addEventListener('dblclick',e=>{let bend=e.target.closest('[data-vr-edge]');if(!bend||!mapEditing)return;vrSnap();delete villageRoutes.curves[bend.dataset.vrEdge];saveVillageRoutes('↔ ปรับเป็นเส้นตรงแล้ว')});
document.addEventListener('keydown',e=>{if(mapEditing&&e.key==='Escape'&&vrTool==='draw'&&vrActive!==null){vrActive=null;drawVillageRouteOverlay();e.preventDefault()}},true);
let vrTesting=false;
async function testVillageRun(to){if(vrTesting)return;vrTesting=true;let avatar=$('mapAvatar'),from={x:parseFloat(avatar.style.left),y:parseFloat(avatar.style.top)},player=new FramePlayer($('mapRunner'));try{player.play('adventure.run',{loop:true});await runMapTo(to);player.stop();faceFront()}finally{player.stop();vrTesting=false}}
