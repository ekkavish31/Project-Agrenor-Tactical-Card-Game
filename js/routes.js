// Package v02: walk routes. Each scene (forge / home / market) can have a walk network drawn in
// developer mode → "เส้นทาง". The hero follows the network (shortest path) instead of a straight line.
// Activity standing points ("จุดยืนกิจกรรม") make the hero walk somewhere before an activity runs.
// Routes are saved in this browser; copy the JSON into routes-data.js to ship them with the game.
const ROUTE_KEY='three-card-routes-v1',ROUTE_SCENES={forge:'โรงตีเหล็ก',home:'บ้าน',market:'ตลาด'};
function emptyRoutes(){return {version:1,scenes:{forge:{nodes:[],edges:[],spots:{}},home:{nodes:[],edges:[],spots:{}},market:{nodes:[],edges:[],spots:{}}}}}
function validRoutes(r){if(!r||r.version!==1||!r.scenes)throw Error('รูปแบบเส้นทางไม่ถูกต้อง');let out=emptyRoutes(),ok=v=>Number.isFinite(v)&&v>=0&&v<=100;for(let k of Object.keys(ROUTE_SCENES)){let sc=r.scenes[k];if(!sc)continue;if(!Array.isArray(sc.nodes)||!Array.isArray(sc.edges))throw Error('ข้อมูลเส้นทางฉาก '+k+' ไม่ครบ');if(sc.nodes.length>200)throw Error('จุดเส้นทางเกิน 200');for(let n of sc.nodes)if(!ok(n?.x)||!ok(n?.y))throw Error('พิกัดเส้นทางไม่ถูกต้อง');for(let e of sc.edges)if(!Array.isArray(e)||e.length!==2||!e.every(i=>Number.isInteger(i)&&i>=0&&i<sc.nodes.length)||e[0]===e[1])throw Error('เส้นเชื่อมไม่ถูกต้อง');let spots={};for(let [id,p] of Object.entries(sc.spots||{})){if(!/^[a-z0-9-]{1,30}$/.test(id)||!ok(p?.x)||!ok(p?.y))throw Error('จุดยืนกิจกรรมไม่ถูกต้อง');spots[id]={x:+p.x,y:+p.y}}out.scenes[k]={nodes:sc.nodes.map(n=>({x:+n.x,y:+n.y})),edges:sc.edges.map(e=>[e[0],e[1]]),spots}}return out}
let routes=emptyRoutes();
try{let saved=localStorage.getItem(ROUTE_KEY);routes=validRoutes(saved?JSON.parse(saved):typeof DEFAULT_ROUTES!=='undefined'?DEFAULT_ROUTES:emptyRoutes())}catch(e){routes=emptyRoutes()}
function persistRoutes(){try{localStorage.setItem(ROUTE_KEY,JSON.stringify(routes));return true}catch(e){return false}}
const routeScene=k=>routes.scenes[k||s.village.location];

// ---- path finding ----
function worldPx(p){let r=$('world').getBoundingClientRect();return {x:p.x*r.width/100,y:p.y*r.height/100}}
function pxDist(a,b){let A=worldPx(a),B=worldPx(b);return Math.hypot(A.x-B.x,A.y-B.y)}
function nearestNode(sc,p){let best=-1,d=Infinity;sc.nodes.forEach((n,i)=>{let v=pxDist(n,p);if(v<d){d=v;best=i}});return best}
function routePath(from,to,sceneKey){let sc=routeScene(sceneKey);if(!sc||sc.nodes.length<2||!sc.edges.length)return [to];let a=nearestNode(sc,from),b=nearestNode(sc,to);if(a<0||b<0)return [to];
 let n=sc.nodes.length,dist=Array(n).fill(Infinity),prev=Array(n).fill(-1),done=Array(n).fill(false),adj=Array.from({length:n},()=>[]);for(let [u,v] of sc.edges){let w=pxDist(sc.nodes[u],sc.nodes[v]);adj[u].push([v,w]);adj[v].push([u,w])}dist[a]=0;
 for(;;){let u=-1;for(let i=0;i<n;i++)if(!done[i]&&dist[i]<Infinity&&(u<0||dist[i]<dist[u]))u=i;if(u<0||u===b)break;done[u]=true;for(let [v,w] of adj[u])if(dist[u]+w<dist[v]){dist[v]=dist[u]+w;prev[v]=u}}
 if(dist[b]===Infinity)return [to];let chain=[];for(let u=b;u>=0;u=prev[u])chain.unshift(sc.nodes[u]);
 // A very short step (e.g. turning to a neighbouring station) does not need the network.
 if(pxDist(from,to)<40)return [to];
 return [...chain,to]}

