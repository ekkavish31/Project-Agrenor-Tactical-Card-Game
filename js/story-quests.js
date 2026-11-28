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
 V().sibGear={kind:'sword',quality:it.quality||1,recipe:it.recipe||'sword'};doSave();toast('⚔ ตัวตามได้ดาบเหล็กเล่มใหม่แล้ว · ตัวเอกยังใช้มีดสั้นของพ่อ','good')}catch(e){}}
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
 /* v98.1139 · inside a place (the market …) and the quest wants something OUTSIDE: walk to the place's gate first — never jump out to the village map */
 if(/^place:/.test(scene())){try{const w=root.VillageTown?.marketFrame?.contentWindow;if(w?.PlaceGuide?.toExit()){toast('เดินไปทางออกก่อน · พอออกจากที่นี่แล้วค่อยเลือกว่าจะเดินหาเองหรือกดเดินอัตโนมัติอีกครั้ง');return}}catch(e){}}
 if(scene()!=='town'){root.VillageTown?.open?.();setTimeout(go,350)}else go()}
const guideBtn={label:'เดินอัตโนมัติ',icon:'guide',alt:'map',tip:'นำทาง · เดินไปยังจุดที่เควสต้องการตามถนน',primary:true,hide:()=>onWorld(),run:guide};
const HINT_WALK='◆ สีทองบนแผนที่บอกทาง · คลิกถนนหรืออาคารเพื่อเดิน · คลิกคนเพื่อคุย';
function talkStep(o){return {tag:'real',...o,talk:o.talk,check:d=>!!d.talked,acts:[guideBtn,...(o.acts||[])],hint:o.hint||HINT_WALK}}
/* v98.598/604 · WHERE a talk happens decides the backdrop — for every NPC scene (talkStep outro → the NPC), by where that person really is at that hour (npcPlace):
   forge → the forge picture · market / shop → the market picture · square / a house door → the village (code-drawn) · inn / guild / temple / healer / Hilda's farm → code-drawn rooms (no paintings yet) */
const PLACE_BG={forge:{bg:'assets/forge.webp'},market:{bg:'assets/market.webp'},shop:{bg:'assets/market.webp'},square:{bg:'assets/market.webp'},inn:{art:'innHall'},guild:{art:'guildHall'},temple:{art:'temple'},healer:{art:'hearth'}};
let TALK_NPC=null;
function talkNpcOf(id){if(!TALK_NPC){TALK_NPC={};for(const s of STEPS)if((s.talk||s.npc)&&s.outro&&typeof s.outro==='string')TALK_NPC[s.outro]=s.talk||s.npc}return TALK_NPC[id]||null}
function sceneAt(id){const sc=D().SCENES[id];if(!sc)return sc;try{const npc=talkNpcOf(id);if(!npc)return sc;const at=String(npcPlace(npc)||'');
  if(root.DialogueBackdrops)return root.DialogueBackdrops.intro(id,sc,at);
  let o=PLACE_BG[at];if(!o){o=npc==='hilda'?{art:'hildaFarm'}:{bg:'assets/market.webp'}}   /* v98.617 · outdoors in the village = the painted market square (owner's request), not the code-drawn countryside */   /* her own farm / a house door → outdoors */
  return {...sc,art:o.art||null,bg:o.bg||null}}catch(e){return sc}}
function targetsOf(step,d){const t=typeof step.targets==='function'?step.targets(d)||{}:{};const out={npc:[...(t.npc||[])],place:[...(t.place||[])],exit:!!(t.exit||step.exit),spots:[...(t.spots||[])],label:t.label||''};
 if(step.talk&&!d.talked)out.npc.push(step.talk);if(step.place)out.place.push(...[].concat(step.place));
 if(step.spot){const left=(step.spot.n||1)-(d.got||0);if(left>0)out.spots.push({...step.spot,n:left})}
 if(step.exit&&onWorld())out.exit=false;return out}

/* street objects (shared by several steps) */
const SPOT={
 goats:{key:'goats',kind:'goat',near:['square','inn','market','npc7'],n:2,spread:7,flee:true},   /* v98.331 · 2 goats (was 3): touching one starts the goat fight */
 planks:{key:'planks',kind:'plank',near:['npc3','forge'],n:2,spread:2,mark:true,label:'กองไม้'},   /* v98.1176 · TWO separate piles: one by Ken's house, one at the forge */
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
 bread:['กินของฟื้นพลัง',['ขนมปังป้าเมย์ฟื้น HP และแรง — เปิดสมุดผนึก แท็บ ของใช้ แล้วกด "ใช้" ที่การ์ดขนมปัง','ใช้แล้วการ์ดจะหมดไป 1 ใบ · เก็บของฟื้นฟูไว้ใช้ตอนเจ็บหรือหมดแรง']],
 chestLesson:['หีบเก็บของ',['หีบในบ้านฝากของได้ทั้งวัตถุดิบ (เหล็ก ถ่าน ไม้ เสบียง) และอุปกรณ์ที่ไม่ได้สวมใส่ — ของในหีบไม่หายตอนออกเดินทาง','ใช้ได้เฉพาะตอนอยู่ที่บ้าน · เดินไปที่หีบแล้วเลือก หีบเก็บของ · ฝากได้ทีละชิ้น ลองฝากแท่งเหล็กที่ลุงทอมให้ 1 ชิ้นดู']],
 deckLesson:['จัดสำรับ',['สำรับคือไพ่ที่ตัวละครใช้ในสนามรบ แยกเป็นไพ่เดินกับไพ่โจมตี — ไพ่ใหม่ที่ได้มาอยู่ในสมุดก่อน ยังไม่ลงสำรับเอง','เดินไปที่โต๊ะจัดสำรับ แล้วเพิ่มไพ่ อัสนีบาต ที่ฮิลดาให้ลงสำรับโจมตี (กด + ที่ใบนั้น) แล้วกดบันทึก · ไพ่แต่ละธาตุชนะศัตรูต่างธาตุ']],
 wake:['เดินในหมู่บ้าน',['คลิกถนนหรืออาคารเพื่อเดิน · ลากพื้นเพื่อเลื่อนกล้อง · หมุนล้อเพื่อซูม','◆ สีทองบนแผนที่คือสิ่งที่เควสต้องการ · กด 📍 นำทาง ให้ตัวเอกเดินไปเอง','คลิกคนเพื่อคุย · กด Esc เปิดเมนู (สมุดผนึก สำรับ ตัวละคร บันทึกเกม)','กด Shift ค้างไว้ → เคอร์เซอร์เป็นรอยเท้า คลิกพื้นตรงไหนก็เดินไปตรงนั้นอย่างเดียว (ไม่คุยกับใคร ไม่เข้าสถานที่ ไม่หยิบของ) · ใช้ได้ทุกแมพที่เดินเองได้ (เฉพาะเมาส์)','เดินด้วยปุ่ม W A S D หรือลูกศร (จอสัมผัส/จอยสติ๊กใช้จอยซ้าย) · เดินชนประตูหรือคนค้างไว้สักครู่ก็เข้าไปทำสิ่งนั้นเอง','กด E หรือ Space (จอสัมผัสใช้ปุ่มกลมใหญ่ · จอยใช้ปุ่ม A) เพื่อทำสิ่งตรงหน้า เช่น คุย เข้าอาคาร เก็บของ · กดค้างครึ่งวินาทีเพื่อเปิดวงกลมตัวเลือก แล้วปล่อยบนตัวเลือก']],
 goats:['เวลาและแรง',['นาฬิกาเดินตลอดเวลาในหมู่บ้าน · ชาวบ้านแต่ละคนมีตารางของตัวเอง','งานและกิจกรรมใช้แรงและเวลา · แรงหมดต้องพักหรือนอน','แพะวิ่งหนีเมื่อเข้าใกล้ แต่จะหอบแล้วหยุด — รอจังหวะนั้น']],
 seeds:['งานในหมู่บ้าน',['ชาวบ้านมีงานให้ช่วยเสมอ · ช่วยแล้วได้เงิน ของ และความสนิท','ลองคุยกับคนเดิมหลายครั้ง บทสนทนาเปลี่ยนตามเรื่องที่เกิดขึ้น']],
 pumpkin:['งานที่ต้องทำทุกวัน',['ฟักทองประกวดต้องดูแลวันละครั้ง · ยิ่งดูแลครบหลายวัน ผลประกวดยิ่งดี','งานบางอย่างได้ผลตามจำนวนวัน ไม่ใช่ทำครั้งเดียวจบ']],
 planks:['วัตถุดิบ',['ของที่เก็บได้เข้าสมุดผนึก (หมวดวัตถุดิบ) (ไม้ เหล็ก ถ่าน เสบียง) · ดูได้ที่ 📖 สมุดผนึก','วัตถุดิบที่ขาดซื้อได้ที่ตลาด']],
 stall:['ซ่อมและสร้าง',['การซ่อม/สร้างใช้วัตถุดิบ แรง และเวลา · ถ้าของไม่พอ เกมบอกว่าขาดอะไร']],
 sleep1:['นอนพักและบันทึกเกม',['นอนที่เตียงในบ้าน = ฟื้นแรงและ HP ข้ามไปเช้าวันใหม่','เกมเซฟเองตลอด · อยากเก็บจุดนี้ไว้ ใช้ Esc → 💾 บันทึกเกม (3 ช่อง)']],
 guard:['ออกนอกหมู่บ้าน',['แผนที่โลกเดินทีละช่อง · หมอกจางเมื่อเดินผ่าน','การเดินกินเสบียงและเวลา · กลางคืนศัตรูดุกว่า','กลับหมู่บ้านได้ทุกเมื่อด้วยปุ่ม 🏠']],
 cave:['การต่อสู้ครั้งแรก',['คิวด้านบนบอกลำดับ: ใครเต็มแถบ CT ก่อนได้เล่นก่อน','คลิกช่องเพื่อเดิน · คลิกศัตรูเพื่อดูการ์ดที่ดีที่สุด · คลิกซ้ำเพื่อโจมตี','จบเทิร์นแล้วเลือกทิศหันหน้า — โดนตีจากด้านหลังแรงขึ้น ×1.2']],
 gus:['ช่างตีเหล็ก',['โรงตีเหล็กคือที่ทำของ ทั้งอาวุธ ของใช้ และของขาย']],
 lanterns:['คราฟต์ที่ทั่ง',['เดินไปที่จุดบริการ แล้วเลือกสิ่งที่จะทำ · ของแต่ละอย่างใช้วัตถุดิบต่างกัน']],
 craft:['ตีอาวุธ',['เตา: หลอมให้ร้อน → ทั่ง: ตีขึ้นรูป → ถังน้ำ: ชุบแข็ง','ฝีมือดีได้อาวุธ ★ สูงกว่า · สวมอาวุธที่ 📖 สมุดผนึก แล้ว ATK ในสนามเพิ่ม']],
 hire:['เพื่อนร่วมทาง',['ชวนคนที่มี ★ ที่โรงแรมเข้าทีม (สูงสุด 4 คน)','ในสนาม: สั่ง ⚔ บุก · 👣 ตาม · 🛡 ยึด และท่าพิเศษ (ใช้ 1 คริสตัล)','เพื่อนถึง Lv.3 แล้วสั่งเองได้ในตาของเขา 🎮']],
 sell:['ขายของ',['ขายที่โต๊ะรับซื้อในตลาด หรือวางของใน "ร้านของเรา" แล้วตั้งราคา','ร้านขายต่อเองแม้ตัวเอกไม่อยู่ · ดูยอดในสมุดยอดขาย']],
 raid:['สู้อย่างนักวางแผน',['ยืนสูงกว่าเป้า ตีแรงขึ้น ~10% ต่อระดับ (▲ บนช่องคือความสูง)','ธาตุชนะทาง ×1.3 · แพ้ทาง ×0.7 · ดูตารางธาตุใน Esc','การ์ดตอบโต้/หลบ ใช้ก่อนจบเทิร์น ทำงานตอนศัตรูตี']],
 sibSword:['อาวุธของตัวตาม',['ตัวเอกพกมีดสั้นของพ่อ · ตัวตามยังถือแค่ท่อนฟืน จึงต้องตีดาบเหล็กให้','ดาบที่ตีให้ตัวตามจะถูกมอบให้เลย (ไม่เข้าชุดอาวุธของตัวเอก) · ยิ่งฝีมือดี ยิ่งแรง']],
 potions:['ยาฟื้นฟู',['ยาใช้ได้ทั้งตอนเดินทางและกลางการต่อสู้ · ข้างนอกศัตรูแข็งและเยอะกว่าในหมู่บ้าน','ซื้อได้ที่ร้านค้า หมอยา และตลาด · ราคาขึ้นลงตามความสัมพันธ์กับหมู่บ้าน']],
 hospital:['โรงพยาบาลและบาดแผล',['ตัวละครที่ล้มในสนามอาจได้แผล: เจ็บ (หายเองได้ทีละวัน) หรือ หนัก (หายได้เฉพาะเตียงโรงพยาบาล)','แผลหนักห้ามสู้ ทำงาน หรือเดินทางตามตำแหน่ง · เตียงคิดค่าพักต่อวัน','ที่บ้านหมอยามีปุ่ม 🏥 ห้องผู้ป่วย: รับเข้าพัก รับกลับ และเยี่ยมไข้วันละครั้ง (ความสนิท +1 และหายไวขึ้นเล็กน้อย)']],
 prep:['เตรียมตัวเดินทาง',['ซื้อเสบียงและยาก่อนออก · จัดสำรับที่ 🃏 สำรับ ให้เข้ากับสนาม']],
 expedition:['การเดินทางไกล',['ศัตรูซุ่มโจมตีได้ระหว่างทาง · ชนะแล้วได้ EXP เงิน และของ','แรงหมดในสนาม ใช้ ♻ ทิ้งไพ่แลกแรง · การ์ดปีน/กระโจนใช้ความสูงให้เป็นประโยชน์']],
 rest:['การผจญภัยของเจ้าเริ่มแล้ว',['จบบทนำแล้วเล่นได้อิสระ: บอร์ดเควส ร้านการ์ด ครูฝึก เมืองบนแผนที่โลก และบอสในตำนาน','เพื่อนเก่งขึ้นตามเลเวล · ไพ่ใหม่ได้จากเลเวล บอส ร้าน และครู']]
};
function rememberLesson(id){const st=V().story;(st.lessons||=[]).includes(id)||st.lessons.push(id);doSave()}
function lessonCard(id){const L=LESSON[id];if(!L)return Promise.resolve();const step=STEPS.find(x=>x.id===id);
 return root.QuestAnnouncement.show({title:step?.title||L[0],lesson:{title:L[0],lines:L[1]}}).then(()=>rememberLesson(id))}
