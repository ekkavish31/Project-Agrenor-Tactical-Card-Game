/* v95.01 · every quest is walked: talk to the real villager, walk to things in the street, make things at real stations (see the block above STEPS).
   v93 · Intro quest chain: the Fernvale harvest festival (3 days) + the first expedition (bandit nest).
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
/* v95.14: Kier walks the first expedition with you only — he joins (or is already in the party), and leaves again when you are home. He can be recruited normally afterwards. */
function markTemp(){try{const L=root.VillageLife,S=L.save(),had=L.inParty(S,'kier');if(!had&&[...S.party,...S.bench].filter(m=>m.key!=='sib').length===0&&L.join(S,'kier')){L.writeSave(S);toast('★ เคียร์ไปด้วยในภารกิจนี้ (กลับบ้านแล้วเขาจะแยกไปก่อน)')}else if(had)toast('★ เคียร์ไปด้วยในภารกิจนี้ (กลับบ้านแล้วเขาจะแยกไปก่อน)');if(L.inParty(L.save(),'kier')){V().story.tempAlly='kier';doSave()}}catch(e){}}
function leaveTemp(msg){try{const st=V()?.story;if(!st?.tempAlly)return;const k=st.tempAlly,S=root.VillageLife.save();S.party=S.party.filter(p=>p.key!==k);S.bench=S.bench.filter(p=>p.key!==k);root.VillageLife.writeSave(S);st.tempAlly=null;doSave();toast(msg||'เคียร์ขอกลับไปช่วยที่บ้านก่อน · ชวนเขาใหม่ได้ที่โรงแรม','good')}catch(e){}}
/* v98.234 · the sibling is always in the party, so it does not count as a recruited companion */
const partySize=()=>[...(V()?.party||[]),...(V()?.bench||[])].filter(m=>m.key!=='sib').length;

/* ---------- v98.332 · before the first trip: the follower's sword, potions, a temporary friend, and the wound on the way home ----------
   (story content is a PROPOSAL from the owner's brief, not promoted canon — see docs/TODO.md §15) */
const kierRetired=()=>!!V()?.story?.kierHurt;
const kierCase=()=>V()?.story?.tempAlly==='kier';
const potionCount=()=>{try{return root.VillageLife.save().potions||0}catch{return 0}};
/* the sword forged for the sibling: it leaves the bag and becomes the sibling's weapon (town-battle reads village.sibGear) */
function giveSibSword(d){try{const g=G(),inv=g.inventory||[],it=inv.find(x=>x.id>=d.next&&x.kind==='sword');if(!it)return;
 g.inventory=inv.filter(x=>x!==it);if(g.equipped===it.id){const k=g.inventory.find(x=>x.recipe==='oldKnife')||g.inventory[0];g.equipped=k?k.id:null}
 V().sibGear={kind:'sword',quality:it.quality||1,recipe:it.recipe||'sword'};doSave();toast('⚔ น้องได้ดาบเหล็กเล่มใหม่แล้ว · ตัวเอกยังใช้มีดสั้นของพ่อ','good')}catch(e){}}
/* the friend is hurt on the way home: a heavy leg wound (js/injury.js) and out of the team — the hospital step follows */
function kierInjured(){try{const k=V().story.tempAlly||'kier',g=root.WorldState?.game?.()||G();root.Injury?.force(g,k,'leg','heavy');
 leaveTemp('เคียร์บาดเจ็บที่ขาอย่างหนัก · ออกจากทีมไปพักฟื้น');V().story.kierHurt=true;doSave();try{root.WorldState?.commit?.()}catch{}}catch(e){}}

/* ---------- helpers that call existing game actions ---------- */
function spend(energy,minutes,fatigue){try{return spendActivity(energy,minutes,fatigue)}catch{return ''}}
const addCoins=n=>{V().coins=(V().coins||0)+n};

/* ---------- v95.01: quests you walk through ----------
   Every step names what it needs in the world, and js/town-quest.js (village), js/place-people.js (sub-maps) and js/interior.js (rooms)
   put a gold ◆ on it:  talk:'oren' → talk to that villager for real (wherever their schedule puts them) ·
   place:['market'] → a building · exit:true → a village exit · spot:{…} → objects in the street you walk to (goats that run, planks, the plot …).
   The tracker has no teleport buttons any more, only "📍 นำทาง" which makes the hero walk there on the roads. */
const LIFE=()=>root.VillageLife;
function npcName(id){return LIFE()?.P?.[id]?.name||id}
function npcPlace(id){const L=LIFE(),p=L?.P?.[id];if(!p)return null;const h=(G()?.minutes||480)/60;let at=null;for(const[a,b,pl]of p.sched||[])if(h>=a&&h<b){at=pl;break}if(!at||at==='home')at=L.homeOf?L.homeOf(p):p.home;return at}
function scene(){try{return root.VillageTown?.getScene?.()||''}catch{return ''}}
function townWin(){try{return root.VillageTown?.frame?.contentWindow}catch{return null}}
function guide(){const step=cur();if(!step)return;if(onWorld()){toast('อยู่บนแผนที่โลก · กลับหมู่บ้านก่อน');return}
 const d=dataOf(step),t=targetsOf(step,d);
 if(t.npc?.length){const pl=npcPlace(t.npc[0]),sc=scene();if(pl&&(sc==='place:'+pl||sc==='place:in:'+pl)){toast(npcName(t.npc[0])+' อยู่ในนี้ · คลิกที่ตัว (◆ สีทอง) เพื่อคุย');return}}
 if(t.place?.length&&t.place.includes(V()?.location)&&/^place:/.test(scene())&&!t.npc?.length){toast('อยู่ที่นี่แล้ว · เดินไปที่จุดบริการในฉาก');return}
 const go=()=>{const w=townWin();if(!w?.TownQuest?.guide?.())toast('ทำตาม ◆ สีทองบนแผนที่หมู่บ้าน')};
 if(scene()!=='town'){root.VillageTown?.open?.();setTimeout(go,350)}else go()}
const guideBtn={label:'📍 นำทาง',primary:true,hide:()=>onWorld(),run:guide};
const HINT_WALK='◆ สีทองบนแผนที่บอกทาง · คลิกถนนหรืออาคารเพื่อเดิน · คลิกคนเพื่อคุย';
function talkStep(o){return {tag:'real',...o,talk:o.talk,check:d=>!!d.talked,acts:[guideBtn,...(o.acts||[])],hint:o.hint||HINT_WALK}}
function targetsOf(step,d){const t=typeof step.targets==='function'?step.targets(d)||{}:{};const out={npc:[...(t.npc||[])],place:[...(t.place||[])],exit:!!(t.exit||step.exit),spots:[...(t.spots||[])],label:t.label||''};
 if(step.talk&&!d.talked)out.npc.push(step.talk);if(step.place)out.place.push(...[].concat(step.place));
 if(step.spot){const left=(step.spot.n||1)-(d.got||0);if(left>0)out.spots.push({...step.spot,n:left})}
 if(step.exit&&onWorld())out.exit=false;return out}

/* street objects (shared by several steps) */
const SPOT={
 goats:{key:'goats',kind:'goat',near:['square','inn','market','npc7'],n:2,spread:7,flee:true,mystery:true},   /* v98.331 · 2 goats (was 3): touching one starts the goat fight */
 planks:{key:'planks',kind:'plank',near:['npc3'],n:2,spread:3,mark:true,label:'แผ่นไม้ของเคน'},
 ripe:{key:'ripe',kind:'ripe',near:['npc13'],n:3,spread:4,mark:true,label:'ฟักทองสุก'},
 plot:{key:'plot',kind:'plot',near:['npc13'],n:1,spread:2,mark:true,label:'ฟักทองประกวดของฮิลดา'},
 stall:{key:'stall',kind:'stall',near:['market'],n:1,spread:3,mark:true,label:'แผงขายของ'},
 contest:{key:'contest',kind:'pumpkin',near:['square'],n:1,spread:3,mark:true,label:'ลานประกวดฟักทอง'}};
const plotIfDry=()=>(V()?.story?.seeds&&!wateredToday())?[SPOT.plot]:[];

/* ---------- v97.16 · the prologue is the tutorial ----------
   Each step opens with a 📘 lesson card about the system it uses (shown once, after the step's own cutscene, also kept in the journal).
   The battles of the prologue pass ?tut= to the arena, which coaches move by move (js/town-battle.js). The prologue cannot be skipped
   and the world map only opens when a step sends you out — free play starts when the finale is reached. */
