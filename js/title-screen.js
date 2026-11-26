/* v50 · Title menu + prologue + loading screen.
   • Opening the game shows the title menu first (New Game · Continue · Options · Extra), not the village.
   • New Game → prologue narration → name the hero → loading → village.  Continue → loading → village.
   • GameLoader preloads what a scene needs (images, music, the town frame) with a progress bar, prefetches the
     next scenes (battle) in the background, and covers adventure/battle transitions only while something is still loading.
   • Skipped in editor pages (?editor=…) and with ?skipTitle (tests/tools).
   Text for the prologue, credits and how-to-play lives in the arrays right below — edit freely. */
(function(root){'use strict';
/* v95.05: told like a picture book — each page is a picture (js/scene-art.js · art:'…') with one or two gentle lines that appear word by word.
   The ancient people are never named; Elukhor is the familiar golden light; nights have the purple moon. bg = fallback image only. */
const LEGACY_PROLOGUE=[// v95.09: the creator's script (v2, sections ก–ช) — no map with names, no reveal of where people came from, no god appears
 {art:'ruins',text:'มีนิทานเก่าเรื่องหนึ่ง ที่บางเผ่ายังเล่าสืบกันมา\nว่าครั้งหนึ่ง โลกใบนี้เคยเป็นของผู้คนที่เก่าแก่ยิ่งกว่าใคร'},
 {art:'deepwood',text:'พวกเขาอาศัยอยู่ในป่าลึก ที่แสงจันทร์แทบส่องไม่ถึง\nจนวันหนึ่ง ก็พากันเดินออกมา'},
 {art:'journey',text:'พวกเขาเดินทางออกไปทั่วผืนพิภพ ข้ามขุนเขา ล่องตามสายน้ำ\nบ้างตามหาผืนดินที่ตอบรับความเชื่อของตน บ้างพบหนทางใหม่ระหว่างทาง'},
 {art:'crystals',text:'กลางอกของพวกเขามีผลึกที่เรืองแสงดั่งดวงดาว\nเมื่อถึงผืนดินที่ใช่ ผลึกก็เปลี่ยนสีและส่องสว่าง แล้วธาตุของแผ่นดินนั้นก็ตื่นขึ้น'},
 {art:'settle',text:'แล้วหยั่งรากลงในดินแดนที่แตกต่างกัน\nแต่ละถิ่นจึงมีเรื่องราวของตนเอง'},
 {art:'kin',text:'รุ่นแล้วรุ่นเล่า ร่างกายของพวกเขาค่อย ๆ เปลี่ยนไปตามผืนดินที่อาศัย\nบ้างสูงโปร่ง บ้างเตี้ยล่ำ บ้างบึกบึน บ้างมีเขางอกขึ้นกลางหน้าผาก'},
 {art:'treeline',text:'เวลาผ่านไป เรื่องราวของมหาไพรแห่งบรรพชนถูกลืมเลือน\nผู้คนรู้จักมหาพงไพรเพียงจากเรื่องเล่า และทางเก่าก็ถูกกลืนหายใต้รากไม้'},
 {art:'journal',text:'ว่ากันว่า ลึกเข้าไปยังมีชนโบราณที่ไม่ต้อนรับผู้มาเยือน\nบ้างเล่าถึงนครที่ไม่เคยสิ้นแสง บ้างว่ามีนครซ่อนอยู่ในความมืด\nไม่มีใครรู้… ว่าเรื่องเล่าเหล่านั้นจริงเพียงใด'},
 {art:'dig',text:'ชื่อบางชื่อเลือนหาย และความจริงบางอย่างถูกเล่าต่อจนกลายเป็นตำนาน\nยังมีผู้ขุดหาคำตอบจากจารึกใต้ผืนดิน แต่สิ่งที่พบ บางครั้งกลับทิ้งคำถามไว้มากกว่าเดิม'},
 {art:'ancient',text:'นิทานเรื่องนี้จะจริงแค่ไหน คงไม่มีใครตอบได้\nมีเพียงหินบางก้อนใต้รากไม้ ที่ยังเรืองแสงเบา ๆ ราวกับจำได้'},
 {art:'temple',text:'แต่ในขณะที่เรื่องเก่าเลือนหายไปตามกาลเวลา มีสิ่งหนึ่งที่สืบทอดอย่างมั่นคง\nคือศรัทธาและความเชื่อ อันเป็นรากของจิตวิญญาณ วัฒนธรรม และสังคมของทุกถิ่น'},
 {art:'temple',text:'ศรัทธาในสามมหาเทพยังคงสืบทอด\nเคียงข้างผู้พิทักษ์ที่แต่ละถิ่นเคารพ'},
 {art:'shrines',text:'บางแห่งสร้างวิหารสูงใหญ่\nบางแห่งวางเครื่องบูชาไว้ใต้ต้นไม้ข้างทาง'},
 {art:'towns',text:'ภาษาและวิถีชีวิตของแต่ละถิ่นแตกแขนงออกไป\nบ้านเรือนเติบโตเป็นเมือง บางเมืองรวมกันเป็นอาณาจักร โลกจึงเต็มไปด้วยผู้คนหลากเผ่าพันธุ์'},
 {art:'riverCity',text:'ห่างจากเงาของมหาพงไพร สายน้ำหล่อเลี้ยงไร่นาและเมืองของมนุษย์\nผู้เดินทางต่างเผ่าพันธุ์ นำสินค้าและข่าวสารจากแดนไกลมาด้วย'},
 {art:'roadOut',text:'บ้างมาแสวงหาความมั่งคั่ง บ้างมาตามหาสิ่งที่สูญหาย\nและบ้าง… เพียงต้องการเริ่มต้นใหม่'},
 {art:'fernvale',text:'ริมเส้นทางสู่เมืองใหญ่ มีหมู่บ้านเล็ก ๆ แห่งหนึ่ง\nที่นครลึกลับและอารยธรรมที่สาบสูญ เป็นเพียงเรื่องเล่าจากแดนไกล'},
 {art:'dawn',text:'เช้าวันหนึ่งเริ่มต้นขึ้น เช่นเดียวกับวันอื่น\nและเรื่องราวของเจ้าสองพี่น้อง… ก็เริ่มต้นที่นี่'}
]; 
const PROLOGUE=root.NewGamePrologueKit?.pages||LEGACY_PROLOGUE;
/* after the name: one more page that walks into the village chapter, then the game starts (js/story-data.js 'opening') */
/* v98.201 · the bridge page keeps the hero's house picture of the last prologue page (same key = no new layer, no effect) and the game fades in after it */
const BRIDGE={bg:(root.NewGamePrologueKit?.base||'assets/new-game-prologue/images/')+'hero-house.webp',fx:'same',prologueId:'W13a',art:null,text:'{hero} กับ {sib}…\nเช้าวันแรกก่อนงานเทศกาลเก็บเกี่ยว'};
const HOWTO=[
 ['เดินอย่างเดียว (Shift)','กด Shift ค้างไว้ → เคอร์เซอร์เป็นรอยเท้า คลิกพื้นตรงไหนก็เดินไปตรงนั้นอย่างเดียว ไม่คุยกับ NPC ไม่เข้าสถานที่ ไม่หยิบของเควส · ปล่อย Shift กลับเป็นปกติ · ใช้ได้ทุกแมพที่เดินเองได้ (เมาส์เท่านั้น)'],
 ['หมู่บ้าน','คลิกถนนหรือสถานที่เพื่อเดิน · บ้านใช้พัก นอน จัดสำรับ · โรงตีเหล็กใช้คราฟต์อุปกรณ์และฝึกต่อสู้ · ตลาดใช้ซื้อวัตถุดิบ ขายของ รับออร์เดอร์'],
 ['ออกผจญภัย','เดินไปทางออกขอบหมู่บ้าน เลือกพื้นที่ แล้วเลือกเส้นทางบนแผนที่ — ต่อสู้ เก็บของ เจอเหตุการณ์ และบอสท้ายพื้นที่'],
 ['การต่อสู้','ตัวที่ค่า CT เต็มก่อนได้เล่นก่อน · สั่งเดิน/โจมตี/ไอเทมจากไอคอนบนหัวตัวละคร · โจมตีจากด้านหลังและจากที่สูงแรงกว่า · ธาตุชนะทางกันตามวงล้อ'],
 ['การ์ดและคอมโบ','การ์ดร่ายมีจังหวะร่าย (เร็ว/ปกติ/ยาว) · การ์ดตอบโต้คว่ำหน้าไว้รอศัตรู · โจมตีเป้าเดียวกันต่อเนื่องได้ COMBO · คลิกเป้าซ้ำหรือกด Enter เพื่อโจมตี'],
 ['เซฟ','เกมบันทึกอัตโนมัติในเบราว์เซอร์ · สำรอง/นำเข้าเซฟได้จากเมนูท้ายจอในเกม']
];
const CREDITS=[
 ['เกม','Project A · Agrenor Tactical Card Adventure'],
 ['ออกแบบและพัฒนา','ผู้สร้างเกม Project A'],
 ['ภาพและแอนิเมชัน','สร้างด้วยเครื่องมือ AI และ Asset Studio ของเกม'],
 ['ดนตรีประกอบ','ไฟล์ใน assets/audio/bgm'],
 ['ฟอนต์','Noto Sans Thai · SIL Open Font License'],
 ['แรงบันดาลใจ','Final Fantasy Tactics · Disgaea']
];
const TIPS=['โจมตีจากด้านหลังศัตรูแรงกว่าด้านหน้า','ยืนบนที่สูงช่วยให้ตีแรงขึ้นและหลบได้ดีขึ้น','กด "รอ" แทนการเดินจะได้ CT คืนบางส่วน','อุปกรณ์ที่ดีต้องใช้วัตถุดิบจากพื้นที่ที่ยากขึ้น','นอนที่บ้านเพื่อฟื้นแรงและชีวิตเต็ม','ล็อกเป้าแล้วดูหน้าต่างทำนายผลก่อนโจมตี'];
/* v98.1065 · LORE lines for the loading screen. [spoiler level, text]. Level = MainStory stage's `spoiler` (docs/lore/MAIN-STORY-CANON.md S0…S3): a line shows only when the player's story has reached it.
   Every line is CONFIRMED canon only (docs/lore/CURRENT-ERA-CANON.md Part A · GAME-ERA.md "ข้อตกลงที่ใช้ในเกม") and is worded the way ordinary villagers would know it — no ancient names (Glaelanar, Wyridean…), no gods in person, nothing about the mine / infection / Mip's secret.
   S2 and S3 are left EMPTY on purpose: add a line there only after the matching story beat exists in the game. */
const LORE=[
 [0,'เฟิร์นเวลอยู่ในที่ราบลุ่มแม่น้ำ ผู้คนแถบนี้ผูกพันกับธาตุดินและน้ำมาหลายชั่วอายุคน'],
 [0,'ทางเหนือคือดินแดนหิมะหนาว ทางใต้คือแดนไฟและภูเขาไฟ ส่วนทางตะวันตกไกลคือหมู่เกาะกลางทะเล'],
 [0,'ชาวบ้านเรียกแสงสีทองบนฟ้าว่า "ดวงทอง" มันลอยค้างอยู่ที่หนึ่งนาน ๆ แล้วค่อยย้ายไปที่อื่น ไม่ใช่ลางร้าย'],
 [0,'ป่าใหญ่ทางตะวันออกดูไม่มีที่สิ้นสุด แผนที่วาดไว้แค่ชายขอบ นักผจญภัยน้อยคนนักจะกลับออกมา'],
 [0,'คนส่วนใหญ่เกิดมาพร้อมแก่นธาตุดิน น้ำ หรือลม ธาตุอื่นมีอยู่จริงแต่พบได้ยาก'],
 [0,'ลูกไม่จำเป็นต้องได้ธาตุเดียวกับพ่อแม่ ธาตุของแต่ละคนเป็นของเขาเอง'],
 [0,'เผ่าพันธุ์อื่นมีอยู่จริง แต่คนส่วนใหญ่ไม่เคยพบ จะเจอก็ตามเมืองท่า เมืองชายแดน และเส้นทางค้าขาย'],
 [0,'การ์ดเวทคือแผ่นผนึกที่จารวงจรเวทไว้ ผู้ถือส่งพลังของตนเข้าไป วงจรจะจัดรูปพลังให้กลายเป็นเวท'],
 [0,'การ์ดไม่ใช่บ่อพลังไร้ขีดจำกัด ใครอัดพลังเกินที่วงจรรับไหว วงจรจะไหม้จนใช้ไม่ได้อีก'],
 [0,'การ์ดชั่วคราวใช้ได้ครั้งเดียวแล้วสลายไป จึงแรงกว่าการ์ดทั่วไป แต่ก็มีขีดจำกัดเหมือนกัน'],
 [0,'ใช้การ์ดต่างธาตุได้ โดยไม่ทำให้แก่นธาตุของตัวเองเปลี่ยน แต่จะได้แค่ผลพื้นฐานของการ์ดนั้น'],
 [0,'ตามที่สอนกันในอาณาจักรมนุษย์ จอมเวทผู้ยิ่งใหญ่คนหนึ่งเป็นผู้คิดค้นการ์ดเวทขึ้นมา'],
 [0,'อาณาจักรใหญ่ ๆ รับซื้อฝีมือเวทจากผู้ใช้เวท แล้วถอดแบบไปทำเป็นการ์ดจำหน่ายเป็นรายได้'],
 [1,'ข่าวจากด่านหินทางเหนือบอกว่าสงครามยืดเยื้อ และฝั่งเราเป็นฝ่ายเสียเปรียบ'],
 [1,'มีข่าวลือว่าราชสำนักเร่งขุดแร่พลังงานชนิดหนึ่งเพื่อใช้ในสงคราม']
];
function loreLevel(){try{const g=typeof s!=='undefined'&&s?s:root.WorldState?.game?.();const m=root.MainStory?.stage?.(g);return Number.isFinite(m?.spoiler)?m.spoiler:0}catch{return 0}}
function pickLore(level){const ok=LORE.filter(x=>x[0]<=level);return ok.length?ok[Math.floor(Math.random()*ok.length)][1]:''}

/* v97.13 · a save slot picked in Load (js/console-ui.js) is copied over the auto save here, before the game page reads it */
try{const n=sessionStorage.getItem('projectA.pendingSlot');if(n){sessionStorage.removeItem('projectA.pendingSlot');sessionStorage.setItem('projectA.startHome','1');localStorage.removeItem('projectA.resume');   /* v98.340 · a main-save slot starts at home; the temporary save is dropped */const o=JSON.parse(localStorage.getItem('projectA.slot.'+n)||'null');if(o?.data)for(const [k,v] of Object.entries(o.data)){if(v==null)localStorage.removeItem(k);else localStorage.setItem(k,v)}}}catch(e){}
/* v97.10 · developer tools (Editor on the title) only on the creator's machine: a GitHub token is set for ⬆ Push, or ?dev=1 (remembered; ?dev=0 forgets) */
const DEV=(()=>{try{const q=new URLSearchParams(location.search).get('dev');if(q==='1')localStorage.setItem('projectA.dev','1');if(q==='0')localStorage.removeItem('projectA.dev');return localStorage.getItem('projectA.dev')==='1'||!!JSON.parse(localStorage.getItem('projectA.github')||'{}').token}catch(e){return false}})();root.PROJECT_DEV=DEV;
const SAVE='three-card-forge-v4',STARTED='project-a-started-v1',NEW_FLAG='project-a-newgame',VERSION=(root.GAME_VERSION?.v||'v50');
const params=new URLSearchParams(location.search);
const skip=params.has('editor')||params.has('skipTitle')||!!root.EDITOR_MODE||root.top!==root;
const read=k=>{try{return localStorage.getItem(k)}catch{return null}};
let saved=null;try{saved=JSON.parse(read(SAVE)||'null')}catch{}
const hasSave=!!saved&&!!(read(STARTED)||saved.village?.heroName||saved.day>1||saved.inventory?.length||saved.wins);
let newGame=false;try{newGame=sessionStorage.getItem(NEW_FLAG)==='1';sessionStorage.removeItem(NEW_FLAG)}catch{}
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const reduced=root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
const wait=ms=>new Promise(r=>setTimeout(r,ms));
const T={active:!skip,hasSave,newGame};root.TitleScreen=T;
// game state lives in top-level let/const of the game scripts (not on window), so read it by name
const game=()=>typeof s!=='undefined'?s:null,doSave=()=>{try{if(typeof save==='function')save()}catch{}};
if(T.active)document.documentElement.classList.add('title-boot');

/* ---------- town frame ready (the frame posts 'ready' once its scene is built) ---------- */
let townReady=false;const townWaiters=[];
root.addEventListener('message',e=>{if(e.data?.source==='project-a-town'&&e.data.type==='ready'){townReady=true;townWaiters.splice(0).forEach(f=>f())}});
const whenTown=()=>townReady?Promise.resolve():new Promise(r=>townWaiters.push(r));
/* v98.352 · 'ready' is sent before the ground is painted; the frame's own "preparing the village" cover (village-town.html #townLoading) goes away ~1.2 s after the first full draw.
   The loading screen waits for the same moment, so that second cover never shows after it. */
const whenTownDrawn=()=>whenTown().then(()=>new Promise(r=>{const t0=Date.now(),iv=setInterval(()=>{let ok=false;try{const w=root.VillageTown.frame.contentWindow;ok=!!w.__townDrawnAt&&w.performance.now()-w.__townDrawnAt>1250}catch{}if(ok||Date.now()-t0>14000){clearInterval(iv);r()}},120)}));

/* ---------- loader: images, audio, fonts, custom promises ---------- */
const loaded=new Map();// url → Promise
function loadImage(url){if(!loaded.has(url))loaded.set(url,new Promise(r=>{const im=new Image();im.decoding='async';im.onload=()=>{(im.decode?im.decode():Promise.resolve()).catch(()=>{}).then(()=>r(true))};im.onerror=()=>r(false);im.src=url}));return loaded.get(url)}
function loadAudio(url){if(!loaded.has(url))loaded.set(url,new Promise(r=>{const a=new Audio();a.preload='auto';let done=false;const end=ok=>{if(!done){done=true;r(ok)}};a.oncanplaythrough=()=>end(true);a.onerror=()=>end(false);setTimeout(()=>end(false),6000);a.src=url;a.load()}));return loaded.get(url)}
function loadFont(family,url){const k='font:'+url;if(!loaded.has(k))loaded.set(k,('FontFace' in root?new FontFace(family,`url(${url})`).load().then(f=>{document.fonts.add(f);return true}):Promise.resolve(false)).catch(()=>false));return loaded.get(k)}
function load(item){if(typeof item==='function')return Promise.resolve().then(item).then(()=>true,()=>false);if(item instanceof Promise)return item.then(()=>true,()=>false);if(/\.(mp3|ogg|wav|m4a)$/i.test(item))return loadAudio(item);return loadImage(item)}
const isCached=url=>loaded.has(url);

const manifest=()=>root.ASSET_MANIFEST?.assets||[];
const byCategory=(...cats)=>manifest().filter(a=>cats.includes(a.category)&&a.status!=='missing').map(a=>a.file);   /* v98.347 · empty slots ('missing': no picture yet) were fetched → a pile of 404s in the console */
const uniq=list=>[...new Set(list.filter(Boolean))];
function heroFrames(){const t=root.TACTICS_SPRITES;if(!t?.directions)return[];const out=[];for(const p of Object.values(t.directions))for(const f of Object.values(p).flat())if(f?.src)out.push(f.src);return out}
const VILLAGE=['grass','paving','soil','meadow-details','garden-pond','props','fountain','player-house','inn','healer','shop','market','temple','forge'].map(f=>'assets/village-town/'+f+'.png').concat(['broadleaf','pine','old-oak'].map(f=>'assets/village-town/nature/'+f+'.webp'));
/* v98.1001 · + the CURRENT book picture (cardbook2-open) and its 20 page-turn frames (they were never in this list → the first flip blinked). v98.679 · the card book (สมุดผนึก) is the first thing the lesson opens: its pictures are fetched during the loading screen so it never pops in late */
const BOOK_ART=['assets/ui/cardbook2-open.webp',...Array.from({length:20},(_,i)=>'assets/ui/bookturn/turn-'+String(i+1).padStart(2,'0')+'.webp'),'assets/ui/cardbook-open.webp','assets/ui/grimoire-open.webp','assets/ui/close-x.webp','assets/icons/menu/cardbook.webp','assets/icons/menu/potion.webp','assets/icons/menu/battle.webp','assets/icons/menu/forge.webp','assets/icons/menu/treasure.webp','assets/icons/menu/mail.webp',...['items','equipment','materials','collection','quests'].map(k=>'assets/icons/menu/v2-'+k+'.webp'),'assets/cards/item/potion.webp','assets/cards/item/momWater.webp','assets/cursor/cursor-atlas.webp','assets/cursor/talk-atlas.webp','assets/cursor/walk-atlas.webp','assets/cursor/door-atlas.webp','assets/cursor/os-door.png','assets/cursor/os-door@2x.png','assets/ui/quest-marker.webp','assets/cursor/pointer.png','assets/cursor/pointer@2x.png','assets/cursor/grab.png','assets/cursor/grabbing.png','assets/cursor/zoom.png'];
/* v98.687 · all story portraits (~10 MB, stored once by the service worker) are fetched behind the Mip loading screen so a talk never shows a missing / previous face */
function portraitSet(){try{return uniq(root.StoryActors?.allFaces?.()||[])}catch(e){return[]}}
function villageSet(){return uniq([...VILLAGE,...heroFrames(),'assets/hero.webp','assets/home.webp','assets/market.webp','assets/workshop.webp',...['bag','upgrade','map','develop'].map(k=>'assets/ui-'+k+'.webp'),'assets/audio/bgm/bgm-village-festival-01.mp3',...BOOK_ART])}
// what a battle draws the moment it opens (measured: hero/ally frames, weapons, props, hand cards) — the loader waits for these
function battleCore(){return uniq(byCategory('tactics-hero','tactics-equipment','tactics-props','tactic-cards','allies','battle-scenery'))}
// the rest of the battle art — fetched quietly in the background after the village is up
function battleExtra(){return uniq([...byCategory('battle-ground-animation','battle-large-objects','battle-directional','ui-packs','elements'),...manifest().filter(a=>a.category==='unit-card-art'&&/\/u-/.test(a.file)).map(a=>a.file)])}
const kebab=k=>k.replace(/[A-Z]/g,m=>'-'+m.toLowerCase());
function enemySet(kinds){const files=manifest().map(a=>a.file);return uniq(kinds.flatMap(k=>files.filter(f=>f===`assets/enemies/${kebab(k)}.webp`||f===`assets/enemies/${kebab(k)}-back.webp`||f.startsWith(`assets/enemies/animations/${k}/`)&&/(idle|walk)/.test(f)||f.endsWith(`/portraits/en-${k}.webp`))))}
function areaKinds(area){const e=root.ADVENTURE_DATA?.AREAS?.[area]?.enemies;return e?uniq([...(e.normal||[]),...(e.elite||[]),e.miniboss,e.boss]):[]}

/* ---------- loading screen ---------- */
let screen=null;
function loadingScreen(){if(screen)return screen;const el=document.createElement('div');el.id='gameLoading';el.className='gl';el.hidden=true;el.setAttribute('role','progressbar');el.setAttribute('aria-valuemin','0');el.setAttribute('aria-valuemax','100');
 el.innerHTML='<div class="gl-bg"></div><div class="gl-box"><span class="gl-kicker">LOADING</span><h2 class="gl-title"></h2>'+(root.MipLoader?root.MipLoader.html({width:'min(560px,calc(100vw - 40px))',size:'clamp(76px,11vh,108px)'}):'')+'<div class="gl-bar"><i></i></div><div class="gl-meta"><span class="gl-step"></span><b class="gl-pct">0%</b></div><p class="gl-tip"><img class="gl-note-icon" src="assets/icons/menu/v2-help.webp" width="40" height="40" alt="เคล็ดลับ" title="เคล็ดลับ"><span class="gl-note-text"></span></p><p class="gl-lore"><img class="gl-note-icon" src="assets/icons/menu/v2-journal.webp" width="40" height="40" alt="เรื่องเล่าจากโลก" title="เรื่องเล่าจากโลก"><span class="gl-note-text"></span></p><button type="button" class="gl-skip" tabindex="-1" aria-hidden="true">เข้าเกมเลย · โหลดส่วนที่เหลือเบื้องหลัง</button></div>';
 document.body.appendChild(el);return screen=el}
function setProgress(el,f,step){const pct=Math.round(f*100);el.querySelector('.gl-bar i').style.width=pct+'%';el.querySelector('.gl-pct').textContent=pct+'%';el.setAttribute('aria-valuenow',pct);if(step!=null)el.querySelector('.gl-step').textContent=step}
/* run(title, groups[, {bg, minMs, quiet}]) — groups: [{label, items:[url|promise|fn]}]. quiet = only show if it takes >150ms */
let chain=Promise.resolve();
function run(title,groups,opt={}){const p=chain.then(()=>runNow(title,groups,opt));chain=p.catch(()=>{});return p}
async function runNow(title,groups,opt={}){const el=loadingScreen(),items=groups.flatMap(g=>g.items.map(it=>({it,label:g.label,share:g.share,n:g.items.length})));
 /* v98.675 · WEIGHTED BAR: a group may carry share (0–1) = the part of the bar it owns. The bar used to count items, so one big last item (building the village scene) sat at 97% for seconds.
    Now such a group owns e.g. 30 % of the bar and, while it is still running, its part CRAWLS up smoothly (never reaching the end until it is really done) — same total time, no long stall. */
 const sumShare=groups.reduce((a,g)=>a+(g.share&&g.items.length?g.share:0),0),others=items.filter(x=>!x.share).length;for(const x of items)x.w=x.share?x.share/x.n:(others?(1-sumShare)/others:0);
 let lastLabel='',doneW=0,shown=!opt.quiet,start=performance.now();const running=new Set();let shownF=0;
 const frac=()=>{let f=doneW;const now=performance.now();for(const x of running)f+=x.w*.93*(1-Math.exp(-(now-x.t0)/4500));shownF=Math.max(shownF,Math.min(.995,f));return shownF};
 el.querySelector('.gl-title').textContent=title;el.querySelector('.gl-tip .gl-note-text').textContent=TIPS[Math.floor(Math.random()*TIPS.length)];{const lo=el.querySelector('.gl-lore'),tx=pickLore(opt.lore0?0:loreLevel());lo.querySelector('.gl-note-text').textContent=tx||'';lo.hidden=!tx}el.querySelector('.gl-bg').style.backgroundImage=opt.bg?`url("${opt.bg}")`:'';setProgress(el,0,groups[0]?.label||'');
 const reveal=()=>{if(!el.hidden)return;el.hidden=false;el.classList.remove('gl-out');shown=true};if(shown)reveal();const timer=opt.quiet?setTimeout(reveal,150):0;
 // a few at a time, in order, so the bar moves steadily and the first scene's files come first
 const queue=items.slice(),workers=Array.from({length:Math.min(6,queue.length)},async()=>{while(queue.length){const x=queue.shift();x.t0=performance.now();if(x.share)running.add(x);await load(x.it);running.delete(x);doneW+=x.w;lastLabel=x.label;setProgress(el,frac(),x.label)}}),tick=setInterval(()=>setProgress(el,frac(),running.size?[...running][0].label:lastLabel),90);
 // a slow connection never traps the player: after 7 s offer to continue while the rest keeps loading in the background
 let release;const early=new Promise(r=>release=r),later=setTimeout(()=>{const b=el.querySelector('.gl-skip');b.classList.add('on');b.tabIndex=0;b.removeAttribute('aria-hidden');b.onclick=()=>release()},7000);
 await Promise.race([Promise.all(workers),early]);clearInterval(tick);clearTimeout(timer);clearTimeout(later);{const sk=el.querySelector('.gl-skip');sk.classList.remove('on');sk.tabIndex=-1;sk.setAttribute('aria-hidden','true')}
 if(shown){const left=(opt.minMs??0)-(performance.now()-start);if(left>0)await wait(left);setProgress(el,1,'พร้อมแล้ว');await wait(reduced?0:220);
  /* v98.230 · opt.gate: wait for any key / tap before leaving the loading screen — that press is also what unlocks the music (browsers only start sound after a gesture) */
  if(opt.gate){await wait(250);const tip=el.querySelector('.gl-tip');tip.querySelector('.gl-note-text').textContent=opt.gate;el.classList.add('gl-gate');await new Promise(res=>{const ev=['keydown','pointerdown','touchend'],done=e=>{if(e.type==='keydown'&&(e.repeat||['Shift','Control','Alt','Meta','CapsLock'].includes(e.key)))return;ev.forEach(n=>document.removeEventListener(n,done,true));e.stopPropagation();res()};ev.forEach(n=>document.addEventListener(n,done,true))});el.classList.remove('gl-gate')}
  el.classList.add('gl-out');await wait(reduced?0:380);el.hidden=true;el.classList.remove('gl-out')}
}

/* ---------- background prefetch of the next scenes ---------- */
let prefetchStarted=false;
function prefetch(list){const queue=list.filter(u=>!isCached(u));const idle=root.requestIdleCallback||(f=>setTimeout(()=>f({timeRemaining:()=>8}),60));
 const pump=()=>idle(async()=>{for(let i=0;i<2&&queue.length;i++)await load(queue.shift());if(queue.length)pump()});pump()}
function startPrefetch(){if(prefetchStarted)return;prefetchStarted=true;setTimeout(()=>{prefetch([...battleCore(),...battleExtra()]);const near=Object.keys(root.ADVENTURE_DATA?.AREAS||{}).filter(k=>(root.ADVENTURE_DATA.AREAS[k].tier||1)<=1);prefetch(uniq(near.flatMap(k=>['assets/scenes/area-'+k+'.webp',...enemySet(areaKinds(k))])))},1500)}

/* ---------- scene transitions: only cover the screen while something is still loading ---------- */
function hookScenes(){const A=root.Adventure;if(A?.enter&&!A.enter._loading){const base=A.enter;A.enter=function(area){const r=base.apply(this,arguments);const set=uniq(['assets/scenes/area-'+area+'.webp',...enemySet(areaKinds(area))]);if(set.some(u=>!isCached(u)))run(root.ADVENTURE_DATA?.AREAS?.[area]?.name||'ออกผจญภัย',[{label:'ฉากพื้นที่',items:set}],{quiet:true,bg:'assets/scenes/area-'+area+'.webp'});Gallery.unlock('scene-area-'+area);return r};A.enter._loading=true}
 if(typeof root.openTactical==='function'&&!root.openTactical._loading){const base=root.openTactical;root.openTactical=function(){const r=base.apply(this,arguments);setTimeout(()=>{const st=root.TacticsLab?.getState?.(),kinds=uniq((st?.units||[]).filter(u=>u.side==='enemy').map(u=>u.kind));const set=uniq([...battleCore(),...enemySet(kinds)]);if(set.some(u=>!isCached(u)))run('เตรียมสนามรบ',[{label:'ตัวละครและสนาม',items:battleCore()},{label:'ศัตรู',items:enemySet(kinds)}],{quiet:true})},0);return r};root.openTactical._loading=true}}

/* ---------- gallery: art unlocked by playing ---------- */
const Gallery={state(){const v=game()?.village;if(!v)return null;if(!Array.isArray(v.gallery))v.gallery=[];return v.gallery},
 unlock(id){const g=this.state();if(g&&id&&!g.includes(id)){g.push(id);doSave()}},
 track(){const st=root.TacticsLab?.getState?.(),layer=document.getElementById('tacticsLayer');if(layer&&!layer.hidden&&st?.units)for(const u of st.units)if(u.side==='enemy'&&u.kind)this.unlock('card-en-'+u.kind);for(const c of game()?.village?.companions||[])if(c?.key)this.unlock('card-u-'+c.key)},
 entries(){const g=this.state()||[],out=[],a=manifest(),add=(group,id,file,name,open)=>out.push({group,id,file,name,open});
  for(const x of a.filter(x=>x.category==='scenes')){const always=['scene-home','scene-market','scene-workshop'].includes(x.id);add('ฉากและสถานที่',x.id,x.file,x.subject||x.id,always||g.includes(x.id))}
  for(const x of a.filter(x=>x.category==='unit-card-art')){const hero=x.id==='card-hero';add(/card-en-/.test(x.id)?'มอนสเตอร์ที่เคยพบ':'ตัวละคร',x.id,x.file,'',hero||g.includes(x.id))}
  return out}};
root.GameGallery=Gallery;

/* ---------- title menu ---------- */
let title=null,busyTitle=false;
function saveSummary(){if(!saved)return'';const v=saved.village||{},h=Math.floor((saved.minutes||480)/60),m=(saved.minutes||480)%60;return `${esc(v.heroName||'นักผจญภัย')} · วันที่ ${saved.day||1} · ${h}:${String(m).padStart(2,'0')}${v.character?.level?' · Lv.'+v.character.level:''}`}
/* v98.674 · same as Ctrl+F5 from a button: refetch the page itself past the HTTP cache (its ?v= numbers pull the new scripts) and ask the service worker to forget the stored pictures; saves are untouched (localStorage) */
/* v98.1062 · the GitHub commit shows up at once but GitHub Pages needs ~2 minutes to publish it: reloading in between just brings the old build back (the "new version" button looked broken). Wait until js/game-version.js on the server really carries the new number, then reload. */
async function hardReload(want,btn){const num=x=>{const m=String(x).match(/(\d+)(?:\.(\d+))?/);return m?+m[1]*10000+(+m[2]||0):0};
 if(want&&root.fetch){const t0=Date.now();while(Date.now()-t0<240000){let live='';try{const r=await fetch('js/game-version.js?t='+Date.now(),{cache:'no-store'});live=((await r.text()).match(/v:'(v[\d.]+)'/)||[])[1]||''}catch(e){}if(live&&num(live)>=num(want))break;if(btn)btn.textContent='⏳ รอ GitHub เผยแพร่เวอร์ชันใหม่… '+Math.round((Date.now()-t0)/1000)+' วิ';await wait(4000)}}
 try{await fetch(location.pathname+location.search,{cache:'reload'})}catch(e){}try{const rs=await navigator.serviceWorker?.getRegistrations?.();for(const r of rs||[])await r.update()}catch(e){}location.reload()}
// the newest commit on GitHub main — shows whether this browser runs the latest push (or needs Ctrl+F5)
function checkGitHub(el){const box=el.querySelector('.ts-gh'),repo=root.GAME_VERSION?.repo;if(!box||!repo||!root.fetch)return;
 /* v98.1064 · the published copy of js/game-version.js is the real "is there a newer build" answer: the GitHub API answer was cached for 30 minutes (the menu kept saying "up to date" long after a push) */
 setTimeout(()=>{fetch('js/game-version.js?t='+Date.now(),{cache:'no-store'}).then(r=>r.ok?r.text():'').then(t=>{const live=(String(t).match(/v:'(v[\d.]+)'/)||[])[1]||'',n=x=>{const m=String(x).match(/(\d+)(?:\.(\d+))?/);return m?+m[1]*10000+(+m[2]||0):0};if(!live||n(live)<=n(VERSION)||box.querySelector('button'))return;
  box.textContent='· มีเวอร์ชันใหม่ '+live+' — ';box.classList.add('ts-gh-new');const b=document.createElement('button');b.type='button';b.textContent='↻ โหลดเวอร์ชันใหม่';b.style.cssText='margin-left:6px;padding:2px 10px;min-height:0;border:1px solid #d8b46a;border-radius:999px;background:#2a1a0c;color:#ffe9b8;font:inherit;cursor:pointer';b.onclick=e=>{e.stopPropagation();b.disabled=true;hardReload(live,b)};box.appendChild(b)}).catch(()=>{})},1500);
 /* v98.784 · GitHub allows 60 anonymous calls / hour / IP (a 403 was seen on every title screen): the answer is kept for 30 minutes */
 (()=>{try{const k='gh-latest-v1',o=JSON.parse(localStorage.getItem(k)||'null');if(o&&o.repo===repo&&Date.now()-o.t<18e4)return Promise.resolve(o.c)}catch(e){}
  return fetch('https://api.github.com/repos/'+repo+'/commits/main',{headers:{Accept:'application/vnd.github+json'}}).then(r=>r.ok?r.json():null).then(c=>{try{if(c?.sha)localStorage.setItem('gh-latest-v1',JSON.stringify({repo,t:Date.now(),c:{sha:c.sha,commit:{message:c.commit?.message,committer:{date:c.commit?.committer?.date}}}}))}catch(e){}return c})})().then(c=>{if(!c?.sha){box.textContent='';return}
  const msg=c.commit?.message||'',v=(msg.match(/^v\d+(\.\d+)?/)||[''])[0],sha=c.sha.slice(0,7),d=new Date(c.commit?.committer?.date||Date.now()),when=d.toLocaleString('th-TH',{dateStyle:'medium',timeStyle:'short'});
  const num=x=>{const m=String(x).match(/(\d+)(?:\.(\d+))?/);return m?+m[1]*10000+(+m[2]||0):0},same=!v||num(v)<=num(VERSION);box.textContent=same?(v&&num(v)===num(VERSION)?`· ล่าสุดแล้ว (${sha})`:`· GitHub ${v||'—'} (${sha})`)+` · อัปเดต ${when}`:`· มีเวอร์ชันใหม่ ${v} (${sha}) — `;box.classList.toggle('ts-gh-new',!same);box.title=msg.split('\n')[0];if(!same){const b=document.createElement('button');b.type='button';b.textContent='↻ โหลดเวอร์ชันใหม่';b.style.cssText='margin-left:6px;padding:2px 10px;min-height:0;border:1px solid #d8b46a;border-radius:999px;background:#2a1a0c;color:#ffe9b8;font:inherit;cursor:pointer';b.onclick=e=>{e.stopPropagation();b.disabled=true;hardReload(v,b)};box.appendChild(b)}}).catch(()=>{box.textContent=''})}
function buildTitle(){const el=document.createElement('div');el.id='titleScreen';el.className='ts'+(!newGame&&!reduced?' ag-intro-pending':'');
 el.innerHTML=`<div class="ts-bg"></div><div class="ts-veil"></div><div class="ts-motes" aria-hidden="true">${'<i></i>'.repeat(18)}</div>
 <div class="ts-main"><div class="ts-brand"><span class="ts-kicker">AGRENOR · TACTICAL CARD ADVENTURE</span><h1>Agrenor: Paths Unwritten</h1><p>ไพ่และการผจญภัย</p></div>
 <nav class="ts-menu" aria-label="เมนูหลัก">
  <button data-act="new"><span>New Game</span><small>เริ่มเกมใหม่</small></button>
  <button data-act="continue" ${hasSave?'':'disabled hidden'}><span>Continue</span><small>${hasSave?saveSummary():'ยังไม่มีเซฟ'}</small></button>
  ${(()=>{if(root.RunSlots)return root.RunSlots.anyRun()?`<button data-act="load"><span>Load</span><small>เลือก Run · เซฟอัตโนมัติ / เซฟมือ</small></button>`:'';const n=[1,2,3].filter(i=>{try{return !!localStorage.getItem('projectA.slot.'+i)}catch(e){return false}}).length;return n?`<button data-act="load"><span>Load</span><small>โหลดจากช่องเซฟ (${n} ช่อง)</small></button>`:''})()}
  ${(()=>{try{return DEV&&root.RunSlots?.tm?.list().length?`<button data-act="tm"><span>⏪ ย้อนโปรเกรส</span><small>เช็กพอยต์เควส (dev) · ${root.RunSlots.tm.list().length} จุด</small></button>`:''}catch(e){return ''}})()}
  <button data-act="options"><span>Options</span><small>ตั้งค่าเกม</small></button>
  <button data-act="extra"><span>Extra</span><small>วิธีเล่น · คลังภาพ · เครดิต</small></button>
  <div class="ts-tools" ${DEV?'':'hidden'}><a href="editor.html" target="_blank" rel="noopener" title="แก้ภาพ/แอนิเมชัน การ์ด แผนที่ สนามต่อสู้ (เปิดแท็บใหม่)"><img src="assets/icons/menu/v2-editor.webp" alt="" draggable="false">Editor</a></div>
 </nav></div>
 <div class="ts-foot"><span class="ts-ver">Project A ${VERSION}${root.GAME_VERSION?.date?" · "+root.GAME_VERSION.date:""} <em class="ts-gh">· กำลังเช็ก GitHub…</em></span><span>↑↓ เลือก · Enter ยืนยัน</span></div>
 <section class="ts-extra" hidden aria-label="Extra"><div class="ts-extra-box"><div class="ts-extra-head"><div class="ts-tabs" role="tablist"><button role="tab" data-tab="howto"><img src="assets/icons/menu/v2-help.webp" alt="" draggable="false">วิธีเล่น</button><button role="tab" data-tab="gallery"><img src="assets/icons/menu/v2-gallery.webp" alt="" draggable="false">คลังภาพ</button><button role="tab" data-tab="credits"><img src="assets/icons/menu/v2-credits.webp" alt="" draggable="false">เครดิต</button></div><button class="ts-close" data-act="close-extra" aria-label="กลับเมนูหลัก" title="กลับเมนูหลัก"><img src="assets/icons/menu/v2-quit-title.webp" alt="" width="30" height="30" draggable="false"></button></div><div class="ts-extra-body"></div></div></section>
 <section class="ts-story" hidden aria-live="polite"><div class="ts-story-bg"></div><canvas class="ts-story-art"></canvas><div class="ts-story-veil"></div><div class="ts-story-text"></div><div class="ts-story-hint">คลิก หรือกด Enter เพื่อไปต่อ</div><button class="ts-skip" data-act="skip">ข้าม ▸▸</button>
  <form class="ts-name" hidden novalidate>
   <i class="ts-c ts-c1"></i><i class="ts-c ts-c2"></i><i class="ts-c ts-c3"></i><i class="ts-c ts-c4"></i>
   <span class="ts-kicker">ตัวเอกของเรื่อง · สองพี่น้อง</span><h2>เจ้าสองพี่น้องชื่ออะไร?</h2>
   <div class="ts-orn"><i></i><b>✦</b><i></i></div>
   <p class="ts-sub">แตะการ์ดเพื่อเลือกตัวเอกนำ · อีกคนเป็นผู้ติดตามในทีมเสมอ</p>
   <div class="ts-cols">
    <div class="ts-col" data-g="female"><button type="button" class="ts-g" data-g="female" role="radio" aria-checked="false"><span class="ts-gframe"><img src="assets/portraits/hero-female-neutral.webp" alt="" draggable="false"></span><em class="ts-tag"></em><b>น้องสาว</b><small>แตะเพื่อเลือก</small></button>
     <label class="ts-nm" data-g="female"><span>ชื่อน้องสาว</span><span class="ts-inw"><input name="heroF" maxlength="16" autocomplete="off" spellcheck="false" placeholder="ตั้งชื่อน้องสาว"><button type="button" class="ts-edit" aria-label="แก้ชื่อ">✎</button></span></label></div>
    <div class="ts-col" data-g="male"><button type="button" class="ts-g" data-g="male" role="radio" aria-checked="false"><span class="ts-gframe"><img src="assets/portraits/hero-male-neutral.webp" alt="" draggable="false"></span><em class="ts-tag"></em><b>พี่ชาย</b><small>แตะเพื่อเลือก</small></button>
     <label class="ts-nm" data-g="male"><span>ชื่อพี่ชาย</span><span class="ts-inw"><input name="heroM" maxlength="16" autocomplete="off" spellcheck="false" placeholder="ตั้งชื่อพี่ชาย"><button type="button" class="ts-edit" aria-label="แก้ชื่อ">✎</button></span></label></div>
   </div>
   <p class="ts-need" role="status" aria-live="polite"></p>
   <button type="submit" class="ts-go" disabled>เริ่มการผจญภัย</button></form></section>`;
 document.body.appendChild(el);title=el;checkGitHub(el);
 const menu=[...el.querySelectorAll('.ts-menu button')];
 el.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(b)act(b.dataset.act)});
 el.querySelector('.ts-tabs').addEventListener('click',e=>{const b=e.target.closest('[data-tab]');if(b)tab(b.dataset.tab)});
 el.addEventListener('keydown',e=>{if(!el.querySelector('.ts-extra').hidden&&e.key==='Escape'){e.preventDefault();act('close-extra');return}
  if(!el.querySelector('.ts-story').hidden||!el.querySelector('.ts-extra').hidden)return;const live=menu.filter(b=>!b.disabled),i=live.indexOf(document.activeElement);
  if(e.key==='ArrowDown'||e.key==='ArrowUp'){e.preventDefault();const n=(i+(e.key==='ArrowDown'?1:-1)+live.length)%live.length;live[n<0?0:n].focus()}});
 (hasSave?menu[1]:menu[0]).focus({preventScroll:true})}
