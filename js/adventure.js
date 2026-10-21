// v11 adventure loop: village exit → branching area map → nodes (treasure / event / quest / rest / fights) → boss.
// • Fights cut to the full-screen tactics battle (tactics-bridge.js, session.adventure) and come back here.
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
 if(!E||!D)return;if(E.needArea&&!adv)return modal(D.name,`<p>${esc(D.text)}</p><p class="muted">ใช้ได้ระหว่างออกสำรวจเท่านั้น</p>`,[{label:'ตกลง',run:()=>closeModal()}]);
 const spend=()=>{if(src.card)addItem(src.card,-1)};
 const done=(res)=>{spend();let lines=res.loot?giveLoot(res.loot,adv):[];save();render();refreshMap();
  if(res.fight&&adv){closeModal();return startFight(adv,null,res.fight)}
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
// ---------------- adventure state ----------------
const state=()=>s.village.adventure||null;
function nodesOf(adv){let T=adv.types||{};return Object.fromEntries(AD.GRAPH.map(([id,x,y,next])=>[id,{id,x,y,next,type:T[id]||AD.FIXED[id]||'fight'}]))}
// every run reshuffles what waits at each spot (start, the miniboss gate, the last camp and the boss stay put)
function rollTypes(area){let ids=AD.GRAPH.map(g=>g[0]).filter(k=>!AD.FIXED[k]),pool=[...AD.POOL];
 for(let i=pool.length-1;i>0;i--){let j=Math.floor(Math.random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]]}let out={...AD.FIXED};ids.forEach((k,i)=>out[k]=pool[i]||'fight');
 const swap=(a,b)=>{[out[a],out[b]]=[out[b],out[a]]};
 // at least one fight in the first column, the quest early (columns a–c), no rest right at the start
 if(!['a1','a2','a3'].some(k=>['fight','elite'].includes(out[k]))){let f=ids.find(k=>k>'b'&&out[k]==='fight');if(f)swap(f,'a2')}
 let q=ids.find(k=>out[k]==='quest');if(q&&q>'d'){let t=ids.find(k=>k<'d'&&k>'a3'&&out[k]!=='quest');if(t)swap(q,t)}
 for(let k of ['a1','a2','a3'])if(out[k]==='rest'){let t=ids.find(x=>x>'d'&&out[x]==='fight');if(t)swap(k,t)}
 return out}
function reachableIds(adv){let N=nodesOf(adv),cur=N[adv.at];return cur?cur.next.filter(id=>!adv.cleared[id]||true):[]}
function enter(area){let A=AD.AREAS[area];if(!A)return;s.village.adventure={area,types:rollTypes(area),at:'start',cleared:{start:true},visited:{start:true},quest:null,questDone:false,returnTo:s.village.location,startedAt:s.minutes,loot:{coins:0,xp:0,mats:{},items:[]},kills:0};save();show();
 modal(A.name,`<p>${esc(A.intro)}</p><ul class="adv-help"><li>เลือกจุดถัดไปบนแผนที่ (ทางแยกหลายเส้น) — เดินแต่ละช่วงใช้เวลา ${MOVE_MIN} นาที</li><li>⚔ ฝูงศัตรู · ✦ ศัตรูพิเศษ · ♜ รองหัวหน้า · ♛ หัวหน้าปลายทาง</li><li>◆ สมบัติ · ? เหตุการณ์ · ! เควส · ☾ จุดพัก · ⚖ พ่อค้าเร่ · ❔ จุดลึกลับ</li><li>กระเป๋า: ใช้ของใช้และการ์ดเหตุการณ์ได้ระหว่างทาง</li></ul>`,[{label:'ออกเดินทาง',primary:true,run:()=>closeModal()}])}
