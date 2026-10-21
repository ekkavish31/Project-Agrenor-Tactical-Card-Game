// Compact hand summaries; the full Card Studio design appears in a viewport-clamped preview.
(function(){
 const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function compact(id,name,summary,fallback=''){let c=window.CardStudio?.cardById(id),a=c?.art||{},src=a.data||a.src||fallback,style=`object-fit:${a.fit||'cover'};transform:translate(${+a.x||0}%,${+a.y||0}%) rotate(${+a.rot||0}deg) scale(${(a.scale||1)*(a.flipX?-1:1)},${a.scale||1})`;
  return `<strong class="hc-name">${esc(c?.name||name)}</strong><span class="hc-art">${src?`<img src="${esc(src)}" alt="" draggable="false" style="${style}">`:'✦'}</span><span class="hc-summary">${esc(summary)}</span>`}
 let popup=null,active=null,timer=null,suppress=null;
 function hide(){clearTimeout(timer);if(popup)popup.hidden=true;if(active)active.removeAttribute('aria-describedby');active=null}
 function show(b){if(!b?.isConnected)return;let id=b.dataset.fullCard,html=window.CardStudio?.renderCard(id,{mini:false,fallbackArt:b.dataset.fallbackArt});if(!html)return;
  if(!popup){popup=document.createElement('div');popup.id='handFullCard';popup.setAttribute('role','tooltip');document.body.appendChild(popup)}hide();active=b;popup.innerHTML=html;popup.hidden=false;b.setAttribute('aria-describedby',popup.id);
  let w=Math.min(228,window.innerWidth-20,(window.innerHeight-30)*750/1101);popup.style.width=w+'px';let h=w*1101/750,r=b.getBoundingClientRect(),left=Math.max(10,Math.min(window.innerWidth-w-10,r.left+r.width/2-w/2)),top=r.top-h-12;if(top<10)top=Math.min(window.innerHeight-h-10,r.bottom+12);popup.style.left=left+'px';popup.style.top=Math.max(10,top)+'px';window.CardStudio?.fit(popup)
 }
 const card=e=>e.target.closest?.('#tacticsLayer [data-full-card]');
 document.addEventListener('pointerover',e=>{if(e.pointerType==='touch')return;let b=card(e);if(b&&b!==active)show(b);else if(!b)hide()});
 document.addEventListener('pointerout',e=>{let b=card(e);if(b&&!b.contains(e.relatedTarget))hide()});
 document.addEventListener('focusin',e=>{let b=card(e);if(b)show(b)});document.addEventListener('focusout',hide);
 document.addEventListener('pointerdown',e=>{hide();let b=card(e);if(b&&e.pointerType==='touch'){timer=setTimeout(()=>{show(b);suppress=b},450)}});
 document.addEventListener('pointerup',e=>{clearTimeout(timer);if(e.pointerType==='touch'){hide();if(suppress)setTimeout(()=>suppress=null,800)}});document.addEventListener('pointercancel',()=>{hide();suppress=null});
 document.addEventListener('click',e=>{if(suppress){let b=suppress;suppress=null;if(b.contains(e.target)){e.preventDefault();e.stopImmediatePropagation()}}hide()},true);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'||e.key==='Enter'||e.key===' ')hide()});document.addEventListener('scroll',hide,true);window.addEventListener('resize',hide);window.addEventListener('blur',hide);
 window.HandCards={compact,hide,show};
})();