// ---- walking ----
let routeWalkTicket=0;
async function walkTo(to,sceneKey){let actor=$('actor'),ticket=++routeWalkTicket;let from={x:Number.parseFloat(actor.style.left),y:Number.parseFloat(actor.style.top)};if(!Number.isFinite(from.x)||!Number.isFinite(from.y)){actor.style.left=to.x+'%';actor.style.top=to.y+'%';return}
 let path=routePath(from,to,sceneKey),total=0,last=from;for(let p of path){total+=pxDist(last,p);last=p}if(total<2){faceToward(to.x);return}
 let speed=Math.max(240,total/1.8),cur=from;actor.classList.add('walking');
 try{for(let p of path){if(ticket!==routeWalkTicket)return;let ms=Math.max(60,pxDist(cur,p)/speed*1000);if(reduced)ms=Math.min(ms,60);if(Math.abs(p.x-cur.x)>.3)setHeroFacing(p.x<cur.x?-1:1);actor.style.transition=`left ${ms}ms linear,top ${ms}ms linear`;actor.style.left=p.x+'%';actor.style.top=p.y+'%';await new Promise(r=>setTimeout(r,ms));cur=p}}
 finally{if(ticket===routeWalkTicket){actor.style.transition='';actor.classList.remove('walking')}}}
const routeBaseMove=moveHero;
function walkAnimated(to){stopIdle();$('actor').classList.add('frame-driven');heroAnimator.play('daily.walk',{loop:true,speed:1.25});return walkTo(to).finally(()=>heroAnimator.stop())}
moveHero=async function(i){if(s.mode==='battle'||!sceneLayout().actions[i])return routeBaseMove(i);await walkAnimated(sceneLayout().actions[i].hero);faceToward(heroFocusX(i))};
// Activity standing points: walk first, then run the activity.
const routeBaseRunAction=runPlaceAction;
runPlaceAction=async function(id){if(busy||devActive||s.mode==='battle')return;let spot=routeScene()?.spots[id],a=placeActions().find(x=>x.id===id);if(spot&&a&&!a.reason&&a.kind!=='smith'){busy=true;try{await walkAnimated(spot)}finally{busy=false}}return routeBaseRunAction(id)};
// Arriving in a scene: start at its entry point when one is set.
let routeArrivedAt=null;
const routeBaseRender=render;
render=function(){routeBaseRender();let key=s.village.location+':'+s.mode;if(key!==routeArrivedAt){routeArrivedAt=key;let e=routeScene()?.spots.enter;if(e&&s.mode!=='battle'&&!devActive){$('actor').style.left=e.x+'%';$('actor').style.top=e.y+'%'}}if(devActive&&devMode==='route')routeDevPreview()};

