/* v38j · Push edits straight to the GitHub repo from the browser (no git needed).
   One fine-grained token (Contents: read & write on this repo only) is kept in this browser's localStorage.
   commit(message, build): reads the latest main, lets build() produce files from it (so merges use the newest data),
   writes one commit and moves main forward; if someone pushed in between it rebuilds and tries again. */
(function(){'use strict';
const KEY='projectA.github',API='https://api.github.com';
const defaults={owner:'ekkavish31',repo:'Project-Agrenor-Tactical-Card-Game',branch:'main',token:'',auto:true};
function config(){try{return{...defaults,...JSON.parse(localStorage.getItem(KEY)||'{}')}}catch(e){return{...defaults}}}
function save(c){try{localStorage.setItem(KEY,JSON.stringify({...config(),...c}))}catch(e){}}
const enabled=()=>{const c=config();return!!(c.token&&c.auto)};
async function call(path,opt={}){const c=config();const r=await fetch(API+'/repos/'+c.owner+'/'+c.repo+path,{...opt,headers:{Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28',Authorization:'Bearer '+c.token,...(opt.body?{'Content-Type':'application/json'}:{}),...(opt.headers||{})}});
 if(!r.ok){let m='';try{m=(await r.json()).message}catch(e){}const err=new Error('GitHub '+r.status+(m?': '+m:''));err.status=r.status;throw err}return r}
const json=async(p,o)=>(await call(p,o)).json();
async function readText(path,ref){const c=config();try{return await(await call('/contents/'+path.split('/').map(encodeURIComponent).join('/')+'?ref='+encodeURIComponent(ref||c.branch),{headers:{Accept:'application/vnd.github.raw+json'}})).text()}catch(e){if(e.status===404)return null;throw e}}
async function b64(content){const bytes=typeof content==='string'?new TextEncoder().encode(content):content instanceof Blob?new Uint8Array(await content.arrayBuffer()):content;let s='';for(let i=0;i<bytes.length;i+=0x8000)s+=String.fromCharCode.apply(null,bytes.subarray(i,i+0x8000));return btoa(s)}
async function test(){const c=config();if(!c.token)throw new Error('ยังไม่ได้ใส่ token');const r=await(await fetch(API+'/repos/'+c.owner+'/'+c.repo,{headers:{Accept:'application/vnd.github+json',Authorization:'Bearer '+c.token}})).json();if(!r.full_name)throw new Error(r.message||'เข้าถึง repo ไม่ได้');if(r.permissions&&!r.permissions.push)throw new Error('token นี้ไม่มีสิทธิ์เขียน (Contents: Read and write)');return r.full_name}
// build(head) → [{path, content}] where content is string | Uint8Array | Blob; head.read(path) reads files at that commit
/* ---------- v80.x · push progress screen: steps, file progress, elapsed time, clear result ---------- */
function pushScreen(title){
 // v81.14: host the progress UI in the top-level document so an iframe's editor dialog cannot cover it.
 let hostDoc=document;try{if(window.top?.document?.body)hostDoc=window.top.document}catch(e){}
 const css=hostDoc.getElementById('ghPushCss')||Object.assign(hostDoc.createElement('style'),{id:'ghPushCss',textContent:`#ghPush{padding:0;border:0;background:transparent;overflow:visible;max-width:none;max-height:none;font:13px system-ui,"Noto Sans Thai",sans-serif;color:#f3e7cf;animation:ghIn .18s ease-out}#ghPush::backdrop{background:#0b0f0ccc;backdrop-filter:blur(3px)}#ghPush:focus,#ghPush:focus-visible{outline:none}@keyframes ghIn{from{opacity:0}}
#ghPush .card{width:min(420px,92vw);background:#1f1a13;border:1px solid #c9893a;border-radius:16px;padding:22px 22px 18px;box-shadow:0 20px 60px #000a;text-align:center}
#ghPush .icon{position:relative;width:96px;height:96px;margin:0 auto 10px}#ghPush .cloud{position:absolute;inset:8px 6px auto;height:46px;border-radius:30px;background:#c9893a33;border:2px solid #c9893a}
#ghPush .arrow{position:absolute;left:50%;top:44px;width:6px;height:34px;margin-left:-3px;background:#f6d79b;border-radius:3px;animation:ghUp 1s ease-in-out infinite}#ghPush .arrow:before{content:'';position:absolute;left:-9px;top:-10px;border:12px solid transparent;border-bottom:12px solid #f6d79b;border-top:0}
@keyframes ghUp{0%{transform:translateY(16px);opacity:0}30%{opacity:1}100%{transform:translateY(-22px);opacity:0}}
#ghPush.ok .arrow,#ghPush.fail .arrow{display:none}#ghPush .mark{position:absolute;inset:0;display:none;place-items:center;font-size:56px;font-weight:700;animation:ghPop .35s cubic-bezier(.2,1.6,.4,1)}#ghPush.ok .mark,#ghPush.fail .mark{display:grid}#ghPush.ok .mark{color:#7fd38b}#ghPush.fail .mark{color:#f07a6a}#ghPush.ok .cloud{border-color:#7fd38b;background:#7fd38b22}#ghPush.fail .cloud{border-color:#f07a6a;background:#f07a6a22}@keyframes ghPop{from{transform:scale(.3);opacity:0}}
#ghPush h3{margin:0 0 4px;color:#f6d79b;font-size:16px}#ghPush .sub{color:#bba57f;margin:0 0 12px;min-height:18px;overflow-wrap:anywhere}
#ghPush ol{list-style:none;padding:0;margin:0 0 12px;text-align:left}#ghPush li{display:flex;gap:8px;align-items:center;padding:4px 2px;color:#8d7d62}#ghPush li i{width:18px;height:18px;border-radius:50%;border:2px solid #4a3b29;flex:none;display:grid;place-items:center;font-style:normal;font-size:11px}
#ghPush li.run{color:#f3e7cf}#ghPush li.run i{border-color:#f6d79b;border-top-color:transparent;animation:ghSpin .8s linear infinite}@keyframes ghSpin{to{transform:rotate(360deg)}}#ghPush li.done{color:#cfe8cf}#ghPush li.done i{border-color:#7fd38b;background:#7fd38b;color:#1f1a13}#ghPush li.bad{color:#f6b0a5}#ghPush li.bad i{border-color:#f07a6a;background:#f07a6a;color:#1f1a13}
#ghPush .bar{height:6px;border-radius:3px;background:#3a2f22;overflow:hidden;margin:2px 0 10px}#ghPush .bar b{display:block;height:100%;width:0;background:linear-gradient(90deg,#c9893a,#f6d79b);transition:width .25s}
#ghPush .foot{display:flex;justify-content:space-between;align-items:center;color:#8d7d62;font-size:12px}#ghPush button{font:inherit;background:#c9893a;color:#fff;border:0;border-radius:8px;padding:7px 14px;cursor:pointer}#ghPush button[hidden]{display:none}`});
 if(!css.isConnected)(hostDoc.head||hostDoc.documentElement).append(css);hostDoc.getElementById('ghPush')?.remove();
 const STEPS=['อ่านเวอร์ชันล่าสุดบน GitHub','เตรียมไฟล์ที่เปลี่ยน','อัปโหลดไฟล์','สร้าง commit','อัปเดตเกมบน GitHub'];
 const el=hostDoc.createElement('dialog');el.id='ghPush';el.setAttribute('role','status');el.addEventListener('cancel',e=>{if(!el.classList.contains('ok')&&!el.classList.contains('fail'))e.preventDefault()});el.innerHTML=`<div class="card"><div class="icon"><div class="cloud"></div><div class="arrow"></div><div class="mark"></div></div><h3></h3><p class="sub">กำลังส่งงานขึ้น GitHub · อย่าเพิ่งปิดหน้านี้</p><ol>${STEPS.map(t=>`<li><i></i><span>${t}</span></li>`).join('')}</ol><div class="bar"><b></b></div><div class="foot"><span class="time">0 วินาที</span><button hidden>ปิด</button></div></div>`;
 el.querySelector('h3').textContent=title;hostDoc.body.append(el);try{el.showModal()}catch(e){el.classList.add('gh-push-fallback');el.setAttribute('open','');Object.assign(el.style,{position:'fixed',inset:'0',margin:'auto',zIndex:'2147483647',display:'grid',placeItems:'center',width:'100vw',height:'100vh',maxWidth:'none',maxHeight:'none',background:'#0b0f0ccc'})}
 // stay on top: if any other dialog opens while pushing, re-open this one so it is the newest top-layer element
 const Observer=hostDoc.defaultView?.MutationObserver||MutationObserver;const keepTop=new Observer(recs=>{if(!el.isConnected){keepTop.disconnect();return}if(recs.some(r=>r.target!==el&&r.target.tagName==='DIALOG'&&r.target.open)&&el.open){try{el.close();el.showModal()}catch(e){}}});keepTop.observe(hostDoc.body,{subtree:true,attributes:true,attributeFilter:['open']});const li=[...el.querySelectorAll('li')],t0=Date.now(),timer=setInterval(()=>{el.querySelector('.time').textContent=Math.round((Date.now()-t0)/1000)+' วินาที'},500),btn=el.querySelector('button');let cur=-1,closeT=null;
 const close=()=>{clearTimeout(closeT);el.style.transition='opacity .2s';el.style.opacity=0;setTimeout(()=>{try{el.close()}catch(e){}el.remove()},220)};btn.onclick=close;
 return{step(n,text){for(let k=0;k<li.length;k++){li[k].className=k<n?'done':k===n?'run':'';li[k].querySelector('i').textContent=k<n?'✓':''}cur=n;if(text)el.querySelector('.sub').textContent=text;el.querySelector('.bar b').style.width=(n/STEPS.length*100)+'%'},
  files(done,total){li[2].querySelector('span').textContent=`อัปโหลดไฟล์ ${done}/${total}`;el.querySelector('.bar b').style.width=((2+done/Math.max(1,total))/STEPS.length*100)+'%'},
  note(text){el.querySelector('.sub').textContent=text},
  ok(ver){clearInterval(timer);li.forEach(x=>{x.className='done';x.querySelector('i').textContent='✓'});el.classList.add('ok');el.querySelector('.mark').textContent='✓';el.querySelector('h3').textContent='push สำเร็จ'+(ver?' · '+ver:'');el.querySelector('.sub').textContent='เกมบน GitHub อัปเดตแล้ว · เปิดเกมใหม่ (Ctrl+F5) เพื่อโหลดของใหม่';el.querySelector('.bar b').style.width='100%';btn.hidden=false;closeT=setTimeout(close,4000)},
  fail(err){clearInterval(timer);if(cur>=0){li[cur].className='bad';li[cur].querySelector('i').textContent='✕'}el.classList.add('fail');el.querySelector('.mark').textContent='✕';el.querySelector('h3').textContent='push ไม่สำเร็จ';el.querySelector('.sub').textContent=explain(err);btn.hidden=false},
  close}}
function explain(e){const m=String(e?.message||e);if(e?.status===401)return'token ใช้ไม่ได้หรือหมดอายุ · กด ⬆ GitHub แล้วใส่ token ใหม่';if(e?.status===403||e?.status===404)return'token ไม่มีสิทธิ์เขียน repo นี้ (ต้องเป็น Contents: Read and write) · '+m;if(/Failed to fetch|NetworkError/i.test(m))return'ต่อ GitHub ไม่ได้ · เช็กอินเทอร์เน็ตแล้วลองใหม่';return m+' · งานยังอยู่ในเครื่องนี้ ลองกด push ใหม่ได้'}
// build(head) → [{path, content}] where content is string | Uint8Array | Blob; head.read(path) reads files at that commit
async function commit(message,build,onStatus=()=>{}){const c=config();if(!c.token)throw new Error('ยังไม่ได้ตั้งค่า GitHub token');
 const ui=pushScreen(message.replace(/\s*\(.*\)$/,'')),say=(n,t)=>{ui.step(n,t);onStatus(t)};
 try{for(let attempt=1;attempt<=3;attempt++){say(0,'กำลังอ่านเวอร์ชันล่าสุดบน GitHub…');const ref=await json('/git/ref/heads/'+c.branch),head=ref.object.sha,base=await json('/git/commits/'+head);
  say(1,'กำลังเตรียมไฟล์และรวมกับงานล่าสุด…');const files=await build({sha:head,read:p=>readText(p,head)});if(!files.length){ui.ok('');ui.note('ไม่มีอะไรเปลี่ยน · ไม่ต้อง push');onStatus('ไม่มีอะไรต้อง push');return null}
  // Small patch → increment the version suffix (v81.13 → v81.14; not floating-point decimal) and prefix the commit message.
  let ver='';try{const vf=await readText('js/game-version.js',head);if(vf){const m=vf.match(/v:'v(\d+)(?:\.(\d+))?'/);if(m){ver='v'+m[1]+'.'+((+m[2]||0)+1);files.push({path:'js/game-version.js',content:vf.replace(/v:'v[\d.]+'/,"v:'"+ver+"'").replace(/date:'[^']*'/,"date:'"+new Date().toISOString().slice(0,10)+"'")})}}}catch(e){}
  const msg=ver?ver+': '+message:message;
  say(2,'กำลังอัปโหลด '+files.length+' ไฟล์…');const tree=[];let n=0;ui.files(0,files.length);for(const f of files){const blob=await json('/git/blobs',{method:'POST',body:JSON.stringify({content:await b64(f.content),encoding:'base64'})});tree.push({path:f.path,mode:'100644',type:'blob',sha:blob.sha});ui.files(++n,files.length)}
  say(3,'กำลังสร้าง commit '+(ver||'')+'…');const t=await json('/git/trees',{method:'POST',body:JSON.stringify({base_tree:base.tree.sha,tree})}),cm=await json('/git/commits',{method:'POST',body:JSON.stringify({message:msg,tree:t.sha,parents:[head]})});
  say(4,'กำลังอัปเดตเกมบน GitHub…');
  try{await call('/git/refs/heads/'+c.branch,{method:'PATCH',body:JSON.stringify({sha:cm.sha,force:false})});const tag=(ver?ver+' ':'')+'('+cm.sha.slice(0,7)+')';onStatus('push แล้ว · '+tag);ui.ok(tag);return tag}
  catch(e){if(e.status!==422||attempt===3)throw e;ui.note('มีคนเพิ่ง push งานอื่นเข้ามา · รวมงานใหม่แล้วลองอีกครั้ง ('+(attempt+1)+'/3)…');onStatus('main เพิ่งมีงานใหม่ · รวมใหม่แล้วลองอีกครั้ง…')}}}
 catch(e){ui.fail(e);throw e}}
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
const SEED=`(function(){try{const SEEN='project-a-settings-seen',h=v=>{let x=2166136261;for(let i=0;i<v.length;i++)x=Math.imul(x^v.charCodeAt(i),16777619);return(x>>>0).toString(36)},seen=JSON.parse(localStorage.getItem(SEEN)||'{}');for(const[k,v]of Object.entries(window.GAME_SETTINGS)){const cur=localStorage.getItem(k),hv=h(v),own=cur!==null&&seen[k]&&h(cur)!==seen[k];if(cur===null||(!own&&seen[k]&&seen[k]!==hv))localStorage.setItem(k,v);if(!own&&(cur===null||seen[k]||cur===v))seen[k]=hv}localStorage.setItem(SEEN,JSON.stringify(seen))}catch(e){}})();`;
function parseSettings(text){if(!text)return{};const i=text.indexOf('window.GAME_SETTINGS=');if(i<0)return{};const start=text.indexOf('{',i),end=text.indexOf('\n};',start);return JSON.parse(text.slice(start,end+2))}
function settingsFile(obj){return'// Permanent game settings — written by the editors (⬆ Push) · '+new Date().toISOString()+'\n// Defaults for every browser: a browser keeps a value it changed itself, otherwise it follows these.\nwindow.GAME_SETTINGS='+JSON.stringify(obj,null,1)+';\n'+SEED+'\n'}
// keys: localStorage keys to publish · extra: [{path,content}] more files in the same commit
async function pushSettings(keys,label,extra=[],onStatus){const vals={};for(const k of keys){const v=localStorage.getItem(k);if(v!==null)vals[k]=v}
 const sha=await commit('Editor: '+label+' ('+Object.keys(vals).length+' ค่า'+(extra.length?' + '+extra.length+' ไฟล์':'')+')',async head=>{const cur=parseSettings(await head.read('js/game-settings.js'));Object.assign(cur,vals);return[...extra,...(Object.keys(vals).length?[{path:'js/game-settings.js',content:settingsFile(cur)}]:[])]},onStatus);
 try{const seen=JSON.parse(localStorage.getItem('project-a-settings-seen')||'{}');for(const[k,v]of Object.entries(vals))seen[k]=hashStr(v);localStorage.setItem('project-a-settings-seen',JSON.stringify(seen))}catch(e){}return sha}

/* ---------- settings dialog (shared) ---------- */
let dlg=null;
function openSettings(){if(!dlg){dlg=document.createElement('dialog');dlg.id='ghSettings';dlg.style.cssText='max-width:440px;border-radius:12px;border:1px solid #9aa982;padding:18px;font:13px system-ui;background:#f7f5ee;color:#24302a';
 dlg.innerHTML=`<h3 style="margin:0 0 8px">Push ขึ้น GitHub</h3><p style="margin:0 0 10px;color:#55624f">บันทึกแล้วส่งเข้า repo ทันที ใช้ fine-grained token ที่ให้สิทธิ์เฉพาะ repo นี้ · Contents: Read and write · token เก็บในเบราว์เซอร์เครื่องนี้เท่านั้น</p>
 <label style="display:block;margin:6px 0">Repo <input id="ghRepo" style="width:100%;padding:6px" placeholder="owner/repo"></label><label style="display:block;margin:6px 0">Branch <input id="ghBranch" style="width:100%;padding:6px"></label>
 <label style="display:block;margin:6px 0">Token <input id="ghToken" type="password" style="width:100%;padding:6px" placeholder="github_pat_…" autocomplete="off"></label>
 <label style="display:flex;gap:6px;align-items:center;margin:8px 0"><input type="checkbox" id="ghAuto"> push อัตโนมัติเมื่อบันทึก (ปิด = ดาวน์โหลด ZIP แบบเดิม)</label>
 <p id="ghMsg" style="min-height:18px;color:#315d46;margin:6px 0"></p><div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap"><a href="https://github.com/settings/personal-access-tokens/new" target="_blank" rel="noopener" style="margin-right:auto;align-self:center">สร้าง token</a><button id="ghForget">ลบ token</button><button id="ghTest">ทดสอบ</button><button id="ghSave">บันทึก</button><button id="ghClose">ปิด</button></div>`;
 document.body.append(dlg);const $=id=>dlg.querySelector('#'+id),msg=t=>$('ghMsg').textContent=t;
 const read=()=>{const[owner,repo]=$('ghRepo').value.trim().split('/');return{owner:owner||defaults.owner,repo:repo||defaults.repo,branch:$('ghBranch').value.trim()||'main',auto:$('ghAuto').checked,...($('ghToken').value.trim()?{token:$('ghToken').value.trim()}:{})}};
 $('ghSave').onclick=()=>{save(read());msg('บันทึกแล้ว');refreshBadges()};$('ghClose').onclick=()=>dlg.close();
 $('ghForget').onclick=()=>{save({token:''});$('ghToken').value='';msg('ลบ token จากเครื่องนี้แล้ว');refreshBadges()};
 $('ghTest').onclick=async()=>{save(read());msg('กำลังทดสอบ…');try{msg('ใช้ได้ · เขียน '+await test()+' ได้')}catch(e){msg('ใช้ไม่ได้: '+e.message)}refreshBadges()}}
 const c=config();dlg.querySelector('#ghRepo').value=c.owner+'/'+c.repo;dlg.querySelector('#ghBranch').value=c.branch;dlg.querySelector('#ghToken').value='';dlg.querySelector('#ghToken').placeholder=c.token?'มี token แล้ว (ใส่ใหม่เพื่อเปลี่ยน)':'github_pat_…';dlg.querySelector('#ghAuto').checked=c.auto;dlg.querySelector('#ghMsg').textContent='';dlg.showModal()}
const badges=new Set();
function refreshBadges(){for(const b of badges)b.textContent=enabled()?'⬆ GitHub: เปิด':'⬆ GitHub: ปิด'}
function settingsButton(cls=''){const b=document.createElement('button');b.type='button';b.className=cls;b.title='ตั้งค่า push ขึ้น GitHub';b.onclick=openSettings;badges.add(b);refreshBadges();return b}

window.GitHubPush={config,save,enabled,test,commit,readText,applyAssetPatch,manifestFiles,openSettings,settingsButton,pushSettings,parseSettings,settingsFile};
})();
