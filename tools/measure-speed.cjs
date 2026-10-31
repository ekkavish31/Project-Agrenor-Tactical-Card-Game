// v98.13 · How slow is a game page? Run: node tools/measure-speed.cjs [page.html ...]   (needs Playwright + Chromium; default pages: village + world map)
// Per page: files and MB fetched · seconds the main thread was blocked by tasks over 300 ms · when the last such task ended · frames per second after start-up.
// Numbers come from a headless browser that paints with the CPU, so they are
// much slower than a real PC with a graphics card: compare before/after on the same machine, do not read them as what a player sees.
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const ROOT=path.join(__dirname,'..');
const TYPES={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.png':'image/png','.jpg':'image/jpeg','.svg':'image/svg+xml','.woff2':'font/woff2'};
function serve(){return new Promise(res=>{const s=http.createServer((q,r)=>{let p=decodeURIComponent(q.url.split('?')[0]);if(p.endsWith('/'))p+='index.html';const f=path.join(ROOT,p);if(!f.startsWith(ROOT)||!fs.existsSync(f)||fs.statSync(f).isDirectory()){r.writeHead(404);r.end();return}r.writeHead(200,{'content-type':TYPES[path.extname(f)]||'application/octet-stream','content-length':fs.statSync(f).size});fs.createReadStream(f).pipe(r)});s.listen(0,()=>res(s))})}
(async()=>{const server=await serve(),base='http://localhost:'+server.address().port+'/',browser=await chromium.launch();
 const pages=process.argv.slice(2).length?process.argv.slice(2):['village-town.html','world-map.html'];
 for(const pg of pages){const p=await browser.newPage({viewport:{width:1280,height:720}});const files=[];
  p.on('response',r=>{const h=r.headers();files.push(+h['content-length']||0)});
  await p.addInitScript(()=>{try{localStorage.setItem('projectA.autoRes','0')}catch(e){}window.__lt=[];new PerformanceObserver(l=>{for(const e of l.getEntries())__lt.push([e.startTime,e.duration])}).observe({type:'longtask',buffered:true})});
  await p.goto(base+pg,{waitUntil:'load'});await p.waitForTimeout(24000);
  const r=await p.evaluate(()=>new Promise(res=>{const big=__lt.filter(x=>x[1]>300),out={blockedMs:Math.round(big.reduce((a,x)=>a+x[1],0)),lastBlockEndMs:Math.round(big.length?Math.max(...big.map(x=>x[0]+x[1])):0),bigTasks:big.length};
   let n=0,t=performance.now();const f=()=>{n++;if(performance.now()-t>3000){out.fps=+(n/3).toFixed(1);res(out)}else requestAnimationFrame(f)};requestAnimationFrame(f)}));
  console.log(pg.padEnd(22),'files',String(files.length).padStart(4),'· MB',(files.reduce((a,b)=>a+b,0)/1048576).toFixed(1).padStart(5),'· blocked',(r.blockedMs/1000).toFixed(1)+'s','· last heavy task ends',(r.lastBlockEndMs/1000).toFixed(1)+'s','· fps',r.fps);
  await p.close()}
 await browser.close();server.close()})();
