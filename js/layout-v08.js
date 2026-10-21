// v08 layout: one permanent top bar (title + HUD + menu) that stays visible on every screen except battle,
// panels open BELOW that bar (the bar stays clickable), the village map fills the whole area under the bar,
// and the freshness popup is removed.
(function(){
const header=document.querySelector('main > header'),hud=$('hud');
// 1) merge the HUD row into the header row
function mergeBar(){if(hud&&header&&hud.parentElement!==header){header.insertBefore(hud,header.querySelector('.header-actions'));document.body.classList.add('one-bar')}}
mergeBar();
function barHeight(){let r=header?.getBoundingClientRect();return r?Math.round(r.bottom+6):80}
function syncBar(){document.documentElement.style.setProperty('--bar-h',barHeight()+'px')}
window.addEventListener('resize',syncBar);
// 2) the main panel opens as a non-modal window under the bar, with its own backdrop that leaves the bar uncovered
const panel=$('panel');let shade=document.createElement('div');shade.id='panelShade';shade.hidden=true;document.body.appendChild(shade);
const nativeShow=panel.showModal.bind(panel),nativeClose=panel.close.bind(panel);
panel.showModal=function(){syncBar();if(!panel.open)panel.show();shade.hidden=false;panel.classList.add('under-bar')};
panel.close=function(){shade.hidden=true;panel.classList.remove('under-bar');if(panel.open){nativeClose()}};
panel.addEventListener('close',()=>{if(!panel.open){shade.hidden=true;panel.classList.remove('under-bar')}});
shade.addEventListener('click',()=>{if(!busy)panel.close()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&panel.open&&!busy&&!document.body.classList.contains('tactics-open')){panel.close();e.preventDefault()}});
// switching panels from the bar: only the village map uses the full-screen layout
const baseDialog=villageDialog;villageDialog=function(title,html){panel.classList.remove('map-panel');mapEditing=false;return baseDialog(title,html)};
// 3) freshness popup removed — the face keeps its tooltip only
window.showFreshness=function(){};
const baseRender=render;render=function(){baseRender();mergeBar();syncBar()};
syncBar();render();
})();
