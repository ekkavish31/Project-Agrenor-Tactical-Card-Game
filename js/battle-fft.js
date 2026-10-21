// v12: FFT-style battle HUD for full-screen fights.
// • Left: CT turn queue (who acts next, numbered, current one highlighted; A = on Auto).
// • Bottom-left: the acting unit (HP / stamina / CT, element, traits, ground) with Auto + End turn.
// • Bottom-right: the hovered unit, with a damage preview when an attack card is selected.
// • Top: the latest battle message. Commands stay as cards (hand at the bottom).
(function(){
const C=window.TacticsCore,$=id=>document.getElementById(id);
let hud=null,last='',portraits={},cropOverrides={};try{cropOverrides=JSON.parse(localStorage.getItem('project-a-ct-crops-v32')||'{}')}catch(e){}
const layer=()=>$('tacticsLayer'),on=()=>!!layer()&&!layer().hidden&&layer().classList.contains('fullbattle');
// CSS image windows preserve sharpness and also work when index.html is opened via file://.
const TEST_ALLIES={test0:'luna',test1:'bram',test2:'kier',test3:'mil'};
function portraitCardId(u){if(u.side==='enemy')return 'en-'+u.kind;if(u.id==='hero'||u.kind==='hero')return 'u-hero';let key=TEST_ALLIES[u.key]||u.key;return key?'u-'+key:null}
function portrait(u,face=false){let id=portraitCardId(u),def=id&&window.UNIT_CARD_ART?.[id],card=id&&window.CardStudio?.cardById(id),src=card?.art?.data||card?.art?.src||def?.src;
 if(!src)return `<span class="ct-portrait ${face?'fb-face':''}" role="img" aria-label="${esc(u.name)}" title="${esc(u.name)}"><span class="ct-missing">?</span></span>`;
 let installed=src===def?.src,crop=card?.art?.ctCrop||(installed?cropOverrides[id]||def.ctCrop:null)||[.5,.35,.62],size=installed?def.ctSize:null,cache=portraits[src];
 if(!size&&cache?.size)size=cache.size;
 if(!installed&&!cache){let entry=portraits[src]={},im=new Image();im.onload=()=>{entry.size=[im.naturalWidth,im.naturalHeight];last=''};im.onerror=()=>{entry.failed=true;last=''};im.src=src}
 if(cache?.failed&&def){src=def.src;size=def.ctSize;crop=def.ctCrop}
 let [w,h]=size||[1,1],cx=Number(crop[0]),cy=Number(crop[1]),extent=Number(crop[2]);if(![cx,cy,extent].every(Number.isFinite)||extent<=0){cx=.5;cy=.35;extent=.62}
 let side=Math.min(w,h)*Math.min(1,Math.max(.1,extent)),x=Math.max(0,Math.min(w-side,cx*w-side/2)),y=Math.max(0,Math.min(h-side,cy*h-side/2));
 let style='background-image:url('+JSON.stringify(src)+');background-size:'+(w/side*100)+'% '+(h/side*100)+'%;background-position:'+(w===side?50:x/(w-side)*100)+'% '+(h===side?50:y/(h-side)*100)+'%';
 return `<span class="ct-portrait ${face?'fb-face':''}" role="img" aria-label="${esc(u.name)}" title="${esc(u.name)}" data-card-id="${esc(id)}" data-crop-source="${esc(src)}" style="${esc(style)}"></span>`}
function bar(v,max,cls){let p=Math.max(0,Math.min(100,v/max*100));return `<span class="fb-bar ${cls}"><i style="width:${p}%"></i></span>`}
const esc=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function statusBadges(u){return Object.entries(u.statuses||{}).map(([id,v])=>{let d=C.STATUS[id];return d?`<span class="fb-status" style="color:${d.color}" title="เหลือ ${v.turns} เทิร์นของยูนิตนี้">${d.icon} ${d.name} ${v.turns}</span>`:''}).join('')}
function unitInfo(st,u,big){let T=C.TERRAIN?.[C.at(st.map,u.x,u.y)?.kind]||{},E=C.ELEMENT_NAMES?.[u.element||C.WEAPON_ELEMENT?.[u.weapon]]||'',tr=(u.traits||[]).map(k=>C.TRAITS[k]).join(' · '),lv=u.level?'Lv.'+u.level:'';
 return `${portrait(u,true)}<div class="fb-meta"><b>${esc(u.name)}</b> <small>${lv}${E?' · ธาตุ'+E:''}${C.dimensions(u).some(n=>n>1)?' · '+C.dimensions(u).join('×')+' ช่อง':''}${tr?' · '+tr:''}</small>
 <div class="fb-row"><span>HP</span>${bar(u.hp,u.maxHp,'hp')}<em>${u.hp}/${u.maxHp}</em></div>${u.stamina!=null&&u.side==='ally'?`<div class="fb-row"><span>ϟ</span>${bar(u.stamina,100,'st')}<em>${Math.round(u.stamina)}</em></div>`:''}
 <div class="fb-row"><span>CT</span>${bar(Math.min(100,u.ct||0),100,'ct')}<em>${Math.round(u.ct||0)}</em></div><small class="fb-ground">ยืนบน${esc(T.name||'')}${T.note?' · '+esc(T.note):''}${u.guard?' · เกราะ '+u.guard:''}</small><div class="fb-statuses">${u.casting?`<span class="fb-status">✦ ${esc(u.casting.name)} · รอ CT ถัดไป</span>`:''}${statusBadges(u)}${u.hp<=0&&u.downTurns?`<span class="fb-status">สลบ ${u.downTurns} CT${u.side==='ally'?' · ยืนติดแล้วคลิกเพื่อช่วยฟื้น':''}</span>`:''}</div></div>`}
function render(){if(!on()){if(hud)hud.hidden=true;return}let L=window.TacticsLab,st=L?.getState();if(!st)return;if(!hud)build();hud.hidden=false;
 let q=C.queue(st,10),act=st.active||st.hero,hv=L.hover?.(),hu=hv?(C.unitAt(st,hv.x,hv.y)||st.units.find(u=>!u.removed&&!u.fled&&u.hp<=0&&C.covers(u,hv.x,hv.y))):null,sel=L.selected?.(),locked=L.isLocked(),
  sig=JSON.stringify([q.map(u=>u.id+u.hp+(u.auto?1:0)+JSON.stringify(u.statuses||{})+(u.downTurns??'')),act?.id,act?.hp,act?.stamina,act?.ct,act?.guard,act?.statuses,st.units.map(u=>[u.id,u.casting?.name]),hu?.statuses,hu?.id,hu?.hp,sel,locked,st.phase,st.outcome,document.querySelector('#battleLog li')?.textContent,Object.keys(portraits).length,st.hero?.x,st.hero?.y]);
 if(sig===last)return;last=sig;const releasing=(u,i)=>u.casting&&!(i===0&&u===act)&&q.findIndex((x,j)=>x.id===u.id&&!(j===0&&x===act))===i;
 hud.querySelector('.fb-queue').innerHTML=`<small>ลำดับ</small>`+q.map((u,i)=>`<div class="fb-q ${u.side} ${i===0?'now':''}" data-uid="${u.id}" title="${esc(u.name)} · ความเร็ว ${C.speedOf(u)}${u.side==='ally'&&u.id!=='hero'?' · คลิกเพื่อสลับ Auto':''}"><span>${i+1}</span>${portrait(u)}${releasing(u,i)?'<em class="fb-release">✦ ปล่อยเวท</em>':''}${u.auto?'<b>A</b>':''}</div>`).join('');
 let mine=act&&act.side==='ally'&&st.phase==='player';
 hud.querySelector('.fb-unit').innerHTML=act?unitInfo(st,act)+`<div class="fb-btns">${act.id!=='hero'&&act.side==='ally'?`<button data-fb="auto" ${locked||!mine?'disabled':''} title="ให้ AI เล่นตัวนี้แทนจนกว่าจะปิด">${act.auto?'Auto เปิด':'Auto'}</button>`:''}<button class="primary" data-fb="end" ${locked||!mine||st.outcome?'disabled':''}>จบเทิร์น ⏎</button></div>`:'';
 hud.querySelector('.fb-unit').classList.toggle('enemy-turn',!!act&&act.side==='enemy');
 let tgt=hud.querySelector('.fb-target');if(hu&&hu!==act){let pv='';if(typeof sel==='number'&&hu.hp>0&&hu.side==='enemy'&&st.deck){let p=C.previewCard?.(st,sel,hu);if(p){let why=p.reason;pv=`<div class="fb-dmg ${why?'no':''}"><b>${p.damage}</b><small>${why?esc(why):'HP '+p.hpBefore+' → <b>'+p.hpAfter+'</b>'+(p.hpAfter<=0?' (สลบ)':'')+' · คริ '+p.critDamage+' → '+p.hpAfterCrit+'<br>โดน '+p.hit+'% · คริ '+p.crit+'% · '+p.angle+(p.cast?' · ออกผลทันที แล้วชาร์จหลังร่าย (CT −40)':'')+(p.notes.length?' · '+esc(p.notes.join(' · ')):'')}</small></div>`}}
  tgt.innerHTML=unitInfo(st,hu)+pv;tgt.hidden=false;tgt.classList.toggle('enemy',hu.side==='enemy')}else tgt.hidden=true;
 hud.querySelector('.fb-ticker').textContent=document.querySelector('#battleLog li')?.textContent||''}
function build(){hud=document.createElement('div');hud.id='fftHud';hud.innerHTML='<div class="fb-queue"></div><div class="fb-unit"></div><div class="fb-target" hidden></div><div class="fb-ticker"></div>';layer().appendChild(hud);
 hud.addEventListener('click',e=>{let L=window.TacticsLab,st=L.getState(),b=e.target.closest('[data-fb]');
  if(b?.dataset.fb==='end'){L.endTurn();return}
  if(b?.dataset.fb==='auto'){let u=st.active;if(!u||u.id==='hero')return;u.auto=true;st.phase='ai';L.runQueue(false);return}
  let q=e.target.closest('.fb-q.ally');if(q&&!L.isLocked()){let u=st.units.find(x=>x.id===q.dataset.uid);if(u&&u.id!=='hero'&&u!==st.active){u.auto=!u.auto;last=''}}})}
document.addEventListener('keydown',e=>{if(e.defaultPrevented||e.target.closest?.('button,input,select,textarea,summary,a,dialog,[contenteditable=true]'))return;if(e.key==='Enter'&&on()&&!window.TacticsLab?.isLocked()){let b=hud?.querySelector('[data-fb=end]');if(b&&!b.disabled){e.preventDefault();window.TacticsLab.endTurn()}}});
setInterval(render,120);
function importCrops(data){if(!data||typeof data!=='object'||Array.isArray(data))throw Error('ไฟล์ครอปไม่ถูกต้อง');let next={...cropOverrides};for(let [id,crop]of Object.entries(data)){if(!window.UNIT_CARD_ART?.[id]||!Array.isArray(crop)||crop.length!==3||!crop.every(Number.isFinite)||crop[0]<0||crop[0]>1||crop[1]<0||crop[1]>1||crop[2]<.1||crop[2]>1)throw Error('ค่าครอปไม่ถูกต้อง: '+id);next[id]=[...crop]}localStorage.setItem('project-a-ct-crops-v32',JSON.stringify(next));cropOverrides=next;last='';render();return Object.keys(data).length}
window.FFTHud={render,portrait,portraitCardId,importCrops,reset:()=>{last=''}};
})();