function leave(reason,opts={}){let adv=state();if(!adv)return;let A=AD.AREAS[adv.area],L=adv.loot;s.village.adventure=null;hide();
 if(opts.defeat){s.village.location='home'}else{s.minutes=Math.min(1200,s.minutes+30);s.village.location=adv.returnTo||'home'}
 save();render();if(typeof applySceneLayout==='function')applySceneLayout(true);
 let mats=Object.entries(L.mats).filter(([,n])=>n>0).map(([k,n])=>MATERIALS[k].icon+' '+MATERIALS[k].name+' ×'+n).join(' · ');
 let items=Object.entries(L.items.reduce((o,k)=>(o[k]=(o[k]||0)+1,o),{})).map(([k,n])=>nameOf(k)+' ×'+n).join(' · ');
 villageDialog(reason||'กลับจาก'+A.name,`<div class="exp-reward"><p>${esc(opts.text||'')}</p><h3>สรุปการออกสำรวจ ${esc(A.name)}</h3><p>ผ่านจุดต่าง ๆ ${Object.keys(adv.cleared).length-1} จุด · ล้มศัตรู ${adv.kills} ตัว</p><p><b>◉ ${L.coins} เหรียญ</b> · ✦ EXP ${L.xp}</p><p>${mats||'ไม่มีวัตถุดิบ'}</p><p>${items||'ไม่มีไอเทม'}</p></div>`)}
// ---------------- map layer ----------------
let layer=null;
function build(){layer=document.createElement('section');layer.id='advLayer';layer.hidden=true;layer.innerHTML=`<canvas class="adv-bg"></canvas><svg class="adv-edges" viewBox="0 0 100 100" preserveAspectRatio="none"></svg><div class="adv-nodes"></div>
 <aside class="adv-side"><div class="adv-title"><small>ออกสำรวจ</small><h2></h2></div><div class="adv-status"></div><div class="adv-here"></div><div class="adv-actions"><button data-a="bag">▣ กระเป๋า</button><button data-a="leave">⌂ กลับหมู่บ้าน</button></div><div class="adv-loot-box"></div></aside>`;
 document.body.appendChild(layer);
 layer.addEventListener('click',e=>{let n=e.target.closest('[data-node]');if(n){go(n.dataset.node);return}let a=e.target.closest('[data-a]');if(!a)return;if(a.dataset.a==='bag')openPanel('bag');if(a.dataset.a==='leave'){if(confirm('กลับหมู่บ้านตอนนี้? (เดินกลับ 30 นาที · ของที่ได้มาแล้วยังอยู่ · ความคืบหน้าในพื้นที่นี้จะหายไป)'))leave('กลับหมู่บ้าน',{text:'คุณตัดสินใจกลับก่อนถึงปลายทาง'})}});
 new ResizeObserver(()=>{if(!layer.hidden)drawBg()}).observe(layer)}
