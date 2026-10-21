/* Battle flow layer (UI around tactics-ui.js): equipment, results, command icons, AI choice cards, item FX, slow-burn presentation.
   Merged in v38 from: battle-v35.js, battle-v36.js, battle-v37.js, battle-flow-v38.js (each section kept in its original order). */

/* ======================= section: battle-v35.js ======================= */
/* v35 battle systems: equipment swap (uses the turn's item action), full result window,
   return-travel transition, and no free weapon swaps outside training. Code-drawn where art is missing. */
(function(){'use strict';
const $=id=>document.getElementById(id),C=()=>window.TacticsCore,L=()=>window.TacticsLab;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const training=()=>{let m=$('trainingSettings');return !!m&&!m.hidden};

// ---------- equipment: swap / remove the hero's weapon with the item action of this turn ----------
function ownedWeapons(){let W=C()?.WEAPONS||{};return (typeof s!=='undefined'&&Array.isArray(s.inventory)?s.inventory:[]).filter(x=>W[x.kind])}
function weaponLabel(x){let W=C().WEAPONS[x.kind];return (typeof weaponName==='function'?weaponName(x):W.name)+(x.quality?' ★'+x.quality:'')}
function canSwap(){let lab=L(),st=lab?.getState(),BI=window.BattleItems;if(!st||!BI)return 'ยังไม่อยู่ในการต่อสู้';if(st.phase!=='player'||st.outcome)return 'ยังไม่ใช่ตาของคุณ';if(lab.isLocked())return 'รอท่าจบก่อน';if(st.hero.id!=='hero')return 'เปลี่ยนอุปกรณ์ได้เฉพาะตัวเอก';{const why=window.TacticsDecks?.actionBlock(st.deck,'item');if(why)return why}return ''}
function closeEquip(){$('v35Equip')?.remove()}
function openEquip(){closeEquip();let st=L().getState(),h=st.hero,why=canSwap(),cur=typeof s!=='undefined'?s.equipped:null,list=ownedWeapons();
 let box=document.createElement('div');box.id='v35Equip';box.className='v35-equip';box.setAttribute('role','dialog');box.setAttribute('aria-label','เปลี่ยนอุปกรณ์');
 box.innerHTML=`<header><b>อุปกรณ์ · ใช้คริสตัลไอเทม 1 เม็ด</b><button type="button" data-x aria-label="ปิด">×</button></header><p class="v35-equip-now">ถืออยู่: <b>${esc(h.weapon==='unarmed'?'มือเปล่า':C().WEAPONS[h.weapon]?.name||h.weapon)}</b></p>${why?`<p class="v35-equip-why">${esc(why)}</p>`:''}<div class="v35-equip-list">${list.map(x=>`<button type="button" data-eq="${x.id}" ${x.id===cur?'class="on"':''} ${why?'disabled':''}><span>${esc(weaponLabel(x))}</span><small>ระยะ ${C().WEAPONS[x.kind].range} · พลัง ${C().WEAPONS[x.kind].damage}${x.id===cur?' · ใช้อยู่':''}</small></button>`).join('')||'<small>ไม่มีอาวุธในกระเป๋า</small>'}<button type="button" data-eq="none" ${!cur?'class="on"':''} ${why?'disabled':''}><span>ถอดอาวุธ</span><small>มือเปล่า · ดาเมจ ×50%</small></button></div><small class="v35-equip-note">ยกเลิกหรือเลือกของเดิม = ไม่เสียสิทธิ์</small>`;
 box.onclick=e=>{if(e.target.closest('[data-x]'))return closeEquip();let b=e.target.closest('[data-eq]');if(!b||b.disabled)return;let id=b.dataset.eq==='none'?null:Number(b.dataset.eq);if(id===cur){closeEquip();return}equip(id)};
 document.querySelector('#tacticsLayer .field-wrap')?.appendChild(box)}
function equip(id){let why=canSwap();if(why){L().say(why);return}let st=L().getState(),h=st.hero,item=id==null?null:s.inventory.find(x=>x.id===id);if(id!=null&&!item)return;
 s.equipped=item?item.id:null;L().setLoadout(item?item.kind:'unarmed',h.shield);window.TacticsDecks?.consumeItem(st.deck);window.BattleCrystals?.spend('item');if(typeof save==='function')save();
 L().say(item?h.name+' เปลี่ยนเป็น '+weaponLabel(item)+' (ใช้สิทธิ์ไอเทม)':h.name+' ถอดอาวุธ (ใช้สิทธิ์ไอเทม)');window.BattlePolish?.sound('block',.35);closeEquip();window.BattleItems.render();L().stats()}
function hookItems(){let BI=window.BattleItems;if(!BI||BI._v35)return;BI._v35=true;let base=BI.render.bind(BI);
 BI.render=function(){base();let g=document.querySelector('#tacticsHand .item-group');if(!g||g.hidden)return;let row=g.querySelector('.item-row');if(!row||row.querySelector('.v35-equip-btn'))return;let why=canSwap(),b=document.createElement('button');b.type='button';b.className='item-card compact v35-equip-btn';b.dataset.kind='item';b.innerHTML='<b>⚔ อุปกรณ์</b><small>เปลี่ยน/ถอด อาวุธ</small>';b.disabled=!!why;b.title=why||'เปลี่ยนอาวุธจากกระเป๋า · ใช้สิทธิ์ไอเทมของเทิร์นนี้';b.onclick=openEquip;row.prepend(b)};
 let baseDraw=BI.draw.bind(BI);BI.draw=function(){closeEquip();return baseDraw()}}
// no free weapon/shield swap during expeditions: the old side-panel controls only work in training
function guardLoadout(){if(document._v35Loadout)return;document._v35Loadout=true;document.addEventListener('change',e=>{let id=e.target?.id;if(id!=='weapon'&&id!=='shield')return;if(training()||!document.body.classList.contains('tactics-open'))return;let st=L()?.getState();if(!st)return;e.stopImmediatePropagation();e.stopPropagation();if(id==='weapon')e.target.value=st.hero.weapon;else e.target.checked=!!st.hero.shield;L().say('เปลี่ยนอาวุธระหว่างผจญภัยผ่านปุ่ม ⚔ อุปกรณ์ (ใช้สิทธิ์ไอเทม)')},true)}

// ---------- result window details ----------
function unitRows(st,side){let by=st.stats.byUnit||{};return st.units.filter(u=>u.side===side&&!u.removed).map(u=>{let b=by[u.id]||{dealt:0,taken:0,kills:0},state=u.fled?'หนี':u.hp>0?'HP '+u.hp+'/'+u.maxHp:'สลบ';return `<tr class="${u.hp>0?'':'down'}"><td>${window.FFTHud?.portrait(u)||''}</td><td>${esc(u.name)}</td><td>${state}</td><td>${b.dealt}</td><td>${b.taken}</td><td>${b.kills}</td></tr>`}).join('')}
function dropList(st){let by={};for(let d of st.drops||[])if(d.auto&&d.material){let k=d.sourceName||'ศัตรู';(by[k]||={});by[k][d.material]=(by[k][d.material]||0)+(d.amount||1)}let M=typeof MATERIALS!=='undefined'?MATERIALS:{},rows=Object.entries(by).map(([n,m])=>`<li><b>${esc(n)}</b> · ${Object.entries(m).map(([k,v])=>esc((M[k]?.icon||'')+' '+(M[k]?.name||k))+' ×'+v).join(' · ')}</li>`).join('');return rows?`<h4 class="v35-drops-h">🎒 ของดรอปที่เก็บเข้ากระเป๋าอัตโนมัติ</h4><ul class="v35-drops">${rows}</ul>`:''}
function renderDetails(){let ov=$('resultOverlay'),st=L()?.getState();if(!ov||ov.hidden||!st?.outcome)return;let box=ov.querySelector('.v35-details');if(box&&box._st===st)return;box?.remove();
 let win=st.outcome==='win',foes=st.units.filter(u=>u.side==='enemy'&&!u.removed),down=foes.filter(u=>u.hp<=0||u.fled).length,enc=st.encounter,adv=window.Adventure?.state?.();
 let next=training()?'กลับโรงตีเหล็ก':adv?(win?'กลับแผนที่ผจญภัย · จุดนี้ผ่านแล้ว รางวัลรับครั้งเดียว':'เพื่อนพากลับหมู่บ้าน'):enc?(win?'เดินทางกลับหมู่บ้าน (30 นาที)':'ถูกพากลับบ้าน (1 ชั่วโมง)'):'กลับโรงตีเหล็ก';
 box=document.createElement('details');box.className='v35-details';box._st=st;box.open=innerWidth>760;
 box.innerHTML=`<summary>ข้อมูลการต่อสู้ · ศัตรู ${down}/${foes.length} · ${st.round||st.turn} รอบ${C().OBJECTIVES?.[st.objective]?' · เป้าหมาย: '+esc(C().OBJECTIVES[st.objective]):''}</summary><div class="v35-table-wrap"><table><thead><tr><th></th><th>ฝ่ายเรา</th><th>สถานะ</th><th>ทำ</th><th>รับ</th><th>ล้ม</th></tr></thead><tbody>${unitRows(st,'ally')}</tbody></table></div>${dropList(st)}<p class="v35-next">ต่อไป: <b>${esc(next)}</b></p>`;
 let text=$('resultText');text?.after(box)}

// ---------- return travel transition (code-drawn until the AI art arrives; see docs/AI-ART-PROMPTS-v35.md) ----------
let travelling=false;
function travelFrames(){let H=window.HERO_ANIMATIONS?.clips||{},k=['adventure.walk','daily.walk','adventure.run'].find(k=>H[k]?.frames?.length);return k?H[k].frames.map(f=>f.src):['assets/hero.webp']}
function travel(label,ms){return new Promise(done=>{let el=document.createElement('div');el.className='v35-travel';el.setAttribute('role','status');let frames=travelFrames();
 el.innerHTML=`<div class="v35-travel-sky"></div><div class="v35-travel-road"></div><img class="v35-travel-hero" alt="" src="${esc(frames[0])}"><div class="v35-travel-caption"><b>${esc(label)}</b><i><span></span></i><small>แตะเพื่อข้าม</small></div>`;
 $('tacticsLayer').appendChild(el);let img=el.querySelector('img'),bar=el.querySelector('i span'),start=performance.now(),dur=matchMedia('(prefers-reduced-motion: reduce)').matches?250:ms,fin=false;
 let end=()=>{if(fin)return;fin=true;el.classList.add('out');setTimeout(()=>{el.remove();done()},260)};el.onclick=end;
 (function step(now){if(fin)return;let k=Math.min(1,(now-start)/dur);bar.style.width=k*100+'%';img.src=frames[Math.floor(now/120)%frames.length];el.style.setProperty('--k',k);if(k<1)requestAnimationFrame(step);else end()})(start)})}
document.addEventListener('click',async e=>{let b=e.target.closest?.('#tacticsResultExit');if(!b||travelling)return;let st=L()?.getState();if(!st?.outcome)return;e.preventDefault();e.stopImmediatePropagation();travelling=true;
 let adv=window.Adventure?.state?.(),win=st.outcome==='win',label=training()?'กลับโรงตีเหล็ก…':adv?(win?'กลับสู่เส้นทางผจญภัย…':'เพื่อนพาคุณกลับหมู่บ้าน…'):win?'เดินทางกลับหมู่บ้าน…':'ถูกพากลับบ้าน…';
 try{await travel(label,training()?900:1800);window.closeTactical?.()}finally{travelling=false}},true);

// ---------- wiring ----------
function boot(){hookItems();guardLoadout();let ov=$('resultOverlay');if(ov&&!ov._v35){ov._v35=true;new MutationObserver(()=>setTimeout(renderDetails,30)).observe(ov,{attributes:true,attributeFilter:['hidden']})}}
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&$('v35Equip')){closeEquip();e.stopImmediatePropagation()}},true);
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();setTimeout(boot,500);
window.BattleV35={openEquip,equip,canSwap,renderDetails,travel};
})();