async function questBriefing(step,d){
 const L=!d.lessonSeen&&LESSON[step.id];
 await root.QuestAnnouncement.show({title:step.title,details:[step.goal,...(!L&&step.hint?[step.hint]:[])].filter(Boolean),lesson:L?{title:L[0],lines:L[1]}:null,todo:step.todo?.(d)||null});
 d.briefingPending=false;if(L){d.lessonSeen=true;rememberLesson(step.id)}doSave();
}
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
  spot:SPOT.goats,check:d=>(d.got||0)>=2,acts:[guideBtn],   /* v98.1086 · no progress bar / counter: both goats are won in ONE fight */
  onSpot:async d=>{const r=await questBattle(d,{title:'จับแพะของปิ๊บ ·',ms:'goat*1,goat*1',tut:'goat',seed:4101,r:6,biome:'grass',scene:'goatStreet',keepBgm:true}   /* v98.570 · a fixed town-street scene (was: the village map around the fountain) */);
   if(r==='win'){d.got=2;try{root.Story?.mystery?.('seen')}catch(e){}return {msg:'🐐 จับแพะได้ครบ 2 ตัวแล้ว!',consume:true}}return {msg:r==='busy'?'':'แพะยังหนีอยู่ · กลับไปจับต่อได้เลย',consume:false}}},
 talkStep({id:'goatsBack',outro:'goatsDone',reward:()=>{addCoins(15);toast('รางวัล: +15 เหรียญ')},title:'พาแพะกลับไปคืน',talk:'pip',goal:'เอาแพะไปคืนปิ๊บ',hint:'ปิ๊บอยู่ที่ลานกลางหมู่บ้านช่วงเช้า บ่ายไปตลาด · '+HINT_WALK}),
/* v98.1179 · after the goats: the hero is hungry → open the card-book and EAT the bread (the card turns into the real item with a restoring effect, js/item-use-fx.js) */
{id:'bread',tag:'real',intro:'breadHungry',outro:'breadDone',title:'หิวแล้ว',goal:'เปิดสมุดผนึก แล้วกินขนมปังป้าเมย์',hint:'กดไอคอน สมุดผนึก มุมขวาบน → แท็บ ของใช้ → การ์ดขนมปังป้าเมย์ → กด ใช้',
  begin:d=>{try{const b=V().bag||(V().bag={});if(!((b.mayBread||0)>0||(b.bread||0)>0||(b.smallPumpkin||0)>0)){b.mayBread=1;doSave();toast('🍞 แม่ยัดขนมปังป้าเมย์ไว้ในสมุดให้ 1 ก้อน')}}catch(e){}},check:d=>!!d.ate,acts:[]},