function show(){if(!layer)build();layer.hidden=false;document.body.classList.add('adventure-open');refreshMap()}
function hide(){if(layer)layer.hidden=true;document.body.classList.remove('adventure-open')}
function drawBg(){let adv=state();if(!adv||!layer)return;let c=layer.querySelector('.adv-bg'),r=layer.getBoundingClientRect();c.width=r.width;c.height=r.height;let g=c.getContext('2d');window.TacticsScenery?.background(g,r.width,r.height,AD.AREAS[adv.area].theme,performance.now());g.fillStyle='#0005';g.fillRect(0,0,r.width,r.height)}
const FIGHTS=['fight','elite','miniboss','boss'];
// v37: an unfinished fight blocks the road — retry it from the map before moving on
function pendingFight(adv,N){return !adv.cleared[adv.at]&&FIGHTS.includes(N[adv.at]?.type)}
function refreshMap(){let adv=state();if(!adv||!layer||layer.hidden)return;let A=AD.AREAS[adv.area],N=nodesOf(adv),pend=pendingFight(adv,N),reach=pend?[]:N[adv.at].next;drawBg();
 layer.dataset.theme=A.theme;layer.querySelector('.adv-title h2').textContent=A.name;
 layer.querySelector('.adv-edges').innerHTML=Object.values(N).flatMap(n=>n.next.map(id=>{let m=N[id],on=n.id===adv.at,done=adv.cleared[n.id]&&adv.cleared[id];return `<path d="M${n.x} ${n.y} C ${(n.x+m.x)/2} ${n.y}, ${(n.x+m.x)/2} ${m.y}, ${m.x} ${m.y}" class="${on?'open':done?'done':''}" vector-effect="non-scaling-stroke"/>`})).join('');
 layer.querySelector('.adv-nodes').innerHTML=Object.values(N).map(n=>{let T=AD.NODE_TYPES[n.type],retry=pend&&n.id===adv.at,can=(reach.includes(n.id)||retry)&&!busyMove,cls=[n.id===adv.at?'here':'',adv.cleared[n.id]?'cleared':'',can?'reach':'',retry?'retry':'',n.type].join(' ');
  return `<button class="adv-node ${cls}" style="left:${n.x}%;top:${n.y}%;--c:${T.color}" ${can?`data-node="${n.id}"`:'disabled'} title="${T.name}${adv.cleared[n.id]?' (ผ่านแล้ว)':retry?' · ยังไม่ผ่าน แตะเพื่อสู้อีกครั้ง':''}"><span>${T.icon}</span><small>${retry?'สู้อีกครั้ง':T.name}</small>${n.id===adv.at?'<img class="adv-hero" src="'+(window.HERO_ANIMATIONS?.clips?.['daily.idle']?.frames?.[0]?.src||(typeof HERO_ANIMATIONS!=='undefined'?HERO_ANIMATIONS.clips['daily.idle'].frames[0].src:'assets/hero.webp'))+'" alt="">':''}</button>`}).join('');
 let cur=N[adv.at],CT=AD.NODE_TYPES[cur.type];
 layer.querySelector('.adv-status').innerHTML=`<div class="adv-bars"><span>♥ ${s.hp}/60</span><span>ϟ ${s.stamina}/${cap()}</span><span>◷ ${clock(s.minutes)}</span></div>${(window.Companions?.party()||[]).length?`<p class="small">ทีม: ${Companions.party().map(p=>esc(p.name)+' Lv.'+p.level).join(', ')}</p>`:'<p class="small muted">ยังไม่มีเพื่อนร่วมทาง (จ้างได้ที่ตลาด)</p>'}`;
 layer.querySelector('.adv-here').innerHTML=`<h4>${CT.icon} ตอนนี้: ${CT.name}</h4><p class="small">${pend?'<b>ยังไม่ผ่านจุดนี้</b> · แตะจุดที่อยู่เพื่อสู้อีกครั้ง ต้องชนะก่อนจึงไปจุดถัดไปได้':reach.length?'เลือกจุดที่เรืองแสงเพื่อเดินต่อ ('+reach.map(id=>AD.NODE_TYPES[N[id].type].name).join(' / ')+')':'ถึงปลายทางแล้ว'}</p>${adv.quest?`<p class="adv-quest">! เควส: ${esc(adv.quest.text)}${adv.questDone?' ✓':adv.quest.kind&&adv.quest.kind!=='miniboss'?' ('+questProgress(adv,adv.quest).text+')':''}</p>`:''}`;
 let L=adv.loot;layer.querySelector('.adv-loot-box').innerHTML=`<h4>ของที่ได้ระหว่างทาง</h4><p>◉ ${L.coins} · ✦ EXP ${L.xp} · ไอเทม ${L.items.length} ชิ้น</p>`}
let busyMove=false;
async function go(id){let adv=state();if(!adv||busyMove)return;let N=nodesOf(adv);if(pendingFight(adv,N)){if(id===adv.at)arrive(adv,N[id]);return}if(!N[adv.at].next.includes(id))return;
 if(s.minutes>=1190){return leave('หมดเวลา',{text:'ฟ้ามืดแล้ว ต้องรีบกลับหมู่บ้าน'})}
 busyMove=true;let el=layer.querySelector(`.adv-node.here .adv-hero`),to=N[id],from=N[adv.at];if(el){el.style.transition='transform 1.15s ease-in-out';let r=layer.querySelector('.adv-nodes').getBoundingClientRect();el.style.transform=`translate(${(to.x-from.x)/100*r.width}px,${(to.y-from.y)/100*r.height}px)`;await new Promise(r=>setTimeout(r,1180))}
 adv.at=id;adv.visited[id]=true;s.minutes=Math.min(1200,s.minutes+MOVE_MIN);s.fatigue=Math.min(100,s.fatigue+1);save();busyMove=false;refreshMap();render();
 if(adv.cleared[id])return;arrive(adv,N[id])}
function clearNode(adv,id){adv.cleared[id]=true;save();refreshMap()}
// v13 quest progress: miniboss cleared · kills since accepted · goods in the bag (handed over on completion)
function questProgress(adv,Q,before){let A=adv.types||AD.AREAS[adv.area].types;if(Q.kind==='kills'){let k=adv.kills-(before?adv.kills:Q.kills0||0);return {done:!before&&k>=Q.n,text:Math.min(k,Q.n)+'/'+Q.n}}
 if(Q.kind==='collect'){let k=bag()[Q.item]||0;return {done:k>=Q.n,text:Math.min(k,Q.n)+'/'+Q.n}}return {done:Object.entries(A).some(([id,t])=>t==='miniboss'&&adv.cleared[id]),text:''}}