// ---- developer mode: "เส้นทาง" tab ----
let routeTool='draw',routeEdit=null,routeActive=null,routeSpot='enter',routeUndo=[],routeDrag=null;
function routeEditScene(){return routeEdit||s.village.location}
function routeSpotChoices(k){let list={enter:'จุดเข้าฉาก (เกิดเมื่อมาถึง)'};let acts={forge:[['recipes','เลือกแบบงาน'],['rest','พัก'],['auto','ทำอัตโนมัติ'],['cancel','ยกเลิกงาน']],home:[['sleep','นอนพัก'],['chest','หีบเก็บของ'],['deck','จัดสำรับ'],['bed','จัดการเตียง'],['rest','พัก']],market:[['buy','ซื้อวัตถุดิบ'],['sell','ขายอุปกรณ์'],['orders','รับ–ส่งออร์เดอร์']]}[k];for(let [id,n] of acts)list[id]=n;return list}
function routeSnapshot(){routeUndo.push(JSON.stringify(routes));if(routeUndo.length>60)routeUndo.shift()}
function routeSaved(msg){let ok=persistRoutes();let el=$('routeStatus');if(el)el.textContent=ok?(msg||'✓ บันทึกเส้นทางแล้ว'):'บันทึกไม่ได้ (พื้นที่เบราว์เซอร์เต็ม?)';drawRouteOverlay()}
const routeBaseRenderDev=renderDev;
renderDev=function(){let route=devMode==='route';if(route)devMode='scene';routeBaseRenderDev();if(route)devMode='route';let tabs=document.querySelector('#devPanel .dev-tabs');if(tabs&&!tabs.querySelector('[data-route-tab]')){tabs.insertAdjacentHTML('beforeend',`<button data-route-tab class="${route?'active':''}" onclick="setDevMode('route')">เส้นทาง</button>`);if(route)tabs.querySelectorAll('button:not([data-route-tab])').forEach(b=>b.classList.remove('active'))}
 if(!route){removeRouteOverlay();return}
 document.querySelectorAll('.dev-marker').forEach(x=>x.remove());$('cardDesignSurface')?.remove();
 while(tabs&&tabs.nextSibling)tabs.nextSibling.remove();
 let k=routeEditScene(),sc=routeScene(k),spots=routeSpotChoices(k);
 tabs.insertAdjacentHTML('afterend',`<label>ฉาก<select onchange="routeEdit=this.value;routeActive=null;renderDev()">${Object.entries(ROUTE_SCENES).map(([v,n])=>`<option value="${v}" ${v===k?'selected':''}>${n}${v===s.village.location?' (อยู่ที่นี่)':''}</option>`).join('')}</select></label>
 <div class="dev-controls route-tools">${[['draw','✎ วาดทาง'],['spot','◉ จุดยืน'],['erase','✕ ลบจุด'],['test','▶ ทดลองเดิน']].map(([t,n])=>`<button class="${routeTool===t?'active':''}" onclick="routeTool='${t}';routeActive=null;renderDev()">${n}</button>`).join('')}</div>
 ${routeTool==='spot'?`<label>จุดยืนของ<select onchange="routeSpot=this.value">${Object.entries(spots).map(([id,n])=>`<option value="${id}" ${routeSpot===id?'selected':''}>${n}${sc.spots[id]?' ✓':''}</option>`).join('')}</select></label>`:''}
 <p class="small muted">${{draw:'แตะฉากเพื่อวางจุดต่อกันเป็นเส้นทาง • แตะจุดเดิมเพื่อเชื่อม/แตกกิ่ง • ลากจุดเพื่อย้าย • กด "จบเส้น" หรือ Esc เพื่อเริ่มเส้นใหม่',spot:'เลือกกิจกรรม แล้วแตะฉากตรงที่ให้ตัวละครเดินไปยืนก่อนทำกิจกรรมนั้น (หลอม/ตี/ชุบ ใช้จุดยืนจากแท็บจัดฉาก)',erase:'แตะจุดเส้นทางหรือจุดยืนเพื่อลบ',test:'แตะที่ใดก็ได้ในฉาก ตัวละครจะเดินตามเส้นทางไปที่นั่น'}[routeTool]}</p>
 ${k!==s.village.location&&routeTool==='test'?'<p class="small">ทดลองเดินได้เฉพาะฉากที่ตัวละครอยู่</p>':''}
 <div class="dev-controls section">${routeTool==='draw'?'<button onclick="routeActive=null;drawRouteOverlay()">จบเส้น</button>':''}<button onclick="if(routeUndo.length){routes=JSON.parse(routeUndo.pop());routeActive=null;routeSaved('↶ ย้อนแล้ว')}">↶ Undo</button><button onclick="if(confirm('ลบเส้นทางและจุดยืนทั้งหมดของฉากนี้?')){routeSnapshot();routes.scenes[routeEditScene()]={nodes:[],edges:[],spots:{}};routeActive=null;routeSaved('ล้างฉากนี้แล้ว');renderDev()}">ล้างฉากนี้</button></div>
 <p class="small muted">จุด ${sc.nodes.length} · เส้น ${sc.edges.length} · จุดยืน ${Object.keys(sc.spots).length}</p><p id="routeStatus" class="dev-status">แก้แล้วบันทึกอัตโนมัติในเบราว์เซอร์นี้</p>
 <details><summary>ส่งออก / นำเข้าเส้นทาง</summary><p class="small muted">คัดลอก JSON ไปวางใน routes-data.js เพื่อให้เส้นทางติดไปกับไฟล์เกม</p><div class="dev-controls"><button onclick="$('routeJSON').value=JSON.stringify(routes,null,1)">แสดง JSON</button><button onclick="routeImport()">นำเข้า JSON</button></div><textarea id="routeJSON" rows="7" spellcheck="false"></textarea></details>`);
 routeDevPreview()};
