/* v91.20 · Edit panel for the adventure exits (click an exit marker in the editor).
   Same idea as a place's panel: shows the exit, nudges it cell by cell (snapped to the grid), checks that the hero can walk to it. */
(function(root){'use strict';
const $=id=>document.getElementById(id);
let sel=-1,box=null;
function exitsList(){try{return (typeof exitDoors==="function"?exitDoors():null)||[]}catch(e){return[]}}
function nearest(e){const w=world(e);if(!w)return -1;const L=exitsList();let best=-1,bd=48/(scale*zoom||1);L.forEach((x,i)=>{const p=project(x.u,x.v),d=Math.hypot(p.x-w.x,p.y-w.y);if(d<bd){bd=d;best=i}});return best}
function ensure(){if(box)return box;box=document.createElement('section');box.id='exitPanel';box.hidden=true;
 box.style.cssText='position:fixed;z-index:30;left:16px;bottom:16px;width:250px;padding:12px 14px;border-radius:12px;background:#1b2e2e;border:1px solid #9ca77d;color:#e9e6d7;font:13px VillageThai,system-ui;box-shadow:0 8px 24px #0008';
 box.innerHTML='<b id="exName" style="font-size:15px"></b><p style="margin:6px 0;color:#bfcbb8;font-size:12px">ลากหมุดบนแผนที่ หรือกดลูกศรเพื่อขยับทีละช่อง (ตามกริด 1×1 / 2×2)</p><div style="display:grid;grid-template-columns:repeat(3,44px);gap:4px;justify-content:center"><span></span><button data-d="0,-1">↑</button><span></span><button data-d="-1,0">←</button><button data-d="0,1">↓</button><button data-d="1,0">→</button></div><div style="display:flex;gap:6px;margin-top:8px"><button id="exChk" style="flex:1">🚶 เช็คเดินถึง</button><button id="exClose">ปิด</button></div><p id="exMsg" style="margin:6px 0 0;min-height:1.3em"></p>';
 document.body.appendChild(box);
 box.querySelectorAll('[data-d]').forEach(b=>b.onclick=()=>{const [du,dv]=b.dataset.d.split(',').map(Number);nudge(du,dv)});
 $('exClose')&&0;box.querySelector('#exClose').onclick=()=>{sel=-1;refresh()};
 box.querySelector('#exChk').onclick=()=>{const x=exitsList()[sel],m=box.querySelector('#exMsg');if(!x)return;const p=findPath({u:hero.u,v:hero.v},x);m.textContent=p.length?'✔ เดินถึง ('+p.length+' จุด)':'✖ เดินไม่ถึง — ใช้ 🪄 ต่อถนนออโต้';m.style.color=p.length?'#9fe3a8':'#ff9a8a'};
 return box}
function nudge(du,dv){const L=exitsList();if(sel<0||!L[sel])return;const UX=root.TownUX;UX?.checkpoint?.();const step=UX?.gridMode?.()==='2x2'?.5:1,x=L[sel],U=VillageGrid.snapCell(x.u+du*step,UX?.gridMode?.()||'1x1'),V=VillageGrid.snapCell(x.v+dv*step,UX?.gridMode?.()||'1x1'),P=project(U,V),e=exits[sel];
 e[1]=Math.max(2,Math.min(98,+(P.x/MX).toFixed(3)));e[2]=Math.max(2,Math.min(98,+(P.y/MY).toFixed(3)));cacheSolids();root.TownBiome?.reset?.();UX?.persist?.();heroRestore();refresh()}
function refresh(){const b=ensure(),on=sel>=0&&root.Village25D?.isEditing?.()&&!root.VillageAssetEdit?.placeId?.();b.hidden=!on;if(on)b.querySelector('#exName').textContent='🚪 '+(exitsList()[sel]?.name||'ทางออก')}
root.addEventListener('pointerdown',e=>{if(e.target.id!=='world'||!root.Village25D?.isEditing?.()||root.VillageAssetEdit?.placeId?.())return;const i=nearest(e);if(i!==sel){sel=i;refresh()}},true);
root.addEventListener('keydown',e=>{if(e.key==='Escape'&&sel>=0&&!box.hidden){sel=-1;refresh()}});
setInterval(()=>{if(box&&!box.hidden&&!(root.Village25D?.isEditing?.()))refresh()},800);
root.ExitEdit={select:i=>{sel=i;refresh()},get sel(){return sel}};
})(globalThis);