/* v95.08 · New Game and Continue always play full screen (+ landscape on phones), and it stays for the whole game until the player leaves it
   with an in-game button or Esc. sessionStorage 'project-a-fs' remembers the choice: '1' while playing full screen, '0' once the player left it.
   A page reload (New Game over an old save, importing a save) drops full screen in every browser, so while the flag is '1' the very next
   tap or key takes it back. */
const FS_KEY='project-a-fs';
const fsWanted=()=>{try{return sessionStorage.getItem(FS_KEY)==='1'}catch{return false}};
const fsSet=v=>{try{sessionStorage.setItem(FS_KEY,v)}catch{}};
const fsEl=()=>document.fullscreenElement||document.webkitFullscreenElement;
function goFull(){try{fsSet('1');try{screen.orientation?.lock?.('landscape').catch(()=>{})}catch{}if(fsEl())return;const d=document.documentElement,f=d.requestFullscreen||d.webkitRequestFullscreen;if(f){const r=f.call(d,{navigationUI:'hide'});r?.then?.(()=>{try{screen.orientation?.lock?.('landscape').catch(()=>{})}catch{}})?.catch?.(()=>{})}}catch{}}
root.goFullscreen=goFull;
for(const ev of ['fullscreenchange','webkitfullscreenchange'])document.addEventListener(ev,()=>{fsSet(fsEl()?'1':'0')});   // leaving (Esc / the in-game button) is remembered; a reload fires nothing
/* v98.200 · New Game no longer goes fullscreen by itself (user request); Continue still does, and the in-game fullscreen button works as before */
{const back=e=>{if(!fsWanted()||fsEl())return;goFull()};addEventListener('pointerdown',back,true);addEventListener('keydown',e=>{if(e.key!=='Escape')back(e)},true)}
async function act(a){if(busyTitle)return;
 /* v97.05 · New Game over a save asks first and then reloads (which leaves fullscreen anyway); going fullscreen before the question made the dialog jump. The reload re-enters fullscreen on the next click */
 /* v98.341 · Continue no longer goes fullscreen by itself (user request); the in-game fullscreen button still works */
 if(a==='new'){const go=async n=>{if(n)try{root.RunSlots.beginNew(n)}catch{}/* v98.1055 · the chosen Run slot becomes active; the previous run keeps its saves */
   if(hasSave){try{localStorage.setItem('three-card-forge-before-newgame',localStorage.getItem(SAVE)||'')}catch{}}
   if(hasSave){try{localStorage.removeItem(SAVE);localStorage.removeItem(STARTED);for(const k of ['agrenor-world-v1','agrenor-mind-v1','agrenor-clock-v1','agrenor-standalone-v1'])localStorage.removeItem(k);sessionStorage.setItem(NEW_FLAG,'1')}catch{}busyTitle=true;title.classList.add('ts-out');await wait(reduced?0:300);location.reload();return}
   prepareStory()};
  if(root.RunSlots){root.RunSlots.ui('new',n=>go(n));return}
  if(hasSave){const ok=await (root.GameDialog?root.GameDialog.confirm('เริ่มเกมใหม่?\nความคืบหน้าในเซฟปัจจุบันจะถูกแทนที่ (ระบบเก็บสำเนาเซฟเดิมไว้ให้ 1 ชุด) · การ์ดที่ออกแบบและผังหมู่บ้านยังอยู่'):Promise.resolve(root.confirm('เริ่มเกมใหม่?')));if(!ok)return}
  go(0);return}
 if(a==='continue'&&hasSave){enter(false);return}
 if(a==='load'){if(root.RunSlots)root.RunSlots.ui('load');else root.ConsoleUI?.slotMenu('load');return}
 if(a==='tm'){root.RunSlots?.tm?.ui();return}
 if(a==='options'){if(typeof root.openSettings==='function')root.openSettings();return}
 if(a==='extra'){title.querySelector('.ts-extra').hidden=false;tab('howto');return}
 if(a==='close-extra'){title.querySelector('.ts-extra').hidden=true;title.querySelector('[data-act="extra"]').focus();return}
 if(a==='skip'){storyEnd();return}}