const LESSON={
 wake:['เดินในหมู่บ้าน',['คลิกถนนหรืออาคารเพื่อเดิน · ลากพื้นเพื่อเลื่อนกล้อง · หมุนล้อเพื่อซูม','◆ สีทองบนแผนที่คือสิ่งที่เควสต้องการ · 📍 นำทาง ให้ตัวเอกเดินไปเอง','คลิกคนเพื่อคุย · Esc เปิดเมนู (กระเป๋า สำรับ ตัวละคร บันทึกเกม)','เดินด้วยปุ่ม: W A S D หรือลูกศร (จอสัมผัส/จอยสติ๊ก = จอยซ้ายมือ) · เดินชนประตูหรือคนค้างไว้สักครู่ก็ทำสิ่งนั้นเอง','ปุ่ม Act: E หรือ Space (จอสัมผัสคือปุ่มกลมใหญ่ · จอยคือปุ่ม A) = ทำสิ่งที่อยู่ตรงหน้า เช่น คุย เข้าอาคาร เก็บของ · กดค้าง ~½ วินาทีเพื่อเปิดวงกลมตัวเลือก (คุย ถามข่าว ให้ของ ...) แล้วปล่อยบนตัวเลือก']],
 goats:['เวลาและแรง',['นาฬิกาเดินตลอดเวลาในหมู่บ้าน · ชาวบ้านแต่ละคนมีตารางของตัวเอง','งานและกิจกรรมใช้แรงและเวลา · แรงหมดต้องพักหรือนอน','แพะวิ่งหนีเมื่อเข้าใกล้ แต่จะหอบแล้วหยุด — รอจังหวะนั้น']],
 seeds:['งานในหมู่บ้าน',['ชาวบ้านมีงานให้ช่วยเสมอ · ช่วยแล้วได้เงิน ของ และความสนิท','ลองคุยกับคนเดิมหลายครั้ง บทสนทนาเปลี่ยนตามเรื่องที่เกิดขึ้น']],
 pumpkin:['งานที่ต้องทำทุกวัน',['ฟักทองประกวดต้องดูแลวันละครั้ง · ยิ่งดูแลครบหลายวัน ผลประกวดยิ่งดี','งานบางอย่างได้ผลตามจำนวนวัน ไม่ใช่ทำครั้งเดียวจบ']],
 planks:['วัตถุดิบ',['ของที่เก็บได้เข้ากระเป๋าวัตถุดิบ (ไม้ เหล็ก ถ่าน เสบียง) · ดูได้ที่ 🎒 กระเป๋า','วัตถุดิบที่ขาดซื้อได้ที่ตลาด']],
 stall:['ซ่อมและสร้าง',['การซ่อม/สร้างใช้วัตถุดิบ แรง และเวลา · ถ้าของไม่พอ เกมบอกว่าขาดอะไร']],
 sleep1:['นอนพักและบันทึกเกม',['นอนที่เตียงในบ้าน = ฟื้นแรงและ HP ข้ามไปเช้าวันใหม่','เกมเซฟเองตลอด · อยากเก็บจุดนี้ไว้ ใช้ Esc → 💾 บันทึกเกม (3 ช่อง)']],
 guard:['ออกนอกหมู่บ้าน',['แผนที่โลกเดินทีละช่อง · หมอกจางเมื่อเดินผ่าน','การเดินกินเสบียงและเวลา · กลางคืนศัตรูดุกว่า','กลับหมู่บ้านได้ทุกเมื่อด้วยปุ่ม 🏠']],
 cave:['การต่อสู้ครั้งแรก',['คิวด้านบนบอกลำดับ: ใครเต็มแถบ CT ก่อนได้เล่นก่อน','คลิกช่องเพื่อเดิน · คลิกศัตรูเพื่อดูการ์ดที่ดีที่สุด · คลิกซ้ำเพื่อโจมตี','จบเทิร์นแล้วเลือกทิศหันหน้า — โดนตีจากด้านหลังแรงขึ้น ×1.2']],
 gus:['ช่างตีเหล็ก',['โรงตีเหล็กคือที่ทำของ ทั้งอาวุธ ของใช้ และของขาย']],
 lanterns:['คราฟต์ที่ทั่ง',['เดินไปที่จุดบริการ แล้วเลือกสิ่งที่จะทำ · ของแต่ละอย่างใช้วัตถุดิบต่างกัน']],
 craft:['ตีอาวุธ',['เตา: หลอมให้ร้อน → ทั่ง: ตีขึ้นรูป → ถังน้ำ: ชุบแข็ง','ฝีมือดีได้อาวุธ ★ สูงกว่า · สวมอาวุธที่ 🎒 กระเป๋า แล้ว ATK ในสนามเพิ่ม']],
 hire:['เพื่อนร่วมทาง',['ชวนคนที่มี ★ ที่โรงแรมเข้าทีม (สูงสุด 4 คน)','ในสนาม: สั่ง ⚔ บุก · 👣 ตาม · 🛡 ยึด และท่าพิเศษ (ใช้ 1 คริสตัล)','เพื่อนถึง Lv.3 แล้วสั่งเองได้ในตาของเขา 🎮']],
 sell:['ขายของ',['ขายที่โต๊ะรับซื้อในตลาด หรือวางของใน "ร้านของเรา" แล้วตั้งราคา','ร้านขายต่อเองแม้ตัวเอกไม่อยู่ · ดูยอดในสมุดยอดขาย']],
 raid:['สู้อย่างนักวางแผน',['ยืนสูงกว่าเป้า ตีแรงขึ้น ~10% ต่อระดับ (▲ บนช่องคือความสูง)','ธาตุชนะทาง ×1.3 · แพ้ทาง ×0.7 · ดูตารางธาตุใน Esc','การ์ดตอบโต้/หลบ ใช้ก่อนจบเทิร์น ทำงานตอนศัตรูตี']],
 sibSword:['อาวุธของน้อง',['ตัวเอกพกมีดสั้นของพ่อ · น้องยังมือเปล่า จึงต้องตีดาบเหล็กให้','ดาบที่ตีให้น้องจะถูกมอบให้เลย (ไม่เข้าชุดอาวุธของตัวเอก) · ยิ่งฝีมือดี ยิ่งแรง']],
 potions:['ยาฟื้นฟู',['ยาใช้ได้ทั้งตอนเดินทางและกลางการต่อสู้ · ข้างนอกศัตรูแข็งและเยอะกว่าในหมู่บ้าน','ซื้อได้ที่ร้านค้า หมอยา และตลาด · ราคาขึ้นลงตามความสัมพันธ์กับหมู่บ้าน']],
 hospital:['โรงพยาบาลและบาดแผล',['ตัวละครที่ล้มในสนามอาจได้แผล: เจ็บ (หายเองได้ทีละวัน) หรือ หนัก (หายได้เฉพาะเตียงโรงพยาบาล)','แผลหนักห้ามสู้ ทำงาน หรือเดินทางตามตำแหน่ง · เตียงคิดค่าพักต่อวัน','ที่บ้านหมอยามีปุ่ม 🏥 ห้องผู้ป่วย: รับเข้าพัก รับกลับ และเยี่ยมไข้วันละครั้ง (ความสนิท +1 และหายไวขึ้นเล็กน้อย)']],
 prep:['เตรียมตัวเดินทาง',['ซื้อเสบียงและยาก่อนออก · จัดสำรับที่ 🃏 สำรับ ให้เข้ากับสนาม']],
 expedition:['การเดินทางไกล',['ศัตรูซุ่มโจมตีได้ระหว่างทาง · ชนะแล้วได้ EXP เงิน และของ','แรงหมดในสนาม ใช้ ♻ ทิ้งไพ่แลกแรง · การ์ดปีน/กระโจนใช้ความสูงให้เป็นประโยชน์']],
 rest:['การผจญภัยของเจ้าเริ่มแล้ว',['จบบทนำแล้วเล่นได้อิสระ: บอร์ดเควส ร้านการ์ด ครูฝึก เมืองบนแผนที่โลก และบอสในตำนาน','เพื่อนเก่งขึ้นตามเลเวล · ไพ่ใหม่ได้จากเลเวล บอส ร้าน และครู']]
};
function lessonCard(id){const L=LESSON[id];if(!L)return Promise.resolve();
 if(!document.getElementById('stkLessonCss')){const c=document.createElement('style');c.id='stkLessonCss';c.textContent=`#stkLesson{position:fixed;inset:0;z-index:2000;display:grid;place-items:center;background:#05080daa;animation:stkL .3s ease both;font-family:VillageThai,"Noto Sans Thai",system-ui,sans-serif}
  #stkLesson .card{width:min(520px,92vw);padding:20px 22px;border-radius:14px;background:linear-gradient(#f3e6c6,#e2cfa2);color:#3a2a14;box-shadow:0 20px 50px #000b;border:2px solid #b08a4a}
  #stkLesson small{letter-spacing:.2em;color:#8a6a3a;font-size:11px}#stkLesson h3{margin:4px 0 10px;font:800 22px AgThai,Georgia,"Noto Sans Thai",serif;color:#5a3a10}
  #stkLesson ul{margin:0 0 14px;padding-left:20px;line-height:1.7;font-size:15px}#stkLesson button{width:100%;padding:10px;border-radius:10px;border:1px solid #7a4b06;background:linear-gradient(#f0c560,#c9902e);color:#2a1a06;font:700 15px inherit;font-family:inherit;cursor:pointer}
  @keyframes stkL{from{opacity:0}}`;document.head.append(c)}
 const st=V().story;(st.lessons||=[]).includes(id)||st.lessons.push(id);doSave();
 return new Promise(res=>{const d=document.createElement('div');d.id='stkLesson';d.innerHTML=`<div class="card"><small>📘 บทเรียน</small><h3>${esc(L[0])}</h3><ul>${L[1].map(x=>'<li>'+esc(x)+'</li>').join('')}</ul><button type="button">เข้าใจแล้ว ▸</button></div>`;
  const close=()=>{removeEventListener('keydown',key,true);d.remove();res()},key=e=>{if(e.key==='Enter'||e.key===' '||e.key==='Escape'){e.preventDefault();e.stopPropagation();close()}};
  d.querySelector('button').onclick=close;addEventListener('keydown',key,true);document.body.append(d);d.querySelector('button').focus()})}