/* ======================= section: battle-v36.js ======================= */
/* v36 battle command flow (FFT / Disgaea style)
   • The unit whose CT came up gets three command icons over its head: Move · Fight · Item.
     Player units pick there and the matching card pile fans out; AI units go through the same icons so you
     can see what the monster chose (icon lights up, then its action card pops before it acts).
   • End-turn button at the unit's feet. CT portraits open a status window. Enemy drops fly into the bag. */
(function(){'use strict';
const $=id=>document.getElementById(id),L=()=>window.TacticsLab,C=()=>window.TacticsCore;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const pace=k=>((L()?.pace||window.BATTLE_PACE||{})[k]||0)/(window.GAME_SPEED||1);
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let layer=null,ui=null,icons=null,feet=null,aiCard=null,bagEl=null,hand=null,openGroup=null,ai=null,bagCount=0,lastState=null;
const GROUP={move:'.move-group',combat:'.combat-group',item:'.item-group'};

function build(){layer=$('tacticsLayer');if(!layer||$('v36Cmd'))return!!$('v36Cmd');
 ui=document.createElement('div');ui.id='v36Cmd';ui.className='v36-cmd';
 ui.innerHTML=`<div class="v36-icons" role="toolbar" aria-label="คำสั่ง"><div class="v53-crystals" aria-label="คริสตัลคำสั่ง"><i></i><i></i><i></i></div><button type="button" data-cmd="cards" title="การ์ดต่อสู้ · สกิล · ไอเทม (1–6)"><i>🂡</i><span>การ์ด</span></button></div><button type="button" class="v36-feet" title="จบเทิร์น (Enter / Space)">จบเทิร์น ⏎</button><div class="v36-aicard" hidden></div>`;
 layer.appendChild(ui);icons=ui.querySelector('.v36-icons');feet=ui.querySelector('.v36-feet');aiCard=ui.querySelector('.v36-aicard');
 bagEl=document.createElement('div');bagEl.id='v36Bag';bagEl.className='v36-bag';bagEl.innerHTML='<span>🎒</span><b>0</b><small>ของดรอป</small>';layer.appendChild(bagEl);
 hand=$('tacticsHand');if(hand){layer.appendChild(hand);hand.classList.add('v36-fan')}
 icons.addEventListener('click',e=>{let b=e.target.closest('[data-cmd]');if(!b||b.disabled||ai)return;let g=b.dataset.cmd;window.BattlePolish?.sound('ui',.25);setOpen(openGroup===g?null:g)});
 feet.addEventListener('click',()=>{if(!ai)L()?.endTurn()});
 hand?.addEventListener('click',e=>{let f=e.target.closest('[data-filter]');if(f){e.stopPropagation();hand.dataset.filter=f.dataset.filter;hand.querySelectorAll('[data-filter]').forEach(b=>b.classList.toggle('on',b===f));return}if(e.target.closest('.tactic-card.combat,.item-card:not(.v36-keep)'))setTimeout(()=>setOpen(null),0)});
 buildWalk();
 document.addEventListener('pointerdown',e=>{if(openGroup&&!e.target.closest('#tacticsHand,.v36-icons,#v35Equip,#gameDialog,#v53Walk'))setOpen(null)},true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&openGroup){setOpen(null);e.stopImmediatePropagation()}},true);
 document.addEventListener('click',onQueueClick,true);
 return true}
