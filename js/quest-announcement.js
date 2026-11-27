/* Quest announcement + optional lesson/details share one acknowledgement.
   16 painted cells, row-major 4x4; no timer ever dismisses the card. */
(function(root){'use strict';
 const SRC='assets/ui/quest-gift-unroll.webp',COLS=4,ROWS=4,FRAME_MS=90,DURATION=FRAME_MS*16;
 // Alpha bounds measured on the source sheet. Align the centre, never resize
 // frames independently: box -> rolls -> long ribbon remains at one anchor.
 const CENTRES=[[222.5,120],[222,126.5],[221.5,118],[223,109.5],[220.5,115],[221,121.5],[222,126],[222,128.5],[222,127],[220.5,127],[219.5,126.5],[223.5,125],[223,128],[221,128],[222,128],[222.5,128]];
 const frameAt=ms=>Math.min(15,Math.max(0,Math.floor(ms/FRAME_MS)));
 function drawFrame(g,image,n,w,h){n=Math.max(0,Math.min(15,n|0));const fw=image.naturalWidth/COLS,fh=image.naturalHeight/ROWS,c=CENTRES[n];g.clearRect(0,0,w,h);g.drawImage(image,(n%4)*fw,Math.floor(n/4)*fh,fw,fh,w/2-c[0]/443.5*w,h/2-c[1]/221.75*h,w,h)}
 let sheet=null,load=null,current=null;const queue=[];
 function imageReady(){if(load)return load;load=new Promise(resolve=>{if(typeof root.Image!=='function'){resolve(null);return}const im=new root.Image();let ended=false,timer;const finish=ok=>{if(ended)return;ended=true;clearTimeout(timer);sheet=ok?im:null;resolve(sheet)};im.onload=()=>{const p=im.decode?im.decode():Promise.resolve();p.then(()=>finish(true),()=>finish(false))};im.onerror=()=>finish(false);timer=setTimeout(()=>finish(false),5000);im.src=SRC;if(im.complete&&im.naturalWidth)im.onload()});return load}
 function show(options={}){return new Promise(resolve=>{queue.push({options,resolve});pump()})}
 function pump(){if(current||!queue.length)return;const job=queue.shift();current=job;
  const o=job.options,d=document.createElement('section');d.id='questAnnouncement';d.tabIndex=-1;d.setAttribute('role','dialog');d.setAttribute('aria-modal','true');d.setAttribute('aria-labelledby','qaTitle');
  d.innerHTML='<div class="qa-group"><div class="qa-visual"><canvas aria-hidden="true"></canvas><h2 id="qaTitle" class="qa-title"></h2></div><div class="qa-card" hidden><small class="qa-kind"></small><h3></h3><ul></ul><div class="qa-nav" hidden><button type="button" class="qa-prev" aria-label="หน้าก่อนหน้า">◀ ก่อนหน้า</button><span class="qa-pg" aria-live="polite"></span><button type="button" class="qa-next" aria-label="หน้าถัดไป">ถัดไป ▶</button></div><button type="button" class="qa-go" disabled>เข้าใจแล้ว ▸</button></div></div>';
  const title=d.querySelector('.qa-title'),card=d.querySelector('.qa-card'),button=d.querySelector('.qa-go'),cv=d.querySelector('canvas'),group=d.querySelector('.qa-group'),lesson=o.lesson||null;
  if(o.titleHTML!=null)title.innerHTML=o.titleHTML;else title.textContent=o.title||'';
  d.querySelector('.qa-kind').textContent=lesson?'📘 บทเรียน':(o.kicker||'รายละเอียดเควส');d.querySelector('h3').textContent=lesson?.title||o.detailTitle||'';
  /* v98.1164 · a long lesson is split into PAGES (no scrollbar): items are packed into the card until it is full, never cutting one item; ◀ ▶ move between pages and only the LAST page shows the continue button */
  const items=[...(o.details||[]),...(lesson?.lines||[])].filter(Boolean),ul=d.querySelector('ul'),nav=d.querySelector('.qa-nav'),prev=d.querySelector('.qa-prev'),next=d.querySelector('.qa-next'),pgLbl=d.querySelector('.qa-pg');
  let pages=[items],page=0;const mk=t=>{const li=document.createElement('li');li.textContent=t;return li},setItems=a=>ul.replaceChildren(...a.map(mk));
  function renderPage(){setItems(pages[page]);const last=page>=pages.length-1;nav.hidden=pages.length<2;button.hidden=!last;prev.disabled=page===0;next.style.visibility=last?'hidden':'';pgLbl.textContent=(page+1)+' / '+pages.length;card.scrollTop=0}
  function paginate(){card.style.minHeight='';card.style.visibility='hidden';nav.hidden=false;button.hidden=false;
   const fits=()=>card.scrollHeight<=card.clientHeight+1,out=[];let cur=[];
   for(const t of items){cur.push(t);setItems(cur);if(!fits()&&cur.length>1){cur.pop();out.push(cur);cur=[t]}}out.push(cur);
   let hmax=0;if(out.length>1){for(const a of out){setItems(a);hmax=Math.max(hmax,card.getBoundingClientRect().height)}card.style.minHeight=Math.ceil(hmax)+'px'}
   pages=out;page=Math.min(page,pages.length-1);card.style.visibility='';renderPage()}
  function go(n){const k=Math.max(0,Math.min(pages.length-1,n));if(k===page)return;page=k;renderPage();(page>=pages.length-1?button:next).focus({preventScroll:true})}
  prev.onclick=()=>go(page-1);next.onclick=()=>go(page+1);
  const advance=()=>{if(page<pages.length-1)go(page+1);else if(!button.disabled)button.click()};
  const oldFocus=document.activeElement;let raf=0,closed=false,shown=false;
  const reduced=!!root.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  function layout(){const viewport=root.innerWidth||800,font=viewport<600?Math.min(30,Math.max(20,viewport*.05)):34,m=document.createElement('canvas').getContext('2d');if(m)m.font='700 '+font+'px VillageThai,system-ui';const tw=m?m.measureText(title.textContent||'').width:500,w=Math.min(viewport-32,1120,Math.max(560,tw/.7+48)),h=w/2,dpr=Math.min(2,root.devicePixelRatio||1);group.style.setProperty('--qa-width',w+'px');cv.width=Math.ceil(w*dpr);cv.height=Math.ceil(h*dpr);if(sheet)drawFrame(cv.getContext('2d'),sheet,shown?15:frameAt(performance.now()-(job.started||performance.now())),cv.width,cv.height);if(shown)paginate()}
  function reveal(fallback){if(closed)return;shown=true;if(fallback)d.classList.add('qa-fallback');title.classList.add('qa-visible');card.hidden=false;paginate();button.disabled=false;(page>=pages.length-1?button:next).focus({preventScroll:true})}
  function close(){if(closed||button.disabled)return;closed=true;cancelAnimationFrame(raf);root.removeEventListener('keydown',key,true);root.removeEventListener('resize',layout);d.remove();document.body.classList.remove('quest-announcement-open');if(oldFocus?.isConnected)oldFocus.focus?.({preventScroll:true});current=null;job.resolve();pump()}
  function key(e){if(e.key==='Tab'){e.preventDefault();(page>=pages.length-1?button:next).focus();return}if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();e.stopImmediatePropagation();if(!button.disabled)go(page+(e.key==='ArrowRight'?1:-1));return}if(['Escape',' ','Enter'].includes(e.key)){e.preventDefault();e.stopImmediatePropagation();if(!e.repeat&&!button.disabled)advance();return}e.preventDefault();e.stopImmediatePropagation()}
  button.onclick=close;root.addEventListener('keydown',key,true);root.addEventListener('resize',layout);document.body.classList.add('quest-announcement-open');document.body.appendChild(d);d.focus({preventScroll:true});layout();
  imageReady().then(im=>{if(closed)return;if(!im){reveal(true);return}job.started=performance.now();const draw=t=>{if(closed)return;const ms=reduced?DURATION:t-job.started;drawFrame(cv.getContext('2d'),im,frameAt(ms),cv.width,cv.height);if(ms>=DURATION)reveal(false);else raf=requestAnimationFrame(draw)};draw(job.started)});
 }
 if(typeof document!=='undefined')imageReady();
 const api={show,busy:()=>!!current,frameAt,drawFrame,FRAMES:16,DURATION,SRC,CENTRES};root.QuestAnnouncement=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(globalThis);
