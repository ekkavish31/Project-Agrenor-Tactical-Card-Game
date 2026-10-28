/* v93 · Intro quest chain: the Fernvale harvest festival (3 days) + the first expedition (bandit nest).
   Teaches every core system through forced quests, each with a cutscene (js/story-fx.js, text in js/story-data.js).
   • Progress lives in s.village.story {mode:'active'|'offer'|'done'|'off', i, data, water}.
   • Steps watch the game state (polled), so no existing system had to be rewired.
   • tag 'real' = uses an existing game system · 'temp' = temporary code-only stand-in until the real system exists
     (see docs/STORY-INTRO.md for the plan of each temp piece).
   Dev: window.Story.reset() · Story.goto('raid') · Story.skip() · ?story=reset */
(function(root){'use strict';
const D=()=>root.STORY_DATA,G=()=>typeof s!=='undefined'?s:null,V=()=>G()?.village;
const doSave=()=>{try{save()}catch{}},doRender=()=>{try{render()}catch{}try{root.VillageTown?.sync?.()}catch{}};
const toast=(h,k)=>root.StoryToast?.(h,k);
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const mats=()=>V()?.materials||{},bag=()=>V()?.bag||{};
const goodsCount=()=>{const g=root.ADVENTURE_DATA?.GOODS||{};return Object.entries(bag()).reduce((n,[k,c])=>n+(g[k]?c:0),0)};
const adv=()=>V()?.adventure||null,at=p=>V()?.location===p&&!adv();
const tacticsOpen=()=>document.body.classList.contains('tactics-open');
const late=()=>(G()?.minutes||0)>=1140;
/* v94: journeys happen on the world map (the old area maps are archived), companions are recruited in the inn */
const onWorld=()=>!!root.VillageTown?.onWorld?.();
const worldBtn=label=>({label,primary:true,hide:()=>onWorld(),run:()=>root.VillageTown?.openWorld?.()});
const innBtn={label:'🍺 ไปโรงแรมเขากวางทอง',primary:true,run:()=>root.VillageTown?.openInterior?.('inn','โรงแรมเขากวางทอง')};
const partySize=()=>(V()?.party||[]).length+(V()?.bench||[]).length;

/* ---------- helpers that call existing game actions ---------- */
function go(place){if(adv()){toast('อยู่ระหว่างออกสำรวจ กลับหมู่บ้านก่อน');return}if(V()?.location===place){toast('อยู่ที่นี่แล้ว');return}
 let r;try{r=travel(place)}catch(e){r={ok:false,reason:'เดินทางไม่ได้ตอนนี้'}}if(!r?.ok){toast(esc(r?.reason||'เดินทางไม่ได้'));return}doRender()}
function sleepNow(){if(!at('home')){go('home');if(!at('home'))return}let r;try{r=restAtPlace('sleep')}catch{r={ok:false}}if(!r?.ok){toast(esc(r?.reason||'นอนไม่ได้ตอนนี้'));return}doRender();toast('🌙 นอนหลับพักผ่อน… เช้าวันใหม่','good')}
function spend(energy,minutes,fatigue){try{return spendActivity(energy,minutes,fatigue)}catch{return ''}}
const addCoins=n=>{V().coins=(V().coins||0)+n};
const PLACE={home:'บ้าน',market:'ตลาด',forge:'โรงตีเหล็ก'};
const goBtn=p=>({label:'ไป'+PLACE[p],run:()=>go(p),hide:()=>at(p)});
const sleepBtn={label:'🌙 นอนพัก (ข้ามวัน)',primary:true,run:sleepNow};

/* ---------- story-only encounter for the festival raid (uses the existing expedition battle) ---------- */
function registerRaid(){return;const C=root.TacticsCore;   // v94: the raid is a flat village battle now (startRaid)
 if(!C?.ENCOUNTERS||C.ENCOUNTERS.storyRaid)return;
 C.ENCOUNTERS.storyRaid={name:'คืนเทศกาล · โจรป่าบุกเฟิร์นเวล',theme:'forest',objective:'rout',enemies:['wolf','bandit','wolf','bandit','poacher']}}

/* ---------- temp mini-game: catch the goats ---------- */
function goatGame(done){const el=document.createElement('div');el.className='mg';el.innerHTML='<div class="mg-hud">จับแพะ <b>0</b> / 3<small>คลิกที่แพะ · มันวิ่งเร็วขึ้นเรื่อย ๆ</small></div><button class="mg-close" type="button">พักก่อน</button>';document.body.appendChild(el);
 let caught=0,raf=0;const W=()=>innerWidth,H=()=>innerHeight;
 const goats=[0,1,2].map(i=>{const g=document.createElement('div');g.className='mg-goat';g.innerHTML='<span>🐐</span>';el.appendChild(g);
  const o={el:g,x:W()*(.2+.3*i),y:H()*(.35+.2*(i%2)),vx:(Math.random()<.5?-1:1)*(1.6+i*.5),vy:(Math.random()-.5)*2.2,alive:true,dodge:i===2?1:0};
  g.addEventListener('pointerdown',e=>{e.stopPropagation();if(!o.alive)return;if(o.dodge>0){o.dodge--;o.vx*=-1.8;o.vy=-(2+Math.random()*2);const p=document.createElement('div');p.className='mg-plus';p.textContent='เมี๊ยะ!';p.style.left=o.x+'px';p.style.top=o.y-40+'px';el.appendChild(p);setTimeout(()=>p.remove(),1000);return}
   o.alive=false;g.classList.add('caught');caught++;el.querySelector('.mg-hud b').textContent=caught;
   const pf=document.createElement('div');pf.className='mg-puff';pf.style.left=o.x+'px';pf.style.top=o.y+'px';el.appendChild(pf);setTimeout(()=>pf.remove(),700);
   const p=document.createElement('div');p.className='mg-plus';p.textContent='+1';p.style.left=o.x+'px';p.style.top=o.y-30+'px';el.appendChild(p);setTimeout(()=>p.remove(),1000);
   goats.forEach(x=>{if(x.alive){x.vx*=1.25;x.vy*=1.25}});if(caught>=3)setTimeout(finish,650)});return o});
 const step=()=>{raf=requestAnimationFrame(step);for(const o of goats){if(!o.alive)continue;o.x+=o.vx;o.y+=o.vy;if(Math.random()<.015){o.vx+=(Math.random()-.5)*2;o.vy+=(Math.random()-.5)*2}
   const sp=Math.hypot(o.vx,o.vy),max=6;if(sp>max){o.vx*=max/sp;o.vy*=max/sp}if(o.x<60||o.x>W()-60){o.vx*=-1;o.x=Math.max(60,Math.min(W()-60,o.x))}if(o.y<110||o.y>H()-60){o.vy*=-1;o.y=Math.max(110,Math.min(H()-60,o.y))}
   o.el.style.left=o.x+'px';o.el.style.top=o.y+'px';o.el.classList.toggle('flip',o.vx>0)}};step();
 function close(){cancelAnimationFrame(raf);el.remove()}
 function finish(){close();done()}
 el.querySelector('.mg-close').onclick=e=>{e.stopPropagation();close();toast('แพะยังหนีอยู่ กดเริ่มใหม่ได้ทุกเมื่อ')}}

/* ---------- steps ----------
   intro: cutscene when the step starts · outro: cutscene when done · begin(d): remember a baseline
   check(d): true when done · acts: tracker buttons · reward(d): applied after the outro */
const STEPS=[
 {id:'wake',chapter:'วันที่ 1 · เตรียมงานเทศกาล',tag:'real',intro:'opening',title:'ไปหาผู้ใหญ่บ้าน',goal:'เดินไปที่ตลาดเพื่อพบผู้ใหญ่บ้านโอเรน',hint:'คลิกตลาดบนแผนที่หมู่บ้าน หรือกดปุ่มด้านล่าง',
  check:()=>at('market'),acts:[goBtn('market')]},
 {id:'goats',tag:'temp',intro:'elderMeet',outro:'goatsDone',title:'แพะหนีออกจากคอก',goal:'จับแพะของปิ๊บให้ครบ 3 ตัว',hint:'ระวังตัวที่สาม มันหลบเก่ง',
  check:d=>d.caught,acts:[{label:'🐐 เริ่มจับแพะ',primary:true,run:d=>goatGame(()=>{d.caught=true;doSave()})}]},
 {id:'pumpkin',tag:'temp',title:'ฟักทองยักษ์',goal:'ปลูกเมล็ดฟักทองที่แปลงหลังบ้าน แล้วรดน้ำ',hint:'รดน้ำได้วันละครั้ง ยิ่งรดครบทุกวัน ฟักทองยิ่งใหญ่ (ประกวดวันที่ 3)',
  check:()=>waterDays()>=1,acts:[goBtn('home'),{label:'💧 ปลูกและรดน้ำ',primary:true,run:water,hide:()=>!at('home')}]},
 {id:'stall',tag:'temp',outro:'stallDone',title:'ซ่อมแผงขายของ',goal:'ซ่อมแผงขายของที่ตลาด (ใช้ไม้ 2)',hint:'ถ้าไม้ไม่พอ ซื้อเพิ่มได้ที่ตลาด (ช่องวัตถุดิบ)',
  check:d=>d.built,acts:[goBtn('market'),{label:'🔨 ซ่อมแผง (ไม้ 2)',primary:true,hide:()=>!at('market'),run:d=>{if((mats().wood||0)<2){toast('ไม้ไม่พอ · ซื้อไม้ที่ตลาดก่อน');return}const why=spend(6,30,3);if(why){toast(esc(why));return}mats().wood-=2;d.built=true;doSave();doRender()}}]},
 {id:'sleep1',tag:'real',outro:'day2',title:'จบวันแรก',goal:'กลับบ้านแล้วนอนพัก',hint:'การนอนจะข้ามไปเช้าวันถัดไป ฟื้นแรงและความสดชื่น',
  begin:d=>{d.day=G().day},check:d=>G().day>d.day,acts:[goBtn('home'),{...sleepBtn,hide:()=>!at('home')}]},
 {id:'cave',chapter:'วันที่ 2 · ทำของ และหาคน',tag:'real',outro:'crystal',title:'ผลึกในถ้ำเหมืองเก่า',goal:'ออกเดินทางบนแผนที่โลก มุ่งไปทางเหมืองเก่า แล้วชนะการต่อสู้ 1 ครั้ง',hint:'เดินออกนอกหมู่บ้านทีละช่อง · ระหว่างทางมีศัตรูดักอยู่ · สนามรบมีเนินและหน้าผา ยืนที่สูงตีแรงกว่า',
  begin:d=>{d.base=V().battles||0},check:d=>(V().battles||0)>d.base,
  acts:[worldBtn('🗺 ออกเดินทาง (แผนที่โลก)')],
  reward:()=>{V().story.crystals=(V().story.crystals||0)+3;return root.StarterKit?.unlock?.([{group:'combat',id:'skill',n:2}],{kicker:'บทเรียนจากถ้ำ',title:'ท่าโจมตีหนัก',text:'ตีแรงกว่าปกติ แต่ใช้แรงมากขึ้น · เพิ่มเข้าสำรับแล้ว'})}},
 {id:'caveBack',tag:'real',title:'กลับหมู่บ้าน',goal:'เดินทางกลับเฟิร์นเวล',hint:'บนแผนที่โลก กด "กลับหมู่บ้าน" เดินย้อนทางที่รู้จัก หรือเดินกลับเองทีละช่อง',
  check:()=>!onWorld(),acts:[]},
 {id:'lanterns',tag:'temp',outro:'lanternsDone',title:'โคมไฟเทศกาล',goal:'ทำโคมไฟ 3 ดวงที่โรงตีเหล็ก',hint:'โคม 1 ดวง = ไม้ 1 · ถ่าน 1 · ผลึกเรืองแสง 1 · ไม้ไม่พอให้ซื้อที่ตลาด',
  progress:d=>(d.n||0)/3,check:d=>(d.n||0)>=3,
  acts:[goBtn('forge'),{label:'🏮 ทำโคม',primary:true,hide:()=>!at('forge'),run:d=>{const m=mats();if((m.wood||0)<1||(m.coal||0)<1){toast('ต้องมีไม้ 1 และถ่าน 1 · ซื้อได้ที่ตลาด');return}if((V().story.crystals||0)<1){toast('ผลึกเรืองแสงหมด');return}
   const why=spend(4,20,2);if(why){toast(esc(why));return}m.wood--;m.coal--;V().story.crystals--;d.n=(d.n||0)+1;doSave();doRender();toast('🏮 โคมดวงที่ '+d.n+' เสร็จแล้ว','good')}},goBtn('market')]},
 {id:'craft',tag:'real',outro:'craftDone',title:'ของขายในงาน',goal:'ตีอาวุธ 1 ชิ้นที่โรงตีเหล็ก',hint:'หลอมให้ร้อน → ตีขึ้นรูปจนครบ 100 → ชุบแข็ง · ดาบใช้เหล็ก 2 ถ่าน 1 ไม้ 1',
  begin:d=>{d.next=G().nextId},check:d=>(G().inventory||[]).some(x=>x.id>=d.next),acts:[goBtn('forge'),goBtn('market')],
  reward:()=>root.StarterKit?.unlock?.([{group:'combat',id:'line',n:2}],{kicker:'อาวุธเล่มใหม่',title:'แทงทะลวง',text:'โจมตีทะลุสองช่องเป็นแนวตรง · สวมดาบเล่มใหม่ได้ที่กระเป๋า'})},
 {id:'hire',tag:'real',outro:'hireDone',title:'หาคนช่วย',goal:'ชวนเพื่อนร่วมทาง 1 คนที่โรงแรมเขากวางทอง',hint:'คุยกับคนที่มี ★ · บรัมรับจ้าง 60 เหรียญ · เคียร์เพื่อนสมัยเด็กมักนั่งที่โรงแรมช่วงบ่ายถึงค่ำ ชวนได้เลย',
  check:()=>partySize()>0,acts:[innBtn],
  reward:()=>root.StarterKit?.unlock?.([{group:'combat',id:'formation',n:2}],{kicker:'มีเพื่อนแล้ว',title:'จู่โจมประสาน',text:'มีเพื่อนยืนติดตัว ตีแรงขึ้น ×1.35'})},
 {id:'sleep2',tag:'real',outro:'day3',title:'พรุ่งนี้วันงาน',goal:'กลับบ้านแล้วนอนพัก',hint:'ก่อนนอนอย่าลืมรดน้ำฟักทองของวันนี้',
  begin:d=>{d.day=G().day},check:d=>G().day>d.day,acts:[{label:'💧 รดน้ำฟักทอง',hide:()=>!at('home')||wateredToday(),run:water},goBtn('home'),{...sleepBtn,hide:()=>!at('home')}]},
 {id:'sell',chapter:'วันที่ 3 · งานเทศกาลเก็บเกี่ยว',tag:'real',outro:'soldOne',title:'แข่งขายกับเกรเวน',goal:'ขายของในตลาดให้ได้ 1 ชิ้น',hint:'ขายเองที่ร้านรับซื้อ หรือวางของใน "ร้านของเรา" ที่ตลาดแล้วรอชาวบ้านมาซื้อ · ถ้าเกรเวนอยู่ในตลาด ลูกค้าบางคนจะไปร้านเขา',
  check:d=>d.sales>0,acts:[goBtn('market'),{label:'💧 รดน้ำฟักทอง',hide:()=>!at('home')||wateredToday(),run:water}]},
 {id:'contest',tag:'temp',title:'ประกวดฟักทอง',goal:'ไปที่ลานประกวดฟักทอง',hint:'ผลขึ้นกับจำนวนวันที่รดน้ำ',
  check:d=>d.judged,acts:[{label:'🎃 ไปลานประกวด',primary:true,run:async d=>{const days=waterDays();await root.Cutscene.play(D().contestScene(days));addCoins(days>=3?60:days===2?30:10);d.judged=true;doSave();doRender()}}]},
 {id:'raid',tag:'real',intro:'raid',outro:'awaken',title:'โจรป่าบุกงาน!',goal:'ปกป้องงานเทศกาล — ชนะการต่อสู้',hint:'ใช้ไพ่เดินเข้าหาศัตรู ไพ่โจมตีเมื่ออยู่ในระยะ · ยืนบนหญ้า/มอสช่วยกำบัง · เพื่อนร่วมทางสู้ไปพร้อมกัน',
  check:d=>d.won,acts:[{label:'⚔ ปกป้องหมู่บ้าน!',primary:true,hide:d=>!!d.fighting,run:d=>startRaid(d)}],
  reward:()=>{V().story.element='earth';V().story.plate=true;if(V().character)V().character.points=(V().character.points||0)+1;try{const b=root.Adventure?.bag?.();if(b)b.treasureMap=(b.treasureMap||0)+1}catch{}return root.StarterKit?.unlock?.([{group:'combat',id:'quake',n:3},{group:'combat',id:'counter',n:1}],{kicker:'แก่นธาตุดินตื่นขึ้น',title:'พลังของผืนดิน'})}},
 {id:'plate',tag:'real',outro:'plate',title:'จานหินโบราณ',goal:'นำจานหินไปให้ผู้ใหญ่บ้านดูที่ตลาด',hint:'',check:()=>at('market'),acts:[goBtn('market')]},
 {id:'prep',chapter:'การเดินทางครั้งแรก · รังโจรป่า',tag:'real',title:'เตรียมตัวออกเดินทาง',goal:'ซื้อเสบียงอย่างน้อย 1 ชิ้นที่ตลาด',hint:'เสบียงใช้กินฟื้นความสดชื่นระหว่างทาง · ยาในกระเป๋าใช้ได้ทั้งบนแผนที่และในการต่อสู้ · จัดสำรับไพ่ได้ที่โต๊ะในบ้าน',
  begin:d=>{d.food=mats().food||0},check:d=>(mats().food||0)>d.food,acts:[goBtn('market')]},
 {id:'expedition',tag:'real',intro:'departure',outro:'camp',title:'รังโจรป่า',goal:'ออกเดินทางบนแผนที่โลก ล้มศัตรูให้ได้ 3 ตัว',hint:'กระดานภารกิจที่หมู่บ้านบอกทางไปจุดหมาย · พักแรมได้ทุกที่ · กลางคืนศัตรูดุร้ายขึ้น · HP ต่ำให้ดื่มยาหรือกลับก่อนก็ได้',
  begin:d=>{d.base=V().kills||0},progress:d=>Math.min(1,((V().kills||0)-(d.base||0))/3),check:d=>(V().kills||0)-(d.base||0)>=3,
  acts:[worldBtn('🌲 ออกเดินทาง')],
  reward:()=>root.StarterKit?.unlock?.([{group:'movement',id:'sprint',n:2},{group:'combat',id:'climb',n:2},{group:'combat',id:'dive',n:1},{group:'combat',id:'evade',n:1},{group:'combat',id:'firstAid',n:1}],{kicker:'ของจากค่ายโจร',title:'ทักษะเอาตัวรอด',text:'ป่ามีเนินและหน้าผา · ปีนขึ้นที่สูงแล้วกระโจนฟาดลงมาแรงกว่าเดิม'})},
 {id:'return',tag:'real',outro:'home',title:'กลับบ้าน',goal:'กลับหมู่บ้านพร้อมของที่ได้',hint:'จะเดินต่อไปจนถึงจุดหมายก็ได้ ยิ่งลึกของยิ่งดี แต่ยิ่งเสี่ยง',check:()=>!onWorld(),acts:[]},
 {id:'sellLoot',tag:'real',title:'ขายของจากการเดินทาง',goal:'ขายของที่ได้มาที่ตลาด 1 ครั้ง',hint:'ของป่า (เขี้ยวหมาป่า สมุนไพร เหรียญโบราณ) ขายได้ที่ตลาด',check:d=>d.sales>0,acts:[goBtn('market')]},
 {id:'rest',tag:'real',outro:'finale',title:'พักฟื้น',goal:'กลับบ้านแล้วนอนพัก',hint:'',begin:d=>{d.day=G().day},check:d=>G().day>d.day,acts:[goBtn('home'),{...sleepBtn,hide:()=>!at('home')}],
  reward:async()=>{addCoins(30);await root.StarterKit?.unlock?.([{group:'combat',id:'backstab',n:1},{group:'combat',id:'ambush',n:1},{group:'combat',id:'rockfall',n:1},{group:'combat',id:'perch',n:1}],{kicker:'จบบทนำ',title:'ไพ่ของนักผจญภัย',text:'+30 เหรียญ · การ์ดใบอื่นหาได้จากการเดินทาง'});toast('จบบทนำ · เล่นอิสระได้แล้ว','quest')}}];
const byId=id=>STEPS.findIndex(x=>x.id===id);

/* ---------- pumpkin (temp farming) ---------- */
function waterDays(){return Object.keys(V()?.story?.water||{}).length}
function wateredToday(){return !!V()?.story?.water?.[G().day]}
function water(){const st=V().story;st.water||={};if(st.water[G().day]){toast('วันนี้รดน้ำไปแล้ว');return}const why=spend(2,10,1);if(why){toast(esc(why));return}
 st.water[G().day]=true;doSave();doRender();toast('💧 รดน้ำฟักทองแล้ว ('+waterDays()+'/3 วัน)','good')}

/* ---------- raid battle (v94: the flat card battle drawn on the village square, in a frame over the game) ---------- */
function startRaid(d){if(d.fighting)return;if(onWorld()){toast('กลับหมู่บ้านก่อน');return}
 const g=G(),v=V();if((g.hp||0)<30)g.hp=Math.max(g.hp||0,40);   // the festival raid never starts the player half-dead
 d.fighting=true;d.outcome=null;doSave();
 const party=(v.party||[]).filter(p=>p.hp>0).map(p=>p.key+':'+p.hp+':'+p.max+':'+(p.order||'charge')).join(',');
 const fr=document.createElement('iframe');fr.id='storyBattle';fr.title='โจรป่าบุกงาน';fr.style.cssText='position:fixed;inset:0;z-index:950;width:100%;height:100%;border:0;background:#07080c';
 fr.src='village-town.html?battle=1&embed=1&r=6&ms='+encodeURIComponent('bandit*1.2,wolf*1.1,bandit*1.2,wolf*1.1')+'&party='+encodeURIComponent(party)+'&hhp='+(g.hp||60)+'&hmax='+(g.maxHp||60)+(root.Progression?'&hatk='+Progression.heroCombat(g).atk+'&hdef='+Progression.heroCombat(g).def:'')+'&title='+encodeURIComponent('คืนเทศกาล ·');
 const done=e=>{if(e.source!==fr.contentWindow||e.data?.type!=='agrenor-battle')return;removeEventListener('message',done);const r=e.data;
  g.hp=Math.max(1,Math.min(g.maxHp||60,r.hp??g.hp));for(const x of r.party||[]){const p=(v.party||[]).find(q=>q.key===x.key);if(p){p.hp=Math.max(1,x.hp);if(x.order)p.order=x.order}}
  if(r.outcome==='win'){v.battles=(v.battles||0)+1;v.kills=(v.kills||0)+(r.kills||0);d.won=true}else toast(r.outcome==='lose'?'พ่ายแพ้... ตั้งหลักแล้วลองใหม่':'ถอยออกมา · โจรยังอยู่ในงาน','');
  d.fighting=false;doSave();fr.remove();doRender()};
 addEventListener('message',done);document.body.appendChild(fr)}

/* ---------- sales detector (coins up while an item or goods left the bag at the market) ---------- */
let prev=null;
function snapshot(){return {shop:V()?.shop?.sold||0,coins:V()?.coins||0,inv:(G()?.inventory||[]).length,goods:goodsCount(),loc:V()?.location,adv:!!adv()}}
function detectSale(){const now=snapshot(),p=prev;prev=now;if(!p)return false;if(now.shop>p.shop)return true;if(now.adv||p.adv)return false;return now.loc==='market'&&now.coins>p.coins&&(now.inv<p.inv||now.goods<p.goods)}

/* ---------- state ---------- */
function story(){const v=V();if(!v)return null;return v.story||null}
function freshSave(){const g=G(),v=V();if(v.starterKit===1&&g.day<=1&&!g.wins&&!v.adventure)return true;return g.day<=1&&!g.wins&&!(g.inventory||[]).length&&!(v.companions||[]).length&&!(v.party||[]).length&&!v.adventure}
function init(){const v=V();if(!v||v.story)return;v.story={v:1,mode:freshSave()?'active':'offer',i:0,data:{},water:{},crystals:0};doSave()}
function cur(){const st=story();return st&&st.mode==='active'?STEPS[st.i]:null}
function dataOf(step){const st=story();st.data[step.id]||={};return st.data[step.id]}

/* ---------- tracker ---------- */
let box=null;
function tracker(){if(box)return box;box=document.createElement('aside');box.id='storyTracker';box.hidden=true;box.setAttribute('aria-live','polite');document.body.appendChild(box);
 box.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(b){e.stopPropagation();act(b.dataset.act);return}if(e.target.closest('.stk-head')){const st=story();if(st){st.fold=!st.fold;doSave();draw(true)}}});return box}