// v53: walk cards live in a strip at the bottom (picked automatically, click to pin); one fan holds combat cards + items
let walk=null;
function buildWalk(){if(walk||!layer)return;let g=hand?.querySelector('.move-group');if(!g)return;walk=document.createElement('div');walk.id='v53Walk';walk.className='v53-walk';walk.setAttribute('aria-label','ไพ่เดิน');walk.appendChild(g);layer.appendChild(walk);
 if(hand&&!hand.querySelector('.v53-filter')){let f=document.createElement('div');f.className='v53-filter';f.setAttribute('role','toolbar');f.setAttribute('aria-label','กรองการ์ด');f.innerHTML=[['all','ทั้งหมด'],['attack','⚔ โจมตี'],['skill','✦ สกิล'],['item','🎒 ไอเทม'],['react','🂠 ตอบโต้']].map(([k,t],i)=>`<button type="button" data-filter="${k}" class="${i?'':'on'}">${t}</button>`).join('');hand.prepend(f);hand.dataset.filter='all'}}
function setOpen(g){openGroup=g;if(!hand)return;hand.dataset.show=g||'';hand.classList.toggle('open',!!g);if(g==='cards'||g==='item')window.BattleItems?.render();if(g)window.BattleJuice?.fanOpen(hand);icons?.querySelectorAll('[data-cmd]').forEach(b=>b.classList.toggle('open',b.dataset.cmd===g))}

// screen position of a unit relative to the battle layer
function screenOf(u){let lab=L(),p=lab.unitPoint(u),c=lab.canvas.getBoundingClientRect(),l=layer.getBoundingClientRect(),cam=lab.camera(),T=C().ENEMY_TYPES[u.kind],h=cam.w*(u.side==='enemy'?1.6*Math.max(.8,T?.scale||1):1.6);return {x:p.x+c.left-l.left,y:p.y+c.top-l.top,head:p.y+c.top-l.top-h,w:cam.w,h:cam.h}}
function playerReady(st){return !window.BattleCardFlow?.busy&&st&&st.phase==='player'&&!st.outcome&&!L().isLocked()&&!ai}
function cmdState(st){let base=cmdState0(st);return {...base,cards:base.combat&&base.item}}
function cmdState0(st){let d=st.deck,BI=window.BattleItems,h=st.hero,D=window.TacticsDecks,moveOff=!d||!!D.actionBlock(d,'move')||h.casting,combatOff=!d||!!D.actionBlock(d,'combat')||h.casting,itemOff=!BI||!d||!!D.actionBlock(d,'item');return {move:!!moveOff&&!(h.mp>0),combat:!!combatOff,item:!!itemOff}}
function loop(){requestAnimationFrame(loop);if(!layer&&!build())return;let on=layer.classList.contains('fullbattle')&&!layer.hidden,st=on&&L()?.getState();if(!st){ui.hidden=true;bagEl.hidden=true;if(openGroup)setOpen(null);return}
 if(st!==lastState){lastState=st;bagCount=(st.drops||[]).filter(d=>d.auto).length;bagEl.querySelector('b').textContent=bagCount}
 ui.hidden=false;bagEl.hidden=false;let ready=playerReady(st),u=ai?.u||st.active||st.hero;if(!u||!C().alive(u)&&!ai){icons.hidden=feet.hidden=true;return}
 let p=screenOf(u);icons.hidden=!(ready||ai);feet.hidden=!ready;
 if(!icons.hidden){icons.style.left=p.x+'px';icons.style.top=Math.max(64,p.head-p.w*.75)+'px';icons.classList.toggle('ai',!!ai);
  let face=!ai&&L().facingPending(),off=ai?{cards:false}:face?{cards:true}:cmdState(st),sel=st.selected;icons.querySelectorAll('[data-cmd]').forEach(b=>{let k=b.dataset.cmd;b.disabled=!!off[k];b.classList.toggle('picked',ai?ai.pick==='combat'&&k==='cards':k==='cards'&&typeof sel==='number')});window.BattleCrystals?.show(icons.querySelector('.v53-crystals'),ai?null:st.deck,ai?ai.u:st.hero)}
 if(walk){walk.hidden=!ready||!!ai;if(!walk.hidden)walk.classList.toggle('spent',!!window.TacticsDecks?.actionBlock(st.deck,'move'))}
 if(!feet.hidden){feet.disabled=L().facingPending();feet.title=feet.disabled?'เลือกทิศหันก่อน':'จบเทิร์น (Enter / Space)';feet.style.left=p.x+'px';feet.style.top=(p.y+p.h*.95)+'px'}
 if(aiCard&&!aiCard.hidden){aiCard.style.left=p.x+'px';aiCard.style.top=Math.max(60,p.head-p.w*.75-74)+'px'}
 if(!ready&&openGroup)setOpen(null);
 if(openGroup&&hand){let r=layer.getBoundingClientRect(),hw=hand.offsetWidth,hh=hand.offsetHeight,x=Math.max(8,Math.min(r.width-hw-8,p.x-hw/2)),top=Math.max(64,p.head-30)-hh-14;if(top<64)top=Math.min(r.height-hh-8,p.y+p.h*1.6+34);hand.style.left=x+'px';hand.style.top=top+'px'}}

