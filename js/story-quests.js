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
const partySize=()=>(V()?.party||[]).length+(V()?.bench||[]).length;

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
 goats:{key:'goats',kind:'goat',near:['square','inn','market','npc7'],n:3,spread:7,flee:true},
 planks:{key:'planks',kind:'plank',near:['npc3'],n:2,spread:3,mark:true,label:'แผ่นไม้ของเคน'},
 plot:{key:'plot',kind:'plot',near:['home'],n:1,spread:2.5,mark:true,label:'แปลงฟักทอง'},
 stall:{key:'stall',kind:'stall',near:['market'],n:1,spread:3,mark:true,label:'แผงขายของ'},
 contest:{key:'contest',kind:'pumpkin',near:['square'],n:1,spread:3,mark:true,label:'ลานประกวดฟักทอง'}};
const plotIfDry=()=>(V()?.story?.seeds&&!wateredToday())?[SPOT.plot]:[];

const STEPS=[
 talkStep({id:'wake',chapter:'วันที่ 1 · เตรียมงานเทศกาล',intro:'opening',outro:'elderMeet',title:'ไปหาผู้ใหญ่บ้าน',talk:'oren',goal:'เดินไปหาผู้ใหญ่บ้านโอเรน แล้วคลิกที่ตัวเพื่อคุย',
  hint:'ช่วงเช้าผู้ใหญ่บ้านอยู่ที่ตลาด · '+HINT_WALK}),
 {id:'goats',tag:'real',title:'แพะหนีออกจากคอก',goal:'ตามจับแพะของปิ๊บ 3 ตัวที่หนีไปทั่วหมู่บ้าน',hint:'คลิกที่แพะเพื่อวิ่งตาม · มันวิ่งหนีเมื่อเข้าใกล้ แต่วิ่งได้ไม่นานก็หอบ ตอนหยุดพักคือจังหวะจับ · ลูกศรขอบจอชี้ไปทางแพะ',
  spot:SPOT.goats,progress:d=>(d.got||0)/3,check:d=>(d.got||0)>=3,acts:[guideBtn],
  onSpot:d=>{d.got=(d.got||0)+1;return {msg:'🐐 จับได้ '+d.got+'/3',consume:true}}},
 talkStep({id:'goatsBack',outro:'goatsDone',title:'พาแพะกลับไปคืน',talk:'pip',goal:'เอาแพะไปคืนปิ๊บ',hint:'ปิ๊บอยู่ที่ลานกลางหมู่บ้านช่วงเช้า บ่ายไปตลาด · '+HINT_WALK}),
 talkStep({id:'seeds',outro:'seeds',title:'เมล็ดฟักทองยักษ์',talk:'hilda',goal:'ไปขอเมล็ดฟักทองจากฮิลดาชาวนา',hint:'เช้าอยู่บ้าน เที่ยงถึงบ่ายสามขายผักที่ตลาด · '+HINT_WALK,
  reward:()=>{V().story.seeds=true}}),
 {id:'pumpkin',tag:'real',title:'ปลูกฟักทอง',goal:'เดินไปที่แปลงข้างบ้าน ปลูกและรดน้ำ',hint:'เดินไปแตะแปลงดิน 🌱 · รดน้ำได้วันละครั้ง ยิ่งรดครบทุกวัน ฟักทองยิ่งใหญ่ (ประกวดวันที่ 3)',
  targets:()=>({spots:wateredToday()?[]:[SPOT.plot]}),check:()=>waterDays()>=1,acts:[guideBtn]},
 talkStep({id:'tom',outro:'tomStall',title:'แผงขายของพัง',talk:'tom',goal:'ไปถามลุงทอมช่างไม้ว่าซ่อมแผงอย่างไร',hint:'ลุงทอมอยู่บ้านช่วงเช้า เที่ยงถึงห้าโมงเย็นช่วยงานที่โรงตีเหล็ก · '+HINT_WALK}),
 {id:'planks',tag:'real',title:'แผ่นไม้ของเคน',goal:'เก็บแผ่นไม้ 2 แผ่นที่กองไว้หน้าบ้านเคน',hint:'เดินไปแตะกองไม้ 🪵 · ได้ไม้เข้ากระเป๋าวัตถุดิบ',
  spot:SPOT.planks,progress:d=>(d.got||0)/2,check:d=>(d.got||0)>=2,acts:[guideBtn],
  onSpot:d=>{mats().wood=(mats().wood||0)+1;d.got=(d.got||0)+1;doSave();doRender();return {msg:'🪵 ไม้ +1 ('+d.got+'/2)',consume:true}}},
 {id:'stall',tag:'real',outro:'stallDone',title:'ซ่อมแผงขายของ',goal:'เดินไปที่แผงหน้าตลาด แล้วซ่อม (ใช้ไม้ 2)',hint:'เดินไปแตะแผง 🛠️ · ใช้แรง 6 และเวลา 30 นาที · ไม้ไม่พอซื้อได้ที่ตลาด',
  spot:SPOT.stall,check:d=>!!d.built,acts:[guideBtn],
  onSpot:d=>{if((mats().wood||0)<2)return {msg:'ไม้ไม่พอ (ต้องใช้ 2)'};const why=spend(6,30,3);if(why)return {msg:why};mats().wood-=2;d.built=true;d.got=1;doSave();doRender();return {msg:'🔨 ซ่อมแผงเสร็จ!',consume:true}}},
 {id:'sleep1',tag:'real',outro:'day2',title:'จบวันแรก',goal:'เดินกลับบ้าน แล้วไปที่เตียงเพื่อนอนพัก',hint:'ในบ้านเดินไปที่เตียงแล้วเลือก "นอนพัก" · การนอนข้ามไปเช้าวันถัดไป',
  place:'home',begin:d=>{d.day=G().day},check:d=>G().day>d.day,acts:[guideBtn]},
 talkStep({id:'guard',chapter:'วันที่ 2 · ทำของ และหาคน',outro:'guardTalk',title:'ยามประตูหมู่บ้าน',talk:'dork',goal:'ไปคุยกับยามดอร์กก่อนออกนอกหมู่บ้าน',hint:'ยามดอร์กเฝ้าอยู่ที่ลานกลางหมู่บ้านทั้งวัน · '+HINT_WALK}),
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
 {id:'hire',tag:'real',outro:'hireDone',title:'หาคนช่วย',goal:'เดินไปโรงแรมเขากวางทอง แล้วชวนเพื่อนร่วมทาง 1 คน',hint:'คุยกับคนที่มี ★ · บรัมรับจ้าง 60 เหรียญ · เคียร์เพื่อนสมัยเด็กนั่งที่โรงแรมเที่ยงถึงสี่ทุ่ม ชวนได้เลย',
  place:'inn',targets:()=>({npc:['kier','bram'].filter(id=>npcPlace(id)==='inn')}),check:()=>partySize()>0,acts:[guideBtn],
  reward:()=>root.StarterKit?.unlock?.([{group:'combat',id:'formation',n:2}],{kicker:'มีเพื่อนแล้ว',title:'จู่โจมประสาน',text:'มีเพื่อนยืนติดตัว ตีแรงขึ้น ×1.35'})},
 {id:'sleep2',tag:'real',outro:'day3',title:'พรุ่งนี้วันงาน',goal:'รดน้ำฟักทองของวันนี้ แล้วกลับบ้านไปนอน',hint:'แปลงฟักทองอยู่ข้างบ้าน 🌱 · ในบ้านเดินไปที่เตียงแล้วเลือก "นอนพัก"',
  place:'home',targets:()=>({spots:plotIfDry()}),begin:d=>{d.day=G().day},check:d=>G().day>d.day,acts:[guideBtn]},
 {id:'sell',chapter:'วันที่ 3 · งานเทศกาลเก็บเกี่ยว',tag:'real',outro:'soldOne',title:'แข่งขายกับเกรเวน',goal:'ขายของในตลาดให้ได้ 1 ชิ้น',hint:'ขายที่โต๊ะรับซื้อ หรือวางของใน "ร้านของเรา" แล้วรอชาวบ้านมาซื้อ · อย่าลืมรดน้ำฟักทองเช้านี้',
  place:'market',targets:()=>({spots:plotIfDry()}),check:d=>d.sales>0,acts:[guideBtn]},
 {id:'contest',tag:'real',title:'ประกวดฟักทอง',goal:'แบกฟักทองไปที่ลานประกวดกลางหมู่บ้าน',hint:'เดินไปแตะแท่นประกวด 🎃 · ผลขึ้นกับจำนวนวันที่รดน้ำ',
  spot:SPOT.contest,targets:()=>({spots:plotIfDry()}),check:d=>!!d.judged,acts:[guideBtn],
  onSpot:async d=>{if(d.judged)return null;d.judged=true;const days=waterDays();doSave();await root.Cutscene.play(D().contestScene(days));addCoins(days>=3?60:days===2?30:10);d.got=1;doSave();doRender();return {msg:'🎃 ประกวดเสร็จแล้ว',consume:true}}},
 {id:'raid',tag:'real',intro:'raid',outro:'awaken',title:'โจรป่าบุกงาน!',goal:'ปกป้องงานเทศกาล — ชนะการต่อสู้',hint:'ใช้ไพ่เดินเข้าหาศัตรู ไพ่โจมตีเมื่ออยู่ในระยะ · ยืนบนหญ้า/มอสช่วยกำบัง · เพื่อนร่วมทางสู้ไปพร้อมกัน',
  check:d=>d.won,acts:[{label:'⚔ ปกป้องหมู่บ้าน!',primary:true,hide:d=>!!d.fighting,run:d=>startRaid(d)}],
  reward:()=>{V().story.element='earth';V().story.plate=true;if(V().character)V().character.points=(V().character.points||0)+1;try{const b=root.Adventure?.bag?.();if(b)b.treasureMap=(b.treasureMap||0)+1}catch{}return root.StarterKit?.unlock?.([{group:'combat',id:'quake',n:3},{group:'combat',id:'counter',n:1}],{kicker:'แก่นธาตุดินตื่นขึ้น',title:'พลังของผืนดิน'})}},
 talkStep({id:'plate',outro:'plate',title:'จานหินโบราณ',talk:'oren',goal:'นำจานหินไปให้ผู้ใหญ่บ้านโอเรนดู',hint:'หัวค่ำผู้ใหญ่บ้านนั่งที่โรงแรม สองทุ่มกลับบ้าน · '+HINT_WALK}),
 talkStep({id:'saf',chapter:'การเดินทางครั้งแรก · รังโจรป่า',outro:'safTalk',title:'ร้านยาของซาฟ',talk:'saf',goal:'แวะหาหมอยาซาฟก่อนออกเดินทาง',hint:'ซาฟอยู่ร้านยา 6 โมงเช้าถึง 6 โมงเย็น · '+HINT_WALK,
  reward:()=>{try{const b=V().bag||(V().bag={});b.potion=(b.potion||0)+1}catch{}}}),
 {id:'prep',tag:'real',title:'เตรียมตัวออกเดินทาง',goal:'ซื้อเสบียงอย่างน้อย 1 ชิ้นที่ตลาด',hint:'เดินไปที่โต๊ะซื้อวัตถุดิบในตลาด · เสบียงใช้กินฟื้นความสดชื่นระหว่างทาง · จัดสำรับได้ที่โต๊ะในบ้าน',
  place:'market',begin:d=>{d.food=mats().food||0},check:d=>(mats().food||0)>d.food,acts:[guideBtn]},
 {id:'expedition',tag:'real',intro:'departure',outro:'camp',title:'รังโจรป่า',goal:'ออกทางออกหมู่บ้าน ล้มศัตรูบนแผนที่โลกให้ได้ 3 ตัว',hint:'กระดานภารกิจที่หมู่บ้านบอกทางไปจุดหมาย · พักแรมได้ทุกที่ · กลางคืนศัตรูดุร้ายขึ้น · HP ต่ำให้ดื่มยาหรือกลับก่อนก็ได้',
  exit:true,begin:d=>{d.base=V().kills||0},progress:d=>Math.min(1,((V().kills||0)-(d.base||0))/3),check:d=>(V().kills||0)-(d.base||0)>=3,
  acts:[guideBtn],
  reward:()=>root.StarterKit?.unlock?.([{group:'movement',id:'sprint',n:2},{group:'combat',id:'climb',n:2},{group:'combat',id:'dive',n:1},{group:'combat',id:'evade',n:1},{group:'combat',id:'firstAid',n:1}],{kicker:'ของจากค่ายโจร',title:'ทักษะเอาตัวรอด',text:'ป่ามีเนินและหน้าผา · ปีนขึ้นที่สูงแล้วกระโจนฟาดลงมาแรงกว่าเดิม'})},
 {id:'return',tag:'real',outro:'home',title:'กลับบ้าน',goal:'กลับหมู่บ้านพร้อมของที่ได้',hint:'จะเดินต่อไปจนถึงจุดหมายก็ได้ ยิ่งลึกของยิ่งดี แต่ยิ่งเสี่ยง',check:()=>!onWorld(),acts:[]},
 {id:'sellLoot',tag:'real',title:'ขายของจากการเดินทาง',goal:'ขายของที่ได้มาที่ตลาด 1 ครั้ง',hint:'ของป่า (เขี้ยวหมาป่า สมุนไพร เหรียญโบราณ) ขายได้ที่ตลาด',place:'market',check:d=>d.sales>0,acts:[guideBtn]},
 {id:'rest',tag:'real',outro:'finale',title:'พักฟื้น',goal:'กลับบ้านแล้วนอนพัก',hint:'ในบ้านเดินไปที่เตียงแล้วเลือก "นอนพัก"',place:'home',begin:d=>{d.day=G().day},check:d=>G().day>d.day,acts:[guideBtn],
  reward:async()=>{addCoins(30);await root.StarterKit?.unlock?.([{group:'combat',id:'backstab',n:1},{group:'combat',id:'ambush',n:1},{group:'combat',id:'rockfall',n:1},{group:'combat',id:'perch',n:1}],{kicker:'จบบทนำ',title:'ไพ่ของนักผจญภัย',text:'+30 เหรียญ · การ์ดใบอื่นหาได้จากการเดินทาง'});toast('จบบทนำ · เล่นอิสระได้แล้ว','quest')}}];
