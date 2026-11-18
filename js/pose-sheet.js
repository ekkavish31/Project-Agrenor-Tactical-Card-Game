/* v98.658 · 📐 เรียงท่า — the new proportion tool of Asset Studio (Animation tab), replacing 📐 สัดส่วน / 📍 Datum of scale-lineup.html.
   ONE character at a time: every pose (idle · walk · windup · strike · guard · hit · down) of SW and NE side by side, first frame of each pose as the stand-in
   (what is done to a pose applies to every frame of that pose), all on the same ruler: same scale, same ground line. SE / NW are the mirror copies of SW / NE.
   • DATUM POINTS (12, placed in this order): eyes L/R · chin · skull top · neck cut · shoulder L/R · crotch · leg edge L/R · foot L/R.  Numbers of each pose are shown under it
     (head · shoulder width · torso · leg length · leg thickness, px and % of the body height, and the change against the SW standing pose).
     The FOOT POINT of a pose = the middle of the two ground-contact points (heel when the heel lands, ball when the toe pushes off); for the lying pose ('down') ONE point (foot L) =
     the ground point under the middle of the torso.
   • ✋ MOVE the picture inside its canvas (drag) — "⤓ เข้าเส้นพื้น" puts the foot point on the standard ground point (192, 360). The move is real: 💾 บันทึกตำแหน่งภาพ shifts the pixels of every frame
     of that pose and stores them as new pictures (🛒 Cart → push as before). The cells show 96 px of margin around the real 384 × 384 frame (red) so a foot outside it stays visible; a save that would cut the picture is refused.
   • 🛠 ปรับ: a window with the old head / torso / legs / shoulder / thickness sliders (live preview, "ให้หัวเท่าท่ายืน SW" auto) → saved as new pictures for every frame of the pose.
   • Rulers: horizontal lines across every cell (several, any colour, dragged), two-line measures (distance in px and % of the SW standing height), a dashed centre line per cell,
     and the SW standing silhouette laid over each pose (feet on the ground point).
   • Size ± % per pose × direction → CHARACTER_SCALE_ADJUST.pose[id]['<pose>@SW|NE'] (read by CharScaleAdjust.poseFactor(id,pose,data,dir)).  Tick ✓ = checked by eye (drops by itself when the picture changes).
   Stores: localStorage 'pose-sheet-v1' (points · ticks · pending moves) → pushed with the editor settings · 'pose-sheet.scaleDraft' (sizes) · 'pose-sheet.rulers'.  Cross-character comparison stays in ⚖ Scale Lineup. */