function tab(id){const box=title.querySelector('.ts-extra-body');title.querySelectorAll('.ts-tabs button').forEach(b=>b.setAttribute('aria-selected',String(b.dataset.tab===id)));
 if(id==='howto')box.innerHTML=`<dl class="ts-howto">${HOWTO.map(([h,t])=>`<dt>${esc(h)}</dt><dd>${esc(t)}</dd>`).join('')}</dl>`;
 else if(id==='credits')box.innerHTML=`<dl class="ts-credits">${CREDITS.map(([h,t])=>`<dt>${esc(h)}</dt><dd>${esc(t)}</dd>`).join('')}</dl>`;
 else{const list=Gallery.entries(),groups=[...new Set(list.map(x=>x.group))],open=list.filter(x=>x.open).length;
  box.innerHTML=`<p class="ts-gal-count">ปลดล็อกแล้ว ${open} / ${list.length} ภาพ · ภาพใหม่ปลดเมื่อไปพื้นที่ใหม่ เจอมอนสเตอร์ หรือได้เพื่อนร่วมทีม</p>`+groups.map(g=>`<h3>${esc(g)}</h3><div class="ts-gal">${list.filter(x=>x.group===g).map(x=>x.open?`<button class="ts-gal-item" data-src="${esc(x.file)}" title="${esc(x.name)}"><img loading="lazy" src="${esc(x.file)}" alt="${esc(x.name)}"></button>`:'<div class="ts-gal-item locked" aria-label="ยังไม่ปลดล็อก">?</div>').join('')}</div>`).join('');
  box.querySelectorAll('[data-src]').forEach(b=>b.onclick=()=>{const v=document.createElement('div');v.className='ts-viewer';v.innerHTML=`<img src="${b.dataset.src}" alt="">`;v.onclick=()=>v.remove();title.appendChild(v)})}}

