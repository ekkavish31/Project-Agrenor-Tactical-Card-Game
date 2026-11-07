/* Opening cutscene = the supplied video (assets/intro/agrenor-intro.mp4). The background music (Intro Adventure 01) is started by
   js/game-bgm.js the moment the maker logo is gone, so it runs together with this (muted) video and carries on into the menu.
   Skip: Esc or X key (text hint only, no buttons). When the video ends — or is skipped — the menu is revealed (class ag-reveal). */
(()=>{'use strict';
const SRC='assets/intro/agrenor-intro.mp4?v=5';let active=false,video=null,ready=null,blobUrl=null,aborter=null,onProg=null;
/* v98.175 · the whole video is downloaded (with progress) while the black start gate is up and played from a blob URL, so nothing streams
   during the logo/cutscene. If the download is too slow the gate calls fallback(): the download is aborted and the video streams as before. */
async function download(){
 const hit=await window.AgMediaCache?.get(SRC);if(hit){const b=await hit.blob();if(b.size>1e6){if(onProg)onProg(1);return b}}
 const res=await fetch(SRC,{signal:aborter.signal});if(!res.ok)throw new Error('HTTP '+res.status);
 const total=+res.headers.get('content-length')||0,reader=res.body&&res.body.getReader();
 if(!reader){const b=await res.blob();window.AgMediaCache?.put(SRC,b,'video/mp4');return b}
 const chunks=[];let got=0;
 for(;;){const {done,value}=await reader.read();if(done)break;chunks.push(value);got+=value.length;if(total&&onProg)onProg(Math.min(.99,got/total))}
 const blob=new Blob(chunks,{type:'video/mp4'});window.AgMediaCache?.put(SRC,blob,'video/mp4');return blob}
function prepare(cb){if(cb)onProg=cb;if(ready)return ready;
 ready=new Promise(resolve=>{aborter=new AbortController();
  const open=src=>{const v=document.createElement('video');v.preload='auto';v.muted=true;v.defaultMuted=true;v.setAttribute('muted','');v.playsInline=true;v.setAttribute('playsinline','');v.disablePictureInPicture=true;v.src=src;video=v;
   const timer=setTimeout(resolve,8000);v.addEventListener('canplay',()=>{clearTimeout(timer);if(onProg)onProg(1);resolve()},{once:true});
   v.addEventListener('error',()=>{clearTimeout(timer);video=null;resolve()},{once:true});v.load()};
  if(blobUrl){open(blobUrl);return}
  download().then(blob=>{blobUrl=URL.createObjectURL(blob);open(blobUrl)},()=>open(SRC))});
 return ready}
function fallback(){try{aborter&&aborter.abort()}catch{}}
window.GameIntro={prepare,fallback,ready:()=>!!video&&video.readyState>=3,play(title){if(active||!title?.isConnected)return;
 const release=()=>window.dispatchEvent(new Event('maker-intro-finished'));
 if(matchMedia('(prefers-reduced-motion: reduce)').matches||!video){release();return}
 active=true;const main=title.querySelector('.ts-main'),v=video,el=document.createElement('section');
 el.id='storyIntro';el.setAttribute('role','dialog');el.setAttribute('aria-modal','true');el.setAttribute('aria-label','การเดินทางเริ่มต้น');
 el.innerHTML='<div class="si-hint">กด Esc หรือ X เพื่อข้าม</div>';el.prepend(v);
 main.inert=true;title.classList.add('ag-playing');el.classList.add('si-in');title.append(el);
 requestAnimationFrame(()=>requestAnimationFrame(()=>{if(ended)return;el.classList.add('si-fadein');el.classList.remove('si-in');setTimeout(()=>el.classList.remove('si-fadein'),1200)}));
 /* v98.173 · the video's own soundtrack is not used: it stays muted, the only audio is the BGM "Intro - Adventure 01" from game-bgm.js */
 let ended=false;
 function finish(skipped){if(ended)return;ended=true;active=false;
  document.removeEventListener('keydown',key,true);document.removeEventListener('visibilitychange',visibility);
  v.removeEventListener('ended',onEnd);v.removeEventListener('error',onError);
  if(!skipped)el.style.background='#fff'; /* the video ends on pure white: letterbox bars fade with it */
  title.classList.add('ag-reveal');el.classList.add(skipped?'si-out-fast':'si-out');
  main.inert=false;title.classList.remove('ag-playing');release();
  const gone=()=>{v.pause();v.removeAttribute('src');v.load();video=null;ready=null;el.remove()};
  setTimeout(gone,skipped?700:1500);
  (main.querySelector('[data-act="continue"]:not([disabled])')||main.querySelector('[data-act="new"]'))?.focus({preventScroll:true})}
 function key(e){if(e.repeat)return;const k=e.key;if(k==='Escape'||k==='x'||k==='X'){e.preventDefault();e.stopPropagation();finish(true)}}
 const onEnd=()=>finish(false),onError=()=>finish(true);
 function visibility(){if(document.hidden)v.pause();else if(!ended)v.play().catch(()=>{})}
 document.addEventListener('keydown',key,true);document.addEventListener('visibilitychange',visibility);
 v.addEventListener('ended',onEnd);v.addEventListener('error',onError);
 try{v.currentTime=0}catch{}v.muted=true;
 v.play().catch(()=>finish(true));
}};})();
