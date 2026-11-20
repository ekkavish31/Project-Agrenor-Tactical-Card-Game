/* T1 (docs/TODO.md §35) · does every character look the SAME SIZE in every map as in ⚖ Scale Lineup, in every pose and direction?
   Rule (§35.0): pose sheet (📐) → Scale Lineup (⚖) → map multiplier → scene.   size on screen = base of the scene × map multiplier × global[id]  (friends / villagers are 1.45 ÷ 1.6 of the hero).
   Two checks:
     A · POSES  (needs asset-studio.html's catalogue): the silhouette height of every walk / idle clip of hero, ally:* and npc:*, first frame of each clip AND every frame,
         compared with idle SW. The rule says every pose·direction·frame of ONE character is the same height — so this is what the pose sheet has to make true.
         (windup / strike / guard / hit / down are crouching / lying poses: their silhouette is NOT a height, they are listed without a verdict — the pose sheet's datum decides.)
     B · SCENES (real drawing): in battle, village, sub-map, room and world map the on-screen canvas of the hero is compared with the canvas of every friend / villager that gets drawn:
         measured ratio vs  (1.45 ÷ 1.6) × factor(id) ÷ factor(hero)   — the number Scale Lineup stands for.  The two hero looks (male / female) are compared the same way.
   node tools/test-scale-consistency.cjs            report only (exit 0)       --check   exit 1 when a number is off by more than --tol (default 2 %)
   --only=A|B   --tol=2   --json=path   --scene=battle,village,place,interior,world   (starts its own static server) */
const http = require('http'), fs = require('fs'), path = require('path'), ROOT = path.join(__dirname, '..');
const arg = n => (process.argv.find(a => a.startsWith('--' + n + '=')) || '').split('=')[1], flag = n => process.argv.includes('--' + n);
const TOL = +(arg('tol') || 2) / 100, ONLY = arg('only') || '', CHECK = flag('check'), SCENES = (arg('scene') || 'battle,village,place,interior,world').split(',');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'application/javascript', '.css': 'text/css', '.json': 'application/json', '.webp': 'image/webp', '.png': 'image/png', '.mp3': 'audio/mpeg', '.woff2': 'font/woff2', '.svg': 'image/svg+xml' };
const srv = http.createServer((q, r) => { const p = decodeURIComponent(q.url.split('?')[0]), f = path.join(ROOT, p === '/' ? 'index.html' : p); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { r.writeHead(404); return r.end() } r.writeHead(200, { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(r) });
const pct = x => (x >= 0 ? '+' : '') + (x * 100).toFixed(1) + '%';
const out = { A: [], B: [] }; let bad = 0;

/* in-page: the same silhouette measure as scale-lineup.html (alpha > 40, stray specks < 2 % ignored) */
const MEASURE = `window.__measure = function (img) {
  const w = img.naturalWidth, h = img.naturalHeight, c = document.createElement('canvas'); c.width = w; c.height = h;
  const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0); const d = g.getImageData(0, 0, w, h).data;
  const lab = new Int32Array(w * h), area = [0]; let n = 0, tot = 0, st = [];
  for (let i = 0; i < w * h; i++) { if (d[i * 4 + 3] <= 40 || lab[i]) continue; n++; let a = 0; st.push(i); lab[i] = n;
    while (st.length) { const j = st.pop(), x = j % w, y = (j - x) / w; a++;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = x + dx, yy = y + dy; if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue; const k = yy * w + xx; if (!lab[k] && d[k * 4 + 3] > 40) { lab[k] = n; st.push(k) } } }
    area.push(a); tot += a }
  let y0 = h, y1 = -1; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const l = lab[y * w + x]; if (l && area[l] >= tot * .02) { if (y < y0) y0 = y; if (y > y1) y1 = y } }
  return y1 < 0 ? null : { H: y1 - y0 + 1, top: y0, bottom: y1 }
}`;

async function partA(b) {
  console.log('\n══ A · ท่า / ทิศ / เฟรม ของตัวละครตัวเดียว (ความสูงเงา เทียบ idle SW) ══');
  const p = await b.newPage({ viewport: { width: 1500, height: 900 } }); await p.addInitScript(MEASURE);
  await p.goto(BASE + 'asset-studio.html', { waitUntil: 'load', timeout: 90000 }); await p.waitForFunction(() => window.StudioBrowser?.state?.model?.length > 50, null, { timeout: 90000 }).catch(() => { }); await p.waitForTimeout(1500);
  const rows = await p.evaluate(async () => {
    const m = StudioBrowser.state.model.filter(e => e.id === 'hero' || /^(ally|npc):/.test(e.id)), res = [];
    const load = f => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.onerror = () => r(null); i.src = f });
    for (const e of m) {
      const idle = (e.clips || []).find(c => c.action === 'idle' && c.view === 'SW' && c.frames?.length); if (!idle) { res.push({ id: e.id, skip: 'ไม่มี idle SW' }); continue }
      const im0 = await load(idle.frames[0].file), m0 = im0 && __measure(im0); if (!m0) { res.push({ id: e.id, skip: 'วัด idle SW ไม่ได้' }); continue }
      const clips = [];
      for (const c of e.clips || []) { if (!c.frames?.length) continue; const hs = []; for (const f of c.frames.slice(0, 16)) { const im = await load(f.file), mm = im && __measure(im); if (mm) hs.push(mm.H) } if (hs.length) clips.push({ pose: c.action, view: c.view, n: c.frames.length, first: hs[0], min: Math.min(...hs), max: Math.max(...hs) }) }
      res.push({ id: e.id, ref: m0.H, clips });
    }
    return res;
  });
  const LOOP = new Set(['idle', 'walk']);
  for (const r of rows) {
    if (r.skip) { console.log('· ' + r.id.padEnd(14) + ' (ข้าม: ' + r.skip + ')'); continue }
    const loops = r.clips.filter(c => LOOP.has(c.pose)), dev = c => c.first / r.ref - 1, spread = c => c.max / c.min - 1;
    const worst = loops.reduce((a, c) => Math.abs(dev(c)) > Math.abs(a ? dev(a) : 0) ? c : a, null), wsp = loops.reduce((a, c) => spread(c) > (a ? spread(a) : 0) ? c : a, null);
    const badLoops = loops.filter(c => Math.abs(dev(c)) > TOL), badSp = loops.filter(c => spread(c) > TOL);
    console.log((badLoops.length || badSp.length ? '✗ ' : '✓ ') + r.id.padEnd(14) + ' idle SW = ' + r.ref + ' px · ท่าเดิน/ยืน ' + loops.length + ' คลิป · ต่างจาก idle SW มากสุด ' + (worst ? worst.pose + '/' + worst.view + ' ' + pct(dev(worst)) : '—') + ' · ความต่างระหว่างเฟรมในคลิปมากสุด ' + (wsp ? wsp.pose + '/' + wsp.view + ' ' + pct(spread(wsp)) : '—') + ' · เกิน ' + (TOL * 100) + '%: ' + badLoops.length + ' คลิป (เฟรมแรก) / ' + badSp.length + ' คลิป (ระหว่างเฟรม)');
    for (const c of badLoops) console.log('      ' + (c.pose + '/' + c.view).padEnd(12) + ' เฟรมแรก ' + c.first + ' px (' + pct(dev(c)) + ')');
    out.A.push({ id: r.id, ref: r.ref, loops: loops.map(c => ({ ...c, dev: +dev(c).toFixed(4), spread: +spread(c).toFixed(4) })), others: r.clips.filter(c => !LOOP.has(c.pose)).map(c => ({ pose: c.pose, view: c.view, first: c.first, dev: +dev(c).toFixed(4) })) });
    bad += badLoops.length + badSp.length;
  }
  await p.close();
}