(function (root) {
  'use strict';
  const POSES = [['idle', 'ยืน'], ['walk', 'เดิน'], ['windup', 'เตรียมโจมตี'], ['strike', 'โจมตี'], ['guard', 'ป้องกัน'], ['hit', 'โดนโจมตี'], ['down', 'นอน / ล้ม']];
  const ROWS = [['SW', 'SW (SE = กลับด้าน)'], ['NE', 'NE (NW = กลับด้าน)']], MIR = { SW: 'SE', NE: 'NW' };
  const KEY = 'pose-sheet-v1', SKEY = 'pose-sheet.scaleDraft', RKEY = 'pose-sheet.rulers';
  /* v98.711 · the datum points, in the old 📍 Datum way: both eyes · chin · skull top (a dashed head ellipse suggests it) · neck cut LINE (click the points one after another, they are joined by a line; a click-and-HOLD ends it) · shoulders L/R ·
     leg cut LINE (same way) · the width of ONE leg (its two edges) · left / right foot (the stance centre on the ground = their middle) */
  const STEPS = [['eyeL', 'ตา ซ้ายภาพ', '#d63384'], ['eyeR', 'ตา ขวาภาพ', '#d63384'], ['chin', 'คาง', '#d62d2d'], ['top', 'ยอดกะโหลก (มีวงรีแนะนำ)', '#8a4fff'], ['neck', 'เส้นตัดหัว (คอ) · คลิกเรียงจุด คลิกค้างเพื่อจบ', '#e07b00'],
    ['shL', 'ไหล่ ซ้ายภาพ', '#1f7a4d'], ['shR', 'ไหล่ ขวาภาพ', '#1f7a4d'], ['crotch', 'เส้นตัดขา (ขาหนีบ) · คลิกเรียงจุด คลิกค้างเพื่อจบ', '#1d5fbf'], ['legL', 'ความกว้างท่อนขา 1 ข้าง · ขอบซ้าย', '#0d8f99'], ['legR', 'ความกว้างท่อนขา · ขอบขวา', '#0d8f99'],
    ['footL', 'เท้า ซ้าย (จุดแตะพื้น)', '#7b4a12'], ['footR', 'เท้า ขวา (จุดแตะพื้น)', '#7b4a12']];
  const LINES = { neck: 'neckLine', crotch: 'crotchLine' };   /* P.neck / P.crotch = the middle of the line (what the numbers use) · P.neckLine / P.crotchLine = its points · P.<k>Done = the line is finished */
  const lineMid = pts => [Math.round(pts.reduce((a, q) => a + q[0], 0) / pts.length), Math.round(pts.reduce((a, q) => a + q[1], 0) / pts.length)];
  const setLine = (P, k, pts) => { P[LINES[k]] = pts; P[k] = lineMid(pts) };
  const lineOpen = (P, k) => !!(P[LINES[k]] && P[k + 'Done'] === false);
  const STEP = Object.fromEntries(STEPS.map(s => [s[0], s]));
  const SRC = 384, GX = 192, GY = 360, PAD = 96;   /* every character frame: 384 × 384, ground point (192, 360) */
  const RCOL = ['#e03131', '#1971c2', '#2f9e44', '#f08c00', '#9c36b5', '#0c8599', '#c2255c', '#5c940d'];
  const $ = id => document.getElementById(id), esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || 'null') || d } catch (e) { return d } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) { } };
  let DATA = read(KEY, {}), DRAFT = read(SKEY, {}), RUL = Object.assign({ on: true, center: true, ghost: false, lines: [], meas: [] }, read(RKEY, {}));
  const B = () => root.StudioBrowser, PA = () => root.ProportionAdjust;
  const akey = id => { id = String(id || ''); if (id === 'hero') return root.StudioVariants?.active === 'female' ? 'hero-female' : 'hero'; return id.replace(/^(ally|npc):/, '') };
  const cellKey = (pose, dir) => pose + '@' + dir;
  const saveRul = () => write(RKEY, RUL);

  /* ---------- sizes (± % per pose × direction) ---------- */
  const committed = () => root.CHARACTER_SCALE_ADJUST || {};
  function sizeOf(id, pose, dir) {
    const k = akey(id), d = DRAFT[k]?.[cellKey(pose, dir)]; if (typeof d === 'number') return d;
    const m = committed().pose?.[k]; const v = m?.[cellKey(pose, dir)] ?? m?.[pose]; return typeof v === 'number' && v > .2 && v < 3 ? v : 1;
  }
  function setSize(id, pose, dir, v) { const k = akey(id); v = Math.max(.3, Math.min(2.5, Math.round(v * 1000) / 1000)); (DRAFT[k] ||= {})[cellKey(pose, dir)] = v; write(SKEY, DRAFT); draw(); status() }
  const draftCount = () => Object.values(DRAFT).reduce((n, m) => n + Object.keys(m || {}).length, 0);

  /* ---------- the pictures of the character on show ---------- */
  let cur = null;   /* { id, name, cells: { 'idle@SW': { pose, dir, file, flip, fp, clip, img } } } */
  function entity() { const st = B()?.state; return st?.model?.find(e => e.id === st.entity) || null }
  function firstFrame(e, pose, dir) {
    const clips = (e.clips || []).filter(c => c.action === pose && c.frames?.length);
    let c = clips.find(c => c.view === dir); if (c) return { f: c.frames[0], clip: c, mirror: false };
    c = clips.find(c => c.view === MIR[dir]); if (c) return { f: c.frames[0], clip: c, mirror: true };
    return null;
  }
  const mkCell = (pose, dir, ff) => { const flip = !!ff.f.flip !== ff.mirror; return { pose, dir, file: ff.f.file, flip, fp: [ff.f.file, ff.f.revision || '', flip ? 'm' : ''].join('|'), clip: ff.clip, mirror: ff.mirror, img: null } };
  async function load() {
    const e = entity(); if (!e) { cur = null; draw(); return }
    const c = { id: e.id, name: e.name, cells: {} }; cur = c;
    for (const [pose] of POSES) for (const [dir] of ROWS) { const ff = firstFrame(e, pose, dir); if (ff) c.cells[cellKey(pose, dir)] = mkCell(pose, dir, ff) }
    importOld(c); draw(); status();
    await Promise.all(Object.values(c.cells).map(async x => { try { x.img = await B().loadImage(x.file) } catch (er) { x.img = null } }));
    if (cur === c) { draw(); status() }
  }
  /* the first time a character opens here, its points from the old 📍 Datum tool (proportion-datum-v1, frame 0) become the starting marks */
  function importOld(c) {
    const k = akey(c.id), have = DATA[k] ||= {}; let old = null; try { old = JSON.parse(localStorage.getItem('proportion-datum-v1') || 'null') } catch (e) { }
    const src = old?.[k] || old?.[c.id]; if (!src) return; let n = 0;
    for (const [ck, cell] of Object.entries(c.cells)) {
      if (have[ck]) continue; const pts = src[cell.pose]?.[0]?.pts; if (!pts) continue;
      let P = pts[cell.dir], mir = false; if (!P && pts[MIR[cell.dir]]) { P = pts[MIR[cell.dir]]; mir = true } if (!P) continue;
      const X = v => (mir ? 1 - v : v) * SRC, Y = v => v * SRC, g = (a, b) => mir ? P[b] : P[a], p = {}, pt = a => a && [X(a[0]), Y(a[1])];
      if (P.eyeL) p.eyeL = pt(mir ? P.eyeR || P.eyeL : P.eyeL); if (P.eyeR) p.eyeR = pt(mir ? P.eyeL || P.eyeR : P.eyeR); if (P.chin) p.chin = pt(P.chin); if (P.crown) p.top = pt(P.crown); if (P.crotch) p.crotch = pt(P.crotch);
      const sl = g('shL', 'shR'), sr = g('shR', 'shL'); if (sl) p.shL = pt(sl); if (sr) p.shR = pt(sr);
      const fl = g('footL', 'footR'), fr = g('footR', 'footL'); if (fl) p.footL = pt(fl); if (fr) p.footR = pt(fr);
      for (const kk of Object.keys(p)) if (!p[kk]) delete p[kk]; if (Object.keys(p).length) { have[ck] = { fp: cell.fp, p, ok: false, from: 'datum-v1' }; n++ }
    }
    if (n) write(KEY, DATA);
  }
  /* v98.656 stored eye / chin / top / neck / crotch as one level (a number): they become points on the centre line */
  const norm = rec => { if (!rec?.p) return rec; for (const [k, v] of Object.entries(rec.p)) if (typeof v === 'number') rec.p[k] = [GX, v]; return rec };
  const recOf = ck => norm((DATA[akey(cur?.id)] ||= {})[ck] ||= { fp: cur.cells[ck]?.fp, p: {}, ok: false });
  const peek = ck => norm(DATA[akey(cur?.id)]?.[ck]);
  const okOf = ck => { const r = peek(ck), c = cur?.cells[ck]; return !!(r?.ok && c && r.fp === c.fp) };
  const changed = ck => { const r = peek(ck), c = cur?.cells[ck]; return !!(r && c && r.fp && r.fp !== c.fp) };
  const off = ck => { const r = peek(ck); return [r?.ox || 0, r?.oy || 0] };
  function counts() { if (!cur) return { ok: 0, all: 0 }; const ks = Object.keys(cur.cells); return { ok: ks.filter(okOf).length, all: ks.length } }

  /* ---------- numbers of a pose ---------- */
  function anchorOf(ck) {
    const r = peek(ck), P = r?.p || {}, c = cur?.cells[ck]; if (!c) return null;
    if (c.pose === 'down') return P.footL || null;
    if (P.footL && P.footR) return [(P.footL[0] + P.footR[0]) / 2, (P.footL[1] + P.footR[1]) / 2];
    return P.footL || P.footR || null;
  }
  function vals(ck) {
    const P = peek(ck)?.p || {}, an = anchorOf(ck), c = cur?.cells[ck]; if (!c || c.pose === 'down') return null; const d = (a, b) => a && b ? Math.hypot(a[0] - b[0], a[1] - b[1]) : null;
    if (!an || !P.top || !P.chin) return { need: 'วางจุดเท้า + ยอดกะโหลก + คางก่อน' };
    const H = an[1] - P.top[1]; if (H < 20) return { need: 'ความสูงตัวผิดปกติ' };
    const o = { H, head: d(P.top, P.chin), sh: d(P.shL, P.shR), torso: P.neck && P.crotch ? P.crotch[1] - P.neck[1] : null, leg: P.crotch ? an[1] - P.crotch[1] : null, thick: d(P.legL, P.legR) };
    return o;
  }
  const pct = (v, H) => v == null ? '—' : (v / H * 100).toFixed(1) + '%';
  function valsHtml(ck) {
    const v = vals(ck); if (!v) return ''; if (v.need) return `<div class="vals dim">${v.need}</div>`;
    const base = (ck !== 'idle@SW' ? vals('idle@' + cur.cells[ck].dir) || vals('idle@SW') : null);
    const row = (n, a, bk) => { const p = a == null ? null : a / v.H * 100; let dl = ''; if (base && !base.need && base[bk] != null && p != null) { const q = base[bk] / base.H * 100, x = (p - q) / q * 100; dl = ` <i class="${Math.abs(x) > 5 ? 'bad' : Math.abs(x) > 2 ? 'warn' : 'ok'}">${x > 0 ? '+' : ''}${x.toFixed(1)}%</i>` } return `<tr><td>${n}</td><td>${a == null ? '—' : Math.round(a)}px</td><td>${p == null ? '—' : p.toFixed(1) + '%'}${dl}</td></tr>` };
    return `<table class="vals"><tr><td>สูงตัว</td><td>${Math.round(v.H)}px</td><td>${base && !base.need ? ((v.H / base.H - 1) * 100 >= 0 ? '+' : '') + ((v.H / base.H - 1) * 100).toFixed(1) + '% จากยืน' : ''}</td></tr>${row('หัว', v.head, 'head')}${row('ไหล่กว้าง', v.sh, 'sh')}${row('ลำตัว', v.torso, 'torso')}${row('ขา', v.leg, 'leg')}${row('ท่อนขา หนา', v.thick, 'thick')}</table>`;
  }

  /* ---------- UI state ---------- */
  let holdT = 0, Z = +(localStorage.getItem('pose-sheet.zoom') || .45), step = 'eyeL', pinned = false, act = null, pick = null, drag = null, tool = 'mark', rpick = null;
  function css() {
    if ($('poseSheetCss')) return; const s = document.createElement('style'); s.id = 'poseSheetCss';
    s.textContent = `#sheetSwitch{display:none;gap:6px;margin:0 0 10px}body.anim-mode #sheetSwitch{display:flex}
#sheetSwitch button{border:1px solid #b9c48a;background:#fffdf6;border-radius:9px;padding:6px 14px;font:inherit;cursor:pointer}#sheetSwitch button.on{background:#2f5d46;color:#fff;border-color:#2f5d46}
body.anim-mode main{grid-template-rows:auto minmax(0,1fr)}body.anim-mode main>#lineupDock{grid-column:1/-1;grid-row:1;margin:10px 12px 0}body.anim-mode main>#cats,body.anim-mode main>#gridWrap,body.anim-mode main>#detail{grid-row:2}
body.sheet-mode #filters,body.sheet-mode #grid{display:none!important}body.sheet-mode main>#cats,body.sheet-mode main>#detail{display:none}body.sheet-mode main>#gridWrap{grid-column:1/-1}
#poseSheet{display:none}body.sheet-mode #poseSheet{display:block}
#poseSheet .ps-app{display:grid;grid-template-columns:268px minmax(0,1fr);grid-template-areas:"top top" "side zone";column-gap:12px;align-items:start}
#poseSheet .ps-top{grid-area:top;position:sticky;top:0;z-index:30;background:#f4f2e8;border-bottom:1px solid #d6dccb;padding:6px 10px;display:flex;flex-wrap:wrap;gap:8px;align-items:center;box-shadow:0 2px 6px #0002}
#poseSheet .ps-top .ps-name{font-size:17px;white-space:nowrap}
#poseSheet .ps-side{grid-area:side;position:sticky;top:56px;overflow:auto;padding:8px;display:flex;flex-direction:column;gap:6px;background:#f8f6ee;border:1px solid #d6dccb;border-radius:10px}
#poseSheet .ps-side .ps-sh{font-weight:700;font-size:12.5px;color:#4a5b3f;margin-top:4px}#poseSheet .ps-side .ps-row{display:flex;flex-wrap:wrap;gap:4px}#poseSheet .ps-side label{font-size:13px;display:flex;gap:6px;align-items:center}
#poseSheet .ps-side .ps-steps{display:flex;flex-direction:column;gap:3px}#poseSheet .ps-side .ps-steps button{display:flex;align-items:center;gap:7px;text-align:left;padding:4px 8px;font-size:13px}#poseSheet .ps-side .ps-steps .n{font-weight:700;opacity:.6;min-width:16px}
#poseSheet .ps-zone{grid-area:zone;min-width:0;overflow-x:auto}
#poseSheet:fullscreen{overflow:auto;background:#eef0e6;padding:0 10px 10px}#poseSheet:fullscreen .ps-top{top:0}
#poseSheet .ps-next{flex:0 1 auto;padding:5px 12px;border-radius:10px;background:#fff8e1;border:2px solid #e0b64a;font-size:15px}#poseSheet .ps-next b{padding:2px 9px;border-radius:7px;color:#fff;margin-left:6px}#psTip{position:fixed;z-index:99999;pointer-events:none;padding:3px 9px;border-radius:7px;color:#fff;font:700 13px AgThai,system-ui,sans-serif;box-shadow:0 2px 6px #0006;white-space:nowrap}
#poseSheet .ps-bar{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:0 0 8px}#poseSheet .ps-bar b{font-size:16px;margin-right:6px}
#poseSheet .ps-steps{display:flex;flex-wrap:wrap;gap:4px}#poseSheet .ps-steps button{border:1px solid #ccd3bd;background:#fff;border-radius:999px;padding:3px 10px;font:inherit;font-size:12.5px;cursor:pointer}
#poseSheet .ps-steps button.on{outline:2px solid #2f5d46;font-weight:700}#poseSheet .ps-steps i{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:5px;vertical-align:middle}
#poseSheet .ps-bar .sp{flex:1}#poseSheet button.act{border:1px solid #b9c48a;background:#fffdf6;border-radius:8px;padding:5px 11px;font:inherit;cursor:pointer}#poseSheet button.act.main{background:#2f5d46;color:#fff;border-color:#2f5d46}#poseSheet button.act.on{background:#e8c766;border-color:#b9a56a;font-weight:700}#poseSheet button.act:disabled{opacity:.5;cursor:default}
#poseSheet .ps-tools{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:0 0 8px;padding:6px 8px;border:1px solid #e1e5d6;border-radius:9px;background:#f6f5ed}#poseSheet .ps-tools label{display:flex;gap:4px;align-items:center;font-size:12.5px;cursor:pointer}
#poseSheet .sw{display:inline-block;width:14px;height:14px;border-radius:50%;border:2px solid #fff;box-shadow:0 0 0 1px #8a8f80;cursor:pointer}
#poseSheet .ps-grid{display:grid;gap:0;overflow:auto;border:1px solid #d6dccb;border-radius:10px;background:#fbfaf5}
#poseSheet .ps-h{position:sticky;top:0;z-index:2;background:#edf0e6;padding:5px 8px;font-weight:700;font-size:13px;text-align:center;border-bottom:1px solid #d6dccb}
#poseSheet .ps-rl{background:#edf0e6;font-weight:700;font-size:12.5px;padding:8px;writing-mode:vertical-rl;transform:rotate(180deg);text-align:center;border-right:1px solid #d6dccb}
#poseSheet .ps-c{position:relative;border-right:1px solid #e6e9df;border-bottom:1px solid #e6e9df}#poseSheet .ps-c.act{box-shadow:inset 0 0 0 2px #2f5d46}
#poseSheet .ps-c canvas{display:block;cursor:crosshair}body.ps-hand #poseSheet .ps-c canvas{cursor:grab}#poseSheet .ps-c .ctl{display:flex;flex-wrap:wrap;gap:4px;align-items:center;justify-content:center;padding:4px;font-size:12px}
#poseSheet .ps-c .ctl button{border:1px solid #ccd3bd;background:#fff;border-radius:6px;padding:1px 7px;font:inherit;cursor:pointer}#poseSheet .ps-c .ctl input[type=number]{width:54px;font:inherit;text-align:right}
#poseSheet .ps-c .ctl label{display:flex;gap:3px;align-items:center;cursor:pointer}#poseSheet .ps-c .ctl .ok{color:#1f7a4d;font-weight:700}#poseSheet .ps-c .ctl .chg{color:#b5530b}#poseSheet .ps-c .ctl .mv{color:#8a4b06;font-weight:700}
#poseSheet .vals{width:100%;font-size:11.5px;border-collapse:collapse;margin:0 0 4px}#poseSheet .vals td{padding:1px 6px;border-top:1px solid #eef0e6}#poseSheet .vals td:nth-child(2),#poseSheet .vals td:nth-child(3){text-align:right}
#poseSheet .vals i{font-style:normal;font-weight:700;margin-left:4px}#poseSheet .vals i.ok{color:#1f7a4d}#poseSheet .vals i.warn{color:#b5530b}#poseSheet .vals i.bad{color:#c92a2a}#poseSheet .dim{color:#9aa18f;font-size:11.5px;padding:2px 6px}
#poseSheet .ps-c .none{display:grid;place-items:center;color:#9aa18f;font-size:12px}
#poseSheet .ps-msg{min-height:18px;color:#315d46;margin:6px 2px;font-size:13px}
#lineupDock .ps-check{font-size:12px;border-radius:999px;padding:2px 9px;font-weight:700}#lineupDock .ps-check.full{background:#d8f0dd;color:#1f6b3d}#lineupDock .ps-check.part{background:#fdecd2;color:#8a4b06}
#psAdj{position:fixed;inset:0;z-index:1200;background:#14231ccc;display:grid;place-items:center}#psAdj .box{background:#fbfaf5;border-radius:12px;padding:12px 14px;width:min(1180px,96vw);max-height:94vh;overflow:auto;box-shadow:0 20px 60px #000a}
#psAdj .row{display:flex;gap:12px;flex-wrap:wrap}#psAdj canvas{background:repeating-conic-gradient(#f1efe6 0 25%,#fff 0 50%) 0 0/16px 16px;border:1px solid #cfd6c2;border-radius:8px}
#psAdj .ctl{min-width:300px;flex:1}#psAdj .sl{display:grid;grid-template-columns:96px 1fr 62px auto;gap:6px;align-items:center;margin:6px 0}#psAdj .sl input[type=number]{width:62px;font:inherit;text-align:right}
#psAdj h3{margin:0 0 6px}#psAdj .btns{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px}#psAdj .btns button{border:1px solid #b9c48a;background:#fffdf6;border-radius:8px;padding:7px 14px;font:inherit;cursor:pointer}#psAdj .btns button.main{background:#2f5d46;color:#fff;border-color:#2f5d46}
#psAdj .msg{color:#315d46;margin-top:8px;font-size:13px;min-height:18px}`;
    document.head.append(s);
  }
  function build() {
    const wrap = $('gridWrap'), dock = $('lineupDock'), main = wrap?.parentElement; if (!wrap || !dock || $('poseSheet')) return;
    css(); main.insertBefore(dock, main.firstChild);
    const sw = document.createElement('div'); sw.id = 'sheetSwitch'; sw.setAttribute('role', 'tablist');
    sw.innerHTML = '<button type="button" data-m="anim" role="tab">🎞 Animation</button><button type="button" data-m="sheet" role="tab">📐 เรียงท่า · สัดส่วน</button>';
    wrap.insertBefore(sw, wrap.firstChild);
    const ps = document.createElement('section'); ps.id = 'poseSheet'; ps.setAttribute('aria-label', 'เรียงท่า · สัดส่วน'); wrap.insertBefore(ps, sw.nextSibling);
    const chk = document.createElement('span'); chk.className = 'ps-check'; chk.id = 'psCheck'; chk.hidden = true; dock.querySelector('.dock-bar b')?.after(chk);
    sw.onclick = e => { const b = e.target.closest('[data-m]'); if (b) mode(b.dataset.m) };
    mode(localStorage.getItem('pose-sheet.mode') === 'sheet' ? 'sheet' : 'anim');
  }
  function mode(m) { document.body.classList.toggle('sheet-mode', m === 'sheet'); $('sheetSwitch')?.querySelectorAll('[data-m]').forEach(b => { b.classList.toggle('on', b.dataset.m === m); b.setAttribute('aria-selected', String(b.dataset.m === m)) }); try { localStorage.setItem('pose-sheet.mode', m) } catch (e) { } if (m === 'sheet') load() }
  function status() {
    const el = $('psCheck'); if (!el) return; if (!cur || !Object.keys(cur.cells).length) { el.hidden = true; return }
    const { ok, all } = counts(); el.hidden = false; el.className = 'ps-check ' + (ok === all ? 'full' : 'part');
    el.textContent = ok === all ? '✔ ครบแล้ว · ' + cur.name : 'ยังไม่ครบ ' + ok + '/' + all + ' · ' + cur.name; el.title = 'ตรวจด้วยตาใน 📐 เรียงท่า (ติ๊ก ✓ ทุกท่า × SW, NE)';
  }

  /* ---------- geometry: image point → frame (offset, size about the ground point) → screen ---------- */
  const cwid = () => Math.round((SRC + 2 * PAD) * Z);
  const kOf = c => sizeOf(cur.id, c.pose, c.dir);
  const toFrame = (c, ck, x, y) => { const [ox, oy] = off(ck), k = kOf(c); return [GX + (x + ox - GX) * k, GY + (y + oy - GY) * k] };
  const fromFrame = (c, ck, fx, fy) => { const [ox, oy] = off(ck), k = kOf(c); return [GX + (fx - GX) / k - ox, GY + (fy - GY) / k - oy] };
  const sc = (fx, fy) => [(PAD + fx) * Z, (PAD + fy) * Z];
  const unsc = (sx, sy) => [sx / Z - PAD, sy / Z - PAD];
  const ptr = (cv, ev) => { const r = cv.getBoundingClientRect(); return [(ev.clientX - r.left) * cv.width / r.width, (ev.clientY - r.top) * cv.height / r.height] };

  function draw() {
    const ps = $('poseSheet'); if (!ps || !document.body.classList.contains('sheet-mode')) return;
    if (!cur) { ps.innerHTML = '<div class="ps-msg">เลือกตัวละครจากแถว ⚖ Scale Lineup ด้านบน หรือจากรายการ Animation</div>'; return }
    const cells = cur.cells, nd = draftCount(), moved = Object.keys(cells).filter(ck => off(ck)[0] || off(ck)[1]).length, W = cwid();
    /* v98.742 · LAYOUT: a sticky TOP BAR (name · next point · the tools used all the time) + a sticky SIDE BAR (the 12 points, the selected pose, the other tools) + the edit ZONE. ⛶ = full screen: only these three. */
    const swatches = `${RUL.lines.map((l, i) => `<span class="sw" data-rc="l${i}" style="background:${l.c}" title="เปลี่ยนสี · ดับเบิลคลิกลบ"></span>`).join('')}${RUL.meas.map((m, i) => `<span class="sw" data-rc="m${i}" style="background:${m.c};border-radius:3px" title="ตัววัด · เปลี่ยนสี · ดับเบิลคลิกลบ"></span>`).join('')}`;
    let h = `<div class="ps-app"><div class="ps-top" id="psTop"><b class="ps-name">${esc(cur.name)}</b><div class="ps-next" id="psNext"></div><span class="sp" style="flex:1"></span>
        <button type="button" class="act ${tool === 'hand' ? 'on' : ''}" id="psHand" title="ลากภาพในช่อง (H)">✋ ย้ายภาพ</button>
        <label style="font-size:12.5px">ซูม <input id="psZoom" type="range" min=".25" max=".8" step=".05" value="${Z}"></label>
        <button type="button" class="act" id="psBake" ${moved ? '' : 'disabled'} title="เลื่อนพิกเซลจริงของทุกเฟรมในท่านั้น แล้วบันทึกเป็นภาพใหม่ → รอ Push">💾 บันทึกตำแหน่งภาพ${moved ? ' (' + moved + ')' : ''}</button>
        <button type="button" class="act main" id="psSave" ${nd ? '' : 'disabled'} title="ขนาดที่ปรับ → js/character-scale-adjust-data.js">💾 บันทึกขนาดเข้าเกม${nd ? ' (' + nd + ')' : ''}</button>
        <button type="button" class="act" id="psCart" title="จุด/ติ๊ก/ไม้บรรทัด → 🛒 Cart (js/game-settings.js)">🛒 จุด/ติ๊ก ใส่ Cart</button>
        <button type="button" class="act" id="psFull" title="เต็มจอ: เห็นแค่แถบบน + แถบข้าง + พื้นที่แก้ไข (Esc = ออก)">⛶ เต็มจอ</button></div>
      <div class="ps-side" id="psSide"><div class="ps-sh">จุดที่วาง (ตามลำดับ)</div><div class="ps-steps" role="group" aria-label="จุดที่วาง (ตามลำดับ)">${STEPS.map(([k, l, col], i) => `<button type="button" data-step="${k}" class="${k === step ? 'on' : ''}"><i style="background:${col}"></i><span class="n">${i + 1}</span>${l.split(' · ')[0]}</button>`).join('')}</div>
        <div class="ps-sh">ท่าที่เลือก</div><div id="psAdjBox"></div>
        <button type="button" class="act" id="psCopySW" title="คัดลอกจุด datum ของท่ายืน (SW / NE) ไปให้ท่าที่เลือก (คลิกในช่องของท่านั้นก่อน)">📋 datum SW → ท่าที่เลือก</button>
        <button type="button" class="act" id="psClear" ${act ? '' : 'disabled'}>ล้างจุดของท่าที่เลือก</button>
        <button type="button" class="act" id="psSnapAll" title="เลื่อนภาพให้จุดเท้าอยู่ที่จุดพื้น (192,360) ทุกท่าที่มีจุดเท้า">⤓ เข้าเส้นพื้นทุกท่า</button>
        <div class="ps-sh">ไม้บรรทัด</div><label><input type="checkbox" id="psRon" ${RUL.on ? 'checked' : ''}>เปิดไม้บรรทัด</label>
        <div class="ps-row"><button type="button" class="act" id="psRadd" title="เพิ่มเส้นนอน (ลากเพื่อย้าย · ดับเบิลคลิกเพื่อลบ)">＋ เส้น</button><button type="button" class="act" id="psMadd" title="ตัววัด: 2 เส้นขนาน บอกระยะห่าง">＋ ตัววัด 2 เส้น</button><button type="button" class="act" id="psRclr">ล้างไม้บรรทัด</button></div>
        <label><input type="checkbox" id="psCen" ${RUL.center ? 'checked' : ''}>เส้นกลางช่อง</label><label><input type="checkbox" id="psGho" ${RUL.ghost ? 'checked' : ''}>เงาท่ายืน SW</label>
        <div class="ps-tools" style="margin:2px 0;display:${RUL.on && (RUL.lines.length || RUL.meas.length) ? 'flex' : 'none'}">สี: ${swatches}</div></div>
      <div class="ps-zone" id="psZone">`;
    h += `<div class="ps-grid" style="grid-template-columns:34px repeat(${POSES.length},${W}px)"><div class="ps-h"></div>${POSES.map(([, l]) => `<div class="ps-h">${l}</div>`).join('')}`;
    for (const [dir, rl] of ROWS) {
      h += `<div class="ps-rl">${rl}</div>`;
      for (const [pose] of POSES) {
        const ck = cellKey(pose, dir), c = cells[ck];
        if (!c) { h += `<div class="ps-c none" style="height:${W + 90}px">ไม่มีภาพ</div>`; continue }
        const k = kOf(c), ok = okOf(ck), chg = changed(ck), [ox, oy] = off(ck);
        h += `<div class="ps-c${act === ck ? ' act' : ''}" data-ck="${ck}"><canvas width="${W}" height="${W}" aria-label="${pose} ${dir}"></canvas><div class="ctl">
          <button type="button" data-k="-1" title="เล็กลง 1%">−1%</button><input data-in type="number" step="0.5" min="30" max="250" value="${(k * 100).toFixed(1)}" aria-label="ขนาด %"><button type="button" data-k="1" title="ใหญ่ขึ้น 1%">+1%</button>
          <label class="${ok ? 'ok' : ''}"><input type="checkbox" data-ok ${ok ? 'checked' : ''}>${ok ? '✓ ตรวจแล้ว' : 'ตรวจ'}</label>${chg ? '<span class="chg" title="ภาพของท่านี้เปลี่ยนหลังวางจุด/ติ๊ก — ติ๊กหลุดแล้ว">ภาพเปลี่ยน</span>' : ''}
          <button type="button" data-b="sw" title="ใส่จุดทั้งหมดของท่ายืน ${dir} ทับท่านี้">📋 SW</button><button type="button" data-b="snap" title="เลื่อนภาพให้จุดเท้าอยู่ที่จุดพื้น">⤓ พื้น</button><button type="button" data-b="adj" title="เปิดหน้าต่างปรับสัดส่วน (บิดภาพ) — บันทึกเป็นภาพใหม่">🛠 ปรับ</button>${ox || oy ? `<span class="mv" title="ย้ายแล้ว ยังไม่บันทึก">ย้าย ${ox},${oy}</span>` : ''}</div>${valsHtml(ck)}</div>`;
      }
    }
    h += `</div><div class="ps-msg" id="psMsg" role="status">${tool === 'hand' ? 'โหมด ✋: ลากภาพในช่องเพื่อย้าย' : 'คลิกบนภาพเพื่อวาง <b>' + STEP[step][1] + '</b> · ลากจุดเพื่อย้าย · ลูกศร = ขยับจุดที่เลือก 1 px · Delete = ลบจุด'} · กรอบแดง = ภาพจริง 384×384 (ขอบนอกกรอบจะถูกตัดตอนบันทึก) · เส้นเขียว = เส้นพื้น</div></div></div>`;
    /* v98.742 · re-drawing the sheet must not move the view: every scroll position (page, the sheet, the zone, the side bar) is put back, so you stay on the pose you are working on */
    const keep = { arr: [], wx: scrollX, wy: scrollY, zl: $('psZone')?.scrollLeft || 0, zt: $('psZone')?.scrollTop || 0, st: $('psSide')?.scrollTop || 0 }; for (let n = ps; n; n = n.parentElement) keep.arr.push([n, n.scrollTop, n.scrollLeft]);
    ps.innerHTML = h; document.body.classList.toggle('ps-hand', tool === 'hand');
    const back = () => { for (const [n, t, l] of keep.arr) { n.scrollTop = t; n.scrollLeft = l } scrollTo(keep.wx, keep.wy); const z = $('psZone'); if (z) { z.scrollLeft = keep.zl; z.scrollTop = keep.zt } const s = $('psSide'); if (s) s.scrollTop = keep.st };
    back(); paintAll(); wire(ps); back();
  }
  /* v98.739 · always say WHICH point comes next (before it is placed): a banner that stays at the top of the sheet + a small label that follows the pointer over a pose */
  const stepInfo = () => { const i = STEPS.findIndex(s => s[0] === step), s = STEPS[Math.max(0, i)]; return { n: Math.max(0, i) + 1, all: STEPS.length, label: s[1], short: s[1].split(' · ')[0], col: s[2] } };
  /* v98.741 · the selected pose (last clicked): once it has its chin + crotch line, the 🛠 re-proportion window (head · torso height / thickness · legs length / thickness) is one click away, right under the banner */
  function adjBar() {
    const c = act && cur?.cells[act]; if (!c) return '';
    const P = peek(act)?.p || {}, name = (POSES.find(q => q[0] === c.pose) || [, c.pose])[1] + ' ' + c.dir;
    return P.chin && P.crotch ? `<div style="margin-top:6px;font-size:14px">🛠 ท่าที่เลือก <b style="background:#2e6b4f">${esc(name)}</b> <button type="button" class="act" id="psAdjOpen" style="margin-left:6px">🛠 ปรับสัดส่วน · หัว · ลำตัว สูง/หนา · ขา ยาว/หนา</button></div>`
      : `<div style="margin-top:6px;font-size:13px;color:#7a5a00">ท่าที่เลือก <b>${esc(name)}</b> · วาง <b>คาง</b> กับ <b>เส้นตัดขา</b> ให้ครบก่อน จึงจะมีปุ่มปรับสัดส่วน</div>`;
  }
  function updNext() {
    const el = $('psNext'); if (!el) return;
    const box = $('psAdjBox'); if (box) { const hh = adjBar(); if (box._h !== hh) { box._h = hh; box.innerHTML = hh } }
    const ab = $('psAdjOpen'); if (ab) ab.onclick = () => openAdjust(act);
    const top = $('psTop'), sd = $('psSide'); if (top && sd) { const hgt = top.offsetHeight; sd.style.top = hgt + 'px'; sd.style.maxHeight = 'calc(100vh - ' + (hgt + 8) + 'px)' }
    if (tool === 'hand') { el.innerHTML = '✋ โหมดย้ายภาพ · ลากภาพในช่อง'; el._h = ''; return } const s = stepInfo();
    const placed = (act && peek(act)?.p || {})[step] ? ' (วางแล้ว · คลิกใหม่ = ย้าย)' : '';
    const html = `👉 จุดถัดไป <b style="background:#555">${s.n}/${s.all}</b> วาง <b style="background:${s.col}">${esc(s.label)}</b>${placed}`;
    if (el._h !== html) { el._h = html; el.innerHTML = html }   /* only when it changed */
  }
  const paintAll = () => { updNext(); $('poseSheet')?.querySelectorAll('.ps-c[data-ck]').forEach(paint) };
  const ghostCache = new Map();
  function silhouette(img, flip) { const k = img.src + (flip ? 'f' : ''); let c = ghostCache.get(k); if (c) return c; c = document.createElement('canvas'); c.width = c.height = SRC; const g = c.getContext('2d'); if (flip) { g.translate(SRC, 0); g.scale(-1, 1) } g.drawImage(img, 0, 0, SRC, SRC); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#ff7a00'; g.fillRect(0, 0, SRC, SRC); ghostCache.set(k, c); return c }
  function paint(el) {
    try { updNext() } catch (e) { }
    const ck = el.dataset.ck, c = cur.cells[ck], cv = el.querySelector('canvas'), g = cv.getContext('2d'), W = cv.width, k = kOf(c), [ox, oy] = off(ck);
    g.clearRect(0, 0, W, W); for (let y = 0; y < W; y += 14) for (let x = (y / 14) % 2 ? 14 : 0; x < W; x += 28) { g.fillStyle = '#f1efe6'; g.fillRect(x, y, 14, 14) }
    g.fillStyle = '#fff9'; { const [x0, y0] = sc(0, 0); g.fillRect(x0, y0, SRC * Z, SRC * Z) }
    const line = (x1, y1, x2, y2, col, w, dash) => { g.save(); g.strokeStyle = col; g.lineWidth = w; if (dash) g.setLineDash(dash); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); g.restore() };
    /* the ground line */ { const [, y] = sc(0, GY); line(0, y + .5, W, y + .5, '#6fa16f', 1.2) }
    if (RUL.center) { const [x] = sc(GX, 0); line(x + .5, 0, x + .5, W, '#7a7f6e', 1, [6, 5]) }
    /* the picture */
    const drawImg = (img, flip, ax, ay, kk, alpha, silh) => {
      const x0 = GX + (ax - GX) * kk, y0 = GY + (ay - GY) * kk, [dx, dy] = sc(x0, y0), s = SRC * kk * Z; g.save(); g.globalAlpha = alpha;
      const src = silh ? silhouette(img, flip) : img; if (flip && !silh) { g.translate(dx + s, dy); g.scale(-1, 1); g.drawImage(src, 0, 0, s, s) } else g.drawImage(src, dx, dy, s, s); g.restore();
    };
    const idle = cur.cells['idle@SW'];
    if (RUL.ghost && idle?.img && ck !== 'idle@SW') { const ia = anchorOf('idle@SW') || [GX, GY], ki = kOf(idle); const ax = GX - (ia[0] - 0) * ki + 0, ay = GY - ia[1] * ki; /* idle origin so that its anchor sits on the ground point */ g.save(); const [dx, dy] = sc(ax, ay), s = SRC * ki * Z; g.globalAlpha = .38; g.drawImage(silhouette(idle.img, idle.flip), dx, dy, s, s); g.restore() }
    if (c.img) drawImg(c.img, c.flip, ox, oy, k, 1, false); else { g.fillStyle = '#9aa18f'; g.font = '12px sans-serif'; g.textAlign = 'center'; g.fillText('กำลังโหลด…', W / 2, W / 2) }
    /* the real 384 × 384 frame */ { const [x0, y0] = sc(0, 0); g.save(); g.strokeStyle = '#d9480f'; g.lineWidth = 1.5; g.strokeRect(x0 + .5, y0 + .5, SRC * Z, SRC * Z); g.restore() }
    /* rulers */
    if (RUL.on) {
      RUL.lines.forEach((l, i) => { const [, y] = sc(0, l.y); line(0, y, W, y, l.c, rpick === 'l' + i ? 2.4 : 1.3) });
      RUL.meas.forEach((m, i) => { const [, ya] = sc(0, m.a), [, yb] = sc(0, m.b), idleV = vals('idle@SW'), d = Math.abs(m.b - m.a); line(0, ya, W, ya, m.c, 1.3); line(0, yb, W, yb, m.c, 1.3);
        g.fillStyle = m.c; for (const y of [ya, yb]) { g.beginPath(); g.arc(14, y, rpick === 'm' + i ? 6 : 4.5, 0, 7); g.fill() } line(34, ya, 34, yb, m.c, 1, [3, 3]);
        const lbl = Math.round(d) + 'px' + (idleV && !idleV.need ? ' · ' + (d / idleV.H * 100).toFixed(1) + '% ของสูงยืน SW' : ''); g.font = '11px sans-serif'; g.textAlign = 'left'; const tx = 40, ty = (ya + yb) / 2 + 4; g.fillStyle = '#fffd'; g.fillRect(tx - 2, ty - 11, g.measureText(lbl).width + 6, 15); g.fillStyle = m.c; g.fillText(lbl, tx, ty) });
    }
    /* the points of this pose */
    const P = peek(ck)?.p || {};
    const dot = (key, v, col, label, sel) => { const [fx, fy] = toFrame(c, ck, v[0], v[1]), [x, y] = sc(fx, fy);
      g.fillStyle = col; g.strokeStyle = '#fff'; g.lineWidth = 1.6; g.beginPath(); g.arc(x, y, sel ? 7 : 5, 0, 7); g.fill(); g.stroke();
      if (label) { g.font = '10px sans-serif'; g.textAlign = 'left'; g.fillStyle = '#fffd'; g.fillRect(x + 8, y - 11, g.measureText(label).width + 4, 13); g.fillStyle = col; g.fillText(label, x + 10, y - 1) } };
    for (const [key, , col] of STEPS) {
      const lk = LINES[key], pts = lk && P[lk];
      if (pts && pts.length) {   /* a cut LINE: the points joined by a line (dashed while it is still open) */
        g.save(); g.strokeStyle = col; g.lineWidth = 1.8; if (P[key + 'Done'] === false) g.setLineDash([5, 4]); g.beginPath(); pts.forEach((q, i) => { const [x, y] = sc(...toFrame(c, ck, q[0], q[1])); i ? g.lineTo(x, y) : g.moveTo(x, y) }); g.stroke(); g.restore();
        pts.forEach((q, i) => dot(key + '#' + i, q, col, i === 0 ? STEP[key][1].replace(/ ·.*| \(.*/, '') : '', act === ck && pick === key + '#' + i)); continue }
      const v = P[key]; if (!v) continue; dot(key, v, col, STEP[key][1].replace(/ \(.*| ·.*/, ''), act === ck && pick === key);
    }
    /* the skull-top suggestion: a dashed head ellipse from the eyes + chin (click its top mark to take it, or click elsewhere to place the point yourself) */
    { const sg = skullGuess(P); if (sg && !P.top) { const [cx, cy] = sc(...toFrame(c, ck, sg.cx, sg.cy)), [tx, ty] = sc(...toFrame(c, ck, sg.x, sg.y)), k2 = kOf(c) * Z;
        g.save(); g.strokeStyle = '#8a4fff'; g.fillStyle = '#8a4fff22'; g.lineWidth = 1.6; g.setLineDash([5, 4]); g.beginPath(); g.ellipse(cx, cy, sg.rx * k2, sg.ry * k2, 0, 0, 7); g.fill(); g.stroke(); g.setLineDash([]);
        g.fillStyle = '#fff'; g.beginPath(); g.arc(tx, ty, 6, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#8a4fff'; g.font = '10px sans-serif'; g.fillText('ยอดกะโหลก (แนะนำ) คลิกที่นี่', tx + 9, ty + 3); g.restore() } }
    const seg = (a, b, col) => { if (P[a] && P[b]) { const [x1, y1] = sc(...toFrame(c, ck, ...P[a])), [x2, y2] = sc(...toFrame(c, ck, ...P[b])); line(x1, y1, x2, y2, col, 1.4, [4, 3]) } };
    seg('shL', 'shR', STEP.shL[2]); seg('legL', 'legR', STEP.legL[2]); seg('footL', 'footR', STEP.footL[2]); seg('top', 'chin', STEP.top[2]);
    const an = anchorOf(ck); if (an) { const [x, y] = sc(...toFrame(c, ck, ...an)); line(x - 9, y, x + 9, y, '#000', 2); line(x, y - 9, x, y + 9, '#000', 2); g.strokeStyle = '#fff'; g.lineWidth = 1; g.beginPath(); g.arc(x, y, 6, 0, 7); g.stroke() }
  }
  /* what is under the pointer, in priority: ruler line → point */
  /* the head ellipse that suggests the skull top: eyes in the middle of the head, so crown ≈ eye line − 1.1 × (eye line → chin) */
  function skullGuess(P) { if (!P.eyeL || !P.eyeR || !P.chin) return null; const ex = (P.eyeL[0] + P.eyeR[0]) / 2, ey = (P.eyeL[1] + P.eyeR[1]) / 2, f = P.chin[1] - ey; if (f < 6) return null; const y = ey - f * 1.1, x = (ex + P.chin[0]) / 2, ry = (P.chin[1] - y) / 2; return { x, y, cx: x, cy: (y + P.chin[1]) / 2, rx: ry * .78, ry } }
  function hitPoint(c, ck, P, sx, sy) {
    let best = null, bd = 9;
    for (const [key] of STEPS) {
      const lk = LINES[key], pts = lk && P[lk];
      if (pts && pts.length) { pts.forEach((v, i) => { const [x, y] = sc(...toFrame(c, ck, ...v)), d = Math.hypot(x - sx, y - sy); if (d < bd) { bd = d; best = key + '#' + i } }); continue }
      const v = P[key]; if (!v) continue; const [x, y] = sc(...toFrame(c, ck, ...v)), d = Math.hypot(x - sx, y - sy); if (d < bd) { bd = d; best = key } }
    return best;
  }
  function hitRuler(sx, sy) {
    if (!RUL.on) return null;
    for (let i = 0; i < RUL.meas.length; i++) { const m = RUL.meas[i]; if (Math.abs(sc(0, m.a)[1] - sy) < 6) return { t: 'm', i, e: 'a' }; if (Math.abs(sc(0, m.b)[1] - sy) < 6) return { t: 'm', i, e: 'b' } }
    for (let i = 0; i < RUL.lines.length; i++) if (Math.abs(sc(0, RUL.lines[i].y)[1] - sy) < 5) return { t: 'l', i };
    return null;
  }
  const firstMissing = P => STEPS.find(s => !P[s[0]] || (LINES[s[0]] && lineOpen(P, s[0])))?.[0];
  function wire(ps) {
    if (!ps.dataset.tip) { ps.dataset.tip = '1';   /* the label that follows the pointer */
      const tip = () => { let t = $('psTip'); if (!t) { t = document.createElement('div'); t.id = 'psTip'; t.hidden = true; document.body.append(t) } return t };
      ps.addEventListener('pointermove', ev => { const t = tip(), on = tool !== 'hand' && !drag && ev.target.closest?.('.ps-c canvas'); if (!on) { t.hidden = true; return } const s = stepInfo(); t.textContent = s.n + '/' + s.all + ' · ' + s.short; t.style.background = s.col; t.style.left = (ev.clientX + 16) + 'px'; t.style.top = (ev.clientY + 18) + 'px'; t.hidden = false });
      ps.addEventListener('pointerleave', () => { const t = $('psTip'); if (t) t.hidden = true }) }
    const msg = t => { const m = $('psMsg'); if (m) m.textContent = t };
    ps.querySelectorAll('[data-step]').forEach(b => b.onclick = () => { step = b.dataset.step; pinned = true; tool = 'mark'; draw() });
    const zm = $('psZoom'); if (zm) zm.onchange = () => { Z = +zm.value; try { localStorage.setItem('pose-sheet.zoom', String(Z)) } catch (e) { } draw() };
    $('psFull').onclick = () => { const e = document.fullscreenElement; if (e === ps) document.exitFullscreen?.(); else (ps.requestFullscreen?.() || Promise.reject()).catch(() => msg('เปิดเต็มจอไม่ได้ในหน้านี้ — ลองกด F11 ของเบราว์เซอร์')) };
    if (!ps._fs) { ps._fs = 1; document.addEventListener('fullscreenchange', () => { const b = $('psFull'); if (b) b.textContent = document.fullscreenElement === ps ? '⛶ ออกจากเต็มจอ' : '⛶ เต็มจอ'; updNext() }) }
    $('psHand').onclick = () => { tool = tool === 'hand' ? 'mark' : 'hand'; draw() };
    $('psClear').onclick = () => { if (!act) return; const r = peek(act); if (r) { r.p = {}; r.ok = false; write(KEY, DATA) } pick = null; draw(); status() };
    $('psCart').onclick = () => pushMarks(); $('psSave').onclick = () => saveSizes(); $('psBake').onclick = () => bakeMoves();
    $('psCopySW').onclick = () => { if (!act) { msg('คลิกเลือกท่าที่ต้องการก่อน (คลิกในช่องของท่านั้น) แล้วกดปุ่มนี้'); return } const n = copyFromSW(act); msg(n ? 'ใส่จุดของท่ายืน (' + cur.cells[act].dir + ') ให้ท่าที่เลือกแล้ว — ลากแก้ให้ตรงตัว' : 'ท่านี้เป็นท่าต้นแบบเอง หรือท่ายืนยังไม่มีจุด'); draw() };
    $('psSnapAll').onclick = () => { let n = 0; for (const ck of Object.keys(cur.cells)) if (snap(ck, true)) n++; write(KEY, DATA); draw(); msg(n ? 'จัดเท้าเข้าเส้นพื้น ' + n + ' ท่า — กด 💾 บันทึกตำแหน่งภาพ เพื่อเปลี่ยนจริง' : 'ยังไม่มีท่าที่วางจุดเท้าครบ') };
    $('psRon').onchange = ev => { RUL.on = ev.target.checked; saveRul(); draw() };
    $('psCen').onchange = ev => { RUL.center = ev.target.checked; saveRul(); paintAll() };
    $('psGho').onchange = ev => { RUL.ghost = ev.target.checked; saveRul(); paintAll() };
    $('psRadd').onclick = () => { RUL.on = true; RUL.lines.push({ y: GY - 100 - RUL.lines.length * 40, c: RCOL[(RUL.lines.length + RUL.meas.length) % RCOL.length] }); saveRul(); draw() };
    $('psMadd').onclick = () => { RUL.on = true; RUL.meas.push({ a: 120, b: 240, c: RCOL[(RUL.lines.length + RUL.meas.length + 3) % RCOL.length] }); saveRul(); draw() };
    $('psRclr').onclick = () => { RUL.lines = []; RUL.meas = []; saveRul(); draw() };
    ps.querySelectorAll('[data-rc]').forEach(b => { const t = b.dataset.rc[0], i = +b.dataset.rc.slice(1), a = t === 'l' ? RUL.lines : RUL.meas; b.onclick = () => { const o = a[i]; if (o) { o.c = RCOL[(RCOL.indexOf(o.c) + 1) % RCOL.length]; saveRul(); draw() } }; b.ondblclick = () => { a.splice(i, 1); saveRul(); draw() } });
    ps.querySelectorAll('.ps-c[data-ck]').forEach(el => {
      const ck = el.dataset.ck, c = cur.cells[ck], cv = el.querySelector('canvas');
      el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => setSize(cur.id, c.pose, c.dir, kOf(c) * (1 + (+b.dataset.k) / 100)));
      const inp = el.querySelector('[data-in]'); inp.onchange = () => { const v = +inp.value; if (v >= 30 && v <= 250) setSize(cur.id, c.pose, c.dir, v / 100) };
      el.querySelector('[data-ok]').onchange = ev => { const r = recOf(ck); r.ok = ev.target.checked; r.fp = c.fp; write(KEY, DATA); draw(); status() };
      el.querySelector('[data-b="sw"]').onclick = () => { const n = copyFromSW(ck); msg(n ? 'ใส่จุดของท่ายืน SW แล้ว — ลากแก้ให้ตรงตัว' : 'ท่ายืนยังไม่มีจุด'); draw() };
      el.querySelector('[data-b="snap"]').onclick = () => { if (snap(ck, true)) { write(KEY, DATA); draw(); msg('เข้าเส้นพื้นแล้ว (ยังไม่บันทึก) — กด 💾 บันทึกตำแหน่งภาพ') } else msg('วางจุดเท้าของท่านี้ก่อน' + (c.pose === 'down' ? ' (ท่านอน: เท้า ซ้าย = จุดแตะพื้นใต้กลางลำตัว)' : ' (เท้า ซ้าย + ขวา)')) };
      el.querySelector('[data-b="adj"]').onclick = () => openAdjust(ck);
      cv.ondblclick = ev => { const [sx, sy] = ptr(cv, ev), h = hitRuler(sx, sy); if (h) { (h.t === 'l' ? RUL.lines : RUL.meas).splice(h.i, 1); saveRul(); draw() } };
      cv.onpointerdown = ev => {
        const [sx, sy] = ptr(cv, ev); act = ck; const rec = recOf(ck), P = rec.p;
        const hr = hitRuler(sx, sy); if (hr) { rpick = hr.t + hr.i; drag = { kind: 'rul', h: hr }; cv.setPointerCapture(ev.pointerId); paintAll(); return }
        if (tool === 'hand') { drag = { kind: 'hand', ck, sx, sy, ox: rec.ox || 0, oy: rec.oy || 0 }; cv.setPointerCapture(ev.pointerId); return }
        let key = hitPoint(c, ck, P, sx, sy);
        if (!key) {
          let k = pinned ? step : (firstMissing(P) || step); pinned = false; const [fx, fy] = unsc(sx, sy), [x, y] = fromFrame(c, ck, fx, fy), q = [Math.round(x), Math.round(y)];
          if (LINES[k]) {   /* a cut line: this click is its next point; a click-and-HOLD (0.55 s) ends the line */
            const lk = LINES[k]; if (!P[lk] || P[k + 'Done'] !== false) { P[lk] = []; P[k + 'Done'] = false }   /* a finished line asked again starts a new one */
            P[lk].push(q); setLine(P, k, P[lk]); rec.fp = c.fp; write(KEY, DATA); key = k + '#' + (P[lk].length - 1); step = k;
            clearTimeout(holdT); holdT = setTimeout(() => { holdT = 0; const R = peek(ck)?.p; if (R && lineOpen(R, k)) { R[k + 'Done'] = true; write(KEY, DATA); drag = null; step = firstMissing(R) || k; msg((STEP[k][1].replace(/ ·.*/, '')) + ' จบแล้ว'); draw() } }, 550);
          } else {
            const sg = k === 'top' ? skullGuess(P) : null, [gx, gy] = sg ? sc(...toFrame(c, ck, sg.x, sg.y)) : [0, 0];
            if (sg && Math.hypot(gx - sx, gy - sy) < 14) { P.top = [Math.round(sg.x), Math.round(sg.y)]; key = 'top' } else P[k] = q;
            if (k !== key) key = k; rec.fp = c.fp; write(KEY, DATA); step = firstMissing(P) || key;
          }
        }
        pick = key; drag = { kind: 'pt', ck, key }; cv.setPointerCapture(ev.pointerId); draw();
      };
    });
    ps.onpointermove = ev => {
      if (!drag) return;
      if (drag.kind === 'rul') { const el = ps.querySelector('.ps-c canvas'); const [, sy] = ptr(el, ev), fy = Math.round(unsc(0, sy)[1]), h = drag.h, o = h.t === 'l' ? RUL.lines[h.i] : RUL.meas[h.i]; if (!o) return; if (h.t === 'l') o.y = fy; else o[h.e] = fy; paintAll(); return }
      const el = ps.querySelector(`.ps-c[data-ck="${drag.ck}"]`), cv = el?.querySelector('canvas'); if (!cv) return; const [sx, sy] = ptr(cv, ev), c = cur.cells[drag.ck];
      if (drag.kind === 'hand') { const k = kOf(c), r = peek(drag.ck) || recOf(drag.ck); r.ox = Math.round(drag.ox + (sx - drag.sx) / Z / k); r.oy = Math.round(drag.oy + (sy - drag.sy) / Z / k); paint(el); return }
      const [fx, fy] = unsc(sx, sy), [x, y] = fromFrame(c, drag.ck, fx, fy), q = [Math.round(x), Math.round(y)], R = recOf(drag.ck).p;
      if (holdT) { const last = drag.key.includes('#') && R[LINES[drag.key.split('#')[0]]]?.[+drag.key.split('#')[1]]; if (!last || Math.hypot(last[0] - q[0], last[1] - q[1]) > 4) { clearTimeout(holdT); holdT = 0 } }   /* moving cancels the hold */
      if (drag.key.includes('#')) { const [k, i] = drag.key.split('#'), pts = R[LINES[k]]; if (pts && pts[+i]) { pts[+i] = q; setLine(R, k, pts) } } else R[drag.key] = q; paint(el);
    };
    ps.onpointerup = () => { clearTimeout(holdT); holdT = 0; if (drag) { if (drag.kind === 'rul') saveRul(); write(KEY, DATA); const hand = drag.kind === 'hand'; drag = null; if (hand) draw() } };
  }
  addEventListener('keydown', ev => {
    if (!document.body.classList.contains('sheet-mode') || $('psAdj') || /INPUT|TEXTAREA|SELECT/.test(ev.target?.tagName || '')) return;
    if (ev.key === 'h' || ev.key === 'H') { tool = tool === 'hand' ? 'mark' : 'hand'; draw(); return }
    if (ev.key === 'Enter' && act) { const R = peek(act)?.p; const k = R && Object.keys(LINES).find(x => lineOpen(R, x)); if (k) { ev.preventDefault(); R[k + 'Done'] = true; write(KEY, DATA); step = firstMissing(R) || k; draw(); return } }
    if (!act || !pick) return; const P = recOf(act).p, hk = pick.includes('#') ? pick.split('#') : null, v = hk ? P[LINES[hk[0]]]?.[+hk[1]] : P[pick]; if (!v) return;
    if (hk) { const pts = P[LINES[hk[0]]], d = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[ev.key];
      if (d) { ev.preventDefault(); pts[+hk[1]] = [v[0] + d[0], v[1] + d[1]]; setLine(P, hk[0], pts); write(KEY, DATA); draw() }
      else if (ev.key === 'Delete' || ev.key === 'Backspace') { ev.preventDefault(); pts.splice(+hk[1], 1); if (pts.length) setLine(P, hk[0], pts); else { delete P[LINES[hk[0]]]; delete P[hk[0]]; delete P[hk[0] + 'Done'] } pick = null; write(KEY, DATA); draw() }
      return } const d = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[ev.key];
    if (d) { ev.preventDefault(); P[pick] = [v[0] + d[0], v[1] + d[1]]; write(KEY, DATA); draw() }
    else if (ev.key === 'Delete' || ev.key === 'Backspace') { ev.preventDefault(); delete P[pick]; pick = null; write(KEY, DATA); draw() }
  });
  const msg = t => { const m = $('psMsg'); if (m) m.textContent = t };

  /* ---------- datum from the SW standing pose · snapping the feet to the ground ---------- */
  function copyFromSW(only) {
    let n = 0; const base = d => { const q = peek('idle@' + d)?.p; return q && Object.keys(q).length ? q : null };
    for (const ck of (only ? [only] : Object.keys(cur.cells))) { if (ck === 'idle@SW' || ck === 'idle@NE') continue; const c = cur.cells[ck]; if (!c) continue; const src = base(c.dir) || base('SW'); if (!src) continue; const r = recOf(ck); if (!only && Object.keys(r.p).length) continue;
      r.p = JSON.parse(JSON.stringify(src)); if (c.pose === 'down') r.p = { footL: src.footL ? [...src.footL] : [GX, GY] }; r.ok = false; r.fp = c.fp; n++ }
    write(KEY, DATA); return n;
  }
  function snap(ck, move) {
    const an = anchorOf(ck); if (!an) return false; const r = recOf(ck); r.ox = Math.round(GX - an[0]); r.oy = Math.round(GY - an[1]); return true;
  }

  /* ---------- baking moves / adjusts into new pictures (every frame of the pose) ---------- */
  const frameImg = async (f) => B().loadImage(f.file);
  const toURL = cv => cv.toDataURL('image/png');
  function apply(items) { if (!root.StudioApplyFrames) throw new Error('ยังไม่พร้อมบันทึกภาพ (เปิดหน้า Asset Studio ใหม่)'); return root.StudioApplyFrames(items) }
  const mirrorCv = cv => { const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; const g = o.getContext('2d'); g.translate(cv.width, 0); g.scale(-1, 1); g.drawImage(cv, 0, 0); return o };
  const flipOf = (c, f) => !!f.flip !== !!c.mirror;   /* is this frame shown mirrored in the cell */
  async function bakeMoves() {
    const cells = Object.keys(cur.cells).filter(ck => { const [x, y] = off(ck); return x || y }); if (!cells.length) return; msg('กำลังเตรียมภาพ…');
    const items = [], done = [];
    try {
      for (const ck of cells) {
        const c = cur.cells[ck], [ox, oy] = off(ck), sx = c.flip ? -ox : ox, clip = c.clip, frames = clip.frames; let lost = 0;
        for (const f of frames) {
          const img = await frameImg(f); if (!img) throw new Error('โหลดภาพไม่ได้: ' + f.file); const cv = document.createElement('canvas'); cv.width = cv.height = SRC; const g = cv.getContext('2d'); g.drawImage(img, sx, oy, SRC, SRC);
          /* any opaque pixel of the picture that would leave the frame? */
          const t = document.createElement('canvas'); t.width = t.height = SRC; const tg = t.getContext('2d'); tg.drawImage(img, 0, 0, SRC, SRC); const d = tg.getImageData(0, 0, SRC, SRC).data;
          for (let y = 0; y < SRC; y++) for (let x = 0; x < SRC; x++) if (d[(y * SRC + x) * 4 + 3] > 8) { const X = x + sx, Y = y + oy; if (X < 0 || X >= SRC || Y < 0 || Y >= SRC) lost++ }
          items.push({ file: f.file, dataUrl: toURL(cv) });
        }
        if (lost > 40) throw new Error(`ท่า ${c.pose} ${c.dir}: เมื่อเลื่อนแล้วมีส่วนของตัว (${lost} พิกเซล) หลุดออกนอกกรอบ 384×384 · ปรับตำแหน่งหรือลดขนาดก่อน`);
        done.push(ck);
      }
      msg('กำลังบันทึก ' + items.length + ' ภาพ…'); await apply(items);
      for (const ck of done) { const r = peek(ck), c = cur.cells[ck], [ox, oy] = [r.ox || 0, r.oy || 0]; for (const k of Object.keys(r.p || {})) r.p[k] = [r.p[k][0] + ox, r.p[k][1] + oy]; r.ox = r.oy = 0; r.ok = false; r.fp = null }
      write(KEY, DATA); msg('✔ บันทึกตำแหน่งภาพแล้ว · รอกด “Push ที่แก้” / Cart'); await new Promise(r => setTimeout(r, 400)); await load();
    } catch (e) { msg('บันทึกตำแหน่งไม่สำเร็จ: ' + e.message) }
  }

  /* ---------- the adjust window (the old head / torso / legs sliders, live) ---------- */
  function sil(img, flip) { const c = document.createElement('canvas'); c.width = c.height = SRC; const g = c.getContext('2d', { willReadFrequently: true }); if (flip) { g.translate(SRC, 0); g.scale(-1, 1) } g.drawImage(img, 0, 0, SRC, SRC); const d = g.getImageData(0, 0, SRC, SRC).data; let top = SRC, bot = -1; for (let y = 0; y < SRC; y++) for (let x = 0; x < SRC; x++) if (d[(y * SRC + x) * 4 + 3] > 40) { top = Math.min(top, y); bot = Math.max(bot, y); break } if (bot < 0) return null; return { w: SRC, h: SRC, top, bottom: bot, H: bot - top + 1 } }
  function openAdjust(ck) {
    const c = cur.cells[ck], P = peek(ck)?.p || {}, PAm = PA(); if (!PAm) return msg('ไม่พบตัวปรับสัดส่วน');
    if (off(ck)[0] || off(ck)[1]) return msg('ท่านี้ย้ายภาพไว้ยังไม่บันทึก — กด 💾 บันทึกตำแหน่งภาพก่อน แล้วค่อยปรับสัดส่วน');
    if (!c.img || !P.chin || !P.crotch) return msg('วางจุด คาง และ เส้นตัดขา (ขาหนีบ) ของท่านี้ก่อน (ตัวปรับตัดภาพที่สองจุดนี้)');
    const m = sil(c.img, c.flip); if (!m) return msg('ภาพว่าง');
    const S = { head: 100, torso: 100, legs: 100, shoulder: 100, wLegs: 100, wTorso: 100 }, O = { keep: true }, ref = peek('idle@' + c.dir)?.p || peek('idle@SW')?.p;
    const marksOf = mm => ({ chin: Math.min(.9, Math.max(.04, (P.chin[1] - mm.top) / mm.H)), hip: Math.min(.95, Math.max(.2, (P.crotch[1] - mm.top) / mm.H)), headTop: 0, ankle: 1 });
    const box = document.createElement('div'); box.id = 'psAdj';
    const SL = [['head', 'หัว (ใหญ่-เล็ก)'], ['torso', 'ลำตัว (สูง)'], ['legs', 'ขา (ยาว)'], ['shoulder', 'ไหล่ กว้าง'], ['wTorso', 'ลำตัว หนา'], ['wLegs', 'ท่อนขา หนา']];
    box.innerHTML = `<div class="box" role="dialog" aria-label="ปรับสัดส่วน"><h3>🛠 ปรับสัดส่วน · ${esc(cur.name)} · ${POSES.find(p => p[0] === c.pose)[1]} ${c.dir}</h3>
      <div class="row"><div><div style="font-size:12px">ก่อน</div><canvas id="adjB" width="384" height="384"></canvas></div><div><div style="font-size:12px">หลัง (พรีวิวสด)</div><canvas id="adjA" width="384" height="384"></canvas></div>
      <div class="ctl">${SL.map(([k, l]) => `<div class="sl"><span>${l}</span><input type="range" data-s="${k}" min="60" max="150" step="1" value="100"><span><input type="number" data-n="${k}" min="60" max="150" step="1" value="100">%</span><span class="pm" style="display:flex;gap:3px">${[-5, -1, 1, 5].map(d => `<button type="button" data-d="${k},${d}">${d > 0 ? '+' : '−'}${Math.abs(d)}</button>`).join('')}</span></div>`).join('')}
        <label style="display:flex;gap:6px;align-items:center;margin:6px 0"><input type="checkbox" id="adjKeep" checked>คงความสูงตัวเท่าเดิม (ขนาดในเกมไม่เปลี่ยน)</label>
        <div class="btns"><button type="button" id="adjAuto" ${ref?.top && ref?.chin ? '' : 'disabled'} title="ปรับหัวให้ได้สัดส่วนหัว÷ตัวเท่าท่ายืน ${c.dir}">✨ ให้หัวเท่าท่ายืน</button><button type="button" id="adjReset">รีเซ็ต</button></div>
        <div class="msg" id="adjMsg"></div><div class="btns"><button type="button" class="main" id="adjSave">🛒 บันทึกเป็นภาพใหม่ (ทุกเฟรมของท่านี้)</button><button type="button" id="adjClose">ปิด</button></div></div></div></div>`;
    document.body.append(box);
    const bc = $('adjB').getContext('2d'), ac = $('adjA').getContext('2d'), say = t => $('adjMsg').textContent = t; let t = 0, busy = false;
    const bg = () => { bc.clearRect(0, 0, 384, 384); bc.save(); if (c.flip) { bc.translate(384, 0); bc.scale(-1, 1) } bc.drawImage(c.img, 0, 0, 384, 384); bc.restore(); const y = GY; bc.strokeStyle = '#6fa16f'; bc.beginPath(); bc.moveTo(0, y + .5); bc.lineTo(384, y + .5); bc.stroke() };
    const scaleObj = () => ({ head: S.head / 100, torso: S.torso / 100, legs: S.legs / 100, shoulder: S.shoulder / 100, wTorso: S.wTorso / 100, wLegs: S.wLegs / 100 });
    const render = (img, flip) => { const mm = sil(img, flip) || m, r = PAm.warp(img, mm, marksOf(mm), scaleObj(), { keepHeight: O.keep, flip, grow: Math.round(mm.H * .03), sharpen: 'auto' }); const o = document.createElement('canvas'); o.width = o.height = SRC; o.getContext('2d').drawImage(r.canvas, -r.offset[0], -r.offset[1]); return { canvas: o, res: r } };
    const live = () => { clearTimeout(t); t = setTimeout(() => { try { const { canvas } = render(c.img, c.flip); ac.clearRect(0, 0, 384, 384); ac.drawImage(canvas, 0, 0); ac.strokeStyle = '#6fa16f'; ac.beginPath(); ac.moveTo(0, GY + .5); ac.lineTo(384, GY + .5); ac.stroke(); say('') } catch (e) { say('พรีวิวไม่สำเร็จ: ' + e.message) } }, 120) };
    bg(); live();
    box.querySelectorAll('[data-s]').forEach(i => i.oninput = () => { S[i.dataset.s] = +i.value; box.querySelector(`[data-n="${i.dataset.s}"]`).value = i.value; live() });
    box.querySelectorAll('[data-d]').forEach(b => b.onclick = () => { const [k, d] = b.dataset.d.split(','), v = Math.max(60, Math.min(150, S[k] + +d)); S[k] = v; box.querySelector(`[data-s="${k}"]`).value = v; box.querySelector(`[data-n="${k}"]`).value = v; live() });
    box.querySelectorAll('[data-n]').forEach(i => i.onchange = () => { const v = Math.max(60, Math.min(150, +i.value || 100)); S[i.dataset.n] = v; box.querySelector(`[data-s="${i.dataset.n}"]`).value = v; i.value = v; live() });
    $('adjKeep').onchange = ev => { O.keep = ev.target.checked; live() };
    $('adjReset').onclick = () => { for (const k of Object.keys(S)) { S[k] = 100; box.querySelector(`[data-s="${k}"]`).value = 100; box.querySelector(`[data-n="${k}"]`).value = 100 } live() };
    $('adjAuto').onclick = () => { const mk = marksOf(m), seg = PAm.segments(m, mk), headFrac = (ref.chin[1] - ref.top[1]) / ((anchorOf('idle@' + c.dir) || anchorOf('idle@SW') || [0, ref.top[1] + (m.bottom - m.top)])[1] - ref.top[1]); const a = PAm.autoScale(seg, { head: true, torso: false, legs: false }, headFrac); S.head = Math.round(a.head * 100); box.querySelector('[data-s="head"]').value = S.head; box.querySelector('[data-n="head"]').value = S.head; live(); say('หัว ' + S.head + '% เพื่อให้หัว÷ตัว = ' + (headFrac * 100).toFixed(1) + '% (เท่าท่ายืน)') };
    $('adjClose').onclick = () => box.remove(); box.onclick = e => { if (e.target === box) box.remove() };
    $('adjSave').onclick = async () => {
      if (busy) return; busy = true; $('adjSave').disabled = true; try {
        const frames = c.clip.frames, items = []; let n = 0;
        for (const f of frames) { say('ปรับ ' + (++n) + '/' + frames.length + '…'); const img = await frameImg(f); if (!img) throw new Error('โหลดภาพไม่ได้'); const fl = flipOf(c, f), { canvas } = render(img, fl); items.push({ file: f.file, dataUrl: toURL(fl ? mirrorCv(canvas) : canvas) }); await new Promise(r => setTimeout(r, 0)) }
        say('กำลังบันทึก…'); await apply(items); const r = peek(ck); if (r) { r.ok = false; r.fp = null } write(KEY, DATA); say('✔ บันทึกแล้ว · รอกด “Push ที่แก้” / Cart · จุดอาจเลื่อน ตรวจอีกครั้งในหน้าเรียงท่า'); setTimeout(async () => { box.remove(); await load() }, 900);
      } catch (e) { say('ไม่สำเร็จ: ' + e.message); busy = false; $('adjSave').disabled = false }
    };
  }

  /* ---------- push ---------- */
  async function pushMarks() {
    const G = root.GitHubPush; if (!G?.pushSettings) return msg('ไม่พบระบบ Push');
    try { msg('กำลังใส่จุด/ติ๊กลง Cart…'); const r = await G.pushSettings([KEY], '📐 เรียงท่า: จุด datum + ติ๊กตรวจ'); msg('✔ ' + (r || 'บันทึกแล้ว')) } catch (e) { msg('ไม่สำเร็จ: ' + e.message) }
  }
  async function saveSizes() {
    const G = root.GitHubPush; if (!G?.commit) return msg('ไม่พบระบบ Push'); if (!draftCount()) return;
    const draft = JSON.parse(JSON.stringify(DRAFT)), PATH = 'js/character-scale-adjust-data.js';
    const merge = text => {
      const i = text.indexOf('window.CHARACTER_SCALE_ADJUST'), a = text.indexOf('{', i), b = text.lastIndexOf('}'); const head = text.slice(0, i), data = JSON.parse(text.slice(a, b + 1));
      data.pose ||= {}; for (const [k, m] of Object.entries(draft)) for (const [ck, v] of Object.entries(m)) { if (Math.abs(v - 1) < .0005) { if (data.pose[k]) delete data.pose[k][ck] } else (data.pose[k] ||= {})[ck] = +v.toFixed(4) }
      for (const k of Object.keys(data.pose)) if (!Object.keys(data.pose[k]).length) delete data.pose[k];
      return { text: head + 'window.CHARACTER_SCALE_ADJUST = ' + JSON.stringify(data) + ';\n', data };
    };
    try {
      msg('กำลังบันทึกขนาด…'); let out = null;
      const r = await G.commit('📐 เรียงท่า: ปรับขนาดท่า', async h => { const t = await h.read(PATH); if (!t) throw new Error('อ่าน ' + PATH + ' ไม่ได้'); out = merge(t); return [{ path: PATH, content: out.text }] });
      if (out) root.CHARACTER_SCALE_ADJUST = out.data; DRAFT = {}; write(SKEY, DRAFT);
      try { const f = $('lineupDockFrame'); if (f?.src) f.contentWindow.location.reload() } catch (e) { }
      draw(); msg('✔ ' + (r || 'บันทึกแล้ว') + ' · ขนาดท่าใช้ในเกมหลังเว็บอัปเดต');
    } catch (e) { msg('บันทึกไม่สำเร็จ: ' + e.message) }
  }

  /* follow the character picked in the Animation tab / the lineup row */
  let lastEnt = null, lastGen = null;
  setInterval(() => { const st = B()?.state; if (!st) return; if (!$('poseSheet')) build(); const key = st.entity + '|' + (root.StudioVariants?.active || ''); if (key !== lastEnt || st.generation !== lastGen) { lastEnt = key; lastGen = st.generation; if (document.body.classList.contains('sheet-mode')) load(); else { const e = entity(); if (e) { cur = { id: e.id, name: e.name, cells: {} }; for (const [pose] of POSES) for (const [dir] of ROWS) { const ff = firstFrame(e, pose, dir); if (ff) cur.cells[cellKey(pose, dir)] = mkCell(pose, dir, ff) } status() } } } }, 500);
  addEventListener('studio-frames-changed', () => { lastGen = null });
  root.PoseSheet = { load, mode, counts: () => counts(), KEY, SKEY, RKEY };
})(globalThis);