/* world map only when the prologue sends you out (or you are already out on a step) */
const WORLD_STEPS=['cave','caveBack','expedition','return'];
function lock(){const st=story();if(!st||st.mode!=='active')return '';const step=STEPS[st.i];if(!step||WORLD_STEPS.includes(step.id))return '';return 'ธุระตรงหน้ายังไม่เสร็จ — '+step.title+': '+step.goal+' · ยังไม่ใช่เวลาออกจากหมู่บ้าน'}
/* v98.364 · during the prologue only the places the current step needs are open (home and the plaza always); the others answer with an in-story line.
   A talk step opens the place where that villager is right now (shared daily schedule); anything unknown stays open rather than trapping the player. */
function npcPlace(id){try{const L=root.VillageLife,p=L?.P?.[id];if(!p)return null;const h=L.VillageClock.read().hour;for(const [a,b,at] of p.sched||[])if(h>=a&&h<b)return at==='home'?(L.homeOf(p)||'inn'):at}catch{}return null}
function placeLock(ids,name){const st=story();if(!st||st.mode!=='active')return '';const step=STEPS[st.i];if(!step||WORLD_STEPS.includes(step.id)||step.id==='raid')return '';
 const list=[].concat(ids).filter(Boolean),ok=new Set(['home','square']);for(const x of [].concat(step.place||[]))ok.add(x);
 if(step.talk){const w=npcPlace(step.talk);if(!w)return '';ok.add(w)}
 if(list.some(x=>ok.has(x)))return '';
 return (name?'ตอนนี้ยังไม่มีธุระที่'+String(name).replace(/[<>&]/g,'')+' · ':'')+'ธุระตรงหน้าคือ "'+step.title+'" — '+step.goal+' · ไว้ค่อยแวะทีหลัง'}