function finishQuest(adv,Q){if(Q.kind==='collect')addItem(Q.item,-Q.n);adv.quest={...Q};adv.questDone=true;s.village.questsDone=(s.village.questsDone||0)+1;return giveLoot(Q.reward,adv)}
function checkQuest(adv){let Q=adv?.quest;if(!Q||adv.questDone||!Q.kind)return '';let p=questProgress(adv,Q);if(!p.done)return '';let lines=finishQuest(adv,Q);return `<h4>! เควสสำเร็จ: ${esc(Q.text)}</h4>${lootHtml(lines)}`}
function arrive(adv,n){let A=AD.AREAS[adv.area];
 if(n.type==='treasure'){let lines=giveLoot(rollLoot(adv.area,1+(n.id>'c'?1:0)),adv);clearNode(adv,n.id);return modal('พบสมบัติ',`<p>${pick(['หีบไม้เก่าซ่อนอยู่ใต้รากไม้','ถุงหนังของนักเดินทางที่ทิ้งไว้','กองหินที่มีของซ่อนอยู่ข้างใน'])}</p>${lootHtml(lines)}${checkQuest(adv)}`,[{label:'เก็บของ',primary:true,run:()=>closeModal()}])}
 if(n.type==='event'){clearNode(adv,n.id);return runEvent(pick(A.events.filter(k=>EVENTS[k])),{node:true})}
 if(n.type==='rest'){return modal('จุดพัก',`<p>${({mine:'โพรงหินแห้งมีกองไฟเก่าของคนงานเหมือง',swamp:'แพไม้ผูกติดตอไม้ใหญ่ พ้นจากโคลนพอได้นั่งพัก',coast:'ถ้ำริมผาที่คลื่นซัดไม่ถึง',frost:'กระท่อมไม้ของนักปีนเขา มีฟืนเหลืออยู่',ruins:'ห้องสวดเล็ก ๆ ที่ยังมีหลังคา'})[adv.area]||'ลานโล่งริมลำธาร ลมเย็นสบาย'}</p><p class="muted small">ตอนนี้ HP ${s.hp}/60 · แรง ${s.stamina}/${cap()}</p>`,[{label:'พักให้หายเหนื่อย (30 นาที)',primary:true,run:()=>{s.minutes+=30;let [h,st]=heal(20,35);s.fatigue=Math.max(0,s.fatigue-12);clearNode(adv,n.id);render();modal('พักแล้ว',`<p>HP +${h} · แรง +${st} · ความล้าลดลง</p>`,[{label:'ไปต่อ',primary:true,run:()=>closeModal()}])}},{label:'ไม่พัก เดินต่อ',run:()=>{clearNode(adv,n.id);closeModal()}}],{noClose:true})}
 if(n.type==='quest'){clearNode(adv,n.id);let list=AD.QUESTS?.[adv.area]||[],Q=adv.questPick!=null?list[adv.questPick]:null;if(!Q){adv.questPick=Math.floor(Math.random()*list.length);Q=list[adv.questPick]}if(!Q)return;
  let pre=questProgress(adv,Q,true);if(pre.done){let lines=finishQuest(adv,Q);return modal('เควส: '+Q.giver,`<p>"เห็นแล้ว! เจ้าทำสำเร็จก่อนที่ข้าจะขอเสียอีก รับนี่ไปเถอะ"</p>${lootHtml(lines)}`,[{label:'ขอบคุณ',primary:true,run:()=>closeModal()}])}
  return modal('เควส: '+Q.giver,`<p>"${Q.ask} ช่วยหน่อยนะ เดี๋ยวข้าตอบแทนให้"</p><p class="adv-quest">เป้าหมาย: ${Q.text}</p><p class="small">รางวัล: ◉ ${Q.reward.coins} + ${Q.reward.items.map(nameOf).join(', ')}</p>`,[{label:'รับเควส',primary:true,run:()=>{adv.quest={...Q,kills0:Q.kind==='kills'?adv.kills:0};save();refreshMap();closeModal()}},{label:'ไม่รับ',run:()=>closeModal()}],{noClose:true})}
 if(n.type==='shop'){clearNode(adv,n.id);return runEvent('merchant',{node:true})}
 if(n.type==='mystery'){let t=pick(['treasure','event','fight','fight','elite','rest']);adv.types[n.id]=t;save();refreshMap();return modal('จุดลึกลับ',`<p>${({treasure:'ในพุ่มไม้มีประกายวิบวับ…',event:'มีบางอย่างเกิดขึ้นตรงหน้า…',fight:'เสียงฝีเท้าดังรอบตัว — ศัตรู!',elite:'เงาขนาดใหญ่ขวางทาง — ศัตรูพิเศษ!',rest:'ที่นี่เงียบสงบพอให้พักได้'})[t]}</p>`,[{label:'ดูต่อ',primary:true,run:()=>{closeModal();arrive(adv,{...n,type:t})}}],{noClose:true})}
 if(['fight','elite','miniboss','boss'].includes(n.type))return startFight(adv,n)}
