/* Seal-book presentation only. Existing buttons retain their handlers and text. */
(function(root){'use strict';
const scope='#panel:not(.unified-editor),#gameDialog,.ew-bg,#townMap';
const menu=name=>'assets/icons/menu/v2-'+name+'.webp';
const rules=[[/สมุดผนึก|คลังไพ่/,'card-book'],[/บันทึก|เซฟ/,'save-game'],[/จัดสำรับ|สำรับ/,'deck'],[/ฉายา|รางวัล/,'achievements'],[/วิวัฒน์|ทักษะ/,'skills'],[/รูปลักษณ์|ตัวละคร/,'character'],[/แผนที่/,'town-map'],[/ยืนยัน|ตกลง|ใช้ชุดนี้|ใช้บริการ/,'check'],[/ยกเลิก|ยังไม่เข้า|ย้อนกลับ|กลับ/,'back'],[/ซื้อ|ขาย/,'market'],[/คราฟต์|ผลิต|ตีเหล็ก/,'forge'],[/ช่วย|วิธีเล่น/,'help']];
function decorate(container){
 if(!container?.querySelectorAll||container.closest?.('.card-book,.unified-editor'))return;
 const buttons=[...(container.matches?.('button')?[container]:[]),...container.querySelectorAll('button')];
 for(const b of buttons){
  if(b.dataset.sealIcon||b.querySelector('img,canvas,svg')||b.closest('.card-book,.unified-editor,.collection-grid'))continue;
  const text=b.textContent.trim();if(!text)continue;
  let art,kind='';
  if(/^(?:✕|×|✖|X)?\s*ปิด(?:สมุด)?$|^[✕×✖]$/.test(text)||b.matches('.tm-x,.ew-close')){art='assets/ui/close-x.webp';kind='close'}
  else if(/^[+＋]$/.test(text)){art='assets/ui/hud/plus.webp';kind='step'}
  else if(/^[-−–]$/.test(text)){art='assets/ui/hud/minus.webp';kind='step'}
  else{const match=rules.find(([re])=>re.test(text));if(match)art=match[1]==='check'?'assets/ui/hud/check.webp':menu(match[1])}
  if(!art)continue;
  const im=document.createElement('img');im.className='seal-button-icon';im.src=art;im.alt='';im.setAttribute('aria-hidden','true');im.draggable=false;
  b.dataset.sealIcon=kind||'action';b.classList.add('seal-action');
  if(!kind&&b.firstChild?.nodeType===3)b.firstChild.textContent=b.firstChild.textContent.replace(/^[^\p{L}\p{N}]+/u,'');
  if(kind){b.setAttribute('aria-label',b.getAttribute('aria-label')||(kind==='close'?'ปิด':/^[+＋]$/.test(text)?'เพิ่ม':'ลด'));b.title=b.title||b.getAttribute('aria-label');const label=document.createElement('span');while(b.firstChild)label.append(b.firstChild);label.className='seal-sr';b.append(im,label)}else b.prepend(im);
 }
}
function boot(){
 const panel=document.getElementById('panel');if(panel){decorate(panel);new MutationObserver(records=>{for(const r of records)for(const n of r.addedNodes)if(n.nodeType===1)decorate(n)}).observe(panel,{childList:true,subtree:true})}
 // Only top-level overlays: avoid observing the animated game/map subtree.
 new MutationObserver(records=>{for(const r of records)for(const n of r.addedNodes)if(n.nodeType===1&&n.matches(scope))decorate(n)}).observe(document.body,{childList:true});
 document.querySelectorAll(scope).forEach(decorate);
}
root.SealUI={decorate};if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})(window);