// AI goes through the same command icons so the player can read its decision
async function aiChoose(u,kind,info={}){if(u?.side==='enemy')return;/* v38b: monsters act straight away — no command icons / choice card */if(!build()||!$('tacticsLayer')?.classList.contains('fullbattle'))return;let pick=kind==='move'?'move':kind==='attack'?'combat':null;ai={u,pick:null};await wait(pace('aiChoice')*.45);ai.pick=pick;await wait(pace('aiChoice')*.55);
 let text=kind==='move'?`<i>👣</i><b>เคลื่อนที่</b><small>${info.steps||0} ช่อง</small>`:kind==='attack'?`<i>${info.boss?'✦':'⚔'}</i><b>${esc(info.name||'โจมตี')}</b><small>→ ${esc(info.target?.name||'')}</small>`:`<i>…</i><b>รอจังหวะ</b><small>ไม่มีเป้าในระยะ</small>`;
 aiCard.className='v36-aicard '+(u.side==='enemy'?'enemy':'ally')+' '+kind;aiCard.innerHTML=text;aiCard.hidden=false;window.BattlePolish?.sound('cast',.18);await wait(pace('aiCard'));aiCard.hidden=true;ai=null}

// CT portraits → status window (and a camera peek at that unit)
function onQueueClick(e){let q=e.target.closest?.('#fftHud .fb-q');if(!q)return;e.preventDefault();e.stopImmediatePropagation();let st=L()?.getState(),u=st?.units.find(x=>x.id===q.dataset.uid);if(u)statusWindow(u)}
function statusWindow(u){$('v36Status')?.remove();let st=L().getState(),Cc=C(),T=Cc.ENEMY_TYPES[u.kind],E=Cc.ELEMENT_NAMES?.[u.element||Cc.WEAPON_ELEMENT?.[u.weapon]]||'',tile=Cc.at(st.map,u.x,u.y),TR=Cc.TERRAIN?.[tile?.kind]||{},bar=(v,m,c)=>`<span class="v36-bar ${c}"><i style="width:${Math.max(0,Math.min(100,v/m*100))}%"></i></span>`;
 let rows=[['ธาตุ',E||'-'],['ความเร็ว',Cc.speedOf(u)],u.side==='ally'?['อาวุธ',u.weapon==='unarmed'||!u.weapon?'มือเปล่า':Cc.WEAPONS[u.weapon]?.name||u.weapon]:['ระดับ',Cc.RANKS?.[T?.rank||'normal']||'-'],T?['เดิน',T.move+' ช่อง'+(T.ranged?' · ยิงไกล '+T.rangedReach:'')]:null,T&&Cc.enemyRole?['แทคติก',Cc.ROLE_NAMES[Cc.enemyRole(u.kind)]]:null,u.recover?['ชาร์จหลังร่าย','CT −'+u.recover.ct]:null,['ยืนบน',(TR.name||'-')+(TR.note?' · '+TR.note:'')],(u.traits||[]).length?['คุณสมบัติ',u.traits.map(k=>Cc.TRAITS[k]).join(' · ')]:null,u.guard?['เกราะ',u.guard]:null,Cc.BOSS_SKILLS?.[u.kind]?['ทักษะบอส',Object.values(Cc.BOSS_SKILLS[u.kind]).map(x=>x.name).join(' · ')]:null,u.casting?['กำลังร่าย',u.casting.name+' · ออกผล CT ถัดไป']:null].filter(Boolean);
 let statuses=Object.entries(u.statuses||{}).map(([k,v])=>{let d=Cc.STATUS[k];return d?`<span style="color:${d.color}">${d.icon} ${d.name} ${v.turns} CT</span>`:''}).join('')||'<span>ปกติ</span>';
 let el=document.createElement('div');el.id='v36Status';el.className='v36-status '+u.side;el.setAttribute('role','dialog');el.setAttribute('aria-label','สถานะ '+u.name);
 el.innerHTML=`<header>${window.FFTHud?.portrait(u,true)||''}<div><b>${esc(u.name)}</b><small>${u.level?'Lv.'+u.level+' · ':''}${u.side==='enemy'?'ศัตรู':'ฝ่ายเรา'}${u.hp<=0?' · สลบ '+(u.downTurns??'')+' CT':''}</small></div><button type="button" data-x aria-label="ปิด">×</button></header>
 <div class="v36-st-bars"><label>HP</label>${bar(u.hp,u.maxHp,'hp')}<em>${u.hp}/${u.maxHp}</em>${u.stamina!=null&&u.side==='ally'?`<label>แรง</label>${bar(u.stamina,100,'st')}<em>${Math.round(u.stamina)}</em>`:''}<label>CT</label>${bar(Math.min(100,u.ct||0),100,'ct')}<em>${Math.round(u.ct||0)}</em></div>
 <dl>${rows.map(([k,v])=>`<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl><div class="v36-st-status">${statuses}</div>
 ${u.side==='ally'&&u.id!=='hero'&&u!==st.active?`<button type="button" class="v36-auto" data-auto>${u.auto?'ปิด Auto (เล่นเอง)':'เปิด Auto ให้ AI เล่น'}</button>`:''}`;
 layer.appendChild(el);let back=()=>{el.remove();if(!L().isLocked())L().focusUnit(st.active||st.hero)};
 el.querySelector('[data-x]').onclick=back;el.querySelector('[data-auto]')?.addEventListener('click',()=>{u.auto=!u.auto;window.FFTHud?.reset();back()});
 let esc2=e=>{if(e.key==='Escape'&&$('v36Status')){e.stopImmediatePropagation();back();document.removeEventListener('keydown',esc2,true)}};document.addEventListener('keydown',esc2,true);
 if(!L().isLocked())L().focusUnit(u)}

// enemy drops fly into the bag
function lootFly(u,drop){if(!build()||!drop)return;let p=screenOf(u),b=bagEl.getBoundingClientRect(),l=layer.getBoundingClientRect(),tx=b.left-l.left+b.width/2,ty=b.top-l.top+b.height/2,M=typeof MATERIALS!=='undefined'?MATERIALS[drop.material]:null;
 let el=document.createElement('div');el.className='v36-loot';el.innerHTML=`<i></i><small>${esc(M?M.icon+' '+M.name:'ของดรอป')} +${drop.amount||1}</small>`;el.style.left=p.x+'px';el.style.top=(p.y-p.w*.6)+'px';layer.appendChild(el);
 let dx=tx-p.x,dy=ty-(p.y-p.w*.6),dur=Math.max(500,1100/(window.GAME_SPEED||1));
 el.animate([{transform:'translate(-50%,-50%) scale(.4)',opacity:0},{transform:'translate(-50%,-120%) scale(1.15)',opacity:1,offset:.25},{transform:`translate(calc(-50% + ${dx*.5}px),calc(-50% + ${dy*.5-80}px)) scale(1)`,opacity:1,offset:.6},{transform:`translate(calc(-50% + ${dx}px),calc(-50% + ${dy}px)) scale(.35)`,opacity:.2}],{duration:dur,easing:'ease-in-out',fill:'forwards'}).finished.then(()=>{el.remove();bagCount++;bagEl.querySelector('b').textContent=bagCount;bagEl.animate([{transform:'scale(1)'},{transform:'scale(1.25)'},{transform:'scale(1)'}],{duration:320});window.BattlePolish?.sound('loot',.4)}).catch(()=>el.remove())}

function boot(){build();requestAnimationFrame(loop)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();
window.BattleCmd={aiChoose,lootFly,statusWindow,setOpen};
})();

/* ======================= section: battle-v37.js ======================= */
/* v37 item effects — each consumable gets its own code-drawn effect and a card that pops above the user. */
(function(){'use strict';
const L=()=>window.TacticsLab,esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const THROW={fire:['fire','#ff9a3c'],ice:['ice','#bfe6f8'],wind:['lightning','#fff6a8'],lightning:['lightning','#fff6a8'],water:['ice','#7fd3f0'],nature:['arcane','#9be07a'],light:['arcane','#fff2b0'],dark:['arcane','#b49ae8'],chaos:['arcane','#c58aff']};
function pop(u,d){let layer=document.getElementById('tacticsLayer'),lab=L();if(!layer||!lab?.unitPoint)return;let p=lab.unitPoint(u),c=lab.canvas.getBoundingClientRect(),l=layer.getBoundingClientRect(),cam=lab.camera(),el=document.createElement('div');
 el.className='v37-itemcard '+(d.damage?'attack':d.guard?'guard':'heal');el.innerHTML=`<i>${d.damage?'💥':d.guard?'🛡':d.stamina&&!d.hp?'⚡':'✚'}</i><b>${esc(d.name)}</b><small>${esc(d.text||'')}</small>`;
 el.style.left=(p.x+c.left-l.left)+'px';el.style.top=(p.y+c.top-l.top-cam.w*2.3)+'px';layer.appendChild(el);setTimeout(()=>el.classList.add('out'),1100/(window.GAME_SPEED||1));setTimeout(()=>el.remove(),1500/(window.GAME_SPEED||1))}
function item(k,d,user,target,info={}){let lab=L();if(!lab?.playFx||!d)return;pop(user,d);let S=window.BattlePolish;
 if(d.damage){let [kind,color]=THROW[d.element]||['stone','#d8c095'];lab.playFx(kind,target,user,{color,scale:1.35});setTimeout(()=>{lab.playFx(kind==='fire'?'fire':'blunt',target,user,{color,scale:1.1});lab.playFx('buff',target,null,{color})},420);S?.sound(kind==='lightning'?'lightning':kind==='fire'?'fire':'magic',.6);return}
 if(d.guard){lab.playFx('shield',user,user,{scale:1.4});lab.playFx('buff',user,null,{color:'#9fd4ff',scale:1.2});lab.fxText(user,'#a9d7ff','เกราะ +'+d.guard);S?.sound('block',.5);return}
 if(d.hp){lab.playFx('heal',user,null,{color:d.rarity==='rare'?'#ffe9a0':'#8fe08a',scale:d.hp>=50?1.6:1.25});if(info.hp)lab.fxText(user,'#64edaf','+'+info.hp+' HP')}
 if(d.stamina){setTimeout(()=>{lab.playFx('buff',user,null,{color:'#ffd45a',scale:1.3});if(info.st)lab.fxText(user,'#ffd45a','+'+info.st+' แรง')},d.hp?380:0)}
 if(d.rarity==='rare')setTimeout(()=>lab.playFx('arcane',user,user,{color:'#fff2b0',scale:1.4}),200);
 S?.sound('heal',.55)}
let css=document.createElement('style');css.textContent=`.v37-itemcard{position:absolute;z-index:46;transform:translate(-50%,-100%);display:grid;grid-template-columns:auto 1fr;column-gap:8px;align-items:center;min-width:160px;max-width:240px;padding:8px 12px;border-radius:10px;border:2px solid #d9b46b;background:linear-gradient(#1d2a44,#121b2e);color:#f5e6c4;box-shadow:0 10px 26px #000c;pointer-events:none;animation:v37-card .35s cubic-bezier(.2,1.4,.4,1);transition:opacity .35s,transform .35s}
.v37-itemcard.attack{border-color:#ff9a6a}.v37-itemcard.guard{border-color:#9fd4ff}.v37-itemcard.heal{border-color:#8fe08a}.v37-itemcard.out{opacity:0;transform:translate(-50%,-130%)}
.v37-itemcard i{grid-row:span 2;font-style:normal;font-size:24px}.v37-itemcard b{font:700 14px Georgia,serif;color:#ffe8a6}.v37-itemcard small{font-size:11px;opacity:.85}
@keyframes v37-card{from{opacity:0;transform:translate(-50%,-70%) scale(.6)}to{opacity:1;transform:translate(-50%,-100%) scale(1)}}`;document.head.appendChild(css);
window.BattleFx={item};
})();

/* ======================= section: battle-flow-v38.js ======================= */
/* v38 slow-burn presentation (FFT / Disgaea pacing) + card/command extras.
   turn banner · ability banner · "Execute?" window · deploy phase · battle speed · cast timing choice ·
   EXP / level-up screen · encounter transition · market greeting · deck migration for the new cards.
   Everything here is code-drawn; art to replace it is listed in docs/AI-ART-PROMPTS-v35.md (section 10). */
(function(){'use strict';
const $=id=>document.getElementById(id),L=()=>window.TacticsLab,C=()=>window.TacticsCore;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const layer=()=>$('tacticsLayer'),full=()=>!!layer()&&!layer().hidden&&layer().classList.contains('fullbattle');
const wait=ms=>new Promise(r=>setTimeout(r,ms/(window.GAME_SPEED||1)));
const store={get(k,d){try{let v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};

// ---------- battle speed (1× / 2× / 3×) + hold to fast-forward ----------
let speedMul=store.get('project-a-battle-speed',1),boost=false;
function base(){return (typeof s!=='undefined'&&s.village?.settings?.speed)||1}
function applySpeed(){window.GAME_SPEED=base()*(full()?speedMul*(boost?2.5:1):1);let b=$('v38Speed');if(b){b.textContent=speedMul+'×'+(boost?' ⏩':'');b.classList.toggle('boost',boost)}}
function speedButton(){let dock=$('battleArtDock');if(!dock||$('v38Speed'))return;let b=document.createElement('button');b.id='v38Speed';b.type='button';b.className='v38-speed';b.title='ความเร็วการต่อสู้ (กด Shift ค้าง หรือกดค้างบนสนามตอนศัตรูเล่น เพื่อเร่ง)';b.onclick=()=>{speedMul=speedMul>=3?1:speedMul+1;store.set('project-a-battle-speed',speedMul);applySpeed()};dock.appendChild(b);applySpeed()}
document.addEventListener('keydown',e=>{if(e.key==='Shift'&&full()&&!boost){boost=true;applySpeed()}});
document.addEventListener('keyup',e=>{if(e.key==='Shift'&&boost){boost=false;applySpeed()}});
document.addEventListener('pointerdown',e=>{if(full()&&e.target.id==='battleCanvas'&&L()?.isLocked()&&L().getState().phase!=='player'){boost=true;applySpeed()}},true);
document.addEventListener('pointerup',()=>{if(boost){boost=false;applySpeed()}},true);

// ---------- turn banner + ability banner ----------
async function turnBanner(u){if(!full()||!u)return;let el=document.createElement('div');el.className='v38-turn '+u.side;el.innerHTML=`${window.FFTHud?.portrait(u,true)||''}<div><small>${u.side==='enemy'?'ตาศัตรู':'ตาของเรา'}</small><b>${esc(u.name)}</b></div>`;layer().appendChild(el);window.BattlePolish?.sound('cast',.15);await wait((L()?.pace?.turnBanner)||900);el.classList.add('out');setTimeout(()=>el.remove(),300)}
let abilityEl=null,abilityTimer=0;
function ability(name,side){if(!full()||!name)return;if(!abilityEl){abilityEl=document.createElement('div');abilityEl.className='v38-ability';layer().appendChild(abilityEl)}abilityEl.className='v38-ability show '+(side||'');abilityEl.textContent=name;clearTimeout(abilityTimer);abilityTimer=setTimeout(()=>abilityEl&&(abilityEl.className='v38-ability '+(side||'')),1300/(window.GAME_SPEED||1))}

// ---------- "Execute?" window ----------
const confirmOn=()=>store.get('project-a-confirm-attack',true);
function confirmAttack(st,i,u,go){$('v38Confirm')?.remove();let card=st.deck.combat.hand[i],pv=C().previewCard(st,i,u),name=window.TacticsDecks?.COMBAT[card.id]?.name||card.id;if(!pv){go();return}
 let el=document.createElement('div');el.id='v38Confirm';el.className='v38-confirm';el.setAttribute('role','dialog');
 el.innerHTML=`<header><b>${esc(name)}</b><span>→ ${esc(u.name)}</span></header><div class="v38-cf-hp"><span>HP ${u.hp}</span><i><em style="width:${pv.hpAfter/u.maxHp*100}%"></em><u style="left:${pv.hpAfter/u.maxHp*100}%;width:${(u.hp-pv.hpAfter)/u.maxHp*100}%"></u></i><span>→ <b>${pv.hpAfter}</b>${pv.hpAfter<=0?' สลบ':''}</span></div><p>ดาเมจ <b>${pv.damage}</b> (คริ ${pv.critDamage}) · โดน ${pv.hit}% · คริ ${pv.crit}% · ${esc(pv.angle)}</p>${pv.notes.length?`<small>${esc(pv.notes.join(' · '))}</small>`:''}${pv.cast?`<small class="v38-cf-mode">จังหวะร่าย: ${esc(C().CAST_MODES[st.castMode||'heavy'].name)} · ${esc(C().CAST_MODES[st.castMode||'heavy'].note)}</small>`:''}<footer><button type="button" data-no>ยกเลิก</button><button type="button" class="primary" data-ok>ดำเนินการ ⏎</button></footer>`;
 layer().appendChild(el);let done=ok=>{el.remove();document.removeEventListener('keydown',key,true);if(ok)go()},key=e=>{if(e.key==='Enter'){e.preventDefault();e.stopImmediatePropagation();done(true)}if(e.key==='Escape'){e.preventDefault();e.stopImmediatePropagation();done(false)}};
 el.querySelector('[data-ok]').onclick=()=>done(true);el.querySelector('[data-no]').onclick=()=>done(false);document.addEventListener('keydown',key,true);setTimeout(()=>el.querySelector('[data-ok]').focus(),30)}

// ---------- v38f prediction window beside the locked (or hovered out-of-range) target ----------
let pbKey='';
function predictBox(){let lab=L(),box=$('v38Predict');let st=lab?.getState?.(),lock=full()&&st&&!lab.isLocked()&&st.phase==='player'?lab.lockTarget():null,out=!lock&&full()&&st&&!lab.isLocked()?lab.hoverOut():null,u=lock||out;
 if(!u){if(box)box.hidden=true;pbKey='';return}if(!box){box=document.createElement('div');box.id='v38Predict';box.className='v38-predict';layer().appendChild(box)}
 let i=st.selected,card=st.deck.combat.hand[i],pv=lock?C().previewCard(st,i,u):null,why=out?C().combatReason(st,i,u):'',key=[u.id,u.hp,i,st.castMode,why,st.hero.x,st.hero.y,st.hero.facing].join('|');
 if(key!==pbKey){pbKey=key;let name=window.TacticsDecks?.COMBAT[card?.id]?.name||'';
  box.className='v38-predict '+(lock?'lock':'out');box.innerHTML=lock&&pv?`<header><b>${esc(name)}</b> → ${esc(u.name)}</header><div class="v38-cf-hp"><span>HP ${u.hp}</span><i><em style="width:${pv.hpAfter/u.maxHp*100}%"></em><u style="left:${pv.hpAfter/u.maxHp*100}%;width:${(u.hp-pv.hpAfter)/u.maxHp*100}%"></u></i><span>→ <b>${pv.hpAfter}</b>${pv.hpAfter<=0?' สลบ':''}</span></div><p>ดาเมจ <b>${pv.damage}</b> (คริ ${pv.critDamage}) · โดน ${pv.hit}% · คริ ${pv.crit}%</p><small>${esc(pv.angle)}${pv.notes.length?' · '+esc(pv.notes.join(' · ')):''}</small><footer>คลิกเป้าซ้ำ / Enter = โจมตี · Esc = ยกเลิก</footer>`:`<header><b>${esc(u.name)}</b></header><p class="v38-why">${esc(why||'อยู่นอกระยะ')}</p>`}
 box.hidden=false;let p=lab.unitPoint(u),c=lab.canvas.getBoundingClientRect(),l=layer().getBoundingClientRect(),cam=lab.camera(),x=p.x+c.left-l.left,y=lab.headY(u)+c.top-l.top,w=box.offsetWidth||240,h=box.offsetHeight||110,gap=cam.w*.75;
 let left=x+gap;if(left+w>l.width-8)left=x-gap-w;if(left<8)left=8;let top=Math.max(60,Math.min(l.height-h-8,y-10));box.style.left=left+'px';box.style.top=top+'px'}
// ---------- v38g land info window (Disgaea-style): what is under the cursor ----------
const OBJ_NAMES={tree:'ต้นไม้',pine:'ต้นสน',pillar:'เสาหิน',beam:'คานไม้เหมือง',stalagmite:'หินงอก',standstone:'หินตั้ง',rock:'ก้อนหิน',stump:'ตอไม้',log:'ขอนไม้',mossrock:'หินตะไคร่',bush:'พุ่มไม้',crystal:'ผลึก',cart:'รถเข็นแร่',crates:'ลังไม้',barrel:'ถังไม้',orepile:'กองแร่','ancient-tree':'ต้นไม้ยักษ์','fallen-trunk':'ซุงล้ม','rock-outcrop':'ผาหิน','mine-wagon':'รถแร่','crystal-cluster':'กลุ่มผลึกยักษ์','ruined-wall':'กำแพงพัง'};
const DECOR_NAMES={fern:'เฟิร์น',leaves:'ใบไม้ร่วง',bones:'กระดูก',flowers:'ดอกไม้',mushrooms:'เห็ด',tools:'เครื่องมือ',pebbles:'กรวดเล็ก',web:'ใยแมงมุม',lamp:'ตะเกียง'};
let tiKey='';
function tileInfo(){let lab=L(),box=$('v38Tile'),st=full()&&lab?.getState?.(),t=st&&lab.hover?.();if(!t||lab.isDeploying?.()&&false){if(box)box.hidden=true;tiKey='';return}
 if(!box){box=document.createElement('div');box.id='v38Tile';box.className='v38-tile';layer().appendChild(box)}
 let Cc=C(),T=Cc.TERRAIN?.[t.kind]||{},u=Cc.unitAt(st,t.x,t.y),obj=(st.map.objects||[]).find(o=>t.x>=o.x&&t.x<o.x+o.w&&t.y>=o.y&&t.y<o.y+o.h),reach=st.phase==='player'?lab.pathPreview?.():null,key=[t.x,t.y,t.kind,t.h,u?.id,u?.hp,reach?.dest,st.weather].join('|');box.hidden=false;if(key===tiKey)return;tiKey=key;
 let E=k=>Cc.ELEMENT_NAMES?.[k]||k,fx=[];if(T.def)fx.push('ป้องกัน '+(T.def>0?'+':'')+T.def);if(T.heavyDef)fx.push('ตัวหนัก ป้องกัน +'+T.heavyDef);if(T.boost?.length)fx.push('ธาตุ'+T.boost.map(E).join('/')+' แรงขึ้น');if(T.weak?.length)fx.push('ธาตุ'+T.weak.map(E).join('/')+' แรงขึ้นต่อผู้ยืน');if(T.resist?.length)fx.push('ธาตุ'+T.resist.map(E).join('/')+' −25%');if(T.slow)fx.push('เทิร์นถัดไปเดิน −'+T.slow);if(T.slide)fx.push('ลื่นไถล 1 ช่อง');if(T.rangedCover)fx.push('กันยิงไกล −25%');if(T.hide&&T.wet)fx.push('ตัวจมลง');if(T.heavyStop)fx.push('ตัวหนักต้องหยุด');if(T.light)fx.push('เท้าเบาเดินง่าย');
 let pname=t.prop?OBJ_NAMES[t.prop]||t.prop:null,oname=obj?OBJ_NAMES[obj.type]||obj.type:null,ph=t.prop?Cc.PROP_H?.[t.prop]:null;
 box.innerHTML=`<header><b>${esc(T.name||t.kind)}</b><span class="v38-h">สูง ${t.h}</span></header>
 <div class="v38-tile-grid"><span>ค่าเดิน</span><b>${T.cost>=50?'เดินไม่ได้':T.cost??1}</b><span>ช่อง</span><b>${t.x+1}, ${t.y+1}</b></div>
 ${fx.length?`<ul>${fx.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<p class="v38-tile-none">ไม่มีผลพิเศษ</p>'}
 ${pname||oname?`<p class="v38-tile-obj">◆ ${esc(oname||pname)}${ph?` · สูง ${ph}`:''}${t.blocked?' · ยืนไม่ได้ · บังแนวยิง':' · ข้ามได้'}</p>`:''}${t.decor?`<p class="v38-tile-dec">ของตกแต่ง: ${esc(DECOR_NAMES[t.decor]||t.decor)}</p>`:''}
 ${u?`<p class="v38-tile-unit ${u.side}">${u.side==='enemy'?'ศัตรู':'ฝ่ายเรา'}: <b>${esc(u.name)}</b> HP ${u.hp}/${u.maxHp}</p>`:''}${reach?.dest===t.x+','+t.y?`<p class="v38-tile-move">เดิน ${reach.steps} ช่อง · ใช้กำลังเดิน ${reach.cost}</p>`:''}${T.note?`<small>${esc(T.note)}</small>`:''}`}
// ---------- deploy phase ----------
function deploy(on,done){$('v38Deploy')?.remove();if(!on)return;let el=document.createElement('div');el.id='v38Deploy';el.className='v38-deploy';let st=L().getState(),obj=C().OBJECTIVES?.[st.objective]||'';
 el.innerHTML=`<b>วางตำแหน่งทีม</b><p>คลิกตัวละคร แล้วคลิกช่องสีเขียวเพื่อย้าย · คลิกเพื่อนอีกคนเพื่อสลับที่</p>${obj?`<p class="v38-obj">เป้าหมาย: <b>${esc(obj)}</b></p>`:''}<button type="button" class="primary">⚔ เริ่มการต่อสู้</button>`;
 layer().appendChild(el);el.querySelector('button').onclick=()=>{el.remove();done()}}

// ---------- cast timing choice (quick / heavy / channel) ----------
const CAST=['spell','frost','quake','thunder'];
function castBar(){let st=L()?.getState(),bar=$('v38Cast');let card=st&&typeof st.selected==='number'?st.deck?.combat.hand[st.selected]:null,show=full()&&card&&CAST.includes(card.id)&&st.phase==='player'&&!L().isLocked();
 if(!show){if(bar)bar.hidden=true;return}if(!bar){bar=document.createElement('div');bar.id='v38Cast';bar.className='v38-cast';layer().appendChild(bar);bar.onclick=e=>{let b=e.target.closest('[data-mode]');if(!b)return;L().getState().castMode=b.dataset.mode;L().stats();sig=''}}
 let M=C().CAST_MODES,mode=st.castMode||'heavy',k=card.uid+mode;bar.hidden=false;if(bar._k===k)return;bar._k=k;bar.innerHTML='<small>จังหวะร่าย</small>'+Object.entries(M).map(([id,m])=>`<button type="button" data-mode="${id}" class="${id===mode?'on':''}" title="${esc(m.note)}"><b>${esc(m.name)}</b><span>${esc(m.note)}</span></button>`).join('')}
let sig='';

// ---------- EXP / level-up screen ----------
function expScreen(){let ov=$('resultOverlay'),st=L()?.getState();if(!ov||ov.hidden||!st?.outcome||st.outcome!=='win')return;let box=ov.querySelector('.v38-exp');if(box&&box._st===st)return;box?.remove();
 let rows=[],hero=typeof s!=='undefined'?s.village?.character:null,hx=st.rewardSummary?.xp||0;if(hero)rows.push({name:(st.leader||st.hero).name,xp:hx,pct:Math.min(100,hero.xp/(hero.level*100)*100),level:hero.level,up:!!st.heroLevelUp,u:st.leader||st.hero});
 for(let c of st.expReport||[]){let u=st.units.find(x=>x.key===c.key)||{name:c.name,side:'ally',key:c.key};rows.push({name:c.name,xp:c.xp,pct:c.levelUp?100:60,level:c.level,up:c.levelUp,u})}
 if(!rows.length)return;box=document.createElement('div');box.className='v38-exp';box._st=st;box.innerHTML='<h4>EXP</h4>'+rows.map((r,i)=>`<div class="v38-exp-row" style="--d:${i*.45}s">${window.FFTHud?.portrait(r.u)||''}<span>${esc(r.name)} <small>Lv.${r.level}</small></span><i><em style="--w:${r.pct}%"></em></i><b>+${r.xp}</b>${r.up?'<strong>LEVEL UP!</strong>':''}</div>`).join('');
 let t=ov.querySelector('.v35-details')||$('resultText');t?.after(box)}

// ---------- encounter transition ----------
function encounter(cb){let el=document.createElement('div');el.className='v38-encounter';el.innerHTML='<i></i><i></i><i></i><b>ENCOUNTER</b>';document.body.appendChild(el);window.BattlePolish?.sound('critical',.35);let dur=matchMedia('(prefers-reduced-motion: reduce)').matches?150:1100;setTimeout(()=>{try{cb()}finally{el.classList.add('out');setTimeout(()=>el.remove(),450)}},dur)}

// ---------- market greeting (once per day) ----------
function greet(){if(typeof openPanel!=='function'||openPanel._v38)return;let base=openPanel;openPanel=function(w){if(w==='market'&&typeof s!=='undefined'&&s.village&&s.village.lastGreet!==s.day){s.village.lastGreet=s.day;let lines=['มาแล้วเหรอ นักผจญภัย วันนี้มีของดีเข้ามาเยอะเลยนะ','ของป่าที่เก็บมาขายได้ราคาดีวันนี้ ลองดูสิ','ระวังตัวด้วยนะ ได้ยินว่าทางเหนือมีอะไรแปลก ๆ'],line=lines[s.day%lines.length];talk('แม่ค้าตลาด','🧑‍🌾',line,()=>base(w));return}return base(w)};openPanel._v38=true}
function talk(name,face,text,next){let el=document.createElement('div');el.className='v38-talk';el.innerHTML=`<div class="v38-talk-face">${face}</div><div><b>${esc(name)}</b><p></p><small>แตะเพื่อไปต่อ</small></div>`;document.body.appendChild(el);let p=el.querySelector('p'),i=0,timer=setInterval(()=>{p.textContent=text.slice(0,++i);if(i>=text.length)clearInterval(timer)},28);el.onclick=()=>{if(i<text.length){i=text.length;p.textContent=text;clearInterval(timer);return}el.remove();next?.()}}

// ---------- give existing saved decks the new v38 cards once ----------
function migrateDecks(){if(typeof s==='undefined'||!s.village||s.village.v38Cards)return;let add=['backstab','dive','formation','counter','evade','ambush'],fix=d=>{if(!d?.combat)return;let free=Math.max(0,(d.combat.attack||0)-4),n=0;for(let id of add){if(n>=free)break;if(!d.combat[id]){d.combat[id]=1;n++}}d.combat.attack-=n};fix(s.village.tacticDecks);for(let d of Object.values(s.village.unitDecks||{}))fix(d);s.village.v38Cards=true;if(typeof save==='function')save()}

// ---------- settings toggle ----------
function settingsToggle(){let panel=$('battleSettingsV34');if(!panel||$('v38ConfirmToggle'))return;let l=document.createElement('label');l.className='v38-toggle';l.innerHTML='<input type="checkbox" id="v38ConfirmToggle"> ยืนยันก่อนโจมตี (หน้าต่าง "ดำเนินการ?")';panel.appendChild(l);let c=l.querySelector('input');c.checked=confirmOn();c.onchange=()=>store.set('project-a-confirm-attack',c.checked)}

function tick(){requestAnimationFrame(tick);if(!layer())return;speedButton();castBar();predictBox();tileInfo();let st=L()?.getState?.();if(!full()&&boost){boost=false}if(full()!==tick._full){tick._full=full();applySpeed()}
 let icons=document.querySelector('.v36-icons'),feet=document.querySelector('.v36-feet');if(L()?.isDeploying?.()){if(icons)icons.hidden=true;if(feet)feet.hidden=true}}
function boot(){migrateDecks();greet();let ov=$('resultOverlay');if(ov&&!ov._v38){ov._v38=true;new MutationObserver(()=>setTimeout(expScreen,60)).observe(ov,{attributes:true,attributeFilter:['hidden']})}requestAnimationFrame(tick)}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot);else boot();setTimeout(()=>{migrateDecks();greet()},600);
window.BattleFlow={turnBanner,ability,confirmOn,confirmAttack,deploy,encounter,talk,expScreen,applySpeed};
})();