/* ---------- prologue ---------- */
let page=-1,art=null;
function artPlayer(st){if(art)return art;const c=st.querySelector('.ts-story-art');if(!c||!root.SceneArt)return null;art=root.SceneArt.create(c);return art}
function story(){try{queueMicrotask(()=>root.GameBGM?.refresh?.())}catch{}prologueDone=false;busyTitle=true;const st=title.querySelector('.ts-story');layersOf(st).forEach(o=>o.remove());curImg=null;st.hidden=false;title.classList.add('ts-in-story');page=-1;busyTitle=false;
 st.onclick=e=>{if(e.target.closest('.ts-skip,.ts-name'))return;next()};
 st.onkeydown=e=>{if(prologueDone||e.target.closest('.ts-name'))return;if(e.key==='Enter'||e.key===' '){e.preventDefault();next()}else if(e.key==='Escape'){e.preventDefault();storyEnd()}};
 st.tabIndex=-1;st.focus();next()}
/* v95.05 · Thai reads best word by word (Intl.Segmenter), never letter by letter */
const seg=(()=>{try{return new Intl.Segmenter('th',{granularity:'word'})}catch{return null}})();
const wordsOf=t=>seg?[...seg.segment(t)].map(x=>x.segment):t.split(/(\s+)/);
let revealUntil=0;
/* v95.07 · pacing: words inside a phrase run quickly; a space (Thai phrase/sentence break) holds a beat, "…" and ?/! hold longer, a new line longest */
const PACE={word:.05,perChar:.012,maxWord:.16,space:.38,ellipsis:.6,mark:.45,line:.7};
function pauseAfter(w){if(/^\s+$/.test(w))return PACE.space;let p=Math.min(PACE.maxWord,PACE.word+[...w].length*PACE.perChar);if(/(…|\.\.\.)$/.test(w))p+=PACE.ellipsis;else if(/[?!]$/.test(w))p+=PACE.mark;return p}
/* v98.179 · prologue pages use the shared DialogueFX typer (rapid typing + voice, split at sentence ends if a page would overflow) instead of the per-word CSS fade */
let TS=null;
function reveal(box,text){TS?.stop();box.innerHTML='';box.classList.add('ts-all');const cs=getComputedStyle(box),lh=parseFloat(cs.lineHeight)||parseFloat(cs.fontSize)*1.55,lines=Math.max(3,Math.min(8,Math.floor(innerHeight*.58/lh)));const hint=box.parentElement?.querySelector('.ts-story-hint');TS=root.DialogueFX.create(box,{maxLines:lines,voice:null,fade:true,onPageStart:()=>{if(hint)hint.style.visibility='hidden'},onPageDone:()=>{if(hint)hint.style.visibility=''}});TS.load([String(text)]);TS.start()}
/* v98.187 · New Game pictures are stacked layers (one per page). A new layer plays a mood transition (fx-* in css/title-screen.css) over the previous one;
   when it finishes the old layers go. A page without a picture shows the "Waiting for Pic" board. The old SceneArt path is kept for the legacy prologue and the BRIDGE page. */
