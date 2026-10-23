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
async function commit(message,build,onStatus=()=>{}){const c=config();if(!c.token)throw new Error('ยังไม่ได้ตั้งค่า GitHub token');
 for(let attempt=1;attempt<=3;attempt++){onStatus('กำลังอ่าน main ล่าสุด…');const ref=await json('/git/ref/heads/'+c.branch),head=ref.object.sha,base=await json('/git/commits/'+head);
  const files=await build({sha:head,read:p=>readText(p,head)});if(!files.length)return null;
  // small change → bump the decimal of the game version (v80 → v80.1 → v80.2) and prefix the commit message with it
  let ver='';try{const vf=await readText('js/game-version.js',head);if(vf){const m=vf.match(/v:'v(\d+)(?:\.(\d+))?'/);if(m){ver='v'+m[1]+'.'+((+m[2]||0)+1);files.push({path:'js/game-version.js',content:vf.replace(/v:'v[\d.]+'/,"v:'"+ver+"'").replace(/date:'[^']*'/,"date:'"+new Date().toISOString().slice(0,10)+"'")})}}}catch(e){}
  const msg=ver?ver+': '+message:message;
  onStatus('กำลังอัปโหลด '+files.length+' ไฟล์…');const tree=[];for(const f of files){const blob=await json('/git/blobs',{method:'POST',body:JSON.stringify({content:await b64(f.content),encoding:'base64'})});tree.push({path:f.path,mode:'100644',type:'blob',sha:blob.sha})}
  const t=await json('/git/trees',{method:'POST',body:JSON.stringify({base_tree:base.tree.sha,tree})}),cm=await json('/git/commits',{method:'POST',body:JSON.stringify({message:msg,tree:t.sha,parents:[head]})});
  try{await call('/git/refs/heads/'+c.branch,{method:'PATCH',body:JSON.stringify({sha:cm.sha,force:false})});onStatus('push แล้ว · '+(ver||cm.sha.slice(0,7)));return ver||cm.sha.slice(0,7)}
  catch(e){if(e.status!==422||attempt===3)throw e;onStatus('main เพิ่งมีงานใหม่ · รวมใหม่แล้วลองอีกครั้ง…')}}}
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