talkStep({id:'seeds',outro:'seeds',title:'งานในไร่ของฮิลดา',talk:'hilda',goal:'ไปหาฮิลดาชาวนา ถามว่าช่วยอะไรได้บ้าง',hint:'เช้าอยู่ที่ไร่ เที่ยงถึงบ่ายสามขายผักที่ตลาด · '+HINT_WALK,
  reward:()=>{V().story.seeds=true}}),
{id:'pumpkin',tag:'real',outro:'pumpkinDone',npc:'hilda',todo:d=>[{t:'เก็บฟักทองสุกในไร่ 3 ลูก',done:(d.got||0)>=3},{t:'ดูแลฟักทองประกวดของฮิลดา (วันละครั้ง)',done:waterDays()>=1}],title:'ช่วยงานในไร่',goal:'เก็บฟักทองสุกในไร่ 3 ลูก แล้วดูแลฟักทองประกวดของฮิลดา',hint:'เดินไปแตะฟักทองสุก 🎃 ในไร่ฮิลดา · แล้วแตะฟักทองประกวด 🌿 เพื่อดูแล (วันละครั้ง ยิ่งดูแลครบทุกวัน ฟักทองยิ่งใหญ่ ประกวดวันที่ 3)',
  spot:SPOT.ripe,progress:d=>Math.min(1,((d.got||0)+(waterDays()>=1?1:0))/4),targets:()=>({spots:wateredToday()?[]:[SPOT.plot]}),check:d=>(d.got||0)>=3&&waterDays()>=1,acts:[guideBtn],
  reward:async()=>{/* v98.605 · Hilda's thank-you: the first attack card (⚡ อัสนีบาต). It goes to the collection only — NOT into the deck — so the deck lesson at home has something to place */
   const thunderOK=await (async()=>{try{await root.StarterKit?.unlock?.([{group:'combat',id:'thunder',n:1}],{noReveal:true});return true}catch(e){return false}})();   /* v98.1173 · the card and the small pumpkin are shown together in ONE gift scene (◀ ▶) */
   try{const dk=V().tacticDecks;if(dk?.combat?.thunder){dk.combat.thunder-=1;if(dk.combat.thunder<=0)delete dk.combat.thunder;doSave()}}catch(e){}
   try{const gifts=[];if(thunderOK)gifts.push({id:'a-thunder',key:'thunder',n:1,text:'ฮิลดาให้ไพ่ใบนี้เป็นของขอบคุณ — ยังไม่ได้ใส่ในสำรับ ไว้ตอนเย็นจัดสำรับที่บ้านนะ'});
    if(typeof addItem==='function'){addItem('smallPumpkin',1);doSave();doRender();toast('🎃 ฮิลดาให้ ฟักทองลูกเล็ก ×1 (ฟื้น HP +30 · แรง +30) — ดูในสมุดผนึก');gifts.push({key:'smallPumpkin',n:1,text:'ฮิลดาให้เป็นของขอบคุณที่ช่วยดูแลฟักทอง'})}
    if(gifts.length)await root.ItemGet?.show(gifts,{kicker:'ของขวัญจากฮิลดา'})}catch(e){}
   /* v98.1176 · the pumpkin job ends the day: the clock jumps to 18:00 (dusk — the village lights come on) so going home for dinner fits */
   try{const g=G();if(g&&(g.minutes||0)<1080){g.minutes=1080;doSave();doRender();toast('🌇 งานในไร่เสร็จตอนหัวค่ำ — ตอนนี้ 18:00')}}catch(e){}},
  onSpot:async d=>{const r=await questBattle(d,{title:'ฟักทองในไร่ ·',ms:'pumpkin*1,pumpkin*1,pumpkin*1,pest*1,pest*1,pest*1',tut:'pumpkin',seed:4102,r:4,biome:'grass',poi:'patch',bg:'pumpkin-patch',keepBgm:true});
   if(r==='win'){d.got=3;doSave();return {msg:'🎃 เก็บฟักทองสุกครบ 3 ลูกแล้ว!',consume:true}}return {msg:r==='busy'?'':'ฟักทองยังรอเก็บอยู่ · กลับไปเก็บต่อได้เลย',consume:false}}},
 /* v98.605 · day-1 evening at home: dinner with Mom (scene homeWelcome, played by homeHooks when the hero is inside the house) → free time but NO going outside (Story.homeLock) → chest lesson → deck lesson → bed */
 {id:'homeWelcome',tag:'real',title:'กลับบ้าน',goal:'เย็นแล้ว — เดินกลับบ้าน แม่รออยู่',hint:'งานวันนี้เสร็จแล้ว เดินกลับบ้านได้เลย · แม่ทำอาหารอุ่น ๆ รออยู่',place:'home',check:d=>!!d.welcomed,acts:[guideBtn]},
 {id:'chestLesson',tag:'real',title:'ฝากของในหีบ',goal:'ในบ้าน: เดินไปที่หีบแล้วฝากของอย่างน้อย 1 ชิ้น (เช่นฟักทองลูกเล็กหรือวัตถุดิบที่เก็บมา)',hint:'เดินไปที่หีบในบ้าน → เลือก หีบเก็บของ → กดฝาก · คืนนี้ยังออกไปข้างนอกไม่ได้ ทำอะไรในบ้านก็ได้',place:'home',begin:d=>{/* v98.1176 · the iron from Tom no longer exists on day 1: make sure there is something to put in the chest */try{const m=mats();if(!Object.values(m).some(n=>(+n||0)>0)){m.wood=(m.wood||0)+2;doSave();toast('🪵 แม่ให้ฟืนสองท่อน — ลองเอาไปฝากในหีบดู')}}catch(e){}d.base=chestCount()},check:d=>chestCount()>(d.base||0),acts:[guideBtn]},
 {id:'deckLesson',tag:'real',title:'จัดสำรับ',goal:'ที่โต๊ะจัดสำรับ: ใส่ไพ่ อัสนีบาต ที่ฮิลดาให้ลงสำรับโจมตี แล้วกดบันทึก',hint:'เดินไปที่โต๊ะ → จัดสำรับ → หาไพ่ อัสนีบาต กด + → บันทึก',place:'home',check:d=>deckHas('thunder'),acts:[guideBtn]},
 {id:'sleep1',tag:'real',outro:'day2',title:'จบวันแรก',goal:'งานวันนี้เสร็จแล้ว — พระอาทิตย์ใกล้ตก เดินกลับบ้านแล้วไปที่เตียงเพื่อนอนพัก',hint:'ตอนเย็นของวันแรกเวลาเดินช้าลงให้ทำงานครบ · ในบ้านเดินไปที่เตียงแล้วเลือก "นอนถึงเช้า" · การนอนข้ามไปเช้าวันถัดไป',
  place:'home',begin:d=>{d.day=G().day},check:d=>G().day>d.day,acts:[guideBtn]},
 talkStep({id:'tom',chapter:'วันที่ 2 · ทำของ และหาคน',skip:()=>!!V().story?.tomDone,outro:'tomStall',title:'แผงขายของพัง',talk:'tom',goal:'ไปถามลุงทอมช่างไม้ว่าซ่อมแผงอย่างไร',hint:'ลุงทอมอยู่บ้านช่วงเช้า เที่ยงถึงห้าโมงเย็นช่วยงานที่โรงตีเหล็ก · '+HINT_WALK}),
 {id:'planks',tag:'real',skip:()=>!!V().story?.tomDone,title:'เก็บไม้สองกอง',todo:d=>[{t:'เก็บกองไม้กองที่ 1',done:(d.got||0)>=1},{t:'เก็บกองไม้กองที่ 2',done:(d.got||0)>=2}],goal:'เก็บไม้ให้ครบสองกอง — กองหน้าบ้านเคน และกองที่โรงตีเหล็ก',hint:'เดินไปแตะกองไม้ 🪵 ทั้งสองกอง · ได้ไม้เข้าสมุดผนึก (หมวดวัตถุดิบ)',
  spot:SPOT.planks,progress:d=>(d.got||0)/2,check:d=>(d.got||0)>=2,acts:[guideBtn],
  onSpot:d=>{mats().wood=(mats().wood||0)+1;d.got=(d.got||0)+1;doSave();doRender();return {msg:'🪵 ไม้ +1 ('+d.got+'/2)',consume:true}}},
 {id:'stall',tag:'real',skip:()=>!!V().story?.tomDone,outro:'stallDone',title:'ซ่อมแผงขายของ',goal:'เดินไปที่แผงหน้าตลาด แล้วซ่อม (ใช้ไม้ 2)',hint:'เดินไปแตะแผง 🛠️ · ใช้แรง 6 และเวลา 30 นาที · ไม้ไม่พอซื้อได้ที่ตลาด',
  spot:SPOT.stall,check:d=>!!d.built,acts:[guideBtn],
  reward:async()=>{addCoins(20);try{mats().iron=(mats().iron||0)+3}catch(e){}toast('รางวัล: +20 เหรียญ · แท่งเหล็ก ×3 จากลุงทอม');try{await root.ItemGet?.show([{key:'iron',n:3}],{kicker:'ค่าแรงจากลุงทอม',text:'ลุงทอมจ่ายเป็นเหล็กไว้ให้ใช้ตีของครั้งแรก'})}catch(e){}   /* v98.605 · Tom pays in iron too (for the first forging) *//* v98.1176 · the Tom steps now run on DAY 2 (after the evening at home): no clock jump here any more — the jump to dusk moved to the end of the pumpkin step */},
  onSpot:d=>{if((mats().wood||0)<2)return {msg:'ไม้ไม่พอ (ต้องใช้ 2)'};const why=spend(6,30,3);if(why)return {msg:why};mats().wood-=2;d.built=true;d.got=1;V().story.tomDone=true;doSave();doRender();return {msg:'🔨 ซ่อมแผงเสร็จ!',consume:true}}},
 talkStep({id:'guard',outro:'guardTalk',reward:()=>root.StarterKit?.unlock?.([{group:'combat',id:'push',n:1}],{kicker:'คำแนะนำของยามดอร์ก',title:'ผลัก',text:'ผลักศัตรูถอยหนึ่งช่อง · ผลักตกที่สูงเสีย HP เพิ่ม'}),title:'ยามประตูหมู่บ้าน',talk:'dork',goal:'ไปคุยกับยามดอร์กก่อนออกนอกหมู่บ้าน',hint:'ยามดอร์กเฝ้าอยู่ที่ลานกลางหมู่บ้านทั้งวัน · '+HINT_WALK}),
 {id:'cave',tag:'real',outro:'crystal',title:'ผลึกในถ้ำเหมืองเก่า',goal:'เดินออกทางออกหมู่บ้าน ไปทางเหมืองเก่า แล้วชนะการต่อสู้ 1 ครั้ง',hint:'บนแผนที่โลกเดินทีละช่อง · ระหว่างทางมีศัตรูดักอยู่ · สนามรบมีเนินและหน้าผา ยืนที่สูงตีแรงกว่า',
  exit:true,begin:d=>{d.base=V().battles||0},check:d=>(V().battles||0)>d.base,acts:[guideBtn],
  reward:async()=>{crystalBag();const gb=V().bag;gb.glowCrystal=(gb.glowCrystal||0)+3;try{await root.ItemGet?.show([{key:'glowCrystal',n:3}],{kicker:'จากผนังถ้ำ',text:'ผลึกที่เก็บมาได้จากอุโมงค์'})}catch(e){}return root.StarterKit?.unlock?.([{group:'combat',id:'skill',n:2}],{kicker:'บทเรียนจากถ้ำ',title:'ท่าโจมตีหนัก',text:'ตีแรงกว่าปกติ แต่ใช้แรงมากขึ้น · เพิ่มเข้าสำรับแล้ว'})}},
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
 {id:'sleep2',tag:'real',outro:'day3',title:'พรุ่งนี้วันงาน',goal:'ดูแลฟักทองประกวดของฮิลดาวันนี้ แล้วกลับบ้านไปนอน',hint:'ฟักทองประกวดอยู่ที่ไร่ฮิลดา 🌿 · ในบ้านเดินไปที่เตียงแล้วเลือก "นอนถึงเช้า"',
  place:'home',targets:()=>({spots:plotIfDry()}),begin:d=>{d.day=G().day},check:d=>G().day>d.day,acts:[guideBtn]},
 {id:'sell',chapter:'วันที่ 3 · งานเทศกาลเก็บเกี่ยว',tag:'real',outro:'soldOne',title:'แข่งขายกับเกรเวน',goal:'ขายของในตลาดให้ได้ 1 ชิ้น',hint:'ขายที่โต๊ะรับซื้อ หรือวางของใน "ร้านของเรา" แล้วรอชาวบ้านมาซื้อ · อย่าลืมไปดูแลฟักทองของฮิลดาเช้านี้',
  place:'market',targets:()=>({spots:plotIfDry()}),check:d=>d.sales>0,acts:[guideBtn]},
 {id:'contest',tag:'real',title:'ประกวดฟักทอง',goal:'ช่วยฮิลดาแบกฟักทองไปที่ลานประกวดกลางหมู่บ้าน',hint:'เดินไปแตะแท่นประกวด 🎃 · ผลขึ้นกับจำนวนวันที่ช่วยดูแล',
  spot:SPOT.contest,targets:()=>({spots:plotIfDry()}),check:d=>!!d.judged,acts:[guideBtn],
  onSpot:async d=>{if(d.judged)return null;d.judged=true;const days=waterDays();doSave();await root.Cutscene.play(D().contestScene(days));addCoins(days>=3?60:days===2?30:10);d.got=1;doSave();doRender();return {msg:'🎃 ประกวดเสร็จแล้ว',consume:true}}},
 {id:'raid',tag:'real',intro:'raid',outro:'awaken',title:'โจรป่าบุกงาน!',goal:'ปกป้องงานเทศกาล — ชนะการต่อสู้',hint:'ใช้ไพ่เดินเข้าหาศัตรู ไพ่โจมตีเมื่ออยู่ในระยะ · ยืนบนหญ้า/มอสช่วยกำบัง · เพื่อนร่วมทางสู้ไปพร้อมกัน',
  check:d=>d.won,acts:[{label:'⚔ ปกป้องหมู่บ้าน!',primary:true,hide:d=>!!d.fighting,run:d=>startRaid(d)}],
  reward:async()=>{V().story.element='earth';V().story.plate=true;if(V().character)V().character.points=(V().character.points||0)+1;try{const b=root.Adventure?.bag?.();if(b)b.treasureMap=(b.treasureMap||0)+1}catch{}try{await root.ItemGet?.show([{key:'treasureMap',n:1}],{kicker:'ของที่โจรทิ้งไว้',text:'ได้มาจากถุงผ้าที่พวกโจรทิ้งไว้ในความมืด'})}catch(e){}return root.StarterKit?.unlock?.([{group:'combat',id:'quake',n:3},{group:'combat',id:'counter',n:1}],{kicker:'แก่นธาตุดินตื่นขึ้น',title:'พลังของผืนดิน'})}},
 talkStep({id:'plate',outro:'plate',title:'จานหินโบราณ',talk:'oren',goal:'นำจานหินไปให้ผู้ใหญ่บ้านโอเรนดู',hint:'หัวค่ำผู้ใหญ่บ้านนั่งที่โรงแรม สองทุ่มกลับบ้าน · '+HINT_WALK}),
 talkStep({id:'saf',chapter:'การเดินทางครั้งแรก · รังโจรป่า',outro:'safTalk',title:'ร้านยาของซาฟ',talk:'saf',goal:'แวะหาหมอยาซาฟก่อนออกเดินทาง',hint:'ซาฟอยู่ร้านยา 6 โมงเช้าถึง 6 โมงเย็น · '+HINT_WALK,
  reward:async()=>{try{const b=V().bag||(V().bag={});b.potion=(b.potion||0)+1;await root.ItemGet?.show([{key:'potion',n:1}],{kicker:'รางวัล'})}catch{}}}),
 {id:'sibSword',tag:'real',intro:'sibSwordIntro',outro:'sibSwordDone',title:'ดาบเหล็กของตัวตาม',goal:'ตีดาบเหล็ก 1 เล่มที่โรงตีเหล็ก ให้ตัวตามใช้ในการเดินทาง',hint:'เตา: หลอมให้ร้อน → ทั่ง: ตีขึ้นรูปจนครบ 100 → ถังน้ำ: ชุบแข็ง · ดาบใช้เหล็ก 2 ถ่าน 1 ไม้ 1 ซื้อวัตถุดิบที่ตลาด · ตัวเอกพกมีดสั้นของพ่ออยู่แล้ว',
  place:'forge',begin:d=>{d.next=G().nextId},check:d=>(G().inventory||[]).some(x=>x.id>=d.next&&x.kind==='sword'),acts:[guideBtn],reward:async d=>{giveSibSword(d);await root.Cutscene.play(sceneAt('sigLight'));await root.StarterKit?.unlockSignature?.(1)}},
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
 {id:'sellLoot',tag:'real',intro:()=>V().story.kierHurt?'homeKier':null,reward:async()=>{addCoins(20);try{const b=V().bag||(V().bag={});b.potion=(b.potion||0)+1}catch{}toast('รางวัล: +20 เหรียญ · ยา 1 ขวด');await root.ItemGet?.show([{key:'potion',n:1}],{kicker:'รางวัลขายของ'})},title:'ขายของจากการเดินทาง',goal:'ขายของที่ได้มาที่ตลาด 1 ครั้ง',hint:'ของป่า (เขี้ยวหมาป่า สมุนไพร เหรียญโบราณ) ขายได้ที่ตลาด',place:'market',check:d=>d.sales>0,acts:[guideBtn]},
 {id:'rest',tag:'real',outro:'finale',title:'พักฟื้น',goal:'กลับบ้านแล้วนอนพัก',hint:'ในบ้านเดินไปที่เตียงแล้วเลือก "นอนถึงเช้า"',place:'home',begin:d=>{d.day=G().day},check:d=>G().day>d.day,acts:[guideBtn],
  reward:async()=>{addCoins(30);await root.StarterKit?.unlockSignature?.(2);await root.StarterKit?.unlock?.([{group:'combat',id:'backstab',n:1},{group:'combat',id:'ambush',n:1},{group:'combat',id:'rockfall',n:1},{group:'combat',id:'perch',n:1}],{kicker:'จบบทนำ',title:'ไพ่ของนักผจญภัย',text:'+30 เหรียญ · การ์ดใบอื่นหาได้จากการเดินทาง'});toast('จบบทนำ · เล่นอิสระได้แล้ว','quest')}}];
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
 if(step.spot?.key===ev.key&&step.onSpot){const r=await step.onSpot(d);doSave();try{if(step.check?.(d))setTimeout(()=>tick().catch(()=>{}),30);else dropHold()}catch(e){dropHold()}return r}
 return null}
