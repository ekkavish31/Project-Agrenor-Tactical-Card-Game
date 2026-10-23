/* v38i · Village editor: edit the small assets that make up each place (hedges, flowers, crates, lamps, stalls…),
   the adventure gates, and the scale / tilt of the big building art so it sits on the 2:1 iso grid.
   Edits are stored in the village layout (TownUX snapshot "assets"), so undo, export/import and reset include them.
   Data: edit[key] = {du,dv,s,r,f,layer,kind,hide} · added[] = {id,owner,du,dv,kind} · buildings[id] = {sx,sy,kx,ky,dx,dy} */
(function(){'use strict';
const STORE='project-a-village-editor-v67',UX=window.TownUX,copy=x=>JSON.parse(JSON.stringify(x)),num=(v,a,b,d)=>Math.max(a,Math.min(b,Number.isFinite(+v)?+v:d));
let data={edit:{},added:[],buildings:{},chars:{}},sel=null,frame=[],drag=null,ckPending=false,guides=true;
const empty=()=>({edit:{},added:[],buildings:{},chars:{}});
function set(v){data=empty();if(v&&typeof v==='object'){if(v.edit&&typeof v.edit==='object')data.edit=copy(v.edit);if(Array.isArray(v.added))data.added=copy(v.added).filter(a=>a&&a.id&&a.owner&&a.kind);if(v.buildings&&typeof v.buildings==='object')data.buildings=copy(v.buildings);if(v.chars&&typeof v.chars==='object')data.chars=copy(v.chars)}if(sel&&sel.type==='item'&&!data.edit[sel.key]&&!data.added.some(a=>a.id===sel.key)&&!frame.some(e=>e.key===sel.key))sel=null;render()}
function get(){const out={};if(Object.keys(data.edit).length)out.edit=copy(data.edit);if(data.added.length)out.added=copy(data.added);if(Object.keys(data.buildings).length)out.buildings=copy(data.buildings);if(Object.keys(data.chars).length)out.chars=copy(data.chars);return Object.keys(out).length?out:undefined}

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
function entry(key,owner,ax,ay,draw,src,label){const ov=data.edit[key]||{},b=baseOf(owner),d=screenDelta(b,ov.du||0,ov.dv||0),E={key,owner,ax,ay,x:ax+d.x,y:ay+d.y,ov,label,hidden:!!ov.hide,base:draw};frame.push(E);if(ov.hide)return null;
 const s=ov.s??1,r=(ov.r||0)*Math.PI/180,f=!!ov.f,k=ov.kind&&KINDS[ov.kind]?ov.kind:null,plain=!d.x&&!d.y&&s===1&&!r&&!f&&!k;
 const inner=plain?draw:gg=>{g.save();g.translate(E.x,E.y);if(r)g.rotate(r);g.scale(f?-s:s,s);g.translate(-ax,-ay);if(k)KINDS[k].draw({x:ax,y:ay});else draw(gg);g.restore()};
 const it={x:E.x,y:E.y+(ov.layer||0),draw:gg=>{if(active()&&(hoverKey===key||inSel(key)))outlineDraw(inner);inner(gg)}};
 if(src?.owner){it.owner=src.owner;if(src.rel)it.rel={u:src.rel.u+(ov.du||0),v:src.rel.v+(ov.dv||0)}}return it}
function addedItems(gates){const out=[];for(const a of data.added){if(a.owner.startsWith('exit:')!==gates)continue;const b=baseOf(a.owner);if(!b||!KINDS[a.kind])continue;const p=toScreen(b,a.du,a.dv),it=entry(a.id,a.owner,p.x,p.y,()=>KINDS[a.kind].draw(p),null,KINDS[a.kind].label+' (เพิ่มเอง)');if(it)out.push(it)}return out}
// v81.4 · names come from what the item really is (estateObjects tags each item); NAME_KIND maps it to a placeable kind
const NAMES={'border:hedge':'แนวพุ่มไม้','border:flowers':'แปลงดอกไม้ (ขอบ)','border:planter':'กระถาง (ขอบ)','border:wood':'รั้วไม้','border:stone':'กำแพงหิน',lamp:'โคมไฟ',bushflower:'พุ่มดอกไม้',pot:'กระถาง',statue:'ของตั้งหน้าอาคาร',table:'โต๊ะ/ถัง',crate:'ลังไม้',herb:'สมุนไพร','flower:1':'ดอกไม้ชุด 1','flower:2':'ดอกไม้ชุด 2',bush:'พุ่มไม้'};
const NAME_KIND={'border:hedge':'decor:hedge-row','border:flowers':'decor:flower-bed','border:planter':'prop:3','border:wood':'decor:fence-picket','border:stone':'decor:stone-wall-low',lamp:'lamp',bushflower:'prop:2',pot:'prop:3',statue:'prop:4',table:'prop:5',crate:'prop:6',herb:'flowers:3','flower:1':'flowers:1','flower:2':'flowers:2',bush:'prop:2'};
const nameLabel=n=>!n?null:NAMES[n]||(n.startsWith('decor:')?DECOR_W[n.slice(6)]?.[0]||n.slice(6):null);
const nameKind=n=>!n?null:NAME_KIND[n]||(n.startsWith('decor:')&&KINDS[n]?n:null);
const LABEL_HINT=[['propSprite(7','ต้นไม้'],['lamp(','โคมไฟ'],["decor('bench'",'ม้านั่ง'],['drawBorder','รั้ว/แนวพุ่ม'],['bush(','พุ่มไม้'],['TownArt.detail','ดอกไม้'],['propSprite(3','กระถาง'],['propSprite(6','ลังไม้']];
const labelOf=fn=>{const t=String(fn);for(const[k,l]of LABEL_HINT)if(t.includes(k))return l;const m=t.match(/decor\('([\w-]+)'|dec\('([\w-]+)'/);return m?(DECOR_W[m[1]||m[2]]?.[0]||'ของประดับ'):'ของประดับ'};
const baseEstate=estateObjects;
estateObjects=function(){frame=[];const list=baseEstate(),sq=locations.find(o=>o.id==='square'),out=[],seen={};
 for(const it of list){let owner,rel;if(it.owner&&it.rel){owner=it.owner.id;rel=it.rel}else if(sq&&it.x!=null){const w=inv(it.x,it.y),c=center(sq);owner='square';rel={u:w.u-c.u,v:w.v-c.v}}else{out.push(it);continue}
  let key=owner+':'+rel.u.toFixed(1)+','+rel.v.toFixed(1);seen[key]=(seen[key]||0)+1;if(seen[key]>1)key+='#'+seen[key];
  const e=entry(key,owner,it.x,it.y,it.draw,it,nameLabel(it.name)||labelOf(it.draw));frame[frame.length-1].name=it.name||null;if(e)out.push(e)}
 return out.concat(addedItems(false))};
const TM=window.TownMenu,baseGates=TM.gateObjects;
TM.gateObjects=function(){const out=[];baseGates().forEach((it,i)=>{const e=entry('exit:'+i,'exit:'+i,it.x,it.y,it.draw,null,'ประตู '+(Village25D.getExits()[i]?.name||''));if(e)out.push(e)});return out.concat(addedItems(true))};

// thin white outline for the hovered / selected item: draw it once off-screen, turn it white, stamp it around the item
let hoverKey=null,outlineCv=null;
function outlineDraw(inner){const main=g,W=main.canvas.width,H=main.canvas.height;if(!outlineCv)outlineCv=document.createElement('canvas');if(outlineCv.width!==W||outlineCv.height!==H){outlineCv.width=W;outlineCv.height=H}const o=outlineCv.getContext('2d');o.setTransform(1,0,0,1,0,0);o.clearRect(0,0,W,H);o.setTransform(main.getTransform());g=o;try{inner(o)}catch(e){}finally{g=main}
 o.setTransform(1,0,0,1,0,0);o.globalCompositeOperation='source-in';o.fillStyle='#fff';o.fillRect(0,0,W,H);o.globalCompositeOperation='source-over';main.save();main.setTransform(1,0,0,1,0,0);main.globalAlpha=.95;const d=Math.max(1.5,devicePixelRatio*1.3);for(const[dx,dy]of[[d,0],[-d,0],[0,d],[0,-d],[d*.7,d*.7],[-d*.7,d*.7],[d*.7,-d*.7],[-d*.7,-d*.7]])main.drawImage(outlineCv,dx,dy);main.restore()}
/* ---------- big building art: scale + shear (tilt) around its footprint centre ---------- */
const anchorOf=o=>{const a=center(o);return project(a.u,a.v)};
const baseBuilding=building;
building=function(o){const t=data.buildings[o.id];if(!t){baseBuilding(o);return}const p=anchorOf(o);g.save();g.translate(p.x+(t.dx||0),p.y+(t.dy||0));g.transform(t.sx??1,t.ky||0,t.kx||0,t.sy??1,0,0);g.translate(-p.x,-p.y);baseBuilding(o);g.restore()};
function artRect(o,r){const t=data.buildings[o.id];if(!t)return r;const p=anchorOf(o),sx=t.sx??1,sy=t.sy??1,x0=p.x+(t.dx||0)+(r.x-p.x)*sx,x1=p.x+(t.dx||0)+(r.x+r.w-p.x)*sx,y0=p.y+(t.dy||0)+(r.y-p.y)*sy;return{...r,x:Math.min(x0,x1),y:y0,w:Math.abs(x1-x0),h:r.h*sy}}

/* ---------- editing: one item at a time ----------
   Pick an item (map or list) → it becomes the edit session: only it can be dragged, other items are locked.
   ✓ เสร็จ (Enter) keeps the changes · ยกเลิก (Esc) restores exactly what it was. One undo step per session. */
const active=()=>editing&&UX.getMode()==='asset';
let session=null,listOwner='',band=null;
const inSel=k=>!!session&&(session.key===k||!!session.keys?.includes(k));
function begin(){if(session)return;if(!ckPending){UX.checkpoint();ckPending=true}}
function commit(){ckPending=false;UX.persist();render()}
function ovOf(key){return data.edit[key]||(data.edit[key]={})}
function clean(key){const o=data.edit[key];if(!o)return;for(const k of Object.keys(o))if(o[k]==null||o[k]===0&&k!=='s'||k==='s'&&o[k]===1||o[k]===false||o[k]==='')delete o[k];if(!Object.keys(o).length)delete data.edit[key]}
function pick(p,only){const R=(only?34:22)/(scale*zoom);let best=null,bd=R;for(const e of frame){if(only&&e.key!==only)continue;const d=Math.hypot(e.x-p.x,e.y-p.y);if(d<bd){bd=d;best=e}}return best}
function start(t,isNew=false){if(session)return;UX.checkpoint();ckPending=false;session={...t,isNew,before:JSON.stringify(data)};sel={...t};listOwner=t.owner||listOwner;if(t.type==='building')selected=t.id;hoverKey=null;render();flashStatus(t.type==='building'?'กำลังแก้อาคาร · ✓ เสร็จ (Enter) หรือ ยกเลิก (Esc)':'กำลังแก้ชิ้นนี้ · ลากเพื่อย้าย · ✓ เสร็จ (Enter) หรือ ยกเลิก (Esc)')}
function toGroup(key){const owner=frame.find(e=>e.key===key)?.owner;if(!session){start({type:'group',keys:[key],owner});return}if(session.type==='item'){session={...session,type:'group',keys:[session.key,key].filter((k,i,a)=>a.indexOf(k)===i)};delete session.key}else if(session.type==='group'){const i=session.keys.indexOf(key);if(i<0)session.keys.push(key);else session.keys.splice(i,1);if(!session.keys.length){finish(true);return}}else return;sel={type:'group'};render()}
function moveKeys(keys,orig,dx,dy){for(const k of keys){const E=frame.find(e=>e.key===k);if(!E)continue;const c=canonDelta(baseOf(E.owner),dx,dy),ov=ovOf(k),o=orig[k]||{du:0,dv:0};ov.du=+(o.du+c.du).toFixed(3);ov.dv=+(o.dv+c.dv).toFixed(3)}}
const keysOf=()=>session?.type==='group'?session.keys:session?.type==='item'?[session.key]:[];
function finish(ok){if(!session)return;const s=session;session=null;if(!ok){const b=JSON.parse(s.before);set(b)}else for(const k of(s.keys||[s.key]))if(k)clean(k);sel=null;drag=null;UX.persist();render();flashStatus(ok?'บันทึกการแก้แล้ว':'ยกเลิกแล้ว · กลับเป็นเหมือนก่อนแก้')}
function flashStatus(t){const st=document.getElementById('status');if(st)st.textContent=t}
function locked(){panel.classList.remove('ae-shake');void panel.offsetWidth;panel.classList.add('ae-shake');flashStatus('กำลังแก้ชิ้นอื่นอยู่ · กด ✓ เสร็จ หรือ ยกเลิก ก่อนเลือกชิ้นใหม่')}
function focusOn(x,y){pan={x:-(x-WORLD_W/2)*scale*zoom,y:-(y-WORLD_H/2)*scale*zoom}}
const stageEl=document.getElementById('stage');
stageEl.addEventListener('pointerdown',e=>{if(!active()||e.button!==0||e.target.closest('#assetEdit,#aePicker'))return;const p=world(e);
 if(e.shiftKey&&session?.type!=='building'){const h=pick(p);e.stopPropagation();e.preventDefault();if(h)toGroup(h.key);else{band={id:e.pointerId,a:p,b:p}}return}
 if(session?.type==='group'){const h=pick(p);if(h&&session.keys.includes(h.key)){e.stopPropagation();e.preventDefault();const orig={};for(const k of session.keys){const o=data.edit[k]||{};orig[k]={du:o.du||0,dv:o.dv||0}}drag={id:e.pointerId,p,orig,moved:false,group:true};return}if(h||UX.hitObject(p)){e.stopPropagation();e.preventDefault();locked()}return}
 if(session){let own=false;if(session.type==='item')own=!!pick(p,session.key);else{const o=UX.hitObject(p);own=o?.id===session.id}
  if(own){e.stopPropagation();e.preventDefault();if(session.type==='item'){const ov=data.edit[session.key]||{};drag={id:e.pointerId,p,du:ov.du||0,dv:ov.dv||0,moved:false}}else{const t=data.buildings[session.id]||{};drag={id:e.pointerId,p,dx:t.dx||0,dy:t.dy||0,moved:false}}return}
  if(pick(p)||UX.hitObject(p)){e.stopPropagation();e.preventDefault();locked()}return}// empty ground → camera pan as usual
 const hit=pick(p);if(hit){e.stopPropagation();e.preventDefault();start({type:'item',key:hit.key,owner:hit.owner});const ov=data.edit[hit.key]||{};drag={id:e.pointerId,p,du:ov.du||0,dv:ov.dv||0,moved:false};return}
 const o=UX.hitObject(p);if(o){e.stopPropagation();e.preventDefault();start({type:'building',id:o.id,owner:o.id});const t=data.buildings[o.id]||{};drag={id:e.pointerId,p,dx:t.dx||0,dy:t.dy||0,moved:false}}},true);
stageEl.addEventListener('pointermove',e=>{if(!active()){hoverKey=null;return}if(drag)return;const h=pick(world(e),session?.type==='item'?session.key:null);hoverKey=session&&!h?null:h?.key||null});
window.addEventListener('pointermove',e=>{if(band&&e.pointerId===band.id){band.b=world(e);return}if(!drag||e.pointerId!==drag.id||!session)return;const p=world(e),dx=p.x-drag.p.x,dy=p.y-drag.p.y;if(!drag.moved&&Math.hypot(dx,dy)*scale*zoom<4)return;drag.moved=true;
 if(drag.group){moveKeys(session.keys,drag.orig,dx,dy);return}
 if(session.type==='item'){const b=baseOf(session.owner),c=canonDelta(b,dx,dy),ov=ovOf(session.key);ov.du=+(drag.du+c.du).toFixed(3);ov.dv=+(drag.dv+c.dv).toFixed(3)}
 else{const t=data.buildings[session.id]||(data.buildings[session.id]={});t.dx=Math.round(drag.dx+dx);t.dy=Math.round(drag.dy+dy)}},true);
window.addEventListener('pointerup',e=>{if(band&&e.pointerId===band.id){const x0=Math.min(band.a.x,band.b.x),x1=Math.max(band.a.x,band.b.x),y0=Math.min(band.a.y,band.b.y),y1=Math.max(band.a.y,band.b.y);band=null;const hits=frame.filter(f=>f.x>=x0&&f.x<=x1&&f.y>=y0&&f.y<=y1).map(f=>f.key);if(hits.length){for(const k of hits)if(!inSel(k))toGroup(k)}return}if(!drag||e.pointerId!==drag.id)return;drag=null},true);
function nudge(dx,dy){if(!session)return;if(session.type==='group'){const orig={};for(const k of session.keys){const o=data.edit[k]||{};orig[k]={du:o.du||0,dv:o.dv||0}}moveKeys(session.keys,orig,dx,dy);return}if(session.type==='item'){const c=canonDelta(baseOf(session.owner),dx,dy),ov=ovOf(session.key);ov.du=+((ov.du||0)+c.du).toFixed(3);ov.dv=+((ov.dv||0)+c.dv).toFixed(3)}else{const t=data.buildings[session.id]||(data.buildings[session.id]={});t.dx=(t.dx||0)+dx;t.dy=(t.dy||0)+dy}}
document.addEventListener('keydown',e=>{if(!active()||!session||e.target.closest('input,select,textarea')||picker?.open)return;
 if(e.key==='Enter'){e.preventDefault();finish(true);return}if(e.key==='Escape'){e.preventDefault();finish(false);return}
 if(session.type!=='building'&&(e.key==='Delete'||e.key==='Backspace')){e.preventDefault();if(session.type==='group'){for(const k of session.keys){const a=data.added.find(x=>x.id===k);if(a){data.added=data.added.filter(x=>x!==a);delete data.edit[k]}else ovOf(k).hide=true}finish(true)}else removeCurrent();return}
 const k={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(!k)return;e.preventDefault();const n=e.shiftKey?10:2;nudge(k[0]*n,k[1]*n)});
function removeCurrent(){const a=data.added.find(a=>a.id===session.key);if(a){data.added=data.added.filter(x=>x!==a);delete data.edit[a.id];session.before=session.isNew?session.before:session.before;const s=session;session=null;sel=null;UX.persist();render();flashStatus(s.isNew?'ยกเลิกของที่เพิ่ม':'ลบของที่เพิ่มแล้ว');return}ovOf(session.key).hide=true;finish(true)}

/* ---------- thumbnails (rendered from the real draw code) ---------- */
const thumbCache=new Map();
function renderThumb(drawFn,ax,ay,w=112,h=92){const big=document.createElement('canvas');big.width=big.height=560;const q=big.getContext('2d'),main=g;g=q;try{q.translate(280-ax,520-ay);drawFn()}catch(e){}finally{g=main}
 const out=document.createElement('canvas');out.width=w;out.height=h;const o=out.getContext('2d');let bx=0,by=0,bw=560,bh=560,any=true;try{const d=q.getImageData(0,0,560,560).data;let x0=560,y0=560,x1=-1,y1=-1;for(let y=0;y<560;y+=2)for(let x=0;x<560;x+=2)if(d[(y*560+x)*4+3]>20){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}if(x1<0)any=false;else{bx=x0;by=y0;bw=x1-x0+2;bh=y1-y0+2}}catch(e){}
 if(any){const sc=Math.min((w-8)/bw,(h-8)/bh,1.2);o.drawImage(big,bx,by,bw,bh,(w-bw*sc)/2,(h-bh*sc)/2,bw*sc,bh*sc)}return any?out:null}
function kindThumb(id){if(thumbCache.has(id))return thumbCache.get(id);const c=renderThumb(()=>KINDS[id].draw({x:0,y:0}),0,0);if(c)thumbCache.set(id,c);return c}
function entryThumb(E){const k=E.ov?.kind;if(k&&KINDS[k])return kindThumb(k);return renderThumb(()=>E.base(g),E.ax,E.ay)}
const miniCache=new Map();function miniThumb(E){const sig=E.key+'|'+JSON.stringify(E.ov||{});if(miniCache.has(sig))return cloneCv(miniCache.get(sig));const c=entryThumb(E);if(c)miniCache.set(sig,c);return c?cloneCv(c):null}
function cloneCv(c){const n=document.createElement('canvas');n.width=c.width;n.height=c.height;n.getContext('2d').drawImage(c,0,0);return n}
function putThumb(slot,c){slot.replaceChildren();if(c){const im=document.createElement('canvas');im.width=c.width;im.height=c.height;im.getContext('2d').drawImage(c,0,0);slot.append(im)}else slot.textContent='…'}

/* ---------- picker: visual list of everything that can be placed ---------- */
let picker=null;
function openPicker(title,current,onPick){if(!picker){picker=document.createElement('dialog');picker.id='aePicker';document.body.append(picker)}
 const groups=[...new Set(Object.values(KINDS).map(k=>k.group))];let tab='ทั้งหมด',q='';
 const draw=()=>{const list=Object.entries(KINDS).filter(([id,k])=>(tab==='ทั้งหมด'||k.group===tab)&&(!q||k.label.includes(q)||id.includes(q)));
  picker.innerHTML=`<div class="pk-head"><b>${title}</b><input type="search" placeholder="ค้นหา…" value="${q}"><button data-x>ปิด (Esc)</button></div><div class="pk-tabs">${['ทั้งหมด',...groups].map(gr=>`<button data-tab="${gr}" class="${gr===tab?'on':''}">${gr}</button>`).join('')}</div><div class="grid">${list.map(([id,k])=>`<button data-id="${id}" class="${id===current?'cur':''}"><span class="th"></span><span>${k.label}</span><small>${k.group}</small></button>`).join('')||'<p>ไม่พบ</p>'}</div>`;
  picker.querySelectorAll('[data-id]').forEach(b=>{const slot=b.querySelector('.th');putThumb(slot,kindThumb(b.dataset.id));if(!thumbCache.has(b.dataset.id))setTimeout(()=>{thumbCache.delete(b.dataset.id);putThumb(slot,kindThumb(b.dataset.id))},700);b.onclick=()=>{picker.close();onPick(b.dataset.id)}});
  picker.querySelectorAll('[data-tab]').forEach(b=>b.onclick=()=>{tab=b.dataset.tab;draw()});picker.querySelector('[data-x]').onclick=()=>picker.close();const s=picker.querySelector('input');s.oninput=()=>{q=s.value.trim();const pos=s.selectionStart;draw();const n=picker.querySelector('input');n.focus();n.setSelectionRange(pos,pos)}};
 draw();picker.showModal();picker.querySelector('input').focus()}

/* ---------- copy one place's decoration to other places ---------- */
function copyTo(src,targets){const b=baseOf(src);if(!b)return{copied:0,skipped:0};const items=[];let skipped=0;
 for(const E of frame.filter(e=>e.owner===src&&!e.hidden)){const ov=E.ov||{},add=data.added.find(a=>a.id===E.key),kind=ov.kind&&KINDS[ov.kind]?ov.kind:add?add.kind:nameKind(E.name);if(!kind){skipped++;continue}
  const w=inv(b.mirror?b.cx*2-E.x:E.x,E.y);items.push({kind,du:+(w.u-b.u).toFixed(3),dv:+(w.v-b.v).toFixed(3),ov:{s:ov.s,r:ov.r,f:ov.f,layer:ov.layer}})}
 for(const t of targets){if(t===src||!baseOf(t))continue;for(const E of frame.filter(e=>e.owner===t))if(!E.key.startsWith('add:'))ovOf(E.key).hide=true;
  const gone=data.added.filter(a=>a.owner===t).map(a=>a.id);data.added=data.added.filter(a=>a.owner!==t);for(const id of gone)delete data.edit[id];
  for(const it of items){const id='add:'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);data.added.push({id,owner:t,du:it.du,dv:it.dv,kind:it.kind});data.edit[id]={...it.ov};clean(id)}}
 return{copied:items.length,skipped}}
function openCopy(src){if(!picker){picker=document.createElement('dialog');picker.id='aePicker';document.body.append(picker)}
 const places=locations.filter(o=>o.id!==src&&o.id!=='square'&&baseOf(o.id));
 picker.innerHTML=`<div class="pk-head"><b>คัดลอกการแต่งของ ${ownerName(src)} ไปที่…</b><button data-x>ปิด (Esc)</button></div><div class="pk-tabs"><button data-all="npc">บ้าน NPC ทั้งหมด</button><button data-all="none">ล้างที่เลือก</button></div>
 <div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr))">${places.map(o=>`<label style="display:flex;gap:8px;align-items:center;background:#132621;border:1px solid #4d6656;border-radius:10px;padding:8px"><input type="checkbox" value="${o.id}"> ${o.name}</label>`).join('')}</div>
 <p style="padding:0 12px;color:#c9d2b8">ของเดิมของสถานที่ปลายทางจะถูกซ่อน แล้วใส่ของชุดเดียวกับต้นทางในตำแหน่งเดียวกัน (กลับด้านให้เองถ้าอาคารหันอีกทาง) · ย้อนกลับได้</p><div class="pk-tabs" style="justify-content:flex-end"><button id="cpGo" style="background:#4f7a3c">คัดลอก</button></div>`;
 picker.querySelector('[data-x]').onclick=()=>picker.close();picker.querySelectorAll('[data-all]').forEach(b=>b.onclick=()=>picker.querySelectorAll('input[type=checkbox]').forEach(c=>c.checked=b.dataset.all==='npc'&&c.value.startsWith('npc')));
 picker.querySelector('#cpGo').onclick=()=>{const t=[...picker.querySelectorAll('input:checked')].map(c=>c.value);if(!t.length)return;UX.checkpoint();const r=copyTo(src,t);UX.persist();picker.close();render();flashStatus('คัดลอก '+r.copied+' ชิ้นไป '+t.length+' แห่ง'+(r.skipped?' · ข้าม '+r.skipped+' ชิ้นที่ยังไม่มีภาพแบบเลือกได้':'')+' · กด ย้อนกลับ ได้')};picker.showModal()}

/* ---------- panel ---------- */
const css=document.createElement('style');css.textContent=`#assetEdit{position:fixed;left:16px;top:120px;z-index:9;width:310px;max-height:calc(100dvh - 140px);display:flex;flex-direction:column;background:#1b302af5;color:#f3ead0;border:1px solid #b9c48f;border-radius:12px;font-size:12px;box-shadow:0 10px 30px #0006}#assetEdit[hidden]{display:none}
#assetEdit .body{overflow:auto;padding:12px}#assetEdit h3{margin:0 0 4px;font-size:15px;color:#fff0c7}#assetEdit .sub{color:#c9d2b8;margin:0 0 8px}#assetEdit .chip{display:inline-block;background:#e5c06b;color:#1b302a;border-radius:20px;padding:1px 8px;font-size:11px;margin-left:6px;vertical-align:2px}
#assetEdit label{display:grid;grid-template-columns:96px 1fr 44px;gap:6px;align-items:center;margin:6px 0}#assetEdit label.chk{display:flex}#assetEdit input[type=range]{width:100%}#assetEdit select{width:100%;padding:5px;background:#132621;color:inherit;border:1px solid #7f9170;border-radius:6px}
#assetEdit .row{display:flex;gap:5px;flex-wrap:wrap;margin:7px 0}#assetEdit button{padding:6px 9px;font-size:12px}#assetEdit hr{border:0;border-top:1px solid #4d6656;margin:10px 0}#assetEdit output{text-align:right;font-variant-numeric:tabular-nums}
#assetEdit .art{display:flex;gap:10px;align-items:center;background:#132621;border:1px solid #4d6656;border-radius:10px;padding:8px}#assetEdit .art .th{width:112px;height:92px;display:grid;place-items:center;background:repeating-conic-gradient(#20372e 0 25%,#1a2f27 0 50%) 0 0/16px 16px;border-radius:8px}
#assetEdit .nudge{display:grid;grid-template-columns:repeat(3,34px);gap:3px}#assetEdit .nudge button{padding:4px 0}
#assetEdit .foot{display:flex;gap:8px;padding:10px 12px;border-top:1px solid #4d6656;background:#16281f;border-radius:0 0 12px 12px}#assetEdit .foot button{flex:1;padding:9px;font-size:13px}#assetEdit .ok{background:#4f7a3c;border-color:#b8d39a}#assetEdit .cancel{background:#5b3a30;border-color:#c49a8a}
#assetEdit .items{display:grid;gap:3px;max-height:260px;overflow:auto}#assetEdit .items button{display:flex;align-items:center;gap:8px;text-align:left}#assetEdit .mini{width:44px;height:36px;flex:none;display:grid;place-items:center;background:#132621;border-radius:6px}#assetEdit .mini canvas{max-width:44px;max-height:36px}#assetEdit .items small{color:#c9d2b8}
#assetEdit.ae-shake{animation:aeShake .35s}@keyframes aeShake{20%,60%{transform:translateX(-6px)}40%,80%{transform:translateX(6px)}}
#aePicker{width:min(760px,94vw);max-height:86vh;padding:0;border:1px solid #b9c48f;border-radius:14px;background:#1b302a;color:#f3ead0;font:13px system-ui,"Noto Sans Thai",sans-serif}#aePicker::backdrop{background:#071c17aa}
#aePicker .pk-head{display:flex;gap:8px;align-items:center;padding:12px;border-bottom:1px solid #4d6656;position:static}#aePicker .pk-head b{flex:1;font-size:15px;color:#fff0c7}#aePicker button{width:auto!important;margin:0!important}#aePicker input{padding:6px 10px;border-radius:8px;border:1px solid #7f9170;background:#132621;color:inherit}
#aePicker .pk-tabs{display:flex;gap:4px;flex-wrap:wrap;padding:8px 12px}#aePicker .pk-tabs button.on{background:#e5c06b;color:#1b302a}#aePicker .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:8px;padding:12px;overflow:auto;max-height:62vh}
#aePicker .grid button{display:flex;flex-direction:column;align-items:center;gap:3px;padding:8px;border-radius:10px;background:#132621;border:1px solid #4d6656;color:inherit;cursor:pointer}#aePicker .grid button:hover{border-color:#e5c06b}#aePicker .grid button.cur{border-color:#9ff3f5;box-shadow:0 0 0 2px #9ff3f555}
#aePicker .th{width:112px;height:92px;display:grid;place-items:center;background:repeating-conic-gradient(#20372e 0 25%,#1a2f27 0 50%) 0 0/16px 16px;border-radius:8px}#aePicker small{color:#9fb19a;font-size:10px}#aePicker button{font:inherit;background:#233a2e;color:inherit;border:1px solid #7f9170;border-radius:8px;padding:6px 10px;cursor:pointer}`;document.head.append(css);
const panel=document.createElement('section');panel.id='assetEdit';panel.hidden=true;document.body.append(panel);
const slider=(id,label,v,min,max,step,fmt=x=>x)=>`<label>${label}<input type="range" data-k="${id}" min="${min}" max="${max}" step="${step}" value="${v}"><output>${fmt(v)}</output></label>`;
const FMT={s:x=>Math.round(x*100)+'%',r:x=>x+'°',layer:x=>(x>0?'+':'')+x,sx:x=>Math.round(x*100)+'%',sy:x=>Math.round(x*100)+'%',kx:x=>(Math.atan(x)*180/Math.PI).toFixed(1)+'°',ky:x=>(Math.atan(x)*180/Math.PI).toFixed(1)+'°'};
const foot=`<div class="foot"><button class="ok" id="aeOk">✓ เสร็จ <small>Enter</small></button><button class="cancel" id="aeCancel">ยกเลิก <small>Esc</small></button></div>`;
const nudgeHtml=`<div class="row" style="align-items:center"><span>ขยับละเอียด</span><div class="nudge"><span></span><button data-n="0,-2">↑</button><span></span><button data-n="-2,0">←</button><button data-n="0,2">↓</button><button data-n="2,0">→</button></div><small class="sub" style="margin:0">หรือลากบนแผนที่ · ลูกศร (Shift เร็ว)</small></div>`;
function owners(){const set=new Map();for(const e of frame){if(!set.has(e.owner))set.set(e.owner,0);set.set(e.owner,set.get(e.owner)+1)}return[...set.entries()].sort((a,b)=>ownerName(a[0]).localeCompare(ownerName(b[0]),'th'))}
function render(){panel.hidden=!active();if(panel.hidden)return;
 if(!session){const os=owners();if(!listOwner||!os.some(([o])=>o===listOwner))listOwner=os[0]?.[0]||'';const items=frame.filter(e=>e.owner===listOwner);
  const seenN={},nm=e=>{const b=e.ov?.kind&&KINDS[e.ov.kind]?KINDS[e.ov.kind].label:e.label;seenN[b]=(seenN[b]||0)+1;return b+(items.filter(x=>(x.ov?.kind&&KINDS[x.ov.kind]?KINDS[x.ov.kind].label:x.label)===b).length>1?' '+seenN[b]:'')};
  panel.innerHTML=`<div class="body"><h3>แต่ง asset ย่อย</h3><p class="sub">① คลิกชิ้นบนแผนที่ (จุดสีทอง) หรือเลือกจากรายการ · ② ปรับ · ③ กด ✓ เสร็จ — ระหว่างแก้จะเลือกชิ้นอื่นไม่ได้ กันกดพลาด · Shift+คลิก/Shift+ลาก = เลือกหลายชิ้น · คลิกตัวอาคารเพื่อปรับมุมเอียง</p>
  <label style="grid-template-columns:70px 1fr">สถานที่<select id="aeOwner">${os.map(([o,n])=>`<option value="${o}" ${o===listOwner?'selected':''}>${ownerName(o)} (${n})</option>`).join('')}</select></label>
  <div class="items">${items.map(e=>`<button data-key="${e.key}"><span class="mini"></span><span style="flex:1">${nm(e)}</span><small>${e.hidden?'ซ่อนอยู่':e.key.startsWith('add:')?'เพิ่มเอง':Object.keys(e.ov||{}).length?'แก้แล้ว':''}</small></button>`).join('')||'<p class="sub">ไม่มีชิ้นในสถานที่นี้</p>'}</div>
  <div class="row"><button id="aeAdd">＋ เพิ่ม asset…</button><button id="aeCopy">คัดลอกการแต่งไปที่อื่น…</button><button id="aeResetOwner">คืนค่าทั้งแปลง</button></div>${blendBlock()}</div>`;
  panel.querySelector('#aeOwner').onchange=e=>{listOwner=e.target.value;render()};
  panel.querySelectorAll('[data-key]').forEach(b=>{const E=frame.find(x=>x.key===b.dataset.key),m=b.querySelector('.mini');if(E&&m){const c=miniThumb(E);if(c)m.append(c)}b.onmouseenter=()=>hoverKey=b.dataset.key;b.onmouseleave=()=>hoverKey=null;b.onclick=()=>{const E=frame.find(x=>x.key===b.dataset.key);if(!E)return;zoom=Math.max(zoom,1.5);focusOn(E.x,E.y);start({type:'item',key:E.key,owner:E.owner})}});
  panel.querySelector('#aeAdd').onclick=()=>openPicker('เพิ่ม asset ให้ '+ownerName(listOwner),'',k=>{const base=baseOf(listOwner);if(!base)return;const before=JSON.stringify(data),id='add:'+Date.now().toString(36)+Math.random().toString(36).slice(2,5);UX.checkpoint();data.added.push({id,owner:listOwner,du:0,dv:+base.front.toFixed(2),kind:k});session={type:'item',key:id,owner:listOwner,isNew:true,before};sel={type:'item',key:id,owner:listOwner};const p=toScreen(base,0,base.front);focusOn(p.x,p.y);render();flashStatus('วางของใหม่แล้ว · ลากไปที่ต้องการ แล้วกด ✓ เสร็จ')});
  panel.querySelector('#aeCopy').onclick=()=>openCopy(listOwner);
  panel.querySelector('#aeResetOwner').onclick=()=>{if(!window.confirm('คืนค่าของประดับทั้งหมดของ '+ownerName(listOwner)+' (รวมที่เพิ่มเอง)?'))return;UX.checkpoint();for(const k of Object.keys(data.edit))if(k.startsWith(listOwner+':')||k===listOwner||data.added.some(a=>a.id===k&&a.owner===listOwner))delete data.edit[k];data.added=data.added.filter(a=>a.owner!==listOwner);UX.persist();render()};
  bindBlend();return}
 if(session.type==='group'){const ks=session.keys,ents=ks.map(k=>frame.find(e=>e.key===k)).filter(Boolean);
  panel.innerHTML=`<div class="body"><h3>เลือก ${ks.length} ชิ้น<span class="chip">กลุ่ม</span></h3><p class="sub">Shift+คลิก = เพิ่ม/เอาออก · Shift+ลากพื้น = ครอบเลือก · ลากชิ้นใดก็ได้ในกลุ่มเพื่อย้ายทั้งหมด</p>
  <div class="items">${ents.map(e=>`<button data-k="${e.key}"><span class="mini"></span><span style="flex:1">${e.ov?.kind&&KINDS[e.ov.kind]?KINDS[e.ov.kind].label:e.label}</span><small>${ownerName(e.owner)}</small><b title="เอาออกจากกลุ่ม">✕</b></button>`).join('')}</div>${nudgeHtml}
  <div class="row"><button id="gHide">ซ่อนทั้งหมด</button><button id="gShow">แสดงทั้งหมด</button><button id="gReset">คืนค่าทั้งหมด</button>${ents.some(e=>e.key.startsWith('add:'))?'<button id="gDel">ลบที่เพิ่มเอง</button>':''}</div></div>${foot}`;
  panel.querySelectorAll('[data-k]').forEach(b=>{const E=frame.find(x=>x.key===b.dataset.k),m=b.querySelector('.mini');if(E&&m){const c=miniThumb(E);if(c)m.append(c)}b.onmouseenter=()=>hoverKey=b.dataset.k;b.onmouseleave=()=>hoverKey=null;b.onclick=()=>toGroup(b.dataset.k)});
  panel.querySelector('#gHide').onclick=()=>{for(const k of ks)ovOf(k).hide=true;render()};panel.querySelector('#gShow').onclick=()=>{for(const k of ks)delete ovOf(k).hide;render()};panel.querySelector('#gReset').onclick=()=>{for(const k of ks)delete data.edit[k];render()};
  const gd=panel.querySelector('#gDel');if(gd)gd.onclick=()=>{data.added=data.added.filter(a=>!ks.includes(a.id));for(const k of ks)if(k.startsWith('add:'))delete data.edit[k];session.keys=ks.filter(k=>!k.startsWith('add:'));if(!session.keys.length)finish(true);else render()};
  bindSession();return}
 if(session.type==='building'){const o=locations.find(x=>x.id===session.id);if(!o){session=null;render();return}const t=data.buildings[o.id]||{};
  panel.innerHTML=`<div class="body"><h3>${o.name}<span class="chip">กำลังแก้</span></h3><p class="sub">ตัวอาคาร · ลากตัวอาคารเพื่อขยับ · เส้นประฟ้า = แนว 2:1 ของพื้นและกรอบฐาน</p>
  ${slider('sx','กว้าง',t.sx??1,.5,1.6,.01,FMT.sx)}${slider('sy','สูง',t.sy??1,.5,1.6,.01,FMT.sy)}${slider('kx','เอียงซ้าย-ขวา',t.kx||0,-.6,.6,.005,FMT.kx)}${slider('ky','ยกด้านข้าง',t.ky||0,-.6,.6,.005,FMT.ky)}${nudgeHtml}
  <label class="chk"><input type="checkbox" id="aeGuides" ${guides?'checked':''}> แสดงเส้นช่วย 2:1</label>
  <div class="row"><button id="aeBReset">คืนค่าอาคารนี้</button>${o.npc||o.id==='home'?'<button id="aeBAll">ใช้ค่านี้กับบ้านภาพเดียวกันทุกหลัง</button>':''}</div></div>${foot}`;
  panel.querySelectorAll('input[type=range]').forEach(i=>i.oninput=()=>{const t=data.buildings[o.id]||(data.buildings[o.id]={});t[i.dataset.k]=+i.value;i.nextElementSibling.textContent=FMT[i.dataset.k](+i.value)});
  panel.querySelector('#aeGuides').onchange=e=>guides=e.target.checked;panel.querySelector('#aeBReset').onclick=()=>{delete data.buildings[o.id];render()};
  const all=panel.querySelector('#aeBAll');if(all)all.onclick=()=>{const t=copy(data.buildings[o.id]||{});delete t.dx;delete t.dy;for(const x of locations)if((x.npc||x.id==='home')&&x.id!==o.id){const keep=data.buildings[x.id]||{};data.buildings[x.id]={...t,...(keep.dx!=null?{dx:keep.dx}:{}),...(keep.dy!=null?{dy:keep.dy}:{})}}flashStatus('ใช้ค่ากับบ้านทุกหลังแล้ว · กด ✓ เสร็จ เพื่อยืนยัน')};
  bindSession();return}
 const E=frame.find(e=>e.key===session.key),added=data.added.find(a=>a.id===session.key),ov=data.edit[session.key]||{},label=ov.kind&&KINDS[ov.kind]?KINDS[ov.kind].label:E?.label||KINDS[added?.kind]?.label||'ของประดับ';
 panel.innerHTML=`<div class="body"><h3>${label}<span class="chip">${session.isNew?'ของใหม่':'กำลังแก้'}</span></h3><p class="sub">${ownerName(session.owner)}${ov.hide?' · ซ่อนอยู่':''}</p>
 <div class="art"><span class="th" id="aeThumb"></span><div><div class="row" style="margin:0 0 6px"><button id="aeSwap">เปลี่ยนภาพ…</button></div>${ov.kind&&!added?'<button id="aeOrig">ใช้ภาพเดิม</button>':''}</div></div>
 ${nudgeHtml}${slider('s','ขนาด',ov.s??1,.3,2.5,.01,FMT.s)}${slider('r','หมุน',ov.r||0,-180,180,1,FMT.r)}${slider('layer','ชั้น หน้า/หลัง',ov.layer||0,-200,200,2,FMT.layer)}
 <label class="chk"><input type="checkbox" id="aeFlip" ${ov.f?'checked':''}> กลับด้านซ้าย-ขวา</label>
 <div class="row">${added?'<button id="aeDel">ลบของที่เพิ่ม</button>':`<button id="aeHide">${ov.hide?'แสดงกลับ':'ซ่อนชิ้นนี้'}</button>`}<button id="aeReset">คืนค่าเริ่มต้นของชิ้นนี้</button></div></div>${foot}`;
 const slot=panel.querySelector('#aeThumb');putThumb(slot,E?entryThumb(E):added?kindThumb(added.kind):null);
 panel.querySelectorAll('input[type=range]').forEach(i=>i.oninput=()=>{ovOf(session.key)[i.dataset.k]=+i.value;i.nextElementSibling.textContent=FMT[i.dataset.k](+i.value)});
 panel.querySelector('#aeSwap').onclick=()=>openPicker('เปลี่ยนภาพของชิ้นนี้',ov.kind||added?.kind||'',k=>{if(added)added.kind=k;else ovOf(session.key).kind=k;render()});
 const orig=panel.querySelector('#aeOrig');if(orig)orig.onclick=()=>{delete ovOf(session.key).kind;render()};
 panel.querySelector('#aeFlip').onchange=e=>ovOf(session.key).f=e.target.checked;
 const hide=panel.querySelector('#aeHide');if(hide)hide.onclick=()=>{ovOf(session.key).hide=!ov.hide;render()};
 const del=panel.querySelector('#aeDel');if(del)del.onclick=removeCurrent;
 panel.querySelector('#aeReset').onclick=()=>{delete data.edit[session.key];render()};
 bindSession()}
function bindSession(){panel.querySelector('#aeOk').onclick=()=>finish(true);panel.querySelector('#aeCancel').onclick=()=>finish(false);panel.querySelectorAll('[data-n]').forEach(b=>b.onclick=()=>{const[x,y]=b.dataset.n.split(',').map(Number);nudge(x,y)})}
function blendBlock(){return`<hr><b>ขนาดตัวละครในเมือง</b>${slider('char-hero','ตัวเอก',data.chars.hero??1,.5,2,.05,x=>Math.round(x*100)+'%')}${slider('char-npc','ชาวบ้าน (NPC)',data.chars.npc??1,.5,2,.05,x=>Math.round(x*100)+'%')}<p class="sub">ตัวเอกใช้ขนาดนี้ในแผนที่ย่อย (ตลาด โรงตีเหล็ก บ้าน) ด้วย</p><hr><b>พื้นถนน</b>${slider('blend','รอยต่อพื้นนุ่ม',ROAD_BLEND,0,60,1,x=>x?x+'px':'คม')}<p class="sub">ความกว้างที่ลายพื้นต่างชนิดค่อย ๆ ผสมกัน (0 = ขอบคม) · ลานหน้าสถานที่ใช้ลายเดียวกับพื้นหน้าประตู</p>`}
function bindBlend(){for(const k of['hero','npc']){const c=panel.querySelector('[data-k=char-'+k+']');if(!c)continue;c.oninput=()=>{begin();data.chars[k]=+c.value;c.nextElementSibling.textContent=Math.round(c.value*100)+'%'};c.onchange=()=>{if(data.chars[k]===1)delete data.chars[k];commit()}}const i=panel.querySelector('[data-k=blend]');if(!i)return;i.oninput=()=>i.nextElementSibling.textContent=+i.value?i.value+'px':'คม';i.onchange=()=>setRoadBlend(i.value)}

/* ---------- overlay: dots (dimmed while one item is being edited), building footprint + 2:1 guides ---------- */
const baseOverlay=UX.overlay;
UX.overlay=function(gg,t){baseOverlay(gg,t);if(!active())return;const z=scale*zoom;
 for(const e of frame){const on=inSel(e.key);gg.save();gg.globalAlpha=session&&!on?.25:1;gg.beginPath();gg.arc(e.x,e.y,(on?8:hoverKey===e.key?6:4.5)/z,0,Math.PI*2);gg.fillStyle=e.hidden?'#c9504a':on?'#9ff3f5':e.key.startsWith('add:')?'#a8e07a':'#e5c06b';gg.fill();gg.lineWidth=1.2/z;gg.strokeStyle='#1d2b24';gg.stroke();if(e.hidden){gg.beginPath();gg.moveTo(e.x-4/z,e.y-4/z);gg.lineTo(e.x+4/z,e.y+4/z);gg.moveTo(e.x+4/z,e.y-4/z);gg.lineTo(e.x-4/z,e.y+4/z);gg.strokeStyle='#fff';gg.stroke()}gg.restore()}
 if(band){gg.save();gg.setLineDash([6/z,4/z]);gg.lineWidth=1.5/z;gg.strokeStyle='#9ff3f5';gg.fillStyle='#9ff3f522';gg.fillRect(band.a.x,band.a.y,band.b.x-band.a.x,band.b.y-band.a.y);gg.strokeRect(band.a.x,band.a.y,band.b.x-band.a.x,band.b.y-band.a.y);gg.restore()}
 if(session?.type==='building'){const o=locations.find(x=>x.id===session.id);if(!o)return;const a=center(o),c=project(a.u,a.v),pts=[[-o.w,-o.d],[o.w,-o.d],[o.w,o.d],[-o.w,o.d]].map(([u,v])=>project(a.u+u,a.v+v));gg.save();gg.setLineDash([8/z,6/z]);gg.lineWidth=2/z;gg.strokeStyle='#7fe3ff';gg.beginPath();pts.forEach((p,i)=>gg[i?'lineTo':'moveTo'](p.x,p.y));gg.closePath();gg.stroke();
  if(guides){gg.globalAlpha=.7;for(const s of[-.5,.5])for(const p of[pts[0],pts[2]]){gg.beginPath();gg.moveTo(p.x-700,p.y-700*s);gg.lineTo(p.x+700,p.y+700*s);gg.stroke()}}
  gg.setLineDash([]);gg.globalAlpha=1;gg.fillStyle='#7fe3ff';gg.beginPath();gg.arc(c.x,c.y,5/z,0,Math.PI*2);gg.fill();gg.restore()}};

// leaving the tool keeps the edit (same as ✓); the list refreshes when the map changes
let lastActive=false,lastSig='';(function tick(){const a=active();if(a!==lastActive){lastActive=a;if(!a&&session)finish(true);render()}else if(a&&!session){const sig=frame.length+'|'+listOwner+'|'+JSON.stringify(data.edit).length+'|'+data.added.length;if(sig!==lastSig){lastSig=sig;if(!panel.contains(document.activeElement))render()}}requestAnimationFrame(tick)})();

/* ---------- v38j: push the whole layout (roads, places, asset edits, building tilt) as the game's default layout ---------- */
if(window.GitHubPush){const tools=document.getElementById('toolsPanel'),row=document.createElement('div');row.className='edit-row';row.style.marginTop='6px';
 const push=document.createElement('button');push.textContent='⬆ บันทึกผังขึ้นเกม (GitHub)';push.title='เขียนผังปัจจุบันเป็นผังเริ่มต้นของเกม (js/village-layout-v67.js) แล้ว push ขึ้น repo';
 row.append(push,GitHubPush.settingsButton());(document.getElementById('reset')||tools.lastChild).after(row);
 if(typeof EDIT_PAGE!=='undefined'&&EDIT_PAGE){push.textContent='⬆ บันทึก + push ผังขึ้นเกม';push.style.cssText='flex:2;background:#c9893a;color:#fff;border-color:#8a5a20;font-weight:600';setTimeout(()=>{const t=document.getElementById('townTestWalk');(t||tools.firstChild).after(row)},0)}
 window.VillageLayoutPush=()=>push.click();
 push.onclick=async()=>{if(!GitHubPush.config().token){GitHubPush.openSettings();return}const st=document.getElementById('status');push.disabled=true;
  try{const snap=UX.snapshot(),body='// Village default layout — saved from the in-game editor '+new Date().toISOString()+'.\nwindow.VillageDefaultLayout='+JSON.stringify(snap,null,2)+';\n';
   const sha=await GitHubPush.commit('Village layout from editor ('+Object.keys(snap.places).length+' places'+(snap.assets?' + asset edits':'')+')',async()=>[{path:'js/village-layout-v67.js',content:body}],m=>st.textContent=m);
   st.textContent=sha?'⬆ push ผังหมู่บ้านแล้ว · '+sha:'ไม่มีอะไรต้อง push'}
  catch(e){st.textContent='push ไม่สำเร็จ: '+e.message}finally{push.disabled=false}}}

window.VillageAssetEdit={charScale:k=>+data.chars?.[k]||1,get,set,artRect,kinds:()=>Object.keys(KINDS),getSelection:()=>sel&&{...sel}};
try{const s=JSON.parse(localStorage.getItem(STORE)||'null');set(s?s.assets:window.VillageDefaultLayout?.assets)}catch(e){console.warn('Village assets:',e.message)}
})();
