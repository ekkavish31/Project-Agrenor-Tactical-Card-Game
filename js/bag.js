// v94.02 · The bag (what is left of the v11 adventure file): consumables, goods and event cards, the item modal, loot and the travelling shop.
// • Bag (s.village.bag): consumables, goods, event cards. Consumables are usable on the map and in battle
//   (each turn 3 random ones from the bag, use 1). Event cards open a story modal and are spent when you choose.
(function(){
const AD=window.ADVENTURE_DATA,C=()=>window.TacticsCore;
const MOVE_MIN=10,ROUND=v=>Math.round(v);
const rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1)),pick=a=>a[Math.floor(Math.random()*a.length)];
// ---------------- bag ----------------
function bag(){s.village.bag||={potion:2,bread:1};return s.village.bag}
function itemInfo(k){if(AD.CONSUMABLES[k])return {cat:'consumable',def:AD.CONSUMABLES[k],card:'c-'+k};if(AD.GOODS[k])return {cat:'goods',def:AD.GOODS[k],card:'g-'+k};if(AD.EVENT_CARDS[k])return {cat:'event',def:AD.EVENT_CARDS[k],card:'ev-'+k};return null}
function addItem(k,n=1){if(!itemInfo(k))return;let b=bag();b[k]=(b[k]||0)+n;if(b[k]<=0)delete b[k]}
function hasItem(k){return (bag()[k]||0)>0}
const nameOf=k=>itemInfo(k)?.def.name||MATERIALS[k]?.name||k;
const maxHp=()=>60;
function heal(hp,st){let a=s.hp;s.hp=Math.min(maxHp(),s.hp+hp);let b=s.stamina;s.stamina=Math.min(cap(),s.stamina+st);return [s.hp-a,s.stamina-b]}
// consumable use on the map / in the village (battle use is in BattleItems below)
function useConsumable(k){let d=AD.CONSUMABLES[k];if(!d||!hasItem(k))return '';if(d.use==='ต่อสู้')return d.name+' ใช้ได้เฉพาะระหว่างต่อสู้';let [h,st]=heal(d.hp||0,d.stamina||0);addItem(k,-1);save();render();return `ใช้ ${d.name} · HP +${h} · แรง +${st}`}
// ---------------- modal (stories, rewards, choices) ----------------
let modalEl=null;
function modal(title,html,buttons=[],opts={}){if(!modalEl){modalEl=document.createElement('div');modalEl.id='advModal';modalEl.innerHTML='<div class="adv-dialog"><div class="adv-mhead"><h3></h3><button class="adv-x" title="ปิด">✕</button></div><div class="adv-mbody"></div><div class="adv-mbtns"></div></div>';document.body.appendChild(modalEl);modalEl.querySelector('.adv-x').onclick=()=>closeModal(true)}
 modalEl.dataset.tone=opts.tone||'';modalEl.querySelector('h3').textContent=title;modalEl.querySelector('.adv-mbody').innerHTML=html;modalEl.querySelector('.adv-x').hidden=!!opts.noClose;modalEl._onClose=opts.onClose||null;
 let box=modalEl.querySelector('.adv-mbtns');box.innerHTML='';for(let b of buttons){let el=document.createElement('button');el.textContent=b.label;if(b.primary)el.className='primary';if(b.disabled){el.disabled=true;el.title=b.disabled}el.onclick=()=>b.run();box.appendChild(el)}
 modalEl.hidden=false;window.CardStudio?.fit(modalEl)}
function closeModal(cancel){if(!modalEl)return;modalEl.hidden=true;let f=modalEl._onClose;modalEl._onClose=null;if(cancel&&f)f()}
// ---------------- rewards ----------------
function giveLoot(l,adv){let lines=[];if(l.coins){s.village.coins+=l.coins;lines.push(`◉ ${l.coins} เหรียญ`)}if(l.xp){gainCharacterXP(l.xp);lines.push(`✦ EXP +${l.xp}`)}
 for(let [k,n] of Object.entries(l.mats||{}))if(n>0){s.village.materials[k]=(s.village.materials[k]||0)+n;lines.push(`${MATERIALS[k].icon} ${MATERIALS[k].name} ×${n}`)}
 for(let k of l.items||[]){addItem(k,1);lines.push(`${({consumable:'⚗',goods:'◈',event:'✉'})[itemInfo(k).cat]} ${nameOf(k)}`)}
 if(adv){let L=adv.loot;L.coins+=l.coins||0;L.xp+=l.xp||0;for(let [k,n] of Object.entries(l.mats||{}))L.mats[k]=(L.mats[k]||0)+n;L.items.push(...(l.items||[]))}
 save();return lines}