// ---------------- fights ----------------
function group(adv,type){let P=AD.AREAS[adv.area].enemies,party=(window.Companions?.party()||[]).length,n=Math.min(8,3+Math.ceil(party*1.2));let list=[];
 if(type==='boss')list=[P.boss,P.elite[0],...Array.from({length:Math.max(2,n-2)},()=>pick(P.normal))];
 else if(type==='miniboss')list=[P.miniboss,...Array.from({length:Math.max(2,n-1)},()=>pick(P.normal))];
 else if(type==='elite')list=[pick(P.elite),...Array.from({length:Math.max(2,n-1)},()=>pick(P.normal))];
 else list=Array.from({length:n},()=>pick(P.normal));return list.slice(0,10)}
function startFight(adv,node,extra){let type=extra?.type||node.type,A=AD.AREAS[adv.area],enemies=group(adv,type),T=C().ENEMY_TYPES,leader=['miniboss','boss'].includes(type);
 let fight={node:node?.id||null,type,enemies,objective:leader?'leader':'rout',bonus:extra?.bonus||null,name:A.name+' · '+AD.NODE_TYPES[type].name};
 let counts=Object.entries(enemies.reduce((o,k)=>(o[k]=(o[k]||0)+1,o),{}));
 let cards=counts.map(([k,n])=>`<div class="adv-foe"><div class="adv-card mini">${window.CardStudio?.renderCard('en-'+k,{mini:true})||''}</div><b>${esc(T[k].name)}</b><small>×${n} · ${C().RANKS[T[k].rank||'normal']}</small><small class="adv-foe-info">ธาตุ${C().ELEMENT_NAMES[T[k].element]||''} · เร็ว ${T[k].speed}${T[k].ranged?' · ยิงไกล '+T[k].rangedReach:''}${(T[k].traits||[]).length?' · '+T[k].traits.map(x=>C().TRAITS[x]).join(' '):''}${C().BOSS_SKILLS?.[k]?'<br>✦ '+Object.values(C().BOSS_SKILLS[k]).map(x=>x.name).join(' · '):''}</small></div>`).join('');
 modal((type==='boss'?'♛ ':type==='miniboss'?'♜ ':'⚔ ')+AD.NODE_TYPES[type].name+' · '+A.name,`<p>${type==='boss'?'ผู้ปกครองพื้นที่นี้ขวางอยู่ตรงหน้า':type==='miniboss'?'รองหัวหน้ากับลูกน้องเข้ามาล้อม':'ศัตรูกลุ่มหนึ่งขวางทางไว้'} · เป้าหมาย: <b>${C().OBJECTIVES[fight.objective]}</b></p><div class="adv-foes">${cards}</div><p class="muted small">HP ${s.hp}/60 · แรง ${s.stamina} · ${s.hp<20?'⚠ HP ต่ำ — ใช้ยาก่อนเข้าสู้ได้จากกระเป๋า':''}</p>`,
  [{label:'⚔ เข้าต่อสู้',primary:true,disabled:s.hp<=0?'HP หมด':'',run:()=>{closeModal();let go=()=>{adv.fight=fight;save();hide();openTactical({adventure:fight});if(!document.body.classList.contains('tactics-open')){adv.fight=null;save();show()}};window.BattleFlow?.encounter?BattleFlow.encounter(go):go()}},...(node?[]:[{label:'หนี',run:()=>closeModal()}])],{noClose:!!node})}
