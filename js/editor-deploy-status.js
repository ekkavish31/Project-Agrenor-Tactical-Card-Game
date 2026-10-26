/* v82.4 · Deployment and local-vs-web state for the Editor shell. */
(function(){'use strict';
 const script=document.currentScript,base=new URL('./',script.src),repo='ekkavish31/Project-Agrenor-Tactical-Card-Game';
 const $=id=>document.getElementById(id),status=$('deployStatus'),bar=$('editorConflict');
 const style=document.createElement('style');style.textContent='#editorConflict{display:inline-flex;align-items:center;justify-content:center;width:26px;height:26px;border-radius:50%;background:#ffd84d;color:#37280f;font:700 15px system-ui;cursor:pointer;border:1px solid #b8932f;flex:none}#editorConflict[hidden]{display:none}';document.head.append(style);if(status&&bar)status.after(bar);
 const versionOf=t=>(t.match(/v:\s*'?(v\d+(?:\.\d+)?)/)||[])[1]||'ไม่ทราบ';
 const tuple=v=>(String(v).match(/v?(\d+)(?:\.(\d+))?/)||[]).slice(1).map(Number);
 const newer=(a,b)=>{const x=tuple(a),y=tuple(b);return(x[0]||0)>(y[0]||0)||((x[0]||0)===(y[0]||0)&&(x[1]||0)>(y[1]||0))};
 async function text(url){const r=await fetch(url+(url.includes('?')?'&':'?')+'cb='+Date.now(),{cache:'no-store'});if(!r.ok)throw Error('HTTP '+r.status);return r.text()}
 async function deployCheck(){try{const live=versionOf(await text(new URL('game-version.js',base).href)),latest=versionOf(await text('https://raw.githubusercontent.com/'+repo+'/main/js/game-version.js'));status.className='';if(live===latest){status.className='latest';status.textContent='บนเว็บเป็น '+live+' · ล่าสุดแล้ว ✓'}else if(newer(latest,live)){status.className='waiting';status.textContent='บนเว็บเป็น '+live+' · GitHub '+latest+' · กำลัง deploy…'}else{status.className='waiting';status.textContent='บนเว็บเป็น '+live+' · ตรวจพบเวอร์ชัน repo '+latest}}catch(e){status.textContent='สถานะ Deploy ตรวจไม่ได้ · '+(window.GAME_VERSION?.v||'เว็บ');status.title=e.message}}
 const hash=v=>{v=String(v);let h=2166136261;for(let i=0;i<v.length;i++)h=Math.imul(h^v.charCodeAt(i),16777619);return(h>>>0).toString(36)};
 function parseSettings(s){try{const i=s.indexOf('window.GAME_SETTINGS='),a=s.indexOf('{',i),b=s.indexOf('\n};',a);return i<0||a<0||b<0?null:JSON.parse(s.slice(a,b+2))}catch(e){return null}}
 function parseVillageLayout(s){try{const i=s.indexOf('window.VillageDefaultLayout='),a=s.indexOf('{',i),b=s.indexOf('\n};',a);return i<0||a<0||b<0?null:JSON.parse(s.slice(a,b+2))}catch(e){return null}}
 let remoteSettings=null,conflicts=[];
 function conflictSig(){return hash(conflicts.map(k=>k+'|'+localStorage.getItem(k)+'|'+remoteSettings[k]).join('|'))}
 function drawConflict(){if(!remoteSettings){bar.hidden=true;return}conflicts=Object.keys(remoteSettings).filter(k=>localStorage.getItem(k)!==null&&localStorage.getItem(k)!==remoteSettings[k]);if(!conflicts.length){bar.hidden=true;return}
  const sig=conflictSig();if(sessionStorage.getItem('editor-conflict-dismissed')===sig){bar.hidden=true;return}
  bar.hidden=false;bar.textContent='!';bar.title='⚠ ค่าในเครื่องต่างจากบนเว็บ ('+conflicts.length+' ค่า) · คลิกเพื่อเลือกดึงค่าล่าสุด (เขียนทับค่าในเครื่อง) หรือเก็บของฉันไว้';
  bar.onclick=()=>{if(!confirm('ค่าในเครื่องต่างจากบนเว็บ ('+conflicts.length+' ค่า)\n\nตกลง = ดึงค่าล่าสุดจากเว็บ (เขียนทับค่าที่แก้ไว้ในเครื่อง)\nยกเลิก = เก็บของฉันไว้ (ซ่อนป้ายนี้ในเซสชันนี้)')){sessionStorage.setItem('editor-conflict-dismissed',sig);bar.hidden=true;return}
   for(const k of conflicts)localStorage.setItem(k,remoteSettings[k]);try{const key='project-a-settings-seen',seen=JSON.parse(localStorage.getItem(key)||'{}');for(const k of conflicts)seen[k]=hash(remoteSettings[k]);localStorage.setItem(key,JSON.stringify(seen))}catch(e){}sessionStorage.removeItem('editor-conflict-dismissed');location.reload()};
 }
 async function checkSettings(){try{const [s,l]=await Promise.all([text(new URL('game-settings.js',base).href),text(new URL('village-layout-v67.js',base).href)]);remoteSettings=parseSettings(s)||{...(window.GAME_SETTINGS||{})};const layout=parseVillageLayout(l);if(layout?.places)remoteSettings['project-a-village-main-v1']=JSON.stringify(Object.fromEntries(Object.entries(layout.places).map(([id,p])=>[id,{x:p.x,y:p.y,facing:p.facing}])));drawConflict()}catch(e){remoteSettings=window.GAME_SETTINGS||null;drawConflict()}}
 deployCheck();checkSettings();setInterval(deployCheck,25000);setInterval(checkSettings,60000);
})();