const STEPS=[
 talkStep({id:'wake',chapter:'วันที่ 1 · เตรียมงานเทศกาล',intro:'opening',outro:'elderMeet',title:'ไปหาผู้ใหญ่บ้าน',talk:'oren',goal:'เดินไปหาผู้ใหญ่บ้านโอเรน แล้วคลิกที่ตัวเพื่อคุย',
  hint:'ช่วงเช้าผู้ใหญ่บ้านอยู่ที่ตลาด · '+HINT_WALK}),
 {id:'goats',tag:'real',title:'แพะหนีออกจากคอก',goal:'ตามจับแพะของปิ๊บ 2 ตัวที่หนีไปทั่วหมู่บ้าน',hint:'คลิกที่แพะเพื่อวิ่งตาม · มันวิ่งหนีเมื่อเข้าใกล้ แต่วิ่งได้ไม่นานก็หอบ พอแตะตัวมัน จะเข้าสู่ฉากต่อสู้จับแพะ (ตัวเอกไม่ล้มในฉากนี้) · ลูกศรขอบจอชี้ไปทางแพะ',
  spot:SPOT.goats,progress:d=>(d.got||0)/2,check:d=>(d.got||0)>=2,acts:[guideBtn],
  onSpot:async d=>{const r=await questBattle(d,{title:'จับแพะของปิ๊บ ·',ms:'goat*1,goat*1',tut:'goat',seed:4101,r:6,biome:'grass',page:'village-town.html'});
   if(r==='win'){d.got=2;return {msg:'🐐 จับแพะได้ครบ 2 ตัวแล้ว!',consume:true}}return {msg:r==='busy'?'':'แพะยังหนีอยู่ · กลับไปจับต่อได้เลย',consume:false}}},
 talkStep({id:'goatsBack',outro:'goatsDone',reward:()=>{addCoins(15);toast('รางวัล: +15 เหรียญ')},title:'พาแพะกลับไปคืน',talk:'pip',goal:'เอาแพะไปคืนปิ๊บ',hint:'ปิ๊บอยู่ที่ลานกลางหมู่บ้านช่วงเช้า บ่ายไปตลาด · '+HINT_WALK}),
talkStep({id:'seeds',outro:'seeds',title:'งานในไร่ของฮิลดา',talk:'hilda',goal:'ไปหาฮิลดาชาวนา ถามว่าช่วยอะไรได้บ้าง',hint:'เช้าอยู่ที่ไร่ เที่ยงถึงบ่ายสามขายผักที่ตลาด · '+HINT_WALK,
  reward:()=>{V().story.seeds=true}}),
{id:'pumpkin',tag:'real',title:'ช่วยงานในไร่',goal:'เก็บฟักทองสุกในไร่ 3 ลูก แล้วดูแลฟักทองประกวดของฮิลดา',hint:'เดินไปแตะฟักทองสุก 🎃 ในไร่ฮิลดา · แล้วแตะฟักทองประกวด 🌿 เพื่อดูแล (วันละครั้ง ยิ่งดูแลครบทุกวัน ฟักทองยิ่งใหญ่ ประกวดวันที่ 3)',
  spot:SPOT.ripe,progress:d=>Math.min(1,((d.got||0)+(waterDays()>=1?1:0))/4),targets:()=>({spots:wateredToday()?[]:[SPOT.plot]}),check:d=>(d.got||0)>=3&&waterDays()>=1,acts:[guideBtn],
  onSpot:async d=>{const r=await questBattle(d,{title:'ฟักทองในไร่ ·',ms:'pumpkin*1,pumpkin*1,pumpkin*1,pest*1,pest*1,pest*1',tut:'pumpkin',seed:4102,r:6,biome:'grass',poi:'patch',bg:'pumpkin-patch'});
   if(r==='win'){d.got=3;doSave();return {msg:'🎃 เก็บฟักทองสุกครบ 3 ลูกแล้ว!',consume:true}}return {msg:r==='busy'?'':'ฟักทองยังรอเก็บอยู่ · กลับไปเก็บต่อได้เลย',consume:false}}},
 talkStep({id:'tom',outro:'tomStall',title:'แผงขายของพัง',talk:'tom',goal:'ไปถามลุงทอมช่างไม้ว่าซ่อมแผงอย่างไร',hint:'ลุงทอมอยู่บ้านช่วงเช้า เที่ยงถึงห้าโมงเย็นช่วยงานที่โรงตีเหล็ก · '+HINT_WALK}),
 {id:'planks',tag:'real',title:'แผ่นไม้ของเคน',goal:'เก็บแผ่นไม้ 2 แผ่นที่กองไว้หน้าบ้านเคน',hint:'เดินไปแตะกองไม้ 🪵 · ได้ไม้เข้ากระเป๋าวัตถุดิบ',
  spot:SPOT.planks,progress:d=>(d.got||0)/2,check:d=>(d.got||0)>=2,acts:[guideBtn],
  onSpot:d=>{mats().wood=(mats().wood||0)+1;d.got=(d.got||0)+1;doSave();doRender();return {msg:'🪵 ไม้ +1 ('+d.got+'/2)',consume:true}}},
 {id:'stall',tag:'real',outro:'stallDone',title:'ซ่อมแผงขายของ',goal:'เดินไปที่แผงหน้าตลาด แล้วซ่อม (ใช้ไม้ 2)',hint:'เดินไปแตะแผง 🛠️ · ใช้แรง 6 และเวลา 30 นาที · ไม้ไม่พอซื้อได้ที่ตลาด',
  spot:SPOT.stall,check:d=>!!d.built,acts:[guideBtn],
  reward:()=>{addCoins(20);toast('รางวัล: +20 เหรียญจากลุงทอม')},
  onSpot:d=>{if((mats().wood||0)<2)return {msg:'ไม้ไม่พอ (ต้องใช้ 2)'};const why=spend(6,30,3);if(why)return {msg:why};mats().wood-=2;d.built=true;d.got=1;doSave();doRender();return {msg:'🔨 ซ่อมแผงเสร็จ!',consume:true}}},
 {id:'sleep1',tag:'real',outro:'day2',title:'จบวันแรก',goal:'เดินกลับบ้าน แล้วไปที่เตียงเพื่อนอนพัก',hint:'ในบ้านเดินไปที่เตียงแล้วเลือก "นอนพัก" · การนอนข้ามไปเช้าวันถัดไป',
  place:'home',begin:d=>{d.day=G().day},check:d=>G().day>d.day,acts:[guideBtn]},
 talkStep({id:'guard',chapter:'วันที่ 2 · ทำของ และหาคน',outro:'guardTalk',reward:()=>root.StarterKit?.unlock?.([{group:'combat',id:'push',n:1}],{kicker:'คำแนะนำของยามดอร์ก',title:'ผลัก',text:'ผลักศัตรูถอยหนึ่งช่อง · ผลักตกที่สูงเสีย HP เพิ่ม'}),title:'ยามประตูหมู่บ้าน',talk:'dork',goal:'ไปคุยกับยามดอร์กก่อนออกนอกหมู่บ้าน',hint:'ยามดอร์กเฝ้าอยู่ที่ลานกลางหมู่บ้านทั้งวัน · '+HINT_WALK}),
 {id:'cave',tag:'real',outro:'crystal',title:'ผลึกในถ้ำเหมืองเก่า',goal:'เดินออกทางออกหมู่บ้าน ไปทางเหมืองเก่า แล้วชนะการต่อสู้ 1 ครั้ง',hint:'บนแผนที่โลกเดินทีละช่อง · ระหว่างทางมีศัตรูดักอยู่ · สนามรบมีเนินและหน้าผา ยืนที่สูงตีแรงกว่า',
  exit:true,begin:d=>{d.base=V().battles||0},check:d=>(V().battles||0)>d.base,acts:[guideBtn],
  reward:()=>{V().story.crystals=(V().story.crystals||0)+3;return root.StarterKit?.unlock?.([{group:'combat',id:'skill',n:2}],{kicker:'บทเรียนจากถ้ำ',title:'ท่าโจมตีหนัก',text:'ตีแรงกว่าปกติ แต่ใช้แรงมากขึ้น · เพิ่มเข้าสำรับแล้ว'})}},
 {id:'caveBack',tag:'real',title:'กลับหมู่บ้าน',goal:'เดินทางกลับเฟิร์นเวล',hint:'บนแผนที่โลก กด "กลับหมู่บ้าน" เดินย้อนทางที่รู้จัก หรือเดินกลับเองทีละช่อง',
  check:()=>!onWorld(),acts:[]},
 talkStep({id:'gus',outro:'gusLantern',title:'ช่างตีเหล็กกัส',talk:'gus',goal:'เอาผลึกไปให้กัสที่โรงตีเหล็กดู',hint:'กัสอยู่ที่โรงตีเหล็ก 6 โมงเช้าถึง 1 ทุ่ม · '+HINT_WALK}),
 {id:'lanterns',tag:'real',outro:'lanternsDone',title:'โคมไฟเทศกาล',goal:'ทำโคมไฟ 3 ดวงที่ทั่งในโรงตีเหล็ก',hint:'เดินไปที่ทั่ง แล้วเลือก "ทำโคมไฟเทศกาล" · 1 ดวง = ไม้ 1 · ถ่าน 1 · ผลึก 1 · ไม้กับถ่านซื้อได้ที่ตลาด',
  place:'forge',progress:d=>(d.n||0)/3,check:d=>(d.n||0)>=3,acts:[guideBtn]},
 {id:'craft',tag:'real',outro:'craftDone',title:'ของขายในงาน',goal:'ตีอาวุธ 1 ชิ้นที่โรงตีเหล็ก',hint:'เตา: หลอมให้ร้อน → ทั่ง: ตีขึ้นรูปจนครบ 100 → ถังน้ำ: ชุบแข็ง · ดาบใช้เหล็ก 2 ถ่าน 1 ไม้ 1',
  place:'forge',begin:d=>{d.next=G().nextId},check:d=>(G().inventory||[]).some(x=>x.id>=d.next),acts:[guideBtn],
  reward:()=>root.StarterKit?.unlock?.([{group:'combat',id:'line',n:2}],{kicker:'อาวุธเล่มใหม่',title:'แทงทะลวง',text:'โจมตีทะลุสองช่องเป็นแนวตรง · สวมดาบเล่มใหม่ได้ที่กระเป๋า'})},
 {id:'hire',tag:'real',outro:'hireDone',title:'หาคนช่วย',goal:'ไปโรงแรมเขากวางทอง ชวนเคียร์เพื่อนสมัยเด็กไปด้วย (ไปด้วยเฉพาะภารกิจนี้)',hint:'คุยกับคนที่มี ★ · บรัมรับจ้าง 60 เหรียญ · เคียร์เพื่อนสมัยเด็กนั่งที่โรงแรมเที่ยงถึงสี่ทุ่ม ชวนได้เลย',
  targets:()=>({npc:['kier']}),check:()=>partySize()>0,acts:[guideBtn],
  reward:()=>root.StarterKit?.unlock?.([{group:'combat',id:'formation',n:2}],{kicker:'มีเพื่อนแล้ว',title:'จู่โจมประสาน',text:'มีเพื่อนยืนติดตัว ตีแรงขึ้น ×1.35'})},
 {id:'sleep2',tag:'real',outro:'day3',title:'พรุ่งนี้วันงาน',goal:'ดูแลฟักทองประกวดของฮิลดาวันนี้ แล้วกลับบ้านไปนอน',hint:'ฟักทองประกวดอยู่ที่ไร่ฮิลดา 🌿 · ในบ้านเดินไปที่เตียงแล้วเลือก "นอนพัก"',
  place:'home',targets:()=>({spots:plotIfDry()}),begin:d=>{d.day=G().day},check:d=>G().day>d.day,acts:[guideBtn]},
 {id:'sell',chapter:'วันที่ 3 · งานเทศกาลเก็บเกี่ยว',tag:'real',outro:'soldOne',title:'แข่งขายกับเกรเวน',goal:'ขายของในตลาดให้ได้ 1 ชิ้น',hint:'ขายที่โต๊ะรับซื้อ หรือวางของใน "ร้านของเรา" แล้วรอชาวบ้านมาซื้อ · อย่าลืมไปดูแลฟักทองของฮิลดาเช้านี้',
  place:'market',targets:()=>({spots:plotIfDry()}),check:d=>d.sales>0,acts:[guideBtn]},
 {id:'contest',tag:'real',title:'ประกวดฟักทอง',goal:'ช่วยฮิลดาแบกฟักทองไปที่ลานประกวดกลางหมู่บ้าน',hint:'เดินไปแตะแท่นประกวด 🎃 · ผลขึ้นกับจำนวนวันที่ช่วยดูแล',
  spot:SPOT.contest,targets:()=>({spots:plotIfDry()}),check:d=>!!d.judged,acts:[guideBtn],
  onSpot:async d=>{if(d.judged)return null;d.judged=true;const days=waterDays();doSave();await root.Cutscene.play(D().contestScene(days));addCoins(days>=3?60:days===2?30:10);d.got=1;doSave();doRender();return {msg:'🎃 ประกวดเสร็จแล้ว',consume:true}}},
 {id:'raid',tag:'real',intro:'raid',outro:'awaken',title:'โจรป่าบุกงาน!',goal:'ปกป้องงานเทศกาล — ชนะการต่อสู้',hint:'ใช้ไพ่เดินเข้าหาศัตรู ไพ่โจมตีเมื่ออยู่ในระยะ · ยืนบนหญ้า/มอสช่วยกำบัง · เพื่อนร่วมทางสู้ไปพร้อมกัน',
  check:d=>d.won,acts:[{label:'⚔ ปกป้องหมู่บ้าน!',primary:true,hide:d=>!!d.fighting,run:d=>startRaid(d)}],
  reward:()=>{V().story.element='earth';V().story.plate=true;if(V().character)V().character.points=(V().character.points||0)+1;try{const b=root.Adventure?.bag?.();if(b)b.treasureMap=(b.treasureMap||0)+1}catch{}return root.StarterKit?.unlock?.([{group:'combat',id:'quake',n:3},{group:'combat',id:'counter',n:1}],{kicker:'แก่นธาตุดินตื่นขึ้น',title:'พลังของผืนดิน'})}},
 talkStep({id:'plate',outro:'plate',title:'จานหินโบราณ',talk:'oren',goal:'นำจานหินไปให้ผู้ใหญ่บ้านโอเรนดู',hint:'หัวค่ำผู้ใหญ่บ้านนั่งที่โรงแรม สองทุ่มกลับบ้าน · '+HINT_WALK}),
 talkStep({id:'saf',chapter:'การเดินทางครั้งแรก · รังโจรป่า',outro:'safTalk',title:'ร้านยาของซาฟ',talk:'saf',goal:'แวะหาหมอยาซาฟก่อนออกเดินทาง',hint:'ซาฟอยู่ร้านยา 6 โมงเช้าถึง 6 โมงเย็น · '+HINT_WALK,
  reward:()=>{try{const b=V().bag||(V().bag={});b.potion=(b.potion||0)+1}catch{}}}),
 {id:'sibSword',tag:'real',intro:'sibSwordIntro',outro:'sibSwordDone',title:'ดาบเหล็กของน้อง',goal:'ตีดาบเหล็ก 1 เล่มที่โรงตีเหล็ก ให้น้องใช้ในการเดินทาง',hint:'เตา: หลอมให้ร้อน → ทั่ง: ตีขึ้นรูปจนครบ 100 → ถังน้ำ: ชุบแข็ง · ดาบใช้เหล็ก 2 ถ่าน 1 ไม้ 1 ซื้อวัตถุดิบที่ตลาด · ตัวเอกพกมีดสั้นของพ่ออยู่แล้ว',
  place:'forge',begin:d=>{d.next=G().nextId},check:d=>(G().inventory||[]).some(x=>x.id>=d.next&&x.kind==='sword'),acts:[guideBtn],reward:d=>giveSibSword(d)},
 {id:'potions',tag:'real',outro:'potionsDone',title:'ซื้อยาก่อนออกเดินทาง',goal:'ซื้อยาอย่างน้อย 2 ขวดที่ร้านค้าของเวร่า',hint:'ร้านค้าเปิด 7 โมงเช้าถึงหนึ่งทุ่ม · เข้าไปในร้านแล้วกด "🧪 ซื้อยา" · ซื้อที่หมอยา/ตลาดก็นับ',
  place:['shop','healer','market'],begin:d=>{d.p=potionCount()},progress:d=>Math.min(1,(potionCount()-(d.p||0))/2),check:d=>potionCount()-(d.p||0)>=2,acts:[guideBtn]},
 {id:'prep',tag:'real',title:'เตรียมตัวออกเดินทาง',goal:'ซื้อเสบียงอย่างน้อย 1 ชิ้นที่ตลาด',hint:'เดินไปที่โต๊ะซื้อวัตถุดิบในตลาด · เสบียงใช้กินฟื้นความสดชื่นระหว่างทาง · จัดสำรับได้ที่โต๊ะในบ้าน',
  place:'market',begin:d=>{d.food=mats().food||0},check:d=>(mats().food||0)>d.food,acts:[guideBtn]},
 {id:'expedition',tag:'real',intro:'departure',outro:'camp',title:'รังโจรป่า',goal:'ออกทางออกหมู่บ้าน ล้มศัตรูบนแผนที่โลกให้ได้ 3 ตัว',hint:'ผู้ใหญ่บ้านบอกทางไปจุดหมายแล้ว · เดินออกไปแล้วอาจถูกซุ่มโจมตีได้ทุกก้าว · พักแรมได้ทุกที่ · กลางคืนศัตรูดุร้ายขึ้น · HP ต่ำให้ดื่มยาหรือกลับก่อนก็ได้',
  tick:d=>{const w=onWorld();if(w){d.wasW=true;if(!V().story.tempAlly&&!kierRetired())markTemp()}else if(d.wasW){d.wasW=false;if(V().story.tempAlly)leaveTemp('เคียร์กลับไปช่วยงานที่บ้านก่อน · ออกเดินทางอีกครั้งเขาจะตามไปด้วย')}},   /* v98.332 · the friend walks only the trip itself */
  exit:true,begin:d=>{d.base=V().kills||0;markTemp();try{root.WorldState?.addLead('den','ผู้ใหญ่บ้านโอเรน',true)}catch(e){}},progress:d=>Math.min(1,((V().kills||0)-(d.base||0))/3),check:d=>(V().kills||0)-(d.base||0)>=3,
  acts:[guideBtn],
  reward:()=>root.StarterKit?.unlock?.([{group:'movement',id:'sprint',n:2},{group:'combat',id:'climb',n:2},{group:'combat',id:'dive',n:1},{group:'combat',id:'evade',n:1},{group:'combat',id:'firstAid',n:1}],{kicker:'ของจากค่ายโจร',title:'ทักษะเอาตัวรอด',text:'ป่ามีเนินและหน้าผา · ปีนขึ้นที่สูงแล้วกระโจนฟาดลงมาแรงกว่าเดิม'})},
 {id:'return',tag:'real',outro:()=>kierCase()?'kierHurt':'home',title:'กลับบ้าน',reward:()=>kierCase()?kierInjured():leaveTemp(),goal:'กลับหมู่บ้านพร้อมของที่ได้',hint:'จะเดินต่อไปจนถึงจุดหมายก็ได้ ยิ่งลึกของยิ่งดี แต่ยิ่งเสี่ยง',check:()=>!onWorld(),acts:[]},
 {id:'hospital',tag:'real',outro:'kierAdmitted',title:'ส่งเคียร์เข้าโรงพยาบาล',goal:'พาเคียร์ไปบ้านหมอยา เปิด 🏥 ห้องผู้ป่วย แล้วรับเข้าพักฟื้น',hint:'บ้านหมอยา (ซาฟ) เปิด 6 โมงเช้าถึง 6 โมงเย็น · เดินเข้าไปแล้วกดปุ่ม 🏥 ห้องผู้ป่วย → "รับเข้าพัก" ที่แถวของเคียร์ · เตียงคิดค่าพักต่อวัน',
  place:'healer',skip:()=>!V().story.kierHurt,check:()=>!!root.Injury?.of?.(root.WorldState?.game?.()||G(),'kier')?.bed,acts:[guideBtn]},
 {id:'sellLoot',tag:'real',intro:()=>V().story.kierHurt?'homeKier':null,reward:()=>{addCoins(20);try{const b=V().bag||(V().bag={});b.potion=(b.potion||0)+1}catch{}toast('รางวัล: +20 เหรียญ · ยา 1 ขวด')},title:'ขายของจากการเดินทาง',goal:'ขายของที่ได้มาที่ตลาด 1 ครั้ง',hint:'ของป่า (เขี้ยวหมาป่า สมุนไพร เหรียญโบราณ) ขายได้ที่ตลาด',place:'market',check:d=>d.sales>0,acts:[guideBtn]},
 {id:'rest',tag:'real',outro:'finale',title:'พักฟื้น',goal:'กลับบ้านแล้วนอนพัก',hint:'ในบ้านเดินไปที่เตียงแล้วเลือก "นอนพัก"',place:'home',begin:d=>{d.day=G().day},check:d=>G().day>d.day,acts:[guideBtn],
  reward:async()=>{addCoins(30);await root.StarterKit?.unlock?.([{group:'combat',id:'backstab',n:1},{group:'combat',id:'ambush',n:1},{group:'combat',id:'rockfall',n:1},{group:'combat',id:'perch',n:1}],{kicker:'จบบทนำ',title:'ไพ่ของนักผจญภัย',text:'+30 เหรียญ · การ์ดใบอื่นหาได้จากการเดินทาง'});toast('จบบทนำ · เล่นอิสระได้แล้ว','quest')}}];