let curImg=null;
const layersOf=st=>[...st.querySelectorAll('.ts-story-layer')];
function placeholderHTML(label){return '<div class="ts-wait"><b>Waiting for Pic</b><small>'+esc(label||'')+'</small></div>'}
function showPage(p){const st=title.querySelector('.ts-story'),box=st.querySelector('.ts-story-text'),bg=st.querySelector('.ts-story-bg'),pa=artPlayer(st);
 if(p.bg||p.placeholder){
  const key=p.placeholder?'wait:'+(p.prologueId||''):p.bg,same=key===curImg&&layersOf(st).length;
  if(same){st.classList.remove('ts-glow');if(p.fx==='glow'&&!reduced){void st.offsetWidth;st.classList.add('ts-glow')}}
  else{
   pa?.stop?.();bg.style.backgroundImage='none';bg.classList.remove('ts-pan');
   const old=layersOf(st),L=document.createElement('div'),fx=reduced?'none':(p.fx&&p.fx!=='same'&&p.fx!=='glow'?p.fx:'fade');
   L.className='ts-story-layer fx-'+fx+(p.placeholder?' ts-layer-wait':'');
   if(p.placeholder)L.innerHTML=placeholderHTML(p.label);else{L.style.backgroundImage='url("'+p.bg+'")';if(p.pos)L.style.backgroundPosition=p.pos}
   st.querySelector('.ts-story-veil').before(L);curImg=key;
   const done=()=>{if(!L.isConnected)return;old.forEach(o=>o.remove());L.classList.add('fx-done')};
   L.addEventListener('animationend',e=>{if(e.target===L&&/^fx-/.test(e.animationName))done()});setTimeout(done,fx==='none'?0:3200);
  }
 }else if(pa&&p.art&&pa.show(p.art)){layersOf(st).forEach(o=>o.remove());curImg=null;bg.style.backgroundImage='none';bg.classList.remove('ts-pan')}
 reveal(box,p.text)}