const byId=id=>STEPS.findIndex(x=>x.id===id);

/* ---------- pumpkin (temp farming) ---------- */
function waterDays(){return Object.keys(V()?.story?.water||{}).length}
function wateredToday(){return !!V()?.story?.water?.[G().day]}
function water(){const st=V().story;st.water||={};if(st.water[G().day])return 'วันนี้รดน้ำไปแล้ว';const why=spend(2,10,1);if(why)return why;
 st.seeds=true;st.water[G().day]=true;doSave();doRender();return '💧 รดน้ำฟักทองแล้ว ('+waterDays()+'/3 วัน)'}

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

/* ---------- raid battle (v94: the flat card battle drawn on the village square, in a frame over the game) ---------- */
function startRaid(d){if(d.fighting)return;if(onWorld()){toast('กลับหมู่บ้านก่อน');return}
 const g=G(),v=V();if((g.hp||0)<30)g.hp=Math.max(g.hp||0,40);   // the festival raid never starts the player half-dead
 d.fighting=true;d.outcome=null;doSave();
 const party=(v.party||[]).filter(p=>p.hp>0).map(p=>p.key+':'+p.hp+':'+p.max+':'+(p.order||'charge')+':'+(p.level||1)).join(',');
 const fr=document.createElement('iframe');fr.id='storyBattle';fr.title='โจรป่าบุกงาน';fr.style.cssText='position:fixed;inset:0;z-index:950;width:100%;height:100%;border:0;background:#07080c';
 fr.src='village-town.html?battle=1&embed=1&r=6&ms='+encodeURIComponent('bandit*1.2,wolf*1.1,bandit*1.2,wolf*1.1')+'&party='+encodeURIComponent(party)+'&hhp='+(g.hp||60)+'&hmax='+(g.maxHp||60)+(root.Progression?'&'+Progression.battleParam(g,Progression.recipes):'')+'&title='+encodeURIComponent('คืนเทศกาล ·');
 const done=e=>{if(e.source!==fr.contentWindow||e.data?.type!=='agrenor-battle')return;removeEventListener('message',done);const r=e.data;
  g.hp=Math.max(1,Math.min(g.maxHp||60,r.hp??g.hp));for(const x of r.party||[]){const p=(v.party||[]).find(q=>q.key===x.key);if(p){p.hp=Math.max(1,x.hp);if(x.order)p.order=x.order}}
  if(r.outcome==='win'){v.battles=(v.battles||0)+1;v.kills=(v.kills||0)+(r.kills||0);d.won=true;if(root.Progression){const xp=Progression.battleXp({dang:.4,kills:r.kills});gainCharacterXP(xp);for(const p of v.party||[])Progression.gainAlly(p,Math.round(xp*.8))}}else toast(r.outcome==='lose'?'พ่ายแพ้... ตั้งหลักแล้วลองใหม่':'ถอยออกมา · โจรยังอยู่ในงาน','');
  d.fighting=false;doSave();fr.remove();doRender()};
 addEventListener('message',done);document.body.appendChild(fr)}

