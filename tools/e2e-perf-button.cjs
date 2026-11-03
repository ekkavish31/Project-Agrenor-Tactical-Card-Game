// v98.98 · Settings has a "📊 วัดประสิทธิภาพ" button that runs the speed check without ?perf=1 and produces a copyable report.
// Run: node tools/e2e-perf-button.cjs   (needs Playwright + Chromium; serves the repo itself)
const http = require('node:http'), fs = require('node:fs'), path = require('node:path'), assert = require('node:assert/strict');
const { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), T = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };
const serve = () => new Promise(r => { const s = http.createServer((q, res) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html'; const f = path.join(ROOT, p);
  if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end() } res.writeHead(200, { 'content-type': T[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(res) }); s.listen(0, () => r(s)) });
(async () => {
  const server = await serve(), base = 'http://localhost:' + server.address().port + '/', browser = await chromium.launch(), p = await (await browser.newContext({ viewport: { width: 1200, height: 800 } })).newPage();
  const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.goto(base + 'index.html'); await p.waitForTimeout(4000);
  assert.ok(await p.evaluate(() => typeof openSettings === 'function' && !!window.SpeedCheck && typeof GameSettings.perf === 'function'), 'settings.perf / SpeedCheck missing');
  await p.evaluate(() => openSettings()); await p.waitForTimeout(500);
  const btn = p.locator('text=📊 วัดประสิทธิภาพ'); assert.equal(await btn.count(), 1, 'button must be in Settings');
  await btn.evaluate(b => b.click()); await p.waitForTimeout(12000);
  const txt = (await Promise.all(p.frames().map(f => f.evaluate(() => [...document.querySelectorAll('pre')].map(d => d.textContent).find(t => /เสร็จ/.test(t)) || '').catch(() => '')))).find(Boolean) || '';   // the report appears in the visible game frame (the village)
  assert.match(txt, /ความกระตุก:/); assert.match(txt, /ตอนเล่น: [\d.]+ fps/); assert.match(txt, /ฉาก:/); assert.ok((await Promise.all(p.frames().map(f => f.locator('text=📋 คัดลอกผล').count().catch(() => 0)))).some(n => n >= 1), 'copy button');
  console.log('ok report:\n' + txt.split('\n').slice(0, 8).join('\n'));
  // v98.100 · live HUD is visible and Ctrl+Shift+P toggles it
  const hud = () => Promise.all(p.frames().map(f => f.evaluate(() => !!window.SpeedCheck && SpeedCheck.hudOn()).catch(() => false))).then(a => a.some(Boolean));
  assert.ok(await hud(), 'live fps HUD must be on after the check');
  await p.keyboard.press('Control+Shift+P'); await p.waitForTimeout(800); assert.ok(!(await hud()), 'Ctrl+Shift+P closes the finished check');
  await p.keyboard.press('Control+Shift+P'); await p.waitForTimeout(1500); assert.ok(await hud(), 'Ctrl+Shift+P starts the check + HUD'); console.log('ok hotkey + live HUD');
  assert.deepEqual(errs, [], errs.join('|')); console.log('perf button e2e: all cases passed'); await browser.close(); server.close();
})().catch(e => { console.error('FAIL', e.message); process.exit(1) });