function battleConfig(){let adv=state(),f=adv?.fight;if(!f)return null;let A=AD.AREAS[adv.area];return {mode:'battle',theme:A.theme,encounter:{name:f.name,theme:A.theme,objective:f.objective,enemies:f.enemies,fixed:true},allies:window.Companions?.party()||[]}}
// called by tactics-bridge when the fight ends (win / lose)
function battleEnd(st,sess){let adv=state();if(!adv?.fight)return;let f=adv.fight,T=C().ENEMY_TYPES;
 if(st.outcome==='win'&&(f.claimed||f.node&&adv.cleared[f.node])){sess.adventureResult={win:true,boss:f.type==='boss',html:'<p class="small">รับรางวัลของจุดนี้ไปแล้ว</p>'};adv.fight=null;save();return}
 if(st.outcome==='win'){f.claimed=true;let kills=st.stats.kills,tier={fight:1,elite:1.5,miniboss:2,boss:3}[f.type]||1,A=AD.AREAS[adv.area];
  let at=1+.3*((A.tier||1)-1);let l={coins:ROUND((10+kills*4)*tier*at),xp:ROUND((20+kills*6)*tier*at)+(f.type==='boss'?120:f.type==='miniboss'?50:0),mats:{},items:[]};
  for(let i=0;i<Math.ceil(kills/2);i++)if(Math.random()<.6)l.items.push(pick(A.goods));if(Math.random()<.45)l.items.push(pick(Object.keys(AD.CONSUMABLES)));if(f.type!=='fight'&&Math.random()<.5)l.items.push(pick(A.events));
  l.mats[pick(['iron','coal','wood'])]=rnd(1,2);if(f.type==='boss')l.items.push('relic');
  if(f.bonus){l.coins+=f.bonus.coins||0;l.items.push(...(f.bonus.items||[]))}
  st.rewardSummary={...l};adv.kills+=kills;let lv0=s.village.character?.level,lines=giveLoot(l,adv),comp=window.Companions?.reward(st)||[];st.expReport=comp;st.heroLevelUp=s.village.character?.level>lv0;
  if(f.node)adv.cleared[f.node]=true;
  let q=adv.quest&&!adv.quest.kind&&f.type==='miniboss'&&!adv.questDone?(adv.questDone=true,`<h4>! เควสสำเร็จ: ${esc(adv.quest.text)}</h4>${lootHtml(giveLoot(adv.quest.reward,adv))}`):checkQuest(adv);
  let BU=Object.entries(st.stats.byUnit||{}).filter(([id])=>st.units.find(u=>u.id===id)?.side==='ally').sort((a,b)=>b[1].dealt-a[1].dealt);
  sess.adventureResult={win:true,boss:f.type==='boss',html:`<p class="small">${st.round||0} รอบ · ทำความเสียหาย ${st.stats.damageDealt} · รับ ${st.stats.damageTaken} · ล้ม ${kills}${BU[0]?' · MVP: '+esc(BU[0][1].name)+' ('+BU[0][1].dealt+')':''}</p>${lootHtml(lines)}${comp.length?'<p class="small">'+comp.map(c=>esc(c.name)+' +'+c.xp+' EXP'+(c.levelUp?' · Lv.'+c.level+'!':'')).join(' · ')+'</p>':''}${q}`}}
 else{let lost=Math.floor(s.village.coins*.1);s.village.coins-=lost;s.hp=Math.max(s.hp,10);s.minutes=Math.min(1200,s.minutes+60);sess.adventureResult={win:false,text:`เพื่อนพาคุณหนีกลับหมู่บ้าน (1 ชั่วโมง) · HP เหลือ ${s.hp} · เสีย ${lost} เหรียญ`}}
 adv.fight=null;save()}
// called by tactics-bridge after the battle layer closes
function afterBattle(sess){let adv=state(),r=sess.adventureResult;if(!adv)return;
 if(r&&!r.win)return leave('พ่ายแพ้',{defeat:true,text:r.text});
 show();if(!r){adv.fight=null;save();refreshMap();return modal('ถอยทัพ',`<p>คุณถอยออกมาจากการต่อสู้ จุดนี้ยังไม่ผ่าน</p>`,[{label:'ตกลง',run:()=>closeModal()}])}
 if(r.boss)return modal('♛ ปราบหัวหน้าพื้นที่สำเร็จ!',r.html,[{label:'กลับหมู่บ้านพร้อมของรางวัล',primary:true,run:()=>{closeModal();leave('สำรวจสำเร็จ',{text:'คุณปราบหัวหน้าพื้นที่และกลับมาอย่างผู้ชนะ'})}}],{noClose:true});
 modal('ชนะการต่อสู้',r.html,[{label:'ไปต่อ',primary:true,run:()=>closeModal()}])}
