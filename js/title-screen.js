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
const PROLOGUE=[// v95.09: the creator's script (v2, sections ก–ช) — no map with names, no reveal of where people came from, no god appears
 // v95.12: a vague legend first — told like an old tale some peoples keep
 {art:'ruins',text:'มีนิทานเก่าเรื่องหนึ่ง ที่บางเผ่ายังเล่าสืบกันมา\nว่าครั้งหนึ่ง โลกใบนี้เคยเป็นของผู้คนที่เก่าแก่ยิ่งกว่าใคร'},
 {art:'deepwood',text:'พวกเขาอาศัยอยู่ในป่าลึก ที่แสงจันทร์แทบส่องไม่ถึง\nจนวันหนึ่ง ก็พากันเดินออกมา'},
 {art:'crystals',text:'ในมือของพวกเขามีผลึกที่เรืองแสงดั่งดวงดาว\nแล้วผลึกนั้นก็แตกออกเป็นแสงหลากสี ร้อนดั่งไฟ เย็นดั่งน้ำแข็ง เงียบงันดั่งราตรี'},
 {art:'journey',text:'แสงเหล่านั้นล่องลอยไปทั่วแผ่นดิน\nที่ใดที่แสงตกลง ที่นั่นธาตุก็ตื่นขึ้น'},
 {art:'ancient',text:'นิทานเรื่องนี้จะจริงแค่ไหน คงไม่มีใครตอบได้\nมีเพียงหินบางก้อนใต้รากไม้ ที่ยังเรืองแสงเบา ๆ ราวกับจำได้'},
 {art:'trails',text:'นานมาแล้ว ผู้คนออกเดินทางไปทั่วผืนพิภพ\nข้ามขุนเขา ล่องตามสายน้ำ'},
 {art:'trails',text:'บ้างตามหาผืนดินที่ตอบรับความเชื่อของตน\nบ้างพบหนทางใหม่ระหว่างทาง'},
 {art:'settle',text:'แล้วหยั่งรากลงในดินแดนที่แตกต่างกัน\nแต่ละถิ่นจึงมีเรื่องราวของตนเอง'},
 {art:'eras',text:'รุ่นแล้วรุ่นเล่า รูปลักษณ์ ภาษา และวิถีชีวิต\nค่อย ๆ ต่างไปจากบรรพบุรุษ'},
 {art:'realmsWide',text:'ถิ่นฐานเติบโตเป็นเมือง บางเมืองรวมกันเป็นอาณาจักร\nโลกจึงเต็มไปด้วยผู้คนหลากเผ่าพันธุ์'},
 {art:'inscription',text:'ทว่า ไม่ใช่ทุกเรื่องราวจะเดินทางมาถึงวันนี้\nชื่อบางชื่อเลือนหาย และความจริงบางอย่างถูกเล่าต่อจนกลายเป็นตำนาน'},
 {art:'study',text:'ยังมีผู้ขุดหาคำตอบจากจารึกใต้ผืนดิน\nแต่สิ่งที่พบ บางครั้งกลับทิ้งคำถามไว้มากกว่าเดิม'},
 {art:'temple',text:'ศรัทธาในสามมหาเทพยังคงสืบทอด\nเคียงข้างผู้พิทักษ์ที่แต่ละถิ่นเคารพ'},
 {art:'shrines',text:'บางแห่งสร้างวิหารสูงใหญ่\nบางแห่งวางเครื่องบูชาไว้ใต้ต้นไม้ข้างทาง'},
 {art:'treeline',text:'แต่ยังมีดินแดนที่ผู้คนรู้จักจากเรื่องเล่า มากกว่าการเดินทาง\nในมหาพงไพร ทางเก่าถูกกลืนหายใต้รากไม้'},
 {art:'journal',text:'ว่ากันว่า ลึกเข้าไปยังมีชนโบราณที่ไม่ต้อนรับผู้มาเยือน\nบ้างเล่าถึงนครที่ไม่เคยสิ้นแสง บ้างว่ามีนครซ่อนอยู่ในความมืด'},
 {art:'treeline',text:'ไม่มีใครรู้… ว่าเรื่องเล่าเหล่านั้นจริงเพียงใด'},
 {art:'riverCity',text:'ห่างจากเงาของมหาพงไพร สายน้ำหล่อเลี้ยงไร่นาและเมืองของมนุษย์\nผู้เดินทางต่างเผ่าพันธุ์ นำสินค้าและข่าวสารจากแดนไกลมาด้วย'},
 {art:'roadOut',text:'บ้างมาแสวงหาความมั่งคั่ง บ้างมาตามหาสิ่งที่สูญหาย\nและบ้าง… เพียงต้องการเริ่มต้นใหม่'},
 {art:'fernvale',text:'ริมเส้นทางสู่เมืองใหญ่ มีหมู่บ้านเล็ก ๆ แห่งหนึ่ง\nที่นครลึกลับและอารยธรรมที่สาบสูญ เป็นเพียงเรื่องเล่าจากแดนไกล'},
 {art:'dawn',text:'เช้าวันหนึ่งเริ่มต้นขึ้น เช่นเดียวกับวันอื่น\nและเรื่องราวของเจ้า… ก็เริ่มต้นที่นี่'}
];
/* after the name: one more page that walks into the village chapter, then the game starts (js/story-data.js 'opening') */
const BRIDGE={art:'dawn',text:'{hero}…\nเช้าวันแรกก่อนงานเทศกาลเก็บเกี่ยว'};
const HOWTO=[
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

/* ---------- loader: images, audio, fonts, custom promises ---------- */
const loaded=new Map();// url → Promise
function loadImage(url){if(!loaded.has(url))loaded.set(url,new Promise(r=>{const im=new Image();im.decoding='async';im.onload=()=>{(im.decode?im.decode():Promise.resolve()).catch(()=>{}).then(()=>r(true))};im.onerror=()=>r(false);im.src=url}));return loaded.get(url)}
function loadAudio(url){if(!loaded.has(url))loaded.set(url,new Promise(r=>{const a=new Audio();a.preload='auto';let done=false;const end=ok=>{if(!done){done=true;r(ok)}};a.oncanplaythrough=()=>end(true);a.onerror=()=>end(false);setTimeout(()=>end(false),6000);a.src=url;a.load()}));return loaded.get(url)}
function loadFont(family,url){const k='font:'+url;if(!loaded.has(k))loaded.set(k,('FontFace' in root?new FontFace(family,`url(${url})`).load().then(f=>{document.fonts.add(f);return true}):Promise.resolve(false)).catch(()=>false));return loaded.get(k)}
function load(item){if(typeof item==='function')return Promise.resolve().then(item).then(()=>true,()=>false);if(item instanceof Promise)return item.then(()=>true,()=>false);if(/\.(mp3|ogg|wav|m4a)$/i.test(item))return loadAudio(item);return loadImage(item)}
const isCached=url=>loaded.has(url);

const manifest=()=>root.ASSET_MANIFEST?.assets||[];
const byCategory=(...cats)=>manifest().filter(a=>cats.includes(a.category)).map(a=>a.file);
const uniq=list=>[...new Set(list.filter(Boolean))];
function heroFrames(){const t=root.TACTICS_SPRITES;if(!t?.directions)return[];const out=[];for(const p of Object.values(t.directions))for(const f of Object.values(p).flat())if(f?.src)out.push(f.src);return out}
const VILLAGE=['grass','paving','soil','meadow-details','garden-pond','props','fountain','player-house','inn','guild','healer','shop','market','temple','forge'].map(f=>'assets/village-town/'+f+'.png').concat(['broadleaf','pine','old-oak'].map(f=>'assets/village-town/nature/'+f+'.webp'));
function villageSet(){return uniq([...VILLAGE,...heroFrames(),'assets/hero.webp','assets/home.webp','assets/market.webp','assets/workshop.webp',...['bag','upgrade','map','develop'].map(k=>'assets/ui-'+k+'.webp'),'assets/audio/bgm/bgm-village-01.mp3'])}
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
 el.innerHTML='<div class="gl-bg"></div><div class="gl-box"><span class="gl-kicker">LOADING</span><h2 class="gl-title"></h2><div class="gl-bar"><i></i></div><div class="gl-meta"><span class="gl-step"></span><b class="gl-pct">0%</b></div><p class="gl-tip"></p><button type="button" class="gl-skip" hidden>เข้าเกมเลย · โหลดส่วนที่เหลือเบื้องหลัง</button></div>';
 document.body.appendChild(el);return screen=el}
