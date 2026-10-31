/* v85 · Ground painting for the village map and the sub-maps (market / forge / home).
   One soft mask per ground material (low-res canvas), painted with an elliptical (iso) brush. Painting a material
   lifts it and fades the others under the brush, so soft brushes blend materials into each other.
   Paths/roads (walk:true) make ground walkable, water (walk:false) blocks it, everything else keeps the map's own rule.
   Data: {v:1, res, mats:{id: PNG dataURL of its mask}} — stored in the map's layout and pushed with it.
   GroundPaint.create({w,h,res,unitPx,origin}) → painter · GroundPaint.ui(painter,{…host hooks}) → brush panel + toolbar button. */
(function(root){'use strict';
const SRC=document.currentScript?.src||'',url=f=>SRC?new URL('../'+f,SRC).href:f;
const MATERIALS=[
 {id:'grass',name:'หญ้า',tex:'grass-lush'},{id:'clover',name:'หญ้ามีดอก',tex:'grass-clover'},{id:'drygrass',name:'หญ้าแห้ง',tex:'grass-dry'},{id:'moss',name:'มอส',tex:'moss'},
 {id:'soil',name:'ดินร่วน',tex:'soil-dark'},{id:'desert',name:'ดินทรายส้ม',tex:'dirt-orange'},{id:'sand',name:'ทราย',tex:'sand-ripple'},{id:'snow',name:'หิมะ',tex:'snow-deep'},{id:'mud',name:'โคลน',tex:'mud-wet'},
 {id:'road-dirt',name:'ถนนดิน',tex:'dirt',walk:true},{id:'road-gravel',name:'ทางกรวด',tex:'gravel',walk:true},{id:'road-cobble',name:'ถนนหินกรวด',tex:'cobble',walk:true},{id:'road-stone',name:'ทางหินแผ่น',tex:'stone-path',walk:true},
 {id:'road-slab',name:'ลานหินตัด',tex:'slabs',walk:true},{id:'road-plank',name:'พื้นไม้',tex:'planks',walk:true},{id:'water',name:'น้ำตื้น',tex:'shallow-pebbles',walk:false},{id:'pond',name:'น้ำลึก',tex:'water-deep',walk:false}];
const BY=Object.fromEntries(MATERIALS.map(m=>[m.id,m])),texImgs={};
function texOf(m){let im=texImgs[m.tex];if(!im){im=new Image();im.src=url('assets/terrain/ground/'+m.tex+'.webp');texImgs[m.tex]=im}return im.complete&&im.naturalWidth?im:null}
const canvas=(w,h)=>{const c=document.createElement('canvas');c.width=Math.max(1,Math.round(w));c.height=Math.max(1,Math.round(h));return c};

function create(o){
 const W=o.w,H=o.h,res=o.res||.25,squash=o.squash??.5,unit=o.unitPx||28,org=o.origin||{x:W/2,y:H/2},span=o.span||2.6,MW=Math.round(W*res),MH=Math.round(H*res);
 const comp=canvas(W,H),cg=comp.getContext('2d'),masks={},alphas={},tmp=canvas(8,8),tg=tmp.getContext('2d');
 let listeners=[],version=0,loading=0;
 const mask=id=>masks[id]||(masks[id]=canvas(MW,MH));
 const used=()=>MATERIALS.filter(m=>masks[m.id]);
 // texture → iso ground: texture px (tx,ty) = (u,v) in units of span; screen x=(u-v)*unit, y=(u+v)*unit/2
 function pattern(ctx,m,ox,oy){const im=texOf(m);if(!im)return null;const p=ctx.createPattern(im,'repeat'),k=span/im.naturalWidth*unit;p.setTransform(new DOMMatrix([k,k*squash,-k,k*squash,org.x-ox,org.y-oy]));return p}
 function recomposite(x,y,w,h){x=Math.max(0,Math.floor(x));y=Math.max(0,Math.floor(y));w=Math.min(W-x,Math.ceil(w));h=Math.min(H-y,Math.ceil(h));if(w<=0||h<=0)return;
  cg.clearRect(x,y,w,h);if(tmp.width<w)tmp.width=w;if(tmp.height<h)tmp.height=h;
  for(const m of used()){const p=pattern(tg,m,x,y);if(!p)continue;tg.globalCompositeOperation='source-over';tg.clearRect(0,0,w,h);tg.fillStyle=p;tg.fillRect(0,0,w,h);tg.globalCompositeOperation='destination-in';tg.imageSmoothingEnabled=true;tg.drawImage(masks[m.id],x*res,y*res,w*res,h*res,0,0,w,h);cg.drawImage(tmp,0,0,w,h,x,y,w,h)}
  tg.globalCompositeOperation='source-over'}
 function full(){recomposite(0,0,W,H);readAlphas();version++}
 function readAlphas(){for(const k of Object.keys(alphas))if(!masks[k])delete alphas[k];for(const m of used()){if(m.walk==null)continue;const d=masks[m.id].getContext('2d',{willReadFrequently:true}).getImageData(0,0,MW,MH).data,a=alphas[m.id]||(alphas[m.id]=new Uint8Array(MW*MH));for(let i=0;i<a.length;i++)a[i]=d[i*4+3]}}
 // re-composite once a texture finishes loading
 for(const m of MATERIALS){const im=new Image();im.onload=()=>{texImgs[m.tex]=im;if(masks[m.id])recomposite(0,0,W,H)};im.src=url('assets/terrain/ground/'+m.tex+'.webp');if(!texImgs[m.tex])texImgs[m.tex]=im}
 /* v97.46 · optional clip (world-space polygons): while a place is selected in the editor, paint stays inside its frame */
 let clipPolys=null;function clipTo(ctx){if(!clipPolys)return;ctx.beginPath();for(const P of clipPolys){P.forEach((q,i)=>ctx[i?'lineTo':'moveTo'](q.x*res,q.y*res));ctx.closePath()}ctx.clip()}
 function brushOn(ctx,x,y,r,hard,flow,op){const R=r*res;ctx.save();clipTo(ctx);ctx.globalCompositeOperation=op;ctx.translate(x*res,y*res);ctx.scale(1,squash);const gr=ctx.createRadialGradient(0,0,0,0,0,R);gr.addColorStop(0,`rgba(255,255,255,${flow})`);gr.addColorStop(Math.min(.98,Math.max(0,hard)),`rgba(255,255,255,${flow})`);gr.addColorStop(1,'rgba(255,255,255,0)');ctx.fillStyle=gr;ctx.beginPath();if(ui.shape==='square'){ctx.moveTo(0,-R);ctx.lineTo(R,0);ctx.lineTo(0,R);ctx.lineTo(-R,0);ctx.closePath();ctx.clip();ctx.fillRect(-R,-R,R*2,R*2)}else{ctx.arc(0,0,R,0,Math.PI*2);ctx.fill()}ctx.restore()}
 // one dab: paint `id` (null = erase) at world (x,y), radius r (world px, along x), hardness 0..1, flow 0..1
 function dab(id,x,y,r,hard,flow){if(id){const m=mask(id).getContext('2d');brushOn(m,x,y,r,hard,flow,'source-over');for(const k of Object.keys(masks))if(k!==id)brushOn(masks[k].getContext('2d'),x,y,r,hard,flow,'destination-out')}else for(const k of Object.keys(masks))brushOn(masks[k].getContext('2d'),x,y,r,hard,flow,'destination-out');recomposite(x-r-2,y-r*squash-2,r*2+4,r*2*squash+4)}
 // grid-cell brush (v90): whole cells of the village grid, hard edge. size = cell edge in cells (1 or .5)
 function cellPoly(x,y,sz){const u=((x-org.x)/unit+(y-org.y)/(unit*squash))/2,v=((y-org.y)/(unit*squash)-(x-org.x)/unit)/2,u0=Math.floor(u/sz)*sz,v0=Math.floor(v/sz)*sz;return[[u0,v0],[u0+sz,v0],[u0+sz,v0+sz],[u0,v0+sz]].map(([a,b])=>({x:org.x+(a-b)*unit,y:org.y+(a+b)*unit*squash}))}
 function cellFill(ctx,pts,op){ctx.save();clipTo(ctx);ctx.globalCompositeOperation=op;ctx.fillStyle='#fff';ctx.beginPath();pts.forEach((q,i)=>ctx[i?'lineTo':'moveTo'](q.x*res,q.y*res));ctx.closePath();ctx.fill();ctx.restore()}
 function cellDab(id,x,y,sz){const pts=cellPoly(x,y,sz);if(id){cellFill(mask(id).getContext('2d'),pts,'source-over');for(const k of Object.keys(masks))if(k!==id)cellFill(masks[k].getContext('2d'),pts,'destination-out')}else for(const k of Object.keys(masks))cellFill(masks[k].getContext('2d'),pts,'destination-out');const xs=pts.map(q=>q.x),ys=pts.map(q=>q.y);recomposite(Math.min(...xs)-2,Math.min(...ys)-2,Math.max(...xs)-Math.min(...xs)+4,Math.max(...ys)-Math.min(...ys)+4)}
 // rectangle brush (v91.8): drag a frame; every grid cell inside is painted (or erased). i/j = cell indices in units of sz
 function cellIdx(x,y,sz){const u=((x-org.x)/unit+(y-org.y)/(unit*squash))/2,v=((y-org.y)/(unit*squash)-(x-org.x)/unit)/2;return{i:Math.floor(u/sz),j:Math.floor(v/sz)}}
 function rectPts(a,b,sz){const i0=Math.min(a.i,b.i),i1=Math.max(a.i,b.i)+1,j0=Math.min(a.j,b.j),j1=Math.max(a.j,b.j)+1;return[[i0,j0],[i1,j0],[i1,j1],[i0,j1]].map(([i,j])=>{const u=i*sz,v=j*sz;return{x:org.x+(u-v)*unit,y:org.y+(u+v)*unit*squash}})}
 function rectDab(id,a,b,sz){const i0=Math.min(a.i,b.i),i1=Math.max(a.i,b.i),j0=Math.min(a.j,b.j),j1=Math.max(a.j,b.j);if((i1-i0+1)*(j1-j0+1)>6000)return 0;const cell=(i,j)=>[[i,j],[i+1,j],[i+1,j+1],[i,j+1]].map(([p,q])=>{const u=p*sz,v=q*sz;return{x:org.x+(u-v)*unit,y:org.y+(u+v)*unit*squash}});let n=0;for(let i=i0;i<=i1;i++)for(let j=j0;j<=j1;j++){const pts=cell(i,j);if(id){cellFill(mask(id).getContext('2d'),pts,'source-over');for(const k of Object.keys(masks))if(k!==id)cellFill(masks[k].getContext('2d'),pts,'destination-out')}else for(const k of Object.keys(masks))cellFill(masks[k].getContext('2d'),pts,'destination-out');n++}const q=rectPts(a,b,sz),xs=q.map(p=>p.x),ys=q.map(p=>p.y);recomposite(Math.min(...xs)-2,Math.min(...ys)-2,Math.max(...xs)-Math.min(...xs)+4,Math.max(...ys)-Math.min(...ys)+4);return n}
 function endStroke(){readAlphas();version++;listeners.forEach(f=>f())}
 // 1 = walkable path, -1 = water / blocked, 0 = no say (map's own rule)
 function walk(x,y){const i=Math.floor(y*res)*MW+Math.floor(x*res);if(i<0||i>=MW*MH||x<0||x>=W)return 0;let wt=0,wf=0;for(const k in alphas){const v=alphas[k][i];if(BY[k].walk)wt=Math.max(wt,v);else if(BY[k].walk===false)wf=Math.max(wf,v)}return wt>=128&&wt>=wf?1:wf>=128?-1:0}
 function empty(){for(const k of Object.keys(masks)){const d=masks[k].getContext('2d').getImageData(0,0,MW,MH).data;let any=false;for(let i=3;i<d.length;i+=16)if(d[i]>3){any=true;break}if(!any)delete masks[k]}return !Object.keys(masks).length}
 let saved=null,savedVer=-1;function save(){if(savedVer===version)return saved;savedVer=version;if(empty())return saved=null;const mats={};for(const k of Object.keys(masks))mats[k]=masks[k].toDataURL('image/png');return saved={v:1,res,mats}}
 let lastJson='';
 function load(data){const json=data?JSON.stringify(data):'';if(json===lastJson)return;lastJson=json;for(const k of Object.keys(masks))delete masks[k];full();if(!data?.mats)return;const job=++loading,ids=Object.keys(data.mats).filter(k=>BY[k]);let left=ids.length;
  ids.forEach(k=>{const im=new Image();im.onload=im.onerror=()=>{if(job!==loading)return;if(im.naturalWidth)mask(k).getContext('2d').drawImage(im,0,0,MW,MH);if(--left===0){full();listeners.forEach(f=>f())}};im.src=data.mats[k]})}
 function clear(){for(const k of Object.keys(masks))delete masks[k];lastJson='';full();listeners.forEach(f=>f())}
 const ui={x:0,y:0,r:0,on:false,overlay:false,shape:'round',hard:.35};
 // overlay of walk rules (green = path, red = water) at mask resolution
 let walkView=null,walkVer=-1;
 function walkCanvas(){if(walkVer===version&&walkView)return walkView;walkVer=version;walkView=walkView||canvas(MW,MH);const q=walkView.getContext('2d'),img=q.createImageData(MW,MH),d=img.data;for(let i=0;i<MW*MH;i++){let wt=0,wf=0;for(const k in alphas){const v=alphas[k][i];if(BY[k].walk)wt=Math.max(wt,v);else if(BY[k].walk===false)wf=Math.max(wf,v)}if(wt>=128&&wt>=wf){d[i*4+1]=230;d[i*4+3]=110}else if(wf>=128){d[i*4]=240;d[i*4+3]=110}}q.putImageData(img,0,0);return walkView}
 // v91.22 · white mask of every painted walkable pixel (for the 'พื้นที่เดิน' highlight); same resolution as walkCanvas
 let walkOnly=null,walkOnlyVer=-1;
 function walkMask(){if(walkOnlyVer===version&&walkOnly)return walkOnly;walkOnlyVer=version;walkOnly=walkOnly||canvas(MW,MH);const q=walkOnly.getContext('2d'),img=q.createImageData(MW,MH),d=img.data;for(let i=0;i<MW*MH;i++){let wt=0,wf=0;for(const k in alphas){const v=alphas[k][i];if(BY[k].walk)wt=Math.max(wt,v);else if(BY[k].walk===false)wf=Math.max(wf,v)}if(wt>=128&&wt>=wf){d[i*4]=d[i*4+1]=d[i*4+2]=255;d[i*4+3]=255}}q.putImageData(img,0,0);return walkOnly}
 // v97.46 · white mask of every painted NO-walk pixel (water) — cut out of the 'พื้นที่เดิน' highlight
 let blockOnly=null,blockVer=-1;
 function blockMask(){if(blockVer===version&&blockOnly)return blockOnly;blockVer=version;blockOnly=blockOnly||canvas(MW,MH);const q=blockOnly.getContext('2d'),img=q.createImageData(MW,MH),d=img.data;for(let i=0;i<MW*MH;i++){let wt=0,wf=0;for(const k in alphas){const v=alphas[k][i];if(BY[k].walk)wt=Math.max(wt,v);else if(BY[k].walk===false)wf=Math.max(wf,v)}if(wf>=128&&wf>wt){d[i*4]=d[i*4+1]=d[i*4+2]=255;d[i*4+3]=255}}q.putImageData(img,0,0);return blockOnly}
 function draw(ctx){if(Object.keys(masks).length){if(window.TownArt?.drawWorld)TownArt.drawWorld(ctx,comp);else ctx.drawImage(comp,0,0)}if(ui.on&&ui.overlay)ctx.drawImage(walkCanvas(),0,0,W,H);if(ui.on&&ui.r){ctx.save();ctx.lineWidth=2/(ctx.getTransform().a||1);ctx.strokeStyle='#fff8';ctx.setLineDash([6,4]);if(ui.shape==='rect'||ui.shape==='square'){const sz=ui.cell||1,q=ui.rect?rectPts(ui.rect.a,ui.rect.b,sz):cellPoly(ui.x,ui.y,sz);ctx.beginPath();q.forEach((a,i)=>ctx[i?'lineTo':'moveTo'](a.x,a.y));ctx.closePath();ctx.fillStyle=ui.erase?'#ff6a5a55':'#ffd84066';ctx.fill();ctx.strokeStyle=ui.erase?'#ff6a5a':'#ffd840';ctx.setLineDash([]);ctx.stroke();ctx.restore();return}if(ui.shape==='cell'){const q=cellPoly(ui.x,ui.y,ui.cell||1);ctx.beginPath();q.forEach((a,i)=>ctx[i?'lineTo':'moveTo'](a.x,a.y));ctx.closePath();ctx.fillStyle='#ffd84066';ctx.fill();ctx.strokeStyle='#ffd840';ctx.setLineDash([]);ctx.stroke();ctx.restore();return}const diamond=(r)=>{ctx.beginPath();if(ui.shape==='square'){ctx.moveTo(ui.x,ui.y-r*squash);ctx.lineTo(ui.x+r,ui.y);ctx.lineTo(ui.x,ui.y+r*squash);ctx.lineTo(ui.x-r,ui.y);ctx.closePath()}else ctx.ellipse(ui.x,ui.y,r,r*squash,0,0,Math.PI*2);ctx.stroke()};diamond(ui.r);ctx.strokeStyle='#0008';ctx.setLineDash([]);diamond(ui.r*(ui.hard??.5));ctx.restore()}}
 /* v92.07 · which painted material (id) covers each world point — for terrain kinds in battle; null = nothing painted */
 function matsAt(pts){const out=pts.map(()=>null),best=pts.map(()=>127);for(const id of Object.keys(masks)){const d=masks[id].getContext('2d',{willReadFrequently:true}).getImageData(0,0,MW,MH).data;pts.forEach((p,i)=>{const ix=Math.floor(p.x*res),iy=Math.floor(p.y*res);if(ix<0||iy<0||ix>=MW||iy>=MH)return;const a=d[(iy*MW+ix)*4+3];if(a>best[i]){best[i]=a;out[i]=id}})}return out}
 return {setClip:p=>{clipPolys=p&&p.length?p:null},get clip(){return clipPolys},matsAt,unit,draw,walkMask,blockMask,dab,cellDab,cellIdx,rectDab,rectPts,cellPoly,cellKey:(p,sz)=>{const q=cellPoly(p.x,p.y,sz)[0];return q.x+','+q.y},endStroke,walk,save,load,clear,ui,onChange:f=>listeners.push(f),get version(){return version},squash,W,H};
}

/* ---------- brush panel + toolbar button ----------
   host: {bar:()=>Element, canvas, toWorld(e)→{x,y}, before(), after(json), ensureEdit(), onOpen(), isBusy()} */
function ui(P,host){
 const st=JSON.parse(localStorage.getItem('project-a-ground-brush')||'null')||{mat:'road-cobble',size:70,hard:.35,flow:.55,erase:false,shape:'cell'};if(!st.shape)st.shape='round';P.ui.shape=st.shape;
 const keep=()=>{try{localStorage.setItem('project-a-ground-brush',JSON.stringify(st))}catch(e){}};
 const css=document.createElement('style');css.textContent=`#gpPanel{position:fixed;left:14px;top:108px;z-index:14;width:300px;max-height:calc(100dvh - 126px);overflow:auto;background:#1b302af5;border:1px solid #b9c48f;border-radius:12px;color:#f3ead0;font:13px system-ui,"Noto Sans Thai",sans-serif;padding:10px 12px;box-shadow:0 10px 30px #0007}
#gpPanel h3{margin:0 0 4px;font-size:15px;color:#fff0c7}#gpPanel .sub{margin:2px 0 8px;color:#c8c4a8;font-size:12px;line-height:1.45}#gpPanel .tools{display:grid;grid-template-columns:1fr 1fr;gap:4px;margin-bottom:8px}
#gpPanel button{background:#2a4438;color:#f3ead0;border:1px solid #4d6656;border-radius:8px;padding:6px;font:inherit;cursor:pointer}#gpPanel button.on{background:#e5c06b;color:#1b302a;border-color:#fff0c7}
#gpPanel .mats{display:grid;grid-template-columns:repeat(4,1fr);gap:4px}#gpPanel .mats button{padding:3px;display:flex;flex-direction:column;align-items:center;gap:2px;font-size:10.5px;line-height:1.15}#gpPanel .mats canvas{width:52px;height:30px;border-radius:5px;display:block}
#gpPanel .mats .w{color:#9be59b}#gpPanel .mats .b{color:#ff9b8a}#gpPanel .mats .on span{color:#1b302a}#gpPanel label{display:grid;grid-template-columns:78px 1fr 40px;gap:6px;align-items:center;margin:6px 0}#gpPanel label.chk{display:flex}#gpPanel output{text-align:right;color:#e5c06b}
#gpPanel .row{display:flex;gap:4px;margin-top:8px}#gpPanel .row button{flex:1}#gpPanel b.sec{display:block;margin:8px 0 4px;color:#e5c06b}`;document.head.append(css);
 const panel=document.createElement('div');panel.id='gpPanel';panel.hidden=true;document.body.append(panel);
 let active=false,stroke=null,space=false;
 function thumb(m){const c=canvas(104,60),q=c.getContext('2d'),im=texOf(m);if(im){q.save();q.beginPath();q.moveTo(52,0);q.lineTo(104,30);q.lineTo(52,60);q.lineTo(0,30);q.closePath();q.clip();q.setTransform(52/im.naturalWidth*2,26/im.naturalWidth*2,-52/im.naturalWidth*2,26/im.naturalWidth*2,52,0);q.drawImage(im,0,0);q.drawImage(im,im.naturalWidth,0);q.drawImage(im,0,im.naturalHeight);q.restore()}else{q.fillStyle='#456';q.fillRect(0,0,104,60)}return c}
 function render(){panel.innerHTML=`<h3>🖌 วาดพื้น</h3><p class="sub">ลากบนแผนที่เพื่อวาด · ▭ กรอบ = ลากเป็นสี่เหลี่ยม เติม/ลบทุกช่องกริดในกรอบ (เลือกวัสดุ "ถนน/ทาง" = ทำทางเดิน) · ขอบนุ่ม = เบลนกับพื้นข้างเคียง · <b style="color:#9be59b">ถนน/ทาง</b> = เดินได้ · <b style="color:#ff9b8a">น้ำ</b> = เดินไม่ได้ · กด Space ค้างแล้วลาก = เลื่อนแผนที่ · [ ] = ปรับขนาดแปรง</p>
 <div class="tools"><button data-tool="paint" class="${st.erase?'':'on'}">🖌 แปรง <small>B</small></button><button data-tool="erase" class="${st.erase?'on':''}">🧽 ยางลบ <small>E</small></button></div>
  <div class="tools"><button data-shape="round" class="${st.shape==='round'?'on':''}">◯ กลม / ขอบนุ่ม</button><button data-shape="square" class="${st.shape==='square'?'on':''}">◇ สี่เหลี่ยม 2.5D</button><button data-shape="cell" class="${st.shape==='cell'?'on':''}">▦ ช่องกริด</button><button data-shape="rect" class="${st.shape==='rect'?'on':''}" title="ลากเป็นกรอบ ช่องกริดทั้งหมดในกรอบจะถูกวาด (หรือลบถ้าใช้ยางลบ)">▭ กรอบ</button></div>
 <div class="mats">${MATERIALS.map(m=>`<button data-m="${m.id}" class="${!st.erase&&st.mat===m.id?'on':''}" title="${m.name}"><span class="th"></span><span class="${m.walk===true?'w':m.walk===false?'b':''}">${m.name}</span></button>`).join('')}</div>
 <label>ขนาด<input type="range" data-k="size" min="12" max="400" step="2" value="${st.size}"><output>${st.size}</output></label>
 <label>ขอบนุ่ม<input type="range" data-k="soft" min="0" max="100" step="1" value="${Math.round((1-st.hard)*100)}"><output>${Math.round((1-st.hard)*100)}%</output></label>
 <label>ความเข้ม<input type="range" data-k="flow" min="5" max="100" step="1" value="${Math.round(st.flow*100)}"><output>${Math.round(st.flow*100)}%</output></label>
 <label class="chk"><input type="checkbox" id="gpWalk" ${P.ui.overlay?'checked':''}> แสดงพื้นที่เดินได้/ไม่ได้จากการวาด</label>
 <div class="row"><button id="gpClear">ล้างพื้นที่วาดทั้งหมด</button><button id="gpClose">✓ ปิด (Esc)</button></div>`;
  panel.querySelectorAll('[data-m]').forEach(b=>{b.querySelector('.th').append(thumb(BY[b.dataset.m]));b.onclick=()=>{st.mat=b.dataset.m;st.erase=false;keep();render()}});
  panel.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>{st.erase=b.dataset.tool==='erase';keep();render()});
   panel.querySelectorAll('[data-shape]').forEach(b=>b.onclick=()=>{st.shape=b.dataset.shape;P.ui.shape=st.shape;keep();render()});
  panel.querySelectorAll('input[type=range]').forEach(r=>r.oninput=()=>{const v=+r.value,k=r.dataset.k;if(k==='size')st.size=v;else if(k==='soft')st.hard=1-v/100;else st.flow=v/100;r.nextElementSibling.textContent=k==='size'?v:v+'%';P.ui.r=st.size;P.ui.hard=st.hard;keep()});
  panel.querySelector('#gpWalk').onchange=e=>{P.ui.overlay=e.target.checked};
  panel.querySelector('#gpClear').onclick=()=>{if(!confirm('ล้างพื้นที่วาดทั้งหมดในแผนที่นี้?'))return;host.before?.();P.clear();host.after?.(P.save())};
  panel.querySelector('#gpClose').onclick=()=>setActive(false)}
 // toolbar button (re-attached if the host rebuilds its bar)
 const btn=document.createElement('button');btn.dataset.gp='1';btn.title='วาดพื้น / ยางลบ (G)';btn.innerHTML='<b>🖌</b><span>วาดพื้น</span><kbd>G</kbd>';btn.onclick=e=>{e.stopPropagation();setActive(!active)};
 function attach(){const bar=host.bar?.();if(bar&&!bar.contains(btn)){bar.append(btn);bar.addEventListener('click',e=>{const b=e.target.closest('button');if(active&&b&&b!==btn)setActive(false)})}}
 attach();setInterval(attach,1500);
 function setActive(v){if(v===active)return;active=v;P.ui.on=v;P.ui.r=v?st.size:0;P.ui.hard=st.hard;P.ui.shape=st.shape;btn.classList.toggle('on',v);panel.hidden=!v;if(v){host.ensureEdit?.();host.onOpen?.();render()}document.body.style.cursor='';}
 const cv=host.canvas;
 const sqSpan=p=>{const sz=P.ui.cell=globalThis.TownUX?.gridMode?.()==='2x2'?.5:1,n=Math.max(1,Math.round(st.size/(P.unit*sz))),c=P.cellIdx(p.x,p.y,sz),lo=Math.floor((n-1)/2);const a={i:c.i-lo,j:c.j-lo};return{a,b:{i:a.i+n-1,j:a.j+n-1},sz}};
 const paintAt=(p)=>{if(st.shape==='square'){const q=sqSpan(p),k=q.a.i+','+q.a.j+','+q.sz;P.ui.rect=q;P.ui.erase=st.erase;if(stroke.key!==k){stroke.key=k;P.rectDab(st.erase?null:st.mat,q.a,q.b,q.sz)}return}if(st.shape==='rect'){const sz=P.ui.cell=globalThis.TownUX?.gridMode?.()==='2x2'?.5:1,c=P.cellIdx(p.x,p.y,sz);if(!stroke.rect)stroke.rect={a:c,b:c,sz};else stroke.rect.b=c;P.ui.rect=stroke.rect;P.ui.erase=st.erase;return}if(st.shape==='cell'){const sz=P.ui.cell=globalThis.TownUX?.gridMode?.()==='2x2'?.5:1;if(stroke.last&&P.cellKey(p,sz)===stroke.key)return;stroke.key=P.cellKey(p,sz);stroke.last=p;P.cellDab(st.erase?null:st.mat,p.x,p.y,sz);return}const r=st.size,step=Math.max(2,r*.22);if(stroke.last){const dx=p.x-stroke.last.x,dy=p.y-stroke.last.y,d=Math.hypot(dx,dy/P.squash);if(d<step)return;const n=Math.floor(d/step);for(let i=1;i<=n;i++)P.dab(st.erase?null:st.mat,stroke.last.x+dx*i/n,stroke.last.y+dy*i/n,r,st.hard,st.flow);}else P.dab(st.erase?null:st.mat,p.x,p.y,r,st.hard,st.flow);stroke.last=p};
 cv.addEventListener('pointerdown',e=>{if(!active||e.button!==0||space||host.isBusy?.())return;e.preventDefault();e.stopImmediatePropagation();host.before?.();stroke={last:null,id:e.pointerId};try{cv.setPointerCapture(e.pointerId)}catch(_){}paintAt(host.toWorld(e))},true);
 cv.addEventListener('pointermove',e=>{if(!active)return;const p=host.toWorld(e);P.ui.x=p.x;P.ui.y=p.y;if(st.shape==='square'){P.ui.rect=sqSpan(p);P.ui.erase=st.erase}if(stroke&&e.pointerId===stroke.id){e.stopImmediatePropagation();paintAt(p)}},true);
 const up=e=>{if(!stroke||e.pointerId!==stroke.id)return;e.stopImmediatePropagation();if(stroke.rect){const r=stroke.rect;P.rectDab(st.erase?null:st.mat,r.a,r.b,r.sz);P.ui.rect=null}stroke=null;P.endStroke();host.after?.(P.save())};
 cv.addEventListener('pointerup',up,true);cv.addEventListener('pointercancel',up,true);
 cv.addEventListener('click',e=>{if(active&&e.button===0&&!space)e.stopImmediatePropagation()},true);
 addEventListener('keydown',e=>{if(e.target.closest?.('input,select,textarea'))return;if(e.code==='Space'&&active){space=true;return}if(e.ctrlKey||e.metaKey||e.altKey)return;const k=e.key.toLowerCase();if(k==='g'){e.preventDefault();e.stopImmediatePropagation();setActive(!active)}else if(active&&k==='b'){st.erase=false;keep();render()}else if(active&&k==='e'){st.erase=true;keep();render()}else if(active&&e.key==='Escape'){e.stopImmediatePropagation();setActive(false)}else if(active&&(e.key==='['||e.key===']')){st.size=Math.max(12,Math.min(400,st.size+(e.key===']'?10:-10)));P.ui.r=st.size;keep();render()}},true);
 addEventListener('keyup',e=>{if(e.code==='Space')space=false});
 return {setActive,get active(){return active}};
}
root.GroundPaint={create,ui,MATERIALS};
})(globalThis);
