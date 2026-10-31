/* v93 · Work-in-progress item card at the forge.
   While the forge sub-map is open, a real item card (Card Studio equip frame) shows what is being made and how far along:
   ① หลอม (heat 40+) → ② ตีขึ้นรูป (shape 100) → ③ ชุบแข็ง, with heat / shape bars, the next step,
   art that changes with the stage (raw iron → glowing ingot → shaped blade → finished weapon), a heat glow and sparks. */
(function(root){'use strict';
const G=()=>typeof s!=='undefined'?s:null,V=()=>G()?.village;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let el=null,stamp='',prev=null,doneUntil=0,doneItem=null,design=null,designAt=0;
function box(){if(el)return el;setTimeout(()=>{if(el){el.addEventListener('click',()=>fold());el.title='กดเพื่อซ่อน/แสดงการ์ดงาน';el.classList.toggle('sw-min',!shown)}},0);el=document.createElement('aside');el.id='smithWip';el.hidden=true;el.setAttribute('aria-live','polite');el.innerHTML='<div class="sw-head"><small>กำลังทำ</small><b></b></div><div class="sw-card"><div class="sw-face"></div><div class="sw-heat"></div><div class="sw-sparks"></div></div><div class="sw-bars"></div><ol class="sw-steps"></ol><p class="sw-next"></p>';document.body.appendChild(el);return el}
const atForge=()=>root.VillageTown?.getScene?.()==='place:forge'&&!root.VillageTown.host?.hidden;
const blocked=()=>!!document.querySelector('dialog[open]')||root.Cutscene?.isPlaying?.()||document.body.classList.contains('tactics-open')||!!document.querySelector('.ck-reveal');
function stage(w){if(!w.started)return 0;if(w.shape>=100)return 3;if(w.heat<40&&w.shape===0)return 1;return 2}
function art(w,r,st,finished){if(finished||st===0)return root.weaponImg?.(r.kind)||'assets/sword.webp';return w.shape>=50?'assets/wip-shaped.webp':'assets/wip-hot.webp'}
function quality(w){const v=V(),r=RECIPES[w.recipe];try{return Math.min(5,1+Math.floor((v.smith.level-1)/2)+Math.floor(stat('precision')/3)+(w.recipe==='tempered'?1:0))}catch{return 1}}
function cardHtml(w,r,st,finished){const S=root.CardStudio,base=S?.cardById('e-'+r.kind)||S?.cardById('e-sword');if(!base)return `<div class="sw-plain"><img src="${esc(art(w,r,st,finished))}" alt=""></div>`;
 if(!design||performance.now()-designAt>15000){design=S.design();designAt=performance.now()}
 const c=JSON.parse(JSON.stringify(base));c.id='wip-'+w.recipe;c.name=finished?r.name:r.name;c.type=finished?'เสร็จแล้ว':'กำลังทำ';c.level=quality(w);c.maxLevel=5;
 const pct=finished?100:st===0?0:st===1?Math.round(w.heat/40*25):st===2?25+Math.round(w.shape*.6):90;
 c.main={value:finished?'✓':pct+'%',label:finished?'ได้รับการ์ดอุปกรณ์':['ยังไม่เริ่ม','ขั้น 1/3 · หลอม','ขั้น 2/3 · ตีขึ้นรูป','ขั้น 3/3 · ชุบแข็ง'][st]};
 c.effects=finished?['เพิ่มเข้ากระเป๋าแล้ว · สวมหรือขายได้']:[st===0?'วัตถุดิบ: '+materialCost(r):'ความร้อน '+w.heat+' · ขึ้นรูป '+w.shape+'/100'];
 c.art={src:art(w,r,st,finished),fit:'cover',x:0,y:0,scale:1,rot:0,flipX:false};
 return S.cardHTML(c,design)}
function sparks(n,cls){const host=el.querySelector('.sw-sparks');for(let i=0;i<n;i++){const p=document.createElement('i');if(cls)p.className=cls;p.style.setProperty('--x',(Math.random()*2-1)*90+'px');p.style.setProperty('--y',-(40+Math.random()*90)+'px');p.style.left=(40+Math.random()*20)+'%';p.style.animationDelay=(Math.random()*.15)+'s';host.appendChild(p);setTimeout(()=>p.remove(),900)}}
/* ---------- v98.20 · juice: every step of progress answers with light, particles, a floating number and a sound; the station in the room glows too ---------- */
const snd=(k,v)=>{try{root.BattlePolish?.sound?.(k,v)}catch(e){}};
const toFrame=m=>{try{root.VillageTown?.marketFrame?.contentWindow?.postMessage({source:'project-a-game',type:'wip-fx',...m},location.origin)}catch(e){}};
function put(tag,cls,txt,ms){const host=el.querySelector('.sw-card');const n=document.createElement(tag);n.className=cls;if(txt)n.textContent=txt;host.appendChild(n);setTimeout(()=>n.remove(),ms||1100);return n}
const float=(txt,cls)=>put('b','sw-float '+cls,txt,1200),ring=(big)=>put('u','sw-ring'+(big?' big':''),'',900),banner=txt=>put('em','sw-banner',txt,1500),steam=()=>{for(let i=0;i<5;i++){const n=put('s','sw-steam');n.style.setProperty('--x',(Math.random()*2-1)*50+'px');n.style.left=(25+Math.random()*50)+'%';n.style.animationDelay=(i*.08)+'s'}};
function juice(kind,amt){if(!el)return;const cls={hit:'sw-hit',heat:'sw-heatup',done:'sw-flash',quench:'sw-quench'}[kind];if(cls){el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls)}
 if(kind==='hit'){sparks(Math.min(20,7+Math.round(amt/2)));float('+'+amt+' ⚒','hit');ring();snd('hammer',.55);setTimeout(()=>snd('block',.45),70)}
 else if(kind==='heat'){sparks(7,'ember');float('+'+amt+' ♨','heat');snd('cast',.22)}
 else if(kind==='quench'){steam();float('ชุบแข็ง!','quench');snd('ice',.4);snd('lightning',.12)}
 else if(kind==='done'){sparks(42);ring();ring(true);banner('เสร็จแล้ว!');snd('critical',.55);setTimeout(()=>root.BattlePolish?.victory?.(true),180)}
 toFrame({kind,amt})}
/* ---------- v98.20 · the card sits beside the work station (never over it or the hero); click it / the pad button to fold it to a small chip ---------- */
let layout=null,layoutAt=0,shown=(()=>{try{return localStorage.getItem('projectA.wipShown')!=='0'}catch{return true}})();
function fold(on){shown=on===undefined?!shown:!!on;try{localStorage.setItem('projectA.wipShown',shown?'1':'0')}catch{}if(el)el.classList.toggle('sw-min',!shown);dock()}
addEventListener('message',e=>{const m=e.data;if(!m||m.source!=='project-a-place')return;if(m.type==='layout'){layout=m;layoutAt=performance.now();dock()}else if(m.type==='wip-toggle')fold()});
const hit=(a,b,m)=>a.x<b.x+b.w+m&&a.x+a.w+m>b.x&&a.y<b.y+b.h+m&&a.y+a.h+m>b.y;
function dock(){if(!el||el.hidden)return;const fr=root.VillageTown?.marketFrame;
 if(!layout||!fr||performance.now()-layoutAt>3500){el.classList.remove('sw-docked');el.style.left=el.style.top='';el.style.right='';return}
 const r=fr.getBoundingClientRect(),kx=r.width/layout.w,ky=r.height/layout.h,cv=b=>({x:r.left+b.x*kx,y:r.top+b.y*ky,w:b.w*kx,h:b.h*ky}),S=cv(layout.station),H=cv(layout.hero),cw=el.offsetWidth,ch=el.offsetHeight,M=14;
 const avoid=[...document.querySelectorAll('.stk-head')].map(h=>h.parentElement.getBoundingClientRect()).filter(b=>b.width>0).map(b=>({x:b.x,y:b.y,w:b.width,h:b.height}));   // the quest tracker
 const area={l:r.left+8,t:r.top+64,r:r.right-8,b:r.bottom-8},cx=S.x+S.w/2-cw/2,cy=S.y+S.h/2-ch/2;
 const cands=[[S.x+S.w+M,S.y],[S.x-cw-M,S.y],[S.x+S.w+M,cy],[S.x-cw-M,cy],[cx,S.y-ch-M],[cx,S.y+S.h+M],[S.x+S.w+M,S.y+S.h-ch],[S.x-cw-M,S.y+S.h-ch]];
 let best=null,bs=1e9;for(const [x0,y0] of cands){const x=Math.max(area.l,Math.min(area.r-cw,x0)),y=Math.max(area.t,Math.min(area.b-ch,y0)),c={x,y,w:cw,h:ch},bad=(hit(c,S,10)?2:0)+(hit(c,H,14)?2:0)+(avoid.some(a=>hit(c,a,6))?1:0),d=Math.hypot(x+cw/2-(S.x+S.w/2),y+ch/2-(S.y+S.h/2))+Math.abs(x-x0)+Math.abs(y-y0);if(bad===0&&d<bs){bs=d;best=c}}
 if(!best){el.classList.remove('sw-docked');el.style.left=el.style.top='';el.style.right='';return}   // no free spot: the default corner
 el.classList.add('sw-docked');el.style.right='auto';el.style.left=Math.round(best.x)+'px';el.style.top=Math.round(best.y)+'px'}
function draw(){const v=V();if(!v){return}const show=atForge()&&!blocked();box();if(!show){el.hidden=true;return}
 const w=v.work,r=RECIPES[w.recipe]||RECIPES.sword;
 // finished detection: a started piece that disappears while a new item lands in the bag
 if(prev&&prev.started&&prev.shape>=100&&!w.started&&G().inventory.length>prev.inv){doneUntil=performance.now()+4200;doneItem=prev.recipe;juice('done')}
 if(prev&&w.started&&w.shape>prev.shape)juice('hit',w.shape-prev.shape);
 if(prev&&w.heat>prev.heat){juice('heat',w.heat-prev.heat);if(prev.heat<40&&w.heat>=40){banner('พร้อมตี!');snd('heal',.4)}}
 if(prev&&w.started&&prev.shape>=100&&w.shape>=100&&w.heat<prev.heat)juice('quench');
 prev={started:w.started,shape:w.shape,heat:w.heat,recipe:w.recipe,inv:G().inventory.length};
 const finished=performance.now()<doneUntil,fr=finished?RECIPES[doneItem]||r:r,fw=finished?{...w,recipe:doneItem,started:true,shape:100,heat:0}:w,st=finished?3:stage(w);
 const key=JSON.stringify([fw.recipe,fw.started,fw.heat,fw.shape,finished,v.smith.level]);el.hidden=false;if(key===stamp)return;stamp=key;
 el.querySelector('.sw-head b').textContent=fr.name;el.querySelector('.sw-head small').textContent=finished?'เสร็จแล้ว!':st===0?'แบบงานที่เลือก':'กำลังทำ';
 el.querySelector('.sw-face').innerHTML=cardHtml(fw,fr,st,finished);root.CardStudio?.fit?.(el.querySelector('.sw-card'));
 el.querySelector('.sw-heat').style.opacity=finished?0:Math.min(.85,fw.heat/100);
 const bar=(label,val,cls,mark)=>`<div class="sw-bar ${cls}"><span>${label}</span><i><b style="width:${Math.max(0,Math.min(100,val))}%"></b>${mark?`<em style="left:${mark}%"></em>`:''}</i><small>${Math.round(val)}</small></div>`;
 el.querySelector('.sw-bars').innerHTML=finished?'':bar('♨ ความร้อน',fw.heat,'heat',40)+bar('⚒ ขึ้นรูป',fw.shape,'shape');
 const steps=[['หลอมให้ร้อน 40+',fw.heat>=40||fw.shape>0],['ตีขึ้นรูปให้ครบ 100',fw.shape>=100],['ชุบแข็งที่ถังน้ำ',finished]];
 const now=steps.findIndex(x=>!x[1]);
 el.querySelector('.sw-steps').innerHTML=steps.map(([t,ok],i)=>`<li class="${ok?'ok':i===now?'now':''}">${ok?'✓':i+1} ${t}</li>`).join('');
 const lack=!fw.started&&Object.entries(fr.cost||{}).filter(([k,n])=>(v.materials[k]||0)<n).map(([k])=>MATERIALS[k]?.name).filter(Boolean);
 el.querySelector('.sw-next').textContent=finished?'ดูได้ในกระเป๋า':st===0?(lack.length?'ขาด '+lack.join(' · ')+' · ซื้อที่ตลาด':'เดินไปเตาหลอมเพื่อเริ่มงาน (หักวัตถุดิบตอนเริ่ม)'):st===1||fw.heat<40&&fw.shape<100?'ไปเตาหลอม · ร้อน 40 ขึ้นไปตีได้เต็มแรง':st===2?'ไปทั่งตีเหล็ก · ตีจนครบ 100 (เหล็กจะเย็นลงทุกครั้ง)':'ไปถังชุบ · ชุบแข็งเพื่อรับการ์ดอุปกรณ์'}
setInterval(()=>{try{draw();dock()}catch(e){console.warn('[smith-wip]',e)}},400);
root.SmithWip={draw};
})(globalThis);