const byId=id=>STEPS.findIndex(x=>x.id===id);

/* ---------- pumpkin (temp farming) ---------- */
function waterDays(){return Object.keys(V()?.story?.water||{}).length}
function wateredToday(){return !!V()?.story?.water?.[G().day]}
function water(){const st=V().story;st.water||={};if(st.water[G().day])return 'วันนี้ดูแลฟักทองไปแล้ว';const why=spend(2,10,1);if(why)return why;
 st.seeds=true;st.water[G().day]=true;doSave();doRender();return '🌿 ดูแลฟักทองประกวดของฮิลดาแล้ว ('+waterDays()+'/3 วัน)'}

/* ---------- v95.01: hooks the village pages call (same origin, through parent) ---------- */
function questTargets(){const step=cur();if(!step||onWorld())return null;const d=dataOf(step);return {id:step.id,...targetsOf(step,d)}}
async function questEvent(ev){const step=cur();if(!step||!ev)return null;const d=dataOf(step);
 if(ev.key==='plot')return {msg:water(),consume:wateredToday()};
 if(step.spot?.key===ev.key&&step.onSpot){const r=await step.onSpot(d);doSave();return r}
 return null}
function talked(id){const step=cur();if(!step)return false;const d=dataOf(step);if(step.talk===id&&!d.talked){d.talked=true;doSave();setTimeout(()=>tick().catch(()=>{}),50);return true}return false}
/* lanterns are made at the forge's anvil like any other station work (village-place.html joins actions with `with` to that station) */
function lanternAction(){const step=cur();if(step?.id!=='lanterns'||V()?.location!=='forge')return null;const m=mats(),c=V().story.crystals||0,d=dataOf(step);
 const reason=(m.wood||0)<1||(m.coal||0)<1?'ต้องมีไม้ 1 และถ่าน 1 · ซื้อที่ตลาด':c<1?'ผลึกเรืองแสงหมด':(d.n||0)>=3?'ครบ 3 ดวงแล้ว':(typeof activityReason==='function'?activityReason(4,20,2):'');
 return {id:'lantern',name:'ทำโคมไฟเทศกาล',image:'action-recipes',kind:'story',value:'lantern',cost:'ϟ 4 · ◷ 20 · ไม้ 1 ถ่าน 1 ผลึก 1',effect:'โคม '+(d.n||0)+'/3 · ผลึกเหลือ '+c,reason,with:['forge','smelt','water']}}
function makeLantern(){const a=lanternAction();if(!a)return;if(a.reason){toast(esc(a.reason));return}const step=cur(),d=dataOf(step),m=mats();
 const why=spend(4,20,2);if(why){toast(esc(why));return}m.wood--;m.coal--;V().story.crystals--;d.n=(d.n||0)+1;doSave();doRender();toast('🏮 โคมดวงที่ '+d.n+' เสร็จแล้ว','good')}
function hookActions(){if(typeof placeActions!=='function'||placeActions.storyHooked)return;const base=placeActions;
 placeActions=function(){const list=base.apply(this,arguments);try{const a=lanternAction();if(a)list.push(a)}catch{}return list};placeActions.storyHooked=true;
 if(typeof runPlaceAction==='function'){const run=runPlaceAction;runPlaceAction=async function(id){if(id==='lantern'){makeLantern();return}return run.apply(this,arguments)}}}