/* in-page, per scene: record the on-screen height of every character 384-canvas that is drawn (Texel normalising OFF so the original draw call is seen) */
const HOOK = () => {
  try { localStorage.setItem('projectA.texelNorm', '0') } catch (e) { }
  window.__d = {}; const o = CanvasRenderingContext2D.prototype.drawImage;
  CanvasRenderingContext2D.prototype.drawImage = function (im, ...a) {
    try { const s = im && im.src; if (s && /assets\/(tactics|village-town\/npc|characters)\//.test(s) && !/(props|ground|nature|decor|knife|rock|weapon)/.test(s) && im.naturalWidth === 384) {
      let dh; if (a.length >= 8) dh = a[7]; else if (a.length >= 4) dh = a[3]; else dh = im.naturalHeight; const m = this.getTransform(), sc = Math.hypot(m.a, m.b), k = s.replace(/^https?:\/\/[^/]+\//, '').replace(/\?.*/, '');
      (window.__d[k] ||= []).push(+(dh * sc).toFixed(2)) } } catch (e) { } return o.call(this, im, ...a) };
};
const idOf = k => { let m; if ((m = k.match(/^assets\/village-town\/npc\/([a-z]+)\//))) return m[1]; if ((m = k.match(/^assets\/tactics\/imported\/ally-([a-z]+)-/))) return m[1]; if ((m = k.match(/^assets\/tactics\/([a-z]+)_(sw|se|ne|nw)_/))) return m[1]; if (/^assets\/tactics\/imported\/(idle|walk|windup|strike|guard|hit|down)-/.test(k)) return 'hero:male'; if (/^assets\/characters\/hero-female\//.test(k)) return 'hero:female'; if (/^assets\/characters\/hero/.test(k)) return 'hero:male'; return null };

async function partB(b) {
  console.log('\n══ B · ขนาดจริงบนจอ แต่ละฉาก (แคนวาส 384 ของตัวเอก เทียบเพื่อน/ชาวบ้าน) ══');
  const SC = { battle: ['battle-field.html?battle=1', 'battle', 8000], village: ['village-town.html', 'village', 10000], place: ['village-place.html?place=market', 'village', 9000], interior: ['place-interior.html', 'village', 7000], world: ['world-map.html', 'world', 6000] };
  for (const sc of SCENES) {
    const [pg, ctx, wait] = SC[sc] || []; if (!pg) continue;
    const p = await b.newPage({ viewport: { width: 1280, height: 720 } }); await p.addInitScript(HOOK);
    await p.goto(BASE + pg, { waitUntil: 'load', timeout: 60000 }).catch(() => { }); await p.waitForTimeout(wait);
    const r = await p.evaluate(([ctx]) => { const A = window.CHARACTER_SCALE_ADJUST, F = window.CharScaleAdjust, DS = window.CharSize?.DRAW || { hero: 1.6, ally: 1.45 }; if (!F || !A) return { err: 'ไม่มี CharScaleAdjust' };
      const f = id => F.factor(ctx, id, A); return { d: window.__d, fm: f('hero'), ff: f('hero-female'), ally: DS.ally / DS.hero, adj: Object.fromEntries(Object.keys(A.global || {}).map(k => [k, f(k)])) } }, [ctx]);
    await p.close();
    if (r.err) { console.log('· ' + sc + ': ' + r.err); continue }
    const by = {}; for (const [k, v] of Object.entries(r.d)) { const id = idOf(k); if (!id) continue; (by[id] ||= []).push(...v) }
    const med = a => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)] };
    const hm = by['hero:male'] && med(by['hero:male']), hf = by['hero:female'] && med(by['hero:female']), ref = hm || hf, refF = hm ? r.fm : r.ff;
    console.log('\n— ' + sc + ' (' + pg + ') · ตัวเอก ชาย ' + (hm ? hm + ' px' : '—') + ' · หญิง ' + (hf ? hf + ' px' : '—'));
    if (!ref) { console.log('   ไม่เห็นตัวเอกถูกวาดในฉากนี้ (ข้าม)'); continue }
    if (hm && hf) { const exp = r.ff / r.fm, got = hf / hm, d = got / exp - 1; console.log((Math.abs(d) > TOL ? '✗ ' : '✓ ') + '   ตัวเอกหญิง÷ชาย: วัดได้ ' + got.toFixed(3) + ' · Lineup ' + exp.toFixed(3) + ' · ต่าง ' + pct(d)); if (Math.abs(d) > TOL) bad++; out.B.push({ scene: sc, id: 'hero:female/male', got, exp, d }) }
    for (const [id, vals] of Object.entries(by)) {
      if (id.startsWith('hero')) continue; const px = med(vals), lo = Math.min(...vals), hi = Math.max(...vals), fk = r.adj[id] ?? 1, exp = r.ally * fk / refF, got = px / ref, d = got / exp - 1;
      console.log((Math.abs(d) > TOL ? '✗ ' : '✓ ') + '   ' + id.padEnd(10) + ' ' + String(px).padStart(6) + ' px (ตัวเอก ' + ref + ') · วัดได้ ' + got.toFixed(3) + ' · Lineup ' + exp.toFixed(3) + ' · ต่าง ' + pct(d) + (hi - lo > .5 ? ' · [ขนาดแคนวาสไม่คงที่ ' + lo + '–' + hi + ']' : ''));
      if (Math.abs(d) > TOL) bad++; out.B.push({ scene: sc, id, px, ref, got, exp, d });
    }
  }
}

let BASE;
(async () => {
  await new Promise(r => srv.listen(0, r)); BASE = 'http://localhost:' + srv.address().port + '/';
  const { chromium } = require('playwright'), b = await chromium.launch();
  try { if (ONLY !== 'B') await partA(b); if (ONLY !== 'A') await partB(b) } finally { await b.close(); srv.close() }
  if (arg('json')) fs.writeFileSync(arg('json'), JSON.stringify(out, null, 1));
  console.log('\n' + (bad ? '✗ เกินเกณฑ์ ' + (TOL * 100) + '%: ' + bad + ' รายการ' : '✓ ทุกรายการอยู่ในเกณฑ์ ' + (TOL * 100) + '%') + (CHECK ? '' : ' (โหมดรายงาน — ใส่ --check เพื่อให้เทสต์ล้มเมื่อเกินเกณฑ์)'));
  process.exit(CHECK && bad ? 1 : 0);
})().catch(e => { console.error(e); try { srv.close() } catch (x) { } process.exit(1) });