/* v98.1179 · the bag reports every consumable the player uses (js/bag.js) — eating during step 'bread' finishes it */
function itemUsed(key,msg){const step=cur();if(!step||step.id!=='bread'||!/^ใช้/.test(msg||''))return;const d=dataOf(step);if(!d.ate){d.ate=true;doSave();setTimeout(()=>tick().catch(()=>{}),1700)}}
function talked(id){const step=cur();if(!step)return false;const d=dataOf(step);if(step.talk===id&&!d.talked){d.talked=true;doSave();setTimeout(()=>tick().catch(()=>{}),50);return true}return false}
/* lanterns are made at the forge's anvil like any other station work (village-place.html joins actions with `with` to that station) */
/* v98.1022 · the glowing crystals are a card in the book (bag.glowCrystal); an old save's counter (story.crystals) is moved into the bag once */
function crystalBag(){const v=V(),b=v.bag||(v.bag={});if(v.story&&v.story.crystals>0){b.glowCrystal=(b.glowCrystal||0)+v.story.crystals;v.story.crystals=0}return b}
function lanternAction(){const step=cur();if(step?.id!=='lanterns'||V()?.location!=='forge')return null;const m=mats(),c=crystalBag().glowCrystal||0,d=dataOf(step);
 const reason=(m.wood||0)<1||(m.coal||0)<1?'ต้องมีไม้ 1 และถ่าน 1 · ซื้อที่ตลาด':c<1?'ผลึกเรืองแสงหมด':(d.n||0)>=3?'ครบ 3 ดวงแล้ว':(typeof activityReason==='function'?activityReason(4,20,2):'');
 return {id:'lantern',name:'ทำโคมไฟเทศกาล',image:'action-recipes',kind:'story',value:'lantern',cost:'ϟ 4 · ◷ 20 · ไม้ 1 ถ่าน 1 ผลึก 1',effect:'โคม '+(d.n||0)+'/3 · ผลึกเหลือ '+c,reason,with:['forge','smelt','water']}}
function makeLantern(){const a=lanternAction();if(!a)return;if(a.reason){toast(esc(a.reason));return}const step=cur(),d=dataOf(step),m=mats();
 const why=spend(4,20,2);if(why){toast(esc(why));return}m.wood--;m.coal--;{const cb=crystalBag();cb.glowCrystal=(cb.glowCrystal||1)-1;if(cb.glowCrystal<=0)delete cb.glowCrystal}d.n=(d.n||0)+1;doSave();doRender();toast('🏮 โคมดวงที่ '+d.n+' เสร็จแล้ว','good')}
function hookActions(){if(typeof placeActions!=='function'||placeActions.storyHooked)return;const base=placeActions;
 placeActions=function(){const list=base.apply(this,arguments);try{const a=lanternAction();if(a)list.push(a)}catch{}return list};placeActions.storyHooked=true;
 if(typeof runPlaceAction==='function'){const run=runPlaceAction;runPlaceAction=async function(id){if(id==='lantern'){makeLantern();return}return run.apply(this,arguments)}}}

/* ---------- v98.331 · tutorial fights inside the prologue quests (docs/TODO.md §14) ----------
   questBattle(d, {title, ms, tut, seed, r, biome}) → 'win' | 'out' | 'busy'. A full-screen battle in a frame over the game (battle-field.html), the two heroes are immortal
   (?imm=1 · HP never below 1) and cannot flee (?noflee=1), so the fight always ends in a win once it is played through. */
/* v98.354 · ENCOUNTER CUT (Final Fantasy style): the village zooms + blurs, black bars whip across the screen and close, the fight loads BEHIND them (no half-loaded village / home flash),
   then the bars open on the arena. battleCut() → {open()} ; the iframe sends 'agrenor-battle-ready' when the arena has been built. */
function battleCut(){return root.BattleLauncher.cut()}  /* v98.1146 · moved to js/battle-launcher.js */
function battleReady(fr){return root.BattleLauncher.ready(fr)}
/* v98.996 · the old story victory ceremony moved to js/victory-screen.js (one report for every battle, shown over the battle scene). Kept as a thin adapter for Story.victory. */
function victorySummary(r){return root.VictoryScreen?root.VictoryScreen.show({title:r.title,kills:r.kills,members:(r.party||[]).map(p=>({id:p.key,name:p.name||p.key,pic:p.key,hp:p.hp,max:p.max,gain:p.xp}))}):Promise.resolve()}
/* v98.476 · a story fight must not move the hero: remember where they stood on the village map (or in the open place) when the fight started,
   and put them back there afterwards — retried for a moment, because the map can re-place the hero at a door while it wakes up again */
function heroSpot(){try{const T=root.VillageTown;if(!T)return null;const sc=T.getScene?.(),f=/^place:/.test(sc||'')?T.marketFrame:T.frame,h=f?.contentWindow?.ResumeHook?.get?.();return h?{f,h:{...h},sc}:null}catch(e){return null}}
function heroBack(spot){if(!spot)return;const put=()=>{try{if(root.VillageTown?.getScene?.()===spot.sc)spot.f.contentWindow?.ResumeHook?.set?.(spot.h)}catch(e){}};put();for(const ms of [120,400,900,1600])setTimeout(put,ms)}
/* v98.922 · BATTLE WARM-UP — the first fight of a session stuttered / near-froze (and the farm scene behind it with it): battle-field.html is a separate page whose ~300 files (3.8 MB asset-manifest, scripts, sprites, the field picture) were all downloaded at the moment the fight opened,
   on the same thread that animates the story scene. After a reload (files cached) it ran smooth. So while the player is still talking / walking to the fight, the files are fetched quietly in the background (idle, one at a time, pictures through the service worker cache).
   List: data/warm-battle.json (made by running the fight in a browser and recording its requests: common + per-fight). Code: exactly the <script>/<link> files battle-field.html names. */