/* ---------- v98.331 · tutorial fights inside the prologue quests (docs/TODO.md §14) ----------
   questBattle(d, {title, ms, tut, seed, r, biome}) → 'win' | 'out' | 'busy'. A full-screen battle in a frame over the game (battle-field.html), the two heroes are immortal
   (?imm=1 · HP never below 1) and cannot flee (?noflee=1), so the fight always ends in a win once it is played through. */
/* v98.354 · ENCOUNTER CUT (Final Fantasy style): the village zooms + blurs, black bars whip across the screen and close, the fight loads BEHIND them (no half-loaded village / home flash),
   then the bars open on the arena. battleCut() → {open()} ; the iframe sends 'agrenor-battle-ready' when the arena has been built. */
function battleCut(){
 if(!document.getElementById('qbCutCss')){const c=document.createElement('style');c.id='qbCutCss';c.textContent=`#qbCut{position:fixed;inset:0;z-index:960;pointer-events:all;overflow:hidden}#qbCut i{position:absolute;left:-12%;width:124%;height:10.2%;background:#05070b;transform:translateX(-112%) skewX(-18deg);transition:transform .42s cubic-bezier(.7,0,.25,1)}#qbCut i:nth-child(even){transform:translateX(112%) skewX(-18deg)}#qbCut.on i{transform:translateX(0) skewX(-18deg)}#qbCut.out i{transform:translateX(-112%) skewX(-18deg);transition-duration:.5s}#qbCut.out i:nth-child(even){transform:translateX(112%) skewX(-18deg)}#qbCut b{position:absolute;inset:0;background:radial-gradient(circle,#fff 0,#fff0 62%);opacity:0;transition:opacity .22s}#qbCut.flash b{opacity:.85}#qbCut u{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) scale(2.4);opacity:0;font:italic 900 56px AgThai,system-ui,sans-serif;letter-spacing:.14em;color:#fff3b0;text-decoration:none;text-shadow:0 0 22px #ff6a1f;transition:all .35s .3s cubic-bezier(.2,1.5,.4,1)}#qbCut.on u{opacity:1;transform:translate(-50%,-50%) scale(1)}#qbCut.out u{opacity:0;transition:opacity .2s}.qb-zoom{transition:transform .5s cubic-bezier(.5,0,.9,.4),filter .5s!important;transform:scale(1.28)!important;filter:blur(5px) brightness(1.3)!important}`;document.head.append(c)}
 const el=document.createElement('div');el.id='qbCut';el.innerHTML='<b></b>'+Array.from({length:10},(_,k)=>`<i style="top:${k*10}%"></i>`).join('')+'<u>ENCOUNTER!</u>';document.body.append(el);
 const town=document.getElementById('villageTownLayer');town?.classList.add('qb-zoom');
 requestAnimationFrame(()=>requestAnimationFrame(()=>{el.classList.add('flash');setTimeout(()=>{el.classList.remove('flash');el.classList.add('on')},120)}));
 const t0=performance.now();
 return {open:()=>new Promise(res=>{const wait=Math.max(0,1050-(performance.now()-t0));setTimeout(()=>{town?.classList.remove('qb-zoom');el.classList.add('out');setTimeout(()=>{el.remove();res()},560)},wait)}),drop:()=>{town?.classList.remove('qb-zoom');el.remove()}}}
function battleReady(fr){return new Promise(res=>{const on=e=>{if(e.source===fr.contentWindow&&e.data?.type==='agrenor-battle-ready'){removeEventListener('message',on);res()}};addEventListener('message',on);setTimeout(res,20000)})}
/* v98.472 · VICTORY summary after a story fight (goat / pumpkin …): foes beaten, EXP, HP of the party — click / Enter to continue */
function victorySummary(r){return new Promise(done=>{
 if(!document.getElementById('qbVicCss')){const c=document.createElement('style');c.id='qbVicCss';c.textContent=`#qbVic{position:fixed;inset:0;z-index:970;display:grid;place-items:center;background:radial-gradient(ellipse at 50% 40%,#1d2a1fcc,#05080de8);animation:qbVicIn .35s ease both;font-family:VillageThai,"Noto Sans Thai",system-ui,sans-serif;cursor:pointer}#qbVic .box{width:min(480px,92vw);padding:22px 24px;border-radius:16px;background:linear-gradient(#f3e6c6,#e2cfa2);color:#3a2a14;box-shadow:0 24px 60px #000c;text-align:center}#qbVic h2{margin:0;font:900 40px/1 AgThai,Georgia,serif;letter-spacing:.12em;color:#9a5a12;text-shadow:0 2px 0 #fff8,0 0 24px #ffcf6a;animation:qbVicT .6s cubic-bezier(.2,1.6,.4,1) both}#qbVic .sub{margin:6px 0 14px;color:#6a5030;font-size:14px}#qbVic .row{display:grid;grid-template-columns:1fr auto auto;gap:10px;align-items:center;text-align:left;margin:6px 0;font-size:14.5px}#qbVic .row b{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#qbVic .xp{color:#a0520c;font-weight:800}#qbVic .hp{color:#5a6a40;font-variant-numeric:tabular-nums}#qbVic .go{margin-top:14px;color:#8a7050;font-size:12.5px}@keyframes qbVicIn{from{opacity:0}}@keyframes qbVicT{from{transform:scale(.4);opacity:0}}`;document.head.append(c)}
 const e=x=>String(x??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]),hero=(()=>{try{return G().village?.heroName||'ตัวเอก'}catch{return 'ตัวเอก'}})();
 const el=document.createElement('div');el.id='qbVic';el.setAttribute('role','dialog');el.setAttribute('aria-label','ชัยชนะ');
 el.innerHTML=`<div class="box"><h2>VICTORY!</h2><div class="sub">${e(String(r.title||'').replace(/\s*·\s*$/,''))} · ล้มศัตรู ${r.kills} ตัว</div>
  <div class="row"><b>${e(hero)}</b><span class="xp">${r.xp?'EXP +'+r.xp:''}</span><span class="hp">HP ${r.hp}/${r.maxHp}</span></div>
  ${r.party.map(p=>`<div class="row"><b>${e(p.name)}</b><span class="xp">${p.xp?'EXP +'+p.xp:''}</span><span class="hp">HP ${p.hp}/${p.max}</span></div>`).join('')}
  <div class="go">คลิก หรือกด Enter เพื่อไปต่อ</div></div>`;
 document.body.append(el);try{root.Sfx?.play?.('victory')}catch(x){}
 const close=()=>{removeEventListener('keydown',key,true);el.remove();done()},key=ev=>{if(['Enter',' ','Escape'].includes(ev.key)){ev.preventDefault();ev.stopPropagation();close()}};
 setTimeout(()=>{el.onclick=close;addEventListener('keydown',key,true)},450)})}
/* v98.476 · a story fight must not move the hero: remember where they stood on the village map (or in the open place) when the fight started,
   and put them back there afterwards — retried for a moment, because the map can re-place the hero at a door while it wakes up again */
function heroSpot(){try{const T=root.VillageTown;if(!T)return null;const sc=T.getScene?.(),f=/^place:/.test(sc||'')?T.marketFrame:T.frame,h=f?.contentWindow?.ResumeHook?.get?.();return h?{f,h:{...h},sc}:null}catch(e){return null}}
function heroBack(spot){if(!spot)return;const put=()=>{try{if(root.VillageTown?.getScene?.()===spot.sc)spot.f.contentWindow?.ResumeHook?.set?.(spot.h)}catch(e){}};put();for(const ms of [120,400,900,1600])setTimeout(put,ms)}
function questBattle(d,o){return new Promise(resolve=>{
 if(d.fighting||onWorld()){resolve('busy');return}
 const g=G(),v=V();if((g.hp||0)<30)g.hp=Math.max(g.hp||0,40);
 d.fighting=true;doSave();const spot=heroSpot();
 const party=(v.party||[]).filter(p=>p.hp>0).map(p=>p.key+':'+p.hp+':'+p.max+':'+(p.order||'charge')+':'+(p.level||1)).join(',');
 const fr=document.createElement('iframe');fr.id='storyBattle';fr.title=o.title;fr.style.cssText='position:fixed;inset:0;z-index:950;width:100%;height:100%;border:0;background:#07080c';
 fr.src=(o.page||'battle-field.html')+'?v='+(root.GAME_VERSION?.v||'')+'&battle=1&embed=1&imm=1&noflee=1&r='+(o.r||6)+'&biome='+(o.biome||'grass')+'&seed='+(o.seed||4100)+(o.poi?'&poi='+o.poi:'')+(o.bg?'&bg='+o.bg:'')+'&ms='+encodeURIComponent(o.ms)+'&party='+encodeURIComponent(party)+'&hhp='+(g.hp||60)+'&hmax='+(g.maxHp||60)+(root.Progression?'&'+Progression.battleParam(g,Progression.recipes):'')+'&title='+encodeURIComponent(o.title||'')+'&tut='+(o.tut||'');
 if(d.resumeSrc){fr.src=d.resumeSrc;d.resumeSrc=null}else{try{localStorage.removeItem('projectA.battleSnap')}catch{}}   /* v98.340 · resumed from the temporary save: same field, same moment */
 const done=e=>{if(e.source!==fr.contentWindow||e.data?.type!=='agrenor-battle')return;removeEventListener('message',done);const r=e.data;
  g.hp=Math.max(1,Math.min(g.maxHp||60,r.hp??g.hp));for(const x of r.party||[]){const p=(v.party||[]).find(q=>q.key===x.key);if(p){p.hp=Math.max(1,x.hp);if(x.order)p.order=x.order}}
  const win=r.outcome==='win';let xpGot=0;
  if(win){v.battles=(v.battles||0)+1;v.kills=(v.kills||0)+(r.kills||0);if(root.Progression){const xp=Progression.battleXp({dang:.25,kills:r.kills});xpGot=xp;gainCharacterXP(xp);for(const p of v.party||[])Progression.gainAlly(p,Math.round(xp*.8))}}
  d.fighting=false;doSave();fr.remove();doRender();heroBack(spot);
  if(win)victorySummary({title:o.title,kills:r.kills||0,xp:xpGot,hp:g.hp,maxHp:g.maxHp||60,party:(v.party||[]).map(p=>({name:p.name||p.key,hp:p.hp,max:p.max,xp:Math.round(xpGot*.8)}))}).then(()=>resolve('win'));else resolve('out')};
 {const cut=battleCut();battleReady(fr).then(()=>cut.open())}addEventListener('message',done);document.body.appendChild(fr)})}

