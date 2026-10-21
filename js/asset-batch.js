// v12 Asset Studio · batch requests + frame-sheet import (smart crop)
// 1) Tick several assets → "ชุดคำขอ" builds ONE request: a numbered template sheet, a style-reference collage
//    and a combined prompt (shared style + one line per cell) so the AI draws every cell in the same style.
// 2) "นำเข้า frame sheet": load the generated sheet → the grid is found automatically (gutters near the expected
//    cuts), each cell gets the green removed, trimmed and fitted to its asset, mapped in order (re-map per cell),
//    then confirm → all become pending files in the normal ZIP export.
(function(){
'use strict';
const KEY='asset-batches-v1',batch=new Set(JSON.parse(sessionStorage.getItem('asset-batch-sel')||'[]'));
const saveSel=()=>sessionStorage.setItem('asset-batch-sel',JSON.stringify([...batch]));
const saved=()=>{try{return JSON.parse(localStorage.getItem(KEY))||[]}catch(e){return []}};
const setSaved=a=>localStorage.setItem(KEY,JSON.stringify(a.slice(0,20)));
const css=document.createElement('style');css.textContent=`
.tile{position:relative}.bsel{position:absolute;right:6px;top:6px;z-index:2;background:#fffaf0;border:2px solid #b99b64;border-radius:6px;width:22px;height:22px;display:grid;place-items:center;cursor:pointer}
.bsel input{margin:0;cursor:pointer}.tile.batched{box-shadow:0 0 0 3px #3d6a8a88}
#batchDlg,#importDlg{width:min(1100px,94vw);max-height:92vh;overflow:auto}
.bt-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(230px,1fr));gap:6px;margin:8px 0}
.bt-item{display:grid;grid-template-columns:24px 48px 1fr auto;gap:6px;align-items:center;background:#fffaf0;border:1px solid #d6be8e;border-radius:8px;padding:4px;font-size:11px}
.bt-item img,.bt-item .ph{width:48px;height:48px;object-fit:contain;background:#eee2c8;border-radius:5px}
.bt-item b{font-size:11px;word-break:break-all}.bt-item small{display:block;opacity:.75}
.bt-item .mv button{padding:0 5px;font-size:11px;box-shadow:none}
.bt-prev{display:flex;gap:12px;flex-wrap:wrap;align-items:flex-start}.bt-prev canvas{max-width:420px;max-height:300px;border:1px solid #c5aa78;border-radius:6px;background:#fff}
.im-grid{display:grid;gap:8px;margin-top:8px}.im-cell{background:#fffaf0;border:1px solid #d6be8e;border-radius:8px;padding:5px;display:flex;flex-direction:column;gap:4px;align-items:center;font-size:11px}
.im-cell canvas{width:100%;height:120px;object-fit:contain;background:repeating-conic-gradient(#e8dcc3 0 25%,#f7efdd 0 50%) 0/12px 12px;border-radius:5px}
.im-cell select{width:100%;font-size:11px}.im-sheet{max-width:100%;max-height:260px;border:1px solid #c5aa78;border-radius:6px}`;document.head.appendChild(css);
// ---------- selection on the grid ----------
function decorate(){document.querySelectorAll('#grid .tile').forEach(t=>{let id=t.dataset.id;if(t.querySelector('.bsel'))return;t.classList.toggle('batched',batch.has(id));let l=document.createElement('label');l.className='bsel';l.title='เลือกเข้าชุดคำขอ';l.innerHTML=`<input type="checkbox" ${batch.has(id)?'checked':''}>`;l.onclick=e=>e.stopPropagation();l.querySelector('input').onchange=e=>{e.target.checked?batch.add(id):batch.delete(id);saveSel();t.classList.toggle('batched',e.target.checked);bar()};t.appendChild(l)})}
function bar(){let h=document.querySelector('header');if(!document.getElementById('batchBtn')){h.insertAdjacentHTML('beforeend','<button id="selAll" title="เลือกทุกภาพที่เห็นอยู่ตอนนี้">☑ เลือกที่เห็น</button><button id="selNone">ล้างที่เลือก</button><button id="batchBtn" class="primary">🧩 ชุดคำขอ</button><button id="importBtn">⇧ นำเข้า frame sheet</button>');
  document.getElementById('selAll').onclick=()=>{list().forEach(a=>batch.add(a.id));saveSel();render()};document.getElementById('selNone').onclick=()=>{batch.clear();saveSel();render()};
  document.getElementById('batchBtn').onclick=openBatch;document.getElementById('importBtn').onclick=()=>openImport()}
 let b=document.getElementById('batchBtn');b.textContent='🧩 ชุดคำขอ ('+batch.size+')';b.disabled=!batch.size}
const baseRender=render;render=function(){baseRender();decorate();bar()};
// ---------- batch request ----------
let order=[],opt={cols:0,cell:512};
const items=()=>order.map(byId).filter(Boolean);
function layout(){let n=items().length,cols=opt.cols||Math.min(6,Math.ceil(Math.sqrt(n))),rows=Math.ceil(n/cols),a=items()[0],r=a?.size?a.size[1]/a.size[0]:1,cw=opt.cell,ch=Math.round(opt.cell*Math.min(2,Math.max(.5,r)));return {n,cols,rows,cw,ch,green:items().filter(x=>x.transparent).length>=n/2}}
function stylePart(a){let p=a?.prompt||'';let i=p.indexOf('Subject:');return (i>0?p.slice(0,i):p).replace(/Background:.*$/s,'').trim()}
function batchPrompt(){let L=layout(),its=items(),mixed=its.some(a=>a.transparent)&&its.some(a=>!a.transparent);
 return [`Create ONE image: a sprite sheet laid out as a grid of ${L.cols} columns × ${L.rows} rows. Each cell is ${L.cw}×${L.ch} px (whole sheet ${L.cols*L.cw}×${L.rows*L.ch} px).`,
 `Every cell must share the same art style, lighting, outline weight, color palette and scale — match the attached style reference image. Keep a clear empty gutter between cells; nothing may cross a cell border. Do NOT draw numbers, text, labels, frames or grid lines.`,
 L.green?`Background: perfectly flat pure green (#00FF00) in every cell, no shadow on the background, no gradient — it will be removed. Full subject inside its cell, nothing cropped${its.some(a=>a.pivot||a.anchor)?', feet/base at the bottom centre of the cell':''}.`:`Each cell is a complete illustration that fills its cell edge to edge.`,
 mixed?`(Some cells are full illustrations, others are cut-out sprites on green — follow each cell's note.)`:'',
 `Shared style: ${stylePart(its[0])}`,
 `Cells (left → right, top → bottom):`,
 ...its.map((a,i)=>`${i+1}. ${a.subject}${a.clip?` — frame ${a.frame} of ${a.frames} of "${a.clip}"`:''}${mixed?(a.transparent?' [sprite on green]':' [full illustration]'):''}`)].filter(Boolean).join('\n')}
function template(){let L=layout(),sc=Math.min(1,2048/(L.cols*L.cw)),c=document.createElement('canvas');c.width=Math.round(L.cols*L.cw*sc);c.height=Math.round(L.rows*L.ch*sc);let g=c.getContext('2d'),w=L.cw*sc,h=L.ch*sc;
 g.fillStyle=L.green?'#00ff00':'#f2ead8';g.fillRect(0,0,c.width,c.height);
 items().forEach((a,i)=>{let x=(i%L.cols)*w,y=Math.floor(i/L.cols)*h;g.strokeStyle='#00000055';g.setLineDash([8,6]);g.lineWidth=2;g.strokeRect(x+6,y+6,w-12,h-12);g.setLineDash([]);
  if(a.pivot||a.anchor){let fy=y+h*(a.pivot?a.pivot[1]:(a.anchor[1]>=.99?.98:a.anchor[1]));g.strokeStyle='#ff000088';g.beginPath();g.moveTo(x+w*.35,fy);g.lineTo(x+w*.65,fy);g.stroke()}
  g.fillStyle='#000000aa';g.font=`bold ${Math.round(Math.max(14,w*.07))}px sans-serif`;g.fillText(String(i+1),x+12,y+12+Math.max(14,w*.07))});
 return c}
async function collage(){let refs=[...new Set(items().map(reference).filter(Boolean))];let cats=new Set(items().map(a=>a.category));for(let a of M.assets)if(refs.length<6&&cats.has(a.category)&&a.status==='final'&&a.file&&!refs.includes(a.file))refs.push(a.file);
 if(!refs.length)return null;let ims=(await Promise.all(refs.slice(0,6).map(src=>new Promise(r=>{let i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src=src})))).filter(Boolean);if(!ims.length)return null;
 let S=320,cols=Math.min(3,ims.length),c=document.createElement('canvas');c.width=cols*S;c.height=Math.ceil(ims.length/cols)*S;let g=c.getContext('2d');g.fillStyle='#f2ead8';g.fillRect(0,0,c.width,c.height);
 ims.forEach((im,i)=>{let s=Math.min((S-16)/im.width,(S-16)/im.height),w=im.width*s,h=im.height*s;g.drawImage(im,(i%cols)*S+(S-w)/2,Math.floor(i/cols)*S+(S-h)/2,w,h)});return c}
function download(c,name){c.toBlob(b=>{let u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),3000)},'image/png')}
function remember(){let L=layout(),all=saved(),name=items().slice(0,3).map(a=>a.id).join(', ')+(items().length>3?' +'+(items().length-3):'');let rec={id:Date.now(),name,ids:order.slice(),cols:L.cols,rows:L.rows,cw:L.cw,ch:L.ch,green:L.green,created:new Date().toLocaleString('th-TH')};setSaved([rec,...all.filter(x=>x.ids.join()!==rec.ids.join())]);return rec}
function openBatch(){order=[...batch].filter(id=>byId(id));let d=document.getElementById('batchDlg');if(!d){d=document.createElement('dialog');d.id='batchDlg';document.body.appendChild(d)}drawBatch(d);d.showModal()}
function drawBatch(d){let L=layout();
 d.innerHTML=`<h2>🧩 ชุดคำขอเจนภาพ (${L.n} ภาพ → sheet เดียว ${L.cols}×${L.rows})</h2>
 <p class="muted">ขั้นตอน: ⇩ แผ่นต้นแบบ + ⇩ ภาพอ้างอิงสไตล์ → แนบทั้งสองภาพใน Copilot → วาง prompt รวม → ได้ภาพเดียวแล้วกด "นำเข้า frame sheet"</p>
 <div class="row"><label class="inline">คอลัมน์ <select id="btCols"><option value="0">อัตโนมัติ</option>${[1,2,3,4,5,6,7,8].map(n=>`<option ${opt.cols===n?'selected':''}>${n}</option>`).join('')}</select></label><label class="inline">ขนาดช่อง <select id="btCell">${[256,384,512,768].map(n=>`<option ${opt.cell===n?'selected':''}>${n}</option>`).join('')}</select> px</label><span class="muted">${L.green?'พื้นเขียว (ภาพตัดพื้น)':'ภาพเต็มช่อง'}</span></div>
 <div class="bt-list">${items().map((a,i)=>`<div class="bt-item"><b>${i+1}</b>${a.file&&a.status!=='missing'&&a.status!=='code'&&a.status!=='planned'?`<img src="${esc(a.file)}" alt="">`:'<span class="ph"></span>'}<span><b>${esc(a.id)}</b><small>${esc(a.subject||'')}</small></span><span class="mv"><button data-mv="${i}" data-d="-1">▲</button><button data-mv="${i}" data-d="1">▼</button><button data-rm="${i}">✕</button></span></div>`).join('')}</div>
 <div class="bt-prev"><div><h3>แผ่นต้นแบบ</h3><div id="btTpl"></div></div><div><h3>ภาพอ้างอิงสไตล์</h3><div id="btRef"><span class="muted">กำลังรวมภาพ…</span></div></div></div>
 <h3>Prompt รวม</h3><textarea id="btPrompt" style="min-height:200px">${esc(batchPrompt())}</textarea>
 <div class="row" style="margin-top:8px"><button class="primary" id="btTplDl">⇩ แผ่นต้นแบบ</button><button id="btRefDl">⇩ ภาพอ้างอิงสไตล์</button><button class="primary" id="btCopy">⧉ คัดลอก prompt รวม</button><button id="btImport">⇧ นำเข้า frame sheet ของชุดนี้</button><button onclick="this.closest('dialog').close()">ปิด</button></div>`;
 let tpl=template();tpl.style.maxWidth='420px';d.querySelector('#btTpl').appendChild(tpl);let refCanvas=null;collage().then(c=>{refCanvas=c;let box=d.querySelector('#btRef');box.innerHTML='';if(c){c.style.maxWidth='420px';box.appendChild(c)}else box.innerHTML='<span class="muted">ไม่มีภาพอ้างอิงในหมวดนี้</span>'});
 d.querySelector('#btCols').onchange=e=>{opt.cols=+e.target.value;drawBatch(d)};d.querySelector('#btCell').onchange=e=>{opt.cell=+e.target.value;drawBatch(d)};
 d.querySelectorAll('[data-mv]').forEach(b=>b.onclick=()=>{let i=+b.dataset.mv,j=i+ +b.dataset.d;if(j<0||j>=order.length)return;[order[i],order[j]]=[order[j],order[i]];drawBatch(d)});
 d.querySelectorAll('[data-rm]').forEach(b=>b.onclick=()=>{batch.delete(order[+b.dataset.rm]);saveSel();order.splice(+b.dataset.rm,1);if(!order.length){d.close();render();return}drawBatch(d)});
 d.querySelector('#btTplDl').onclick=()=>{remember();download(template(),'batch-template.png');toast('ดาวน์โหลดแผ่นต้นแบบแล้ว')};
 d.querySelector('#btRefDl').onclick=()=>{if(refCanvas)download(refCanvas,'style-reference.png');else toast('ไม่มีภาพอ้างอิง')};
 d.querySelector('#btCopy').onclick=()=>{remember();navigator.clipboard.writeText(d.querySelector('#btPrompt').value).then(()=>toast('คัดลอก prompt รวมแล้ว'),()=>{d.querySelector('#btPrompt').select();document.execCommand('copy')})};
 d.querySelector('#btImport').onclick=()=>{let r=remember();d.close();openImport(r.id)}}
