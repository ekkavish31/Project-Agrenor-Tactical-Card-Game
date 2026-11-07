/* Opening cutscene = the supplied video (assets/intro/agrenor-intro.mp4). The background music (Intro Adventure 01) is started by
   js/game-bgm.js the moment the maker logo is gone, so it runs together with this (muted) video and carries on into the menu.
   Skip: Esc or X key (text hint only, no buttons). When the video ends — or is skipped — the menu is revealed (class ag-reveal). */
(()=>{'use strict';
const SRC='assets/intro/agrenor-intro.mp4?v=1';let active=false,video=null,ready=null;
function prepare(){if(ready)return ready;
 ready=new Promise(resolve=>{const v=document.createElement('video');v.preload='auto';v.muted=true;v.defaultMuted=true;v.setAttribute('muted','');v.playsInline=true;v.setAttribute('playsinline','');v.disablePictureInPicture=true;v.src=SRC;video=v;
  const done=()=>resolve(),timer=setTimeout(done,8000);v.addEventListener('canplay',()=>{clearTimeout(timer);done()},{once:true});
  v.addEventListener('error',()=>{clearTimeout(timer);video=null;done()},{once:true});v.load()});
 return ready}
window.GameIntro={prepare,ready:()=>!!video&&video.readyState>=3,play(title){if(active||!title?.isConnected)return;
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