/* ---------- raid battle (v94: the flat card battle drawn on the village square, in a frame over the game) ---------- */
function startRaid(d){if(d.fighting)return;if(onWorld()){toast('กลับหมู่บ้านก่อน');return}
 const g=G(),v=V();if((g.hp||0)<30)g.hp=Math.max(g.hp||0,40);   // the festival raid never starts the player half-dead
 d.fighting=true;d.outcome=null;doSave();const spot=heroSpot();
 const party=(v.party||[]).filter(p=>p.hp>0).map(p=>p.key+':'+p.hp+':'+p.max+':'+(p.order||'charge')+':'+(p.level||1)).join(',');
 const fr=document.createElement('iframe');fr.id='storyBattle';fr.title='โจรป่าบุกงาน';fr.style.cssText='position:fixed;inset:0;z-index:950;width:100%;height:100%;border:0;background:#07080c';
 fr.src='village-town.html?v='+(root.GAME_VERSION?.v||'')+'&battle=1&embed=1&r=6&ms='+encodeURIComponent('bandit*1.2,wolf*1.1,bandit*1.2,wolf*1.1')+'&party='+encodeURIComponent(party)+'&hhp='+(g.hp||60)+'&hmax='+(g.maxHp||60)+(root.Progression?'&'+Progression.battleParam(g,Progression.recipes):'')+'&title='+encodeURIComponent('คืนเทศกาล ·')+(d.tutDone?'':'&tut=raid');d.tutDone=true;
 if(d.resumeSrc){fr.src=d.resumeSrc;d.resumeSrc=null}else{try{localStorage.removeItem('projectA.battleSnap')}catch{}}   /* v98.340 · resumed from the temporary save: same field, same moment */
 const done=e=>{if(e.source!==fr.contentWindow||e.data?.type!=='agrenor-battle')return;removeEventListener('message',done);const r=e.data;
  g.hp=Math.max(1,Math.min(g.maxHp||60,r.hp??g.hp));for(const x of r.party||[]){const p=(v.party||[]).find(q=>q.key===x.key);if(p){p.hp=Math.max(1,x.hp);if(x.order)p.order=x.order}}
  if(r.outcome==='win'){v.battles=(v.battles||0)+1;v.kills=(v.kills||0)+(r.kills||0);d.won=true;if(root.Progression){const xp=Progression.battleXp({dang:.4,kills:r.kills});gainCharacterXP(xp);for(const p of v.party||[])Progression.gainAlly(p,Math.round(xp*.8))}}else toast(r.outcome==='lose'?'พ่ายแพ้... ตั้งหลักแล้วลองใหม่':'ถอยออกมา · โจรยังอยู่ในงาน','');
  d.fighting=false;doSave();fr.remove();doRender();heroBack(spot)};
 {const cut=battleCut();battleReady(fr).then(()=>cut.open())}addEventListener('message',done);document.body.appendChild(fr)}

/* ---------- sales detector (coins up while an item or goods left the bag at the market) ---------- */
let prev=null;
function snapshot(){return {shop:V()?.shop?.sold||0,coins:V()?.coins||0,inv:(G()?.inventory||[]).length,goods:goodsCount(),loc:V()?.location,adv:!!adv()}}
function detectSale(){const now=snapshot(),p=prev;prev=now;if(!p)return false;if(now.shop>p.shop)return true;if(now.adv||p.adv)return false;return now.loc==='market'&&now.coins>p.coins&&(now.inv<p.inv||now.goods<p.goods)}

/* ---------- state ---------- */
/* v95.01: steps were added (talk to the villager first), so a save from before keeps its place by step id */
const OLD_IDS=['wake','goats','pumpkin','stall','sleep1','cave','caveBack','lanterns','craft','hire','sleep2','sell','contest','raid','plate','prep','expedition','return','sellLoot','rest'];
const OLD_TO={pumpkin:'seeds',stall:'tom',cave:'guard',lanterns:'gus',prep:'saf'};
const V2_IDS=['wake','goats','goatsBack','seeds','pumpkin','tom','planks','stall','sleep1','guard','cave','caveBack','gus','lanterns','craft','hire','sleep2','sell','contest','raid','plate','saf','prep','expedition','return','sellLoot','rest'];
function migrate(st){if(st&&st.v===2){const old=V2_IDS[st.i];if(old){const i=byId(old==='prep'?'sibSword':old);if(i>=0)st.i=i}else if(st.i>=V2_IDS.length)st.i=STEPS.length;st.v=3;doSave();return st}
 if(!st||st.v>=2)return st;const old=OLD_IDS[st.i];if(old){const id=OLD_TO[old]||old,i=byId(id);if(i>=0){st.i=i;if(OLD_TO[old])delete st.data[old]}}else if(st.i>=OLD_IDS.length)st.i=STEPS.length;st.v=2;doSave();return st}
function story(){const v=V();if(!v)return null;return migrate(v.story||null)}
function freshSave(){const g=G(),v=V();if(v.starterKit===1&&g.day<=1&&!g.wins&&!v.adventure)return true;return g.day<=1&&!g.wins&&!(g.inventory||[]).length&&!(v.companions||[]).length&&!(v.party||[]).filter(m=>m.key!=='sib').length&&!v.adventure}
function init(){const v=V();if(!v||v.story)return;v.story={v:3,mode:freshSave()?'active':'offer',i:0,data:{},water:{},crystals:0};doSave()}
function cur(){const st=story();return st&&st.mode==='active'?STEPS[st.i]:null}
function dataOf(step){const st=story();st.data[step.id]||={};return st.data[step.id]}

/* ---------- tracker ---------- */
let box=null;
function tracker(){if(box)return box;box=document.createElement('aside');box.id='storyTracker';box.hidden=true;box.setAttribute('aria-live','polite');document.body.appendChild(box);
 box.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(e.target.closest('.stk-x')){e.stopPropagation();const st=story();if(st){st.closed=true;st.unseen=0;doSave();draw(true);badgeSync()}return}
  if(b){e.stopPropagation();act(b.dataset.act);return}if(e.target.closest('.stk-head')){const st=story();if(st){st.fold=!st.fold;doSave();draw(true)}}});return box}
