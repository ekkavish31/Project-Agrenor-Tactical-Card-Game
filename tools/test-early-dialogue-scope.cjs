/* v98.1030 · node tools/test-early-dialogue-scope.cjs — what any villager can say from the FIRST day must stay inside the prologue's scope (docs/lore/GAME-ERA.md "ข้อตกลงที่ใช้ในเกม",
   MAIN-STORY-CANON.md spoiler levels): no ancient names, no plate before the festival night, none of the mid-game secrets. Checks the ALWAYS-available pools:
   NPC lines / about / origin / trait / story (js/village-life.js) and the voice pools open · close · small · meet · friend, pair chats and scenes (js/village-lines.js).
   Event reactions (boss:win · night:wisp · journey …) and WANTS only fire after the prologue, so they are checked for ancient NAMES only.
   Needs Playwright (loads village-town.html). EXEMPT = a line the owner has not decided yet (listed so it stays visible). */
const http = require('http'), fs = require('fs'), path = require('path'), assert = require('assert'), { chromium } = require('playwright');
const ROOT = path.join(__dirname, '..'), MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png' };
const srv = http.createServer((q, r) => { const f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0])); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end() } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r) });
const NAMES = /Glae|Paelas|Aeth|Veshra|Zern|Wyridean|Vaelari|Nul'Duum|Xyriel|ไซรีเอล|\bVQ\b|รอยหมอง|ก้อนหิว|กากวิญญาณ|ผู้เฝ้าแสง|นักล่าเงา|Frostmere|ฟรอสต์เมียร์|นิกายรอรุ่งอรุณ|เซอร์เรียน|Corvin|คอร์วิน/;
const PLATE = /จานหิน|แผ่นหิน|หินที่มีเส้นแสง/;
const EXEMPT = new Set(['SCENES[41].lines[2][1]']);   /* Lin's half-remembered chant "Glae… Glaela…" — a fragment, not explained; owner to decide */
(async () => {
  await new Promise(r => srv.listen(0, r)); const base = 'http://localhost:' + srv.address().port + '/', b = await chromium.launch(), p = await b.newPage();
  await p.goto(base + 'village-town.html'); await p.waitForTimeout(12000);
  const rows = await p.evaluate(() => { const out = []; const walk = (v, k, src) => { if (typeof v === 'string') { if (/[฀-๿]/.test(v) && v.length > 6) out.push({ src, k, t: v }) } else if (Array.isArray(v)) v.forEach((x, i) => walk(x, k + '[' + i + ']', src)); else if (v && typeof v === 'object') for (const q of Object.keys(v)) { if (typeof v[q] !== 'function') walk(v[q], k ? k + '.' + q : q, src) } };
    for (const [id, pp] of Object.entries(window.VillageLife.P)) { const { look, sched, visit, recruit, home, gate, ...rest } = pp; walk(rest, id, 'life') }
    const L = window.VillageLines; for (const k of ['V', 'PERSONAL', 'GOSSIP', 'PAIR', 'SCENES', 'WANTS']) walk(L[k], k, 'lines'); return out });
  await b.close(); srv.close();
  const early = r => (r.src === 'life' && !/\.story$/.test(r.k)) ||   /* `story` = the writer's background note for the NPC (never shown to the player; only the fallback of ❔ เรื่องของเขา) — still checked for NAMES */  /^(PAIR|GOSSIP|SCENES)/.test(r.k) || /^V\.[a-z]+\.(open|close|small|meet|friend)\b/.test(r.k);   /* always available */
  const bad = [];
  for (const r of rows) { if (EXEMPT.has(r.k)) continue; if (NAMES.test(r.t) && !/^(SCENES\[13\]|PERSONAL\.graven)/.test(r.k)) bad.push(['ancient / mid-game name', r]); if (early(r) && PLATE.test(r.t)) bad.push(['plate before the festival night', r]) }
  for (const [why, r] of bad) console.log('✗', why, '·', r.k, '·', r.t.slice(0, 90));
  assert.equal(bad.length, 0, bad.length + ' line(s) outside the prologue scope');
  console.log('✓ early dialogue scope: ' + rows.length + ' lines checked, none outside the prologue scope');
})().catch(e => { console.log('✗', e.message); process.exit(1) });