const lootHtml=lines=>lines.length?`<ul class="adv-loot">${lines.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:'<p class="muted">ไม่ได้อะไรเพิ่ม</p>';
function rollLoot(area,tier=1){let A=AD.AREAS[area],l={coins:rnd(12,30)*tier,mats:{},items:[]};let mk=['iron','coal','wood'];for(let i=0;i<rnd(1,2);i++){let m=pick(mk);l.mats[m]=(l.mats[m]||0)+1}
 if(Math.random()<.55)l.items.push(pick(Object.keys(AD.CONSUMABLES)));if(Math.random()<.4)l.items.push(pick(A.goods));if(Math.random()<.22*tier)l.items.push(pick(A.events));return l}
// ---------------- events (event cards + event nodes share these) ----------------
// run(ctx) returns {text, loot?, fight?} ; ctx = {adv, area}
const EVENTS={
 treasureMap:{art:'◆',story:'รอยขีดบนแผนที่นำไปสู่ต้นไม้แก่ที่มีเครื่องหมายสลักไว้ ดินรอบโคนดูเหมือนเคยถูกขุดมาก่อน',
  choices:[{label:'ขุดหาสมบัติ (20 นาที)',run:ctx=>{s.minutes+=20;let l=rollLoot(ctx.area||'forest',2);l.items.push('oldCoin');return {text:'พลั่วกระทบกล่องไม้ผุ ๆ ข้างในมีของมีค่า!',loot:l}}},
   {label:'ตรวจรอบ ๆ ก่อน',run:ctx=>Math.random()<.5?{text:'พบกับดักซ่อนอยู่ ปลดได้ทันเวลา แล้วขุดสมบัติขึ้นมา',loot:rollLoot(ctx.area||'forest',2)}:{text:'มัวแต่ระวัง โจรอีกกลุ่มชิงขุดไปก่อน เหลือไว้แค่เศษเหรียญ',loot:{coins:15}}}]},
 oldShrine:{art:'☾',story:'ศาลเจ้าหินเก่าตั้งอยู่กลางลานเงียบ ๆ มีเทียนที่ยังไม่ดับ และกล่องถวายเหรียญวางอยู่หน้าองค์รูป',
  choices:[{label:'นั่งพักและอธิษฐาน (30 นาที)',run:()=>{s.minutes+=30;let [h,st]=heal(25,30);s.fatigue=Math.max(0,s.fatigue-10);return {text:`จิตใจสงบลง · HP +${h} · แรง +${st} · ความล้าลด`}}},
   {label:'ถวาย 15 เหรียญ',disabled:()=>s.village.coins<15?'เหรียญไม่พอ':'',run:()=>{s.village.coins-=15;let [h,st]=heal(60,100);return {text:`แสงอุ่นโอบรอบตัว · HP +${h} · แรง +${st} และได้รับพร`,loot:{items:['guardCharm']}}}}]},
 merchant:{art:'⚖',story:'พ่อค้าเร่ลากเกวียนเล็ก ๆ มาจอดข้างทาง "ของดีมีครบ ราคาเป็นกันเอง!"',shop:true},
 howl:{art:'☠',story:'เสียงหอนดังมาจากพุ่มไม้ทึบ ดวงตาสีแดงหลายคู่จ้องออกมาจากความมืด',needArea:true,
  choices:[{label:'ตามเสียงเข้าไป (ต่อสู้)',run:ctx=>({text:'ฝูงศัตรูพุ่งออกมา!',fight:{type:'elite',bonus:{coins:30,items:['wolfFang','oldCoin']}}})},{label:'ถอยออกมาเงียบ ๆ',run:()=>({text:'คุณเลี่ยงไปทางอื่นอย่างปลอดภัย'})}]},
 lostMiner:{art:'⛏',story:'คนงานเหมืองคนหนึ่งนั่งตัวสั่นอยู่ในซอกหิน ตะเกียงดับ หาทางออกไม่เจอ',
  choices:[{label:'นำทางเขาออกไป (30 นาที)',run:()=>{s.minutes+=30;return {text:'เขาขอบคุณไม่หยุดและมอบของที่ขุดได้ให้',loot:{coins:40,items:['crystalShard']}}}},
   {label:'แบ่งขนมปังให้',disabled:()=>hasItem('bread')?'':'ไม่มีขนมปังเดินทาง',run:()=>{addItem('bread',-1);return {text:'เขาฟื้นแรงแล้วบอกทางลับไปยังกรุแร่',loot:{mats:{iron:2},items:['oldCoin']}}}}]},
 hotSpring:{art:'♨',story:'ไอน้ำอุ่นพวยพุ่งจากบ่อหินกลางหิมะ น้ำใสจนมองเห็นก้นบ่อ',
  choices:[{label:'แช่น้ำพักให้หายหนาว (40 นาที)',run:()=>{s.minutes+=40;let [h,st]=heal(40,60);s.fatigue=Math.max(0,s.fatigue-20);return {text:`ร่างกายอบอุ่นและผ่อนคลาย · HP +${h} · แรง +${st} · ความล้าลดมาก`}}},{label:'เติมน้ำร้อนใส่กระติก',run:()=>({text:'น้ำร้อนจากบ่อช่วยให้ชาหอมขึ้น',loot:{items:['tonic','tonic']}})}]},
 shipwreck:{art:'⚓',story:'ซากเรือสินค้าตะแคงอยู่บนโขดหิน ลังไม้กระจายเต็มชายหาด ได้ยินเสียงฝีเท้าจากในท้องเรือ',
  choices:[{label:'ค้นท้องเรือ (เสี่ยงเจอโจรสลัด)',run:ctx=>Math.random()<.5?{text:'โจรสลัดที่ซุ่มอยู่กระโจนออกมา!',fight:{type:'fight',bonus:{coins:40,items:['pearl']}}}:{text:'พบหีบของกัปตันที่ยังไม่มีใครแตะ',loot:{coins:45,items:['pearl','oldCoin']}}},{label:'เก็บของบนชายหาดเงียบ ๆ (20 นาที)',run:()=>{s.minutes+=20;return {text:'ได้ไม้ทะเลกับของเล็กน้อย',loot:{items:['driftwood','driftwood'],mats:{wood:2}}}}}]},
 cursedIdol:{art:'☥',story:'รูปเคารพหินดำวางบนแท่นบูชา ดวงตาฝังอัญมณีสีม่วงที่ดูเหมือนกำลังจ้องคุณ',
  choices:[{label:'งัดอัญมณีออก',run:()=>{if(Math.random()<.5){s.hp=Math.max(1,s.hp-15);return {text:'คำสาปแล่นเข้าสู่ร่าง HP −15 แต่ได้อัญมณีมา',loot:{items:['soulGem']}}}return {text:'อัญมณีหลุดออกมาง่ายดาย ไม่มีอะไรเกิดขึ้น…',loot:{items:['soulGem','soulGem']}}}},{label:'สวดภาวนาแล้วเดินผ่าน',run:()=>{gainCharacterXP(30);return {text:'ความกลัวหายไป จิตใจมั่นคงขึ้น · EXP +30'}}}]},
 wanderingKnight:{art:'⚔',story:'อัศวินในชุดเกราะเก่าขวางทาง "ฝีมือเจ้าดูน่าสนใจ ลองประลองกับข้าสักตาไหม?"',
  choices:[{label:'รับคำท้า (ต่อสู้ศัตรูพิเศษ)',run:ctx=>({text:'อัศวินชักดาบ เรียกลูกศิษย์ออกมาด้วย!',fight:{type:'elite',bonus:{coins:50,items:['guardCharm']}}})},{label:'ขอคำแนะนำแทน',run:()=>{gainCharacterXP(40);return {text:'อัศวินสอนจังหวะการก้าวเท้าให้ · EXP +40'}}}]},
 fallenCart:{art:'⛟',story:'เกวียนขนแร่พลิกคว่ำ คนขับนั่งกุมขาอยู่ข้างทาง แร่กระจายเต็มพื้น',
  choices:[{label:'ช่วยยกเกวียน (30 นาที · แรง −15)',disabled:()=>s.stamina<15?'แรงไม่พอ':'',run:()=>{s.minutes+=30;s.stamina=Math.max(0,s.stamina-15);return {text:'คนขับขอบคุณและแบ่งแร่ให้',loot:{mats:{iron:3,coal:2},coins:15}}}},{label:'ให้ยาฟื้นฟูหนึ่งขวด',disabled:()=>hasItem('potion')?'':'ไม่มียาฟื้นฟู',run:()=>{addItem('potion',-1);return {text:'เขาหายเจ็บและมอบเหรียญเก่าเป็นการตอบแทน',loot:{coins:30,items:['oldCoin']}}}}]},
 willowisp:{art:'✧',story:'ดวงไฟสีฟ้าลอยวนอยู่เหนือผิวน้ำ แล้วค่อย ๆ ลอยห่างออกไปเหมือนเรียกให้ตาม',
  choices:[{label:'ตามแสงไป (30 นาที)',run:()=>{s.minutes+=30;return Math.random()<.6?{text:'แสงพาไปถึงเกาะเล็ก ๆ ที่มีหีบซ่อนอยู่',loot:rollLoot(state()?.area||'swamp',2)}:{text:'หลงทางในหมอกนานเกินไป ล้าไปหมด',loot:null}}},{label:'อย่าไปดีกว่า',run:()=>({text:'คุณหันหลังให้แสงนั้น มันค่อย ๆ จางหายไป'})}]},
 strangeRune:{art:'✶',story:'อักษรรูนเรืองแสงสลับสีอยู่บนผนังหิน รู้สึกได้ถึงพลังที่คาดเดาไม่ได้',
  choices:[{label:'แตะอักษร',run:()=>{let r=Math.random();if(r<.35){gainCharacterXP(60);return {text:'ความรู้โบราณไหลเข้าสู่ความคิด · EXP +60'}}if(r<.65){s.hp=Math.max(1,s.hp-10);return {text:'พลังย้อนกลับมาทำร้าย · HP −10'}}return {text:'อักษรแปรเป็นแผ่นการ์ดลอยลงมาในมือ',loot:{items:[pick(Object.keys(AD.EVENT_CARDS).filter(k=>k!=='strangeRune'))]}}}},{label:'ไม่ยุ่งดีกว่า',run:()=>({text:'คุณเดินผ่านไปโดยไม่หันกลับไปมอง'})}]}};
// show an event; source = {card:key} (spent when a choice is made) or {node:true}
function runEvent(key,src={}){let E=EVENTS[key],D=AD.EVENT_CARDS[key],adv=state();
 if(!E||!D)return;if(E.needArea&&!adv)return modal(D.name,`<p>${esc(D.text)}</p><p class="muted">การ์ดใบนี้ใช้ระหว่างเดินทาง · กด 🎴 การ์ดเหตุการณ์ บนแผนที่โลก</p>`,[{label:'ตกลง',run:()=>closeModal()}]);
 const spend=()=>{if(src.card)addItem(src.card,-1)};
 const done=(res)=>{spend();let lines=res.loot?giveLoot(res.loot,adv):[];save();render();refreshMap();
  modal(D.name,`<p>${esc(res.text)}</p>${lootHtml(lines)}${adv?checkQuest(adv):''}`,[{label:'ไปต่อ',primary:true,run:()=>{closeModal();src.after?.()}}],{noClose:true})};
 const head=`<div class="adv-story"><div class="adv-card">${window.CardStudio?.renderCard('ev-'+key,{})||`<span class="adv-art">${E.art}</span>`}</div><div><p>${esc(E.story)}</p>${src.card?'<p class="muted small">เลือกแล้วการ์ดจะหายไป · กด ✕ ถ้ายังไม่ใช้</p>':''}</div></div>`;
 if(E.shop)return shop(D,head,spend,src);
 modal(D.name,head,E.choices.map(ch=>({label:ch.label,disabled:ch.disabled?.()||'',run:()=>done(ch.run({adv,area:adv?.area}))})),{onClose:src.node?()=>src.after?.():null,noClose:!!src.node})}
function shop(D,head,spend,src){let used=false;const stock=Object.entries(AD.CONSUMABLES).filter(([,x])=>x.rarity!=='rare'||Math.random()<.4).map(([k,x])=>[k,x.price]);
 const draw=msg=>{let sell=Object.entries(bag()).filter(([k,n])=>n>0&&AD.GOODS[k]);modal(D.name,head+`${msg?`<p class="adv-note">${esc(msg)}</p>`:''}<div class="currency-banner">◉ <strong>${s.village.coins} เหรียญ</strong></div>
  <h4>ซื้อ</h4><div class="adv-shop">${stock.map(([k,p])=>`<button data-buy="${k}" data-p="${p}" ${s.village.coins<p?'disabled':''}>${esc(nameOf(k))}<small>◉ ${p}</small></button>`).join('')}</div>
  <h4>ขายของ</h4><div class="adv-shop">${sell.map(([k,n])=>`<button data-sell="${k}">${esc(nameOf(k))} ×${n}<small>◉ ${AD.GOODS[k].price}</small></button>`).join('')||'<p class="muted small">ไม่มีของให้ขาย</p>'}</div>`,[{label:'จบการซื้อขาย',primary:true,run:()=>{closeModal();src.after?.()}}],{onClose:()=>src.after?.()});
  modalEl.querySelectorAll('[data-buy]').forEach(b=>b.onclick=()=>{let p=+b.dataset.p;if(s.village.coins<p)return;if(!used){spend();used=true}s.village.coins-=p;addItem(b.dataset.buy,1);save();render();draw('ซื้อ '+nameOf(b.dataset.buy)+' แล้ว')});
  modalEl.querySelectorAll('[data-sell]').forEach(b=>b.onclick=()=>{let k=b.dataset.sell;if(!hasItem(k))return;if(!used){spend();used=true}addItem(k,-1);s.village.coins+=AD.GOODS[k].price;save();render();draw('ขาย '+nameOf(k)+' แล้ว')})};
 draw('')}
// v94.02: the old area adventure (node maps, quests, map fights) was deleted — journeys use the world map (world-map.html).
const state=()=>null,refreshMap=()=>{},checkQuest=()=>'';
// ---------------- battle items: 3 random consumables from the bag each turn, use 1 ----------------
const BattleItems={hand:[],used:false,
 draw(){let pool=[];for(let [k,n] of Object.entries(bag()))if(AD.CONSUMABLES[k]&&AD.CONSUMABLES[k].use!=='แผนที่')for(let i=0;i<n;i++)pool.push(k);
  this.hand=[];while(pool.length&&this.hand.length<3){let i=Math.floor(Math.random()*pool.length);this.hand.push(pool.splice(i,1)[0])}this.used=false;this.render()},
 render(){let host=document.getElementById('tacticsHand');if(!host)return;let g=host.querySelector('.item-group');if(!g){g=document.createElement('section');g.className='hand-group item-group';host.appendChild(g)}
  let on=document.getElementById('tacticsLayer')?.classList.contains('fullbattle');g.hidden=!on;if(!on)return;
  const D=window.TacticsDecks,dk=window.TacticsLab?.getState()?.deck,block=D&&dk?D.actionBlock(dk,'item'):'';g.innerHTML=`<h4>ไอเทม · ${block||'ใช้ได้อีก '+(2-(dk?.itemUsed||0))+' ครั้ง'}</h4><div class="item-row">${this.hand.map((k,i)=>{let d=AD.CONSUMABLES[k];let content=window.HandCards?.compact('c-'+k,d.name,d.text+' · ×'+(bag()[k]||0))||`<b>${esc(d.name)}</b><small>${esc(d.text)}</small>`;return `<button class="item-card compact" data-kind="item" data-item-i="${i}" data-full-card="c-${k}" aria-label="${esc(d.name+' — '+d.text)}" ${block||!hasItem(k)?'disabled':''} title="${esc(block||'')}">${content}</button>`}).join('')||'<small class="muted">ไม่มีของใช้ในกระเป๋า</small>'}</div>`;
  g.querySelectorAll('[data-item-i]').forEach(b=>b.onclick=()=>this.use(+b.dataset.itemI))},
 use(i){let L=window.TacticsLab,st=L?.getState(),k=this.hand[i],d=AD.CONSUMABLES[k];if(!st||!d||st.phase!=='player'||st.outcome||L.isLocked())return;{const why=window.TacticsDecks?.actionBlock(st.deck,'item');if(why){L.say(why);return}}if(L.facingPending?.()){L.say('เลือกทิศหันให้เสร็จก่อน');return}let h=st.hero,msg='';
  if(d.damage){let foes=C().living(st,'enemy').filter(e=>C().dist(h,e)<=d.range&&C().lineOfSight(st.map,h,e));if(!foes.length){L.say('ไม่มีศัตรูในระยะ '+d.range+' ช่องสำหรับ'+d.name);return}let e=foes.sort((a,b)=>a.hp-b.hp)[0],r=C().hit(st,h,e,d.damage,{element:d.element,ranged:true});window.BattleFx?.item(k,d,h,e);msg=`ขว้าง${d.name}ใส่ ${e.name} −${r.damage}${r.notes?.length?' · '+r.notes.join(' · '):''}`}
  else if(d.guard){h.guard=(h.guard||0)+d.guard;msg=`${d.name}: ได้เกราะ ${d.guard}`;window.BattleFx?.item(k,d,h,h)}
  else{let a=h.hp,b=h.stamina;h.hp=Math.min(h.maxHp,h.hp+(d.hp||0));h.stamina=Math.min(100,h.stamina+(d.stamina||0));msg=`${h.name} ใช้${d.name} · HP +${h.hp-a} · แรง +${h.stamina-b}`;window.BattleFx?.item(k,d,h,h,{hp:h.hp-a,st:h.stamina-b});if(h.id==='hero'){s.hp=h.hp;s.stamina=Math.min(cap(),h.stamina)}}
  window.TacticsDecks?.consumeItem(st.deck);window.BattleCrystals?.spend('item');addItem(k,-1);save();L.say(msg);L.stats();L.finish?.();this.render()}};
// ---------------- bag panel: consumables / event cards / goods ----------------
// v38: every bag card uses the card-table frame with its text filled in (goods had an empty main box)
function bagCardHTML(info,n){let S=window.CardStudio,base=S?.cardById(info.card);if(!base)return '';let c=JSON.parse(JSON.stringify(base)),d=info.def||{};if(!c.main?.value){c.main=info.cat==='goods'?{value:'◉ '+(d.price??c.attr?.price??0),label:'ราคาขาย'}:info.cat==='event'?{value:'✉',label:'การ์ดเหตุการณ์'}:{value:'×'+n,label:'ในกระเป๋า'}}if(!(c.effects||[]).filter(Boolean).length&&d.text)c.effects=[d.text];return S.cardHTML(c,S.design(),{mini:true})}
const baseBag=renderBag;
renderBag=function(){baseBag();let host=$('panelContent');if(!host)return;let b=bag(),atMarket=s.village.location==='market'&&!state();
 const tile=(k,n,btns)=>{let info=itemInfo(k);return `<div class="bag-item-card"><div class="adv-card mini">${bagCardHTML(info,n)||''}</div><b>${esc(info.def.name)} ×${n}</b><small>${esc(info.def.text||'')}</small>${btns}</div>`};
 let sec=(title,cat,btns)=>{let list=Object.entries(b).filter(([k,n])=>n>0&&itemInfo(k)?.cat===cat);return `<h3>${title}</h3><div class="bag-item-grid">${list.map(([k,n])=>tile(k,n,btns(k))).join('')||'<p class="muted small">ยังไม่มี</p>'}</div>`};
 host.insertAdjacentHTML('afterbegin',`<div class="bag-v11">${sec('ของใช้ · ใช้แล้วหมดไป','consumable',k=>AD.CONSUMABLES[k].use==='ต่อสู้'?'<small class="muted">ใช้ระหว่างต่อสู้</small>':`<button data-use="${k}">ใช้</button>`)}
 ${sec('การ์ดเหตุการณ์ · ใช้แล้วจะเกิดเรื่องราว','event',k=>`<button data-event="${k}">ใช้การ์ด</button>`)}
 ${sec('ไอเทมทั่วไป · ขายได้ที่ตลาด'+(atMarket?'':' (ไปตลาดเพื่อขาย)'),'goods',k=>atMarket?`<button data-sellg="${k}">ขาย ◉ ${AD.GOODS[k].price}</button>`:`<small class="muted">◉ ${AD.GOODS[k].price}</small>`)}<p id="bagMsg" class="small" role="status"></p></div>`);
 window.CardStudio?.fit(host);
 host.querySelectorAll('[data-use]').forEach(x=>x.onclick=()=>{let m=useConsumable(x.dataset.use);renderBag();$('bagMsg')&&($('bagMsg').textContent=m);refreshMap()});
 host.querySelectorAll('[data-event]').forEach(x=>x.onclick=()=>{$('panel').close();runEvent(x.dataset.event,{card:x.dataset.event})});
 host.querySelectorAll('[data-sellg]').forEach(x=>x.onclick=()=>{let k=x.dataset.sellg;if(!hasItem(k))return;addItem(k,-1);s.village.coins+=AD.GOODS[k].price;save();render();renderBag();$('bagMsg')&&($('bagMsg').textContent='ขาย '+nameOf(k)+' แล้ว')})};
window.addEventListener('load',()=>{if(s.village?.adventure){s.village.adventure=null;save()}});   // a save from the old area maps simply comes home
window.Adventure={state,runEvent,bag,addItem,hasItem,EVENTS,enter:()=>window.VillageTown?.openWorld?.()};
window.BattleItems=BattleItems;
})();