let lastHtml='';
function draw(force){const el=tracker(),st=story();if(!st||st.mode==='off'||root.TitleScreen?.active||document.querySelector('dialog[open],.ck-reveal,.mg')){el.hidden=true;return}
 if(st.closed&&st.mode!=='offer'){el.hidden=true;badgeSync();return}   /* v98.337 · closed: only the badge on the 'วันนี้' icon remains */
 let html='';el.classList.toggle('stk-done',st.mode==='done');el.classList.toggle('stk-folded',!!st.fold);
 if(st.mode==='offer')html=`<div class="stk-head"><small>บทนำใหม่</small><b>เทศกาลเฟิร์นเวล</b><button class="stk-fold" type="button">${st.fold?'▸':'▾'}</button></div><div class="stk-body"><p class="stk-goal">เล่นบทนำ 3 วันของงานเทศกาล และการเดินทางครั้งแรก</p><p class="stk-hint">เหมาะกับเซฟใหม่ · เซฟเดิมเล่นได้ บางขั้นจะผ่านเองถ้าทำไว้แล้ว</p><div class="stk-acts"><button data-act="start" class="primary" type="button">▶ เล่นบทนำ</button><button data-act="off" type="button">ซ่อน</button></div></div>`;
 else if(st.mode==='done')html=`<div class="stk-head"><small>เล่นอิสระ</small><b>เบาะแสที่ได้</b><button class="stk-fold" type="button">${st.fold?'▸':'▾'}</button><button class="stk-x" type="button" title="ปิดหน้าต่าง · เปิดกลับได้ที่ไอคอน วันนี้ → ภารกิจ" aria-label="ปิด">✕</button></div><div class="stk-body"><p class="stk-hint">• จานหินโบราณที่มีเส้นแสง<br>• จดหมายของ "G." ถึงเมืองใหญ่<br>• ผลึกม่วงจากเหมืองเก่าที่อุ่นเมื่อแตะ<br>• แผนที่สมบัติเก่าในกระเป๋า</p><p class="stk-hint">เส้นทางไปเมืองใหญ่ยังไม่เปิด (อยู่ในแผน)</p><div class="stk-acts"><button data-act="off" type="button">ซ่อนกล่องนี้</button></div></div>`;
 else{const step=STEPS[st.i];if(!step){el.hidden=true;return}const d=dataOf(step),chap=chapterOf(st.i),acts=(step.acts||[]).filter(a=>!a.hide?.(d));
  const p=step.progress?.(d);const night=late()&&!/^sleep|^rest/.test(step.id)?'<p class="stk-hint">🌙 ดึกแล้ว กลับบ้านนอนแล้วทำต่อพรุ่งนี้ได้</p>':'';
  html=`<div class="stk-head"><small>${esc(chap)}</small><b>${esc(step.title)}${step.tag==='temp'&&root.PROJECT_DEV?'<span class="stk-tag" title="ระบบชั่วคราว ระบบจริงอยู่ในแผน (แสดงเฉพาะเครื่องผู้สร้าง)">ชั่วคราว</span>':''}</b><button class="stk-fold" type="button">${st.fold?'▸':'▾'}</button><button class="stk-x" type="button" title="ปิดหน้าต่าง · เปิดกลับได้ที่ไอคอน วันนี้ → ภารกิจ" aria-label="ปิด">✕</button></div>
  <div class="stk-body"><p class="stk-goal">◆ ${esc(step.goal)}</p>${p!=null?`<div class="stk-prog"><i style="width:${Math.round(p*100)}%"></i></div>`:''}${step.hint?`<p class="stk-hint">${esc(step.hint)}</p>`:''}${night}
  <div class="stk-acts">${acts.map((a,j)=>`<button type="button" data-act="${(step.acts||[]).indexOf(a)}" class="${a.primary?'primary':''}">${esc(a.label)}</button>`).join('')}</div>
  <div class="stk-acts"><button type="button" data-act="replay" title="ดูฉากล่าสุดอีกครั้ง">↺ ดูฉาก</button>${(()=>{try{return localStorage.getItem('projectA.dev')==='1'}catch(e){return false}})()?'<button type="button" data-act="skipall" title="ข้ามบทนำทั้งหมด">ข้ามบทนำ</button>':''}</div></div>`}
 if(html!==lastHtml||force){el.innerHTML=html;lastHtml=html}el.hidden=false}
function chapterOf(i){for(let j=i;j>=0;j--)if(STEPS[j].chapter)return STEPS[j].chapter;return ''}
async function act(a){const st=story();if(!st)return;
 if(a==='start'){st.mode='active';st.i=0;st.data={};doSave();draw(true);return}
 if(a==='off'){if(st.mode==='active')return;st.mode='off';doSave();draw(true);return}   /* v97.16: an active prologue cannot be switched off */
 if(a==='skipall'){const ok=root.GameDialog?await root.GameDialog.confirm('ข้ามบทนำทั้งหมด?\nจะไม่ได้รางวัลและฉากที่เหลือ (เปิดเล่นใหม่ได้จาก Story.reset() ในโหมดนักพัฒนา)'):confirm('ข้ามบทนำทั้งหมด?');if(!ok)return;st.mode='done';doSave();draw(true);return}
 if(a==='replay'){const sc=lastScene();if(sc)root.Cutscene.play(D().SCENES[sc]);return}
 const step=cur();const x=step?.acts?.[+a];if(x)await x.run(dataOf(step));draw(true)}
function lastScene(){const st=story();for(let j=st.i;j>=0;j--){const s1=STEPS[j],o=typeof s1.outro==='function'?s1.outro():s1.outro,n=typeof s1.intro==='function'?s1.intro():s1.intro;if(j<st.i&&o)return o;if(n&&(j<st.i||st.data[s1.id]?.introSeen))return n}return null}

/* ---------- loop ---------- */
let busy=false;
async function tick(){if(busy||!G()||!V())return;if(root.TitleScreen?.active){draw();return}init();const st=story();
 const sale=detectSale();if(!st||st.mode!=='active'){draw();return}
 const step=STEPS[st.i];if(!step){st.mode='done';doSave();draw(true);return}const d=dataOf(step);
 if(step.skip?.(d)){st.i++;doSave();draw(true);return}
 if(sale){d.sales=(d.sales||0)+1}
 if(step.id==='raid'&&d.fighting&&!document.getElementById('storyBattle')){d.fighting=false;doSave()}
 step.tick?.(d);
 if(root.Cutscene?.isPlaying()||tacticsOpen()||document.getElementById('storyBattle')){draw();return}
 busy=true;try{
  if(!d.begun){d.begun=true;step.begin?.(d);doSave()}
  const introId=typeof step.intro==='function'?step.intro():step.intro;
  if(introId&&!d.introSeen){d.introSeen=true;doSave();draw();await root.Cutscene.play(D().SCENES[introId])}
  if(LESSON[step.id]&&!d.lessonSeen){d.lessonSeen=true;if(['cave','expedition'].includes(step.id))V().story.tut=step.id;doSave();await lessonCard(step.id)}
  if(step.check(d)){d.done=true;const outroId=typeof step.outro==='function'?step.outro(d):step.outro;if(outroId)await root.Cutscene.play(D().SCENES[outroId]);await step.reward?.(d);st.i++;doSave();doRender();
   const nx=STEPS[st.i];try{root.Sfx?.play('quest-done')}catch(e){}if(nx){if(st.closed)st.unseen=(st.unseen||0)+1;toast('✦ เควสใหม่: '+esc(nx.title),'quest');tracker().classList.remove('stk-pop');void tracker().offsetWidth;tracker().classList.add('stk-pop')}else{st.mode='done';doSave()}}
 }finally{busy=false}draw()}

function boot(){Object.assign(root.Cutscene.speakers,D().SPEAKERS);hookActions();
 if(new URLSearchParams(location.search).get('story')==='reset'&&V()){delete V().story;doSave()}
 // editor / tool pages never run the story
 if(/[?&](editor|skipStory)/.test(location.search)||root.EDITOR_MODE||root.top!==root)return;
 setInterval(()=>{tick().catch(e=>{busy=false;console.warn('[story]',e)})},700)}
if(document.readyState!=='loading')setTimeout(boot,0);else document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0));

/* v98.337 · the quest window can be closed: the 'วันนี้' icon of the village HUD (js/town-hud.js) shows a number and a ภารกิจ entry that opens it again */
function badgeSync(){try{const st=story();root.dispatchEvent(new CustomEvent('story-tracker',{detail:trackerInfo()}))}catch{}}
function trackerInfo(){const st=story(),on=!!st&&st.mode!=='off'&&st.mode!=='offer'&&!!st.closed;return {closed:on,count:on?Math.max(1,st.unseen||0)+(st.mode==='active'?0:0):0,fresh:!!(on&&st.unseen),title:st&&st.mode==='active'?STEPS[st.i]?.title||'':'เบาะแสที่ได้'}}
function openTracker(){const st=story();if(!st)return false;st.closed=false;st.unseen=0;doSave();draw(true);badgeSync();return true}
/* v98.340 · temporary save: re-open the story fight that was on screen when the game was closed (js/resume.js) */
async function resumeFight(){const step=cur();if(!step)return false;const d=dataOf(step);if(!(d.fighting||(step.id==='raid'&&!d.won))||document.getElementById('storyBattle'))return false;
 let rec=null;try{rec=JSON.parse(localStorage.getItem('projectA.battleSnap')||'null')}catch{}
 d.fighting=false;d.resumeSrc=rec?rec.page+rec.search+'&resume=1':null;doSave();
 if(step.id==='raid'){startRaid(d);return true}
 if(step.onSpot){const r=await step.onSpot(d);doSave();if(r?.msg)toast(r.msg);return true}return false}
/* v98.472 · main story phase A: the odd extra goat (Mip in disguise) was seen once — docs/lore/MAIN-STORY-CANON.md A8 */
const mipSeen=()=>!!V()?.story?.mip?.seen;
function mystery(ev){const v=V();if(!v||ev!=='seen')return;v.story=v.story||{};v.story.mip=v.story.mip||{};if(!v.story.mip.seen){v.story.mip.seen=true;try{window.Titles?.log(G(),'mip.seen')}catch(e){}doSave()}}
root.Story={mipSeen,mystery,resumeFight,trackerInfo,openTracker,lock,placeLock,lessons:()=>(V()?.story?.lessons||[]).map(id=>({id,title:LESSON[id]?.[0],lines:LESSON[id]?.[1]})),lesson:lessonCard,steps:STEPS,state:story,questTargets,questEvent,talked,guide,
 reset(){if(!V())return;delete V().story;init();V().story.mode='active';doSave();draw(true)},
 goto(id){const st=story()||(init(),story());const i=byId(id);if(i<0)return false;st.mode='active';st.i=i;delete st.data[id];doSave();draw(true);return true},
 skip(){const st=story();if(st){st.mode='done';doSave();draw(true)}},
 play:id=>root.Cutscene.play(id==='contest'?D().contestScene(3):D().SCENES[id])};
})(globalThis);