const WARMED=new Set(),WARM_FOR={wake:'goat',goats:'goat',goatsBack:'pumpkin',seeds:'pumpkin'};
function warmBattle(kind){
 if(!kind||WARMED.has(kind))return;WARMED.add(kind);
 try{if((navigator.connection||{}).saveData)return;
  const sleep=ms=>new Promise(r=>setTimeout(r,ms)),idle=()=>new Promise(r=>root.requestIdleCallback?root.requestIdleCallback(r,{timeout:2500}):setTimeout(r,800)),q='?v='+(root.GAME_VERSION?.v||'');
  (async()=>{await idle();let L={};try{L=await(await fetch('data/warm-battle.json'+q)).json()}catch(e){}
   try{const h=await(await fetch('battle-field.html'+q)).text();for(const m of h.matchAll(/(?:src|href)="([^"#]+?\.(?:js|css)(?:\?[^"]*)?)"/g)){await fetch(m[1]).catch(()=>{});await sleep(40)}}catch(e){}
   const urls=[...(L.common||[]),...(L[kind]||[])],imgs=urls.filter(u=>/\.(png|webp|jpe?g)$/i.test(u)),rest=urls.filter(u=>!imgs.includes(u)),sw=navigator.serviceWorker?.controller;
   if(sw){for(let i=0;i<imgs.length;i+=20){sw.postMessage({type:'precache',urls:imgs.slice(i,i+20)});await sleep(400)}}else for(const u of imgs){await fetch(u).catch(()=>{});await sleep(30)}
   for(const u of rest){await fetch(u).catch(()=>{});await sleep(30)}})()}catch(e){}}
/* v98.1177 · NO VILLAGE FLASH: when a quest fight is won, a black cover (below the cut-scene layer, above the village) is put up as the battle frame is removed. It stays until the step's outro scene has started (the cut-scene layer, z 9500, fades in over it) —
   or until the step turns out not to be finished (questEvent) — and a 3.5 s failsafe always removes it. */
function holdCover(){if(document.getElementById('storyHold'))return;const h=document.createElement('div');h.id='storyHold';h.style.cssText='position:fixed;inset:0;z-index:940;background:#07080c;opacity:1;transition:opacity .35s;pointer-events:none';document.body.appendChild(h);setTimeout(dropHold,3500)}
function dropHold(){const h=document.getElementById('storyHold');if(!h)return;h.style.opacity='0';setTimeout(()=>h.remove(),400)}
function questBattle(d,o){return new Promise(resolve=>{
 if(d.fighting||onWorld()){resolve('busy');return}
 const g=G(),v=V();if((g.hp||0)<30)g.hp=Math.max(g.hp||0,40);
 d.fighting=true;doSave();const spot=heroSpot();
 const party=(v.party||[]).filter(p=>p.hp>0).map(p=>p.key+':'+p.hp+':'+p.max+':'+(p.order||'charge')+':'+(p.level||1)).join(',');
 const fr=document.createElement('iframe');fr.id='storyBattle';fr.title=o.title;fr.style.cssText='position:fixed;inset:0;z-index:950;width:100%;height:100%;border:0;background:#07080c';
 fr.src=root.BattleLauncher.url('quest',{page:o.page,r:o.r||6,biome:o.biome||'grass',seed:o.seed||4100,poi:o.poi,scene:o.scene,bgm:o.keepBgm?'parent':'',bg:o.bg,ms:o.ms,party:party,hhp:g.hp||60,hmax:g.maxHp||60,title:o.title||'',tut:o.tut||'',raw:root.Progression?Progression.battleParam(g,Progression.recipes):''});   /* v98.1181 · the address comes from the battle profile table (js/battle-launcher.js) */
 if(d.resumeSrc){fr.src=d.resumeSrc;d.resumeSrc=null}else{try{localStorage.removeItem('projectA.battleSnap')}catch{}}   /* v98.340 · resumed from the temporary save: same field, same moment */
 const done=e=>{if(e.source!==fr.contentWindow||e.data?.type!=='agrenor-battle')return;removeEventListener('message',done);const r=e.data;
  g.hp=Math.max(1,Math.min(g.maxHp||60,r.hp??g.hp));for(const x of r.party||[]){const p=(v.party||[]).find(q=>q.key===x.key);if(p){p.hp=Math.max(1,x.hp);if(x.order)p.order=x.order}}
  const win=r.outcome==='win';let xpGot=0;const VS=root.VictoryScreen,before=win&&VS?VS.snap(g):null;
  if(win){v.battles=(v.battles||0)+1;v.kills=(v.kills||0)+(r.kills||0);if(root.Progression){const xp=Progression.battleXp({dang:.25,kills:r.kills});xpGot=xp;gainCharacterXP(xp);for(const p of v.party||[])Progression.gainAlly(p,Math.round(xp*.8))}}
  const cleanup=()=>{if(win)holdCover();fr.remove();doRender();heroBack(spot);VS?.fightUI?.(false)};
  /* v98.996 · the Victory report opens OVER the battle scene (the frame is removed only after its Continue button). v98.597 · the "fighting" lock stays ON while it is up — otherwise another goat standing next to the hero started a second fight behind it */
  if(win&&VS)VS.show({title:o.title,goal:r.goal,kills:r.kills||0,turns:r.turns,members:VS.members(g,before,xpGot,{fought:(r.party||[]).map(x=>x.key)}),stat:r.stat}).then(()=>{cleanup();d.fighting=false;doSave();resolve('win')});else if(win){cleanup();d.fighting=false;doSave();resolve('win')}else if(r.outcome==='lose'&&VS)VS.show({defeat:true,title:o.title,goal:r.goal,kills:r.kills||0,turns:r.turns,members:VS.members(g,null,0,{fought:(r.party||[]).map(x=>x.key)}),stat:r.stat}).then(()=>{cleanup();d.fighting=false;doSave();resolve('out')});else{cleanup();d.fighting=false;doSave();resolve('out')}};
 {const cut=battleCut();battleReady(fr).then(()=>cut.open())}addEventListener('message',done);root.VictoryScreen?.fightUI?.(true);document.body.appendChild(fr)})}

/* ---------- raid battle (v94: the flat card battle drawn on the village square, in a frame over the game) ---------- */
function startRaid(d){if(d.fighting)return;if(onWorld()){toast('กลับหมู่บ้านก่อน');return}
 const g=G(),v=V();if((g.hp||0)<30)g.hp=Math.max(g.hp||0,40);   // the festival raid never starts the player half-dead
 d.fighting=true;d.outcome=null;doSave();const spot=heroSpot();
 const party=(v.party||[]).filter(p=>p.hp>0).map(p=>p.key+':'+p.hp+':'+p.max+':'+(p.order||'charge')+':'+(p.level||1)).join(',');
 const fr=document.createElement('iframe');fr.id='storyBattle';fr.title='โจรป่าบุกงาน';fr.style.cssText='position:fixed;inset:0;z-index:950;width:100%;height:100%;border:0;background:#07080c';
 fr.src=root.BattleLauncher.url('raid',{ms:'bandit*1.2,wolf*1.1,bandit*1.2,wolf*1.1',party:party,hhp:g.hp||60,hmax:g.maxHp||60,title:'คืนเทศกาล ·',tut:d.tutDone?'':'raid',raw:root.Progression?Progression.battleParam(g,Progression.recipes):''});d.tutDone=true;
 if(d.resumeSrc){fr.src=d.resumeSrc;d.resumeSrc=null}else{try{localStorage.removeItem('projectA.battleSnap')}catch{}}   /* v98.340 · resumed from the temporary save: same field, same moment */
 const done=e=>{if(e.source!==fr.contentWindow||e.data?.type!=='agrenor-battle')return;removeEventListener('message',done);const r=e.data;
  g.hp=Math.max(1,Math.min(g.maxHp||60,r.hp??g.hp));for(const x of r.party||[]){const p=(v.party||[]).find(q=>q.key===x.key);if(p){p.hp=Math.max(1,x.hp);if(x.order)p.order=x.order}}
  const VS=root.VictoryScreen,before=r.outcome==='win'&&VS?VS.snap(g):null;let xpGot=0;
  if(r.outcome==='win'){v.battles=(v.battles||0)+1;v.kills=(v.kills||0)+(r.kills||0);d.won=true;if(root.Progression){const xp=Progression.battleXp({dang:.4,kills:r.kills});xpGot=xp;gainCharacterXP(xp);for(const p of v.party||[])Progression.gainAlly(p,Math.round(xp*.8))}}else toast(r.outcome==='lose'?'พ่ายแพ้... ตั้งหลักแล้วลองใหม่':'ถอยออกมา · โจรยังอยู่ในงาน','');
  const cleanup=()=>{d.fighting=false;doSave();fr.remove();doRender();heroBack(spot);VS?.fightUI?.(false)};
  if(r.outcome==='win'&&VS)VS.show({title:'คืนเทศกาล · โจรป่าบุก',goal:r.goal,kills:r.kills||0,turns:r.turns,members:VS.members(g,before,xpGot,{fought:(r.party||[]).map(x=>x.key)}),stat:r.stat}).then(cleanup);else if(r.outcome==='lose'&&VS)VS.show({defeat:true,title:'คืนเทศกาล · โจรป่าบุก',goal:r.goal,kills:r.kills||0,turns:r.turns,members:VS.members(g,null,0,{fought:(r.party||[]).map(x=>x.key)}),stat:r.stat}).then(cleanup);else cleanup()};
 {const cut=battleCut();battleReady(fr).then(()=>cut.open())}addEventListener('message',done);root.VictoryScreen?.fightUI?.(true);document.body.appendChild(fr)}

/* ---------- sales detector (coins up while an item or goods left the bag at the market) ---------- */
let prev=null;
function snapshot(){return {shop:V()?.shop?.sold||0,coins:V()?.coins||0,inv:(G()?.inventory||[]).length,goods:goodsCount(),loc:V()?.location,adv:!!adv()}}
function detectSale(){const now=snapshot(),p=prev;prev=now;if(!p)return false;if(now.shop>p.shop)return true;if(now.adv||p.adv)return false;return now.loc==='market'&&now.coins>p.coins&&(now.inv<p.inv||now.goods<p.goods)}

/* ---------- state ---------- */
/* v95.01: steps were added (talk to the villager first), so a save from before keeps its place by step id */
const OLD_IDS=['wake','goats','pumpkin','stall','sleep1','cave','caveBack','lanterns','craft','hire','sleep2','sell','contest','raid','plate','prep','expedition','return','sellLoot','rest'];
const OLD_TO={pumpkin:'seeds',stall:'tom',cave:'guard',lanterns:'gus',prep:'saf'};
const V2_IDS=['wake','goats','goatsBack','seeds','pumpkin','tom','planks','stall','sleep1','guard','cave','caveBack','gus','lanterns','craft','hire','sleep2','sell','contest','raid','plate','saf','prep','expedition','return','sellLoot','rest'];
/* v98.605 · v3 → v4: three steps (homeWelcome · chestLesson · deckLesson) were inserted before sleep1 — a saved position is mapped by step id */
const V3_IDS=['wake','goats','goatsBack','seeds','pumpkin','tom','planks','stall','sleep1','guard','cave','caveBack','gus','lanterns','craft','hire','sleep2','sell','contest','raid','plate','saf','sibSword','potions','prep','expedition','return','hospital','sellLoot','rest'];
/* v98.1176 · v4 → v5: the Tom steps (tom · planks · stall) moved from before the evening at home to DAY 2 (after sleep1). A save before them restarts at homeWelcome and does Tom on day 2; a save that was past them keeps them done (story.tomDone) so they are skipped. */
const V4_IDS=['wake','goats','goatsBack','seeds','pumpkin','tom','planks','stall','homeWelcome','chestLesson','deckLesson','sleep1','guard','cave','caveBack','gus','lanterns','craft','hire','sleep2','sell','contest','raid','plate','saf','sibSword','potions','prep','expedition','return','hospital','sellLoot','rest'];
/* v98.1179 · v5 → v6: the step 'bread' (eat the bread · lesson) was inserted after goatsBack. Every branch below maps a saved position BY STEP ID into the current STEPS and ends at STORY_V. */
const STORY_V=6;
const V5_IDS=['wake','goats','goatsBack','seeds','pumpkin','homeWelcome','chestLesson','deckLesson','sleep1','tom','planks','stall','guard','cave','caveBack','gus','lanterns','craft','hire','sleep2','sell','contest','raid','plate','saf','sibSword','potions','prep','expedition','return','hospital','sellLoot','rest'];
function migrate(st){if(st&&st.v===5){const old=V5_IDS[st.i];if(old){const i=byId(old);if(i>=0)st.i=i}else if(st.i>=V5_IDS.length)st.i=STEPS.length;st.v=STORY_V;doSave();return st}
 if(st&&st.v===4){const old=V4_IDS[st.i];if(old){const oi=V4_IDS.indexOf(old);if(['tom','planks','stall'].includes(old)){const i=byId('homeWelcome');if(i>=0)st.i=i}else{if(oi>V4_IDS.indexOf('stall'))(V().story||st).tomDone=true;const i=byId(old);if(i>=0)st.i=i}}else if(st.i>=V4_IDS.length)st.i=STEPS.length;st.v=STORY_V;doSave();return st}
 if(st&&st.v===3){const old=V3_IDS[st.i];if(old){const i=byId(old);if(i>=0)st.i=i}else if(st.i>=V3_IDS.length)st.i=STEPS.length;st.v=STORY_V;doSave();return st}
 if(st&&st.v===2){const old=V2_IDS[st.i];if(old){const i=byId(old==='prep'?'sibSword':old);if(i>=0)st.i=i}else if(st.i>=V2_IDS.length)st.i=STEPS.length;st.v=STORY_V;doSave();return st}
 if(!st||st.v>=2)return st;const old=OLD_IDS[st.i];if(old){const id=OLD_TO[old]||old,i=byId(id);if(i>=0){st.i=i;if(OLD_TO[old])delete st.data[old]}}else if(st.i>=OLD_IDS.length)st.i=STEPS.length;st.v=STORY_V;doSave();return st}
function story(){const v=V();if(!v)return null;return migrate(v.story||null)}
function freshSave(){const g=G(),v=V();if(v.starterKit===1&&g.day<=1&&!g.wins&&!v.adventure)return true;return g.day<=1&&!g.wins&&!(g.inventory||[]).length&&!(v.companions||[]).length&&!(v.party||[]).filter(m=>m.key!=='sib').length&&!v.adventure}
function init(){const v=V();if(!v||v.story)return;v.story={v:STORY_V,mode:freshSave()?'active':'offer',i:0,data:{},water:{},crystals:0};doSave()}
function cur(){const st=story();return st&&st.mode==='active'?STEPS[st.i]:null}
function dataOf(step){const st=story();st.data[step.id]||={};return st.data[step.id]}

/* ---------- tracker ---------- */
let box=null;
/* v98.997 · the quest window is drawn with the game's own pictures — no emoji. Icon buttons: assets/icons/menu/<icon>.webp (the owner's 'guide' = footsteps + flag and 'replay' = book + arrow;
   until those files are in the repo the existing 'alt' icon is shown instead). Text buttons use assets/ui/battle-btn*.webp. */
const stkFold=f=>`<button class="stk-fold" type="button" aria-label="${f?'ขยาย':'พับ'}"><i></i></button>`,STK_X='<button class="stk-x" type="button" title="ปิดหน้าต่าง · เปิดกลับได้ที่ไอคอน วันนี้ → ภารกิจ" aria-label="ปิด"></button>';
const stkIcon=(a,attr)=>`<button type="button" ${attr} class="ib${a.primary?' primary':''}"${a.tip?` title="${esc(a.tip)}" aria-label="${esc(a.tip)}"`:''}><img alt="" draggable="false" src="assets/icons/menu/${a.icon}.webp" onerror="this.onerror=null;this.src='assets/icons/menu/${a.alt||'quest'}.webp'"><span>${esc(a.label)}</span></button>`;
const stkTxt=(a,attr)=>`<button type="button" ${attr} class="txt${a.primary?' primary':''}"${a.tip?` title="${esc(a.tip)}" aria-label="${esc(a.tip)}"`:''}>${esc(a.label)}</button>`;
function tracker(){if(box)return box;box=document.createElement('aside');box.id='storyTracker';box.hidden=true;box.setAttribute('aria-live','polite');document.body.appendChild(box);
 box.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(e.target.closest('.stk-x')){e.stopPropagation();const st=story();if(st){st.closed=true;st.unseen=0;doSave();draw(true);badgeSync()}return}
  if(b){e.stopPropagation();act(b.dataset.act);return}if(e.target.closest('.stk-head')){const st=story();if(st){st.fold=!st.fold;doSave();draw(true)}}});return box}
let lastHtml='';
function draw(force){const el=tracker(),st=story();if(!st||st.mode==='off'||root.TitleScreen?.active||document.querySelector('dialog[open],.ck-reveal,.mg')){el.hidden=true;return}
 if(st.closed&&st.mode!=='offer'){el.hidden=true;badgeSync();return}   /* v98.337 · closed: only the badge on the 'วันนี้' icon remains */
 let html='';el.classList.toggle('stk-done',st.mode==='done');el.classList.toggle('stk-folded',!!st.fold);
 if(st.mode==='offer')html=`<div class="stk-head"><small>บทนำใหม่</small><b>เทศกาลเฟิร์นเวล</b>${stkFold(st.fold)}</div><div class="stk-body"><p class="stk-goal">เล่นบทนำ 3 วันของงานเทศกาล และการเดินทางครั้งแรก</p><p class="stk-hint">เหมาะกับเซฟใหม่ · เซฟเดิมเล่นได้ บางขั้นจะผ่านเองถ้าทำไว้แล้ว</p><div class="stk-acts"><button data-act="start" class="txt primary go" type="button">เล่นบทนำ</button><button data-act="off" class="txt" type="button">ซ่อน</button></div></div>`;
 else if(st.mode==='done')html=`<div class="stk-head"><small>เล่นอิสระ</small><b>เบาะแสที่ได้</b>${stkFold(st.fold)}${STK_X}</div><div class="stk-body"><p class="stk-hint">• จานหินโบราณที่มีเส้นแสง<br>• จดหมายของ "G." ถึงเมืองใหญ่<br>• ผลึกม่วงจากเหมืองเก่าที่อุ่นเมื่อแตะ<br>• แผนที่สมบัติเก่าในสมุดผนึก</p><p class="stk-hint">เส้นทางไปเมืองใหญ่ยังไม่เปิด (อยู่ในแผน)</p><div class="stk-acts"><button data-act="off" class="txt" type="button">ซ่อนกล่องนี้</button></div></div>`;
 else{const step=STEPS[st.i];if(!step){el.hidden=true;return}const d=dataOf(step),chap=chapterOf(st.i),acts=(step.acts||[]).filter(a=>!a.hide?.(d));
  const p=step.progress?.(d);const night=late()&&!/^sleep|^rest/.test(step.id)?'<p class="stk-hint stk-night">ดึกแล้ว กลับบ้านนอนแล้วทำต่อพรุ่งนี้ได้</p>':'';
  html=`<div class="stk-head"><small>${esc(chap)}</small><b>${esc(step.title)}${step.tag==='temp'&&root.PROJECT_DEV?'<span class="stk-tag" title="ระบบชั่วคราว ระบบจริงอยู่ในแผน (แสดงเฉพาะเครื่องผู้สร้าง)">ชั่วคราว</span>':''}</b>${stkFold(st.fold)}${STK_X}</div>
  <div class="stk-body"><p class="stk-goal">${esc(step.goal)}</p>${p!=null?`<div class="stk-prog"><i style="width:${Math.round(p*100)}%"></i></div>`:''}${step.hint?`<p class="stk-hint">${esc(step.hint).replace(/◆/g,'<img class="stk-gem" src="assets/ui/quest-marker.webp" alt="◆" draggable="false">')}</p>`:''}${night}
  <div class="stk-acts">${acts.map((a,j)=>{const at=`data-act="${(step.acts||[]).indexOf(a)}"`;return a.icon?stkIcon(a,at):stkTxt(a,at)}).join('')}${stkIcon({icon:'replay',alt:'spellbook',label:'ดูฉากซ้ำ',tip:'ดูฉากล่าสุดอีกครั้ง'},'data-act="replay"')}${(()=>{try{return localStorage.getItem('projectA.dev')==='1'}catch(e){return false}})()?'<button type="button" class="txt" data-act="skipall" title="ข้ามบทนำทั้งหมด">ข้ามบทนำ</button>':''}</div></div>`}
 if(html!==lastHtml||force){el.innerHTML=html;lastHtml=html}el.hidden=false}
function chapterOf(i){for(let j=i;j>=0;j--)if(STEPS[j].chapter)return STEPS[j].chapter;return ''}
async function act(a){const st=story();if(!st)return;
 if(a==='start'){st.mode='active';st.i=0;st.data={};doSave();draw(true);return}
 if(a==='off'){if(st.mode==='active')return;st.mode='off';doSave();draw(true);return}   /* v97.16: an active prologue cannot be switched off */
 if(a==='skipall'){const ok=root.GameDialog?await root.GameDialog.confirm('ข้ามบทนำทั้งหมด?\nจะไม่ได้รางวัลและฉากที่เหลือ (เปิดเล่นใหม่ได้จาก Story.reset() ในโหมดนักพัฒนา)'):confirm('ข้ามบทนำทั้งหมด?');if(!ok)return;st.mode='done';doSave();draw(true);return}
 if(a==='replay'){const sc=lastScene();if(sc)root.Cutscene.play(sceneAt(sc));return}
 const step=cur();const x=step?.acts?.[+a];if(x)await x.run(dataOf(step));draw(true)}
function lastScene(){const st=story();for(let j=st.i;j>=0;j--){const s1=STEPS[j],o=typeof s1.outro==='function'?s1.outro():s1.outro,n=typeof s1.intro==='function'?s1.intro():s1.intro;if(j<st.i&&o)return o;if(n&&(j<st.i||st.data[s1.id]?.introSeen))return n}return null}

/* ---------- loop ---------- */
let busy=false;
async function tick(){if(busy||root.QuestAnnouncement?.busy()||!G()||!V())return;if(root.TitleScreen?.active){draw();return}init();const st=story();
 const sale=detectSale();if(!st||st.mode!=='active'){draw();return}
 const step=STEPS[st.i];if(!step){st.mode='done';doSave();draw(true);return}const d=dataOf(step);
 if(step.skip?.(d)){st.i++;doSave();try{root.RunSlots?.tm?.mark()}catch(e){}draw(true);return}
 if(sale){d.sales=(d.sales||0)+1}
 if(step.id==='raid'&&d.fighting&&!document.getElementById('storyBattle')){d.fighting=false;doSave()}
 step.tick?.(d);
 warmBattle(WARM_FOR[step.id]);
 if(root.Cutscene?.isPlaying()||tacticsOpen()||document.getElementById('storyBattle')){draw();return}
 tomHook().catch(()=>{});goatsHook().catch(()=>{});   /* v98.1074 · the pause scene right after leaving the market */
 homeHooks().catch(()=>{});   /* v98.600 · first time out of the house → the sister sends the hero to open the card-book */
 busy=true;try{
  if(!d.begun){d.begun=true;d.briefingPending=true;step.begin?.(d);doSave()}
  const introId=typeof step.intro==='function'?step.intro():step.intro;
  if(introId&&!d.introSeen){d.introSeen=true;if(introId==='opening'){V().story.bookSeen=true;V().story.bookIntro=true}doSave();draw();await root.Cutscene.play(sceneAt(introId));if(introId==='opening')await bookTour()}
  /* v98.1177 · the step was already finished before its briefing could open (e.g. the fight started the moment the hero arrived): do NOT pop the briefing after the fight — go straight to the outro. The lesson is still filed in the journal. */
  if((d.briefingPending||LESSON[step.id]&&!d.lessonSeen)&&step.check(d)){d.briefingPending=false;if(LESSON[step.id]&&!d.lessonSeen){d.lessonSeen=true;rememberLesson(step.id)}doSave()}
  if(d.briefingPending||LESSON[step.id]&&!d.lessonSeen){if(['cave','expedition'].includes(step.id))V().story.tut=step.id;doSave();if(step.id==='wake'&&root.GuidedTour&&!V().story.walkTour)await walkTour();await questBriefing(step,d)}
  if(step.check(d)){d.done=true;const outroId=typeof step.outro==='function'?step.outro(d):step.outro;if(outroId){const pl=root.Cutscene.play(sceneAt(outroId));setTimeout(dropHold,900);await pl}else dropHold();await step.reward?.(d);st.i++;doSave();doRender();try{root.RunSlots?.tm?.mark()}catch(e){}   /* v98.1080 · time machine checkpoint at every new step */
   const nx=STEPS[st.i];try{root.Sfx?.play('quest-done')}catch(e){}if(nx){if(st.closed)st.unseen=(st.unseen||0)+1;/* The next step presents its ribbon and lesson together after its intro. */tracker().classList.remove('stk-pop');void tracker().offsetWidth;tracker().classList.add('stk-pop')}else{st.mode='done';doSave()}}
 }finally{busy=false}draw()}

/* v98.1019 · a save that is ALREADY past the Light / Heavy unlock point (before this version) gets the signature cards once, with a note in the reveal */
function sigCatchUp(){try{const st=story(),v=V();if(!st||!v||st.mode==='offer')return;const lvl=(st.mode==='done'||st.i>byId('rest'))?2:(st.i>byId('sibSword'))?1:0;
 if(lvl&&(v.sigLevel||0)<lvl)(async()=>{for(let l=(v.sigLevel||0)+1;l<=lvl;l++)await root.StarterKit?.unlockSignature?.(l,{catchUp:true})})()}catch(e){}}
function boot(){setTimeout(sigCatchUp,4000);Object.assign(root.Cutscene.speakers,D().SPEAKERS);hookActions();
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
/* v98.584 · the first visit to the guild counter: the clerk explains where the card book's spell comes from (and why the kingdom likes cards) — played once, from the interior page */
async function guildFirst(){const v=V();if(!v||!root.Cutscene)return false;v.story=v.story||{};if(v.story.guildSeen)return false;v.story.guildSeen=true;doSave();await root.Cutscene.play(D().SCENES.guildFirst);return true}
/* v98.586 · DAY 1 PACING: pumpkins used to end at dusk, leaving the planks / stall quests in the dark. Until the "จบวันแรก" step is done the clock runs slower through the day and
   stops near 18:30 (golden hour), so every day-1 task (goats → Hilda → pumpkins → Tom → planks → stall) fits before the evening; the player sleeps when ready. Started at 08:00 (WorldState). */
const DAY1=new Set(['goats','goatsBack','seeds','pumpkin','homeWelcome','chestLesson','deckLesson','sleep1']);
function timeScale(){if(root.QuestAnnouncement?.busy())return 0;try{const st=story();if(!st||st.mode!=='active')return 1;const step=STEPS[st.i];if(!step||!DAY1.has(step.id))return 1;const g=G();if(!g||g.day>1)return 1;const m=g.minutes||480;return m<720?.4:m<900?.3:m<1020?.2:m<1110?.1:0}catch(e){return 1}}
/* v98.589 · the card-book lesson plays once, the first time the player opens the book during the prologue (old saves past the prologue never see it) */
/* v98.607 · the world map asks where the current step sends the player (beacon + edge arrow, js/world-map.js guideOf) */
function worldGuide(){const st=story();if(!st||st.mode!=='active')return null;const step=STEPS[st.i];if(!step)return null;if(step.id==='cave')return {id:'mine',label:'เหมืองเก่า (ทางเหนือ)'};if(step.id==='caveBack')return {id:'home',label:'หมู่บ้านเฟิร์นเวล'};return null}
/* v98.605 · helpers for the home-evening steps */
function chestCount(){try{const c=V().chest||{};return Object.values(c.materials||{}).reduce((a,b)=>a+(+b||0),0)+(c.items||[]).length}catch(e){return 0}}
function deckHas(id){try{return ((V().tacticDecks||{}).combat||{})[id]>0}catch(e){return false}}
const HOME_LOCKED=['chestLesson','deckLesson','sleep1'];
/* the player may not step outside from dinner until they go to bed (day 1 evening) */
function homeLock(){const st=story();if(!st||st.mode!=='active')return '';const step=STEPS[st.i];if(!step||!HOME_LOCKED.includes(step.id))return '';return 'คืนนี้อยู่บ้านก่อน — แม่รออยู่ และพรุ่งนี้ยังมีงานอีกเยอะ · ทำอะไรในบ้านก็ได้ แล้วค่อยเข้านอน'}
let homeBusy=false;
async function homeHooks(){const st=story();if(homeBusy||!st||st.mode!=='active'||!root.Cutscene)return;const step=STEPS[st.i];if(!step||step.id!=='homeWelcome')return;const d=dataOf(step);if(d.welcomed||scene()!=='home')return;
 homeBusy=true;try{await root.Cutscene.play(D().SCENES.homeWelcome);d.welcomed=true;
  try{if(typeof heal==='function'){const r=heal(15,30);toast('🍲 ซุปอุ่น ๆ ของแม่ · HP +'+r[0]+' · แรง +'+r[1])}}catch(e){}
  doSave();doRender()}finally{homeBusy=false}}
/* v98.1074 · step goats: the first time the hero is on the village map (out of the market, not inside a place) a short talk with the sibling plays — "where did the goats go?" — before anything can run / fight.
   It waits until no scene / fight / panel is up and the hero is on the plain village map; auto-walk is cancelled when it starts. */
let goatBusy=false;
/* v98.1176 · step tom (DAY 2): the first time the hero is out on the village map, the sibling reminds them what Mom said at dinner — go and ask Uncle Tom about the stall (same rules as goatsHook) */
let tomBusy=false;
async function tomHook(){const st=story();if(tomBusy||!st||st.mode!=='active'||!root.Cutscene)return;const step=STEPS[st.i];if(!step||step.id!=='tom')return;const d=dataOf(step);if(d.hintSeen||scene()!=='town')return;
 if(root.Cutscene.isPlaying()||document.getElementById('storyBattle')||tacticsOpen())return;
 const halt=()=>{try{const w=root.VillageTown?.frame?.contentWindow;w?.TownUX?.stop?.();w?.TownQuest?.cancel?.();w?.TownNPC?.cancel?.()}catch(e){}};
 tomBusy=true;try{d.hintSeen=true;doSave();halt();await root.Cutscene.play(D().SCENES.tomHint);halt()}finally{tomBusy=false}}
async function goatsHook(){const st=story();if(goatBusy||!st||st.mode!=='active'||!root.Cutscene)return;const step=STEPS[st.i];if(!step||step.id!=='goats')return;const d=dataOf(step);if(d.lookSeen||scene()!=='town')return;
 if(root.Cutscene.isPlaying()||document.getElementById('storyBattle')||tacticsOpen())return;
 const halt=()=>{try{const w=root.VillageTown?.frame?.contentWindow;w?.TownUX?.stop?.();w?.TownQuest?.cancel?.();w?.TownNPC?.cancel?.()}catch(e){}};   /* v98.1139 · nothing may keep walking / chasing: after the talk the hero STOPS and the player decides (walk by hand or press auto-walk) */
 goatBusy=true;try{d.lookSeen=true;doSave();halt();await root.Cutscene.play(D().SCENES.goatsLook);halt()}finally{goatBusy=false}}
/* v98.600 · the first time the hero is OUTSIDE the house (village map, not inside a place) the sister stops them (scene bookExit) and the card-book is opened FOR them — its lesson (bookFirst) then plays at once.
   Only before the book has been seen and before the guild step; never while another scene / fight / panel is up. */
let bookBusy=false;
async function bookIntro(){const v=V(),st=story();if(bookBusy||!v||!st||st.mode!=='active'||!root.Cutscene)return false;v.story=v.story||{};if(v.story.bookSeen||v.story.bookIntro)return false;if(st.i>=byId('hire'))return false;
 if(scene()!=='town')return false;   /* VillageTown.getScene(): 'town' = the village map · 'home'/'forge'… = inside a building · 'place:…' = an open sub-map */
 if(document.getElementById('storyBattle')||onWorld())return false;
 bookBusy=true;try{v.story.bookIntro=true;doSave();await root.Cutscene.play(D().SCENES.bookExit);try{if(typeof openPanel==='function')openPanel('bag')}catch(e){}}finally{bookBusy=false}return true}
/* v98.617 · THE CARD-BOOK TOUR: after the opening scene the siblings teach the สมุดผนึก on the live village map — the player does each step by hand (open the book · look at the gear tab · tap a card · close it · the other tabs · close the book) */
const BOOK_TOUR=[   /* v98.659 · the lesson is a talk between the two siblings (the S / B roles), not one voice reading buttons */
 {who:'S',text:'ดูมุมขวาบนนั่น มีไอคอน สมุดผนึก อยู่ — {S2B} ลองกดเปิดดู',target:'.hud-ico[data-hud="bag"]'},
 {who:'B',text:'ของที่สมาคมให้ใช่ไหม ข้าไม่เคยเปิดดูจริง ๆ จัง ๆ เลย'},
 {face:'happy',who:'S',text:'ได้มาตั้งแต่วันลงทะเบียน แล้ว {S2B} ก็เอาไปรองหัวนอนอย่างเดียว'},
 {face:'think',who:'B',text:'มันนุ่มกว่าหมอนนิดหนึ่งนะ'},
 {who:'S',text:'ของที่เราพกจะกลายเป็นการ์ดเก็บอยู่ในนี้แหละ ลองกดแท็บ อุปกรณ์ ก่อนสิ',target:'.cb-tabs button[data-t="gear"]'},
 {face:'happy',who:'B',text:'มีดของพ่อ… อยู่ในนี้แล้วจริงด้วย'},
 {face:'think',who:'S',text:'ตอนเด็กแม่ไม่เคยให้เราแตะมีดเล่มนั้นเลย จำได้ไหม'},
 {face:'happy',who:'B',text:'จำได้ … ข้าแอบแตะครั้งเดียว โดนล้างจานสามวัน'},
 {who:'S',text:'แตะการ์ดใบนั้นดูสิ จะเห็นรายละเอียด',target:'.cb-page[data-p="gear"] .card-thumb'},
 {face:'happy',who:'B',text:'ละเอียดกว่าที่คิดแฮะ เหมือนของจริงเลย'},
 {who:'S',text:'ปิดการ์ดนี้ก่อน แล้วไปดูแท็บอื่นกัน',target:'#collectionFocus button, #collectionFocus .focus-close'},
 {who:'S',text:'เหล็ก ถ่าน ไม้ ที่เก็บมาผลิตของ จะอยู่แท็บ วัตถุดิบ',target:'.cb-tabs button[data-t="mat"]',prep:()=>{if(!document.getElementById('panel').open)openPanel('bag')}},
 {who:'B',text:'การ์ดสี่ใบนี้คือวัตถุดิบสินะ ตัวเลข ×6 ตรงมุมคือจำนวนที่เรามีใช่ไหม',target:'.cb-page[data-p="mat"] .collection-grid',wait:'next'},
 {who:'S',text:'ใช่ เอาไว้ผลิตของที่โรงตีเหล็ก — เหล็กกับถ่านเอาไว้ตีดาบ ไม้ก็ใช้ทำโคมกับซ่อมแผง',target:'.cb-page[data-p="mat"] .collection-grid',wait:'next'},
 {who:'B',text:'แล้วเสบียงล่ะ เอาไปทำอะไร',target:'.cb-page[data-p="mat"] .collection-grid',wait:'next'},
 {who:'S',text:'เสบียงเอาไว้กินตอนพักฟื้นแรง ไม่ได้เอาไปผลิตของ',target:'.cb-page[data-p="mat"] .collection-grid',wait:'next'},
 {who:'B',text:'งั้นยากับอาหารที่ทำเสร็จแล้วล่ะ อยู่ตรงไหน'},
 {who:'S',text:'แท็บ ของใช้ — ยาฟื้นฟูกับน้ำดื่มที่แม่เตรียมให้อยู่ตรงนี้ กดใช้ได้เลย',target:'.cb-tabs button[data-t="use"]'},
 {who:'B',text:'เข้าใจแล้ว ใส่ไว้ในสมุดก็ไม่ต้องหอบเป็นกอง'},
 {face:'happy',who:'S',text:'ต่อไปถ้าของหาย ก็ไม่ใช่เพราะหอบไม่ไหวแล้วนะ {S2B}'},
 {face:'think',who:'B',text:'…ทำไมทุกเรื่องวกมาที่ข้าทำของหายตลอดเลย'},
 {face:'happy',who:'S',text:'งั้นกดกากบาทมุมขวาบนปิดสมุด แล้วไปหาผู้ใหญ่บ้านโอเรนกัน!',target:'#panel .cb-close'}];
let tourBusy=false;
/* v98.1094 · WALKING LESSON woven into the first quest (go to the village head): the sibling teaches ONE thing at a time and waits until the player really does it
   (click the ground → keyboard (mouse/keyboard devices only) → "stuck? the 📍 auto-walk button"). The player keeps playing (free steps: nothing is blocked). Esc skips.
   When it is done a small 💡 tips card lists the extras once (Shift-walk · E/Space · camera · Esc menu). Old saves that already saw the lesson card are not taught again. */
const walkFrame=()=>{try{const V=root.VillageTown,f=/^place:/.test(scene())?V.marketFrame:V.frame;return f?.contentWindow||null}catch(e){return null}};
const heroXY=()=>{try{return walkFrame()?.ResumeHook?.get?.()||null}catch(e){return null}};
let walkTipEl=null;
function walkTips(){const v=V();if(!v||(v.story||{}).walkTipSeen)return;v.story.walkTipSeen=true;doSave();
 const fine=!!(root.matchMedia&&matchMedia('(pointer:fine)').matches);
 const rows=[fine&&['⇧','กด Shift ค้างไว้ → เคอร์เซอร์เป็นรอยเท้า คลิกพื้นตรงไหนก็เดินไปตรงนั้นอย่างเดียว (ไม่คุย ไม่เข้าสถานที่ ไม่หยิบของ)'],['E','กด E หรือ Space = ทำสิ่งตรงหน้า (คุย เข้าอาคาร เก็บของ) · กดค้างครึ่งวินาทีเปิดวงกลมตัวเลือก'],['🖱','ลากพื้นเพื่อเลื่อนกล้อง · หมุนล้อเมาส์เพื่อซูม'],['Esc','กด Esc เปิดเมนู (สมุดผนึก สำรับ ตัวละคร บันทึกเกม)']].filter(Boolean);
 if(!document.getElementById('walkTipCss')){const c=document.createElement('style');c.id='walkTipCss';c.textContent=`#walkTip{position:fixed;right:14px;bottom:14px;z-index:1500;width:min(380px,calc(100vw - 28px));padding:12px 14px 12px;border-radius:12px;background:#14231ff4;border:1px solid #b9c48a88;box-shadow:0 10px 28px #000b;color:#f5e6c4;font:13px/1.5 VillageThai,AgThai,system-ui,sans-serif}
#walkTip h4{margin:0 0 6px;font-size:14px;color:#f6d79b;display:flex;align-items:center}#walkTip h4 span{flex:1}#walkTip button{flex:none;width:30px;height:30px;border:0;border-radius:0;background:url(assets/ui/close-x.webp) center/contain no-repeat;color:transparent;font-size:0;cursor:pointer;padding:0;filter:drop-shadow(0 1px 2px #000a);transition:transform .12s}#walkTip button:hover{transform:scale(1.15)}   /* v98.1102 · the painted ✕ of the sealed book */
#walkTip p{margin:5px 0;display:flex;gap:8px;align-items:flex-start}#walkTip kbd{flex:none;min-width:34px;text-align:center;padding:1px 5px;border-radius:6px;background:#0005;border:1px solid #fff3;font:700 12px inherit;color:#ffe2a8}`;document.head.append(c)}
 walkTipEl?.remove();const d=walkTipEl=document.createElement('div');d.id='walkTip';d.innerHTML=`<h4><span>💡 เคล็ดลับการเดิน</span><button type="button" aria-label="ปิด" title="ปิด">✕</button></h4>${rows.map(r=>`<p><kbd>${esc(r[0])}</kbd><span>${esc(r[1])}</span></p>`).join('')}`;
 d.querySelector('button').onclick=()=>{d.remove();walkTipEl=null};document.body.append(d);setTimeout(()=>{if(walkTipEl===d){d.remove();walkTipEl=null}},45000)}
async function walkTour(){if(tourBusy||!root.GuidedTour)return false;tourBusy=true;const v=V();
 try{v.story=v.story||{};try{const st=story();if(st&&st.mode==='active'){st.closed=false;draw(true)}}catch(e){}   /* the quest window must be up: step 3 points at its auto-walk button */
  const fine=!!(root.matchMedia&&matchMedia('(pointer:fine)').matches);
  /* keys held (W A S D / arrows) — counted for step 2; the village map is an iframe so the listeners go on ITS window too */
  const heldKeys=new Set(),isMoveKey=k=>/^(w|a|s|d|arrowup|arrowdown|arrowleft|arrowright)$/i.test(k);
  const onKey=e=>{if(isMoveKey(e.key))heldKeys.add(e.key.toLowerCase())},onKeyUp=e=>{heldKeys.delete(e.key.toLowerCase())},onBlur=()=>heldKeys.clear();
  const keyWins=[root];try{const f=walkFrame();if(f&&f!==root)keyWins.push(f)}catch(e){}
  for(const w of keyWins)try{w.addEventListener('keydown',onKey,true);w.addEventListener('keyup',onKeyUp,true);w.addEventListener('blur',onBlur)}catch(e){}
  /* steps 1-2 force ONE thing each: step 1 = click the ground with the foot cursor (keys refused) · step 2 = hold W A S D (mouse refused) · the sibling refuses everything else (the "lost?" step lifts it) */
  let lockOn=false,lockMode={click:true,keys:false},lastWarn=0,warnText='';const warnSib=()=>{if(Date.now()-lastWarn<2500)return;lastWarn=Date.now();try{root.GuidedTour?.interject?.(warnText)}catch(e){}};
  const denyTop=e=>{if(!lockOn)return;const t=e.target;if(t&&(t.tagName==='IFRAME'||t.closest?.('#gtour')))return;e.preventDefault();e.stopImmediatePropagation();if(e.type==='pointerdown')warnSib()};
  const denyKeyTop=e=>{if(!lockOn||e.target?.closest?.('input,textarea')||e.key==='Escape'||(lockMode.keys&&(isMoveKey(e.key)||e.key==='Shift')))return;e.preventDefault();e.stopImmediatePropagation();warnSib()};
  let clicked=false;
  const lock=(on,mode,text)=>{lockOn=on;if(mode)lockMode=mode;if(text)warnText=text;for(const n of ['pointerdown','pointerup','click']){removeEventListener(n,denyTop,true);if(on)addEventListener(n,denyTop,true)}removeEventListener('keydown',denyKeyTop,true);if(on)addEventListener('keydown',denyKeyTop,true);for(const w of keyWins)try{w.ShiftWalk?.lock(on,warnSib,{click:lockMode.click,keys:lockMode.keys,onWalk:()=>{clicked=true}})}catch(e){}};
  const W1='ยังก่อนนะ! ตอนนี้ให้คลิกที่พื้นถนนก่อน — อย่างอื่นเอาไว้ทีหลัง',W2='ยังก่อนนะ! ตอนนี้ให้กด W A S D ค้างไว้สักพัก — อย่างอื่นเอาไว้ทีหลัง';
  lock(true,{click:true,keys:false},W1);
  let held0=0,lastT=0;const heldWait=need=>()=>{const n=performance.now();if(!lastT)lastT=n;if(heldKeys.size)held0+=n-lastT;lastT=n;return held0>=need};
  const steps=[
   {who:'sib',free:true,text:'ต่อไปลองเดินดูกัน — คลิกที่พื้นถนนตรงไหนก็ได้ (เคอร์เซอร์จะเป็นรอยเท้า) ตัวละครจะเดินไปตรงนั้นให้',wait:()=>clicked},
   ...(fine?[{who:'sib',free:true,text:'เดินด้วยคีย์บอร์ดก็ได้นะ ลองกด W A S D หรือปุ่มลูกศร ค้างไว้สักพักดูสิ',prep:()=>{lock(true,{click:false,keys:true},W2);held0=0;lastT=0},wait:heldWait(3000)}]:[]),
   {who:'sib',text:'ผู้ใหญ่โอเรนอยู่ที่ตลาดนะ ถ้าหลงทาง ให้กดปุ่ม "เดินอัตโนมัติ" (รูปธง) ที่ลูกศรชี้ ตัวละครจะเดินไปหาผู้ใหญ่ให้เอง — ลองกดเลย',target:'#storyTracker [data-act="0"]',arrow:'up',showTracker:true,hidePic:'L',prep:()=>lock(false)}];   /* the player must press the flag (the arrow sits ABOVE it, like the book lesson); nothing else can be clicked */
  const ok=await root.GuidedTour.run(steps,{bright:true});
  lock(false);for(const w of keyWins)try{w.removeEventListener('keydown',onKey,true);w.removeEventListener('keyup',onKeyUp,true);w.removeEventListener('blur',onBlur)}catch(e){}v.story.walkTour=true;doSave();if(ok)setTimeout(walkTips,600);return ok}
 finally{tourBusy=false}}
async function bookTour(){if(tourBusy||!root.GuidedTour)return false;const v=V();if(!v)return false;tourBusy=true;try{v.story=v.story||{};if(!v.story.bookGift){v.story.bookGift=true;const b=v.bag||(v.bag={});b.potion=(b.potion||0)+1;b.momWater=(b.momWater||0)+1;b.mayBread=(b.mayBread||0)+4;doSave();await root.ItemGet?.show([{key:'potion',n:1},{key:'momWater',n:1},{key:'mayBread',n:4}],{kicker:'ของจากแม่',text:'แม่ห่อของใส่สมุดผนึกของทั้งสองคนไว้ให้ก่อนออกจากบ้าน'})}   /* v98.668 · the ของใช้ page is not empty: 1 potion (+HP) and 1 water from mother (+stamina) · v98.1022 · + the 4 loaves of Aunt May's bread that mother counted ("แม่นับขนมปังไว้แล้ว สี่ก้อน") */
  const ok=await root.GuidedTour.run(BOOK_TOUR,{bright:true});try{if($('panel')?.open)$('panel').close()}catch(e){}v.story=v.story||{};v.story.bookSeen=true;doSave();return ok}finally{tourBusy=false}}
async function bookFirst(){return false}   /* v98.613 · the book lesson now plays at the end of the opening scene */
async function bookFirstOld(){const v=V();if(!v||!root.Cutscene)return false;v.story=v.story||{};if(v.story.bookSeen)return false;const st=story();if(!st||st.mode!=='active'||st.i>=byId('hire'))return false;v.story.bookSeen=true;doSave();await root.Cutscene.play(D().SCENES.bookFirst);return true}
/* v98.1118 · HUD MENUS DURING THE PROLOGUE: a menu the story has not taught yet is locked (greyed in the HUD, and the bridge refuses to open it): the sibling explains instead.
   key = a HUD icon (map · today · bag · me · go · menu) or a menu id of the bridge (character · deck · upgrade · tdeck · job · journal · activities · adventure · training …) → '' when open, else the reason.
   Taught = bag: from the first time the card-book is opened for the player (bookIntro) · me (character · deck · jobs · elements): from the deck lesson · map: after the first talk (step goats) · go: only on the steps that send the player out (lock()) ·
   today (quest log) and menu (Esc: save · settings) stay open. Outside the prologue nothing is locked. */
const MENU_KEY={bag:'bag',character:'me',deck:'me',upgrade:'me',tdeck:'me',job:'me',element:'me',training:'me',adventure:'go',map:'map'};
function menuLock(k){const st=story();if(!st||st.mode!=='active')return '';const key=MENU_KEY[k]||k,step=STEPS[st.i];if(!step)return '';const v=V()||{},sv=v.story||{};
 const why=(w)=>'ยังไม่ถึงเวลา'+w+' — เดี๋ยวค่อยสอนทีหลัง · ตอนนี้ให้ทำ "'+step.title+'" ก่อน';
 if(key==='bag')return sv.bookIntro||sv.bookSeen?'':why('ใช้สมุดผนึก');
 if(key==='me')return st.i>=byId('deckLesson')?'':why('ใช้เมนูตัวเรา');
 if(key==='map')return st.i>=byId('goats')?'':why('ใช้แผนที่');
 if(key==='go')return lock();
 return ''}
/* v98.1106 · a place / the world map the story keeps closed: the SIBLING cuts in with the reason (a talk line) instead of a system window */
function sibBlock(why){const t='เดี๋ยวก่อนนะ! '+String(why||'').replace(/[<>&]/g,'');try{if(root.GuidedTour?.interject){root.GuidedTour.interject(t);return true}}catch(e){}return false}
root.Story={itemUsed,menuLock,sibBlock,bookTour,worldGuide,homeLock,sceneAt,bookIntro,pumpkinDays:waterDays,victory:victorySummary,bookFirst,timeScale,guildFirst,mipSeen,mystery,resumeFight,trackerInfo,openTracker,lock,placeLock,lessons:()=>(V()?.story?.lessons||[]).map(id=>({id,title:LESSON[id]?.[0],lines:LESSON[id]?.[1]})),lesson:lessonCard,steps:STEPS,state:story,questTargets,questEvent,talked,guide,
 reset(){if(!V())return;delete V().story;init();V().story.mode='active';doSave();draw(true)},
 goto(id){const st=story()||(init(),story());const i=byId(id);if(i<0)return false;st.mode='active';st.i=i;delete st.data[id];doSave();draw(true);return true},
 skip(){const st=story();if(st){st.mode='done';doSave();draw(true)}},
 play:id=>root.Cutscene.play(id==='contest'?D().contestScene(3):D().SCENES[id])};
})(globalThis);