// ---------- import a generated sheet ----------
let sheet=null,cells=[],rec=null;
function openImport(id){let all=saved();rec=all.find(x=>x.id===id)||all[0]||null;let d=document.getElementById('importDlg');if(!d){d=document.createElement('dialog');d.id='importDlg';document.body.appendChild(d)}sheet=null;cells=[];drawImport(d);d.showModal()}
function drawImport(d){let all=saved();
 d.innerHTML=`<h2>⇧ นำเข้า frame sheet</h2>${all.length?`<div class="row"><label class="inline">ชุดคำขอ <select id="imRec">${all.map(x=>`<option value="${x.id}" ${rec?.id===x.id?'selected':''}>${esc(x.created)} · ${esc(x.name)} (${x.ids.length})</option>`).join('')}</select></label>
 <label class="inline">คอลัมน์ <input id="imCols" type="number" min="1" max="12" value="${rec?.cols||1}" style="width:56px"></label><label class="inline">แถว <input id="imRows" type="number" min="1" max="12" value="${rec?.rows||1}" style="width:56px"></label>
 <label class="inline"><input type="checkbox" id="imKey" ${rec?.green?'checked':''}> ลบพื้นเขียว</label><label class="inline">ความไว <input type="range" id="imTol" min="20" max="160" value="90"></label></div>
 <div id="imDrop" style="border:3px dashed #b99b64;border-radius:10px;padding:14px;text-align:center;background:#fffaf0;cursor:pointer;margin-top:8px">ลากภาพ sheet ที่เจนได้มาวาง หรือคลิกเพื่อเลือก<input id="imFile" type="file" accept="image/*" hidden></div>
 <div id="imOut"></div>`:'<p>ยังไม่มีชุดคำขอ — เลือกภาพ (☑) แล้วกด 🧩 ชุดคำขอ ก่อน</p>'}
 <div class="row" style="margin-top:8px"><button class="primary" id="imUse" disabled>ใช้ภาพทั้งหมด</button><label class="inline"><input type="checkbox" id="imTemp"> บันทึกเป็น "ชั่วคราว"</label><button onclick="this.closest('dialog').close()">ปิด</button></div>`;
 if(!all.length)return;
 d.querySelector('#imRec').onchange=e=>{rec=all.find(x=>x.id===+e.target.value);drawImport(d)};
 let drop=d.querySelector('#imDrop'),file=d.querySelector('#imFile');drop.onclick=()=>file.click();file.onchange=e=>e.target.files[0]&&load(e.target.files[0],d);
 drop.ondragover=e=>{e.preventDefault()};drop.ondrop=e=>{e.preventDefault();let f=e.dataTransfer.files[0];if(f)load(f,d)};
 for(let id of ['imCols','imRows','imKey','imTol'])d.querySelector('#'+id).oninput=()=>sheet&&slice(d);
 d.querySelector('#imUse').onclick=async()=>{let n=0,st=d.querySelector('#imTemp').checked?'temp':'final';for(let c of cells){let a=byId(c.id);if(!a)continue;await store(a,c.out,st);n++}toast('เพิ่ม '+n+' ภาพ · รอส่งออก ZIP');d.close();render()}}
