// v98.96 · editor shell + frame editor clean-up: ONE "waiting to push" place · no พรีวิว / เปรียบเทียบ tabs · review panel = ✔ ผ่าน / ✘ ไม่ผ่าน toggle only.
// Run: node tools/e2e-studio-ui-cleanup.cjs   (needs Playwright + Chromium; serves the repo itself)
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };
const serve = () => new Promise(r => { const s = http.createServer((q, res) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end() } res.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res) }); s.listen(0, () => r(s)) });
(async () => {
  const server = await serve(), base = 'http://localhost:' + server.address().port + '/', browser = await chromium.launch();
  // 1 editor shell: no floating pill; the top-bar button carries the "unpushed layout / settings" state
  const e = await (await browser.newContext({ viewport: { width: 1500, height: 900 } })).newPage(); const errs = []; e.on('pageerror', x => errs.push(x.message)); e.on('dialog', d => d.accept());
  await e.goto(base + 'editor.html'); await e.waitForTimeout(7000);
  assert.equal(await e.$('#layoutSync'), null, 'the floating sync pill must be gone inside editor.html');
  const label0 = await e.evaluate(() => document.getElementById('stagedPush').textContent);
  await e.evaluate(() => { LayoutSync.units().layout.st = 'unpushed'; LayoutSync.refresh() }); await e.waitForTimeout(600);
  const label1 = await e.evaluate(() => ({ t: document.getElementById('stagedPush').textContent, dis: document.getElementById('stagedPush').disabled, title: document.getElementById('stagedPush').title }));
  assert.match(label0, /รอ Push \(0\)/); assert.match(label1.t, /รอ Push \(1\)/, 'unpushed layout must count on the button: ' + label1.t); assert.equal(label1.dis, false); assert.match(label1.title, /ผังหมู่บ้าน/);
  await e.click('#stagedPush'); await e.waitForTimeout(600); assert.ok(await e.evaluate(() => !!document.querySelector('dialog[open]')), 'clicking the button with nothing staged opens the details'); console.log('ok one place for waiting-to-push:', label0, '->', label1.t);
  // 2 + 3 frame editor
  const p = await (await browser.newContext({ viewport: { width: 1700, height: 950 } })).newPage(); p.on('pageerror', x => errs.push(x.message)); p.on('dialog', d => d.accept());
  await p.goto(base + 'asset-studio.html'); await p.waitForTimeout(2000); await p.click('#conn'); await p.waitForTimeout(9000); await p.click('text=Animation'); await p.waitForTimeout(2500);
  const clip = await p.evaluate(() => StudioBrowser.state.model.find(x => x.id === 'hero').clips.find(c => c.action === 'walk' && c.view === 'SW').id);
  await p.evaluate(id => StudioUnifiedReview.open(id), clip); await p.waitForTimeout(3500);
  const tabs = await p.evaluate(() => [...document.querySelectorAll('.ur-tabs button')].map(b => b.textContent.trim())); assert.ok(tabs.includes('นำเข้า') && tabs.includes('ทั้งชุด'), 'tabs: ' + tabs); assert.ok(!tabs.includes('พรีวิว') && !tabs.includes('เปรียบเทียบ'), 'พรีวิว / เปรียบเทียบ must be gone: ' + tabs); console.log('ok tabs:', tabs.join(' | '));
  const vis = await p.evaluate(() => Object.fromEntries(['ur-flag', 'ur-issue', 'ur-note', 'ur-ai', 'ur-approve', 'ur-reject'].map(id => { const el = document.getElementById(id), box = el && (id === 'ur-flag' ? el.parentElement : el); return [id, !!box && getComputedStyle(box).display !== 'none'] })));
  assert.deepEqual(vis, { 'ur-flag': false, 'ur-issue': false, 'ur-note': false, 'ur-ai': false, 'ur-approve': true, 'ur-reject': true }, 'review panel: ' + JSON.stringify(vis));
  const state = () => p.evaluate(() => ({ t: document.getElementById('ur-review-state').textContent, a: document.getElementById('ur-approve').getAttribute('aria-pressed'), r: document.getElementById('ur-reject').getAttribute('aria-pressed') }));
  { const s0 = await state(); if (/^ผ่าน/.test(s0.t)) { await p.click('#ur-approve'); await p.waitForTimeout(700) } else if (/^ไม่ผ่าน/.test(s0.t)) { await p.click('#ur-reject'); await p.waitForTimeout(700) } assert.equal((await state()).t, 'รอตรวจ', 'start the toggle test from รอตรวจ') }
  const seq = []; for (const [btn, want] of [['#ur-approve', 'ผ่านการตรวจแล้ว'], ['#ur-approve', 'รอตรวจ'], ['#ur-reject', 'ไม่ผ่าน (ต้องแก้)'], ['#ur-reject', 'รอตรวจ'], ['#ur-reject', 'ไม่ผ่าน (ต้องแก้)'], ['#ur-approve', 'ผ่านการตรวจแล้ว']]) { await p.click(btn); await p.waitForTimeout(700); const s = await state(); assert.equal(s.t, want, btn + ' -> ' + JSON.stringify(s)); seq.push(s.t) }
  console.log('ok pass / not-pass toggle:', seq.join(' → '));
  assert.deepEqual(errs.filter(x => !/404/.test(x)), [], 'page errors: ' + errs.join(' | ')); console.log('ui cleanup e2e: all cases passed'); await browser.close(); server.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1) });
