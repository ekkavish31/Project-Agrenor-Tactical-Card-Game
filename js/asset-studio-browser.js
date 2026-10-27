/* Entity-first Asset Studio v40. Existing import/history tools remain available in the drawer. */
(function(){
 'use strict';
 const C=window.StudioCatalog,R=window.AnimationReviewModel;
 const state={group:'characters',entity:'hero',entityQuery:'',playing:true,speed:1,epoch:performance.now(),entries:[],model:[],generation:0,busy:false};
 let meta=window.STUDIO_ENEMIES||{},runtime={tactics:typeof TACTICS_SPRITES==='undefined'?null:TACTICS_SPRITES,hero:typeof HERO_ANIMATIONS==='undefined'?null:HERO_ANIMATIONS};
 const nativeCatalog=R.catalog,imageCache=new Map();let motionChannel=null,motionSignature='',motionTicket=0;try{motionChannel=new BroadcastChannel('project-a-hero-motion')}catch{}
 function publishMotion(){
  if(!motionChannel||!dir||!runtime.tactics)return;const data=HeroMotion.snapshot(runtime.tactics),sig=JSON.stringify(data);if(sig===motionSignature)return;motionSignature=sig;const ticket=++motionTicket;
  (async()=>{const paths=[...new Set(Object.values(data.directions).flatMap(d=>d.walk.map(f=>f.src)))],resolved=new Map();for(const path of paths){const src=await srcOf(path);if(!src)continue;try{const blob=await (await fetch(src)).blob(),url=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(blob)});resolved.set(path,url)}catch{resolved.set(path,path)}}if(ticket!==motionTicket)return;for(const d of Object.values(data.directions))for(const f of d.walk)f.src=resolved.get(f.src)||f.src;motionChannel.postMessage({kind:'hero-walk',data})})().catch(()=>{motionSignature=''});
 }

 const names={idle:'ยืน / หายใจ',walk:'เดิน',run:'วิ่ง',windup:'เตรียมโจมตี',strike:'โจมตี',attack:'โจมตี',guard:'ป้องกัน',hit:'ถูกโจมตี',down:'ล้ม / ตาย',cast:'ร่ายเวท',special:'ท่าพิเศษ'};
 const dirs=['SW','NW','NE','SE','S','W','N','E','FRONT','TOP','—'];
 const pretty=a=>names[a]||a.replace(/^daily\./,'ชีวิตประจำวัน · ').replace(/^sword\./,'ดาบ · ').replace(/^hammer\./,'ค้อน · ').replace(/^unarmed\./,'มือเปล่า · ');
 function clipsFor(manifest){
  window.StudioWalks?.apply(runtime.tactics,manifest);
  let raw=nativeCatalog(manifest,runtime),active=(manifest.assets||[]).filter(a=>a.status!=='unused'),files=new Map(active.map(a=>[a.file,a]));
  // Runtime sequences preserve repeated ready/recovery frames and their actual timings.
  if(runtime.hero?.clips){raw=raw.filter(c=>c.entity!=='hero-town');for(let [key,c]of Object.entries(runtime.hero.clips)){
   if(/(?:^|\.)(?:walk|run)(?:\.|$)/.test(key)||!c.frames?.length||!c.frames.every(f=>files.has(f.src)))continue;
   let frames=c.frames.map(f=>{let a=files.get(f.src);return {assetId:a.id,file:f.src,cell:0,crop:null,ms:f.ms||120,flip:!!f.flipImage,pivot:c.anchor||a.anchor||a.pivot||[.5,1],size:c.canvas||a.size||[384,384],renderHeight:a.renderHeight||1,revision:a.artRevision||''}});
   raw.push({id:'clip:'+key,canonical:key,entity:'hero-town',label:'ตัวหลัก',action:key,view:/walk|sword|hammer|unarmed/.test(key)?'E':'FRONT',loop:!!c.loop,kind:'files',frames});
  }}
  const heroIds=new Set(active.filter(a=>C.owner(a,meta).id==='hero').map(a=>a.id));return raw.filter(c=>(!/(?:walk|run)/i.test(c.action)||!c.frames.some(f=>heroIds.has(f.assetId))||c.id.startsWith('runtime:hero:walk:'))&&(!runtime.tactics?._studioCreatedDirections?.has(c.view)||c.action==='walk'));
 }
 function rebuild(){state.model=C.build(M,clipsFor(M),meta);return state.model}
 // Share one catalog between matrix and the detailed reviewer, including static assets.
 R.catalog=function(manifest){return C.build(manifest,clipsFor(manifest),meta).flatMap(e=>e.clips)};
 function entity(){return state.model.find(e=>e.id===state.entity)}
 function reviewStatus(c){
  let status='unreviewed';try{let store=JSON.parse(localStorage.getItem('asset-animation-reviews-v1')||'{}'),r=store[R.signature(c)];r=r||M.studioReviews?.[R.signature(c)];status=Object.values(r?.frames||{}).some(f=>f.flagged)?'needsfix':r?.status||status}catch{}
  let work=window.StudioUnifiedReview?.getState();if(work?.clip===c.id&&work.dirty)status='unreviewed';if(c.frames.some(f=>byId(f.assetId)?.qaStatus==='needs-fix'))status='needsfix';
  return status;
 }
 function visible(c){if(!query)return true;return (c.action+' '+pretty(c.action)+' '+c.view+' '+c.frames.map(f=>f.assetId+' '+f.file).join(' ')).toLowerCase().includes(query)}
 function missing(c){return c.frames.some(f=>dir&&scanned?!scanned.has(f.file):['missing','planned','code'].includes(byId(f.assetId)?.status))}
 async function im(file){let key=state.generation+'|'+file;if(!imageCache.has(key)){let generation=state.generation;imageCache.set(key,(async()=>{let src=await srcOf(file);if(generation!==state.generation||!src)return null;return new Promise(resolve=>{let i=new Image();i.onload=()=>resolve(i);i.onerror=()=>resolve(null);i.src=src})})())}return imageCache.get(key)}
 function draw(canvas,image,f){let g=canvas.getContext('2d'),W=canvas.width,H=canvas.height;g.clearRect(0,0,W,H);if(!image){g.fillStyle='#956147';g.font='13px sans-serif';g.textAlign='center';g.fillText('ไม่พบภาพ',W/2,H/2);return}
  let h=H*.79*(f.renderHeight||1),w=h*f.size[0]/f.size[1];if(w>W*.94){h*=W*.94/w;w=W*.94}g.save();g.translate(W/2,H*.91);if(f.flip)g.scale(-1,1);if(f.crop)g.drawImage(image,...f.crop,-w*f.pivot[0],-h*f.pivot[1],w,h);else g.drawImage(image,-w*f.pivot[0],-h*f.pivot[1],w,h);g.restore();
 }
 async function loadPreviews(){let gen=state.generation,items=state.entries;for(let entry of items){entry.images=await Promise.all(entry.clip.frames.map(f=>im(f.file)));if(gen!==state.generation||state.entries!==items)return;draw(entry.canvas,entry.images[0],entry.clip.frames[0])}}
 let viewed=new Set();const previewObserver=new IntersectionObserver(es=>{for(let e of es)e.isIntersecting?viewed.add(e.target):viewed.delete(e.target)},{root:$('gridWrap'),rootMargin:'100px'});
 function tick(now){requestAnimationFrame(tick);if(document.hidden||$('animation-review')?.open)return;let elapsed=state.playing?(now-state.epoch)*state.speed:state.pausedAt||0;
  for(let p of state.entries){if(!viewed.has(p.canvas)||!p.images)continue;let i=R.frameAt(p.clip,elapsed,true);if(p.frame!==i){p.frame=i;draw(p.canvas,p.images[i],p.clip.frames[i])}}
 }
 function resetClock(){state.epoch=performance.now();state.pausedAt=0;for(let p of state.entries)p.frame=-1}
 function renderNav(){let search=state.entityQuery.toLowerCase(),all=state.model.filter(e=>e.group===state.group),ee=all.filter(e=>(e.name+' '+e.id).toLowerCase().includes(search));
  const ANIM=['characters','monsters','bosses'],subs=ANIM.includes(state.group)?'<div class="subtabs">'+[['characters','ตัวละคร'],['monsters','มอนสเตอร์'],['bosses','มินิบอส / บอส']].map(([g,n])=>`<button data-sub="${g}" class="${g===state.group?'on':''}">${n}</button>`).join('')+'</div>':'';
  $('cats').innerHTML=subs+`<h4>${esc(C.groups[state.group])} · ${all.length}</h4><input id="entitySearch" type="search" placeholder="ค้นหาตัว / วัตถุ" aria-label="ค้นหาในหมวด" value="${esc(state.entityQuery)}">`+ee.map(e=>{
   let a=(e.id==='hero'?e.assets.find(a=>a.id==='tactics-hero-se-idle'):null)||e.assets.find(a=>/^(card-|enemy-|ally-)/.test(a.id)&&!a.animation)||e.assets.find(a=>!a.animation)||e.assets[0];
   return `<button data-entity="${esc(e.id)}" class="${e.id===state.entity?'on':''}">${a?.file?imgTag(a.file):''}<span class="nav-copy"><b>${esc(e.name)}</b><small>${e.clips.filter(c=>c.kind!=='static').length} ชุดท่า · ${e.assets.length} ไฟล์${e.rank==='boss'?' · บอส':e.rank==='miniboss'?' · มินิบอส':''}</small></span></button>`}).join('')+(ee.length?'':'<p class="muted">ไม่พบรายการ</p>');
  $('cats').querySelectorAll('[data-sub]').forEach(b=>b.onclick=()=>gotoGroup(b.dataset.sub));
  $('entitySearch').oninput=e=>{let caret=e.target.selectionStart;state.entityQuery=e.target.value;renderNav();$('entitySearch').focus();$('entitySearch').setSelectionRange(caret,caret)};
  $('cats').querySelectorAll('[data-entity]').forEach(b=>b.onclick=()=>{state.entity=b.dataset.entity;sel=null;selected=null;document.body.classList.remove('detail-open');render();$('gridWrap').scrollTop=0});hydrate($('cats'));
 }
 function renderEntity(){let e=entity();$('filters').innerHTML='';state.entries=[];previewObserver.disconnect();viewed.clear();
  if(!e){$('grid').innerHTML='<div class="entity-empty">เลือกตัวหรือวัตถุทางซ้าย<p>ถ้าไม่มีรายการ ลองเชื่อมโฟลเดอร์เกมหรือเปลี่ยนหมวด</p></div>';return}
  let clips=e.clips.filter(visible),matrixClips=clips.filter(c=>c.kind!=='static'||c.view!=='—'&&/idle|walk|windup|strike|guard|hit|down/.test(c.action));
  let views=dirs.filter(d=>matrixClips.some(c=>c.view===d));for(let c of matrixClips)if(!views.includes(c.view))views.push(c.view);
  // Characters always show all 8 directions. Empty is explicit; no invented fallback.
  if(e.group!=='objects')views=[...dirs.slice(0,8),...views.filter(d=>!dirs.slice(0,8).includes(d))];
  let actionOrder=['idle','walk','run','windup','strike','attack','guard','hit','cast','special','down'];let actions=[...new Set(matrixClips.map(c=>c.action))].sort((a,b)=>{let rank=x=>actionOrder.includes(x)?actionOrder.indexOf(x):x.startsWith('daily.')?40:/review/.test(x)?100:30;return rank(a)-rank(b)||a.localeCompare(b)});
  function allPassed(action){let required=M.studioRequiredDirections?.[e.id]?.[action]||(e.group==='objects'?[...new Set(e.clips.filter(c=>c.action===action).map(c=>c.view))]:dirs.slice(0,8));return required.length>0&&required.every(view=>{let sets=e.clips.filter(c=>c.action===action&&c.view===view);return sets.length>0&&sets.every(c=>!missing(c)&&reviewStatus(c)==='approved')})}let cells=[],matrix=actions.length?`<div class="matrix-wrap"><table class="anim-matrix"><thead><tr><th>ท่า / ทิศ</th>${views.map(d=>`<th>${esc(d==='FRONT'?'หน้าตรง':d==='TOP'?'มุมบน':d)}</th>`).join('')}</tr></thead><tbody>${actions.map(action=>`<tr class="${allPassed(action)?'set-approved':''}"><th>${esc(pretty(action))}${allPassed(action)?'<small class="set-approved-label">ผ่านครบทุกทิศ</small>':''}</th>${views.map(view=>{let cc=matrixClips.filter(c=>c.action===action&&c.view===view);return `<td>${cc.length?cc.map(c=>{let n=cells.push(c)-1,status=reviewStatus(c),fps=1000*c.frames.length/R.duration(c),mirrored=c.frames.some(f=>f.flip);return `<button class="clip-cell ${status==='approved'&&!missing(c)?'approved':''}" data-clip-index="${n}" title="เปิดตรวจ ${esc(c.action+' '+c.view)}"><canvas width="224" height="214"></canvas><small>${c.frames.length} เฟรม · ${fps.toFixed(1)} FPS${mirrored?' · กลับภาพ':''}</small><span class="clip-status ${status==='needsfix'?'bad':status==='approved'?'good':''}">${missing(c)?'ไฟล์ขาด':status==='approved'?'ผ่าน':status==='needsfix'?'ต้องแก้':'รอตรวจ'}</span></button>`}).join(''):'<span class="missing-cell">ยังไม่มี</span>'}</td>`}).join('')}</tr>`).join('')}</tbody></table></div>`:'<div class="entity-empty">มีเฉพาะภาพนิ่ง ยังไม่มีชุดแอนิเมชัน</div>';
  let aa=e.assets.filter(a=>!query||(a.id+' '+a.file+' '+a.subject).toLowerCase().includes(query));
  $('grid').innerHTML=`<div class="entity-title"><div><span class="entity-tag">${esc(C.groups[e.group])}</span><h2>${esc(e.name)}</h2><p>${e.assets.length} ไฟล์ · ${e.clips.filter(c=>c.kind!=='static').length} ชุดท่า · กดช่องเพื่อดูเฟรมทั้งหมด</p></div><div class="row"><button id="auditAssets">ตรวจไฟล์ขาด</button></div></div><div class="entity-controls"><button id="matrixPlay">${state.playing?'หยุดพรีวิว':'เล่นพรีวิว'}</button><button id="matrixReset">เริ่มพร้อมกัน</button><label>ความเร็ว <select id="matrixSpeed">${[.25,.5,.75,1,1.5,2].map(v=>`<option ${state.speed===v?'selected':''} value="${v}">${v}×</option>`).join('')}</select></label><span class="muted">ทุกช่องใช้เวลาเดียวกัน · เลื่อนตารางเพื่อดูทิศอื่น</span></div>${matrix}<h3 class="section-title">ภาพและไฟล์ของ ${esc(e.name)}</h3><p class="inventory-note">ภาพประกอบ ชีท และเฟรมต้นฉบับ · กดเพื่อเปลี่ยนภาพหรือดูประวัติ</p><div class="asset-cards">${aa.map(a=>`<div class="tile" data-id="${esc(a.id)}" tabindex="0" role="button">${thumbOf(a)}<b>${esc(a.id)}</b><small>${esc(a.file)}</small><span class="badge s-${a.status}">${esc(SHORT[a.status]||a.status)}</span></div>`).join('')}</div>`;
  $('grid').querySelectorAll('[data-clip-index]').forEach(b=>{let c=cells[+b.dataset.clipIndex],canvas=b.querySelector('canvas');state.entries.push({clip:c,canvas,images:null,frame:-1});previewObserver.observe(canvas);b.onclick=()=>window.AssetAnimationReview.open(c.id)});
  $('grid').querySelectorAll('.tile[data-id]').forEach(b=>{b.onclick=()=>openSlot(b.dataset.id);b.onkeydown=ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();b.click()}}});
  $('matrixPlay').onclick=()=>{if(state.playing){state.pausedAt=(performance.now()-state.epoch)*state.speed;state.playing=false}else{state.epoch=performance.now()-(state.pausedAt||0)/state.speed;state.playing=true}$('matrixPlay').textContent=state.playing?'หยุดพรีวิว':'เล่นพรีวิว'};
  $('matrixReset').onclick=resetClock;$('matrixSpeed').onchange=ev=>{let now=performance.now(),elapsed=state.playing?(now-state.epoch)*state.speed:state.pausedAt||0;state.speed=+ev.target.value;state.epoch=now-elapsed/state.speed};$('auditAssets').onclick=()=>audit(e.assets);if($('importWalkSet'))$('importWalkSet').onclick=()=>window.StudioWalkImport.open();
  loadPreviews();hydrate($('grid'));window.AssetBatch?.refresh();
 }
 const legacyLibrary=renderLibrary,legacyRetired=renderRetired;
 render=function(){CS=null;rebuild();let inGroup=state.model.filter(e=>e.group===state.group);if(!inGroup.some(e=>e.id===state.entity))state.entity=inGroup[0]?.id||'';
  document.querySelectorAll('[data-group]').forEach(b=>b.classList.toggle('on',b.dataset.group===state.group));$('animTab')?.classList.toggle('on',['characters','monsters','bosses'].includes(state.group));$('viewMode').value=tab;connButton();$('exportBtn').hidden=!pending.size&&!window.AnimationReviewExtraFiles?.size;$('exportBtn').textContent='ส่งออก ZIP ('+pending.size+')';
  $('summary').textContent=`${state.model.length} ตัว / วัตถุ · ${M.assets.filter(isSlot).length} ช่อง${pending.size?' · รอส่งออก '+pending.size:''}`;
  if(tab==='slots'){renderNav();renderEntity()}else{state.entries=[];if(tab==='library')legacyLibrary();else legacyRetired();hydrate($('grid'))}
 };
 list=function(){return tab==='slots'?(entity()?.assets||[]).filter(a=>matchQ(a)&&slotFilter(a)):[]};
 const originalDetail=detail;detail=function(){originalDetail();if(sel){document.body.classList.add('detail-open');let close=document.createElement('button');close.textContent='ปิด';close.className='detail-close';close.onclick=()=>{document.body.classList.remove('detail-open');sel=null;stopAnim()};$('detail').prepend(close)}else document.body.classList.remove('detail-open')};
 const oldGoSlot=goSlot;goSlot=function(a){let o=C.owner(a,meta);state.group=o.group;state.entity=o.id;oldGoSlot(a)};
 function gotoGroup(g){state.group=g;if(['characters','monsters','bosses'].includes(g))state.lastAnim=g;state.entityQuery='';tab='slots';query='';$('q').value='';sel=null;render();document.body.classList.remove('detail-open')}
 document.querySelectorAll('[data-group]').forEach(b=>b.onclick=()=>gotoGroup(b.dataset.group));
 $('animTab')?.addEventListener('click',()=>gotoGroup(state.lastAnim||(['characters','monsters','bosses'].includes(state.group)?state.group:'characters')));
 $('viewMode').onchange=ev=>{tab=ev.target.value;sel=null;lkind='all';document.body.classList.remove('detail-open');render()};
 // Fold batch/request commands into one secondary tools menu.
 let tools=document.createElement('details');tools.id='extraTools';tools.innerHTML='<summary>เครื่องมือเพิ่มเติม</summary><div></div>';$('studioTools').append(tools);
 for(let id of ['selAll','selNone','batchBtn','importBtn','promptPack','animationReviewButton'])if($(id))tools.lastElementChild.append($(id));
 const auditButton=document.createElement('button');auditButton.textContent='ตรวจไฟล์ทั้งหมด';auditButton.onclick=()=>audit(M.assets.filter(isSlot));tools.lastElementChild.append(auditButton);
 async function audit(aa){let bad=aa.filter(a=>a.file&&(dir? !scanned?.has(a.file):['missing','planned','code'].includes(a.status))),d=document.createElement('dialog');d.className='studio-audit';d.innerHTML=`<h2>ตรวจไฟล์ · ${bad.length} รายการ</h2><p>${dir?'ตรวจจากไฟล์จริงในโฟลเดอร์ '+esc(dir.name):'ยังไม่เชื่อมโฟลเดอร์ แสดงจากสถานะในรายการเท่านั้น'}</p>${bad.map(a=>`<div class="audit-row"><b>${esc(a.id)}</b><small>${esc(a.file)}</small></div>`).join('')||'<p>ไม่พบไฟล์ขาดในรายการนี้</p>'}<button>ปิด</button>`;document.body.append(d);d.querySelector('button').onclick=()=>d.close();d.onclose=()=>d.remove();d.showModal()}
 // Folder selection is transactional: validate and read first, then switch all models and caches.
 async function readAt(h,path){let parts=path.split('/'),d=h;for(let p of parts.slice(0,-1))d=await d.getDirectoryHandle(p);return (await (await d.getFileHandle(parts.at(-1))).getFile()).text()}
 async function optional(h,path,fn){try{return fn(await readAt(h,path))}catch(e){if(e.name==='NotFoundError')return null;throw e}}
 function validateManifest(m){if(!m||!Array.isArray(m.assets)||!Array.isArray(m.categories)||!m.statuses)throw new Error('รูปแบบ manifest ไม่ถูกต้อง');for(let a of m.assets)if(a.file&&(!(/^(assets|art-production)\//.test(a.file))||a.file.split('/').some(p=>p==='..'||p==='.')||a.file.includes('\\')))throw new Error('พาธภาพไม่ปลอดภัย: '+a.id);return m}
 async function readManifest(h){for(let [path,js]of [['data/asset-manifest.json',false],['asset-manifest.json',false],['js/asset-manifest.js',true],['asset-manifest.js',true]]){let m=await optional(h,path,s=>validateManifest(js?C.jsonAssignment(s,'ASSET_MANIFEST'):JSON.parse(s)));if(m)return {m,json:path.endsWith('.json')?path:path.replace(/^js\//,'data/').replace(/\.js$/,'.json'),js:path.startsWith('data/')?'js/asset-manifest.js':path.replace(/\.json$/,'.js')}}throw new Error('ไม่พบ data/asset-manifest.json หรือ js/asset-manifest.js เลือกโฟลเดอร์ที่มี index.html และ assets')}
 function applyVillageRuntime(hero,manifest){if(!hero)return;let files=new Set(manifest.assets.map(a=>a.file)),base='assets/characters/hero/village/',neutral=ms=>({src:base+'idle-neutral.webp',ms});if(!files.has(base+'idle-neutral.webp'))return;
  hero.clips['daily.idle']={loop:false,frames:[neutral(1800)]};for(let [key,pose,ms]of [['look','look',1400],['adjust','adjust',1400],['relax','stretch',1400],['yawn','yawn',1600],['squat','squat',3200],['stretch-up','stretch-up',2000],['easy','easy',2600]]){let src=base+'idle-'+pose+'.webp';if(files.has(src))hero.clips['daily.'+key]={loop:false,frames:[neutral(key==='look'||key==='adjust'||key==='relax'?350:300),{src,ms},neutral(key==='look'||key==='adjust'||key==='relax'?500:450)]}}}
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
   if(hero&&!hero.clips)throw new Error('animation-data ไม่มี clips');applyVillageRuntime(hero,info.m);
   clearCaches();dir=h;savedHandle=h;scanned=paths;manifestJsonPath=info.json;manifestJsPath=info.js;for(let k of Object.keys(M))delete M[k];Object.assign(M,info.m);runtime={hero,tactics};meta=nextMeta;
   sel=null;selected=null;source=null;result=null;CS=null;sessionStorage.removeItem('asset-batch-sel');for(let id of ['selNone'])$(id)?.click();
   // Keep unregistered image files accessible, without adding them to the game manifest.
   await idbSet('dir',h);resetClock();render();detail();toast('เชื่อม '+h.name+' แล้ว · '+paths.size+' ภาพ');
  }catch(e){if(e.name!=='AbortError'){console.error(e);toast('เชื่อมไม่ได้: '+e.message)}}finally{state.busy=false;connButton()}
 };
 connButton=function(){let b=$('conn');b.textContent=state.busy?'กำลังโหลด…':dir?'📦 GitHub':'📦 กำลังเชื่อม…';b.className=dir?'ok':'';b.disabled=state.busy;$('changeFolder').disabled=state.busy;$('rescan').disabled=state.busy||!dir;$('folderName').textContent='ไฟล์จาก GitHub · งานที่แก้เก็บในเบราว์เซอร์นี้จนกด Push';b.title='ไฟล์ปัจจุบันจาก GitHub · การเปลี่ยนภาพถูกเก็บไว้ก่อน แล้วกด Push เพื่อส่งขึ้น';};
 $('conn').onclick=()=>connect(null);$('rescan').onclick=async()=>{await RepoDir.open(true);connect(null)};
 $('stagedPush').onclick=async()=>{try{if(hasWork()){alert('ยังมีภาพที่รอใช้อยู่ — กดใช้ภาพก่อน แล้วค่อย Push');return}await flush();const t=await RepoDir.pushStaged('Asset Studio: update images ('+RepoDir.count()+' files)');if(t)toast('push แล้ว · '+t)}catch(e){console.error(e);toast('push ไม่สำเร็จ: '+e.message)}};
 $('stagedDrop').onclick=async()=>{if(confirm('ทิ้งงานที่ยังไม่ push ทั้งหมด ('+RepoDir.count()+' ไฟล์)? โหลดหน้าใหม่หลังทิ้ง')){await RepoDir.discard();location.reload()}};
 RepoDir.onChange(n=>{$('stagedPush').textContent='⬆ Push ที่แก้ ('+n+')';$('stagedPush').disabled=!n;$('stagedDrop').hidden=!n});
 // Show orphan files as a single selectable Objects entry; never silently delete or classify them as monsters.
 const baseRebuild=rebuild;rebuild=function(){let ee=baseRebuild();if(dir&&scanned){let known=new Set(M.assets.map(a=>a.file));for(let a of M.assets)for(let h of a.history||[])known.add(h.file);let loose=[...scanned].filter(p=>!known.has(p)&&!p.startsWith('assets/_versions/'));
   if(loose.length)ee.push({id:'object:unassigned',name:'ไฟล์ยังไม่จัดหมวด',group:'objects',assets:loose.map((p,i)=>({id:'unassigned-'+i,file:p,category:'unassigned',status:'final',size:[384,384]})),clips:[],loose:true})}return ee};
 const baseRenderEntity=renderEntity;renderEntity=function(){if(!entity()?.loose)return baseRenderEntity();state.entries=[];let e=entity();$('filters').innerHTML='';$('grid').innerHTML='<h2>ไฟล์ยังไม่จัดหมวด</h2><p class="muted">พบในโฟลเดอร์ แต่ไม่มีใน manifest เลือกภาพเพื่อดูและนำไปใช้กับช่องในเกม</p><div class="asset-cards">'+e.assets.map(a=>`<div class="itile" data-k="${esc(a.file)}"><div class="thumb">${imgTag(a.file)}</div><b>${esc(a.file)}</b></div>`).join('')+'</div>';$('grid').querySelectorAll('[data-k]').forEach(t=>t.onclick=()=>openImg(t.dataset.k));hydrate($('grid'))};
 // Refresh matrix review badges when the reviewer closes.
 $('animation-review')?.addEventListener('close',()=>{imageCache.clear();render()});
 window.StudioBrowser={state,location:a=>{let o=C.owner(a,meta);return C.groups[o.group]+' › '+o.name},connect,getRuntime:()=>runtime,getMetadata:()=>meta,readManifest,rebuild,hasWork,invalidate:()=>{imageCache.clear();bust=Date.now();resetClock();render();publishMotion()}};
 render();detail();requestAnimationFrame(tick);
 (async()=>{try{await connect(null)}catch(e){console.error(e)}})();
})();
