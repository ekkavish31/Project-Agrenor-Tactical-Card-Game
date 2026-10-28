/* Town navigation: market, forge and home open a walkable 2.5D sub-map (village-place.html); stations run the game's own place actions.
   v94: every other place (inn, temple, healer, shop, villagers' houses …) opens its living interior (place-interior.html) in the same place frame;
   "ผจญภัย" and the village exits open the world map (world-map.html) inside the town frame — the old area adventure is archived. */
(function(){'use strict';
const host=document.createElement('section');host.id='villageTownLayer';host.setAttribute('aria-label','หมู่บ้าน');host.style.cssText='position:fixed;inset:0;z-index:200;background:#718568';
function makeFrame(title,src){const f=document.createElement('iframe');f.title=title;f.style.cssText='width:100%;height:100%;border:0';f.allow='fullscreen';if(src)f.src=src;host.appendChild(f);return f}
const frame=makeFrame('หมู่บ้าน 2.5D','village-town.html?v=95.01'),marketFrame=makeFrame('สถานที่ 2.5D');let placeId='',placeAct='';marketFrame.hidden=true;document.body.appendChild(host);
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
function enterPlace(id,map,interior){const sub=interior?'in:'+id:map||id;placeAct=id;inside=false;marketOpen=true;stopIdle();if(placeId!==sub){placeId=sub;marketReady=false;marketFrame.src=interior?'place-interior.html?embed=1&v=95.01&place='+encodeURIComponent(id)+'&name='+encodeURIComponent(interior):'village-place.html?v=95.01&place='+encodeURIComponent(sub)+(map?'&kind='+id:'')}else if(marketReady){post(marketFrame,{type:'init',data:stateData()});post(marketFrame,{type:'motion',data:HeroMotion.snapshot(TACTICS_SPRITES)})}lastStamp='';sync()}
renderMap=function(edit){openTown();if(edit)send({type:'edit'})};openMapEditor=function(){renderMap(true)};
villageTravel=function(id){if(['home','forge','market'].includes(id)){openTown();send({type:'walk',id})}};
const oldRender=render;render=function(){const r=oldRender.apply(this,arguments);sync();return r};
const CORE=['market','forge','home'];
function arrived(id,map,info={}){if(id.startsWith('exit:')){openWorld();return}if(busy||devActive||s.mode==='battle'){send({type:'place',id,ok:false,message:'รอให้กิจกรรมปัจจุบันเสร็จก่อน',actions:[]});return}
 // v94: the hero's own house (an editor place) is home; editor houses with an empty sub-map and every non-core place open the living interior
 if(info.name&&/บ้านของเรา|บ้านเรา/.test(info.name))id='home';
 const real=info.placeId||id,emptyMap=map&&!(placeMaps()[map]?.stations||[]).length;
 if(!CORE.includes(id)||(info.custom&&emptyMap&&id!=='home')){if(id==='square'||real==='square'){send({type:'place',id,ok:false,message:'ลานกลางหมู่บ้าน',actions:[]});return}enterPlace(real,'',info.name||real);sync();return}
 if(!PLACES[id]){send({type:'place',id,ok:false,message:'สถานที่นี้เตรียมไว้ ยังไม่เปิดกิจกรรม',actions:[]});return}
 const result=id===s.village.location?{ok:true}:travel(id);if(!result.ok){send({type:'place',id,ok:false,message:result.reason,actions:[]});return}
 if(CORE.includes(id)){render();enterPlace(id,info.name&&/บ้านของเรา|บ้านเรา/.test(info.name)?'':map);return}
 inside=true;marketOpen=false;closeCardFocus();hideEntityPeek();render();applySceneLayout(true);scheduleIdle();sync();
}
function menu(k){if(busy)return;if(['bag','character','editor'].includes(k))openPanel(k);else if(k==='deck'||k==='upgrade')openPanel('tdeck');else if(k==='settings')openSettings();else if(k==='activities')arrived(s.village.location);else if(k==='adventure'){if($('panel').open)$('panel').close();openWorld()}else if(k==='training')openTactical()}
window.addEventListener('message',e=>{const m=e.data;if(e.source===frame.contentWindow&&m?.source==='project-a-town'){
 if(m.type==='ready'){ready=true;initialized=true;send({type:'init',data:stateData()});send({type:'motion',data:HeroMotion.snapshot(TACTICS_SPRITES)});lastStamp='';sync()}
 else if(m.type==='arrive'&&typeof m.id==='string')arrived(m.id,typeof m.map==='string'?m.map:'',{placeId:typeof m.placeId==='string'?m.placeId:'',name:typeof m.name==='string'?m.name:'',custom:!!m.custom});
 else if(m.type==='menu')menu(m.id);
 }else if(e.source===marketFrame.contentWindow&&m?.source==='project-a-place'){
 if(m.type==='ready'){marketReady=true;post(marketFrame,{type:'init',data:stateData()});post(marketFrame,{type:'motion',data:HeroMotion.snapshot(TACTICS_SPRITES)});sync()}
 else if(m.type==='leave'&&marketOpen&&!busy)openTown();
 else if(m.type==='action'&&marketOpen&&!busy&&s.mode!=='battle'&&(s.village.location===placeAct||placeId.startsWith('in:'))&&typeof m.id==='string')Promise.resolve(runPlaceAction(m.id)).then(()=>{lastStamp='';sync()});
 else if(m.type==='menu')menu(m.id);
 }});
/* v94: the old area adventure (adventure.js node maps) is archived — leaving the village always opens the world map in the town frame */
function openWorld(){if(busy||s.mode==='battle')return;const reason=s.hp<20?'HP ต่ำกว่า 20 พักก่อน':s.fatigue>=85?'ความสดชื่นต่ำเกินไป':'';if(reason){villageDialog('ยังออกเดินทางไม่ได้','<p>'+reason+'</p>');return}if($('panel').open)$('panel').close();openTown();ready=false;frame.src='world-map.html';sync()}
function openInterior(id,name){if(busy||s.mode==='battle')return;if($('panel').open)$('panel').close();openTown();enterPlace(id,'',name||id);sync()}
function onWorld(){try{return /world-map\.html/.test(frame.contentWindow.location.pathname)}catch{return false}}
function placeMaps(){try{return JSON.parse(localStorage.getItem('place-maps-v1')||'{}')}catch{return{}}}
function chooseExpedition(){openWorld()}function expedition(){openWorld()}
window.VillageTown={open:openTown,frame,marketFrame,host,sync,expedition,openWorld,openInterior,onWorld,getScene:()=>inside?s.village.location:marketOpen?'place:'+placeId:'town',enterPlace};
new MutationObserver(()=>{const hide=activeHide();if(host.hidden!==hide||lastVisible!==JSON.stringify([!hide,marketOpen,ready,marketReady,modalOpen()]))sync()}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['hidden','class','open']});
setInterval(()=>{if(!document.hidden)sync()},800);
try{const channel=new BroadcastChannel('project-a-hero-motion');channel.onmessage=e=>{if(e.data?.kind!=='hero-walk'||!e.data.data?.directions)return;for(const[d,p]of Object.entries(e.data.data.directions)){if(!TACTICS_SPRITES.directions[d])TACTICS_SPRITES.directions[d]={};TACTICS_SPRITES.directions[d].walk=p.walk}lastMotion='';sync()}}catch{}
sync();
})();
