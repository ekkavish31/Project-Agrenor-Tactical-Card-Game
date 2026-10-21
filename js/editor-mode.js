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
 else if(mode==='battle'){s.village.adventure=null;s.village.location='forge';s.hp=60;s.stamina=100;s.fatigue=0;s.minutes=480;s.mode='forge';render();openTactical()}
}catch(e){console.error('editor boot',e)}}
// menu icon chooser: each top-right button can use a picture from assets/icons/menu or the drawn icon
const MENU_ICONS=['village','map','bag','deck','market','battle','guard','party','quest','trophy','spellbook','potion','treasure','forge','settings','mail','calendar','guild','trade','portal','castle','balance','stats','collection','gear'];
function menuPicker(){let KEY='menu-icons-v1',get=()=>{try{return JSON.parse(localStorage.getItem(KEY))||{}}catch(e){return {}}};let box=document.createElement('section');box.id='menuPicker';document.body.appendChild(box);
 const draw=()=>{let cur=get(),btns=[...document.querySelectorAll('.header-actions .illustrated-nav')].map(b=>({id:b.id==='motion'?'motion':b.id.replace(/^nav-/,''),label:b.querySelector('span')?.textContent||b.title}));
  box.innerHTML=`<h2>ไอคอนเมนู (ปุ่มขวาบน)</h2><p style="color:#bba57f">เลือกภาพให้แต่ละปุ่ม ดูผลได้ทันทีที่แถบด้านบน · "เดิม" = ไอคอนวาดด้วยโค้ด · บันทึกอัตโนมัติ เกมเห็นเมื่อรีโหลด</p><div class="mp-rows">${btns.map(b=>`<div class="mp-row"><h3>${b.label}</h3><div class="mp-grid"><button data-b="${b.id}" data-i="" class="${cur[b.id]?'':'on'}">เดิม</button>${MENU_ICONS.map(i=>`<button data-b="${b.id}" data-i="${i}" class="${cur[b.id]===i?'on':''}" title="${i}"><img src="assets/icons/menu/${i}.webp" alt=""></button>`).join('')}</div></div>`).join('')}</div>`};
 box.onclick=e=>{let b=e.target.closest('[data-b]');if(!b)return;let cur=get();if(b.dataset.i)cur[b.dataset.b]=b.dataset.i;else delete cur[b.dataset.b];localStorage.setItem(KEY,JSON.stringify(cur));window.NavIcons?.paint();draw()};draw()}
window.addEventListener('load',()=>setTimeout(boot,350));
})();