let prologueDone=false;   /* v98.201 · once the name form is up (skip button or last page) clicks / keys must NOT advance the prologue any more */
function next(){const st=title.querySelector('.ts-story'),box=st.querySelector('.ts-story-text');
 if(prologueDone)return;if(TS&&TS.busy())return;/* v98.232 · a press is ignored while the page is still being typed; it only works once the whole passage of the scene has been shown (the ข้าม button still skips everything) */if(TS&&TS.hasMore()){TS.nextPage();return}/* v98.216 · a press never waits for the typing: it cuts it and goes straight on to the next page / scene */ // press shows the next page of a long passage
 page++;if(page>=PROLOGUE.length){storyEnd();return}showPage(PROLOGUE[page])}
function storyEnd(){if(prologueDone)return;prologueDone=true;TS?.stop();TS=null;const st=title.querySelector('.ts-story'),f=st.querySelector('.ts-name');st.querySelector('.ts-story-text').textContent='';st.querySelector('.ts-story-hint').hidden=true;st.querySelector('.ts-skip').hidden=true;f.hidden=false;
 const inputs={male:f.elements.heroM,female:f.elements.heroF},saved=game()?.village?.heroNames||{};inputs.male.value=saved.male||'Arz';inputs.female.value=saved.female||'Liz';   /* default names Arz / Liz (editable) · nothing is picked by default: the start button stays locked until a hero is chosen (and both names are non-empty) */
 /* v98.230 · both heroes are named here: the picked one is the lead, the other is the younger sibling who follows */
 let look=null;const go=f.querySelector('.ts-go'),need=f.querySelector('.ts-need');
 const gbtn=[...f.querySelectorAll('.ts-g')];
 const refresh=()=>{const nm=g=>inputs[g].value.trim();const miss=[];if(!look)miss.push('เลือกตัวเอกนำ');if(!nm('female'))miss.push('ตั้งชื่อน้องสาว');if(!nm('male'))miss.push('ตั้งชื่อพี่ชาย');go.disabled=miss.length>0;f.classList.toggle('ts-ready',!miss.length);need.textContent=miss.length?'ยังต้อง: '+miss.join(' · '):'พร้อมแล้ว · กดเริ่มการผจญภัยได้เลย'};
 const pick=g=>{look=g;f.classList.add('ts-picked');gbtn.forEach(b=>{const on=b.dataset.g===g;b.classList.toggle('on',on);b.classList.toggle('off',!on);b.setAttribute('aria-checked',on?'true':'false');b.querySelector('.ts-tag').textContent=on?'✦ ตัวเอกนำ':'ผู้ติดตาม';b.querySelector('small').textContent=on?'ผู้เล่นควบคุมคนนี้':'ติดตามตัวเอกนำเสมอ'});refresh()};
 refresh();setTimeout(()=>gbtn[0]?.focus({preventScroll:true}),30);
 gbtn.forEach(b=>b.addEventListener('click',()=>{pick(b.dataset.g);if(!inputs[b.dataset.g].value.trim())inputs[b.dataset.g].focus()}));
 f.querySelectorAll('.ts-edit').forEach(b=>b.addEventListener('click',()=>{const i=b.previousElementSibling;i.focus();i.select()}));   /* v98.335 · the pencil: this name can be changed */
 for(const i of Object.values(inputs)){i.addEventListener('focus',()=>i.select());i.addEventListener('input',refresh)}   /* the name fields live outside the picker: typing a name never changes who you play */
f.onsubmit=async e=>{e.preventDefault();refresh();if(go.disabled||!look)return;const nm=(v,d)=>v.trim().slice(0,16)||d,nameM=nm(inputs.male.value,'Arz'),nameF=nm(inputs.female.value,'Liz'),n=look==='male'?nameM:nameF,sib=look==='male'?nameF:nameM;if(game()?.village){const v=game().village;v.heroName=n;v.siblingName=sib;v.heroNames={male:nameM,female:nameF};doSave()}root.HeroIdentity?.syncHeroName?.();try{root.HeroVariant?.set?.(look);root.HeroVariant?.apply?.(look);root.dispatchEvent(new CustomEvent('hero-look-changed',{detail:look}));const tf=document.querySelector('#villageTownLayer iframe');tf?.contentWindow?.HeroVariant?.set?.(look);tf?.contentWindow?.HeroVariant?.apply?.(look)}catch{}
  f.hidden=true;showPage({...BRIDGE,text:BRIDGE.text.replace('{hero}',n).replace('{sib}',sib)});st.onclick=null;st.onkeydown=null;await wait(reduced?600:4200);enter(true)}}

