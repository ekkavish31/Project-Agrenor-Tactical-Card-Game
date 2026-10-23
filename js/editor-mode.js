// v12: the game page in "editor mode" (index.html?editor=cards|map|battle|dev), embedded by editor.html.
// • Never writes the play save (save() is a no-op) — tools keep their own storage keys (cards, routes, layout, anchors).
// • The normal game shows a single "Editor" button that opens editor.html; the in-game dev tools are gone from the bar.
(function(){
const mode=new URLSearchParams(location.search).get('editor');
window.openEditor=()=>window.open('editor.html#cards','_blank');
if(!mode)return;
document.body.classList.add('editor-mode','editor-'+mode);
window.EDITOR_MODE=mode;
save=function(){};                                 // sandbox: play data is read but never written
if(window.Adventure){let st=Adventure.state;Adventure.state=()=>null;void st}
function boot(){try{
 document.getElementById('advLayer')?.setAttribute('hidden','');
 if(mode==='cards'){CardStudio.open()}
 else if(mode==='map'){if(typeof openMapEditor==='function')openMapEditor();else openPanel('map')}
 else if(mode==='dev'){if(typeof toggleDev==='function'&&!devActive)toggleDev()}
 else if(mode==='menu'){menuPicker()}
 else if(mode==='battle'){if(!new URLSearchParams(location.search).get('try'))try{localStorage.removeItem('battleground-try')}catch(e){}s.village.adventure=null;s.village.location='forge';s.hp=60;s.stamina=100;s.fatigue=0;s.minutes=480;s.mode='forge';render();openTactical()}
}catch(e){console.error('editor boot',e)}}
// menu icon chooser: each top-right button can use a picture from assets/icons/menu or the drawn icon
const MENU_ICONS=['village','map','bag','deck','market','battle','guard','party','quest','trophy','spellbook','potion','treasure','forge','settings','mail','calendar','guild','trade','portal','castle','balance','stats','collection','gear'];
function menuPicker(){let KEY='menu-icons-v1',get=()=>{try{return JSON.parse(localStorage.getItem(KEY))||{}}catch(e){return {}}};let box=document.createElement('section');box.id='menuPicker';document.body.appendChild(box);
 const draw=()=>{let cur=get(),btns=[...document.querySelectorAll('.header-actions .illustrated-nav')].map(b=>({id:b.id==='motion'?'motion':b.id.replace(/^nav-/,''),label:b.querySelector('span')?.textContent||b.title}));
  box.innerHTML=`<h2>ไอคอนเมนู (ปุ่มขวาบน)</h2><p style="color:#bba57f">เลือกภาพให้แต่ละปุ่ม ดูผลได้ทันทีที่แถบด้านบน · "เดิม" = ไอคอนวาดด้วยโค้ด · บันทึกอัตโนมัติ เกมเห็นเมื่อรีโหลด</p><div class="mp-rows">${btns.map(b=>`<div class="mp-row"><h3>${b.label}</h3><div class="mp-grid"><button data-b="${b.id}" data-i="" class="${cur[b.id]?'':'on'}">เดิม</button>${MENU_ICONS.map(i=>`<button data-b="${b.id}" data-i="${i}" class="${cur[b.id]===i?'on':''}" title="${i}"><img src="assets/icons/menu/${i}.webp" alt=""></button>`).join('')}</div></div>`).join('')}</div>`};
 box.onclick=e=>{let b=e.target.closest('[data-b]');if(!b)return;let cur=get();if(b.dataset.i)cur[b.dataset.b]=b.dataset.i;else delete cur[b.dataset.b];localStorage.setItem(KEY,JSON.stringify(cur));window.NavIcons?.paint();draw()};draw()}
// v38j: one "⬆ Push" button per editor tool — publishes that tool's settings (and the card design files) to GitHub
const PUSH={cards:{label:'การ์ด',keys:[]},battle:{label:'สนามต่อสู้',keys:['tactics-anchors-v1','project-a-battle-polish','project-a-ct-crops-v32']},menu:{label:'ไอคอนเมนู',keys:['menu-icons-v1']},dev:{label:'จัดฉาก/layout',keys:['everyday-layout-v1','three-card-config-v2']},map:{label:'แผนที่หมู่บ้าน',keys:['everyday-village-map-v03','everyday-village-routes-v1','three-card-routes-v1']}};
function pushBar(){if(!window.GitHubPush||!PUSH[mode])return;const bar=document.createElement('div');bar.id='editorPush';bar.style.cssText='position:fixed;right:14px;bottom:14px;z-index:2147483000;display:flex;gap:6px;align-items:center;background:#241d15f0;border:1px solid #c9893a;border-radius:10px;padding:6px 8px;font:12px system-ui,"Noto Sans Thai",sans-serif;color:#f3e7cf;box-shadow:0 6px 20px #0008';
 const go=document.createElement('button'),msg=document.createElement('span');go.textContent='⬆ Push '+PUSH[mode].label+' ขึ้นเกม';go.style.cssText='background:#c9893a;color:#fff;border:0;border-radius:7px;padding:6px 10px;cursor:pointer;font:inherit';msg.style.cssText='max-width:280px;color:#e6d3a9';
 const set=GitHubPush.settingsButton();set.style.cssText='background:#30271d;color:#f3e7cf;border:1px solid #4a3b29;border-radius:7px;padding:6px 8px;cursor:pointer;font:inherit';bar.append(msg,go,set);document.body.appendChild(bar);
 go.onclick=async()=>{if(!GitHubPush.config().token){GitHubPush.openSettings();return}go.disabled=true;const status=t=>msg.textContent=t;
  try{let extra=[];if(mode==='cards'){const map={'card-design.json':'data/card-design.json','card-design.js':'js/card-design.js'};extra=CardStudio.exportFiles().filter(f=>/^(card-design\.(json|js)|assets\/)/.test(f.name)).map(f=>({path:map[f.name]||f.name,content:f.data}))}
   if(mode==='map'&&window.frames.length){for(const f of document.querySelectorAll('iframe')){try{f.contentWindow.VillageLayoutPush?.()}catch(e){}}}
   const sha=await GitHubPush.pushSettings(PUSH[mode].keys,PUSH[mode].label,extra,status);status(sha?'⬆ push แล้ว · '+sha.slice(0,7)+(mode==='map'?' · ผังหมู่บ้าน 2.5D push แยกในหน้าแผนที่':''):'ไม่มีค่าที่ต้อง push')}
  catch(e){status('push ไม่สำเร็จ: '+e.message)}finally{go.disabled=false}}}
window.addEventListener('load',()=>setTimeout(pushBar,400));
window.addEventListener('load',()=>setTimeout(boot,350));
})();
