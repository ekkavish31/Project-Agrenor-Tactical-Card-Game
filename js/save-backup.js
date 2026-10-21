// v12: back up / restore everything this game keeps in the browser (play save, card designs, layout, routes, anchors…),
// plus a storage-usage check so a full browser storage is reported instead of failing silently.
(function(){
const FORMAT='project-a-backup';
function usage(){let n=0;for(let i=0;i<localStorage.length;i++){let k=localStorage.key(i);n+=(k.length+(localStorage.getItem(k)||'').length)*2}return n}
const kb=n=>(n/1024).toFixed(0)+' KB';
function exportAll(){let keys={};for(let i=0;i<localStorage.length;i++){let k=localStorage.key(i);keys[k]=localStorage.getItem(k)}
 let data=JSON.stringify({format:FORMAT,version:1,savedAt:new Date().toISOString(),keys},null,1),a=document.createElement('a'),u=URL.createObjectURL(new Blob([data],{type:'application/json'}));
 a.href=u;a.download='project-a-backup-'+new Date().toISOString().slice(0,10)+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(u),2000);status('สำรองข้อมูลแล้ว ('+Object.keys(keys).length+' รายการ · '+kb(data.length*2)+')')}
function importAll(file){file.text().then(t=>{let d=JSON.parse(t);if(d.format!==FORMAT||!d.keys)throw Error('ไม่ใช่ไฟล์สำรองของเกมนี้');
 if(!confirm(`นำเข้าข้อมูลสำรองจาก ${new Date(d.savedAt).toLocaleString('th-TH')}?\nข้อมูลปัจจุบันในเบราว์เซอร์นี้จะถูกแทนที่ (${Object.keys(d.keys).length} รายการ) แล้วเกมจะโหลดใหม่`))return;
 let old={};for(let i=0;i<localStorage.length;i++){let k=localStorage.key(i);old[k]=localStorage.getItem(k)}
 try{localStorage.clear();for(let [k,v] of Object.entries(d.keys))localStorage.setItem(k,v)}catch(e){localStorage.clear();for(let [k,v] of Object.entries(old))try{localStorage.setItem(k,v)}catch(x){}throw Error('พื้นที่เบราว์เซอร์ไม่พอ คืนข้อมูลเดิมแล้ว')}
 location.reload()}).catch(e=>alert('นำเข้าไม่ได้: '+e.message))}
function status(t){let el=document.getElementById('saveStatus');if(el)el.textContent=t}
function mount(){let f=document.querySelector('main>footer');if(!f||f.querySelector('.backup-tools'))return;
 let box=document.createElement('span');box.className='backup-tools';box.innerHTML='<button type="button" data-b="out" title="ดาวน์โหลดไฟล์สำรองทั้งหมด (เซฟ การ์ดที่ออกแบบ ตำแหน่ง ถนน)">⇩ สำรองเซฟ</button><button type="button" data-b="in" title="นำเข้าไฟล์สำรอง">⇧ นำเข้าเซฟ</button><input type="file" accept=".json,application/json" hidden>';
 f.insertBefore(box,f.lastElementChild);let inp=box.querySelector('input');
 box.onclick=e=>{let b=e.target.closest('[data-b]');if(!b)return;if(b.dataset.b==='out')exportAll();else inp.click()};inp.onchange=()=>{if(inp.files[0])importAll(inp.files[0]);inp.value=''}}
// warn when storage is nearly full (most browsers allow about 5 MB per site)
function check(){let u=usage();if(u>4.2*1024*1024)status('⚠ พื้นที่เก็บข้อมูลใกล้เต็ม ('+kb(u)+') — สำรองเซฟ แล้วลบภาพที่อัปโหลดในโต๊ะการ์ดที่ไม่ใช้')}
const baseSave=typeof save==='function'?save:null;
if(baseSave&&!window.EDITOR_MODE){save=function(){baseSave();if(typeof storageWarning!=='undefined'&&storageWarning)status('⚠ บันทึกไม่สำเร็จ: พื้นที่เบราว์เซอร์เต็ม — กด ⇩ สำรองเซฟ แล้วลบข้อมูลที่ไม่ใช้')}}
mount();check();
window.SaveBackup={exportAll,importAll,usage};
})();
