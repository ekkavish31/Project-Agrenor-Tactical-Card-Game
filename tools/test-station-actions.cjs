/* v98.437 · node tools/test-station-actions.cjs [--write <file>] [--compare <file>]
   Plays every work-station activity of the sub-maps through the real game page (index.html → runPlaceAction, the same path
   js/village-town-bridge.js uses when you press a station in village-place.html) and records what each one did to the save:
   stamina · minutes · fatigue · coins · materials · forge work · inventory size · which dialog/panel opened.
   Math.random is seeded so two runs are comparable. Use --write before removing old code and --compare after: any difference
   in game rules shows up as a changed line. Without flags it only checks that nothing throws. Starts its own static server. */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null };
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.jpg': 'image/jpeg', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2' };
const server = http.createServer((q, r) => { let p = decodeURIComponent(q.url.split('?')[0]); if (p === '/') p = '/index.html'; const f = path.join(ROOT, p); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); r.end(); return } r.writeHead(200, { 'Content-Type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r) });
const PLAN = { forge: ['smelt', 'smelt', 'forge', 'forge', 'forge', 'forge', 'forge', 'water', 'recipes', 'rest', 'auto', 'cancel'], market: ['buy', 'sell', 'shop', 'orders', 'cards'], home: ['chest', 'deck', 'bed', 'rest', 'sleep'] };
(async () => {
  await new Promise(r => server.listen(0, r)); const BASE = 'http://localhost:' + server.address().port + '/';
  const { chromium } = require('playwright'), b = await chromium.launch(), p = await b.newPage({ viewport: { width: 1440, height: 860 } }), errors = [];
  p.on('pageerror', e => errors.push(e.message.slice(0, 200))); p.on('dialog', d => d.accept());
  await p.addInitScript(() => { let x = 12345; Math.random = () => ((x = (x * 1103515245 + 12345) % 2147483648) / 2147483648); try { localStorage.clear() } catch (e) { } });
  await p.goto(BASE + 'index.html?skipTitle=1'); await p.waitForTimeout(9000);
  const lines = [];
  const snap = () => p.evaluate(() => { const v = s.village, open = [...document.querySelectorAll('dialog[open]')].map(d => d.id + ':' + (d.querySelector('h2,h3,#panelTitle')?.textContent || '').trim().slice(0, 30));
    return { place: v.location, stamina: s.stamina, minutes: s.minutes, fatigue: s.fatigue, hp: s.hp, coins: v.coins, mat: v.materials, work: v.work, inv: (s.inventory || []).length, day: s.day, open } });
  const reset = loc => p.evaluate(l => { for (const d of document.querySelectorAll('dialog[open]')) try { d.close() } catch (e) { } busy = false; s.mode = 'forge'; s.minutes = 480; s.stamina = 100; s.hp = 60; s.fatigue = 0; s.village.location = l; for (const k in s.village.materials) s.village.materials[k] = 20; s.village.coins = 500 }, loc);
  for (const [place, ids] of Object.entries(PLAN)) {
    await reset(place); lines.push(place + ' start ' + JSON.stringify(await snap()));
    for (const id of ids) {
      const r = await p.evaluate(async id => { busy = false; for (const d of document.querySelectorAll('dialog[open]')) try { d.close() } catch (e) { }
        try { await Promise.race([runPlaceAction(id), new Promise(r => setTimeout(r, 15000))]); return 'ok' } catch (e) { return 'ERR ' + e.message } }, id);
      await p.waitForTimeout(500); lines.push(place + ':' + id + ' ' + r + ' ' + JSON.stringify(await snap()));
    }
  }
  await b.close(); server.close();
  const out = lines.join('\n') + '\n', w = arg('--write'), c = arg('--compare');
  if (w) fs.writeFileSync(w, out);
  let bad = errors.length;
  if (c) { const old = fs.readFileSync(c, 'utf8').trim().split('\n'), now = out.trim().split('\n');
    /* the game clock keeps running in real time, so minutes may drift by a few between runs — everything else must match exactly */
    const same = (a, b) => { if (a === b) return true; const ia = (a || '').indexOf('{'), ib = (b || '').indexOf('{'); if (ia < 0 || ib < 0 || a.slice(0, ia) !== b.slice(0, ib)) return false;
      try { const x = JSON.parse(a.slice(ia)), y = JSON.parse(b.slice(ib)); delete x.minutes; delete y.minutes; return JSON.stringify(x) === JSON.stringify(y) } catch (e) { return false } };
    /* the game clock also runs with real time (an animation that took a second used to cost a game minute), so minutes are compared per step:
       how many minutes the action itself added, ± 3 */
    const mins = l => { const i = (l || '').indexOf('{'); try { return JSON.parse(l.slice(i)).minutes } catch (e) { return null } };
    const step = (L, i) => i && L[i].split(' ')[0].split(':')[0] === L[i - 1].split(' ')[0].split(':')[0] ? mins(L[i]) - mins(L[i - 1]) : 0;
    for (let i = 0; i < Math.max(old.length, now.length); i++) if (!same(old[i], now[i]) || Math.abs(step(old, i) - step(now, i)) > 3) { bad++; console.log('✗ changed\n  before: ' + old[i] + '\n  after:  ' + now[i]) } }
  for (const e of errors) console.log('✗ page error: ' + e);
  console.log(bad ? `✗ station actions: ${bad} problem(s)` : `✓ station actions: ${lines.length} steps · no page errors${c ? ' · same as ' + c : ''}`);
  process.exit(bad ? 1 : 0);
})();