// ---------------- battle items: 3 random consumables from the bag each turn, use 1 ----------------
const BattleItems={hand:[],used:false,
 draw(){let pool=[];for(let [k,n] of Object.entries(bag()))if(AD.CONSUMABLES[k]&&AD.CONSUMABLES[k].use!=='แผนที่')for(let i=0;i<n;i++)pool.push(k);
  this.hand=[];while(pool.length&&this.hand.length<3){let i=Math.floor(Math.random()*pool.length);this.hand.push(pool.splice(i,1)[0])}this.used=false;this.render()},
 render(){let host=document.getElementById('tacticsHand');if(!host)return;let g=host.querySelector('.item-group');if(!g){g=document.createElement('section');g.className='hand-group item-group';host.appendChild(g)}
  let on=document.getElementById('tacticsLayer')?.classList.contains('fullbattle');g.hidden=!on;if(!on)return;
  g.innerHTML=`<h4>ไอเทม · ${this.used?'ใช้แล้วเทิร์นนี้':'ใช้ได้ 1'}</h4><div class="item-row">${this.hand.map((k,i)=>{let d=AD.CONSUMABLES[k];let content=window.HandCards?.compact('c-'+k,d.name,d.text+' · ×'+(bag()[k]||0))||`<b>${esc(d.name)}</b><small>${esc(d.text)}</small>`;return `<button class="item-card compact" data-item-i="${i}" data-full-card="c-${k}" aria-label="${esc(d.name+' — '+d.text)}" ${this.used||!hasItem(k)?'disabled':''}>${content}</button>`}).join('')||'<small class="muted">ไม่มีของใช้ในกระเป๋า</small>'}</div>`;
  g.querySelectorAll('[data-item-i]').forEach(b=>b.onclick=()=>this.use(+b.dataset.itemI))},
 use(i){let L=window.TacticsLab,st=L?.getState(),k=this.hand[i],d=AD.CONSUMABLES[k];if(!st||!d||this.used||st.phase!=='player'||st.outcome||L.isLocked())return;if(L.facingPending?.()){L.say('เลือกทิศหันให้เสร็จก่อน');return}let h=st.hero,msg='';
  if(d.damage){let foes=C().living(st,'enemy').filter(e=>C().dist(h,e)<=d.range&&C().lineOfSight(st.map,h,e));if(!foes.length){L.say('ไม่มีศัตรูในระยะ '+d.range+' ช่องสำหรับ'+d.name);return}let e=foes.sort((a,b)=>a.hp-b.hp)[0],r=C().hit(st,h,e,d.damage,{element:d.element,ranged:true});window.BattleFx?.item(k,d,h,e);msg=`ขว้าง${d.name}ใส่ ${e.name} −${r.damage}${r.notes?.length?' · '+r.notes.join(' · '):''}`}
  else if(d.guard){h.guard=(h.guard||0)+d.guard;msg=`${d.name}: ได้เกราะ ${d.guard}`;window.BattleFx?.item(k,d,h,h)}
  else{let a=h.hp,b=h.stamina;h.hp=Math.min(h.maxHp,h.hp+(d.hp||0));h.stamina=Math.min(100,h.stamina+(d.stamina||0));msg=`${h.name} ใช้${d.name} · HP +${h.hp-a} · แรง +${h.stamina-b}`;window.BattleFx?.item(k,d,h,h,{hp:h.hp-a,st:h.stamina-b});if(h.id==='hero'){s.hp=h.hp;s.stamina=Math.min(cap(),h.stamina)}}
  addItem(k,-1);this.used=true;save();L.say(msg);L.stats();L.finish?.();this.render()}};
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
// the village map is not reachable while adventuring
const baseOpen=openPanel;openPanel=function(w){if(state()&&(w==='map'||w==='recruit')){refreshMap();return}return baseOpen(w)};
// resume after reload
window.addEventListener('load',()=>{if(state()){if(state().fight){state().fight=null;save()}show()}});
window.Adventure={enter,leave,state,battleConfig,battleEnd,afterBattle,runEvent,refresh:refreshMap,bag,addItem,EVENTS};
window.BattleItems=BattleItems;
})();
