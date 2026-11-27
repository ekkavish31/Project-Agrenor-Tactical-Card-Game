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
 /* v98.1108 · the standard loading screen (js/game-loader.js: same look as the game's own loading screen) */
 const veil=(root.StdLoader?root.StdLoader.make({id:'imgGateVeil',title:'กำลังเตรียมฉาก',step:'กำลังเปิดหน้าบันทึกการเดินทาง'}):document.createElement('div'));veil.id='imgGateVeil';
 document.documentElement.appendChild(veil);
 const progress={set value(v){root.StdLoader&&root.StdLoader.progress(veil,v/100)}},msg={set textContent(t){root.StdLoader&&root.StdLoader.step(veil,t)}},retry=veil.querySelector('.gl-retry')||{};retry.onclick=()=>location.reload();
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
  if(quiet>=3){open=false;progress.value=100;if(root.Image===TrackedImage)root.Image=Orig;Promise.resolve(root.StdLoader?.finish(veil)).then(()=>setTimeout(()=>{root.__imgGateOpen=false;veil.remove();list.length=0;resolve();root.dispatchEvent(new Event('agrenor-scene-ready'))},350));return}
  if(performance.now()-t0>15000){msg.textContent='กำลังรอภาพของฉาก หากรอนานลองโหลดใหม่ได้';retry.hidden=false}
  setTimeout(tick,90);
 }
 setTimeout(tick,90);
})(window);
