/* v98.1156 · shared Mip: run → walk to the actual rail centre → sit → front-facing blink/breathe.
   still(root,true) returns a promise: callers must await it before removing the cover. */
(function(root){
 'use strict';
 const states=new WeakMap(),REST='assets/ui/mip-rest-sheet.webp',SIT='assets/ui/mip-sit-sheet.webp';
 let artwork;
 function ready(){return artwork||(artwork=Promise.all([SIT,REST].map(src=>new Promise(resolve=>{
  const im=new Image();let done=false;const end=ok=>{if(done)return;done=true;clearTimeout(timer);resolve(ok)};
  const timer=setTimeout(()=>end(false),8000);im.onload=()=>{if(im.decode)im.decode().catch(()=>{}).then(()=>end(true));else end(true)};im.onerror=()=>end(false);im.src=src;
 }))).then(a=>a.every(Boolean)))}
 function html(o={}){ready();const st=[o.size?'--ms:'+o.size:'',o.width?'--mw:'+o.width:'',o.style||''].filter(Boolean).join(';');return '<div class="mip-track" aria-hidden="true"'+(st?' style="'+st+'"':'')+'><div class="mip-go"><div class="mip-flip"><div class="mip-run"><i></i></div><div class="mip-idle"><i></i></div></div></div></div>'}
 function mount(parent,o){const t=document.createElement('div');t.innerHTML=html(o);const el=t.firstChild;parent.append(el);return el}
 const tracks=el=>!el?[]:el.matches?.('.mip-track')?[el]:[...el.querySelectorAll('.mip-track')];
 function offset(go){const t=getComputedStyle(go).transform;if(!t||t==='none')return 0;const a=t.slice(t.indexOf('(')+1,-1).split(',').map(Number);return a.length===16?a[12]:a[4]||0}
 function reset(track){const s=states.get(track);if(s){s.cancelled=true;cancelAnimationFrame(s.raf);s.release(false);states.delete(track)}track.classList.remove('mip-finishing','mip-sitting','mip-still','mip-art-failed');delete track.dataset.mipState;const go=track.querySelector('.mip-go'),flip=track.querySelector('.mip-flip');go?.style.removeProperty('transform');flip?.style.removeProperty('transform');flip?.style.removeProperty('background-position')}
 function finish(track){
  try{if(root.frameElement&&!root.frameElement.getClientRects().length)return Promise.resolve(false)}catch(e){}
  const old=states.get(track);if(old)return old.promise;
  const go=track.querySelector('.mip-go'),flip=track.querySelector('.mip-flip');if(!go||!flip||!track.isConnected)return Promise.resolve(false);
  const s={x:offset(go),raf:0,cancelled:false,phase:'walk',last:performance.now(),start:0,painted:-1};
  s.promise=new Promise(resolve=>s.release=resolve);states.set(track,s);const art=ready();let artOK=null;art.then(ok=>artOK=ok);
  // Capture CSS position BEFORE disabling travel. No centre snap, including at completion near either end.
  go.style.transform=`translateX(${s.x}px)`;flip.style.transform=s.x<Math.max(0,track.clientWidth-go.offsetWidth)/2?'scaleX(-1)':'scaleX(1)';track.classList.add('mip-finishing');track.dataset.mipState='walking';
  const reduced=!!root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  const tick=t=>{
   if(s.cancelled)return;if(!track.isConnected){s.cancelled=true;states.delete(track);s.release(false);return}
   const max=Math.max(0,track.clientWidth-go.offsetWidth),goal=max/2,dt=Math.min(50,Math.max(0,t-s.last));s.last=t;
   if(s.phase==='walk'){
    const distance=goal-s.x,speed=Math.max(40,max/3)*.75/1000;
    if(Math.abs(distance)>.1){flip.style.transform=distance>0?'scaleX(-1)':'scaleX(1)';s.x+=Math.sign(distance)*Math.min(Math.abs(distance),speed*dt);go.style.transform=`translateX(${s.x}px)`}
    if(Math.abs(goal-s.x)<=.1&&artOK!==null){s.x=goal;go.style.transform=`translateX(${goal}px)`;
     if(!artOK){track.classList.add('mip-art-failed');track.dataset.mipState='fallback';s.release(false);return}
     s.phase='sit';s.start=t;track.classList.add('mip-sitting');track.dataset.mipState='sitting';
     // The sheet starts facing left. Mirror only the turn sequence for an arrival from the left.
     s.mirror=flip.style.transform==='scaleX(-1)';flip.style.transform=s.mirror?'scaleX(-1)':'scaleX(1)';
    }
   }
   if(s.phase==='sit'){
    const delta=goal-s.x;if(Math.abs(delta)>.1){s.x+=Math.sign(delta)*Math.min(Math.abs(delta),Math.max(40,max/3)*.75/1000*dt);go.style.transform=`translateX(${s.x}px)`}
    const frame=reduced?7:Math.min(7,Math.floor((t-s.start)/105));flip.style.backgroundPosition=`${frame*100/7}% 0`;
    if((reduced||t-s.start>=840)&&Math.abs(goal-s.x)<=.1){track.classList.remove('mip-sitting');track.classList.add('mip-still');flip.style.transform=s.mirror?'scaleX(-1)':'none';flip.style.removeProperty('background-position');track.dataset.mipState='seated';go.style.removeProperty('transform');s.phase='done';s.release(true);return}
   }
   s.raf=requestAnimationFrame(tick);
  };
  s.raf=requestAnimationFrame(tick);return s.promise;
 }
 function still(el,on=true){const list=tracks(el);if(!on){list.forEach(reset);return Promise.resolve(false)}return Promise.all(list.map(finish)).then(a=>a.every(Boolean))}
 root.MipLoader={html,mount,still,ready};ready();
})(globalThis);
