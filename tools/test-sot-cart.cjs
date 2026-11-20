/* v98.881 · Run: node tools/test-sot-cart.cjs — the user's case (20 Nov 2026): move the guild → "push layout" goes into the Cart as a staged snapshot (not pushed) → reload → ↩ revert → guild back, nothing stale left in the Cart */
const { chromium } = require('playwright'); const http = require('http'), fs = require('fs'), path = require('path');
const root = path.join(__dirname, '..'), types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };
const srv = http.createServer((q, r) => { let f = path.join(root, decodeURIComponent(q.url.split('?')[0])); if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.statusCode = 404; return r.end() } r.setHeader('content-type', types[path.extname(f)] || 'application/octet-stream'); fs.createReadStream(f).pipe(r) });
srv.listen(0, async () => { const b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1500, height: 900 } }), errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => d.accept());
  const url = 'http://localhost:' + srv.address().port + '/village-town.html?edit=1'; await p.goto(url); await p.waitForTimeout(8000);
  const st = () => p.evaluate(async () => { const o = locations.find(x => x.id === 'custom-mvq8veu1'), s = await GitHubPush.cart.summary(); return { guild: o && [o.x, o.y], layoutDraft: EditorStore.layoutDraft(), cartFiles: [...s.all.keys()], cartKeys: s.meta.keys, layoutInCart: s.layout } });
  console.log('start ', JSON.stringify(await st()));
  /* move the guild, then stage an OLD-STYLE snapshot of the layout + settings in the cart (what the earlier build did) */
  await p.evaluate(async () => { const o = locations.find(x => x.id === 'custom-mvq8veu1'); o.x += 18; o.y += 9; TownUX.persist();
    const snap = TownUX.snapshot(), body = '// x\nwindow.VillageDefaultLayout=' + JSON.stringify(snap, null, 2) + ';\n', gs = { ...window.GAME_SETTINGS, 'walk-speed-v1': '{"x":1}' };
    const db = await new Promise(r => { const q = indexedDB.open('asset-studio', 1); q.onupgradeneeded = () => q.result.createObjectStore('kv'); q.onsuccess = () => r(q.result) });
    await new Promise(r => { const t = db.transaction('kv', 'readwrite'); t.objectStore('kv').put([['js/village-layout-v67.js', new Blob([body])], ['js/game-settings.js', new Blob(['window.GAME_SETTINGS=' + JSON.stringify(gs, null, 1) + ';\n'])]], 'cart-files'); t.objectStore('kv').put({ log: [{ label: 'Village layout from editor', at: Date.now(), n: 2, paths: [], keys: [], page: 'x' }], keys: [] }, 'cart-meta'); t.oncomplete = r }) });
  await p.reload(); await p.waitForTimeout(8000);
  console.log('staged', JSON.stringify(await st()));
  await p.evaluate(() => GitHubPush.cart.open()); await p.waitForTimeout(700);
  await Promise.all([p.waitForNavigation({ timeout: 15000 }).catch(() => null), p.evaluate(() => { const d = document.getElementById('ghCart') || window.top.document.getElementById('ghCart'); d.querySelector('#ghCartRevert').click() })]); await p.waitForTimeout(8000);
  console.log('revert', JSON.stringify(await st()));
  const r0 = JSON.parse(JSON.stringify(await st())); let bad = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) bad++ };
  ok(r0.guild[0] === 7.5 && r0.guild[1] === 53.111111, 'guild back at the pushed position'); ok(!r0.layoutDraft && !r0.cartFiles.length && !r0.cartKeys.length, 'no draft and nothing stale left in the cart'); ok(!errs.length, 'no page errors');
  await b.close(); srv.close(); process.exit(bad ? 1 : 0) });
