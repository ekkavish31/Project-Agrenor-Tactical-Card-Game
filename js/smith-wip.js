/* v93 · Work-in-progress item card at the forge.
   While the forge sub-map is open, a real item card (Card Studio equip frame) shows what is being made and how far along:
   ① หลอม (heat 40+) → ② ตีขึ้นรูป (shape 100) → ③ ชุบแข็ง, with heat / shape bars, the next step,
   art that changes with the stage (raw iron → glowing ingot → shaped blade → finished weapon), a heat glow and sparks. */
(function(root){'use strict';
const G=()=>typeof s!=='undefined'?s:null,V=()=>G()?.village;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let el=null,stamp='',prev=null,doneUntil=0,doneItem=null,design=null,designAt=0;
function box(){if(el)return el;el=document.createElement('aside');el.id='smithWip';el.hidden=true;el.setAttribute('aria-live','polite');el.innerHTML='<div class="sw-head"><small>กำลังทำ</small><b></b></div><div class="sw-card"><div class="sw-face"></div><div class="sw-heat"></div><div class="sw-sparks"></div></div><div class="sw-bars"></div><ol class="sw-steps"></ol><p class="sw-next"></p>';document.body.appendChild(el);return el}
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
function sparks(n){const host=el.querySelector('.sw-sparks');for(let i=0;i<n;i++){const p=document.createElement('i');p.style.setProperty('--x',(Math.random()*2-1)*90+'px');p.style.setProperty('--y',-(40+Math.random()*90)+'px');p.style.left=(40+Math.random()*20)+'%';p.style.animationDelay=(Math.random()*.15)+'s';host.appendChild(p);setTimeout(()=>p.remove(),900)}}
function draw(){const v=V();if(!v){return}const show=atForge()&&!blocked();box();if(!show){el.hidden=true;return}
 const w=v.work,r=RECIPES[w.recipe]||RECIPES.sword;
 // finished detection: a started piece that disappears while a new item lands in the bag
 if(prev&&prev.started&&prev.shape>=100&&!w.started&&G().inventory.length>prev.inv){doneUntil=performance.now()+4200;doneItem=prev.recipe;el.classList.remove('sw-flash');void el.offsetWidth;el.classList.add('sw-flash');sparks(26)}
 if(prev&&w.started&&w.shape>prev.shape)sparks(Math.min(18,6+Math.round((w.shape-prev.shape)/3)));
 if(prev&&w.heat>prev.heat){el.classList.remove('sw-heatup');void el.offsetWidth;el.classList.add('sw-heatup')}
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
setInterval(()=>{try{draw()}catch(e){console.warn('[smith-wip]',e)}},400);
root.SmithWip={draw};
})(globalThis);
