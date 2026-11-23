// v12: the game page in "editor mode" (index.html?editor=cards|map|battle|dev), embedded by editor.html.
// • Never writes the play save (save() is a no-op) — tools keep their own storage keys (cards, routes, layout, anchors).
// • Normal gameplay has no in-game editing controls. Open editor.html from the title screen to edit.
(function(){
const mode=new URLSearchParams(location.search).get('editor');
window.openEditor=()=>window.open('editor.html#cards','_blank');
if(!mode)return;
document.body.classList.add('editor-mode','editor-'+mode);
window.EDITOR_MODE=mode;
{const st=document.createElement('style');st.textContent='body.editor-mode #villageTownLayer,body.editor-mode .ambient,body.editor-mode .day-veil,body.editor-mode main>*:not(header){display:none!important}';document.head.appendChild(st)}   // v98.260: the old sub-map / village scene never shows behind an editor tool
save=function(){};                                 // sandbox: play data is read but never written
if(window.Adventure){let st=Adventure.state;Adventure.state=()=>null;void st}
function boot(){try{
 document.getElementById('advLayer')?.setAttribute('hidden','');
 if(mode==='cards'){CardStudio.open()}
}catch(e){console.error('editor boot',e)}}
/* v98.1019 · the old 'ไอคอนเมนู' chooser (?editor=menu) was removed with its Visual › HUD tab — the saved choices (localStorage 'menu-icons-v1', pushed in js/game-settings.js) are still READ by js/town-hud.js and js/nav-icons.js */
// v38j: one "⬆ Push" button per editor tool — publishes that tool's settings (and the card design files) to GitHub
const PUSH={cards:{label:'การ์ด',keys:[]},battle:{label:'สนามต่อสู้',keys:['tactics-anchors-v1','project-a-battle-polish','project-a-ct-crops-v32']},dev:{label:'จัดฉาก/layout',keys:['everyday-layout-v1','three-card-config-v2']},map:{label:'แผนที่หมู่บ้าน',keys:['everyday-village-map-v03','everyday-village-routes-v1','three-card-routes-v1','asset-hero-ratio-v1','place-art-frames-v1','art-lights-v1']}};
function pushBar(){if(!window.GitHubPush||!PUSH[mode])return;const bar=document.createElement('div');bar.id='editorPush';bar.style.cssText='position:fixed;right:14px;bottom:14px;z-index:2147483000;display:flex;gap:6px;align-items:center;background:#241d15f0;border:1px solid #c9893a;border-radius:10px;padding:6px 8px;font:12px AgThai,system-ui,"Noto Sans Thai",sans-serif;color:#f3e7cf;box-shadow:0 6px 20px #0008';
 const go=document.createElement('button'),msg=document.createElement('span');go.textContent='⬆ Push '+PUSH[mode].label+' ขึ้นเกม';go.style.cssText='background:#c9893a;color:#fff;border:0;border-radius:7px;padding:6px 10px;cursor:pointer;font:inherit';msg.style.cssText='max-width:280px;color:#e6d3a9';
 const set=GitHubPush.settingsButton();set.style.cssText='background:#30271d;color:#f3e7cf;border:1px solid #4a3b29;border-radius:7px;padding:6px 8px;cursor:pointer;font:inherit';bar.append(msg,go,set);document.body.appendChild(bar);
 go.onclick=async()=>{if(!GitHubPush.config().token){GitHubPush.openSettings(()=>go.click());return}go.disabled=true;const status=t=>msg.textContent=t;
  try{let extra=[];if(mode==='cards'){const map={'card-design.json':'data/card-design.json','card-design.js':'js/card-design.js'};extra=CardStudio.exportFiles().filter(f=>/^(card-design\.(json|js)|assets\/)/.test(f.name)).map(f=>({path:map[f.name]||f.name,content:f.data}))}
   if(mode==='map'&&window.frames.length){for(const f of document.querySelectorAll('iframe')){try{f.contentWindow.VillageLayoutPush?.()}catch(e){}}}
   const sha=await GitHubPush.pushSettings(PUSH[mode].keys,PUSH[mode].label,extra,status);status(sha?'⬆ push แล้ว · '+sha+(mode==='map'?' · ผังหมู่บ้าน 2.5D push แยกในหน้าแผนที่':''):'ไม่มีค่าที่ต้อง push')}
  catch(e){status('push ไม่สำเร็จ: '+e.message)}finally{go.disabled=false}}}
window.addEventListener('load',()=>setTimeout(pushBar,400));
window.addEventListener('load',()=>setTimeout(boot,350));
})();