let lastHtml='';
function draw(force){const el=tracker(),st=story();if(!st||st.mode==='off'||root.TitleScreen?.active||document.querySelector('dialog[open],.ck-reveal,.mg')){el.hidden=true;return}
 let html='';el.classList.toggle('stk-done',st.mode==='done');el.classList.toggle('stk-folded',!!st.fold);
 if(st.mode==='offer')html=`<div class="stk-head"><small>บทนำใหม่</small><b>เทศกาลเฟิร์นเวล</b><button class="stk-fold" type="button">${st.fold?'▸':'▾'}</button></div><div class="stk-body"><p class="stk-goal">เล่นบทนำ 3 วันของงานเทศกาล และการเดินทางครั้งแรก</p><p class="stk-hint">เหมาะกับเซฟใหม่ · เซฟเดิมเล่นได้ บางขั้นจะผ่านเองถ้าทำไว้แล้ว</p><div class="stk-acts"><button data-act="start" class="primary" type="button">▶ เล่นบทนำ</button><button data-act="off" type="button">ซ่อน</button></div></div>`;
 else if(st.mode==='done')html=`<div class="stk-head"><small>เล่นอิสระ</small><b>เบาะแสที่ได้</b><button class="stk-fold" type="button">${st.fold?'▸':'▾'}</button></div><div class="stk-body"><p class="stk-hint">• จานหินโบราณที่มีเส้นแสง<br>• จดหมายของ "G." ถึงเมืองใหญ่<br>• ดวงทองบนฟ้าที่เคลื่อนใกล้เข้ามา<br>• แผนที่สมบัติเก่าในกระเป๋า</p><p class="stk-hint">เส้นทางไปเมืองใหญ่ยังไม่เปิด (อยู่ในแผน)</p><div class="stk-acts"><button data-act="off" type="button">ซ่อนกล่องนี้</button></div></div>`;
 else{const step=STEPS[st.i];if(!step){el.hidden=true;return}const d=dataOf(step),chap=chapterOf(st.i),acts=(step.acts||[]).filter(a=>!a.hide?.(d));
  const p=step.progress?.(d);const night=late()&&!/^sleep|^rest/.test(step.id)?'<p class="stk-hint">🌙 ดึกแล้ว กลับบ้านนอนแล้วทำต่อพรุ่งนี้ได้</p>':'';
  html=`<div class="stk-head"><small>${esc(chap)}</small><b>${esc(step.title)}${step.tag==='temp'?'<span class="stk-tag" title="ระบบชั่วคราว ระบบจริงอยู่ในแผน">ชั่วคราว</span>':''}</b><button class="stk-fold" type="button">${st.fold?'▸':'▾'}</button></div>
  <div class="stk-body"><p class="stk-goal">◆ ${esc(step.goal)}</p>${p!=null?`<div class="stk-prog"><i style="width:${Math.round(p*100)}%"></i></div>`:''}${step.hint?`<p class="stk-hint">${esc(step.hint)}</p>`:''}${night}
  <div class="stk-acts">${acts.map((a,j)=>`<button type="button" data-act="${(step.acts||[]).indexOf(a)}" class="${a.primary?'primary':''}">${esc(a.label)}</button>`).join('')}</div>
  <div class="stk-acts"><button type="button" data-act="replay" title="ดูฉากล่าสุดอีกครั้ง">↺ ดูฉาก</button><button type="button" data-act="skipall" title="ข้ามบทนำทั้งหมด">ข้ามบทนำ</button></div></div>`}
 if(html!==lastHtml||force){el.innerHTML=html;lastHtml=html}el.hidden=false}
