/* v38j · Push edits straight to the GitHub repo from the browser (no git needed).
   One fine-grained token (Contents: read & write on this repo only) is kept in this browser's localStorage.
   commit(message, build): reads the latest main, lets build() produce files from it (so merges use the newest data),
   writes one commit and moves main forward; if someone pushed in between it rebuilds and tries again. */
(function(){'use strict';
const KEY='projectA.github',API='https://api.github.com';
const defaults={owner:'ekkavish31',repo:'Project-Agrenor-Tactical-Card-Game',branch:'main',token:'',auto:true,review:false,cart:true};
function config(){try{return{...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch(e){return{...defaults}}}
function save(c){try{localStorage.setItem(KEY,JSON.stringify({...config(),...c}))}catch(e){}}
const enabled=()=>{const c=config();return!!(c.token&&c.auto)};
async function call(path,opt={}){const c=config();const r=await fetch(API+'/repos/'+c.owner+'/'+c.repo+path,{...opt,headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',Authorization:'Bearer '+c.token,...(opt.body?{'Content-Type':'application/json'}:{}),...(opt.headers||{})}});
 if(!r.ok){let m='';try{m=(await r.json()).message}catch(e){}const err=new Error('GitHub '+r.status+(m?': '+m:''));err.status=r.status;throw err}return r}
const json=async(p,o)=>(await call(p,o)).json();
async function readText(path,ref){const c=config();try{return await(await call('/contents/'+path.split('/').map(encodeURIComponent).join('/')+'?ref='+encodeURIComponent(ref||c.branch),{headers:{Accept:'application/vnd.github.raw+json'}})).text()}catch(e){if(e.status===404)return null;throw e}}
async function b64(content){const bytes=typeof content==='string'?new TextEncoder().encode(content):content instanceof Blob?new Uint8Array(await content.arrayBuffer()):content;let s='';for(let i=0;i<bytes.length;i+=0x8000)s+=String.fromCharCode.apply(null,bytes.subarray(i,i+0x8000));return btoa(s)}
async function test(){const c=config();if(!c.token)throw new Error('ยังไม่ได้ใส่ token');const r=await(await fetch(API+'/repos/'+c.owner+'/'+c.repo,{headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+c.token}})).json();if(!r.full_name)throw new Error(r.message||'เข้าถึง repo ไม่ได้');if(r.permissions&&!r.permissions.push)throw new Error('token นี้ไม่มีสิทธิ์เขียน (Contents: Read and write)');return r.full_name}
/* v92.04 · every picture pushed to assets/ is stored as WebP (≈5× smaller → fast loads). PNG inputs are converted here, in one place, for every editor. */
const KEEP_PNG=/(^|\/)(cursor-[^/]*|cursor\/.*|_versions\/.*|_reviews\/.*)$/i;   /* v98.786 · cursor/ added: the CSS cursors are PNG */
async function toWebp(content){const blob=content instanceof Blob?content:new Blob([content],{type:'image/png'});const bmp=await createImageBitmap(blob),cv=document.createElement('canvas');cv.width=bmp.width;cv.height=bmp.height;cv.getContext('2d').drawImage(bmp,0,0);bmp.close?.();const out=await new Promise(r=>cv.toBlob(r,'image/webp',.92));if(!out||out.type!=='image/webp')throw new Error('แปลง WebP ไม่สำเร็จ');return out}
async function webpFiles(files){const have=new Set(files.map(f=>f.path)),out=[],conv=[];for(const f of files){if(f.remove||!/^assets\/.+\.png$/i.test(f.path)||KEEP_PNG.test(f.path)||typeof f.content==='string'){out.push(f);continue}const wp=f.path.replace(/\.png$/i,'.webp');if(have.has(wp)){conv.push(f.path);continue}try{out.push({...f,path:wp,content:await toWebp(f.content)});have.add(wp);conv.push(f.path)}catch(e){throw new Error('แปลง '+f.path+' เป็น WebP ไม่สำเร็จ — ไม่ push PNG ('+(e.message||e)+')')}}
  /* v97.93: the manifest still named the converted pictures ".png" (the Studio then showed them as missing) — point those names at the .webp too */
  for(const f of out){if(!f.remove&&typeof f.content==='string'&&/(^|\/)asset-manifest\.(json|js)$/.test(f.path)){let t=f.content;for(const c of conv)t=t.split('"'+c+'"').join('"'+c.replace(/\.png$/i,'.webp')+'"');
    /* v98.786 · policy: assets/ holds only WebP (except KEEP_PNG) — a manifest must never name a .png under assets/ (1,733 such names had to be repaired by hand) */
    t=t.replace(/assets\/[^"'\\\s]+?\.png\b/gi,m=>KEEP_PNG.test(m)?m:m.replace(/\.png$/i,'.webp'));f.content=t}}
  const bad=out.filter(f=>!f.remove&&/^assets\/.+\.png$/i.test(f.path)&&!KEEP_PNG.test(f.path));if(bad.length)throw new Error('ห้าม push PNG ใน assets/: '+bad.slice(0,3).map(f=>f.path).join(', '))
  return out}
// build(head) → [{path, content}] where content is string | Uint8Array | Blob; head.read(path) reads files at that commit
/* ---------- v80.x · push progress screen: steps, file progress, elapsed time, clear result ---------- */
function pushScreen(title){
 // v81.14: host the progress UI in the top-level document so an iframe's editor dialog cannot cover it.
 let hostDoc=document;try{if(window.top?.document?.body)hostDoc=window.top.document}catch(e){}
 const css=hostDoc.getElementById('ghPushCss')||Object.assign(hostDoc.createElement('style'),{id:'ghPushCss',textContent:`#ghPush{padding:0;border:0;background:transparent;overflow:visible;max-width:none;max-height:none;font:13px AgThai,system-ui,"Noto Sans Thai",sans-serif;color:#f3e7cf;animation:ghIn .18s ease-out}#ghPush::backdrop{background:#0b0f0ccc;backdrop-filter:blur(3px)}#ghPush:focus,#ghPush:focus-visible{outline:none}@keyframes ghIn{from{opacity:0}}
#ghPush .card{width:min(420px,92vw);background:#1f1a13;border:1px solid #c9893a;border-radius:16px;padding:22px 22px 18px;box-shadow:0 20px 60px #000a;text-align:center}
#ghPush .icon{position:relative;width:96px;height:96px;margin:0 auto 10px}#ghPush .cloud{position:absolute;inset:8px 6px auto;height:46px;border-radius:30px;background:#c9893a33;border:2px solid #c9893a}
#ghPush .arrow{position:absolute;left:50%;top:44px;width:6px;height:34px;margin-left:-3px;background:#f6d79b;border-radius:3px;animation:ghUp 1s ease-in-out infinite}#ghPush .arrow:before{content:'';position:absolute;left:-9px;top:-10px;border:12px solid transparent;border-bottom:12px solid #f6d79b;border-top:0}
@keyframes ghUp{0%{transform:translateY(16px);opacity:0}30%{opacity:1}100%{transform:translateY(-22px);opacity:0}}
#ghPush.ok .arrow,#ghPush.fail .arrow{display:none}#ghPush .mark{position:absolute;inset:0;display:none;place-items:center;font-size:56px;font-weight:700;animation:ghPop .35s cubic-bezier(.2,1.6,.4,1)}#ghPush.ok .mark,#ghPush.fail .mark{display:grid}#ghPush.ok .mark{color:#7fd38b}#ghPush.fail .mark{color:#f07a6a}#ghPush.ok .cloud,#ghPush.fail .cloud{inset:6px auto auto 6px;width:84px;height:84px;border-radius:50%;box-sizing:border-box}#ghPush.ok .cloud{border-color:#7fd38b;background:#7fd38b22}#ghPush.fail .cloud{border-color:#f07a6a;background:#f07a6a22}#ghPush.ok .mark,#ghPush.fail .mark{font-size:44px;line-height:1;padding-bottom:3px}@keyframes ghPop{from{transform:scale(.3);opacity:0}}
#ghPush h3{margin:0 0 4px;color:#f6d79b;font-size:16px}#ghPush .sub{color:#bba57f;margin:0 0 12px;min-height:18px;overflow-wrap:anywhere}
#ghPush ol{list-style:none;padding:0;margin:0 0 12px;text-align:left}#ghPush li{display:flex;gap:8px;align-items:center;padding:4px 2px;color:#8d7d62}#ghPush li i{width:18px;height:18px;border-radius:50%;border:2px solid #4a3b29;flex:none;display:grid;place-items:center;font-style:normal;font-size:11px}
#ghPush li.run{color:#f3e7cf}#ghPush li.run i{border-color:#f6d79b;border-top-color:transparent;animation:ghSpin .8s linear infinite}@keyframes ghSpin{to{transform:rotate(360deg)}}#ghPush li.done{color:#cfe8cf}#ghPush li.done i{border-color:#7fd38b;background:#7fd38b;color:#1f1a13}#ghPush li.bad{color:#f6b0a5}#ghPush li.bad i{border-color:#f07a6a;background:#f07a6a;color:#1f1a13}
#ghPush .bar{height:6px;border-radius:3px;background:#3a2f22;overflow:hidden;margin:2px 0 10px}#ghPush .bar b{display:block;height:100%;width:0;background:linear-gradient(90deg,#c9893a,#f6d79b);transition:width .25s}
#ghPush .foot{display:flex;justify-content:space-between;align-items:center;color:#8d7d62;font-size:12px}#ghPush button{font:inherit;background:#c9893a;color:#fff;border:0;border-radius:8px;padding:7px 14px;cursor:pointer}#ghPush button[hidden]{display:none}#ghPush button.cx{background:transparent;border:1px solid #8d7d62;color:#e6d6b4}#ghPush button.cx[disabled]{opacity:.5;cursor:default}`});
 if(!css.isConnected)(hostDoc.head||hostDoc.documentElement).append(css);hostDoc.getElementById('ghPush')?.remove();
 const STEPS=['อ่านเวอร์ชันล่าสุดบน GitHub','เตรียมไฟล์ที่เปลี่ยน','อัปโหลดไฟล์','สร้าง commit','อัปเดตเกมบน GitHub'];
 const el=hostDoc.createElement('dialog');el.id='ghPush';el.setAttribute('role','status');el.addEventListener('cancel',e=>{if(!el.classList.contains('ok')&&!el.classList.contains('fail'))e.preventDefault()});el.innerHTML=`<div class="card"><div class="icon"><div class="cloud"></div><div class="arrow"></div><div class="mark"></div></div><h3></h3><p class="sub">กำลังส่งงานขึ้น GitHub · อย่าเพิ่งปิดหน้านี้</p><ol>${STEPS.map(t=>`<li><i></i><span>${t}</span></li>`).join('')}</ol><div class="bar"><b></b></div><div class="foot"><span class="time">0 วินาที</span><span><button class="cx" type="button" title="หยุด push ตอนนี้ — งานยังอยู่ใน Cart">ยกเลิก</button> <button class="cl" hidden>ปิด</button></span></div></div>`;
 el.querySelector('h3').textContent=title;hostDoc.body.append(el);try{el.showModal()}catch(e){el.classList.add('gh-push-fallback');el.setAttribute('open','');Object.assign(el.style,{position:'fixed',inset:'0',margin:'auto',zIndex:'2147483647',display:'grid',placeItems:'center',width:'100vw',height:'100vh',maxWidth:'none',maxHeight:'none',background:'#0b0f0ccc'})}
 // stay on top: if any other dialog opens while pushing, re-open this one so it is the newest top-layer element
 const Observer=hostDoc.defaultView?.MutationObserver||MutationObserver;let paused=false;const keepTop=new Observer(recs=>{if(!el.isConnected){keepTop.disconnect();return}if(paused)return;if(recs.some(r=>r.target!==el&&r.target.tagName==='DIALOG'&&r.target.open&&r.target.id!=='ghReviewPush'&&r.target.id!=='ghSettings')&&el.open){try{el.close();el.showModal()}catch(e){}}});keepTop.observe(hostDoc.body,{subtree:true,attributes:true,attributeFilter:['open']});const li=[...el.querySelectorAll('li')],t0=Date.now(),timer=setInterval(()=>{el.querySelector('.time').textContent=Math.round((Date.now()-t0)/1000)+' วินาที'},500),btn=el.querySelector('button.cl'),cx=el.querySelector('button.cx');let cur=-1,closeT=null,cancelled=false;cx.onclick=()=>{cancelled=true;cx.disabled=true;cx.textContent='กำลังยกเลิก…'};
 const close=()=>{clearTimeout(closeT);el.style.transition='opacity .2s';el.style.opacity=0;setTimeout(()=>{try{el.close()}catch(e){}el.remove()},220)};btn.onclick=close;
 return{cancelled:()=>cancelled,lock(){cx.hidden=true},stopped(text){clearInterval(timer);cx.hidden=true;if(cur>=0){li[cur].className='';li[cur].querySelector('i').textContent=''}el.classList.add('fail');el.querySelector('.mark').textContent='⏸';el.querySelector('h3').textContent='ยกเลิกการ push แล้ว';el.querySelector('.sub').textContent=text||'';btn.hidden=false;closeT=setTimeout(close,6000)},pause(){paused=true;try{el.close()}catch(e){}},resume(){paused=false;if(!el.open&&el.isConnected){try{el.showModal()}catch(e){el.setAttribute('open','')}}},
  step(n,text){for(let k=0;k<li.length;k++){li[k].className=k<n?'done':k===n?'run':'';li[k].querySelector('i').textContent=k<n?'✓':''}cur=n;if(text)el.querySelector('.sub').textContent=text;el.querySelector('.bar b').style.width=(n/STEPS.length*100)+'%'},
  files(done,total){li[2].querySelector('span').textContent=`อัปโหลดไฟล์ ${done}/${total}`;el.querySelector('.bar b').style.width=((2+done/Math.max(1,total))/STEPS.length*100)+'%'},
  note(text){el.querySelector('.sub').textContent=text},
  ok(ver,detail){clearInterval(timer);cx.hidden=true;li.forEach(x=>{x.className='done';x.querySelector('i').textContent='✓'});el.classList.add('ok');el.querySelector('.mark').textContent='✓';el.querySelector('h3').textContent='push สำเร็จ'+(ver?' · '+ver:'');el.querySelector('.sub').textContent=(detail?detail+' · ':'')+'เกมบน GitHub อัปเดตแล้ว · เปิดเกมใหม่ (Ctrl+F5) เพื่อโหลดของใหม่';el.querySelector('.bar b').style.width='100%';btn.hidden=false;closeT=setTimeout(close,detail?12000:4000)},
  fail(err){clearInterval(timer);cx.hidden=true;if(cur>=0){li[cur].className='bad';li[cur].querySelector('i').textContent='✕'}el.classList.add('fail');el.querySelector('.mark').textContent='✕';el.querySelector('h3').textContent='push ไม่สำเร็จ';el.querySelector('.sub').textContent=explain(err);btn.hidden=false},
  close}}
function explain(e){const m=String(e?.message||e);if(e?.status===401)return'token ใช้ไม่ได้หรือหมดอายุ · กด ⬆ GitHub แล้วใส่ token ใหม่';if(e?.status===403||e?.status===404)return'token ไม่มีสิทธิ์เขียน repo นี้ (ต้องเป็น Contents: Read and write) · '+m;if(/Failed to fetch|NetworkError/i.test(m))return'ต่อ GitHub ไม่ได้ · เช็กอินเทอร์เน็ตแล้วลองใหม่';return m+' · งานยังอยู่ในเครื่องนี้ ลองกด push ใหม่ได้'}
function extractSettingsForReview(text){try{const i=text.indexOf('window.GAME_SETTINGS='),a=text.indexOf('{',i),b=text.indexOf('\n};',a);return i<0||a<0||b<0?null:JSON.parse(text.slice(a,b+2))}catch(e){return null}}
/* friendly names of settings keys (push review + Cart) */
const keyNames={'place-maps-v1':'แผนที่ย่อย','place-art-frames-v1':'กรอบบัง/ชนติดภาพ','art-lights-v1':'จุดสว่างติดภาพ','asset-hero-ratio-v1':'ขนาด asset เทียบตัวเอก','battleground-v1':'สนามต่อสู้','project-a-uploaded-decor-v1':'ภาพอัปโหลด','project-a-npc-routes-v1':'เส้นทาง NPC','walk-speed-v1':'ความเร็วเดิน','depth-style-v1':'การบัง/โปร่งใส','map-char-scale-v1':'ขนาดตัวละครต่อแผนที่','everyday-layout-v1':'การ์ด/ผังชีวิตประจำวัน','project-a-village-custom-places-v1':'สถานที่หมู่บ้าน'};
async function reviewBeforePush(message,files,head){
 let hostDoc=document;try{if(window.top&&window.top.document&&window.top.document.body)hostDoc=window.top.document}catch(e){}
 const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
 const names=files.map(f=>f.path),settings=names.includes('js/game-settings.js')?'แก้การตั้งค่าเกม':null,assets=names.filter(p=>p.startsWith('assets/')).length;let changedKeys=[];
 if(settings&&head?.read){try{const old=extractSettingsForReview(await head.read('js/game-settings.js')||''),next=extractSettingsForReview(files.find(f=>f.path==='js/game-settings.js')?.content||'');if(old&&next){const keys=new Set([...Object.keys(old),...Object.keys(next)]);changedKeys=[...keys].filter(k=>JSON.stringify(old[k])!==JSON.stringify(next[k]))}}catch(e){}}

 const lines=[];if(settings)lines.push(changedKeys.length?'แก้การตั้งค่า '+changedKeys.length+' รายการ: '+changedKeys.slice(0,6).map(k=>keyNames[k]||k).join(', ')+(changedKeys.length>6?' และอีก '+(changedKeys.length-6)+' รายการ':''):settings);if(assets)lines.push('เพิ่ม/แก้ Asset '+assets+' ไฟล์');if(names.some(p=>p.includes('village')))lines.push('มีไฟล์แผนที่/หมู่บ้าน');if(names.some(p=>p.includes('battleground')))lines.push('มีไฟล์สนามต่อสู้');if(!lines.length)lines.push('เปลี่ยนไฟล์ '+files.length+' รายการ');
 const dlg=hostDoc.createElement('dialog');dlg.id='ghReviewPush';dlg.style.cssText='width:min(540px,94vw);max-height:85vh;overflow:auto;border:1px solid #c9893a;border-radius:16px;padding:20px;background:#f7f5ee;color:#292b25;font:14px AgThai,system-ui,"Noto Sans Thai",sans-serif;box-shadow:0 22px 80px #0009';
 dlg.innerHTML='<h2 style="margin:0 0 6px">สรุปก่อน Push</h2><p style="margin:0 0 12px;color:#62685b">ตรวจรายการและใส่โน้ต commit ก่อนเริ่มอัปโหลด</p><div style="background:#e9eddf;border-radius:10px;padding:12px"><b>สรุป</b><p>'+esc(lines.join(' · '))+'</p><b>ไฟล์ ('+files.length+')</b><ul style="max-height:160px;overflow:auto;padding-left:22px">'+names.slice(0,12).map(p=>'<li>'+esc(p)+'</li>').join('')+(names.length>12?'<li>และอีก '+(names.length-12)+' ไฟล์</li>':'')+'</ul></div><label style="display:block;margin:12px 0 5px">โน้ต commit</label><textarea id="ghReviewNote" rows="3" style="width:100%;box-sizing:border-box;padding:9px;border:1px solid #b8bcae;border-radius:8px;font:inherit"></textarea><div style="display:flex;gap:8px;justify-content:flex-end;margin-top:14px"><button id="ghReviewCancel">ยกเลิก</button><button id="ghReviewConfirm" style="background:#496b3b;color:white;border:0;border-radius:8px;padding:8px 12px">ยืนยันและ Push</button></div>';
 hostDoc.body.append(dlg);dlg.querySelector('#ghReviewNote').value=message;
 return await new Promise(resolve=>{let done=false;const finish=v=>{if(done)return;done=true;dlg.close();dlg.remove();resolve(v)};dlg.querySelector('#ghReviewCancel').onclick=()=>finish(null);dlg.querySelector('#ghReviewConfirm').onclick=()=>finish(dlg.querySelector('#ghReviewNote').value.trim()||message);dlg.addEventListener('cancel',e=>{e.preventDefault();finish(null)},{once:true});dlg.showModal()});
}

/* v97.03 · every js/ file in a push gets the new version as its ?v= on every page that loads it (game-settings.js used to keep 82.14 / 82.15 / 86
   on different pages, so some pages ran a stale browser copy of the pushed settings). */
const PAGES=['index.html','editor.html','village-town.html','village-place.html','place-interior.html','world-map.html','battle-field.html','battleground.html','progress.html','asset-studio.html','object-asset-studio.html','tree-motion-demo.html'];
async function bumpScriptVersions(files,ver,read){const js=files.filter(f=>!f.remove&&/^js\/[^/]+\.js$/.test(f.path)).map(f=>f.path.slice(3).replace(/[.*+?^${}()|[\]\\]/g,'\\$&'));if(!ver||!js.length)return;
 const re=new RegExp('(js/(?:'+js.join('|')+')\\?v=)[\\d.]+','g');for(const p of PAGES){if(files.some(f=>f.path===p))continue;const t=await read(p);if(!t)continue;const n=t.replace(re,'$1'+ver.slice(1));if(n!==t)files.push({path:p,content:n})}}
// build(head) → [{path, content}] where content is string | Uint8Array | Blob; head.read(path) reads files at that commit
/* v98.649 · fewer files per push: (1) the editors' local safety copies under assets/_versions/ never go to GitHub (git history is the undo), (2) a picture whose bytes are identical to the one already on GitHub is not uploaded again */
async function gitSha(content){const buf=typeof content==='string'?new TextEncoder().encode(content):new Uint8Array(await new Blob([content]).arrayBuffer()),hd=new TextEncoder().encode('blob '+buf.length+'\0'),all=new Uint8Array(hd.length+buf.length);all.set(hd);all.set(buf,hd.length);return [...new Uint8Array(await crypto.subtle.digest('SHA-1',all))].map(b=>b.toString(16).padStart(2,'0')).join('')}
async function trimFiles(files,treeSha){files=files.filter(f=>f.remove||!/^assets\/_versions\//.test(f.path));const bin=files.filter(f=>!f.remove&&typeof f.content!=='string'&&/\.(png|webp|jpe?g|gif)$/i.test(f.path));if(!bin.length)return files;
 let map;try{const t=await json('/git/trees/'+treeSha+'?recursive=1');if(t.truncated||!Array.isArray(t.tree))return files;map=new Map(t.tree.map(e=>[e.path,e.sha]))}catch(e){return files}
 const same=new Set();for(const f of bin){try{if(map.get(f.path)&&map.get(f.path)===await gitSha(f.content))same.add(f)}catch(e){}}return same.size?files.filter(f=>!same.has(f)):files}
async function commit(message,build,onStatus=()=>{},opt={}){const c=config();if(!c.token)throw new Error('ยังไม่ได้ตั้งค่า GitHub token');
 if(cartOn()&&!opt.now&&!FLUSH)return cartStage(message,build,onStatus);   /* v98.387 · 🛒 goes into the cart, pushed later in one commit */
 const ui=pushScreen(message.replace(/\s*\(.*\)$/,'')),say=(n,t)=>{ui.step(n,t);onStatus(t)},gate=()=>{if(ui.cancelled())throw Object.assign(new Error('ยกเลิกแล้ว'),{cancelled:true})};   /* v98.876 · the push dialog has a ยกเลิก button: it stops before the last step (moving main) — nothing is changed on GitHub and the cart is kept */
 try{for(let attempt=1;attempt<=3;attempt++){say(0,'กำลังอ่านเวอร์ชันล่าสุดบน GitHub…');const ref=await json('/git/ref/heads/'+c.branch),head=ref.object.sha,base=await json('/git/commits/'+head);
  gate();say(1,'กำลังเตรียมไฟล์และรวมกับงานล่าสุด…');let files=await build({sha:head,read:p=>readText(p,head)});gate();if(files.length){say(1,'กำลังแปลงภาพ PNG เป็น WebP…');files=await webpFiles(files)}gate();if(files.length){say(1,'กำลังตัดไฟล์ที่ไม่ต้องส่ง…');files=await trimFiles(files,base.tree.sha)}if(!files.length){ui.ok('');ui.note('ไม่มีอะไรเปลี่ยน · ไม่ต้อง push');onStatus('ไม่มีอะไรต้อง push');return null}
  let review=message;if(false){ui.pause();try{review=await reviewBeforePush(message,files,{read:p=>readText(p,head)})}finally{ui.resume()}}if(!review){ui.close();onStatus('ยกเลิกก่อน Push');return null}
  // Small patch → increment the version suffix (v82.3 → v82.4; suffix is a sequence, not a decimal).
  let ver='';try{const vf=await readText('js/game-version.js',head);if(vf){const m=vf.match(/v:'v(\d+)(?:\.(\d+))?'/);if(m){ver='v'+m[1]+'.'+((+m[2]||0)+1);files.push({path:'js/game-version.js',content:vf.replace(/v:'v[\d.]+'/,"v:'"+ver+"'").replace(/date:'[^']*'/,"date:'"+new Date().toISOString().slice(0,10)+"'")})}}}catch(e){}
  try{await bumpScriptVersions(files,ver,p=>readText(p,head))}catch(e){}
  try{files=await canonicalFiles(files)}catch(e){console.warn('canonical manifest',e)}
  const msg=ver?ver+': '+review:review;
  say(2,'กำลังอัปโหลด '+files.length+' ไฟล์…');const tree=[];let n=0;ui.files(0,files.length);for(const f of files){gate();if(f.remove){tree.push({path:f.path,mode:'100644',type:'blob',sha:null});ui.files(++n,files.length);continue}const blob=await json('/git/blobs',{method:'POST',body:JSON.stringify({content:await b64(f.content),encoding:'base64'})});tree.push({path:f.path,mode:'100644',type:'blob',sha:blob.sha});ui.files(++n,files.length)}
  gate();say(3,'กำลังสร้าง commit '+(ver||'')+'…');const t=await json('/git/trees',{method:'POST',body:JSON.stringify({base_tree:base.tree.sha,tree})}),cm=await json('/git/commits',{method:'POST',body:JSON.stringify({message:msg,tree:t.sha,parents:[head]})});
  gate();ui.lock();say(4,'กำลังอัปเดตเกมบน GitHub…');
  try{await call('/git/refs/heads/'+c.branch,{method:'PATCH',body:JSON.stringify({sha:cm.sha,force:false})});try{ES()?.afterPush(files)}catch(e){}const tag=(ver?ver+' ':'')+'('+cm.sha.slice(0,7)+')';onStatus('push แล้ว · '+tag);ui.ok(tag,'commit '+cm.sha.slice(0,7)+' · '+files.length+' ไฟล์: '+files.filter(f=>f.path!=='js/game-version.js').map(f=>f.path.split('/').pop()).slice(0,8).join(', ')+(files.length>9?' และอีก '+(files.length-9):''));return tag}
  catch(e){if(e.status!==422||attempt===3)throw e;ui.note('มีคนเพิ่ง push งานอื่นเข้ามา · รวมงานใหม่แล้วลองอีกครั้ง ('+(attempt+1)+'/3)…');onStatus('main เพิ่งมีงานใหม่ · รวมใหม่แล้วลองอีกครั้ง…')}}}
 catch(e){if(e.cancelled)ui.stopped(FLUSH?'ยังไม่ได้ push อะไรขึ้น GitHub · งานทั้งหมดยังอยู่ใน Cart (กด Push ใหม่ได้เมื่อพร้อม)':'ยังไม่ได้ push อะไรขึ้น GitHub');else ui.fail(e);throw e}}
/* v98.866 · the manifest is always written from ONE parsed object (JSON.parse keeps the last of a repeated key): a text that repeats a key
   (v98.807 wrote 510 repeated studioReviews keys — the stale 'approved' ones came last and won on every computer) can never be pushed again,
   and both manifest files always hold the same data. */
async function canonicalFiles(files){const P='data/asset-manifest.json',PJ='js/asset-manifest.js',fj=files.find(f=>f.path===P&&!f.remove),fs=files.find(f=>f.path===PJ&&!f.remove);if(!fj&&!fs)return files;
 const txt=async c=>typeof c==='string'?c:await new Blob([c]).text();let m=null;
 if(fj)m=JSON.parse(await txt(fj.content));else{const s=await txt(fs.content),i=s.indexOf('window.ASSET_MANIFEST=');m=JSON.parse(s.slice(i+22).trim().replace(/;\s*$/,''))}
 return[...files.filter(f=>f.path!==P&&f.path!==PJ),...manifestFiles(m)]}
// same rules as tools/apply-asset-patch.py
function assetKeys(list){const seen={};return list.map(a=>{const k=a.id+'|'+a.file;seen[k]=(seen[k]||0)+1;return k+'#'+(seen[k]-1)})}
function applyAssetPatch(m,p){const removed=new Set(p.removedAssets||[]);if(removed.size){const ks=assetKeys(m.assets);m.assets=m.assets.filter((a,i)=>!removed.has(ks[i]))}
 let index=new Map(assetKeys(m.assets).map((k,i)=>[k,i]));for(const it of p.assets||[]){const i=index.get(it.key);if(i==null){m.assets.push(it.entry);index=new Map(assetKeys(m.assets).map((k,i)=>[k,i]))}else m.assets[i]=it.entry}
 for(const[name,s]of Object.entries(p.sections||{})){if(!m[name]||typeof m[name]!=='object'||Array.isArray(m[name]))m[name]={};for(const k of s.del||[])delete m[name][k];Object.assign(m[name],s.set||{})}
 for(const[name,v]of Object.entries(p.values||{})){if(v===null)delete m[name];else m[name]=v}return m}
const MANIFEST_HEAD='/* Generated by tools/build-asset-manifest.py and Asset Studio — the list of every game image. */\nwindow.ASSET_MANIFEST=';
const manifestFiles=m=>[{path:'data/asset-manifest.json',content:JSON.stringify(m,null,1)+'\n'},{path:'js/asset-manifest.js',content:MANIFEST_HEAD+JSON.stringify(m)+';\n'}];

/* ---------- editor settings → js/game-settings.js ---------- */
// A browser keeps its own value for a key, but follows a newer pushed default when it never changed that key itself.
const hashStr=v=>{let x=2166136261;for(let i=0;i<v.length;i++)x=Math.imul(x^v.charCodeAt(i),16777619);return(x>>>0).toString(36)};
const SEED=`(function(){if(window.EditorStore){EditorStore.seed(window.GAME_SETTINGS);return}try{const SEEN='project-a-settings-seen',h=v=>{let x=2166136261;for(let i=0;i<v.length;i++)x=Math.imul(x^v.charCodeAt(i),16777619);return(x>>>0).toString(36)},seen=JSON.parse(localStorage.getItem(SEEN)||'{}');for(const[k,v]of Object.entries(window.GAME_SETTINGS)){const cur=localStorage.getItem(k),hv=h(v),own=cur!==null&&seen[k]&&h(cur)!==seen[k];if(cur===null||(!own&&seen[k]&&seen[k]!==hv))localStorage.setItem(k,v);if(!own&&(cur===null||seen[k]||cur===v))seen[k]=hv}localStorage.setItem(SEEN,JSON.stringify(seen))}catch(e){}})();`;
function parseSettings(text){if(!text)return{};const i=text.indexOf('window.GAME_SETTINGS=');if(i<0)return{};const start=text.indexOf('{',i),end=text.indexOf('\n};',start);return JSON.parse(text.slice(start,end+2))}
function settingsFile(obj){return'// Permanent game settings — written by the editors (⬆ Push) · '+new Date().toISOString()+'\n// Defaults for every browser: a browser keeps a value it changed itself, otherwise it follows these.\nwindow.GAME_SETTINGS='+JSON.stringify(obj,null,1)+';\n'+SEED+'\n'}
// keys: localStorage keys to publish · extra: [{path,content}] more files in the same commit
async function pushSettings(keys,label,extra=[],onStatus){if(cartOn()&&!FLUSH){if(extra.length)await cartFiles(extra,null);await cartLog(label,extra.map(f=>f.path),keys);cartToast(label);cartNotify();onStatus&&onStatus('🛒 ใส่ Cart แล้ว');return '🛒 อยู่ใน Cart (ยังไม่ push)'}const vals={};for(const k of keys){const v=localStorage.getItem(k);if(v!==null)vals[k]=v}
 const sha=await commit('Editor: '+label+' ('+Object.keys(vals).length+' ค่า'+(extra.length?' + '+extra.length+' ไฟล์':'')+')',async head=>{const cur=parseSettings(await head.read('js/game-settings.js'));Object.assign(cur,vals);return[...extra,...(Object.keys(vals).length?[{path:'js/game-settings.js',content:settingsFile(cur)}]:[])]},onStatus);
 try{if(sha&&window.EditorStore){for(const[k,v]of Object.entries(vals))EditorStore.markPushed(k,v)}else{const seen=JSON.parse(localStorage.getItem('project-a-settings-seen')||'{}');for(const[k,v]of Object.entries(vals))seen[k]=hashStr(v);localStorage.setItem('project-a-settings-seen',JSON.stringify(seen))}}catch(e){}return sha}

/* ---------- settings dialog (shared) ---------- */
let dlg=null;
let afterSave=null;
function openSettings(after){afterSave=typeof after==='function'?after:null;if(!dlg){dlg=document.createElement('dialog');dlg.id='ghSettings';dlg.style.cssText='max-width:440px;border-radius:12px;border:1px solid #9aa982;padding:18px;font:13px AgThai,system-ui;background:#f7f5ee;color:#24302a';
 dlg.innerHTML=`<style>#ghSettings button{font:inherit;background:#315d46;color:#fff;border:1px solid #1f3d2d;border-radius:8px;padding:7px 14px;cursor:pointer}#ghSettings button:hover{background:#3d7358}#ghSettings #ghSave{background:#c9893a;border-color:#a06c27;font-weight:700}#ghSettings input:not([type=checkbox]){background:#fff;color:#24302a;border:1px solid #9aa982;border-radius:6px}</style><h3 style="margin:0 0 8px">Push ขึ้น GitHub</h3><p style="margin:0 0 10px;color:#55624f">ใส่ token ครั้งเดียว กด "บันทึก" แล้วจะ push ต่อให้ทันที · ใช้ fine-grained token ที่ให้สิทธิ์เฉพาะ repo นี้ · Contents: Read and write · token เก็บในเบราว์เซอร์เครื่องนี้เท่านั้น</p>
 <label style="display:block;margin:6px 0">Repo <input id="ghRepo" style="width:100%;padding:6px" placeholder="owner/repo"></label><label style="display:block;margin:6px 0">Branch <input id="ghBranch" style="width:100%;padding:6px"></label>
 <label style="display:block;margin:6px 0">Token <input id="ghToken" type="password" style="width:100%;padding:6px" placeholder="github_pat_…" autocomplete="off"></label>
 <label style="display:flex;gap:6px;align-items:center;margin:8px 0"><input type="checkbox" id="ghAuto"> push อัตโนมัติเมื่อบันทึก (ปิด = ดาวน์โหลด ZIP แบบเดิม)</label>
 <label style="display:flex;gap:6px;align-items:center;margin:8px 0"><input type="checkbox" id="ghCart"> 🛒 สะสมงานใน Cart ก่อน แล้ว push ทีเดียว (แนะนำ · ปิด = push ทันทีทุกครั้ง)</label>
 <label style="display:flex;gap:6px;align-items:center;margin:8px 0"><input type="checkbox" id="ghReview"> แสดงหน้าสรุปให้ยืนยันก่อน push (ปิด = ขึ้นหน้าโหลดทันที)</label>
 <p id="ghMsg" style="min-height:18px;color:#315d46;margin:6px 0"></p><div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap"><a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener" style="margin-right:auto;align-self:center">สร้าง token</a><button id="ghForget">ลบ token</button><button id="ghTest">ทดสอบ</button><button id="ghSave">บันทึก</button><button id="ghClose">ปิด</button></div>`;
 document.body.append(dlg);const $=id=>dlg.querySelector('#'+id),msg=t=>$('ghMsg').textContent=t;
 const read=()=>{const[owner,repo]=$('ghRepo').value.trim().split('/');return{owner:owner||defaults.owner,repo:repo||defaults.repo,branch:$('ghBranch').value.trim()||'main',auto:$('ghAuto').checked,review:$('ghReview').checked,cart:$('ghCart').checked,...($('ghToken').value.trim()?{token:$('ghToken').value.trim()}:{})}};
 $('ghSave').onclick=()=>{save(read());msg('บันทึกแล้ว');refreshBadges();if(afterSave&&config().token){const f=afterSave;afterSave=null;dlg.close();setTimeout(f,50)}};$('ghClose').onclick=()=>dlg.close();
 $('ghForget').onclick=()=>{save({token:''});$('ghToken').value='';msg('ลบ token จากเครื่องนี้แล้ว');refreshBadges()};
 $('ghTest').onclick=async()=>{save(read());msg('กำลังทดสอบ…');try{msg('ใช้ได้ · เขียน '+await test()+' ได้')}catch(e){msg('ใช้ไม่ได้: '+e.message)}refreshBadges()}}
 const c=config();dlg.querySelector('#ghRepo').value=c.owner+'/'+c.repo;dlg.querySelector('#ghBranch').value=c.branch;dlg.querySelector('#ghToken').value='';dlg.querySelector('#ghToken').placeholder=c.token?'มี token แล้ว (ใส่ใหม่เพื่อเปลี่ยน)':'github_pat_…';dlg.querySelector('#ghAuto').checked=c.auto;dlg.querySelector('#ghReview').checked=!!c.review;dlg.querySelector('#ghCart').checked=c.cart!==false;dlg.querySelector('#ghMsg').textContent='';dlg.showModal()}
const badges=new Set();
function refreshBadges(){for(const b of badges)b.textContent=enabled()?'⬆ GitHub: เปิด':'⬆ GitHub: ปิด'}
function settingsButton(cls=''){const b=document.createElement('button');b.type='button';b.className=cls;b.title='ตั้งค่า push ขึ้น GitHub';b.onclick=openSettings;badges.add(b);refreshBadges();return b}


/* ---------- v98.387 · 🛒 PUSH CART ----------
   Every editor's ⬆ Push now goes into ONE cart instead of committing at once; the change is already live in this browser (editors save locally,
   pictures are previewed by js/staged-preview.js), and the cart is pushed as ONE commit when you are ready (it warns when it gets big).
   The cart = three stores in IndexedDB 'asset-studio'/kv (shared by every page and tab):
     repo-staged   files written by Asset Studio / Workshop (js/studio-repo-dir.js — unchanged)
     cart-files    files from every other editor's commit()          [[path, Blob|null]]
     cart-meta     { log:[{label,at,n,paths,keys,page}], keys:[settings keys → js/game-settings.js at push time] }
   commit() run in this page also keeps its build function for the session, so at push time it is re-run against the newest main (proper merges);
   after a reload the stored copy is used. Settings are always written from this browser's CURRENT values at push time. */
let FLUSH=false;const BUILD=new Map();
const cartOn=()=>config().cart!==false;
const idbOpen=()=>new Promise((res,rej)=>{const r=indexedDB.open('asset-studio',1);r.onupgradeneeded=()=>r.result.createObjectStore('kv');r.onsuccess=()=>res(r.result);r.onerror=()=>rej(r.error)});
const idbGet=async k=>{try{const db=await idbOpen();return await new Promise(r=>{const q=db.transaction('kv').objectStore('kv').get(k);q.onsuccess=()=>r(q.result);q.onerror=()=>r(null)})}catch(e){return null}};
const idbSet=async(k,v)=>{const db=await idbOpen();await new Promise(r=>{const t=db.transaction('kv','readwrite');t.objectStore('kv').put(v,k);t.oncomplete=r;t.onerror=r})};
let cartBc=null,stagedBc=null;try{cartBc=new BroadcastChannel('project-a-cart');stagedBc=new BroadcastChannel('project-a-staged')}catch(e){}
const BIG={files:30,bytes:25e6};
const toBlob=x=>x==null?null:x instanceof Blob?x:typeof x==='string'?new Blob([x],{type:'text/plain'}):new Blob([x]);
async function cartFiles(files){const cur=new Map(await idbGet('cart-files')||[]);for(const f of files)cur.set(f.path,f.remove?null:toBlob(f.content));await idbSet('cart-files',[...cur])}
async function cartLog(label,paths,keys){const m=await idbGet('cart-meta')||{log:[],keys:[]};m.log.push({label,at:Date.now(),n:paths.length,paths:paths.slice(0,30),keys:keys||[],page:location.pathname.split('/').pop()||''});if(m.log.length>300)m.log=m.log.slice(-300);for(const k of keys||[])if(!m.keys.includes(k))m.keys.push(k);await idbSet('cart-meta',m)}
/* v98.866 · single source of truth: editor data changed in this browser but not pushed (js/editor-store.js drafts) is ALWAYS part of the cart,
   even when the page that changed it has no push button, so one Push sends everything and the other computer gets it */
/* v98.881 · the Cart never keeps a SNAPSHOT of js/village-layout-v67.js or js/game-settings.js. A snapshot is the whole file as it was when it went into
   the cart: pushed later it would undo what another computer pushed meanwhile, and "↩ ย้อนกลับเป็นที่ push ไว้" could not take it back (the moved
   guild came back after the revert). The layout travels as the layout draft and settings as keys — both read from this browser at push time and
   merged onto the newest main. A snapshot already in a cart is converted once (its text is kept in the editor backups). */
function unsnapshot(files,webSettings){const es=ES(),keys=[],out=[];let dropped=0;
 for(const f of files){const p=f.path??f[0],c=f.content??f[1];
  if(es&&p==='js/village-layout-v67.js'&&c!=null){try{es.keep(es.LAYOUT,typeof c==='string'?c:'(blob)','cart snapshot of the layout (dropped · the layout draft is pushed instead)')}catch(e){}dropped++;continue}
  if(es&&p==='js/game-settings.js'&&typeof c==='string'){try{const st=parseSettings(c),web=webSettings||{};for(const[k,v]of Object.entries(st))if(web[k]!==v)keys.push(k);es.keep('js/game-settings.js','cart snapshot: '+c.slice(0,200000),'cart snapshot of the settings (converted to keys)')}catch(e){out.push(f);continue}dropped++;continue}
  out.push(f)}
 return{files:out,keys,dropped}}
const ES=()=>{try{return window.EditorStore||window.top.EditorStore||null}catch(e){return window.EditorStore||null}};
async function cartState(){let meta=await idbGet('cart-meta')||{log:[],keys:[]},files=await idbGet('cart-files')||[];const st=await idbGet('repo-staged'),es=ES();let auto=[],layout=false,big=[];
 if(es&&files.some(([p,b])=>b&&(p==='js/village-layout-v67.js'||p==='js/game-settings.js'))){const conv=[];for(const[p,b]of files)conv.push([p,b&&(p==='js/village-layout-v67.js'||p==='js/game-settings.js')?await b.text():b]);
  const us=unsnapshot(conv,window.GAME_SETTINGS||{});meta={...meta,keys:[...new Set([...meta.keys,...us.keys])]};files=files.filter(([p])=>us.files.some(([q])=>q===p));await idbSet('cart-files',files);await idbSet('cart-meta',meta)}
 try{if(es){auto=es.drafts().filter(k=>!meta.keys.includes(k));layout=es.layoutDraft();big=es.bigDrafts()}}catch(e){}
 return{meta:{...meta,keys:[...meta.keys,...auto]},auto,layout,big,unknown:es?es.unknown():[],files,staged:Array.isArray(st)?st:[]}}
async function cartSummary(){const s=await cartState(),all=new Map([...s.staged,...s.files]);let bytes=0;for(const b of all.values())bytes+=b?(b.size||0):0;const n=all.size+s.meta.keys.length+(s.layout?1:0);return{...s,all,n,bytes,big:all.size>=BIG.files||bytes>=BIG.bytes}}
function cartNotify(){try{cartBc&&cartBc.postMessage('c')}catch(e){}try{cartUi()}catch(e){}}
async function cartStage(message,build,onStatus){const c=config(),say=t=>{try{onStatus(t)}catch(e){}};say('🛒 กำลังเตรียมไฟล์ใส่ Cart…');
 const ref=await json('/git/ref/heads/'+c.branch),head=ref.object.sha,files=await build({sha:head,read:p=>readText(p,head)});
 if(!files||!files.length){say('ไม่มีอะไรเปลี่ยน');return null}
 let webS={};try{webS=parseSettings(await readText('js/game-settings.js',head))}catch(e){}const us=unsnapshot(files,webS),sf=us.files;
 if(sf.length)await cartFiles(sf);await cartLog(message,sf.map(f=>f.path),us.keys);BUILD.set(message+'#'+Date.now(),{fn:build});
 if(files.some(f=>/asset-manifest\.json$/.test(f.path))&&!(await idbGet('repo-staged-base'))){try{const t=await readText('data/asset-manifest.json',head);if(t)await idbSet('repo-staged-base',{text:t,sha:head,at:Date.now()})}catch(e){}}
 cartToast(message);cartNotify();say('🛒 ใส่ Cart แล้ว (ยังไม่ push)');return '🛒 อยู่ใน Cart (ยังไม่ push)'}
async function cartPush(){const s=await cartSummary();if(!s.n)return null;if(!config().token){openSettings(()=>cartPush());return null}
 const labels=[...new Set(s.meta.log.map(l=>l.label.replace(/\s*\(.*\)$/,'')))],staged=s.staged.length;
 const msg='Cart: '+(labels.slice(0,4).join(' · ')||'Asset Studio')+(labels.length>4?' +'+(labels.length-4):'')+' ('+s.all.size+' ไฟล์'+(s.meta.keys.length?' · '+s.meta.keys.length+' ค่า':'')+')';
 FLUSH=true;let tag=null;
 try{tag=await commit(msg,async head=>{const m=new Map();let st=s.staged;
   const MM=window.ManifestMerge||(()=>{try{return window.top.ManifestMerge}catch(e){return null}})();
   if(MM&&head.read&&st.some(([p])=>/asset-manifest\.(json|js)$/.test(p))){try{const tx=await head.read('data/asset-manifest.json'),base=await idbGet('repo-staged-base');if(tx){const rb=await MM.rebase(st,tx,base&&base.text);if(rb.changed)st=rb.files}}catch(e){console.warn('cart manifest merge',e)}}
   for(const[p,b]of st)m.set(p,b);for(const[p,b]of s.files)m.set(p,b);
   for(const b of BUILD.values()){try{for(const f of await b.fn(head)||[])m.set(f.path,f.remove?null:f.content)}catch(e){console.warn('cart: re-run with newest main failed, using the stored copy',e)}}
   const files=[];for(const[p,b]of m){if(b==null){files.push({path:p,remove:true});continue}files.push({path:p,content:b instanceof Blob&&/\.(js|json|html|css|md|txt|csv)$/i.test(p)?await b.text():b})}
   if(s.layout&&!files.some(f=>f.path==='js/village-layout-v67.js')){try{const v=JSON.parse(localStorage.getItem(ES().LAYOUT));files.push({path:'js/village-layout-v67.js',content:'// Village default layout — saved from the in-game editor '+new Date().toISOString()+'.\nwindow.VillageDefaultLayout='+JSON.stringify(v,null,2)+';\n'})}catch(e){console.warn('cart: village layout',e)}}
   if(s.meta.keys.length){const cur=parseSettings(await head.read('js/game-settings.js'));for(const k of s.meta.keys){const v=localStorage.getItem(k);if(v!==null)cur[k]=v}const sf={path:'js/game-settings.js',content:settingsFile(cur)},i=files.findIndex(f=>f.path==='js/game-settings.js');if(i>=0)files[i]=sf;else files.push(sf)}
   return files},()=>{},{now:true});
  if(tag){const at=Date.now(),old=await idbGet('repo-recent'),keep=(Array.isArray(old)?old:[]).filter(([p,,t])=>at-t<36e5&&!s.all.has(p));await idbSet('repo-recent',[...keep,...[...s.all].map(([p,b])=>[p,b,at])]);
   try{if(window.EditorStore){for(const k of s.meta.keys)EditorStore.markPushed(k,localStorage.getItem(k))}else{const seen=JSON.parse(localStorage.getItem('project-a-settings-seen')||'{}');for(const k of s.meta.keys){const v=localStorage.getItem(k);if(v!==null)seen[k]=hashStr(v)}localStorage.setItem('project-a-settings-seen',JSON.stringify(seen))}}catch(e){}   /* v98.858 · what was pushed is the new base (js/editor-store.js) */
   await idbSet('repo-staged',[]);await idbSet('repo-staged-base',null);await idbSet('cart-files',[]);await idbSet('cart-meta',{log:[],keys:[]});BUILD.clear();
   try{stagedBc&&stagedBc.postMessage({pushed:true})}catch(e){}try{window.RepoDir?.afterExternal?.()}catch(e){}}
 }catch(e){if(e&&e.cancelled){tag=null}else throw e}finally{FLUSH=false;cartNotify()}return tag}   /* v98.876 · cancelled from the progress dialog: the cart is untouched (it is cleared only after a successful push) */
async function cartDrop(paths,keys){try{const es=ES();if(es&&keys)for(const k of keys)if(es.drafts({all:true}).includes(k)||k===es.LAYOUT)await es.discard(k)}catch(e){}const st=await idbGet('repo-staged'),cf=await idbGet('cart-files'),m=await idbGet('cart-meta')||{log:[],keys:[]};const P=new Set(paths||[]);
 if(Array.isArray(st))await idbSet('repo-staged',st.filter(([p])=>!P.has(p)));if(Array.isArray(cf))await idbSet('cart-files',cf.filter(([p])=>!P.has(p)));if(keys)m.keys=m.keys.filter(k=>!keys.includes(k));await idbSet('cart-meta',m);
 try{stagedBc&&stagedBc.postMessage({reload:true})}catch(e){}cartNotify()}
async function cartClear(){
 /* v98.446 · commit one empty cart before notifying its readers. A failed write must not look successful. */
 const db=await idbOpen();try{await new Promise((resolve,reject)=>{const t=db.transaction('kv','readwrite'),kv=t.objectStore('kv');kv.put([],'repo-staged');kv.put([],'cart-files');kv.put({log:[],keys:[]},'cart-meta');kv.put(null,'repo-staged-base');t.oncomplete=resolve;t.onerror=()=>reject(t.error||new Error('ล้าง Cart ไม่สำเร็จ'));t.onabort=()=>reject(t.error||new Error('ยกเลิกการล้าง Cart'))})}finally{db.close()}
 BUILD.clear();
 /* clear build callbacks in every loaded editor, including this tab's Studio frames */
 try{cartBc&&cartBc.postMessage({cleared:true})}catch(e){}
 try{stagedBc&&stagedBc.postMessage({reload:true})}catch(e){}
 cartNotify()
}
/* --- UI: lives in the top window only (one button, one panel) --- */
const topDoc=()=>{try{if(window.top!==window&&window.top.GitHubPush)return null}catch(e){}return document};
const mb=b=>b>=1e6?(b/1e6).toFixed(1)+' MB':Math.max(1,Math.round(b/1e3))+' KB';
let cartTimer=0;
function cartUi(){clearTimeout(cartTimer);cartTimer=setTimeout(async()=>{const d=topDoc();if(!d||!d.body)return;const s=await cartSummary();
 const shell=d.getElementById('stagedPush');   /* editor.html has its own top-bar button: it becomes the cart button */
 let b=shell||d.getElementById('ghCartBtn');
 if(!b){b=d.createElement('button');b.id='ghCartBtn';b.type='button';b.style.cssText='position:fixed;right:16px;bottom:16px;z-index:9000;font:700 13px AgThai,system-ui,"Noto Sans Thai",sans-serif;padding:9px 14px;border-radius:22px;border:1px solid #a06c27;background:#c9893a;color:#fff;box-shadow:0 6px 20px #0005;cursor:pointer';d.body.append(b)}
 if(!shell||cartOn()){b.textContent='🛒 Cart ('+s.n+')'+(s.big?' · เยอะแล้ว ควร Push':'');b.title=s.n?s.all.size+' ไฟล์ ('+mb(s.bytes)+') · '+s.meta.keys.length+' ค่าตั้งค่า — กดเพื่อดู/Push':'Cart ว่าง';b.disabled=false;b.dataset.n=s.n;b.onclick=e=>{e.preventDefault();e.stopImmediatePropagation();cartOpen()};
  if(!shell){const ed=/[?&]edit=1\b/.test(location.search)||/editor|studio|lineup|preview/i.test(location.pathname);b.hidden=!ed;/* v98.631 · the game page (index.html) never shows the Cart, even when it holds something: only editor/studio/dev pages do *//* v98.593 · playing the game: no floating Cart button while the cart is empty (only dev/editor pages, or a cart that still holds something) */b.style.background=s.big?'#b5462e':(s.n?'#c9893a':'#8a8575')}else b.style.background=s.big?'#b5462e':''}},120)}
try{cartBc&&(cartBc.onmessage=ev=>{if(ev.data?.cleared)BUILD.clear();cartUi()})}catch(e){}try{stagedBc&&stagedBc.addEventListener('message',()=>cartUi())}catch(e){}
function cartToast(label){const d=topDoc()||document;cartSummary().then(s=>{const t=d.createElement('div');t.style.cssText='position:fixed;right:16px;bottom:64px;z-index:9001;max-width:360px;padding:10px 14px;border-radius:10px;background:'+(s.big?'#5a1f14':'#1f1a13')+';color:#f6e7c8;border:1px solid #c9893a;font:13px AgThai,system-ui,"Noto Sans Thai",sans-serif;box-shadow:0 8px 24px #0006';
 t.textContent='🛒 ใส่ Cart แล้ว: '+String(label).slice(0,70)+' · รวม '+s.n+' รายการ'+(s.big?' — เยอะแล้ว ('+s.all.size+' ไฟล์ · '+mb(s.bytes)+') ควรกด Push':'');(d.body||d.documentElement).append(t);setTimeout(()=>t.remove(),s.big?6000:3500)})}
/* v98.446 · await a native top-layer dialog in the Cart's document, above the still-open Cart.
   Do not use the game's synchronous confirm/replay shim: the asking click may live in another frame. */
/* v98.882 · the Cart asks inside ITS OWN top-layer <dialog>: the game's confirm() window is a plain element and opened BEHIND the Cart's modal dialog (could not be clicked until the Cart was closed) */
function cartAsk(d,title,message,okText,cancelText='ยกเลิก'){return new Promise(resolve=>{
 const box=d.createElement('dialog');box.id='ghCartConfirm';d.getElementById('ghCartConfirm')?.remove();box.setAttribute('aria-labelledby','ghCartConfirmTitle');box.style.cssText='width:min(440px,92vw);max-height:85vh;overflow:auto;border:1px solid #c9893a;border-radius:14px;padding:18px;background:#f7f5ee;color:#292b25;font:14px AgThai,system-ui,sans-serif;box-shadow:0 22px 80px #0009';
 box.innerHTML='<h2 id="ghCartConfirmTitle" style="margin:0 0 10px;font-size:18px"></h2><p style="white-space:pre-line"></p><div style="display:flex;gap:8px;justify-content:flex-end"><button type="button" data-cancel autofocus></button><button type="button" data-confirm></button></div>';
 box.querySelector('h2').textContent=title;box.querySelector('p').textContent=message;box.querySelector('[data-cancel]').textContent=cancelText;box.querySelector('[data-confirm]').textContent=okText;let done=false;const finish=ok=>{if(done)return;done=true;box.close();box.remove();resolve(ok)};
 box.querySelector('[data-cancel]').onclick=()=>finish(false);box.querySelector('[data-confirm]').onclick=()=>finish(true);box.addEventListener('cancel',ev=>{ev.preventDefault();finish(false)});box.addEventListener('close',()=>finish(false));
 (d.body||d.documentElement).append(box);box.showModal();box.querySelector('[data-cancel]').focus()
})}
function cartConfirmClear(d,message){return cartAsk(d,'ทิ้งทั้งหมดใน Cart?',message,'ยืนยันทิ้งทั้งหมด')}
async function cartOpen(){const d=topDoc()||document,s=await cartSummary();d.getElementById('ghCart')?.remove();const dlg=d.createElement('dialog');dlg.id='ghCart';
 dlg.style.cssText='width:min(620px,95vw);max-height:86vh;overflow:auto;border:1px solid #c9893a;border-radius:14px;padding:16px 18px;background:#f7f5ee;color:#292b25;font:13px AgThai,system-ui,"Noto Sans Thai",sans-serif;box-shadow:0 22px 80px #0009';
 const e=x=>String(x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]),src=p=>s.files.some(([q])=>q===p)?'editor':'Studio',t=at=>new Date(at).toLocaleString('th-TH',{hour:'2-digit',minute:'2-digit',day:'numeric',month:'short'});
 const rows=[...s.all].map(([p,b])=>`<tr><td style="overflow-wrap:anywhere">${e(p)}</td><td>${b?mb(b.size||0):'ลบ'}</td><td>${src(p)}</td><td><button data-dp="${e(p)}" title="เอาออกจาก Cart (ไม่ push ไฟล์นี้)">✕</button></td></tr>`).join('');
 dlg.innerHTML=`<style>#ghCart,#ghCart *{color:#292b25!important;font-family:AgThai,system-ui,"Noto Sans Thai",sans-serif}#ghCart summary{cursor:pointer;margin:6px 0}#ghCart summary:focus{outline:none}#ghCart button{background:#e9eddf!important;border:1px solid #b9b39c!important;border-radius:8px!important;padding:5px 11px!important;cursor:pointer;font-size:13px!important}#ghCart #ghCartPush{background:#c9893a!important;border-color:#a06c27!important;color:#fff!important;font-weight:700}#ghCart #ghCartPush *{color:#fff!important}#ghCart button[disabled]{opacity:.5;cursor:default}#ghCart td{padding:3px 4px;border-bottom:1px solid #e0dccb}#ghCart small{color:#62685b!important}</style><h2 style="margin:0 0 4px">🛒 Cart · ${s.n} รายการรอ Push</h2><p style="margin:0 0 10px;color:#62685b">${s.all.size} ไฟล์ · ${mb(s.bytes)} · ${s.meta.keys.length} ค่าตั้งค่า — งานทั้งหมดเห็นผลในเครื่องนี้แล้ว · กด Push ครั้งเดียวส่งขึ้นเกมเป็น commit เดียว</p>
 ${s.big?`<p style="background:#f6dfd6;border:1px solid #c98a6f;border-radius:8px;padding:8px;margin:0 0 10px"><b>เยอะแล้ว</b> — ควร Push ตอนนี้ (ไฟล์ยิ่งเยอะ deploy ยิ่งช้า/เสี่ยงค้าง)</p>`:''}
 ${s.all.size?`<details open><summary><b>ไฟล์ (${s.all.size})</b></summary><table style="width:100%;border-collapse:collapse;font-size:12px;margin:6px 0">${rows}</table></details>`:''}
 ${s.meta.keys.length||s.layout?`<details open><summary><b>การตั้งค่า (${s.meta.keys.length+(s.layout?1:0)}) → js/game-settings.js${s.layout?' + ผังหมู่บ้าน':''}</b> <small>(ใช้ค่าปัจจุบันของเครื่องนี้ตอน Push · 🔎 = แก้ในเครื่องนี้แล้วยังไม่ push ตรวจพบเอง · ✕ ที่ 🔎 = ทิ้งการแก้ในเครื่องนี้ กลับไปใช้ของเว็บ (สำรองไว้ก่อน))</small></summary><p>${s.meta.keys.map(k=>`<span style="display:inline-flex;gap:4px;align-items:center;border:1px solid #cfc6aa;border-radius:12px;padding:1px 8px;margin:2px">${s.auto.includes(k)?'🔎 ':''}${e(keyNames[k]||k)} <button data-dk="${e(k)}" ${s.auto.includes(k)?'data-auto="1"':''} style="padding:0 5px">✕</button></span>`).join('')}${s.layout?`<span style="display:inline-flex;gap:4px;align-items:center;border:1px solid #cfc6aa;border-radius:12px;padding:1px 8px;margin:2px">🔎 ผังหมู่บ้าน (js/village-layout-v67.js) <button data-dk="project-a-village-editor-v67" data-auto="1" style="padding:0 5px">✕</button></span>`:''}</p></details>`:''}
 ${s.unknown.length?`<p style="background:#fff3c4;border:1px solid #c9a23a;border-radius:8px;padding:8px;margin:0 0 10px">⚠ ข้อมูลในเครื่องนี้ที่ <b>ยังไม่อยู่ในระบบตัวจริง (SOT)</b> — จะไม่ตามไปเครื่องอื่น: ${s.unknown.map(e).join(', ')} · แจ้งผู้พัฒนาให้จัดประเภท</p>`:''}
 ${s.big.length?`<p style="background:#f6dfd6;border:1px solid #c98a6f;border-radius:8px;padding:8px;margin:0 0 10px">ค่าที่ใหญ่เกิน 400 KB ไม่ถูกส่งอัตโนมัติ (ทุกหน้าโหลดไฟล์ตั้งค่านี้): ${s.big.map(e).join(', ')} — ใช้ปุ่มส่งออกของหน้านั้นแทน</p>`:''}
 ${s.meta.log.length?`<details><summary><b>ใส่ Cart ล่าสุด (${s.meta.log.length})</b></summary><ol style="margin:6px 0;padding-left:18px">${s.meta.log.slice(-20).reverse().map(l=>`<li>${e(l.label)} <small style="color:#62685b">· ${t(l.at)} · ${l.n} ไฟล์${l.keys.length?' · '+l.keys.length+' ค่า':''} · ${e(l.page)}</small></li>`).join('')}</ol></details>`:''}
 ${s.n?'':'<p>Cart ว่าง</p>'}
 <div style="display:flex;gap:8px;justify-content:flex-end;margin-top:12px;flex-wrap:wrap"><button id="ghCartClear" style="margin-right:auto" ${s.n?'':'disabled'}>🗑 ทิ้งทั้งหมด</button><button id="ghCartRevert" ${s.meta.keys.length||s.layout?'':'hidden'} title="ทิ้งทุกอย่างที่แก้ในเครื่องนี้และยังไม่ push (ผังหมู่บ้าน ตำแหน่ง ค่าตั้งค่า) กลับไปใช้ที่ push ไว้บนเว็บ · สำรองไว้ก่อน">↩ ย้อนกลับเป็นที่ push ไว้</button><button id="ghCartClose">ปิด</button><button id="ghCartPush" ${s.n?'':'disabled'} style="background:#c9893a;color:#fff;border:1px solid #a06c27;border-radius:8px;padding:7px 16px;font-weight:700">⬆ Push ทั้งหมด</button></div>`;
 (d.body||d.documentElement).append(dlg);const $=id=>dlg.querySelector('#'+id);
 $('ghCartClose').onclick=()=>{dlg.close();dlg.remove()};
 $('ghCartRevert').onclick=async()=>{const es=ES();if(!es)return;const ks=[...new Set([...es.drafts({all:true}),...(es.layoutDraft()?[es.LAYOUT]:[])])];if(!ks.length&&!s.meta.keys.length)return;if(!await cartAsk(d,'ย้อนกลับเป็นที่ push ไว้?','ทิ้งงานที่แก้ในเครื่องนี้และยังไม่ push แล้วใช้ที่ push ไว้บนเว็บ:\n\n'+ks.map(k=>'• '+(keyNames[k]||k)).join('\n')+'\n\n(ค่าเดิมถูกสำรองไว้ · กู้คืนได้ที่ 📦 สำรองข้อมูลเอดิเตอร์ · หน้าจะโหลดใหม่)','↩ ย้อนกลับ'))return;try{for(const k of ks)await es.discard(k)}catch(e){console.warn('revert',e)}try{await cartDrop(['js/village-layout-v67.js','js/game-settings.js'],s.meta.keys)}catch(e){}dlg.close();dlg.remove();reloadAll()};
 $('ghCartClear').onclick=async()=>{const btn=$('ghCartClear');if(btn.disabled)return;btn.disabled=true;try{if(!await cartConfirmClear(d,'ทิ้งงานทั้งหมด '+s.n+' รายการ?\nไฟล์ภาพที่ยังไม่ Push จะถูกนำออกจาก Cart · ค่าตั้งค่าในเครื่องยังอยู่'))return;await cartClear();dlg.close();dlg.remove();await cartOpen()}catch(err){let status=$('ghCartError');if(!status){status=d.createElement('p');status.id='ghCartError';status.setAttribute('role','alert');dlg.append(status)}status.textContent='ทิ้งไม่สำเร็จ: '+err.message}finally{btn.disabled=false}};
 $('ghCartPush').onclick=async()=>{dlg.close();dlg.remove();try{const tag=await cartPush();if(tag)cartUi()}catch(err){alert('Push ไม่สำเร็จ: '+err.message+'\nงานยังอยู่ใน Cart ครบ')}};
 dlg.querySelectorAll('[data-dp]').forEach(b=>b.onclick=async()=>{await cartDrop([b.dataset.dp]);dlg.close();dlg.remove();cartOpen()});
 dlg.querySelectorAll('[data-dk]').forEach(b=>b.onclick=async()=>{if(b.dataset.auto&&!await cartAsk(d,'ทิ้งการแก้ในเครื่องนี้?','ทิ้งการแก้ในเครื่องนี้ของ\n"'+(keyNames[b.dataset.dk]||b.dataset.dk)+'"\nแล้วใช้ของเว็บ\n\n(ค่าเดิมถูกสำรองไว้ · กู้คืนได้ที่ 📦 สำรองข้อมูล · หน้าจะโหลดใหม่)','ทิ้งการแก้'))return;await cartDrop([],[b.dataset.dk]);dlg.close();dlg.remove();if(b.dataset.auto)reloadAll();else cartOpen()});
 dlg.showModal()}
/* v98.880 · after a draft is thrown away every open editor page must reload: it still holds the discarded data in memory and would write it back */
function reloadAll(){try{(window.top||window).location.reload()}catch(e){location.reload()}}
const cartApi={on:cartOn,open:cartOpen,push:cartPush,summary:cartSummary,drop:cartDrop,clear:cartClear,refresh:()=>cartUi()};
if(document.readyState==='loading')addEventListener('DOMContentLoaded',()=>cartUi());else cartUi();
window.GitHubPush={config,save,enabled,test,commit,readText,applyAssetPatch,manifestFiles,openSettings,settingsButton,pushSettings,parseSettings,settingsFile,cart:cartApi};
})();
