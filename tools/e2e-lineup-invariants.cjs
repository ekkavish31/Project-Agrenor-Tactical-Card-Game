// v98.529 · Scale Lineup invariants (what the game reads): a character's height in metres must NOT change when you switch the hero look (ชาย/หญิง), the tab, or the view.
// Hosts scale-lineup.html?studio=1&dock=1 inside a stub parent that behaves like Asset Studio (StudioBrowser.lineup). Run: node tools/e2e-lineup-invariants.cjs
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };
const WRAP = `<!doctype html><meta charset=utf-8><body><script>
window.__look='male';
window.StudioBrowser={lineup:{look:()=>window.__look,setLook:id=>{window.__look=id;return true},entities:()=>[{id:'hero',name:'hero',group:'characters',clips:[]}],
 async picture(id,view){if(id!=='hero')return null;const M=window.ASSET_MANIFEST;const f=M&&M.heroVariants[window.__look].studioPoses.idle[view||'SW'].frames[0].src;return {url:f,file:f,flip:false,label:'ท่ายืน '+(view||'SW')}}}};
</script><script src="/js/asset-manifest.js"></script><iframe id=f src="/scale-lineup.html?studio=1&dock=1" style="width:1300px;height:800px"></iframe>`;
const serve = () => new Promise(r => { const s = http.createServer((q, res) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/__wrap.html') { res.writeHead(200, { 'content-type': 'text/html' }); return res.end(WRAP) }
  const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end() } res.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res) }).listen(0, () => r(s)) });
(async () => {
  const server = await serve(), base = 'http://localhost:' + server.address().port, browser = await chromium.launch(), page = await browser.newPage({ viewport: { width: 1400, height: 900 } }), errs = [];
  page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('console:', m.text().slice(0, 160)) }); await page.goto(base + '/__wrap.html'); await page.waitForTimeout(7000);
  const fr = page.frames().find(f => /scale-lineup/.test(f.url())); assert.ok(fr, 'lineup frame');
  const snap = () => fr.evaluate(() => Object.fromEntries(ENTRIES.filter(e => !isW(e) && e.ctx[ctx]).map(e => [e.id, +metres(e).toFixed(4)])));
  let n = 0; const ok = (c, m) => { assert.ok(c, m); n++ };
  
  const male = await snap();
  ok(male.hero > 1.6 && male.hero < 1.8, 'open male look is the 1.70 m yardstick: ' + male.hero);
  await page.evaluate(() => { window.__look = 'female' }); await fr.evaluate(async () => { ENTRIES.length = 0; await build() }); await page.waitForTimeout(1500);
  const female = await snap();
  // the heroes must not change height when the other look is opened (ids swap names: compare by look)
  const byLook = (s, look) => s[look === 'male' ? (s['hero-male'] != null ? 'hero-male' : 'hero') : (s['hero-female'] != null ? 'hero-female' : 'hero')];
  const dM = Math.abs(byLook(male, 'male') - byLook(female, 'male')), dF = Math.abs(byLook(male, 'female') - byLook(female, 'female'));
  ok(dM < .005, 'male height unchanged when the female look is open: Δ ' + dM.toFixed(4) + ' (' + byLook(male, 'male') + ' vs ' + byLook(female, 'male') + ')');
  ok(dF < .005, 'female height unchanged when the female look is open: Δ ' + dF.toFixed(4) + ' (' + byLook(male, 'female') + ' vs ' + byLook(female, 'female') + ')');
  for (const k of Object.keys(male)) if (!/^hero/.test(k) && female[k] != null) ok(Math.abs(male[k] - female[k]) < .005, k + ' unchanged by the hero look: ' + male[k] + ' vs ' + female[k]);
  // switching tabs must not move anyone
  const tabs = await fr.evaluate(() => TABS.map(t => t[0])), base0 = await snap();
  for (const t of tabs) { await fr.evaluate(t => { tab = t; render() }, t); await page.waitForTimeout(150); const s = await snap(); for (const k of Object.keys(base0)) if (s[k] != null) ok(Math.abs(s[k] - base0[k]) < .0005, `tab ${t}: ${k} ${base0[k]} → ${s[k]}`) }
  // what the lineup shows (eff) must be what the game applies (CharScaleAdjust.factor of the scene): no hidden per-scene factor
  const eff2 = await fr.evaluate(() => ENTRIES.filter(e => !isW(e) && e.ctx[ctx] && !/^hero/.test(e.id)).map(e => ({ id: e.id, mon: e.kind === 'monster', shown: +CharScaleAdjust.factor('main', AK(e.id), { global: ADJ.global, scene: {} }).toFixed(4), game: +CharScaleAdjust.factor(e.kind === 'monster' ? 'battle' : 'village', AK(e.id)).toFixed(4) })));
  for (const r of eff2) ok(Math.abs(r.shown - r.game) < .0005, `${r.id}: lineup shows ×${r.shown} but the game applies ×${r.game}`);
  ok(!errs.length, 'no page errors: ' + errs.slice(0, 2));
  console.log('lineup invariants: ' + n + ' ok'); await browser.close(); server.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1) });
