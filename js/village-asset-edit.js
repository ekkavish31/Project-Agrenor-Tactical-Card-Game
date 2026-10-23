/* v38i · Village editor: edit the small assets that make up each place (hedges, flowers, crates, lamps, stalls…),
   the adventure gates, and the scale / tilt of the big building art so it sits on the 2:1 iso grid.
   Edits are stored in the village layout (TownUX snapshot "assets"), so undo, export/import and reset include them.
   Data: edit[key] = {du,dv,s,r,f,layer,kind,hide} · added[] = {id,owner,du,dv,kind} · buildings[id] = {sx,sy,kx,ky,dx,dy} */
(function(){'use strict';
const STORE='project-a-village-editor-v67',UX=window.TownUX,copy=x=>JSON.parse(JSON.stringify(x)),num=(v,a,b,d)=>Math.max(a,Math.min(b,Number.isFinite(+v)?+v:d));
let data={edit:{},added:[],buildings:{}},sel=null,frame=[],drag=null,ckPending=false,guides=true;
const empty=()=>({edit:{},added:[],buildings:{}});
function set(v){data=empty();if(v&&typeof v==='object'){if(v.edit&&typeof v.edit==='object')data.edit=copy(v.edit);if(Array.isArray(v.added))data.added=copy(v.added).filter(a=>a&&a.id&&a.owner&&a.kind);if(v.buildings&&typeof v.buildings==='object')data.buildings=copy(v.buildings)}if(sel&&sel.type==='item'&&!data.edit[sel.key]&&!data.added.some(a=>a.id===sel.key)&&!frame.some(e=>e.key===sel.key))sel=null;render()}
function get(){const out={};if(Object.keys(data.edit).length)out.edit=copy(data.edit);if(data.added.length)out.added=copy(data.added);if(Object.keys(data.buildings).length)out.buildings=copy(data.buildings);return Object.keys(out).length?out:undefined}

/* ---------- what can be placed / swapped in ---------- */
const KINDS={};
const kind=(id,label,group,draw)=>KINDS[id]={label,group,draw};
const DECOR_W={'fence-picket':['รั้วไม้',110],'stone-wall-low':['กำแพงหินเตี้ย',110],'hedge-row':['แนวพุ่มไม้',120],'flower-bed':['แปลงดอกไม้',118],'flower-box':['กระบะดอกไม้',90],'stepping-stones':['หินทางเดิน',130],'pond-lilies':['บ่อบัว',220],'bench':['ม้านั่ง',110],'market-stall-red':['แผงตลาดแดง',230],'market-stall-blue':['แผงตลาดน้ำเงิน',230],'banner-pole':['เสาธง',75],'woodpile':['กองฟืน',115],'signpost':['ป้ายบอกทาง',70],'well':['บ่อน้ำ',120],'cart':['เกวียน',150],'hay':['กองฟาง',95]};
for(const[n,[label,w]]of Object.entries(DECOR_W))kind('decor:'+n,label,'ของประดับ',p=>decor(n,p,w,false));
['รั้วหิน (ชุดเก่า)','รั้วไม้ (ชุดเก่า)','พุ่มไม้','กระถางต้นไม้','ของตั้งหน้าอาคาร','โต๊ะ/ถัง','ลังไม้','ต้นไม้'].forEach((label,i)=>kind('prop:'+i,label,'ของชุดเดิม',p=>i===7?propSprite(7,p,110,130):i===2?propSprite(2,{x:p.x,y:p.y+6},78,72):i===3?propSprite(3,{x:p.x,y:p.y+6},64,78):propSprite(i,p,92)));
kind('bush','พุ่มไม้เล็ก','ต้นไม้/ดอกไม้',p=>{if(bushSmall.naturalWidth)TownArt.draw(g,bushSmall,null,[p.x-38,p.y-70,76,75],project(hero.u,hero.v))});
for(const i of[1,2,3])kind('flowers:'+i,['','ดอกไม้ชุด 1','ดอกไม้ชุด 2','สมุนไพร'][i],'ต้นไม้/ดอกไม้',p=>TownArt.detail(g,i,{x:p.x,y:p.y+10},58));
kind('lamp','โคมไฟถนน','ของประดับ',p=>lamp(p));
const GATES={mine:'เหมือง',frost:'น้ำแข็ง',forest:'ป่า',coast:'ชายฝั่ง',ruins:'ซากโบราณ',swamp:'บึง'},gateImg={};
for(const[a,label]of Object.entries(GATES)){const im=new Image();im.onload=()=>gateImg[a]=im;im.src='assets/village-town/decor/gate-'+a+'.png';kind('gate:'+a,'ประตู'+label,'ประตูผจญภัย',p=>{const m=gateImg[a];if(!m)return;const w=300,h=w*m.naturalHeight/m.naturalWidth;TownArt.draw(g,m,null,[p.x-w/2,p.y-h*.9+8,w,h],null)})}

/* ---------- owners: a place (estate frame, mirrored when it faces SE), the plaza, or an exit gate ---------- */
function ownerName(owner){if(owner.startsWith('exit:'))return'ประตู'+(Village25D.getExits()[+owner.slice(5)]?.name||'');return locations.find(o=>o.id===owner)?.name||owner}
function baseOf(owner){if(owner.startsWith('exit:')){const e=Village25D.getExits()[+owner.slice(5)];return e?{u:e.u,v:e.v,mirror:false,cx:0,front:1.5}:null}
 const o=locations.find(x=>x.id===owner);if(!o)return null;const e=estate(o),c=center(o);if(!e)return{u:c.u,v:c.v,mirror:false,cx:0,front:7.2};return{u:e.u,v:e.v,mirror:o.facing==='SE',cx:project(c.u,c.v).x,front:e.front-1}}
const toScreen=(b,du,dv)=>{const p=project(b.u+du,b.v+dv);return b.mirror?{x:b.cx*2-p.x,y:p.y}:p};
const screenDelta=(b,du,dv)=>{const x=(du-dv)*28;return{x:b?.mirror?-x:x,y:(du+dv)*14}};
const canonDelta=(b,dx,dy)=>{if(b?.mirror)dx=-dx;return{du:(dx/28+dy/14)/2,dv:(dy/14-dx/28)/2}};

/* ---------- wrap each drawable with its edit (offset, scale, rotation, flip, swap, layer, hide) ---------- */
function entry(key,owner,ax,ay,draw,src,label){const ov=data.edit[key]||{},b=baseOf(owner),d=screenDelta(b,ov.du||0,ov.dv||0),E={key,owner,ax,ay,x:ax+d.x,y:ay+d.y,ov,label,hidden:!!ov.hide};frame.push(E);if(ov.hide)return null;
 const s=ov.s??1,r=(ov.r||0)*Math.PI/180,f=!!ov.f,k=ov.kind&&KINDS[ov.kind]?ov.kind:null,plain=!d.x&&!d.y&&s===1&&!r&&!f&&!k;
 const it={x:E.x,y:E.y+(ov.layer||0),draw:plain?draw:gg=>{g.save();g.translate(E.x,E.y);if(r)g.rotate(r);g.scale(f?-s:s,s);g.translate(-ax,-ay);if(k)KINDS[k].draw({x:ax,y:ay});else draw(gg);g.restore()}};
 if(src?.owner){it.owner=src.owner;if(src.rel)it.rel={u:src.rel.u+(ov.du||0),v:src.rel.v+(ov.dv||0)}}return it}
function addedItems(gates){const out=[];for(const a of data.added){if(a.owner.startsWith('exit:')!==gates)continue;const b=baseOf(a.owner);if(!b||!KINDS[a.kind])continue;const p=toScreen(b,a.du,a.dv),it=entry(a.id,a.owner,p.x,p.y,()=>KINDS[a.kind].draw(p),null,KINDS[a.kind].label+' (เพิ่มเอง)');if(it)out.push(it)}return out}
const LABEL_HINT=[['propSprite(7','ต้นไม้'],['lamp(','โคมไฟ'],["decor('bench'",'ม้านั่ง'],['drawBorder','รั้ว/แนวพุ่ม'],['bush(','พุ่มไม้'],['TownArt.detail','ดอกไม้'],['propSprite(3','กระถาง'],['propSprite(6','ลังไม้']];
const labelOf=fn=>{const t=String(fn);for(const[k,l]of LABEL_HINT)if(t.includes(k))return l;const m=t.match(/decor\('([\w-]+)'|dec\('([\w-]+)'/);return m?(DECOR_W[m[1]||m[2]]?.[0]||'ของประดับ'):'ของประดับ'};
const baseEstate=estateObjects;
estateObjects=function(){frame=[];const list=baseEstate(),sq=locations.find(o=>o.id==='square'),out=[],seen={};
 for(const it of list){let owner,rel;if(it.owner&&it.rel){owner=it.owner.id;rel=it.rel}else if(sq&&it.x!=null){const w=inv(it.x,it.y),c=center(sq);owner='square';rel={u:w.u-c.u,v:w.v-c.v}}else{out.push(it);continue}
  let key=owner+':'+rel.u.toFixed(1)+','+rel.v.toFixed(1);seen[key]=(seen[key]||0)+1;if(seen[key]>1)key+='#'+seen[key];
  const e=entry(key,owner,it.x,it.y,it.draw,it,labelOf(it.draw));if(e)out.push(e)}
 return out.concat(addedItems(false))};
const TM=window.TownMenu,baseGates=TM.gateObjects;
TM.gateObjects=function(){const out=[];baseGates().forEach((it,i)=>{const e=entry('exit:'+i,'exit:'+i,it.x,it.y,it.draw,null,'ประตู '+(Village25D.getExits()[i]?.name||''));if(e)out.push(e)});return out.concat(addedItems(true))};

/* ---------- big building art: scale + shear (tilt) around its footprint centre ---------- */
const anchorOf=o=>{const a=center(o);return project(a.u,a.v)};
const baseBuilding=building;
building=function(o){const t=data.buildings[o.id];if(!t){baseBuilding(o);return}const p=anchorOf(o);g.save();g.translate(p.x+(t.dx||0),p.y+(t.dy||0));g.transform(t.sx??1,t.ky||0,t.kx||0,t.sy??1,0,0);g.translate(-p.x,-p.y);baseBuilding(o);g.restore()};
function artRect(o,r){const t=data.buildings[o.id];if(!t)return r;const p=anchorOf(o),sx=t.sx??1,sy=t.sy??1,x0=p.x+(t.dx||0)+(r.x-p.x)*sx,x1=p.x+(t.dx||0)+(r.x+r.w-p.x)*sx,y0=p.y+(t.dy||0)+(r.y-p.y)*sy;return{...r,x:Math.min(x0,x1),y:y0,w:Math.abs(x1-x0),h:r.h*sy}}

/* ---------- editing ---------- */
const active=()=>editing&&UX.getMode()==='asset';
function begin(){if(!ckPending){UX.checkpoint();ckPending=true}}
function commit(){ckPending=false;UX.persist();render()}
function ovOf(key){return data.edit[key]||(data.edit[key]={})}
function clean(key){const o=data.edit[key];if(!o)return;for(const k of Object.keys(o))if(o[k]==null||o[k]===0&&k!=='s'||k==='s'&&o[k]===1||o[k]===false||o[k]==='')delete o[k];if(!Object.keys(o).length)delete data.edit[key]}
function pick(p){const R=24/(scale*zoom);let best=null,bd=R;for(const e of frame){const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<bd){bd=d;best=e}}return best}
const stageEl=document.getElementById('stage');
stageEl.addEventListener('pointerdown',e=>{if(!active()||e.button!==0)return;const p=world(e),hit=pick(p);
 if(hit){e.stopPropagation();e.preventDefault();sel={type:'item',key:hit.key,owner:hit.owner};const ov=data.edit[hit.key]||{};drag={id:e.pointerId,p,du:ov.du||0,dv:ov.dv||0,moved:false};render();return}
 const o=UX.hitObject(p);if(o){e.stopPropagation();e.preventDefault();sel={type:'building',id:o.id,owner:o.id};selected=o.id;const t=data.buildings[o.id]||{};drag={id:e.pointerId,p,dx:t.dx||0,dy:t.dy||0,moved:false};render()}},true);
window.addEventListener('pointermove',e=>{if(!drag||e.pointerId!==drag.id)return;const p=world(e),dx=p.x-drag.p.x,dy=p.y-drag.p.y;if(!drag.moved&&Math.hypot(dx,dy)*scale*zoom<4)return;if(!drag.moved){drag.moved=true;begin()}
 if(sel?.type==='item'){const b=baseOf(sel.owner),c=canonDelta(b,dx,dy),ov=ovOf(sel.key);ov.du=+(drag.du+c.du).toFixed(3);ov.dv=+(drag.dv+c.dv).toFixed(3)}
 else if(sel?.type==='building'){const t=data.buildings[sel.id]||(data.buildings[sel.id]={});t.dx=Math.round(drag.dx+dx);t.dy=Math.round(drag.dy+dy)}},true);
window.addEventListener('pointerup',e=>{if(!drag||e.pointerId!==drag.id)return;const moved=drag.moved;drag=null;if(moved){if(sel?.type==='item')clean(sel.key);commit()}},true);
document.addEventListener('keydown',e=>{if(!active()||!sel||e.target.closest('input,select,textarea'))return;
 if(sel.type==='item'&&(e.key==='Delete'||e.key==='Backspace')){e.preventDefault();begin();const a=data.added.find(a=>a.id===sel.key);if(a){data.added=data.added.filter(x=>x!==a);delete data.edit[a.id];sel=null}else ovOf(sel.key).hide=true;commit();return}
 const k={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(!k)return;e.preventDefault();const n=e.shiftKey?10:2;begin();
 if(sel.type==='item'){const c=canonDelta(baseOf(sel.owner),k[0]*n,k[1]*n),ov=ovOf(sel.key);ov.du=+((ov.du||0)+c.du).toFixed(3);ov.dv=+((ov.dv||0)+c.dv).toFixed(3)}else{const t=data.buildings[sel.id]||(data.buildings[sel.id]={});t.dx=(t.dx||0)+k[0]*n;t.dy=(t.dy||0)+k[1]*n}commit()});

/* ---------- panel ---------- */
const css=document.createElement('style');css.textContent=`#assetEdit{position:fixed;left:16px;top:168px;z-index:9;width:290px;max-height:calc(100dvh - 190px);overflow:auto;background:#1b302af2;color:#f3ead0;border:1px solid #b9c48f;border-radius:12px;padding:12px;font-size:12px;box-shadow:0 10px 30px #0006}#assetEdit[hidden]{display:none}#assetEdit h3{margin:0 0 6px;font-size:14px;color:#fff0c7}#assetEdit .sub{color:#c9d2b8;margin:0 0 8px}#assetEdit label{display:grid;grid-template-columns:92px 1fr 44px;gap:6px;align-items:center;margin:5px 0}#assetEdit label.chk{display:flex}#assetEdit input[type=range]{width:100%}#assetEdit select{width:100%;padding:5px;background:#132621;color:inherit;border:1px solid #7f9170;border-radius:6px}#assetEdit .row{display:flex;gap:5px;flex-wrap:wrap;margin:7px 0}#assetEdit button{padding:5px 8px;font-size:12px}#assetEdit hr{border:0;border-top:1px solid #4d6656;margin:10px 0}#assetEdit output{text-align:right;font-variant-numeric:tabular-nums}`;document.head.append(css);
const panel=document.createElement('section');panel.id='assetEdit';panel.hidden=true;document.body.append(panel);
const kindOptions=(cur,base)=>`<option value="">${base}</option>`+[...new Set(Object.values(KINDS).map(k=>k.group))].map(gr=>`<optgroup label="${gr}">`+Object.entries(KINDS).filter(([,k])=>k.group===gr).map(([id,k])=>`<option value="${id}" ${id===cur?'selected':''}>${k.label}</option>`).join('')+'</optgroup>').join('');
const slider=(id,label,v,min,max,step,fmt=x=>x)=>`<label>${label}<input type="range" data-k="${id}" min="${min}" max="${max}" step="${step}" value="${v}"><output>${fmt(v)}</output></label>`;
function addBlock(owner){return`<hr><b>เพิ่ม asset ให้ ${ownerName(owner)}</b><div class="row"><select id="aeAddKind">${kindOptions('','— เลือกของ —').replace('<option value="">— เลือกของ —</option>','')}</select><button id="aeAdd">เพิ่ม</button></div><div class="row"><button id="aeResetOwner">คืนค่าของทั้งแปลงนี้</button></div>`}
function render(){panel.hidden=!active();if(panel.hidden)return;
 if(!sel){panel.innerHTML=`<h3>แต่ง asset ย่อย</h3><p class="sub">คลิกจุดสีทองบนแผนที่เพื่อเลือกของประดับหรือประตูผจญภัย แล้วลากย้ายได้ · คลิกตัวอาคารเพื่อปรับขนาดและมุมเอียงให้เข้ากับพื้น isometric</p>${blendBlock()}`;bindBlend();return}
 if(sel.type==='building'){const o=locations.find(x=>x.id===sel.id);if(!o){sel=null;render();return}const t=data.buildings[o.id]||{},pct=x=>Math.round(x*100)+'%',tilt=x=>(Math.atan(x)*180/Math.PI).toFixed(1)+'°';
  panel.innerHTML=`<h3>${o.name}</h3><p class="sub">ตัวอาคาร · ลากตัวอาคารเพื่อขยับ · เส้นประสีฟ้าคือแนว 2:1 ของพื้น และกรอบฐานอาคาร</p>
  ${slider('sx','กว้าง',t.sx??1,.5,1.6,.01,pct)}${slider('sy','สูง',t.sy??1,.5,1.6,.01,pct)}${slider('kx','เอียงซ้าย-ขวา',t.kx||0,-.6,.6,.005,tilt)}${slider('ky','ยกด้านข้าง',t.ky||0,-.6,.6,.005,tilt)}
  <p class="sub">"เอียงซ้าย-ขวา" ดันส่วนบนของภาพไปทางซ้าย/ขวา · "ยกด้านข้าง" ยกฝั่งขวาขึ้นหรือลง เพื่อให้ขอบผนังขนานกับเส้น 2:1</p>
  <label class="chk"><input type="checkbox" id="aeGuides" ${guides?'checked':''}> แสดงเส้นช่วย 2:1</label>
  <div class="row"><button id="aeBReset">คืนค่าอาคารนี้</button>${o.npc||o.id==='home'?'<button id="aeBAll">ใช้ค่านี้กับบ้านภาพเดียวกันทุกหลัง</button>':''}</div>${addBlock(o.id)}`;
  panel.querySelectorAll('input[type=range]').forEach(i=>{i.oninput=()=>{begin();const t=data.buildings[o.id]||(data.buildings[o.id]={});t[i.dataset.k]=+i.value;i.nextElementSibling.textContent=({sx:pct,sy:pct,kx:tilt,ky:tilt})[i.dataset.k](+i.value)};i.onchange=commit});
  panel.querySelector('#aeGuides').onchange=e=>guides=e.target.checked;
  panel.querySelector('#aeBReset').onclick=()=>{begin();delete data.buildings[o.id];commit()};
  const all=panel.querySelector('#aeBAll');if(all)all.onclick=()=>{begin();const t=copy(data.buildings[o.id]||{});delete t.dx;delete t.dy;for(const x of locations)if(x.npc||x.id==='home'){if(x.id===o.id)continue;const keep=data.buildings[x.id]||{};data.buildings[x.id]={...t,...(keep.dx!=null?{dx:keep.dx}:{}),...(keep.dy!=null?{dy:keep.dy}:{})}}commit()};
  bindAdd(o.id);return}
 const E=frame.find(e=>e.key===sel.key),added=data.added.find(a=>a.id===sel.key),ov=data.edit[sel.key]||{};
 panel.innerHTML=`<h3>${E?.label||KINDS[added?.kind]?.label||'ของประดับ'}${ov.hide?' · ซ่อนอยู่':''}</h3><p class="sub">${ownerName(sel.owner)} · ลากจุดเพื่อย้าย · ลูกศร = ขยับ (Shift เร็วขึ้น) · Delete = ${added?'ลบ':'ซ่อน'}</p>
 <label style="grid-template-columns:92px 1fr">เปลี่ยนเป็น<select id="aeKind">${kindOptions(ov.kind||'','ภาพเดิม')}</select></label>
 ${slider('s','ขนาด',ov.s??1,.3,2.5,.01,x=>Math.round(x*100)+'%')}${slider('r','หมุน',ov.r||0,-180,180,1,x=>x+'°')}${slider('layer','ชั้น (หน้า/หลัง)',ov.layer||0,-200,200,2,x=>(x>0?'+':'')+x)}
 <label class="chk"><input type="checkbox" id="aeFlip" ${ov.f?'checked':''}> กลับด้านซ้าย-ขวา</label>
 <div class="row">${added?'<button id="aeDel">ลบของที่เพิ่ม</button>':`<button id="aeHide">${ov.hide?'แสดงกลับ':'ซ่อน (ลบ)'}</button>`}<button id="aeReset">คืนค่าเดิม</button></div>${addBlock(sel.owner)}`;
 panel.querySelectorAll('input[type=range]').forEach(i=>{i.oninput=()=>{begin();ovOf(sel.key)[i.dataset.k]=+i.value;i.nextElementSibling.textContent=({s:x=>Math.round(x*100)+'%',r:x=>x+'°',layer:x=>(x>0?'+':'')+x})[i.dataset.k](+i.value)};i.onchange=()=>{clean(sel.key);commit()}});
 panel.querySelector('#aeKind').onchange=e=>{begin();ovOf(sel.key).kind=e.target.value||null;clean(sel.key);commit()};
 panel.querySelector('#aeFlip').onchange=e=>{begin();ovOf(sel.key).f=e.target.checked;clean(sel.key);commit()};
 const hide=panel.querySelector('#aeHide');if(hide)hide.onclick=()=>{begin();ovOf(sel.key).hide=!ov.hide;clean(sel.key);commit()};
 const del=panel.querySelector('#aeDel');if(del)del.onclick=()=>{begin();data.added=data.added.filter(a=>a.id!==sel.key);delete data.edit[sel.key];sel=null;commit()};
 panel.querySelector('#aeReset').onclick=()=>{begin();delete data.edit[sel.key];commit()};
 bindAdd(sel.owner)}
function bindAdd(owner){const b=panel.querySelector('#aeAdd');if(!b)return;b.onclick=()=>{const k=panel.querySelector('#aeAddKind').value,base=baseOf(owner);if(!k||!base)return;begin();const id='add:'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);data.added.push({id,owner,du:0,dv:+base.front.toFixed(2),kind:k});sel={type:'item',key:id,owner};commit()};
 panel.querySelector('#aeResetOwner').onclick=()=>{if(!window.confirm('คืนค่าของประดับทั้งหมดของ '+ownerName(owner)+' (รวมที่เพิ่มเอง)?'))return;begin();for(const k of Object.keys(data.edit))if(k.startsWith(owner+':')||k===owner||data.added.some(a=>a.id===k&&a.owner===owner))delete data.edit[k];data.added=data.added.filter(a=>a.owner!==owner);if(sel?.type==='item')sel=null;commit()}}
function blendBlock(){return`<hr><b>พื้นถนน</b>${slider('blend','รอยต่อพื้นนุ่ม',ROAD_BLEND,0,60,1,x=>x?x+'px':'คม')}<p class="sub">ค่าความกว้างที่ลายพื้นต่างชนิดค่อย ๆ ผสมกัน (0 = ขอบคมแบบเดิม) · ลานหน้าสถานที่ใช้ลายเดียวกับถนนที่เชื่อมเข้ามา</p>`}
function bindBlend(){const i=panel.querySelector('[data-k=blend]');if(!i)return;i.oninput=()=>i.nextElementSibling.textContent=+i.value?i.value+'px':'คม';i.onchange=()=>setRoadBlend(i.value)}

/* ---------- overlay: anchor dots, selection, building footprint + 2:1 guides ---------- */
const baseOverlay=UX.overlay;
UX.overlay=function(gg,t){baseOverlay(gg,t);if(!active())return;const z=scale*zoom;
 for(const e of frame){const on=sel?.type==='item'&&sel.key===e.key;gg.beginPath();gg.arc(e.x,e.y,(on?8:4.5)/z,0,Math.PI*2);gg.fillStyle=e.hidden?'#c9504a':on?'#9ff3f5':e.key.startsWith('add:')?'#a8e07a':'#e5c06b';gg.fill();gg.lineWidth=1.2/z;gg.strokeStyle='#1d2b24';gg.stroke();if(e.hidden){gg.beginPath();gg.moveTo(e.x-4/z,e.y-4/z);gg.lineTo(e.x+4/z,e.y+4/z);gg.moveTo(e.x+4/z,e.y-4/z);gg.lineTo(e.x-4/z,e.y+4/z);gg.strokeStyle='#fff';gg.stroke()}}
 if(sel?.type==='building'){const o=locations.find(x=>x.id===sel.id);if(!o)return;const a=center(o),c=project(a.u,a.v),pts=[[-o.w,-o.d],[o.w,-o.d],[o.w,o.d],[-o.w,o.d]].map(([u,v])=>project(a.u+u,a.v+v));gg.save();gg.setLineDash([8/z,6/z]);gg.lineWidth=2/z;gg.strokeStyle='#7fe3ff';gg.beginPath();pts.forEach((p,i)=>gg[i?'lineTo':'moveTo'](p.x,p.y));gg.closePath();gg.stroke();
  if(guides){gg.globalAlpha=.7;for(const s of[-.5,.5])for(const p of[pts[0],pts[2]]){gg.beginPath();gg.moveTo(p.x-700,p.y-700*s);gg.lineTo(p.x+700,p.y+700*s);gg.stroke()}}
  gg.setLineDash([]);gg.globalAlpha=1;gg.fillStyle='#7fe3ff';gg.beginPath();gg.arc(c.x,c.y,5/z,0,Math.PI*2);gg.fill();gg.restore()}};

// panel follows the editor mode / edit toggle
let lastActive=false;(function tick(){const a=active();if(a!==lastActive){lastActive=a;if(!a)sel=null;render()}requestAnimationFrame(tick)})();

/* ---------- v38j: push the whole layout (roads, places, asset edits, building tilt) as the game's default layout ---------- */
if(window.GitHubPush){const tools=document.getElementById('toolsPanel'),row=document.createElement('div');row.className='edit-row';row.style.marginTop='6px';
 const push=document.createElement('button');push.textContent='⬆ บันทึกผังขึ้นเกม (GitHub)';push.title='เขียนผังปัจจุบันเป็นผังเริ่มต้นของเกม (js/village-layout-v67.js) แล้ว push ขึ้น repo';
 row.append(push,GitHubPush.settingsButton());(document.getElementById('reset')||tools.lastChild).after(row);
 window.VillageLayoutPush=()=>push.click();
 push.onclick=async()=>{if(!GitHubPush.config().token){GitHubPush.openSettings();return}const st=document.getElementById('status');push.disabled=true;
  try{const snap=UX.snapshot(),body='// Village default layout — saved from the in-game editor '+new Date().toISOString()+'.\nwindow.VillageDefaultLayout='+JSON.stringify(snap,null,2)+';\n';
   const sha=await GitHubPush.commit('Village layout from editor ('+Object.keys(snap.places).length+' places'+(snap.assets?' + asset edits':'')+')',async()=>[{path:'js/village-layout-v67.js',content:body}],m=>st.textContent=m);
   st.textContent=sha?'⬆ push ผังหมู่บ้านแล้ว · '+sha:'ไม่มีอะไรต้อง push'}
  catch(e){st.textContent='push ไม่สำเร็จ: '+e.message}finally{push.disabled=false}}}

window.VillageAssetEdit={get,set,artRect,kinds:()=>Object.keys(KINDS),getSelection:()=>sel&&{...sel}};
try{const s=JSON.parse(localStorage.getItem(STORE)||'null');set(s?s.assets:window.VillageDefaultLayout?.assets)}catch(e){console.warn('Village assets:',e.message)}
})();