/* ---------- v95.02 · New Game: load everything first, then play the prologue (no stutter while the game page and the town frame are still loading) ---------- */
const fonts=()=>[()=>loadFont('VillageThai','assets/village-town/noto-sans-thai-thai-400-normal.woff2'),()=>document.fonts?.ready];
const pageLoaded=()=>document.readyState==='complete'?Promise.resolve():Promise.race([new Promise(r=>root.addEventListener('load',r,{once:true})),wait(15000)]);
const settle=()=>new Promise(r=>{let n=0;const f=()=>++n>=12?r():requestAnimationFrame(f);requestAnimationFrame(f)});   // a few quiet frames after the heavy work
let storyReady=false,preparing=false;
async function prepareStory(){if(preparing)return;preparing=true;title.classList.add('ts-quick','ts-story-pre');try{root.GameBGM?.refresh?.()}catch{}   /* v98.213 · switch the music NOW (the 100 ms timer can be starved while the village frame loads) */   /* v98.201 · the menu stays hidden behind the loading screen (it flashed up before the first picture) */
 await run('กำลังเตรียมบทนำ',[{label:'ฟอนต์',items:fonts()},{label:'ฉากบทนำ',items:[()=>root.SceneArt?.warm?.()]},{label:'เพลงบทนำ',items:[()=>root.GameBGM?.preloadPrologue?.()]},{label:'หมู่บ้าน',items:villageSet()},{label:'ตัวละครและบทสนทนา',items:portraitSet()},{label:'สร้างฉากหมู่บ้าน',items:[Promise.race([whenTownDrawn(),wait(16000)])]},{label:'เตรียมเกม',items:[()=>pageLoaded().then(settle)]}],{minMs:900,gate:'กดปุ่มใดก็ได้เพื่อไปต่อ',lore0:true});
 storyReady=true;story()}


