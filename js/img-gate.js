/* A scene is revealed only after its first paint and its queued images decode.
   Slow connections keep Mip visible; timeout offers Retry, never a green scene. */
(function(root){
 'use strict';
 if(root.__imgGate||/[?&](edit|nogate)=1/.test(location.search))return;
 root.__imgGate=1;root.__imgGateOpen=true;
 const Orig=root.Image,list=[],decoded=new WeakMap();let open=true,painted=false,resolve,quiet=0;
 const done=new Promise(r=>resolve=r);
 root.SceneLoad={done,painted:()=>{painted=true}};
 function TrackedImage(w,h){const im=new Orig(w,h);if(open)list.push(im);return im}
 TrackedImage.prototype=Orig.prototype;root.Image=TrackedImage;
 for(const href of ['css/mip-loader.css?v=v98.1035','css/ivory-ui.css?v=v98.1049']){const l=document.createElement('link');l.rel='stylesheet';l.href=href;(document.head||document.documentElement).appendChild(l)}
 const css=document.createElement('style');css.textContent='#imgGateVeil{position:fixed;inset:0;z-index:2147483000}#imgGateVeil .mip-track{--mw:100%}#imgGateVeil progress{width:100%;accent-color:#a67e3e;height:9px}#imgGateVeil button[hidden]{display:none}';(document.head||document.documentElement).appendChild(css);
 const veil=document.createElement('div');veil.id='imgGateVeil';veil.className='scene-transit';veil.style.cssText='position:fixed;inset:0;z-index:2147483000;background:#f2e7ca;color:#3e2a18';veil.setAttribute('role','status');veil.setAttribute('aria-live','polite');
 veil.innerHTML='<div class="load-card"><h2>กำลังเตรียมฉาก…</h2><div class="mip-track" aria-hidden="true"><div class="mip-go"><div class="mip-flip"><div class="mip-run"><i></i></div><div class="mip-idle"><i></i></div></div></div></div><progress max="100" value="0" aria-label="ภาพของฉาก"></progress><p>กำลังเปิดหน้าบันทึกการเดินทาง</p><button hidden type="button">ลองโหลดใหม่</button></div>';
 document.documentElement.appendChild(veil);
 const progress=veil.querySelector('progress'),msg=veil.querySelector('p'),retry=veil.querySelector('button');retry.onclick=()=>location.reload();
 // Include the mascot too: CSS background images do not use new Image().
 const mascot=new root.Image();mascot.src='assets/ui/mip-sheet.webp?v=2';
 const t0=performance.now();let count=0;
 const settled=im=>{
  if(!im.src)return true;
  if(!im.complete)return false;
  if(!im.naturalWidth)return true; // failed optional artwork has an in-game fallback
  if(!im.decode)return true;
  if(!decoded.has(im)){const src=im.src,state={src,ready:false};decoded.set(im,state);im.decode().catch(()=>{}).then(()=>{state.ready=true});return false}
  const state=decoded.get(im);if(state.src!==im.src){decoded.delete(im);return false}return state.ready;
 };
 function tick(){
  if(!open)return;
  const n=list.filter(settled).length,stable=count===list.length;count=list.length;
  const complete=list.length>0&&n===list.length&&document.readyState!=='loading'&&painted;
  progress.value=Math.min(99,Math.round(n/Math.max(1,list.length)*95));
  quiet=complete&&stable?quiet+1:0;
  if(quiet>=3){open=false;progress.value=100;root.__imgGateOpen=false;if(root.Image===TrackedImage)root.Image=Orig;veil.remove();list.length=0;resolve();root.dispatchEvent(new Event('agrenor-scene-ready'));return}
  if(performance.now()-t0>15000){msg.textContent='กำลังรอภาพของฉาก หากรอนานลองโหลดใหม่ได้';retry.hidden=false}
  setTimeout(tick,90);
 }
 setTimeout(tick,90);
})(window);