function chapterOf(i){for(let j=i;j>=0;j--)if(STEPS[j].chapter)return STEPS[j].chapter;return ''}
async function act(a){const st=story();if(!st)return;
 if(a==='start'){st.mode='active';st.i=0;st.data={};doSave();draw(true);return}
 if(a==='off'){st.mode='off';doSave();draw(true);return}
 if(a==='skipall'){const ok=root.GameDialog?await root.GameDialog.confirm('ข้ามบทนำทั้งหมด?\nจะไม่ได้รางวัลและฉากที่เหลือ (เปิดเล่นใหม่ได้จาก Story.reset() ในโหมดนักพัฒนา)'):confirm('ข้ามบทนำทั้งหมด?');if(!ok)return;st.mode='done';doSave();draw(true);return}
 if(a==='replay'){const sc=lastScene();if(sc)root.Cutscene.play(D().SCENES[sc]);return}
 const step=cur();const x=step?.acts?.[+a];if(x)await x.run(dataOf(step));draw(true)}
function lastScene(){const st=story();for(let j=st.i;j>=0;j--){const s1=STEPS[j];if(j<st.i&&s1.outro)return s1.outro;if(s1.intro&&(j<st.i||st.data[s1.id]?.introSeen))return s1.intro}return null}

/* ---------- loop ---------- */
let busy=false;
async function tick(){if(busy||!G()||!V())return;if(root.TitleScreen?.active){draw();return}init();const st=story();
 const sale=detectSale();if(!st||st.mode!=='active'){draw();return}
 const step=STEPS[st.i];if(!step){st.mode='done';doSave();draw(true);return}const d=dataOf(step);
 if(sale){d.sales=(d.sales||0)+1}
 if(step.id==='raid'&&d.fighting&&!document.getElementById('storyBattle')){d.fighting=false;doSave()}
 step.tick?.(d);
 if(root.Cutscene?.isPlaying()||tacticsOpen()||document.getElementById('storyBattle')){draw();return}
 busy=true;try{
  if(!d.begun){d.begun=true;step.begin?.(d);doSave()}
  if(step.intro&&!d.introSeen){d.introSeen=true;doSave();draw();await root.Cutscene.play(D().SCENES[step.intro])}
  if(step.check(d)){d.done=true;if(step.outro)await root.Cutscene.play(D().SCENES[step.outro]);await step.reward?.(d);st.i++;doSave();doRender();
   const nx=STEPS[st.i];if(nx){toast('✦ เควสใหม่: '+esc(nx.title),'quest');tracker().classList.remove('stk-pop');void tracker().offsetWidth;tracker().classList.add('stk-pop')}else{st.mode='done';doSave()}}
 }finally{busy=false}draw()}

function boot(){Object.assign(root.Cutscene.speakers,D().SPEAKERS);registerRaid();
 if(new URLSearchParams(location.search).get('story')==='reset'&&V()){delete V().story;doSave()}
 // editor / tool pages never run the story
 if(/[?&](editor|skipStory)/.test(location.search)||root.EDITOR_MODE||root.top!==root)return;
 setInterval(()=>{tick().catch(e=>{busy=false;console.warn('[story]',e)})},700)}
if(document.readyState!=='loading')setTimeout(boot,0);else document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0));

root.Story={steps:STEPS,state:story,
 reset(){if(!V())return;delete V().story;init();V().story.mode='active';doSave();draw(true)},
 goto(id){const st=story()||(init(),story());const i=byId(id);if(i<0)return false;st.mode='active';st.i=i;delete st.data[id];doSave();draw(true);return true},
 skip(){const st=story();if(st){st.mode='done';doSave();draw(true)}},
 play:id=>root.Cutscene.play(id==='contest'?D().contestScene(3):D().SCENES[id])};
})(globalThis);
