/* v98.416 · RESOLUTION AUDIT — for every picture a page draws (canvas drawImage + <img>), the biggest size it is ever drawn at (device px) vs the size of the file.
   Needs the dev server (node tools/dev-server.cjs --port 8765) and Playwright.
   Run:     node tools/audit-resolution.cjs '[["village","village-town.html",22000,[["wheel",6]]],["battle","battle-field.html?battle=1",20000,[]]]' 1 out.json
            args: pages JSON [[name, url, waitMs, actions]] · device pixel ratio (1 = standard screen, 2 = retina) · output file
   Read it: node tools/audit-resolution.cjs --report out.json   → pictures drawn at less than 40% of their size (sorted by wasted memory)
   Limits: CSS background-image is not seen · only what the script reaches (default view + a little zoom) · a sprite SHEET is measured by the cell drawn. */
const {chromium}=require('playwright'),fs=require('fs');
if (process.argv[2] === '--report') { const d = require(require('path').resolve(process.argv[3])), best = {};
  for (const M of Object.values(d)) for (const [k, r] of Object.entries(M)) { if (k.startsWith('data:')) continue; const f = k.replace(/^https?:\/\/[^/]+\//, '').split('?')[0], b = best[f] || (best[f] = { nw: r.nw, nh: r.nh, sw: 0, sh: 0, need: 0 }); b.sw = Math.max(b.sw, r.sw || r.nw); b.sh = Math.max(b.sh, r.sh || r.nh); b.need = Math.max(b.need, r.dw, r.dh) }
  const rows = Object.entries(best).map(([f, b]) => ({ f, nat: b.nw + 'x' + b.nh, need: Math.round(b.need), ratio: Math.max(b.sw, b.sh) / Math.max(1, b.need), mb: b.nw * b.nh * 4 / 1048576 })).filter(r => r.ratio > 2.5).sort((a, b) => b.mb - a.mb);
  console.log('drawn at under 40% of the file size:', rows.length); for (const r of rows.slice(0, 60)) console.log(r.ratio.toFixed(1).padStart(5) + 'x', r.nat.padEnd(10), 'needs ~' + r.need, r.mb.toFixed(0).padStart(3) + 'MB', r.f); process.exit(0) }
const PAGES=JSON.parse(process.argv[2]),DPR=+process.argv[3]||1,OUT=process.argv[4];
const hook=()=>{const M=window.__draws={};const rec=(img,sw,sh,dw,dh,g)=>{try{if(!(img instanceof HTMLImageElement))return;const t=g.getTransform(),sx=Math.hypot(t.a,t.b),sy=Math.hypot(t.c,t.d);const key=img.currentSrc||img.src;if(!key)return;const w=Math.abs(dw*sx),h=Math.abs(dh*sy);if(!(w>0&&h>0))return;const r=M[key]||(M[key]={nw:img.naturalWidth,nh:img.naturalHeight,sw:0,sh:0,dw:0,dh:0,n:0});r.n++;r.sw=Math.max(r.sw,sw);r.sh=Math.max(r.sh,sh);r.dw=Math.max(r.dw,w);r.dh=Math.max(r.dh,h)}catch(e){}};
 const o=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(img,...a){try{if(a.length===2||a.length===4){const w=a.length===4?a[2]:(img.naturalWidth||img.width),h=a.length===4?a[3]:(img.naturalHeight||img.height);rec(img,img.naturalWidth||img.width,img.naturalHeight||img.height,w,h,this)}else if(a.length===8)rec(img,a[2],a[3],a[6],a[7],this)}catch(e){}return o.call(this,img,...a)}};
(async()=>{const b=await chromium.launch(),res={};
for(const [name,url,wait,acts] of PAGES){const p=await b.newPage({viewport:{width:1440,height:900},deviceScaleFactor:DPR});await p.addInitScript(hook);p.on('pageerror',()=>{});
 try{await p.goto('http://localhost:8765/'+url,{timeout:60000});await p.waitForTimeout(wait||15000);
  for(const a of acts||[]){try{if(a[0]==='click')await p.click(a[1],{timeout:2000});if(a[0]==='wheel'){await p.mouse.move(720,450);for(let i=0;i<a[1];i++){await p.mouse.wheel(0,-300);await p.waitForTimeout(120)}}if(a[0]==='eval')await p.evaluate(a[1]);if(a[0]==='wait')await p.waitForTimeout(a[1])}catch(e){}}
  await p.waitForTimeout(2500);
  const draws=await p.evaluate(()=>{const M=window.__draws||{};for(const im of document.images){const r=im.getBoundingClientRect(),w=r.width*devicePixelRatio,h=r.height*devicePixelRatio,k=im.currentSrc||im.src;if(!k||!(w>0))continue;const o=M[k]||(M[k]={nw:im.naturalWidth,nh:im.naturalHeight,sw:im.naturalWidth,sh:im.naturalHeight,dw:0,dh:0,n:0});o.dw=Math.max(o.dw,w);o.dh=Math.max(o.dh,h);o.dom=1}return M});
  res[name]=draws;console.log(name,Object.keys(draws).length,'pictures')}catch(e){console.log(name,'FAILED',e.message.slice(0,80))}
 await p.close()}
fs.writeFileSync(OUT,JSON.stringify(res));await b.close()})();