async function load(f,d){sheet=await loadImage(f);slice(d)}
// find the grid: background mask → column/row ink profiles → cut at the emptiest line near each expected boundary
function cuts(profile,n){let len=profile.length,out=[0];for(let k=1;k<n;k++){let e=Math.round(k*len/n),w=Math.round(len/n*.3),best=e,bv=1e9;for(let i=Math.max(1,e-w);i<Math.min(len-1,e+w);i++){let v=profile[i]+Math.abs(i-e)/len*.5;if(v<bv){bv=v;best=i}}out.push(best)}out.push(len);return out}
function slice(d){let cols=Math.max(1,+d.querySelector('#imCols').value),rows=Math.max(1,+d.querySelector('#imRows').value),green=d.querySelector('#imKey').checked,tol=+d.querySelector('#imTol').value;
 let W=sheet.width,H=sheet.height,cv=document.createElement('canvas');cv.width=W;cv.height=H;let g=cv.getContext('2d');g.drawImage(sheet,0,0);let px=g.getImageData(0,0,W,H).data;
 let c0=[px[0],px[1],px[2]],isBg=i=>{let r=px[i],gg=px[i+1],b=px[i+2];if(px[i+3]<20)return true;if(green)return gg-Math.max(r,b)>tol*.45;return Math.abs(r-c0[0])+Math.abs(gg-c0[1])+Math.abs(b-c0[2])<40};
 let colP=new Float32Array(W),rowP=new Float32Array(H);for(let y=0;y<H;y+=2)for(let x=0;x<W;x+=2){if(!isBg((y*W+x)*4)){colP[x]++;rowP[y]++}}for(let x=0;x<W;x++)colP[x]/=H/2;for(let y=0;y<H;y++)rowP[y]/=W/2;
 let xs=cuts(colP,cols),ys=cuts(rowP,rows),ids=rec?.ids||[];cells=[];
 for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){let i=r*cols+c,x=xs[c],y=ys[r],w=xs[c+1]-x,h=ys[r+1]-y,cc=document.createElement('canvas');cc.width=w;cc.height=h;cc.getContext('2d').drawImage(sheet,x,y,w,h,0,0,w,h);cells.push({i,box:[x,y,w,h],raw:cc,id:ids[i]||''})}
 // preview: sheet with detected cuts + one card per cell
 let prev=document.createElement('canvas');prev.width=W;prev.height=H;let pg=prev.getContext('2d');pg.drawImage(sheet,0,0);pg.strokeStyle='#ff2a6d';pg.lineWidth=Math.max(2,W/400);for(let x of xs){pg.beginPath();pg.moveTo(x,0);pg.lineTo(x,H);pg.stroke()}for(let y of ys){pg.beginPath();pg.moveTo(0,y);pg.lineTo(W,y);pg.stroke()}
 let out=d.querySelector('#imOut');out.innerHTML=`<h3>ตารางที่ตรวจพบ (เส้นชมพู)</h3>`;prev.className='im-sheet';out.appendChild(prev);
 let grid=document.createElement('div');grid.className='im-grid';grid.style.gridTemplateColumns=`repeat(${Math.min(cols,6)},1fr)`;out.appendChild(grid);
 let opts=['',...ids].map(id=>`<option value="${id}">${id?esc(id):'— ข้าม —'}</option>`).join('');
 cells.forEach(c=>{let box=document.createElement('div');box.className='im-cell';box.innerHTML=`<b>ช่อง ${c.i+1}</b><select>${opts}</select>`;box.querySelector('select').value=c.id;box.querySelector('select').onchange=e=>{c.id=e.target.value;fit(c,green,tol);box.replaceChild(view(c),box.querySelector('canvas'))};fit(c,green,tol);box.insertBefore(view(c),box.querySelector('select'));grid.appendChild(box)});
 d.querySelector('#imUse').disabled=!cells.some(c=>c.id)}
function fit(c,green,tol){let a=byId(c.id);if(!a){c.out=null;return}let im=c.raw;c.out=processImage(im,a,{key:green&&a.transparent,tol,fit:a.transparent?'contain':'cover',trim:a.transparent})}
function view(c){let v=document.createElement('canvas'),s=c.out||c.raw;v.width=s.width;v.height=s.height;v.getContext('2d').drawImage(s,0,0);return v}
window.AssetBatch={refresh:()=>{decorate();bar()},clear:()=>{batch.clear();saveSel();bar()}};
render();
})();
