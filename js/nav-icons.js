// v09: top-right menu uses one consistent icon pack (code-drawn SVG, gold on dark) instead of cropped scene pictures.
(function(){
const I={
 map:'<path d="M3 6.5l6-2.3 6 2.3 6-2.3v13.6l-6 2.3-6-2.3-6 2.3z" class="fill"/><path d="M9 4.2v13.6M15 6.5v13.6"/><path d="M5.5 15.5c1.8-.6 2.6-3.2 5-2.6s3 2 6.6-2.4" class="dash"/><path d="M17.2 8.2l1.6 1.6m0-1.6l-1.6 1.6" class="hot"/>',
 bag:'<path d="M8.5 7.5V6a3.5 3.5 0 017 0v1.5"/><rect x="4.5" y="7.5" width="15" height="13" rx="3.2" class="fill"/><path d="M4.5 12.5h15"/><rect x="10" y="10.8" width="4" height="3.6" rx=".8" class="hot"/>',
 upgrade:'<rect x="5.5" y="3" width="13" height="18" rx="2.2" class="fill"/><path d="M12 17V8.5M8.6 11.8L12 8.4l3.4 3.4" class="hot"/><path d="M19.5 3.2l.6 1.3 1.3.6-1.3.6-.6 1.3-.6-1.3-1.3-.6 1.3-.6z" class="spark"/>',
 edit:'<rect x="3.5" y="3" width="11.5" height="17" rx="2" class="fill"/><path d="M6.5 7h5.5M6.5 10h3.5"/><path d="M20.4 7.6l-8 8-3 .9.9-3 8-8a1.5 1.5 0 012.1 2.1z" class="hot"/>',
 settings:'<circle cx="12" cy="12" r="7.5" class="fill"/><path d="M12 2.8v3M12 18.2v3M2.8 12h3M18.2 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M5.5 18.5l2.1-2.1M16.4 7.6l2.1-2.1" class="hot"/><circle cx="12" cy="12" r="2.8" class="solid"/>',
 editor:'<rect x="3" y="4" width="12" height="16" rx="2" class="fill"/><path d="M6 8h6M6 11h4"/><path d="M20.4 8.6l-6.6 6.6-2.6.8.8-2.6 6.6-6.6a1.3 1.3 0 011.8 1.8z" class="hot"/><circle cx="18.5" cy="18.5" r="2.2" class="hot"/>',
 develop:'<path d="M15 4.3a4.3 4.3 0 00-5.6 5.6L3.8 15.5a1.8 1.8 0 002.6 2.6l5.6-5.6a4.3 4.3 0 005.6-5.6l-2.6 2.6-2.3-.5-.5-2.3z" class="fill"/><circle cx="18" cy="17.5" r="2.6" class="hot"/><path d="M18 13.6v1.3M18 20.1v1.3M14.1 17.5h1.3M20.6 17.5h1.3" class="hot"/>',
 motionOn:'<circle cx="12" cy="12" r="8.6" class="fill"/><path d="M10 8.3l5.6 3.7-5.6 3.7z" class="solid"/><path d="M3 7.5c-1 3-1 6 0 9M21 7.5c1 3 1 6 0 9" class="dash"/>',
 motionOff:'<circle cx="12" cy="12" r="8.6" class="fill"/><path d="M9.6 8.4v7.2M14.4 8.4v7.2" class="hot"/>',
 fullscreen:'<rect x="5" y="6" width="14" height="12" rx="1.5" class="fill"/><path d="M3.5 9V4.5H8M16 4.5h4.5V9M20.5 15v4.5H16M8 19.5H3.5V15" class="hot"/>',
 fullscreenExit:'<rect x="5" y="6" width="14" height="12" rx="1.5" class="fill"/><path d="M8.5 4v4.5H4M20 8.5h-4.5V4M15.5 20v-4.5H20M4 15.5h4.5V20" class="hot"/>'};
const svg=k=>`<svg class="nav-ico" viewBox="0 0 24 24" aria-hidden="true">${I[k]}</svg>`;
// v12: a picture from assets/icons/menu can replace the drawn icon (chosen in Editor → ไอคอนเมนู)
/* v98.16 · picture icons are the default; a choice saved in Editor → ไอคอนเมนู wins, and '-' there means the drawn icon */
const DEFAULT_PICS={map:'map',bag:'bag',upgrade:'deck',settings:'settings',editor:'quest'};
const MENU_KEY='menu-icons-v1',pick=id=>{let v;try{v=(JSON.parse(localStorage.getItem(MENU_KEY))||{})[id]}catch(e){}if(v==='-')return '';return v||DEFAULT_PICS[id]||''};
const icon=(id,k)=>{let p=pick(id);return p?`<img class="nav-img" src="assets/icons/menu/${p}.webp" alt="">`:svg(k)};
const key=id=>id==='motion'?(typeof reduced!=='undefined'&&reduced?'motionOff':'motionOn'):id==='fullscreen'?(document.fullscreenElement?'fullscreenExit':'fullscreen'):id;
function paint(){document.querySelectorAll('.header-actions .illustrated-nav').forEach(b=>{let id=b.id==='motion'?'motion':b.id.replace(/^nav-/,'');if(!I[key(id)])return;let old=b.querySelector('img,svg');if(old)old.outerHTML=icon(id,key(id));else b.insertAdjacentHTML('afterbegin',icon(id,key(id)));b.classList.add('icon-nav');b.classList.toggle('has-img',!!pick(id));if(id==='motion'){let s=b.querySelector('span');if(s)s.textContent='แอนิเมชัน'}})}
if(typeof navArtwork==='function'){const base=navArtwork;navArtwork=function(){base();paint()}}
if(typeof syncMotionButton==='function'){const base=syncMotionButton;syncMotionButton=function(){base();paint()}}
document.addEventListener('fullscreenchange',()=>requestAnimationFrame(paint));
const mo=new MutationObserver(()=>{if(document.querySelector('.header-actions .illustrated-nav img:not(.nav-img)'))paint()});
window.addEventListener('storage',e=>{if(e.key===MENU_KEY)paint()});window.NavIcons={paint,MENU_KEY};
let h=document.querySelector('.header-actions');if(h)mo.observe(h,{childList:true,subtree:true});
paint();
})();