function setProgress(el,f,step){const pct=Math.round(f*100);el.querySelector('.gl-bar i').style.width=pct+'%';el.querySelector('.gl-pct').textContent=pct+'%';el.setAttribute('aria-valuenow',pct);if(step!=null)el.querySelector('.gl-step').textContent=step}
/* run(title, groups[, {bg, minMs, quiet}]) — groups: [{label, items:[url|promise|fn]}]. quiet = only show if it takes >150ms */
let chain=Promise.resolve();
function run(title,groups,opt={}){const p=chain.then(()=>runNow(title,groups,opt));chain=p.catch(()=>{});return p}
async function runNow(title,groups,opt={}){const el=loadingScreen(),items=groups.flatMap(g=>g.items.map(it=>({it,label:g.label})));const total=Math.max(1,items.length);let done=0,shown=!opt.quiet,start=performance.now();
 el.querySelector('.gl-title').textContent=title;el.querySelector('.gl-tip').textContent='เคล็ดลับ · '+TIPS[Math.floor(Math.random()*TIPS.length)];el.querySelector('.gl-bg').style.backgroundImage=opt.bg?`url("${opt.bg}")`:'';setProgress(el,0,groups[0]?.label||'');
 const reveal=()=>{if(!el.hidden)return;el.hidden=false;el.classList.remove('gl-out');shown=true};if(shown)reveal();const timer=opt.quiet?setTimeout(reveal,150):0;
 // a few at a time, in order, so the bar moves steadily and the first scene's files come first
 const queue=items.slice(),workers=Array.from({length:Math.min(6,queue.length)},async()=>{while(queue.length){const x=queue.shift();await load(x.it);done++;setProgress(el,done/total,x.label)}});
 // a slow connection never traps the player: after 7 s offer to continue while the rest keeps loading in the background
 let release;const early=new Promise(r=>release=r),later=setTimeout(()=>{const b=el.querySelector('.gl-skip');b.hidden=false;b.onclick=()=>release()},7000);
 await Promise.race([Promise.all(workers),early]);clearTimeout(timer);clearTimeout(later);el.querySelector('.gl-skip').hidden=true;
 if(shown){const left=(opt.minMs??0)-(performance.now()-start);if(left>0)await wait(left);setProgress(el,1,'พร้อมแล้ว');await wait(reduced?0:220);el.classList.add('gl-out');await wait(reduced?0:380);el.hidden=true;el.classList.remove('gl-out')}
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
// the newest commit on GitHub main — shows whether this browser runs the latest push (or needs Ctrl+F5)
function checkGitHub(el){const box=el.querySelector('.ts-gh'),repo=root.GAME_VERSION?.repo;if(!box||!repo||!root.fetch)return;
 fetch('https://api.github.com/repos/'+repo+'/commits/main',{headers:{Accept:'application/vnd.github+json'}}).then(r=>r.ok?r.json():null).then(c=>{if(!c?.sha){box.textContent='';return}
  const msg=c.commit?.message||'',v=(msg.match(/^v\d+(\.\d+)?/)||[''])[0],sha=c.sha.slice(0,7),d=new Date(c.commit?.committer?.date||Date.now()),when=d.toLocaleString('th-TH',{dateStyle:'medium',timeStyle:'short'});
  const num=x=>{const m=String(x).match(/(\d+)(?:\.(\d+))?/);return m?+m[1]*10000+(+m[2]||0):0},same=!v||num(v)<=num(VERSION);box.textContent=same?(v&&num(v)===num(VERSION)?`· ล่าสุดแล้ว (${sha})`:`· GitHub ${v||'—'} (${sha})`)+` · อัปเดต ${when}`:`· มีเวอร์ชันใหม่ ${v} (${sha}) — กด Ctrl+F5 เพื่อโหลดใหม่`;box.classList.toggle('ts-gh-new',!same);box.title=msg.split('\n')[0]}).catch(()=>{box.textContent=''})}
function buildTitle(){const el=document.createElement('div');el.id='titleScreen';el.className='ts';
 el.innerHTML=`<div class="ts-bg"></div><div class="ts-veil"></div><div class="ts-motes" aria-hidden="true">${'<i></i>'.repeat(18)}</div>
 <div class="ts-main"><div class="ts-brand"><span class="ts-kicker">AGRENOR · TACTICAL CARD ADVENTURE</span><h1>Project A</h1><p>ไพ่และการผจญภัย</p></div>
 <nav class="ts-menu" aria-label="เมนูหลัก">
  <button data-act="new"><span>New Game</span><small>เริ่มเกมใหม่</small></button>
  <button data-act="continue" ${hasSave?'':'disabled'}><span>Continue</span><small>${hasSave?saveSummary():'ยังไม่มีเซฟ'}</small></button>
  <button data-act="options"><span>Options</span><small>ตั้งค่าเกม</small></button>
  <button data-act="extra"><span>Extra</span><small>วิธีเล่น · คลังภาพ · เครดิต</small></button>
  <div class="ts-tools"><a href="editor.html" target="_blank" rel="noopener" title="แก้ภาพ/แอนิเมชัน การ์ด แผนที่ สนามต่อสู้ (เปิดแท็บใหม่)">✎ Editor</a></div>
 </nav></div>
 <div class="ts-foot"><span class="ts-ver">Project A ${VERSION}${root.GAME_VERSION?.date?" · "+root.GAME_VERSION.date:""} <em class="ts-gh">· กำลังเช็ก GitHub…</em></span><span>↑↓ เลือก · Enter ยืนยัน</span></div>
 <section class="ts-extra" hidden aria-label="Extra"><div class="ts-extra-box"><div class="ts-extra-head"><div class="ts-tabs" role="tablist"><button role="tab" data-tab="howto">วิธีเล่น</button><button role="tab" data-tab="gallery">คลังภาพ</button><button role="tab" data-tab="credits">เครดิต</button></div><button class="ts-close" data-act="close-extra" aria-label="ปิด">✕</button></div><div class="ts-extra-body"></div></div></section>
 <section class="ts-story" hidden aria-live="polite"><div class="ts-story-bg"></div><canvas class="ts-story-art"></canvas><div class="ts-story-veil"></div><div class="ts-story-text"></div><div class="ts-story-hint">คลิก หรือกด Enter เพื่อไปต่อ</div><button class="ts-skip" data-act="skip">ข้าม ▸▸</button>
  <form class="ts-name" hidden><span class="ts-kicker">ตัวเอกของเรื่อง</span><h2>เจ้าชื่ออะไร?</h2><input name="hero" maxlength="16" autocomplete="off" spellcheck="false" placeholder="นักผจญภัย"><p>เปลี่ยนภายหลังได้ในตั้งค่า หรือคลิกชื่อตัวเอกในเกม</p><button type="submit">เริ่มการผจญภัย</button></form></section>`;
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
if(newGame)fsSet('1');
{const back=e=>{if(!fsWanted()||fsEl())return;goFull()};addEventListener('pointerdown',back,true);addEventListener('keydown',e=>{if(e.key!=='Escape')back(e)},true)}
async function act(a){if(busyTitle)return;if(a==='new'||a==='continue')goFull();
 if(a==='new'){if(hasSave){const ok=await (root.GameDialog?root.GameDialog.confirm('เริ่มเกมใหม่?\nความคืบหน้าในเซฟปัจจุบันจะถูกแทนที่ (ระบบเก็บสำเนาเซฟเดิมไว้ให้ 1 ชุด) · การ์ดที่ออกแบบและผังหมู่บ้านยังอยู่'):Promise.resolve(root.confirm('เริ่มเกมใหม่?')));if(!ok)return;
   try{localStorage.setItem('three-card-forge-before-newgame',localStorage.getItem(SAVE)||'');localStorage.removeItem(SAVE);localStorage.removeItem(STARTED);for(const k of ['agrenor-world-v1','agrenor-mind-v1','agrenor-clock-v1','agrenor-standalone-v1'])localStorage.removeItem(k);/* v94: the world map, village memory and old clock start over too */sessionStorage.setItem(NEW_FLAG,'1')}catch{}busyTitle=true;title.classList.add('ts-out');await wait(reduced?0:300);location.reload();return}
  prepareStory();return}
 if(a==='continue'&&hasSave){enter(false);return}
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
function story(){busyTitle=true;const st=title.querySelector('.ts-story');st.hidden=false;title.classList.add('ts-in-story');page=-1;busyTitle=false;
 st.onclick=e=>{if(e.target.closest('.ts-skip,.ts-name'))return;next()};
 st.onkeydown=e=>{if(e.target.closest('.ts-name'))return;if(e.key==='Enter'||e.key===' '){e.preventDefault();next()}else if(e.key==='Escape'){e.preventDefault();storyEnd()}};
 st.tabIndex=-1;st.focus();next()}
/* v95.05 · Thai reads best word by word (Intl.Segmenter), never letter by letter */
const seg=(()=>{try{return new Intl.Segmenter('th',{granularity:'word'})}catch{return null}})();
const wordsOf=t=>seg?[...seg.segment(t)].map(x=>x.segment):t.split(/(\s+)/);
let revealUntil=0;
/* v95.07 · pacing: words inside a phrase run quickly; a space (Thai phrase/sentence break) holds a beat, "…" and ?/! hold longer, a new line longest */
const PACE={word:.05,perChar:.012,maxWord:.16,space:.38,ellipsis:.6,mark:.45,line:.7};
function pauseAfter(w){if(/^\s+$/.test(w))return PACE.space;let p=Math.min(PACE.maxWord,PACE.word+[...w].length*PACE.perChar);if(/(…|\.\.\.)$/.test(w))p+=PACE.ellipsis;else if(/[?!]$/.test(w))p+=PACE.mark;return p}
function reveal(box,text){const lines=String(text).split('\n');let d=.25,html='';
 for(const [li,line] of lines.entries()){if(li)d+=PACE.line;html+='<span class="ts-ln">'+wordsOf(line).map(w=>{const h=`<span class="ts-w" style="animation-delay:${d.toFixed(2)}s">${esc(w)}</span>`;d+=pauseAfter(w);return h}).join('')+'</span>'}
 box.innerHTML=html;box.classList.remove('ts-all');revealUntil=performance.now()+d*1000+600;if(reduced)box.classList.add('ts-all')}
function showPage(p){const st=title.querySelector('.ts-story'),box=st.querySelector('.ts-story-text'),bg=st.querySelector('.ts-story-bg'),pa=artPlayer(st);
 if(pa&&p.art&&pa.show(p.art)){bg.style.backgroundImage='none';bg.classList.remove('ts-pan')}else if(p.bg){bg.classList.remove('ts-pan');void bg.offsetWidth;bg.style.backgroundImage=`url("${p.bg}")`;bg.classList.add('ts-pan')}
 reveal(box,p.text)}
function next(){const st=title.querySelector('.ts-story'),box=st.querySelector('.ts-story-text');
 if(performance.now()<revealUntil&&!box.classList.contains('ts-all')){box.classList.add('ts-all');revealUntil=0;return}// first press shows the whole page
 page++;if(page>=PROLOGUE.length){storyEnd();return}showPage(PROLOGUE[page])}
function storyEnd(){const st=title.querySelector('.ts-story'),f=st.querySelector('.ts-name');st.querySelector('.ts-story-text').textContent='';st.querySelector('.ts-story-hint').hidden=true;st.querySelector('.ts-skip').hidden=true;f.hidden=false;
 const input=f.elements.hero;input.value=game()?.village?.heroName||'';setTimeout(()=>input.focus(),30);
 f.onsubmit=async e=>{e.preventDefault();const n=input.value.trim().slice(0,16)||'นักผจญภัย';if(game()?.village){game().village.heroName=n;doSave()}root.HeroIdentity?.syncHeroName?.();
  f.hidden=true;showPage({...BRIDGE,text:BRIDGE.text.replace('{hero}',n)});st.onclick=null;st.onkeydown=null;await wait(reduced?600:4200);enter(true)}}

/* ---------- v95.02 · New Game: load everything first, then play the prologue (no stutter while the game page and the town frame are still loading) ---------- */
const fonts=()=>[()=>loadFont('VillageThai','assets/village-town/noto-sans-thai-thai-400-normal.woff2'),()=>document.fonts?.ready];
const pageLoaded=()=>document.readyState==='complete'?Promise.resolve():Promise.race([new Promise(r=>root.addEventListener('load',r,{once:true})),wait(15000)]);
const settle=()=>new Promise(r=>{let n=0;const f=()=>++n>=12?r():requestAnimationFrame(f);requestAnimationFrame(f)});   // a few quiet frames after the heavy work
let storyReady=false;
async function prepareStory(){title.classList.add('ts-quick');
 await run('กำลังเตรียมบทนำ',[{label:'ฟอนต์',items:fonts()},{label:'ฉากบทนำ',items:[()=>root.SceneArt?.warm?.()]},{label:'หมู่บ้าน',items:villageSet()},{label:'สร้างฉากหมู่บ้าน',items:[Promise.race([whenTown(),wait(12000)])]},{label:'เตรียมเกม',items:[()=>pageLoaded().then(settle)]}],{minMs:900});
 storyReady=true;story()}


/* ---------- into the game ---------- */
async function enter(isNew){if(busyTitle)return;busyTitle=true;try{localStorage.setItem(STARTED,'1')}catch{}
 await run(isNew?'เริ่มต้นการผจญภัย':'กำลังโหลดเซฟ',[{label:'ฟอนต์',items:fonts()},{label:'หมู่บ้าน',items:villageSet()},{label:'สร้างฉากหมู่บ้าน',items:[Promise.race([whenTown(),wait(10000)])]}],{bg:'assets/home.webp',minMs:storyReady?0:isNew?900:500,quiet:storyReady});
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
