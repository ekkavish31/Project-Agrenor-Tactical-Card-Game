/* Entity-first Asset Studio v40. Existing import/history tools remain available in the drawer. */
(function(){
 'use strict';
 const C=window.StudioCatalog,R=window.AnimationReviewModel;
 const state={group:'characters',entity:'hero',entityQuery:'',playing:true,speed:1,epoch:performance.now(),entries:[],model:[],generation:0,busy:false};
 let meta=window.STUDIO_ENEMIES||{},runtime={tactics:typeof TACTICS_SPRITES==='undefined'?null:TACTICS_SPRITES,hero:typeof HERO_ANIMATIONS==='undefined'?null:HERO_ANIMATIONS};
 const nativeCatalog=R.catalog,imageCache=new Map();let motionChannel=null,motionSignature='',motionTicket=0;try{motionChannel=new BroadcastChannel('project-a-hero-motion')}catch{}
 function publishMotion(){
  if(!motionChannel||!dir||!runtime.tactics)return;const data=JSON.parse(JSON.stringify(HeroMotion.snapshot(runtime.tactics))),sig=JSON.stringify(data);   /* v98.81 · a COPY: snapshot() shares the walk frame objects with the live sprites, and the loop below rewrites their src into data URLs — that broke the walk row after every open/close of the frame editor */if(sig===motionSignature)return;motionSignature=sig;const ticket=++motionTicket;
  (async()=>{const paths=[...new Set(Object.values(data.directions).flatMap(d=>d.walk.map(f=>f.src)))],resolved=new Map();for(const path of paths){const src=await srcOf(path);if(!src)continue;try{const blob=await (await fetch(src)).blob(),url=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(blob)});resolved.set(path,url)}catch{resolved.set(path,path)}}if(ticket!==motionTicket)return;for(const d of Object.values(data.directions))for(const f of d.walk)f.src=resolved.get(f.src)||f.src;motionChannel.postMessage({kind:'hero-walk',data})})().catch(()=>{motionSignature=''});
 }

 const names={idle:'ยืน / หายใจ',walk:'เดิน',run:'วิ่ง',windup:'เตรียมโจมตี',strike:'โจมตี',attack:'โจมตี',guard:'ป้องกัน',hit:'ถูกโจมตี',down:'ล้ม / ตาย',cast:'ร่ายเวท',special:'ท่าพิเศษ'};
 const dirs=['SW','NW','NE','SE','FRONT','TOP','—'];   /* v97.65: characters use the four diagonal views only (S/W/N/E dropped) */
 const pretty=a=>names[a]||a.replace(/^daily\./,'ชีวิตประจำวัน · ').replace(/^sword\./,'ดาบ · ').replace(/^hammer\./,'ค้อน · ').replace(/^unarmed\./,'มือเปล่า · ');
 /* v98.90 · the recruits (js/village-life.js) have standing pictures in assets/village-town/npc/<name>/ that the manifest never listed, so the studio showed no entry for them.
    List them as ally entities (same category / id pattern as Bram, Luna, Kier: tactics-<name>-<dir>-idle); only pictures that exist in the folder are added. */
 const RECRUITS=['ren','nadia','sigrid','orla','olwen'];
 function registerRecruits(manifest){if(!manifest?.assets)return;const have=new Set(manifest.assets.map(a=>a.id));
  for(const k of RECRUITS)for(const d of ['sw','ne']){const id=`tactics-${k}-${d}-idle`,file=`assets/village-town/npc/${k}/${d}-stand.webp`;
   if(have.has(id)||(dir&&scanned&&!hasFile(file)))continue;manifest.assets.push({id,file,category:'allies',status:'final',size:[384,384],transparent:true,view:d.toUpperCase(),pose:'idle'});have.add(id)}
  /* v98.115 · the other two directions (SE, NW) of the standing pose and the 4 walk placeholders: empty slots (status 'missing', like Kier's / Mil's) so every direction has a clip and
     "ลอกกลับด้าน" from the opposite direction is offered everywhere — filling one saves a new picture for it */
  for(const k of RECRUITS){const nm=k[0].toUpperCase()+k.slice(1);
   for(const d of ['se','nw']){const id=`tactics-${k}-${d}-idle`;if(have.has(id))continue;manifest.assets.push({id,file:`assets/village-town/npc/${k}/${d}-stand.webp`,category:'allies',status:'missing',size:[384,384],transparent:true,view:d.toUpperCase(),pose:'idle',usedIn:`เพื่อนร่วมทีม ${k}`,note:'ช่องว่าง: ยังไม่มีภาพ — ลอกกลับด้านจากทิศตรงข้าม หรือนำเข้าภาพ'});have.add(id)}
   for(const d of ['sw','nw','ne','se']){const id=`tactics-${k}-${d}-walk-1`;if(have.has(id))continue;manifest.assets.push({id,file:`assets/tactics/${k}_${d}_walk_01.webp`,category:'allies',status:'missing',size:[384,384],transparent:true,view:d.toUpperCase(),pose:'walk',usedIn:`เพื่อนร่วมทีม ${nm}`,note:'ช่องว่าง: ยังไม่มีท่าเดิน — เติมได้'});have.add(id)}}}
 /* v98.373 · the villagers (js/village-life.js) have standing + walking pictures in assets/village-town/npc/<id>/ that the manifest never listed: list them as NPC entities (group 'npcs'),
    one slot per picture that exists in the folder (stand / walk1 in SW and NE) so each can be viewed and replaced like any other character. */
 const VILLAGERS_OLD={may:'ป้าเมย์',tom:'ลุงทอม',lin:'คุณยายลิน',mira:'ครูมิรา',joe:'ชาวประมงโจ',ella:'ช่างทอผ้าเอลลา',oren:'ผู้ใหญ่บ้านโอเรน',gus:'ช่างตีเหล็กกัส',guard:'ยามดอร์ก',hilda:'ชาวนาฮิลดา',bryn:'บริน (โม่แป้ง)',marta:'มาร์ธา (เขากวางทอง)',saf:'หมอยาซาฟ',mother:'แม่'};
 /* v98.444 · every NPC of the game (js/studio-people.js, generated from js/village-life.js) gets its 4 directions × stand / walk rows — not only the 14 that were typed in here */
 const VILLAGERS=window.STUDIO_PEOPLE?.npcs||VILLAGERS_OLD;
 function registerVillagers(manifest){if(!manifest?.assets)return;const have=new Set(manifest.assets.map(a=>a.id));
  for(const [k,name] of Object.entries(VILLAGERS))for(const d of ['sw','ne','se','nw'])for(const [pose,file,label] of [['idle',`assets/village-town/npc/${k}/${d}-stand.webp`,'ยืน'],['walk',`assets/village-town/npc/${k}/${d}-walk1.webp`,'เดิน']]){
   const id=`npc-${k}-${d}-${pose==='idle'?'stand':'walk1'}`;if(have.has(id))continue;
   const base=d==='sw'||d==='ne',exists=!(dir&&scanned)||hasFile(file);if(base&&!exists)continue;   /* SW / NE are what the game ships; SE / NW are empty slots to fill (status missing) unless the file is there */
   manifest.assets.push({id,file,category:'allies',status:exists?'final':'missing',size:[384,384],transparent:true,view:d.toUpperCase(),pose,frame:pose==='walk'?1:undefined,usedIn:`NPC ${name} · ${label}`,studioOwner:{id:'npc:'+k,name,group:'npcs'}});have.add(id)}}
 function clipsFor(manifest){
  try{registerRecruits(manifest)}catch(e){}
  try{registerVillagers(manifest)}catch(e){}
  /* v98.88 · self-heal: whether a look's saved idle/walk pictures are 'final' or 'unused' is DERIVED from what the looks use (StudioVariants.syncStatuses). A manifest saved/pushed by an older build can carry stale 'unused' marks —
     the walk row then vanished until something re-synced it. Re-derive on every build so the rows can never depend on a stored mark. */
  try{window.StudioVariants?.syncStatuses(manifest)}catch(e){}
  window.StudioWalks?.apply(runtime.tactics,manifest);
  let raw=nativeCatalog(manifest,runtime),active=(manifest.assets||[]).filter(a=>a.status!=='unused'),files=new Map(active.map(a=>[a.file,a]));
  // Runtime sequences preserve repeated ready/recovery frames and their actual timings.
  if(runtime.hero?.clips){raw=raw.filter(c=>c.entity!=='hero-town');for(let [key,c]of Object.entries(runtime.hero.clips)){
   if(/(?:^|\.)(?:walk|run)(?:\.|$)/.test(key)||!c.frames?.length||!c.frames.every(f=>files.has(f.src)))continue;
   let frames=c.frames.map(f=>{let a=files.get(f.src);return {assetId:a.id,file:f.src,cell:0,crop:null,ms:f.ms||120,flip:!!f.flipImage,pivot:c.anchor||a.anchor||a.pivot||[.5,1],size:c.canvas||a.size||[384,384],renderHeight:a.renderHeight||1,revision:a.artRevision||''}});
   raw.push({id:'clip:'+key,canonical:key,entity:'hero-town',label:'ตัวหลัก',action:key,view:/walk|sword|hammer|unarmed/.test(key)?'E':'FRONT',loop:!!c.loop,kind:'files',frames});
  }}
  /* v98.102 · an ally's saved walk set (manifest.studioAllyWalks) replaces the one-frame placeholder clip of that direction */
  for(const[key,views]of Object.entries(manifest.studioAllyWalks||{}))for(const[view,cfg]of Object.entries(views||{})){
   if(!cfg?.frames?.length)continue;
   const byAsset=new Map((manifest.assets||[]).map(a=>[a.id,a])),fr=cfg.frames.map(f=>{const a=byAsset.get(f.assetId);return {assetId:f.assetId,file:a?.file||f.src,cell:0,crop:null,ms:f.ms||80,flip:false,pivot:cfg.anchor||[.5,.9375],renderHeight:a?.renderHeight||1,revision:a?.artRevision||'',size:cfg.canvas||[384,384]}});
   raw.push({id:'allywalk:'+key+':'+view,canonical:'allywalk:'+key+':'+view,action:'walk',view,loop:cfg.loop!==false,kind:'files',frames:fr});   /* the catalog then skips the one-frame placeholder of that direction */
  }
  /* v98.376 · a villager's walk = the frames npc-<id>-<dir>-walk1…N of that direction (one looping clip) */
  try{const by=new Map();for(const a of manifest.assets||[]){const o=a.studioOwner;if(!o||o.group!=='npcs'||a.pose!=='walk'||!a.file||['missing','planned','unused'].includes(a.status))continue;const key=o.id+'|'+a.view;(by.get(key)||by.set(key,[]).get(key)).push(a)}
   for(const [key,list] of by){if(list.length<2)continue;list.sort((x,y)=>(x.frame||1)-(y.frame||1));const [oid,view]=key.split('|');raw.push({id:'npcwalk:'+oid+':'+view,canonical:'npcwalk:'+oid+':'+view,action:'walk',view,loop:true,kind:'files',frames:list.map(a=>({assetId:a.id,file:a.file,cell:0,crop:null,ms:a.ms||110,flip:false,pivot:a.pivot||[.5,.9375],renderHeight:a.renderHeight||1,revision:a.artRevision||'',size:a.size||[384,384]}))})}}catch(e){}
  const heroIds=new Set(active.filter(a=>C.owner(a,meta).id==='hero').map(a=>a.id));return raw.filter(c=>(!/(?:walk|run)/i.test(c.action)||!c.frames.some(f=>heroIds.has(f.assetId))||c.id.startsWith('runtime:hero:walk:'))&&(!runtime.tactics?._studioCreatedDirections?.has(c.view)||c.action==='walk'));
 }
 /* v98.76 · with the male / female look open, the hero shows only that look: the registered still pictures of the original hero are hidden */
 const lookOnly=entities=>{const classic=window.StudioVariants?.active==='classic',byId=new Map((M.assets||[]).map(a=>[a.id,a]));
  for(const e of entities)if(e.id==='hero'){
   if(!classic){e.clips=e.clips.filter(c=>!String(c.id).startsWith('static:'));e.assets=(e.assets||[]).filter(a=>a.variant===window.StudioVariants.active)}   /* v98.77 · only the open look's own pictures, none of the original hero's */
   else{e.clips=e.clips.filter(c=>!(String(c.id).startsWith('static:')&&c.frames.some(f=>byId.get(f.assetId)?.variant)));e.assets=(e.assets||[]).filter(a=>!a.variant)}}   /* the male / female pictures stay out of the original hero's lists */
  return entities};
 /* The catalog only attaches a clip to a character through its registered pictures, so the files a look uses are registered once (category tactics-hero, tagged with the look). */
 function registerLookAssets(id,t){const have=new Set((M.assets||[]).map(a=>a.file)),files=new Set();
  for(const D of Object.values(t?.directions||{}))for(const pose of ['idle','walk','windup','strike','guard','hit','down'])for(const f of [...(D[pose+'Frames']||[]),...(pose==='walk'?D.walk||[]:[]),D[pose]].filter(Boolean))if(f.src&&!/^data:|^blob:/.test(f.src))files.add(f.src);
  for(const file of files)if(!have.has(file))M.assets.push({id:'look-'+id+'-'+file.replace(/^assets\//,'').replace(/\.[a-z]+$/i,'').replace(/[^a-z0-9]+/gi,'-'),file,category:'tactics-hero',status:'final',size:[384,384],transparent:true,view:'',pose:'',variant:id,studioOwner:{id:'hero',name:'ตัวหลัก · Hero',group:'characters'}})}
 function rebuild(){if(window.StudioVariants?.active==='classic'&&runtime.tactics&&(M.assets||[]).length)enterLook('male');state.model=lookOnly(C.build(M,clipsFor(M),meta));return state.model}
 // Share one catalog between matrix and the detailed reviewer, including static assets.
 R.catalog=function(manifest){return lookOnly(C.build(manifest,clipsFor(manifest),meta)).flatMap(e=>e.clips)};
 function entity(){return state.model.find(e=>e.id===state.entity)}
 function reviewStatus(c){
  let status='unreviewed';try{let store=JSON.parse(localStorage.getItem('asset-animation-reviews-v1')||'{}'),r=store[R.signature(c)];r=r||M.studioReviews?.[R.signature(c)];status=Object.values(r?.frames||{}).some(f=>f.flagged)?'needsfix':r?.status||status}catch{}
  let work=window.StudioUnifiedReview?.getState();if(work?.clip===c.id&&work.dirty)status='unreviewed';if(c.frames.some(f=>byId(f.assetId)?.qaStatus==='needs-fix'))status='needsfix';
  return status;
 }
 function visible(c){if(!query)return true;return (c.action+' '+pretty(c.action)+' '+c.view+' '+c.frames.map(f=>f.assetId+' '+f.file).join(' ')).toLowerCase().includes(query)}
 function missing(c){return c.frames.some(f=>dir&&scanned?!hasFile(f.file):['missing','planned','code'].includes(byId(f.assetId)?.status))}
 async function im(file){let key=state.generation+'|'+file;if(!imageCache.has(key)){let generation=state.generation;imageCache.set(key,(async()=>{let src=await srcOf(file);if(generation!==state.generation||!src)return null;return new Promise(resolve=>{let i=new Image();i.onload=()=>resolve(i);i.onerror=()=>resolve(null);i.src=src})})())}return imageCache.get(key)}
 function draw(canvas,image,f){let g=canvas.getContext('2d'),W=canvas.width,H=canvas.height;g.clearRect(0,0,W,H);if(!image){g.fillStyle='#956147';g.font='13px AgThai,sans-serif';g.textAlign='center';g.fillText('ไม่พบภาพ',W/2,H/2);return}
  let h=H*.79*(f.renderHeight||1),w=h*f.size[0]/f.size[1];if(w>W*.94){h*=W*.94/w;w=W*.94}g.save();g.translate(W/2,H*.91);if(f.flip)g.scale(-1,1);if(f.crop)g.drawImage(image,...f.crop,-w*f.pivot[0],-h*f.pivot[1],w,h);else g.drawImage(image,-w*f.pivot[0],-h*f.pivot[1],w,h);g.restore();
 }
 async function loadPreviews(){let gen=state.generation,items=state.entries;for(let entry of items){entry.images=await Promise.all(entry.clip.frames.map(f=>im(f.file)));if(gen!==state.generation||state.entries!==items)return;draw(entry.canvas,entry.images[0],entry.clip.frames[0])}}
 let viewed=new Set();const previewObserver=new IntersectionObserver(es=>{for(let e of es)e.isIntersecting?viewed.add(e.target):viewed.delete(e.target)},{root:$('gridWrap'),rootMargin:'100px'});
 function tick(now){requestAnimationFrame(tick);if(document.hidden||$('animation-review')?.open)return;let elapsed=state.playing?(now-state.epoch)*state.speed:state.pausedAt||0;
  for(let p of state.entries){if(!viewed.has(p.canvas)||!p.images)continue;let i=R.frameAt(p.clip,elapsed,true);if(p.frame!==i){p.frame=i;draw(p.canvas,p.images[i],p.clip.frames[i])}}
 }
 function resetClock(){state.epoch=performance.now();state.pausedAt=0;for(let p of state.entries)p.frame=-1}
 /* v98.90 · character list thumbnails: the UPPER HALF of the standing picture facing SE (a bust), cut from the picture's own outline.
    SE source per entity: the hero → the open look's SE idle (runtime) · others → village stand SE, else village stand SW mirrored, else the battle idle. */

 /* v98.142 · ONE source for "the standing picture of a character": the idle clip of the Animation grid (state.model — what the studio shows and what the game plays),
    this direction first, then the opposite direction mirrored. The old fixed file names are only a last resort for what the grid does not have. */
 function studioStand(id,view){
  const e=state.model.find(x=>x.id===id);if(!e)return [];const opp={SW:'SE',SE:'SW',NE:'NW',NW:'NE'}[view],out=[];
  const pick=(v,flip)=>{const c=e.clips.find(c=>c.action==='idle'&&c.view===v&&c.frames?.length);if(!c)return;const f=c.frames[0],a=byId(f.assetId);if(a?.status==='missing')return;if(f.file)out.push([f.file,!!f.flip!==flip])};
  pick(view,false);if(opp)pick(opp,true);return out;
 }
 const bustCache=new Map();
 function bustCandidates(id){
  if(id==='hero'){const s=runtime.tactics?.directions?.SE?.idle;return s?.src?[[s.src,!!s.flipImage]]:[]}
  const k=id.replace(/^ally:/,'');return [...studioStand(id,'SE'),[`assets/village-town/npc/${k}/se-stand.webp`,false],[`assets/village-town/npc/${k}/sw-stand.webp`,true],[`assets/tactics/${k}_se_idle.webp`,false],[`assets/tactics/${k}_sw_idle.webp`,true]];
 }
 async function bustOf(file,flip){
  const key=state.generation+'|'+file+'|'+flip;if(bustCache.has(key))return bustCache.get(key);
  const p=(async()=>{const image=await im(file);if(!image)return null;const W=image.naturalWidth,H=image.naturalHeight,c=document.createElement('canvas');c.width=W;c.height=H;const g=c.getContext('2d',{willReadFrequently:true});
   if(flip){g.translate(W,0);g.scale(-1,1)}g.drawImage(image,0,0);let d;try{d=g.getImageData(0,0,W,H).data}catch(e){return null}
   let x0=W,x1=0,y0=H,y1=0;for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(d[(y*W+x)*4+3]>40){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
   if(x1<=x0||y1<=y0)return null;const fh=y1-y0+1,side=Math.round(Math.max(fh*.5,Math.min(x1-x0+1,fh*.62))),sx=Math.round((x0+x1)/2-side/2),sy=y0-Math.round(fh*.02);
   const o=document.createElement('canvas');o.width=o.height=96;const q=o.getContext('2d');q.imageSmoothingQuality='high';q.drawImage(c,sx,sy,side,side,0,0,96,96);return o.toDataURL('image/webp',.92)})();
  bustCache.set(key,p);return p;
 }
 async function fillBusts(){
  const gen=state.generation;for(const img of $('cats').querySelectorAll('img[data-bust]')){
   let url=null;for(const [file,flip] of bustCandidates(img.dataset.bust)){if(dir&&scanned&&!hasFile(file))continue;url=await bustOf(file,flip);if(url)break}
   if(gen!==state.generation||!img.isConnected)continue;
   if(url)img.src=url;else if(img.dataset.fallback){img.dataset.p=img.dataset.fallback;hydrate($('cats'))}
  }
 }
 /* v98.383 · the Scale Lineup row sits at the top of the Animation tab (scale-lineup.html?dock=1): size · proportion · real grid · per map, for the character picked here or in the row */
 /* v98.393 · the row is as tall as its content (scale-lineup.html posts it) unless you drag its edge yourself (kept until ↕ พอดี) */
 let dockAuto=true,dockLast=0;try{dockAuto=localStorage.getItem('studio.dockH')==null}catch(x){}
 addEventListener('message',ev=>{const f=$('lineupDockFrame');if(!f||ev.source!==f.contentWindow||ev.data?.type!=='lineup-dock-h'||!dockAuto||$('lineupDock').classList.contains('edit-fit')||$('lineupDock').classList.contains('lineup-fullscreen'))return;const b=$('lineupDock')?.querySelector('.dock-body');if(!b)return;const h=Math.round(Math.max(330,Math.min(innerHeight*.86,+ev.data.h||0)));if(Math.abs(h-dockLast)>2){dockLast=h;b.style.height=h+'px'}});
 (()=>{const b=$('lineupDock')?.querySelector('.dock-body');if(!b)return;try{const k=localStorage.getItem('studio.dockH');if(k)b.style.height=k+'px'}catch(x){}
  let down=false;b.addEventListener('pointerdown',ev=>{const r=b.getBoundingClientRect();down=ev.clientY>r.bottom-18&&ev.clientX>r.right-18});addEventListener('pointerup',()=>{if(!down)return;down=false;dockAuto=false;try{localStorage.setItem('studio.dockH',String(Math.round(b.getBoundingClientRect().height)))}catch(x){}const fit=$('dockFit');if(fit)fit.hidden=false});
  const bar=$('lineupDock').querySelector('.dock-bar'),fit=document.createElement('button');fit.id='dockFit';fit.type='button';fit.textContent='↕ พอดี';fit.title='ความสูงพอดีเนื้อหาอัตโนมัติ';fit.hidden=dockAuto;fit.onclick=()=>{dockAuto=true;dockLast=0;try{localStorage.removeItem('studio.dockH')}catch(x){}fit.hidden=true;try{$('lineupDockFrame').contentWindow.dispatchEvent(new Event('load'))}catch(x){}};bar.insertBefore(fit,$('dockToggle'))})();
 function dockSync(on){const d=$('lineupDock');if(!d)return;document.body.classList.toggle('anim-mode',!!on);if(!on)return;const f=$('lineupDockFrame');if(f&&!f.src&&!d.classList.contains('min'))f.src='scale-lineup.html?studio=1&dock=1&v=98.457'}
 (()=>{const d=$('lineupDock'),b=$('dockToggle');if(!d||!b)return;let min=false;try{min=localStorage.getItem('studio.dockMin')==='1'}catch(e){}const set=v=>{min=v;d.classList.toggle('min',v);b.textContent=v?'แสดง ▾':'ย่อ ▴';try{localStorage.setItem('studio.dockMin',v?'1':'0')}catch(e){}if(!v)dockSync(document.body.classList.contains('anim-mode'))};set(min);b.onclick=()=>set(!min)})();
 /* v98.445 · fullscreen keeps the same iframe and unsaved editor state. */
 (()=>{const d=$('lineupDock'),b=$('dockFullscreen'),f=$('lineupDockFrame');if(!d||!b)return;
  const fit=()=>{if(d.classList.contains('edit-fit')&&!d.classList.contains('lineup-fullscreen')){d.style.height=Math.max(240,innerHeight-d.getBoundingClientRect().top-12)+'px'}};
  const set=on=>{d.classList.toggle('lineup-fullscreen',on);b.textContent=on?'⛶ ออกเต็มจอ':'⛶ เต็มจอ';b.setAttribute('aria-pressed',String(on));fit()};
  b.onclick=async()=>{if(d.classList.contains('lineup-fullscreen')){if(document.fullscreenElement===d)await document.exitFullscreen();set(false);return}if(d.classList.contains('min'))$('dockToggle').click();set(true);try{await d.requestFullscreen?.()}catch(_){} };
  document.addEventListener('fullscreenchange',()=>{if(!document.fullscreenElement)set(false)});
  const escape=ev=>{if(ev.key==='Escape'&&!document.fullscreenElement)set(false)};addEventListener('keydown',escape);
  f.addEventListener('load',()=>{try{f.contentWindow.addEventListener('keydown',escape)}catch(_){}});
  addEventListener('resize',fit);addEventListener('message',ev=>{if(ev.origin!==location.origin||ev.source!==f.contentWindow||ev.data?.type!=='lineup-edit-fit')return;d.classList.toggle('edit-fit',!!ev.data.collapsed);if(!ev.data.collapsed)d.style.height='';fit()});
 })();
 function renderNav(){let search=state.entityQuery.toLowerCase(),all=state.model.filter(e=>e.group===state.group),ee=all.filter(e=>(e.name+' '+e.id).toLowerCase().includes(search));
  const ANIM=['characters','npcs','monsters','bosses'];dockSync(ANIM.includes(state.group));if(ANIM.includes(state.group))emit('studio-group',{group:state.group});   /* v98.399 · tells the Scale Lineup dock which left-panel group tab is active, so it can follow it instead of keeping its own duplicate filter */const subs=ANIM.includes(state.group)?'<div class="subtabs">'+[['characters','ตัวละคร'],['npcs','NPC ชาวบ้าน'],['monsters','มอนสเตอร์'],['bosses','มินิบอส / บอส']].map(([g,n])=>`<button data-sub="${g}" class="${g===state.group?'on':''}">${n}</button>`).join('')+'</div>':'';
  /* v98.452 · the hero comes first and its two looks (ชาย / หญิง) are two entries side by side instead of one that switches */
  const V0=window.StudioVariants,heroAt=ee.findIndex(x=>x.id==='hero');if(heroAt>0)ee.unshift(...ee.splice(heroAt,1));
  if(V0&&ee[0]?.id==='hero'){const h0=ee[0];ee.splice(0,1,...V0.LOOKS.map(([lk,nm])=>({...h0,look:lk,name:'ตัวหลัก · '+nm})))}
  $('cats').innerHTML=subs+`<h4>${esc(C.groups[state.group])} · ${all.length}</h4><input id="entitySearch" type="search" placeholder="ค้นหาตัว / วัตถุ" aria-label="ค้นหาในหมวด" value="${esc(state.entityQuery)}">`+ee.map(e=>{
   let a=(e.id==='hero'?e.assets.find(a=>a.variant&&/idle-sw\.webp$/.test(a.file))||e.assets.find(a=>a.id==='tactics-hero-se-idle'):null)||e.assets.find(a=>/^(card-|enemy-|ally-)/.test(a.id)&&!a.animation)||e.assets.find(a=>!a.animation)||e.assets[0];
   return `<button data-entity="${esc(e.id)}"${e.look?` data-look="${e.look}"`:''} class="${e.id===state.entity&&(!e.look||window.StudioVariants?.active===e.look||(window.StudioVariants?.active==='classic'&&e.look==='male'))?'on':''}">${e.look?`<img class="bust" src="assets/tactics/imported/idle-sw-mwcast2-${e.look==='female'?'f':'m'}/frame-01.webp" alt="">`:e.group==='characters'||e.group==='npcs'?`<img class="bust" data-bust="${esc(e.id)}" data-fallback="${esc(a?.file||'')}" alt="">`:a?.file?imgTag(a.file):''}<span class="nav-copy"><b>${esc(e.name)}</b><small>${e.clips.filter(c=>c.kind!=='static').length} ชุดท่า · ${e.assets.length} ไฟล์${e.rank==='boss'?' · บอส':e.rank==='miniboss'?' · มินิบอส':''}</small></span></button>`}).join('')+(ee.length?'':'<p class="muted">ไม่พบรายการ</p>');
  $('cats').querySelectorAll('[data-sub]').forEach(b=>b.onclick=()=>gotoGroup(b.dataset.sub));
  $('entitySearch').oninput=e=>{let caret=e.target.selectionStart;state.entityQuery=e.target.value;renderNav();$('entitySearch').focus();$('entitySearch').setSelectionRange(caret,caret)};
  fillBusts();
  $('cats').querySelectorAll('[data-entity]').forEach(b=>b.onclick=()=>{if(b.dataset.look&&window.StudioVariants&&b.dataset.look!==window.StudioVariants.active){setLook(b.dataset.look);if(window.StudioVariants.active!==b.dataset.look)return}state.entity=b.dataset.entity;emit('studio-select',{id:b.dataset.entity});sel=null;selected=null;document.body.classList.remove('detail-open');render();$('gridWrap').scrollTop=0});hydrate($('cats'));
 }
 /* v98.76 · hero looks (ตัวเดิม / ชาย / หญิง): the open look's edits sit at the top level of the manifest, see js/studio-variants.js */
 let pristine=null;
 function enterLook(id){const V=window.StudioVariants;if(!V||id===V.active||!V.switchTo(M,id))return false;V.syncStatuses?.(M);   /* v98.83 */
  if(!pristine&&runtime.tactics)pristine=JSON.parse(JSON.stringify(runtime.tactics));
  if(pristine){const t=JSON.parse(JSON.stringify(pristine));window.StudioWalks?.apply(t,{});   /* creates the base snapshots the rebase needs */
   if(id!=='classic'&&window.HeroVariant){HeroVariant.defaultsTo(t,id);HeroVariant.rebase(t)}
   runtime.tactics=t;if(id!=='classic')registerLookAssets(id,t)}
  imageCache.clear();state.generation++;return true}
 function setLook(id){const V=window.StudioVariants;if(!V||id===V.active)return;
  if(hasWork()&&!confirm('มีเฟรมที่ยังรอใช้อยู่ ถ้าเปลี่ยนรูปลักษณ์ตอนนี้ งานที่ค้างอาจปนกับตัวใหม่ · เปลี่ยนต่อไหม?'))return;
  if(!enterLook(id))return;
  rebuild();render();try{detail()}catch(e){}emit('studio-frames-changed');toast('กำลังแก้: '+V.LOOKS.find(l=>l[0]===id)[1])}
 /* v98.95 · the size factor set in the ⚖ Scale Lineup tab (draft kept in this browser, else the saved one) */
 function sizeBadge(e){try{const key=e.id==='hero'?'hero':e.id.startsWith('ally:')?e.id.slice(5):null;if(!key)return '';let d=null;try{d=JSON.parse(localStorage.getItem('projectA.scaleAdjustDraft')||'null')}catch(x){}
  const g=window.CharScaleAdjust?window.CharScaleAdjust.factor('main',key==='hero'&&window.StudioVariants?.active==='female'?'hero-female':key,d||window.CHARACTER_SCALE_ADJUST):1;return Math.abs(g-1)>.0005?` <small class="entity-tag" title="ตั้งไว้ในแท็บ ⚖ Scale Lineup">ขนาดในเกม ${Math.round(g*100)}%</small>`:''}catch(x){return ''}}
 function lookBar(e){const V=window.StudioVariants,box=$('filters');if(!V||e?.id!=='hero')return;
  box.innerHTML='<div class="look-bar" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap;margin:4px 0"><b style="font-size:12px">รูปลักษณ์ตัวเอก</b>'+V.LOOKS.map(([id,name])=>`<button data-look="${id}" class="${V.active===id?'on':''}" style="padding:4px 10px;border-radius:14px;border:1px solid #b9a56a;background:${V.active===id?'#e8c766':'#fff8e4'};cursor:pointer">${name}</button>`).join('')+'<small style="color:#6b7963;flex-basis:100%">แต่ละแบบเก็บชุดเดิน/ท่าแยกกัน · ชาย/หญิงคือตัวที่ใช้อยู่ในเกมตอนนี้</small></div>';
  box.querySelectorAll('[data-look]').forEach(b=>b.onclick=()=>setLook(b.dataset.look))}
/* v98.376 · pick a picture tile (📌 ใส่ช่อง) then click the animation cell it should fill: the tile's file becomes that slot's picture (the old one is kept in the slot's history) */
 async function placeInto(c){const tile=byId(state.arm);if(!tile||!tile.file){state.arm=null;return renderEntity()}
  if(!c.frames||c.frames.length!==1){toast('ช่องนี้เป็นชุดหลายเฟรม — เลือกช่องที่มี 1 เฟรม หรือใช้ 🧩 นำเข้าชีทสำหรับหลายเฟรม');return}
  const slot=byId(c.frames[0].assetId);if(!slot||slot===tile){toast('เลือกช่องอื่น');return}
  await doApply(slot,{path:tile.file},{note:'ก่อนเปลี่ยนเป็น '+tile.id},true);if(byId(slot.id)&&slot.file){state.arm=null;renderEntity()}}
 async function placeEmpty(e,key){const tile=byId(state.arm);if(!tile||!tile.file)return;const [action,view]=key.split('|');
  if(e.group!=='npcs'||!['idle','walk'].includes(action)){toast('ช่องนี้ยังไม่มีสล็อต — สร้างสล็อตใน Asset Manager ก่อน');return}
  const k=e.id.replace(/^npc:/,''),d=view.toLowerCase(),id=`npc-${k}-${d}-${action==='idle'?'stand':'walk1'}`;let slot=byId(id);
  if(!slot){slot={id,file:`assets/village-town/npc/${k}/${d}-${action==='idle'?'stand':'walk1'}.webp`,category:'allies',status:'missing',size:[384,384],transparent:true,view,pose:action,frame:action==='walk'?1:undefined,usedIn:`NPC ${e.name}`,studioOwner:{id:e.id,name:e.name,group:'npcs'}};M.assets.push(slot)}
  await doApply(slot,{path:tile.file},{note:'ก่อนเปลี่ยนเป็น '+tile.id},true);state.arm=null;rebuild();render()}
 const filesOpen=()=>{try{return localStorage.getItem('studio.filesOpen')==='1'}catch(x){return false}};
 /* v98.392 · each cell of a character's table: datum status (own points / 11 · face vs standing pose) + ✔ checked, and 📍 / 📐 shortcuts that open the Scale Lineup row on THIS pose · direction */
 const lidOf=e=>e.id==='hero'?'hero':String(e.id).replace(/^(ally|npc):/,'');
 /* v98.415 · DRAG TO SWAP two animation cells of one character. The slots keep their files; the PICTURES change places, frame by frame
    (different frame counts: the first n frames swap, the rest stay). What belongs to a picture travels with it: datum points, the ✔ / ✎ tick,
    the review status. Each slot's previous picture goes to its history as usual. A cell that only mirrors its partner direction (no file of
    its own) cannot be dragged, and cannot receive a set yet. */
 let dragClip=null;
 const ownSet=(e,c)=>(e.group==='characters'||e.group==='npcs')&&c.frames.length>0&&c.frames.every(f=>!f.flip&&!f.crop&&byId(f.assetId)?.file);
 function swapMeta(e,A,B,n,stA,stB){const lid=lidOf(e),PD=window.ProportionDatum;
  if(PD){const d=PD.all();PD.swapPts(d,lid,A.action,A.view,B.action,B.view,n);PD.saveAll(d)}
  try{window.ProportionRulers?.swap(lid,A.action,A.view,B.action,B.view)}catch(x){}   /* v98.444 · drawn rulers travel with the picture */
  try{const K='proportion-done-v1',D=JSON.parse(localStorage.getItem(K)||'{}')||{},ka=lid+'|'+A.action+'|'+A.view,kb=lid+'|'+B.action+'|'+B.view,va=D[ka],vb=D[kb];if(vb)D[ka]=vb;else delete D[ka];if(va)D[kb]=va;else delete D[kb];localStorage.setItem(K,JSON.stringify(D))}catch(x){}
  try{const K='asset-animation-reviews-v1',S=JSON.parse(localStorage.getItem(K)||'{}')||{},now=c=>entity()?.clips.find(x=>x.id===c.id),nA=now(A),nB=now(B);if(nA)S[R.signature(nA)]={status:stB==='needsfix'?'unreviewed':stB,frames:{}};if(nB)S[R.signature(nB)]={status:stA==='needsfix'?'unreviewed':stA,frames:{}};localStorage.setItem(K,JSON.stringify(S))}catch(x){}}
 async function swapClips(e,A,B){if(typeof dir==='undefined'||!dir)return needFolder();
  if(!ownSet(e,B)){toast('ช่องปลายทางใช้ภาพกลับด้านจากทิศคู่ (ไม่มีไฟล์ของตัวเอง) — ยังวางชุดภาพลงช่องแบบนี้ไม่ได้');return}
  const n=Math.min(A.frames.length,B.frames.length),un=A.frames.length!==B.frames.length,nm=c=>`${pretty(c.action)} ${c.view} (${c.frames.length} เฟรม)`;
  if(!confirm(`สลับภาพทั้งชุดของ ${e.name}\n\n• ${nm(A)}\n↔ ${nm(B)}\n\n${un?`จำนวนเฟรมไม่เท่ากัน: สลับ ${n} เฟรมแรก เฟรมที่เกินอยู่ที่เดิม\n`:''}จุด Datum · ติ๊ก ✔ · สถานะตรวจ ย้ายตามภาพ\nภาพเดิมของแต่ละช่องเก็บไว้ในประวัติ (กู้กลับได้)`))return;
  try{const stA=reviewStatus(A),stB=reviewStatus(B),pairs=[];
   for(let i=0;i<n;i++){const a=byId(A.frames[i].assetId),b=byId(B.frames[i].assetId);if(!a||!b||a===b||a.file===b.file)continue;pairs.push([a,b,await readFile(a.file),await readFile(b.file)])}   /* read BOTH sides first — writing one would change what the other reads */
   if(!pairs.length){toast('สองช่องนี้ใช้ไฟล์ภาพเดียวกันอยู่แล้ว');return}
   for(const [a,b,fa,fb] of pairs){await applyToSlot(a,{blob:fb},{note:'สลับกับ '+b.id});await applyToSlot(b,{blob:fa},{note:'สลับกับ '+a.id})}
   await saveManifest();imageCache.clear();bust=Date.now();rebuild();swapMeta(e,A,B,n,stA,stB);
   toast(`สลับแล้ว ${pairs.length} เฟรม: ${pretty(A.action)} ${A.view} ↔ ${pretty(B.action)} ${B.view}`);emit('studio-frames-changed')}catch(x){console.error(x);toast('สลับไม่สำเร็จ: '+x.message)}
  render()}
 function pdRow(e,c){if(!['characters','npcs'].includes(e.group)||!['SW','NW','NE','SE'].includes(c.view))return '';const PD=window.ProportionDatum,lid=lidOf(e),sz=c.frames?.[0]?.size||[384,384],st=PD?PD.status(lid,c.action,c.view,sz[0],sz[1]):null;
  let done='';try{done=(JSON.parse(localStorage.getItem('proportion-done-v1')||'{}')||{})[lid+'|'+c.action+'|'+c.view]||''}catch(x){}
  /* v98.403 · แนวลึก: this pose vs the character's own standing pose (PD.depth) — ↕✔ / ↕⚠ / ↕✘, details in the tooltip */
  const dp=st&&st.own&&PD.depth?PD.depth(lid,c.action,0,c.view,sz[0],sz[1]):null,dTip=dp&&PD.depthText(dp),dB=!dp?'':dp.ref?`<span class="pd-ok" title="${esc(dTip)}">↕⚓</span>`:(dp.noRef||dp.noFace)?`<span class="pd-none" title="${esc(dTip)}">↕?</span>`:`<span class="pd-${dp.level==='ok'?'ok':dp.level==='warn'?'warn':'bad'}" title="แนวลึก (เทียบท่ายืนของตัวเอง): ${esc(dTip)}">↕${{ok:'✔',warn:'⚠',bad:'✘'}[dp.level]}</span>`;
  return `<span class="pd-row">${st?`<span title="datum ของทิศนี้ (วางเอง/ทั้งหมด)">📍${st.own}/${st.total}</span>${dB}`:'<span class="pd-none" title="ยังไม่มี datum">📍—</span>'}${done==='ok'?'<span class="pd-ok" title="ติ๊กแล้วว่าปรับถูกต้อง">✔</span>':done==='adj'?'<span class="pd-bad" title="ปรับแล้ว รอติ๊ก">✎</span>':''}<span class="pd-act" data-pd="datum" title="วาง datum ท่า·ทิศนี้">📍</span><span class="pd-act" data-pd="ratio" title="ดู/ปรับสัดส่วน ท่า·ทิศนี้">📐</span></span>`}
 async function dockOpen(e,c,open){const d=$('lineupDock'),f=$('lineupDockFrame');if(!d||!f)return;if(d.classList.contains('min'))$('dockToggle')?.click();if(!f.src)dockSync(true);
  d.scrollIntoView({behavior:'smooth',block:'start'});for(let i=0;i<160;i++){try{if(f.contentWindow.__lineupReady&&f.contentWindow.dockGoto)break}catch(x){}await new Promise(r=>setTimeout(r,250))}
  try{await f.contentWindow.dockGoto({id:lidOf(e),action:c.action,view:c.view,frame:0,open})}catch(x){toast('เปิดแถว Scale Lineup ไม่ได้: '+x.message)}}
 {let t=0;addEventListener('storage',ev=>{if(ev.key==='proportion-datum-v1'||ev.key==='proportion-done-v1'){clearTimeout(t);t=setTimeout(()=>{try{render()}catch(x){}},600)}})}
 function renderEntity(){let e=entity();$('filters').innerHTML='';lookBar(e);state.entries=[];previewObserver.disconnect();viewed.clear();
  if(!e){$('grid').innerHTML='<div class="entity-empty">เลือกตัวหรือวัตถุทางซ้าย<p>ถ้าไม่มีรายการ ลองเชื่อมโฟลเดอร์เกมหรือเปลี่ยนหมวด</p></div>';return}
  let clips=e.clips.filter(visible),matrixClips=clips.filter(c=>c.kind!=='static'||c.view!=='—'&&/idle|walk|windup|strike|guard|hit|down/.test(c.action));
  let views=dirs.filter(d=>matrixClips.some(c=>c.view===d));for(let c of matrixClips)if(!views.includes(c.view))views.push(c.view);
  // Characters always show the 4 diagonal directions. Empty is explicit; no invented fallback.
  if(e.group!=='objects')views=[...dirs.slice(0,4),...views.filter(d=>!dirs.slice(0,4).includes(d))];
  let actionOrder=['idle','walk','run','windup','strike','attack','guard','hit','cast','special','down'];let actions=[...new Set(matrixClips.map(c=>c.action))].sort((a,b)=>{let rank=x=>actionOrder.includes(x)?actionOrder.indexOf(x):x.startsWith('daily.')?40:/review/.test(x)?100:30;return rank(a)-rank(b)||a.localeCompare(b)});
  /* v98.90 · a character always shows the standard rows (stand · walk · attack windup/strike · guard · hit · down), even when nothing exists yet — an empty row is a slot to fill later, never a row that is simply not there */
  if(e.group==='characters'||e.group==='npcs'){const std=e.group==='npcs'?['idle','walk']:['idle','walk','windup','strike','guard','hit','down'];for(const a of std)if(!actions.includes(a))actions.push(a);actions.sort((a,b)=>{const r=x=>actionOrder.includes(x)?actionOrder.indexOf(x):x.startsWith('daily.')?40:/review/.test(x)?100:30;return r(a)-r(b)||a.localeCompare(b)})}
  function allPassed(action){let required=M.studioRequiredDirections?.[e.id]?.[action]||(e.group==='objects'?[...new Set(e.clips.filter(c=>c.action===action).map(c=>c.view))]:dirs.slice(0,4));return required.length>0&&required.every(view=>{let sets=e.clips.filter(c=>c.action===action&&c.view===view);return sets.length>0&&sets.every(c=>!missing(c)&&reviewStatus(c)==='approved')})}let cells=[],matrix=actions.length?`<div class="matrix-wrap"><table class="anim-matrix"><thead><tr><th>ท่า / ทิศ</th>${views.map(d=>`<th>${esc(d==='FRONT'?'หน้าตรง':d==='TOP'?'มุมบน':d)}</th>`).join('')}</tr></thead><tbody>${actions.map(action=>`<tr class="${allPassed(action)?'set-approved':''}"><th>${esc(pretty(action))}${allPassed(action)?'<small class="set-approved-label">ผ่านครบทุกทิศ</small>':''}</th>${views.map(view=>{let cc=matrixClips.filter(c=>c.action===action&&c.view===view);return `<td>${cc.length?cc.map(c=>{let n=cells.push(c)-1,status=reviewStatus(c),fps=1000*c.frames.length/R.duration(c),mirrored=c.frames.some(f=>f.flip);return `<button class="clip-cell ${status==='approved'&&!missing(c)?'approved':''}" data-clip-index="${n}" title="เปิดตรวจ ${esc(c.action+' '+c.view)}"><canvas width="224" height="214"></canvas><small>${c.frames.length} เฟรม · ${fps.toFixed(1)} FPS${mirrored?' · กลับภาพ':''}</small>${pdRow(e,c)}<span class="clip-status ${status==='needsfix'?'bad':status==='approved'?'good':''}">${c.frames.every(f=>['missing','planned'].includes(byId(f.assetId)?.status))?'ยังไม่มีภาพ · เติมได้':missing(c)?'ไฟล์ขาด':status==='approved'?'':status==='needsfix'?'ต้องแก้':'รอตรวจ'}</span></button>`}).join(''):`<span class="missing-cell" data-empty="${esc(action+'|'+view)}">ยังไม่มี · เติมทีหลังได้</span>`}</td>`}).join('')}</tr>`).join('')}</tbody></table></div>`:'<div class="entity-empty">มีเฉพาะภาพนิ่ง ยังไม่มีชุดแอนิเมชัน</div>';
  let aa=e.assets.filter(a=>!query||(a.id+' '+a.file+' '+a.subject).toLowerCase().includes(query));
  $('grid').innerHTML=`<div class="entity-head"><div class="entity-title"><div><span class="entity-tag">${esc(C.groups[e.group])}</span><h2>${esc(e.name)}${sizeBadge(e)}</h2><p>${e.assets.length} ไฟล์ · ${e.clips.filter(c=>c.kind!=='static').length} ชุดท่า · กดช่องเพื่อดูเฟรมทั้งหมด</p></div></div><div class="entity-controls"><div class="tb-group" data-g="edit"><span class="tb-label">แก้ภาพ</span><span class="tb-items"></span></div><div class="tb-group" data-g="scale"><span class="tb-label">สเกล</span><span class="tb-items"><button id="scaleCheck" title="วัดความกว้างหัวของทุกท่า เทียบมาตรฐานของตัวละคร">⚖ ตรวจสเกล</button><span class="grp-scale" title="ย่อ/ขยายตัวภาพทุกท่าทุกทิศ รอบจุดยืน · บันทึกทีละชุดแบบปกติ (กู้ชุดก่อนหน้าได้)">สเกลกลุ่ม <select id="gsWho"><option value="one">ตัวนี้ทั้งตัว</option><option value="all">ทุกตัวในหมวดนี้</option></select><button data-gs="-5">−5</button><button data-gs="-1">−1</button><b id="gsVal">0%</b><button data-gs="1">+1</button><button data-gs="5">+5</button><button id="gsApply" disabled>ใช้</button></span></span></div><div class="tb-group" data-g="play" title="ทุกช่องใช้เวลาเดียวกัน · เลื่อนตารางเพื่อดูทิศอื่น"><span class="tb-label">พรีวิว</span><span class="tb-items"><button id="matrixPlay">${state.playing?'⏸ หยุด':'▶ เล่น'}</button><button id="matrixReset" title="ให้ทุกช่องเริ่มเฟรมแรกพร้อมกัน">⟲ เริ่มพร้อมกัน</button><label>ความเร็ว <select id="matrixSpeed">${[.25,.5,.75,1,1.5,2].map(v=>`<option ${state.speed===v?'selected':''} value="${v}">${v}×</option>`).join('')}</select></label></span></div></div></div>${state.arm?`<div id="armBar" class="arm-bar">📌 กำลังเลือกภาพ <b>${esc(state.arm)}</b> — กดช่องในตารางด้านบนที่ต้องการใส่ภาพนี้ <button type="button" id="armCancel">ยกเลิก</button></div>`:''}${matrix}<details class="files-box"${filesOpen()||state.arm?' open':''}><summary class="section-title files-title">ภาพและไฟล์ของ ${esc(e.name)} <small>(${aa.length})</small> <button id="auditAssets" type="button" title="หาไฟล์ที่ช่องอ้างถึงแต่ไม่มีอยู่จริง">🔎 ตรวจไฟล์ขาด</button></summary><p class="inventory-note">ภาพประกอบ ชีท และเฟรมต้นฉบับ · กดเพื่อเปลี่ยนภาพหรือดูประวัติ · 📌 ใส่ช่อง = เลือกภาพแล้วกดช่องในตาราง</p><div class="asset-cards">${aa.map(a=>`<div class="tile" data-id="${esc(a.id)}" tabindex="0" role="button">${thumbOf(a)}<b>${esc(a.id)}</b><small>${esc(a.file)}</small><span class="badge s-${a.status}">${esc(SHORT[a.status]||a.status)}</span>${a.file&&a.status!=='missing'?`<button type="button" class="arm-btn${state.arm===a.id?' on':''}" data-arm="${esc(a.id)}" title="เลือกภาพนี้ แล้วกดช่องในตารางด้านบนเพื่อใส่">${state.arm===a.id?'✔ เลือกอยู่':'📌 ใส่ช่อง'}</button>`:''}</div>`).join('')}</div></details>`;
  if(window.StudioScale?.quickCheck&&['characters','npcs','monsters'].includes(e.group)){const mine=e.id;window.StudioScale.quickCheck(e).then(msg=>{if(!msg||state.entity!==mine)return;const p=$('grid').querySelector('.entity-title p');$('grid').querySelectorAll('.scale-warn').forEach(x=>x.remove());if(p){const w=document.createElement('span');w.className='scale-warn';w.style.cssText='display:block;color:#a8402f;font-size:12px;margin-top:2px';w.textContent='⚠ '+msg;p.after(w)}}).catch(()=>{})}
  $('grid').querySelectorAll('[data-clip-index]').forEach(b=>{let c=cells[+b.dataset.clipIndex],canvas=b.querySelector('canvas');state.entries.push({clip:c,canvas,images:null,frame:-1});previewObserver.observe(canvas);b.onclick=ev=>{const pd=ev.target.closest('[data-pd]');if(pd){ev.stopPropagation();dockOpen(e,c,pd.dataset.pd);return}state.arm?placeInto(c):window.AssetAnimationReview.open(c.id)};
   /* v98.415 · drag a cell onto another cell of the same character → the two sets swap pictures (see swapClips) */
   if(ownSet(e,c)){b.draggable=true;b.title+=' · ลากไปวางบนอีกช่องเพื่อสลับภาพทั้งชุด';b.ondragstart=ev=>{dragClip=c;ev.dataTransfer.effectAllowed='move';try{ev.dataTransfer.setData('text/plain',c.id)}catch(x){}b.classList.add('dragging')};b.ondragend=()=>{dragClip=null;b.classList.remove('dragging');$('grid').querySelectorAll('.drop-ok').forEach(x=>x.classList.remove('drop-ok'))}}
   b.ondragover=ev=>{if(!dragClip||dragClip===c)return;ev.preventDefault();ev.dataTransfer.dropEffect='move';b.classList.add('drop-ok')};b.ondragleave=()=>b.classList.remove('drop-ok');
   b.ondrop=ev=>{ev.preventDefault();b.classList.remove('drop-ok');const from=dragClip;dragClip=null;if(from&&from!==c)swapClips(e,from,c)}});
  $('grid').querySelectorAll('[data-empty]').forEach(b=>{b.ondragover=ev=>{if(dragClip)ev.preventDefault()};b.ondrop=ev=>{ev.preventDefault();if(dragClip){dragClip=null;toast('ช่องว่างยังรับการลากไม่ได้ — ใช้ 📌 ใส่ช่อง หรือนำเข้าภาพให้ช่องนี้ก่อน')}}});
  $('grid').querySelectorAll('[data-empty]').forEach(b=>{b.onclick=()=>{if(state.arm)placeEmpty(e,b.dataset.empty)};b.style.cursor=state.arm?'pointer':''});
  $('grid').querySelectorAll('[data-arm]').forEach(b=>b.onclick=ev=>{ev.stopPropagation();state.arm=state.arm===b.dataset.arm?null:b.dataset.arm;renderEntity()});
  if($('armCancel'))$('armCancel').onclick=()=>{state.arm=null;renderEntity()};
  $('grid').classList.toggle('arming',!!state.arm);
  $('grid').querySelectorAll('.tile[data-id]').forEach(b=>{b.onclick=()=>openSlot(b.dataset.id);b.onkeydown=ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();b.click()}}});
  $('matrixPlay').onclick=()=>{if(state.playing){state.pausedAt=(performance.now()-state.epoch)*state.speed;state.playing=false}else{state.epoch=performance.now()-(state.pausedAt||0)/state.speed;state.playing=true}$('matrixPlay').textContent=state.playing?'⏸ หยุด':'▶ เล่น'};
  $('matrixReset').onclick=resetClock;{/* v98.01 · group scale (+/- % by 1 and 5): live preview on the grid, then applied set by set */
  const setsOf=x=>x.clips.filter(c=>['SW','NW','NE','SE'].includes(c.view)&&c.frames?.length).map(c=>c.id),val=$('gsVal'),apply=$('gsApply'),show=()=>{const v=state.groupScale||0;val.textContent=(v>0?'+':'')+v+'%';apply.disabled=!v;$('grid').style.setProperty('--gs',1+v/100);$('grid').classList.toggle('gs-preview',!!v)};show();
  $('grid').querySelectorAll('[data-gs]').forEach(b=>b.onclick=()=>{state.groupScale=Math.max(-50,Math.min(50,(state.groupScale||0)+ +b.dataset.gs));show()});
  apply.onclick=async()=>{const v=state.groupScale||0;if(!v)return;const all=$('gsWho').value==='all',list=all?state.model.filter(x=>x.group===e.group):[e],ids=list.flatMap(setsOf);if(!ids.length){toast('ไม่มีชุดท่าให้ปรับ');return}
   if(!confirm((v>0?'ขยาย':'ย่อ')+' '+Math.abs(v)+'% · '+(all?'ทุกตัวในหมวด ('+list.length+' ตัว)':e.name)+' · '+ids.length+' ชุดท่า\nบันทึกทีละชุด (กู้ชุดก่อนหน้าได้) · ใช้เวลาสักครู่'))return;
   apply.disabled=true;try{const r=await window.StudioUnifiedReview.batchScale(ids,v,(n,t,c)=>{val.textContent=n+'/'+t;toast('ปรับสเกล '+n+'/'+t+' · '+c.label+' '+c.action+' '+c.view)});state.groupScale=0;
    toast('ปรับสเกลแล้ว '+r.done+' ชุด'+(r.skipped?' · ข้าม '+r.skipped+' ชุดที่ใช้ภาพร่วม/กลับด้าน':'')+(r.clipped.length?' · ⚠ ล้นขอบ: '+r.clipped.slice(0,4).join(', '):'')+(r.failed.length?' · ไม่สำเร็จ '+r.failed.length+': '+r.failed[0]:''))}
   catch(err){toast('ปรับสเกลไม่ได้: '+err.message)}finally{render()}}}if($('scaleCheck'))$('scaleCheck').onclick=()=>window.StudioScale?.openReport(e);$('matrixSpeed').onchange=ev=>{let now=performance.now(),elapsed=state.playing?(now-state.epoch)*state.speed:state.pausedAt||0;state.speed=+ev.target.value;state.epoch=now-elapsed/state.speed};$('auditAssets').onclick=ev=>{ev.preventDefault();ev.stopPropagation();audit(e.assets)};{const fb=$('grid').querySelector('.files-box');if(fb)fb.ontoggle=()=>{try{localStorage.setItem('studio.filesOpen',fb.open?'1':'0')}catch(x){}}}if($('importWalkSet'))$('importWalkSet').onclick=()=>window.StudioWalkImport.open();
  loadPreviews();hydrate($('grid'));window.AssetBatch?.refresh();
 }
 const legacyLibrary=renderLibrary,legacyRetired=renderRetired;
 render=function(){CS=null;rebuild();let inGroup=state.model.filter(e=>e.group===state.group);if(!inGroup.some(e=>e.id===state.entity))state.entity=inGroup[0]?.id||'';
  document.querySelectorAll('[data-group]').forEach(b=>b.classList.toggle('on',b.dataset.group===state.group));$('animTab')?.classList.toggle('on',['characters','npcs','monsters','bosses'].includes(state.group));if(document.body.classList.contains('workshop-open')){document.querySelectorAll('[data-group]').forEach(b=>b.classList.remove('on'));$('animTab')?.classList.remove('on')}/* v98.16 · Workshop / 3D Frame cover the library: only their own tab stays lit */connButton();$('exportBtn').hidden=!pending.size&&!window.AnimationReviewExtraFiles?.size;$('exportBtn').textContent='ส่งออก ZIP ('+pending.size+')';
  $('summary').textContent=`${state.model.length} ตัว / วัตถุ · ${M.assets.filter(isSlot).length} ช่อง${pending.size?' · รอส่งออก '+pending.size:''}`;
  if(tab==='slots'){renderNav();renderEntity()}else{state.entries=[];if(tab==='library')legacyLibrary();else legacyRetired();hydrate($('grid'))}
 };
 list=function(){return tab==='slots'?(entity()?.assets||[]).filter(a=>matchQ(a)&&slotFilter(a)):[]};
 const originalDetail=detail;detail=function(){originalDetail();if(sel){document.body.classList.add('detail-open');let close=document.createElement('button');close.textContent='ปิด';close.className='detail-close';close.onclick=()=>{document.body.classList.remove('detail-open');sel=null;stopAnim()};$('detail').prepend(close)}else document.body.classList.remove('detail-open')};
 const oldGoSlot=goSlot;goSlot=function(a){let o=C.owner(a,meta);state.group=o.group;state.entity=o.id;oldGoSlot(a)};
 function gotoGroup(g){state.group=g;if(['characters','npcs','monsters','bosses'].includes(g))state.lastAnim=g;state.entityQuery='';tab='slots';query='';$('q').value='';sel=null;render();document.body.classList.remove('detail-open')}
 document.querySelectorAll('[data-group]').forEach(b=>b.onclick=()=>gotoGroup(b.dataset.group));
 $('animTab')?.addEventListener('click',()=>gotoGroup(state.lastAnim||(['characters','npcs','monsters','bosses'].includes(state.group)?state.group:'characters')));
 
 // Fold batch/request commands into one secondary tools menu.
 let tools=document.createElement('details');tools.id='extraTools';tools.innerHTML='<summary>เครื่องมือเพิ่มเติม</summary><div></div>';$('studioTools').append(tools);
 for(let id of ['selAll','selNone','batchBtn','importBtn','promptPack','animationReviewButton'])if($(id))tools.lastElementChild.append($(id));
 const auditButton=document.createElement('button');auditButton.textContent='ตรวจไฟล์ทั้งหมด';auditButton.onclick=()=>audit(M.assets.filter(isSlot));tools.lastElementChild.append(auditButton);
 async function audit(aa){let bad=aa.filter(a=>a.file&&(dir? !hasFile(a.file):['missing','planned','code'].includes(a.status))),d=document.createElement('dialog');d.className='studio-audit';d.innerHTML=`<h2>ตรวจไฟล์ · ${bad.length} รายการ</h2><p>${dir?'ตรวจจากไฟล์จริงในโฟลเดอร์ '+esc(dir.name):'ยังไม่เชื่อมโฟลเดอร์ แสดงจากสถานะในรายการเท่านั้น'}</p>${bad.map(a=>`<div class="audit-row"><b>${esc(a.id)}</b><small>${esc(a.file)}</small></div>`).join('')||'<p>ไม่พบไฟล์ขาดในรายการนี้</p>'}<button>ปิด</button>`;document.body.append(d);d.querySelector('button').onclick=()=>d.close();d.onclose=()=>d.remove();d.showModal()}
 // Folder selection is transactional: validate and read first, then switch all models and caches.
 async function readAt(h,path){let parts=path.split('/'),d=h;for(let p of parts.slice(0,-1))d=await d.getDirectoryHandle(p);return (await (await d.getFileHandle(parts.at(-1))).getFile()).text()}
 async function optional(h,path,fn){try{return fn(await readAt(h,path))}catch(e){if(e.name==='NotFoundError')return null;throw e}}
 function validateManifest(m){if(!m||!Array.isArray(m.assets)||!Array.isArray(m.categories)||!m.statuses)throw new Error('รูปแบบ manifest ไม่ถูกต้อง');for(let a of m.assets)if(a.file&&(!(/^(assets|art-production)\//.test(a.file))||a.file.split('/').some(p=>p==='..'||p==='.')||a.file.includes('\\')))throw new Error('พาธภาพไม่ปลอดภัย: '+a.id);return m}
 async function readManifest(h){for(let [path,js]of [['data/asset-manifest.json',false],['asset-manifest.json',false],['js/asset-manifest.js',true],['asset-manifest.js',true]]){let m=await optional(h,path,s=>validateManifest(js?C.jsonAssignment(s,'ASSET_MANIFEST'):JSON.parse(s)));if(m)return {m,json:path.endsWith('.json')?path:path.replace(/^js\//,'data/').replace(/\.js$/,'.json'),js:path.startsWith('data/')?'js/asset-manifest.js':path.replace(/\.json$/,'.js')}}throw new Error('ไม่พบ data/asset-manifest.json หรือ js/asset-manifest.js เลือกโฟลเดอร์ที่มี index.html และ assets')}
 function hasWork(){return pending.size||window.AnimationReviewExtraFiles?.size||window.AssetAnimationReview?.hasDrafts?.()||window.StudioWalkImport?.hasDrafts?.()}
 function clearCaches(){for(let f of window.StudioExportedFiles?.values()||[])URL.revokeObjectURL(f.url);window.StudioExportedFiles?.clear();window.AssetAnimationReview.reset?.();state.generation++;for(let url of urlCache.values())URL.revokeObjectURL(url);urlCache.clear();imageCache.clear();bust=Date.now()+state.generation;state.entries=[]}
 async function flush(){let due=saveT;clearTimeout(saveT);saveT=null;await Q;if(due&&dir)await saveManifest();await Q}
 connect=async function(h){if(state.busy)return;state.busy=true;
  try{
   if(hasWork()){alert('มีภาพหรือเฟรมแก้ที่ยังรอใช้ / รอส่งออก กรุณาใช้หรือส่งออกงานเดิมก่อนเปลี่ยนโฟลเดอร์');return}
   await flush();
   if(!h)h=await RepoDir.open();
   if(await h.queryPermission({mode:'readwrite'})!=='granted'&&await h.requestPermission({mode:'readwrite'})!=='granted')throw new Error('ไม่ได้รับสิทธิ์อ่านและเขียนโฟลเดอร์');
   let info=await readManifest(h),assets=await h.getDirectoryHandle('assets'),paths=new Set(await scan(assets,'assets/'));
   try{let art=await h.getDirectoryHandle('art-production');for(let p of await scan(art,'art-production/'))paths.add(p)}catch(e){if(e.name!=='NotFoundError')throw e}
   let hero=await optional(h,'data/animation-data.json',JSON.parse)||await optional(h,'js/animation-data.js',s=>C.jsonAssignment(s,'HERO_ANIMATIONS'));
   let tactics=await optional(h,'js/tactics-sprites.js',s=>C.jsonAssignment(s,'TACTICS_SPRITES'));
   let enemySource=await optional(h,'js/tactics-core.js',s=>s),nextMeta=enemySource?C.enemyMetadata(enemySource):{};
   if(hero&&!hero.clips)throw new Error('animation-data ไม่มี clips');
   clearCaches();dir=h;savedHandle=h;scanned=paths;manifestJsonPath=info.json;manifestJsPath=info.js;for(let k of Object.keys(M))delete M[k];Object.assign(M,info.m);runtime={hero,tactics};meta={...(window.STUDIO_ENEMIES||{}),...nextMeta};   /* v98.444 · monsters the studio's own list knows but js/tactics-core.js has no `art:` line for (goat · pumpkin · pumpkin boss · pest · dummy) keep their Thai name and rank */
   window.StudioVariants?.reset();pristine=tactics?JSON.parse(JSON.stringify(tactics)):null;
   sel=null;selected=null;source=null;result=null;CS=null;sessionStorage.removeItem('asset-batch-sel');for(let id of ['selNone'])$(id)?.click();
   // Keep unregistered image files accessible, without adding them to the game manifest.
   await idbSet('dir',h);resetClock();render();detail();emit('studio-frames-changed');toast('เชื่อม '+h.name+' แล้ว · '+paths.size+' ภาพ');
  }catch(e){if(e.name!=='AbortError'){console.error(e);toast('เชื่อมไม่ได้: '+e.message)}}finally{state.busy=false;connButton()}
 };
 connButton=function(){let b=$('conn');b.textContent=state.busy?'กำลังโหลด…':dir?'📦 GitHub':'📦 กำลังเชื่อม…';b.className=dir?'ok':'';b.disabled=state.busy;$('changeFolder').disabled=state.busy;$('rescan').disabled=state.busy||!dir;$('folderName').textContent='ไฟล์จาก GitHub · งานที่แก้เก็บในเบราว์เซอร์นี้จนกด Push';b.title='ไฟล์ปัจจุบันจาก GitHub · การเปลี่ยนภาพถูกเก็บไว้ก่อน แล้วกด Push เพื่อส่งขึ้น';};
 $('conn').onclick=()=>connect(null);$('rescan').onclick=async()=>{await RepoDir.open(true);connect(null)};
 $('stagedPush').onclick=async()=>{try{if(hasWork()){alert('ยังมีภาพที่รอใช้อยู่ — กดใช้ภาพก่อน แล้วค่อย Push');return}await flush();const t=await RepoDir.pushStaged('Asset Studio: update images ('+RepoDir.count()+' files)');if(t)toast('push แล้ว · '+t)}catch(e){console.error(e);toast('push ไม่สำเร็จ: '+e.message)}};
 $('stagedDrop').onclick=async()=>{if(confirm('ทิ้งงานที่ยังไม่ push ทั้งหมด ('+RepoDir.count()+' ไฟล์)? โหลดหน้าใหม่หลังทิ้ง')){await RepoDir.discard();location.reload()}};
 window.addEventListener('message',e=>{if(e.origin!==location.origin)return;if(e.data?.repoStagedPushed){const keep=window.StudioVariants?.active;RepoDir.afterExternal().then(()=>connect(null)).then(()=>{if(keep&&keep!=='classic'&&window.StudioVariants&&keep!==window.StudioVariants.active)setLook(keep)})}   /* v98.83 · stay on the same look after a push */else if(e.data?.repoStagedDiscarded)location.reload()});
 if(window.parent!==window){const st=document.createElement('style');st.textContent='#stagedPush,#stagedDrop{display:none!important}';document.head.append(st)} // inside the editor shell the push button lives in the top bar
 RepoDir.onChange(n=>{$('stagedPush').textContent='⬆ Push ที่แก้ ('+n+')';$('stagedPush').disabled=!n;$('stagedDrop').hidden=!n});
 // Show orphan files as a single selectable Objects entry; never silently delete or classify them as monsters.
 const baseRebuild=rebuild;rebuild=function(){let ee=baseRebuild();if(dir&&scanned){let known=new Set(M.assets.map(a=>a.file));for(let a of M.assets)for(let h of a.history||[])known.add(h.file);let loose=[...scanned].filter(p=>!known.has(p)&&!known.has(webpTwin(p))&&!p.startsWith('assets/_versions/'));
   if(loose.length)ee.push({id:'object:unassigned',name:'ไฟล์ยังไม่จัดหมวด',group:'objects',assets:loose.map((p,i)=>({id:'unassigned-'+i,file:p,category:'unassigned',status:'final',size:[384,384]})),clips:[],loose:true})}return ee};

 /* v98.16 · ไฟล์ยังไม่จัดหมวด: แยกเป็นหมวดตามโฟลเดอร์ + ตัวกรอง + ค้นหา (ชีทรวมถูกตัดเป็นชิ้นเดี่ยวใน assets/village-town/props/) */
 const LOOSE_CATS=[
  [/^assets\/village-town\/props\//,'props','🪑','Props ชิ้นเดี่ยว (หมู่บ้าน)'],
  [/^assets\/village-town\/buildings\//,'vt-bld','🏠','อาคาร (หมู่บ้าน)'],
  [/^assets\/village-town\/decor\//,'vt-decor','🌷','ของตกแต่ง (หมู่บ้าน)'],
  [/^assets\/village-town\/nature\//,'vt-nature','🌳','ธรรมชาติ (หมู่บ้าน)'],
  [/^assets\/village-town\/edge\//,'vt-edge','🧱','ขอบ / รั้ว (หมู่บ้าน)'],
  [/^assets\/village-town\/ground\//,'vt-ground','🟫','พื้นผิว (หมู่บ้าน)'],
  [/^assets\/village-town\/templates\//,'vt-tpl','📐','เทมเพลต (หมู่บ้าน)'],
  [/^assets\/village-town\/npc\/([^/]+)\//,'npc','🧑','NPC',m=>m[1]],
  [/^assets\/village-town\/[^/]+$/,'sheet','🖼','ชีทรวม / ภาพใหญ่ (หมู่บ้าน)'],
  [/^assets\/enemies\/animations\/([^/]+)\//,'enemy','👾','ศัตรู · เฟรมอนิเมชัน',m=>m[1]],
  [/^assets\/fx\/particle\//,'fx-p','✨','เอฟเฟกต์ · อนุภาค'],
  [/^assets\/fx\/skill\//,'fx-s','💥','เอฟเฟกต์ · สกิล'],
  [/^assets\/terrain\/cliff\//,'t-cliff','⛰','พื้นสนาม · หน้าผา'],
  [/^assets\/terrain\/decal\//,'t-decal','🩹','พื้นสนาม · ดีคอล'],
  [/^assets\/terrain\/diorama\//,'t-dio','🏞','พื้นสนาม · ไดโอรามา'],
  [/^assets\/terrain\/ground\//,'t-ground','🟩','พื้นสนาม · พื้นดิน'],
  [/^assets\/terrain\/lip\//,'t-lip','〰','พื้นสนาม · ขอบหน้าผา'],
  [/^assets\/terrain\//,'t-other','🗺','พื้นสนาม · อื่น ๆ'],
  [/^assets\/tactics\/imported\//,'tac-imp','📥','สนามตาราง · นำเข้า'],
  [/^assets\/tactics\/cliff\//,'tac-cliff','⛰','สนามตาราง · หน้าผา'],
  [/^assets\/tactics\//,'tac','♟','สนามตาราง'],
  [/^assets\/portraits\//,'portrait','👤','ภาพบุคคล'],
  [/^assets\/cards\//,'cards','🃏','การ์ด']];
 function looseCat(p){for(const [re,id,ic,name,sub] of LOOSE_CATS){const m=p.match(re);if(m){const s=sub?sub(m):'';return {key:id+(s?':'+s:''),icon:ic,name:name+(s?' · '+s:''),order:LOOSE_CATS.findIndex(c=>c[1]===id)}}}return {key:'other',icon:'📁',name:'อื่น ๆ',order:99}}
 const baseRenderEntity=renderEntity;renderEntity=function(){if(!entity()?.loose)return baseRenderEntity();state.entries=[];previewObserver.disconnect();viewed.clear();let e=entity();$('filters').innerHTML='';
  const q=(state.looseQ||'').trim().toLowerCase(),cat=state.looseCat||'',groups=new Map();
  for(const a of e.assets){const c=looseCat(a.file);if(!groups.has(c.key))groups.set(c.key,{...c,files:[]});groups.get(c.key).files.push(a.file)}
  const all=[...groups.values()].sort((a,b)=>a.order-b.order||a.name.localeCompare(b.name,'th')),nat=(a,b)=>a.localeCompare(b,undefined,{numeric:true});
  const shown=all.filter(g=>!cat||g.key===cat).map(g=>({...g,files:g.files.filter(f=>!q||f.toLowerCase().includes(q)||g.name.toLowerCase().includes(q)).sort(nat)})).filter(g=>g.files.length),total=shown.reduce((n,g)=>n+g.files.length,0);
  $('grid').innerHTML=`<h2>ไฟล์ยังไม่จัดหมวด · ${e.assets.length} ไฟล์</h2><p class="muted">พบในโฟลเดอร์ แต่ไม่มีใน manifest · แยกตามหมวด เลือกภาพเพื่อดูและนำไปใช้กับช่องในเกม</p>
   <div class="loose-bar"><input id="looseQ" type="search" placeholder="ค้นหาชื่อไฟล์ / หมวด" value="${esc(state.looseQ||'')}"><span class="muted">แสดง ${total} ไฟล์</span></div>
   <div class="loose-chips"><button data-lc="" class="${cat?'':'on'}">ทั้งหมด <i>${e.assets.length}</i></button>${all.map(g=>`<button data-lc="${esc(g.key)}" class="${cat===g.key?'on':''}">${g.icon} ${esc(g.name)} <i>${g.files.length}</i></button>`).join('')}</div>
   ${shown.map(g=>`<details class="loose-sec" open><summary>${g.icon} ${esc(g.name)} <i>${g.files.length}</i></summary><div class="asset-cards">${g.files.map(f=>`<div class="itile" data-k="${esc(f)}" title="${esc(f)}"><div class="thumb">${imgTag(f)}</div><b>${esc(f.split('/').pop())}</b></div>`).join('')}</div></details>`).join('')||'<p class="muted">ไม่พบไฟล์ที่ตรงกับคำค้น</p>'}`;
  $('grid').querySelectorAll('[data-k]').forEach(t=>t.onclick=()=>openImg(t.dataset.k));
  $('grid').querySelectorAll('[data-lc]').forEach(b=>b.onclick=()=>{state.looseCat=b.dataset.lc;renderEntity()});
  $('looseQ').oninput=ev=>{const c=ev.target.selectionStart;state.looseQ=ev.target.value;renderEntity();$('looseQ').focus();$('looseQ').setSelectionRange(c,c)};hydrate($('grid'))};
 // Refresh matrix review badges when the reviewer closes.
 $('animation-review')?.addEventListener('close',()=>{imageCache.clear();render()});
 /* v98.95 · ⚖ Scale Lineup bridge. The lineup page (a frame of this page) reads the CURRENT pictures — look edits, unpushed frames, group-scale results — and follows the Animation selection. */
 const emit=(name,detail)=>{try{window.dispatchEvent(new CustomEvent(name,{detail}))}catch(e){}};
 /* the standing picture facing `view` (SW | SE) of a character: [file, mirrored] candidates, best first (same sources as the bust thumbnails) */
 function standingOf(id,view){
  const opp=view==='SW'?'SE':'SW';
  if(id==='hero'){const D=runtime.tactics?.directions||{},a=D[view]?.idle,b=D[opp]?.idle,o=[];if(a?.src)o.push([a.src,!!a.flipImage]);if(b?.src)o.push([b.src,!b.flipImage]);return o}
  const k=id.replace(/^ally:/,''),v=view.toLowerCase(),w=opp.toLowerCase();
  return [...studioStand(id,view),[`assets/village-town/npc/${k}/${v}-stand.webp`,false],[`assets/village-town/npc/${k}/${w}-stand.webp`,true],[`assets/tactics/${k}_${v}_idle.webp`,false],[`assets/tactics/${k}_${w}_idle.webp`,true]];
 }
 const lineup={
  /* v98.452 · the hero's open look (male / female / classic) and a way to switch it from the Lineup */
  look(){return window.StudioVariants?.active||'classic'},
  setLook(id){setLook(id);return window.StudioVariants?.active===id},
  /* the characters of the Animation tab (same list): id, name, and the clips that have frames */
  entities(){return state.model.filter(e=>e.group==='characters'||e.group==='npcs').map(e=>({id:e.id,name:e.name,group:e.group,clips:e.clips.filter(c=>c.frames?.length).map(c=>({id:c.id,action:c.action,view:c.view,n:c.frames.length}))}))},
  /* a picture of that character: a chosen clip frame, or the standing picture. → {url,file,flip,label} or null */
  async picture(id,view,clipId,index){
   const e=state.model.find(x=>x.id===id);if(!e)return null;
   if(clipId){const c=e.clips.find(x=>x.id===clipId),f=c?.frames?.[Math.max(0,Math.min(c.frames.length-1,index|0))];if(f){const img=await im(f.file);if(img)return {url:img.src,file:f.file,flip:!!f.flip,label:`${c.action} · ${c.view} · เฟรม ${(index|0)+1}/${c.frames.length}`}}}
   for(const [file,flip] of standingOf(id,view||'SW')){if(dir&&scanned&&!hasFile(file))continue;const img=await im(file);if(img)return {url:img.src,file,flip,label:'ท่ายืน '+(view||'SW')}}
   return null;
  },
  /* the lineup selected a character → show it in the Animation tab */
  select(id){const e=state.model.find(x=>x.id===id);if(!e||state.entity===id)return;state.group=e.group;state.entity=id;try{render()}catch(x){}}
 };
 window.StudioBrowser={loadImage:im,state,location:a=>{let o=C.owner(a,meta);return C.groups[o.group]+' › '+o.name},connect,getRuntime:()=>runtime,getMetadata:()=>meta,readManifest,rebuild,hasWork,invalidate:()=>{imageCache.clear();bust=Date.now();resetClock();render();publishMotion();emit('studio-frames-changed')},lineup,rerender:()=>render(),animGroup:()=>state.group};   /* v98.399 · Scale Lineup reads this to follow the left-panel group tab instead of keeping its own duplicate filter */
 render();detail();requestAnimationFrame(tick);
 (async()=>{try{await connect(null)}catch(e){console.error(e)}})();
})();