/* ---------- into the game ---------- */
async function enter(isNew){if(busyTitle)return;busyTitle=true;try{localStorage.setItem(STARTED,'1')}catch{}
 if(!isNew&&title)title.style.visibility='hidden';   /* v98.352 · the menu must not show again while the loading screen fades out */
 if(!(isNew&&storyReady))   /* v98.1060 · New Game: everything was already loaded by the prologue loading screen, so no second loading screen after the name form */
 await run(isNew?'เริ่มต้นการผจญภัย':'กำลังโหลดเซฟ',[{label:'ฟอนต์',items:fonts()},{label:'หมู่บ้าน',items:villageSet()},{label:'ตัวละครและบทสนทนา',items:portraitSet()},{label:'สร้างฉากหมู่บ้าน',share:.3,items:[Promise.race([whenTownDrawn(),wait(16000)])]},...(isNew?[]:[{label:'กลับไปที่เดิม',items:[Promise.race([Promise.resolve(root.Resume?.prepare?.()).catch(()=>{}),wait(16000)])]}])],{bg:'assets/home.webp',minMs:storyReady?0:isNew?900:500,quiet:storyReady,lore0:isNew});
 /* v97.04 · New Game: the opening cutscene (mother wakes the hero) fades in over the last prologue page and the title goes away underneath it,
    so the village map never shows in between (the story loop only starts a cutscene once T.active is false) */
 if(isNew&&root.Story&&root.Cutscene){T.active=false;const t0=Date.now();while(!root.Cutscene.isPlaying()&&Date.now()-t0<4000)await wait(100);if(root.Cutscene.isPlaying())await wait(reduced?0:600)}
 title.classList.add('ts-out');document.documentElement.classList.remove('title-boot');T.active=false;await wait(reduced?0:450);art?.stop();art=null;title.remove();
 try{if(typeof render==='function')render()}catch{}root.VillageTown?.sync?.();root.GameBGM?.refresh?.();startPrefetch();
 if(!isNew&&game()?.village&&!game().village.heroName)root.HeroIdentity?.askHeroName?.(true)}

function boot(){hookScenes();setInterval(()=>Gallery.track(),2000);
 if(skip){startPrefetch();return}
 buildTitle();loadImage('assets/scenes/area-forest.webp');for(const p of PROLOGUE)if(p.bg&&(!p.art||!root.SceneArt))loadImage(p.bg);
 if(newGame)prepareStory()}
// the title is built once every game script ran (DOMContentLoaded — not window load, which waits for the town frame) (settings, adventure, battle hooks exist by then)
if(document.readyState!=='loading')boot();else document.addEventListener('DOMContentLoaded',boot);
T.run=run;T.load=load;T.prefetch=prefetch;T.sets={village:villageSet,battle:battleCore,battleExtra,enemies:enemySet,area:areaKinds};
root.GameLoader=T;
})(globalThis);