/* ---------- sales detector (coins up while an item or goods left the bag at the market) ---------- */
let prev=null;
function snapshot(){return {shop:V()?.shop?.sold||0,coins:V()?.coins||0,inv:(G()?.inventory||[]).length,goods:goodsCount(),loc:V()?.location,adv:!!adv()}}
function detectSale(){const now=snapshot(),p=prev;prev=now;if(!p)return false;if(now.shop>p.shop)return true;if(now.adv||p.adv)return false;return now.loc==='market'&&now.coins>p.coins&&(now.inv<p.inv||now.goods<p.goods)}

/* ---------- state ---------- */
/* v95.01: steps were added (talk to the villager first), so a save from before keeps its place by step id */
const OLD_IDS=['wake','goats','pumpkin','stall','sleep1','cave','caveBack','lanterns','craft','hire','sleep2','sell','contest','raid','plate','prep','expedition','return','sellLoot','rest'];
const OLD_TO={pumpkin:'seeds',stall:'tom',cave:'guard',lanterns:'gus',prep:'saf'};
function migrate(st){if(!st||st.v>=2)return st;const old=OLD_IDS[st.i];if(old){const id=OLD_TO[old]||old,i=byId(id);if(i>=0){st.i=i;if(OLD_TO[old])delete st.data[old]}}else if(st.i>=OLD_IDS.length)st.i=STEPS.length;st.v=2;doSave();return st}
function story(){const v=V();if(!v)return null;return migrate(v.story||null)}
function freshSave(){const g=G(),v=V();if(v.starterKit===1&&g.day<=1&&!g.wins&&!v.adventure)return true;return g.day<=1&&!g.wins&&!(g.inventory||[]).length&&!(v.companions||[]).length&&!(v.party||[]).length&&!v.adventure}
function init(){const v=V();if(!v||v.story)return;v.story={v:2,mode:freshSave()?'active':'offer',i:0,data:{},water:{},crystals:0};doSave()}
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

function boot(){Object.assign(root.Cutscene.speakers,D().SPEAKERS);hookActions();
 if(new URLSearchParams(location.search).get('story')==='reset'&&V()){delete V().story;doSave()}
 // editor / tool pages never run the story
 if(/[?&](editor|skipStory)/.test(location.search)||root.EDITOR_MODE||root.top!==root)return;
 setInterval(()=>{tick().catch(e=>{busy=false;console.warn('[story]',e)})},700)}
if(document.readyState!=='loading')setTimeout(boot,0);else document.addEventListener('DOMContentLoaded',()=>setTimeout(boot,0));

root.Story={steps:STEPS,state:story,questTargets,questEvent,talked,guide,
 reset(){if(!V())return;delete V().story;init();V().story.mode='active';doSave();draw(true)},
 goto(id){const st=story()||(init(),story());const i=byId(id);if(i<0)return false;st.mode='active';st.i=i;delete st.data[id];doSave();draw(true);return true},
 skip(){const st=story();if(st){st.mode='done';doSave();draw(true)}},
 play:id=>root.Cutscene.play(id==='contest'?D().contestScene(3):D().SCENES[id])};
})(globalThis);
