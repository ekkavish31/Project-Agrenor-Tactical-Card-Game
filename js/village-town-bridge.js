/* Town navigation opens existing location scenes; the market has a walkable interior. */
(function(){'use strict';
const host=document.createElement('section');host.id='villageTownLayer';host.setAttribute('aria-label','หมู่บ้าน');host.style.cssText='position:fixed;inset:0;z-index:200;background:#718568';
function makeFrame(title,src){const f=document.createElement('iframe');f.title=title;f.style.cssText='width:100%;height:100%;border:0';f.allow='fullscreen';if(src)f.src=src;host.appendChild(f);return f}
const frame=makeFrame('หมู่บ้าน 2.5D','village-town.html?v=72'),marketFrame=makeFrame('ตลาดหมู่บ้าน 2.5D');marketFrame.hidden=true;document.body.appendChild(host);
const back=document.createElement('button');back.id='townReturn';back.textContent='← กลับแผนที่หมู่บ้าน';back.style.cssText='position:fixed;left:20px;top:78px;z-index:201;padding:10px 16px;border-radius:10px;background:#213b2df0;color:#fff0c7;border:1px solid #b6c48e';back.hidden=true;back.onclick=()=>openTown();document.body.append(back);
let ready=false,marketReady=false,initialized=false,lastStamp='',lastMotion='',inside=false,marketOpen=false,lastVisible='';
function post(f,data){f.contentWindow?.postMessage({source:'project-a-game',...data},'*')}
function send(data){if(ready)post(frame,data)}
function stateData(){return{location:s.village.location,name:heroName(),day:s.day,minutes:s.minutes,hp:s.hp,stamina:s.stamina,coins:s.village.coins,message:s.log,exits:Object.entries(window.ADVENTURE_DATA.AREAS).map(([id,a])=>({id,name:a.name,exit:a.exit})),actions:placeActions().map(a=>({id:a.id,name:a.name,cost:a.cost,effect:a.effect,reason:a.reason||''}))}}
function modalOpen(){return !!document.querySelector('dialog[open]')}
function activeHide(){return inside||s.mode==='battle'||!!window.Adventure?.state()||!$('tacticsLayer').hidden}
function sync(){host.hidden=activeHide();back.hidden=!inside||s.mode==='battle'||!!window.Adventure?.state()||!$('tacticsLayer').hidden;frame.hidden=marketOpen;marketFrame.hidden=!marketOpen;
 const vis=JSON.stringify([!host.hidden,marketOpen,ready,marketReady,modalOpen()]);if(vis!==lastVisible){lastVisible=vis;send({type:'visibility',visible:!host.hidden&&!marketOpen&&!modalOpen()});if(marketReady)post(marketFrame,{type:'visibility',visible:!host.hidden&&marketOpen&&!modalOpen()})}
 const data=stateData(),stamp=JSON.stringify(data);if(stamp!==lastStamp){lastStamp=stamp;send({type:'state',data});if(marketReady)post(marketFrame,{type:'state',data})}
 const motion=HeroMotion.snapshot(TACTICS_SPRITES),sig=JSON.stringify(motion);if(sig!==lastMotion){lastMotion=sig;send({type:'motion',data:motion});if(marketReady)post(marketFrame,{type:'motion',data:motion})}
}
function openTown(){if(busy||s.mode==='battle')return;inside=false;marketOpen=false;if($('panel').open)$('panel').close();stopIdle();send({type:'return'});sync();send({type:'focus'})}
function enterMarket(){inside=false;marketOpen=true;stopIdle();if(!marketFrame.getAttribute('src'))marketFrame.src='village-market.html';if(marketReady){post(marketFrame,{type:'init',data:stateData()});post(marketFrame,{type:'motion',data:HeroMotion.snapshot(TACTICS_SPRITES)})}sync()}
renderMap=function(edit){openTown();if(edit)send({type:'edit'})};openMapEditor=function(){renderMap(true)};
villageTravel=function(id){if(['home','forge','market'].includes(id)){openTown();send({type:'walk',id})}};
const oldRender=render;render=function(){const r=oldRender.apply(this,arguments);sync();return r};
function arrived(id){if(id.startsWith('exit:')){chooseExpedition(id.slice(5));return}if(busy||devActive||s.mode==='battle'){send({type:'place',id,ok:false,message:'รอให้กิจกรรมปัจจุบันเสร็จก่อน',actions:[]});return}
 if(!PLACES[id]){send({type:'place',id,ok:false,message:id==='square'?'ลานกลางหมู่บ้าน':'สถานที่นี้เตรียมไว้ ยังไม่เปิดกิจกรรม',actions:[]});return}
 const result=id===s.village.location?{ok:true}:travel(id);if(!result.ok){send({type:'place',id,ok:false,message:result.reason,actions:[]});return}
 if(id==='market'){render();enterMarket();return}
 inside=true;marketOpen=false;closeCardFocus();hideEntityPeek();render();applySceneLayout(true);scheduleIdle();sync();
}
function menu(k){if(busy)return;if(['bag','character','upgrade','editor'].includes(k))openPanel(k);else if(k==='settings')openSettings();else if(k==='activities')arrived(s.village.location);else if(k==='adventure'){if($('panel').open)$('panel').close();chooseExpedition()}else if(k==='training')openTactical()}
window.addEventListener('message',e=>{const m=e.data;if(e.source===frame.contentWindow&&m?.source==='project-a-town'){
 if(m.type==='ready'){ready=true;if(!initialized){initialized=true;send({type:'init',data:stateData()})}send({type:'motion',data:HeroMotion.snapshot(TACTICS_SPRITES)});lastStamp='';sync()}
 else if(m.type==='arrive'&&typeof m.id==='string')arrived(m.id);
 else if(m.type==='menu')menu(m.id);
 }else if(e.source===marketFrame.contentWindow&&m?.source==='project-a-market'){
 if(m.type==='ready'){marketReady=true;post(marketFrame,{type:'init',data:stateData()});post(marketFrame,{type:'motion',data:HeroMotion.snapshot(TACTICS_SPRITES)});sync()}
 else if(m.type==='leave'&&marketOpen&&!busy)openTown();
 else if(m.type==='service'&&marketOpen&&!inside&&!busy&&s.mode!=='battle'&&s.village.location==='market'){const panels={materials:'market',equipment:'sell',orders:'orders'};if(panels[m.id])openPanel(panels[m.id])}
 else if(m.type==='menu')menu(m.id);
 }});
function chooseExpedition(area){const areas=window.ADVENTURE_DATA.AREAS;villageDialog('ออกผจญภัย',`<p>เลือกเส้นทางออกจากหมู่บ้าน · เดินทางไป 30 นาที</p><div class="place-grid">${Object.entries(areas).filter(([id])=>!area||id===area).map(([id,a])=>`<button onclick="VillageTown.expedition('${id}')"><strong>${a.name}</strong><small>ระดับ ${a.tier||1}</small></button>`).join('')}</div>`)}
function expedition(area){if(busy||!window.ADVENTURE_DATA.AREAS[area])return;const reason=s.mode==='battle'?'จบการฝึกก่อน':s.hp<20?'HP ต่ำกว่า 20 พักก่อน':s.minutes>1080?'เลย 18:00 แล้ว':s.fatigue>=85?'ความสดชื่นต่ำเกินไป':'';if(reason){villageDialog('ยังออกผจญภัยไม่ได้','<p>'+reason+'</p>');return}if(!confirm('ออกสำรวจ '+window.ADVENTURE_DATA.AREAS[area].name+'? เดินทาง 30 นาที'))return;s.minutes=Math.min(1200,s.minutes+30);save();$('panel').close();Adventure.enter(area);sync()}
window.VillageTown={open:openTown,frame,marketFrame,host,sync,expedition,getScene:()=>inside?s.village.location:marketOpen?'market-interior':'town'};
new MutationObserver(()=>{const hide=activeHide();if(host.hidden!==hide||lastVisible!==JSON.stringify([!hide,marketOpen,ready,marketReady,modalOpen()]))sync()}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','class','open']});
setInterval(()=>{if(!document.hidden)sync()},800);
try{const channel=new BroadcastChannel('project-a-hero-motion');channel.onmessage=e=>{if(e.data?.kind!=='hero-walk'||!e.data.data?.directions)return;for(const[d,p]of Object.entries(e.data.data.directions)){if(!TACTICS_SPRITES.directions[d])TACTICS_SPRITES.directions[d]={};TACTICS_SPRITES.directions[d].walk=p.walk}lastMotion='';sync()}}catch{}
sync();
})();
