// v98.111 · with an active quest step, TownQuest.targets() and Interactables.all() called each other until the stack overflowed (~2,500-4,300 calls EVERY frame). Now a handful.
// Run: node tools/e2e-quest-recursion.cjs   (needs Playwright + Chromium; serves the repo itself)
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };
const serve = () => new Promise(r => { const s = http.createServer((q, res) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end() } res.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res) }); s.listen(0, () => r(s)) });
(async () => {
  const server = await serve(), base = 'http://localhost:' + server.address().port + '/', browser = await chromium.launch(), p = await (await browser.newContext({ viewport: { width: 1300, height: 800 } })).newPage(); const errs = []; p.on('pageerror', e => errs.push(e.message));
  await p.goto(base + 'index.html'); await p.waitForTimeout(20000);
  await p.evaluate(() => { window.Story = window.Story || {}; window.Story.questTargets = () => ({ id: 't', npc: ['kier'], place: ['market'], exit: true, spots: [], label: 'ทดสอบ' }) }); await p.waitForTimeout(3000);
  const r = await p.evaluate(async () => { const f = [...document.querySelectorAll('iframe')].find(x => { try { return x.contentWindow.Interactables } catch (e) { return false } }), w = f ? f.contentWindow : window; let n = 0, tn = 0; const o = w.Interactables.all, q = w.TownQuest.targets;
    w.Interactables.all = function () { n++; return o.apply(this, arguments) }; w.TownQuest.targets = function () { tn++; return q.apply(this, arguments) };
    let fr = 0; await new Promise(res => { const g = () => { fr++; fr >= 30 ? res() : w.requestAnimationFrame(g) }; w.requestAnimationFrame(g) }); w.Interactables.all = o; w.TownQuest.targets = q; return { all: n / fr, targets: tn / fr, markers: w.TownQuest.targets().length } });
  assert.ok(r.markers > 0, 'a quest step must be active in the test'); assert.ok(r.all < 20 && r.targets < 20, 'calls per frame: ' + JSON.stringify(r)); console.log('ok calls per frame', JSON.stringify(r));
  await browser.close(); server.close(); console.log('quest recursion e2e: all cases passed');
})().catch(e => { console.error('FAIL', e.message); process.exit(1) });