function routeImport(){try{let r=validRoutes(JSON.parse($('routeJSON').value));routeSnapshot();routes=r;routeSaved('✓ นำเข้าเส้นทางแล้ว');renderDev()}catch(e){$('routeStatus').textContent=e.message}}
// Show the scene being edited (background only) without travelling or spending game time.
function routeDevPreview(){let k=routeEditScene(),here=k===s.village.location;$('world').style.backgroundImage=`url('assets/${k==='forge'?'workshop':k}.webp')`;$('actor').style.visibility=here?'':'hidden';if(k!=='forge'){$('dummy').hidden=true;$('dummyPrompt').hidden=true;document.querySelectorAll('.station').forEach(el=>el.hidden=true)}else if(!here){document.querySelectorAll('.station').forEach(el=>el.hidden=false)}drawRouteOverlay()}
function removeRouteOverlay(){$('routeOverlay')?.remove();$('actor').style.visibility=''}
function drawRouteOverlay(){if(!devActive||devMode!=='route')return removeRouteOverlay();let k=routeEditScene(),sc=routeScene(k),o=$('routeOverlay');if(!o){o=document.createElement('div');o.id='routeOverlay';$('world').appendChild(o)}let spots=routeSpotChoices(k);
 o.innerHTML=`<svg viewBox="0 0 100 100" preserveAspectRatio="none">${sc.edges.map(([a,b])=>`<line x1="${sc.nodes[a].x}" y1="${sc.nodes[a].y}" x2="${sc.nodes[b].x}" y2="${sc.nodes[b].y}"/>`).join('')}</svg>${sc.nodes.map((n,i)=>`<i class="route-node ${i===routeActive?'active':''}" data-route-node="${i}" style="left:${n.x}%;top:${n.y}%"></i>`).join('')}${Object.entries(sc.spots).map(([id,p])=>`<b class="route-spot" data-route-spot="${id}" style="left:${p.x}%;top:${p.y}%">◉<span>${esc((spots[id]||id).split(' (')[0])}</span></b>`).join('')}`}
function routePoint(e){let r=$('world').getBoundingClientRect();return {x:Math.round(Math.max(0,Math.min(100,(e.clientX-r.left)/r.width*100))*10)/10,y:Math.round(Math.max(0,Math.min(100,(e.clientY-r.top)/r.height*100))*10)/10}}
function routeConnect(sc,a,b){if(a===null||a===b||sc.edges.some(([u,v])=>u===a&&v===b||u===b&&v===a))return;sc.edges.push([a,b])}
document.addEventListener('pointerdown',e=>{if(!devActive||devMode!=='route'||busy||!e.target.closest('#world')||e.target.closest('button,select,.location,.world-bottom'))return;e.preventDefault();e.stopPropagation();let k=routeEditScene(),sc=routeScene(k),p=routePoint(e),node=e.target.closest('[data-route-node]'),spot=e.target.closest('[data-route-spot]');
 if(routeTool==='test'){if(k===s.village.location)walkAnimated(p);return}
 if(routeTool==='erase'){if(node){routeSnapshot();let i=Number(node.dataset.routeNode);sc.nodes.splice(i,1);sc.edges=sc.edges.filter(ed=>!ed.includes(i)).map(ed=>ed.map(x=>x>i?x-1:x));routeActive=null;routeSaved('ลบจุดแล้ว');renderDev()}else if(spot){routeSnapshot();delete sc.spots[spot.dataset.routeSpot];routeSaved('ลบจุดยืนแล้ว');renderDev()}return}
 if(routeTool==='spot'){routeSnapshot();sc.spots[routeSpot]=p;routeSaved('✓ ตั้งจุดยืนแล้ว');renderDev();return}
 // draw
 routeSnapshot();if(node){let i=Number(node.dataset.routeNode);routeDrag={id:e.pointerId,i,moved:false,x:e.clientX,y:e.clientY};routeConnect(sc,routeActive,i);routeActive=i}else{if(sc.nodes.length>=200)return;sc.nodes.push(p);let i=sc.nodes.length-1;routeConnect(sc,routeActive,i);routeActive=i}routeSaved();renderDev()},true);
document.addEventListener('pointermove',e=>{let d=routeDrag;if(!d||e.pointerId!==d.id)return;if(!d.moved&&Math.hypot(e.clientX-d.x,e.clientY-d.y)<5)return;d.moved=true;routeScene(routeEditScene()).nodes[d.i]=routePoint(e);drawRouteOverlay()});
document.addEventListener('pointerup',e=>{if(routeDrag&&e.pointerId===routeDrag.id){if(routeDrag.moved)routeSaved('✓ ย้ายจุดแล้ว');routeDrag=null}});
document.addEventListener('keydown',e=>{if(devActive&&devMode==='route'&&e.key==='Escape'){routeActive=null;drawRouteOverlay()}});
const routeBaseToggleDev=toggleDev;
toggleDev=function(){routeBaseToggleDev();if(!devActive){removeRouteOverlay();routeEdit=null;routeActive=null;if(devMode==='route')devMode='scene';render()}};
render();
