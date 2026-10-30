// v97.99 · Count the buttons a player can see on each game screen (docs/UI-BRUSHUP.md: button budget).
// Run: node tools/count-ui-buttons.cjs        (needs Playwright + Chromium)
// Prints each screen, its visible button count, the labels, and ⚠ when it is over the budget.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const ROOT=path.join(__dirname,'..'),BUDGET=5; // 4 main actions + 1 back/close
const TYPES={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2'};
// screen: page + optional steps run in the page before counting
const SCREENS=[
 {name:'หน้าแรก',page:'index.html'},
 {name:'หมู่บ้าน · HUD',page:'village-town.html'},
 {name:'หมู่บ้าน · เมนู Esc',page:'village-town.html',keys:['Escape'],within:'#cuMenu'},
 {name:'แผนที่โลก · HUD',page:'world-map.html'},
 {name:'ห้องภายใน · HUD',page:'place-interior.html'},
];
function serve(){return new Promise(res=>{const s=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';const f=path.join(ROOT,p);if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);r.end();return}r.writeHead(200,{'content-type':TYPES[path.extname(f)]||'application/octet-stream'});fs.createReadStream(f).pipe(r)});s.listen(0,()=>res(s))})}
(async()=>{const server=await serve(),base='http://localhost:'+server.address().port+'/',browser=await chromium.launch();let over=0;
 for(const sc of SCREENS){const page=await browser.newPage({viewport:{width:1600,height:900}});
  try{await page.goto(base+sc.page,{waitUntil:'load'});await page.waitForTimeout(4000);for(const k of sc.keys||[]){await page.keyboard.press(k);await page.waitForTimeout(600)}
   const labels=await page.evaluate(within=>{const host=within?[...document.querySelectorAll(within)].pop():document;if(!host)return [];
    return [...host.querySelectorAll('button,[role=button],a.button,.btn')].filter(b=>{const r=b.getBoundingClientRect(),st=getComputedStyle(b);return r.width>4&&r.height>4&&st.visibility!=='hidden'&&st.display!=='none'&&+st.opacity>.05&&r.bottom>0&&r.right>0&&r.top<innerHeight&&r.left<innerWidth}).map(b=>(b.textContent||b.title||b.getAttribute('aria-label')||'?').replace(/\s+/g,' ').trim().slice(0,24)+(b.disabled?' (กดไม่ได้)':''))},sc.within||null);
   const flag=labels.length>BUDGET?' ⚠ เกินงบ '+BUDGET:'';if(flag)over++;
   console.log(`${sc.name}: ${labels.length} ปุ่ม${flag}\n  ${labels.join(' · ')||'—'}`)}
  catch(e){console.log(`${sc.name}: เปิดไม่ได้ (${e.message})`)}finally{await page.close()}}
 console.log(`\nเกินงบ ${over}/${SCREENS.length} หน้า (งบ ${BUDGET} ปุ่มต่อหน้า)`);await browser.close();server.close()})();
