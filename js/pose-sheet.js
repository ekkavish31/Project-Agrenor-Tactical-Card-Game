/* v98.658 · 📐 เรียงท่า — the new proportion tool of Asset Studio (Animation tab), replacing 📐 สัดส่วน / 📍 Datum of scale-lineup.html.
   ONE character at a time: every pose (idle · walk · windup · strike · guard · hit · down) of SW and NE side by side, first frame of each pose as the stand-in
   (what is done to a pose applies to every frame of that pose), all on the same ruler: same scale, same ground line. SE / NW are the mirror copies of SW / NE.
   • DATUM POINTS (12, placed in this order): eyes L/R · chin · skull top · neck cut · shoulder L/R · crotch · leg edge L/R · foot L/R.  Numbers of each pose are shown under it
     (head · shoulder width · torso · leg length · leg thickness, px and % of the body height, and the change against the SW standing pose).
     The FOOT POINT of a pose = the middle of the two ground-contact points (heel when the heel lands, ball when the toe pushes off); for the lying pose ('down') the same: put the two points at the two ENDS of the body's ground contact, the foot point is the middle (v98.782; it used to be foot L alone and ran after it).
   • ✋ MOVE the picture inside its canvas (drag) — "⤓ เข้าเส้นพื้น" puts the foot point on the standard ground point (192, 360). The move is real: 💾 บันทึกตำแหน่งภาพ shifts the pixels of every frame
     of that pose and stores them as new pictures (🛒 Cart → push as before). The cells show 24 px of margin around the real 384 × 384 frame (red) so a foot outside it stays visible; a save that would cut the picture is refused.
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
  const STEPS = [['eyeL', 'ตา ซ้ายภาพ', '#d63384'], ['eyeR', 'ตา ขวาภาพ', '#d63384'], ['headA', 'หัว จุด A (เลือกเอง เช่น หู) · ท่าหันหลัง', '#d63384'], ['headB', 'หัว จุด B (เลือกเอง เช่น กระหม่อม) · ท่าหันหลัง', '#d63384'], ['top', 'ยอดกะโหลก', '#8a4fff'], ['neck', 'เส้นตัดหัว (คอ) · คลิกเรียงจุด คลิกค้างเพื่อจบ', '#e07b00'],
    ['shL', 'ไหล่ ซ้ายภาพ', '#1f7a4d'], ['shR', 'ไหล่ ขวาภาพ', '#1f7a4d'], ['crotch', 'เส้นตัดขา (ขาหนีบ) · คลิกเรียงจุด คลิกค้างเพื่อจบ', '#1d5fbf'], ['legL', 'ความกว้างท่อนขา 1 ข้าง · ขอบซ้าย', '#0d8f99'], ['legR', 'ความกว้างท่อนขา · ขอบขวา', '#0d8f99'],
    ['footL', 'เท้า ซ้าย (จุดแตะพื้น)', '#7b4a12'], ['footR', 'เท้า ขวา (จุดแตะพื้น)', '#7b4a12']];
  const LINES = { neck: 'neckLine', crotch: 'crotchLine' };   /* P.neck / P.crotch = the middle of the line (what the numbers use) · P.neckLine / P.crotchLine = its points · P.<k>Done = the line is finished */
  const lineMid = pts => [Math.round(pts.reduce((a, q) => a + q[0], 0) / pts.length), Math.round(pts.reduce((a, q) => a + q[1], 0) / pts.length)];
  const setLine = (P, k, pts) => { P[LINES[k]] = pts; P[k] = lineMid(pts) };
  const lineOpen = (P, k) => !!(P[LINES[k]] && P[k + 'Done'] === false);
  const STEP = Object.fromEntries(STEPS.map(s => [s[0], s]));
  /* v98.782 · a pose seen from the front (SW row) uses the two EYES for the head size; a pose seen from behind (NE row) has no eyes → two FREE points (A, B) that you choose yourself (e.g. an ear and the crown). Back poses are compared with the STANDING BACK pose (idle NE) only */
  const isBack = ck => /@(NE|NW)$/.test(ck || '');
  const stepsOf = ck => STEPS.filter(s => isBack(ck) ? s[0] !== 'eyeL' && s[0] !== 'eyeR' && s[0] !== 'top' : s[0] !== 'headA' && s[0] !== 'headB');
  const stepsHtml = ck => stepsOf(ck).map(([k, l, col], i) => `<button type="button" data-step="${k}" class="${k === step ? 'on' : ''}"><i style="background:${col}"></i><span class="n">${i + 1}</span>${l.split(' · ')[0]}</button>`).join('');
  /* v98.800 · margin 96 → 48 → 24 px (v98.812: halved again) · the numbers box sits at the top-left corner of the real frame */
  const SRC = 384, GX = 192, GY = 360, PAD = 24;   /* every character frame: 384 × 384, ground point (192, 360) */
  const RCOL = ['#e03131', '#1971c2', '#2f9e44', '#f08c00', '#9c36b5', '#0c8599', '#c2255c', '#5c940d'];
  const $ = id => document.getElementById(id), esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || 'null') || d } catch (e) { return d } };
  const write = (k, v) => { if (k === KEY || k === SKEY || k === RKEY) histNote(); try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) { } };
  /* v98.754 · UNDO / REDO of everything you change in the sheet: the points, the ticks, the moved pictures, the pose sizes, the rulers. Every save is one step; the state before it is kept (80 steps, per character) */
  const UNDO = [], REDO = []; let HLAST = '', HCHAR = null;
  const histSnap = () => { try { return JSON.stringify({ D: DATA, S: DRAFT, R: RUL }) } catch (e) { return '' } };
  function histNote() { const now = histSnap(); if (!HLAST) { HLAST = now; return } if (now === HLAST) return; UNDO.push(HLAST); if (UNDO.length > 80) UNDO.shift(); REDO.length = 0; HLAST = now }
  function histSync(id) { if (HCHAR !== id) { HCHAR = id; UNDO.length = 0; REDO.length = 0 } HLAST = histSnap() }
  function histGo(from, to) {
    if (!from.length) return; const cur0 = histSnap(), s = from.pop(); to.push(cur0);
    try { const o = JSON.parse(s); DATA = o.D || {}; DRAFT = o.S || {}; RUL = Object.assign({ on: true, center: true, ghost: false, lines: [], meas: [] }, o.R || {}) } catch (e) { return }
    HLAST = s; try { localStorage.setItem(KEY, JSON.stringify(DATA)); localStorage.setItem(SKEY, JSON.stringify(DRAFT)); localStorage.setItem(RKEY, JSON.stringify(RUL)) } catch (e) { }
    QA.S = QD(); QA.canvas = null; QA.P = null; QA.msg = ''; draw(); status();
  }
  const undo = () => histGo(UNDO, REDO), redo = () => histGo(REDO, UNDO);
  let DATA = read(KEY, {}), DRAFT = read(SKEY, {}), RUL = Object.assign({ on: true, center: true, ghost: false, lines: [], meas: [] }, read(RKEY, {}));
  const B = () => root.StudioBrowser, PA = () => root.ProportionAdjust;
  const akey = id => { id = String(id || ''); if (id === 'hero') return root.StudioVariants?.active === 'female' ? 'hero-female' : 'hero'; return id.replace(/^(ally|npc):/, '') };
  const cellKey = (pose, dir) => pose + '@' + dir;
  const RUL_UI = false;   /* v98.791 · the ruler lines / 2-line measures are removed from the sheet (their code stays, switched off) */
  const saveRul = () => write(RKEY, RUL);
  const ghostKey = ck => RUL.ghostBack && /@NE$/.test(ck) && cur?.cells['idle@NE'] ? 'idle@NE' : RUL.ghostSame && /@NE$/.test(ck) && cur?.cells[ck.replace(/@NE$/, '@SW')] ? ck.replace(/@NE$/, '@SW') : 'idle@SW';

  /* ---------- sizes (± % per pose × direction) ---------- */
  const committed = () => root.CHARACTER_SCALE_ADJUST || {};
  function sizeOf(id, pose, dir) {
    const k = akey(id), d = DRAFT[k]?.[cellKey(pose, dir)]; if (typeof d === 'number') return d;
    const m = committed().pose?.[k]; const v = m?.[cellKey(pose, dir)] ?? m?.[pose]; return typeof v === 'number' && v > .2 && v < 3 ? v : 1;
  }
  function setSize(id, pose, dir, v) { if (isLocked(cellKey(pose, dir))) { flash(LOCKMSG); return } const k = akey(id); v = Math.max(.3, Math.min(2.5, Math.round(v * 1000) / 1000)); (DRAFT[k] ||= {})[cellKey(pose, dir)] = v; write(SKEY, DRAFT); draw(); status() }
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
    importOld(c); histSync(c.id); draw(); status();
    await Promise.all(Object.values(c.cells).map(async x => { try { x.img = await B().loadImage(x.file) } catch (er) { x.img = null } }));
    /* v98.782 · the "checked / locked" tick belongs to the PICTURE'S PIXELS, not to its revision number: the revision changes whenever the project is pushed / reloaded, which dropped every lock ("ภาพเปลี่ยน") although nothing in the picture had changed. fp = file | px:<hash of the pixels> | m.
       A tick stored with the old revision-style fp (same file) is carried over once: the lock comes back. */
    let mig = false;
    for (const [ck, x] of Object.entries(c.cells)) {
      if (!x.img) continue; const nfp = [x.file, 'px:' + pixHash(x.img), x.flip ? 'm' : ''].join('|'), r = DATA[akey(c.id)]?.[ck];
      if (r && r.fp && r.fp !== nfp && stripExt(r.fp.split('|')[0]) === stripExt(x.file) && !(r.fp.split('|')[1] || '').startsWith('px:')) { r.fp = nfp; mig = true }
      x.fp = nfp;
    }
    if (mig) { try { localStorage.setItem(KEY, JSON.stringify(DATA)) } catch (er) { } HLAST = histSnap() }
    if (cur === c) { draw(); status() }
    /* v98.810 · SHARPNESS of each pose (same number as the "คม" badge of the Animation tiles): the average over the clip's frames (≤ 8) — computed one pose at a time so the page stays responsive */
    (async () => { const S = root.StudioSharp; if (!S?.of) return; for (const x of Object.values(c.cells)) { if (cur !== c) return; try { const fr = x.clip?.frames || [], pick = fr.length > 8 ? Array.from({ length: 8 }, (_, i) => fr[Math.round(i * (fr.length - 1) / 7)]) : fr, vs = []; for (const f of pick) { const im = f.file === x.file && x.img ? x.img : await B().loadImage(f.file); const v = im ? S.of(im) : null; if (v != null) vs.push(v) } x.sharp = vs.length ? vs.reduce((a, b) => a + b, 0) / vs.length : null } catch (er) { x.sharp = null } await new Promise(r => setTimeout(r, 0)) } if (cur === c) draw() })();
    /* v98.817 · once per character: locks ticked before the mirror copy get their twin's datum set too */
    try { const MK = 'pose-sheet.mirrorSync', md = JSON.parse(localStorage.getItem(MK) || '[]'), k2 = akey(c.id); if (!md.includes(k2) && cur === c) { let n = 0; for (const ck of Object.keys(c.cells).filter(okOf)) if (mirrorToTwin(ck)) n++; md.push(k2); localStorage.setItem(MK, JSON.stringify(md)); if (n) write(KEY, DATA) } } catch (er) { }
    /* v98.805 · once per character: locks that were ticked before this feature are marked "ตรวจแล้ว" in the Animation grid too */
    try { const SK = 'pose-sheet.revSync', done = JSON.parse(localStorage.getItem(SK) || '[]'), k = akey(c.id); if (!done.includes(k) && cur === c) { const oks = Object.keys(c.cells).filter(okOf); done.push(k); localStorage.setItem(SK, JSON.stringify(done)); if (oks.length) await reviewSync(oks, true) } } catch (er) { }
  }
  /* v98.788 · a lock saved when the frame was still a .png carries over to the same frame now stored as .webp */
  const stripExt = f => String(f || '').replace(/\.(png|webp)$/i, '');
  function pixHash(img) { try { const c = document.createElement('canvas'); c.width = c.height = SRC; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, SRC, SRC); const d = g.getImageData(0, 0, SRC, SRC).data; let h = 2166136261; for (let i = 0; i < d.length; i += 4) if (d[i + 3] > 8) { h = Math.imul(h ^ d[i], 16777619); h = Math.imul(h ^ d[i + 1], 16777619); h = Math.imul(h ^ d[i + 2], 16777619); h = Math.imul(h ^ (i >> 2), 16777619) } return (h >>> 0).toString(36) } catch (e) { return 'x' } }
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
  /* v98.805 · the LOCK = "ตรวจแล้ว" of the Animation grid: ticking 🔒 approves the pose's clip(s) there — the clip of this direction AND of its mirror twin (SW↔SE, NE↔NW) — unticking sends them back to "รอตรวจ" */
  /* v98.817 · TWIN = the opposite direction (SW↔SE · NE↔NW) when it is a MIRROR COPY of this pose: its first picture is the very same file as this cell's (the Studio mirror link). Poses whose directions have their own pictures have no twin → nothing is copied or approved for them. */
  const OPP = { SW: 'SE', SE: 'SW', NE: 'NW', NW: 'NE' };
  function twinOf(ck) { const c = cur?.cells[ck], o = c && OPP[c.dir]; if (!o) return null; const tw = (entity()?.clips || []).find(cl => cl.action === c.pose && cl.view === o && cl.frames?.length); if (!tw || tw.frames[0].file !== c.file) return null; return { ck: cellKey(c.pose, o), clip: tw } }
  function clipIdsOf(ck) { const c = cur?.cells[ck]; if (!c) return []; const e = entity(), own = (e?.clips || []).find(cl => cl.action === c.pose && cl.view === c.dir && cl.frames?.length) || c.clip, tw = twinOf(ck), ids = new Set(); if (own?.id) ids.add(own.id); if (tw) ids.add(tw.clip.id); return [...ids] }
  /* the datum set of a pose, mirrored for its twin: x → 384 − (x + move), y → y + move; the "left / right of the picture" names swap (eyes · shoulders · leg edges · feet), the points of a cut line are listed the other way round */
  const SWAPLR = { eyeL: 'eyeR', eyeR: 'eyeL', shL: 'shR', shR: 'shL', legL: 'legR', legR: 'legL', footL: 'footR', footR: 'footL' };
  function mirrorSet(P, ox, oy) { const m = v => [Math.round((SRC - (v[0] + ox)) * 10) / 10, Math.round((v[1] + oy) * 10) / 10], out = {}; for (const [k, v] of Object.entries(P || {})) { const nk = SWAPLR[k] || k; out[nk] = Array.isArray(v) && v.length === 2 && typeof v[0] === 'number' ? m(v) : Array.isArray(v) && Array.isArray(v[0]) ? v.map(m).reverse() : v } return out }
  /* copy the datum set of a pose (locked / just baked) to its twin's record — quietly: the sheet shows only SW and NE rows; the twin's own lock is never overwritten */
  function mirrorToTwin(ck) { const tw = twinOf(ck), r = peek(ck); if (!tw || !r?.p || !Object.keys(r.p).length) return false; const rec = (DATA[akey(cur.id)] ||= {}), old = rec[tw.ck]; if (old?.ok) return false; const [ox, oy] = off(ck); rec[tw.ck] = { fp: null, p: mirrorSet(r.p, ox, oy), ok: false, ox: 0, oy: 0, from: 'mirror:' + ck }; return true }
  async function reviewSync(cks, on) { const U = root.StudioUnifiedReview; if (!U?.setVerdictMany) return; const ids = [...new Set(cks.flatMap(clipIdsOf))]; if (!ids.length) return; try { await U.setVerdictMany(ids, on ? 'approved' : 'unreviewed') } catch (e) { console.warn('pose-sheet review sync', e) } }
  const changed = ck => { const r = peek(ck), c = cur?.cells[ck]; return !!(r && c && r.fp && r.fp !== c.fp) };
  const off = ck => { const r = peek(ck); return [r?.ox || 0, r?.oy || 0] };
  function counts() { if (!cur) return { ok: 0, all: 0 }; const ks = Object.keys(cur.cells); return { ok: ks.filter(okOf).length, all: ks.length } }

  /* ---------- numbers of a pose ---------- */
  /* v98.747 · while the quick adjust (side bar) is live on a pose, its numbers and points are the points MOVED with the picture (QA.P), not the stored ones */
  const Pof = ck => (QA.ck === ck && QA.P) ? QA.P : (peek(ck)?.p || {});
  function anchorOf(ck) {
    const r = peek(ck), P = Pof(ck), c = cur?.cells[ck]; if (!c) return null;
    if (P.footL && P.footR) return [(P.footL[0] + P.footR[0]) / 2, (P.footL[1] + P.footR[1]) / 2];
    return P.footL || P.footR || null;
  }
  function vals(ck) {
    const P = Pof(ck), an = anchorOf(ck), c = cur?.cells[ck]; if (!c) return null; const d = (a, b) => a && b ? Math.hypot(a[0] - b[0], a[1] - b[1]) : null;
    const back = isBack(ck);
    if (!an || !(back ? P.headA && P.headB : P.top && P.eyeL && P.eyeR)) return { need: back ? 'วางจุดเท้า + หัว จุด A/B ก่อน' : 'วางจุดเท้า + ยอดกะโหลก + ตาสองข้างก่อน' };
    /* a LYING pose (down): the length is measured along the body axis (skull top → feet), not as a height — the same line whichever way the body lies */
    /* v98.788 · a BACK pose has no skull-top point: the head is just the distance A–B (px), nothing is measured as a % of the height — back poses are compared in px against the standing back pose */
    const H = back ? null : c.pose === 'down' ? Math.max(0, ...[P.footL, P.footR].filter(Boolean).map(f => d(P.top, f))) : an[1] - P.top[1]; if (!back && !(H >= 20)) return { need: 'ความสูงตัวผิดปกติ' };
    /* v98.782 · HEAD = (skull top → the EYE LINE) × 2. The eye line = the line through the two eyes; the distance is taken straight to that line (so a tilted or lying head works), twice = the whole head. The jaw / an open mouth does not count.
       The old head (skull top → chin) stays below as "หัว→คาง", for reference only. */
    let topToEyes = 0; if (!back) { const ex = P.eyeR[0] - P.eyeL[0], ey = P.eyeR[1] - P.eyeL[1], el = Math.hypot(ex, ey), tx = P.top[0] - P.eyeL[0], ty = P.top[1] - P.eyeL[1]; topToEyes = el >= 2 ? Math.abs(tx * ey - ty * ex) / el : d(P.top, [(P.eyeL[0] + P.eyeR[0]) / 2, (P.eyeL[1] + P.eyeR[1]) / 2]) }
    /* v98.795 · TOTAL HEIGHT = ground point → head top: the skull-top point on a front pose, point B on a back pose (lying: straight distance to the feet) */
    const tall = back ? (c.pose === 'down' ? d(an, P.headB) : an[1] - P.headB[1]) : H;
    const o = { H, tall, headLabel: back ? 'หัว (A–B)' : 'หัว (ตา×2)', head: back ? d(P.headA, P.headB) : topToEyes * 2, sh: d(P.shL, P.shR), torso: P.neck && P.crotch ? P.crotch[1] - P.neck[1] : null, leg: P.crotch ? an[1] - P.crotch[1] : null, thick: d(P.legL, P.legR), sharp: c.sharp ?? null };
    return o;
  }
  const pct = (v, H) => v == null ? '—' : (v / H * 100).toFixed(1) + '%';
  function valsHtml(ck) {
    const v = vals(ck); if (!v) return ''; if (v.need) return `<div class="vals dim">${v.need}</div>`;
    const bk = 'idle@' + cur.cells[ck].dir, base = (ck === bk || ck === 'idle@SW' ? null : isBack(ck) ? vals(bk) : vals(bk) || vals('idle@SW'));   /* back poses: only against the standing BACK pose */
    const bkP = v.H == null, row = (n, a, bk, dim) => { const p = a == null ? null : bkP ? a : a / v.H * 100; let dl = ''; if (base && !base.need && base[bk] != null && p != null) { const q = bkP ? base[bk] : base[bk] / base.H * 100, x = (p - q) / q * 100; dl = ` <i class="${Math.abs(x) > 5 ? 'bad' : Math.abs(x) > 2 ? 'warn' : 'ok'}">${x > 0 ? '+' : ''}${x.toFixed(1)}%</i>` } return `<tr${dim ? ' style="opacity:.5"' : ''}><td>${n}</td><td>${a == null ? '—' : Math.round(a)}px</td><td>${p == null || bkP ? '' : p.toFixed(1) + '%'}${dl}</td></tr>` };
    return `<table class="vals">${bkP ? row('สูงรวม', v.tall, 'tall') : `<tr><td>สูงรวม</td><td>${Math.round(v.H)}px</td><td>${base && !base.need ? ((v.H / base.H - 1) * 100 >= 0 ? '+' : '') + ((v.H / base.H - 1) * 100).toFixed(1) + '% จากยืน' : ''}</td></tr>`}${row(v.headLabel, v.head, 'head')}${row('ไหล่กว้าง', v.sh, 'sh')}${row('ท่อนขา หนา', v.thick, 'thick')}${v.sharp == null ? '' : `<tr title="ความคมของภาพ (ยิ่งสูงยิ่งคม · เฉลี่ยทุกเฟรมของท่า) — ไม่ใช่ DPI"><td>ความคม</td><td>${v.sharp.toFixed(1)}</td><td></td></tr>`}</table>`;
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
#poseSheet .qa-r{border-top:1px solid #e4e6da;padding-top:4px}#poseSheet .qa-h{display:flex;justify-content:space-between;font-size:12.5px}#poseSheet .qa-b{display:flex;gap:4px;margin-top:2px}#poseSheet .qa-b button{flex:1;padding:3px 0}
#poseSheet .ps-zone{grid-area:zone;min-width:0;overflow-x:auto}
#poseSheet .ps-c .ctl button.on{background:#ffe3c2;border-color:#e07b00;font-weight:700}#poseSheet .ps-c{position:relative}#poseSheet .ps-c[data-ck]>.vals{position:absolute;top:calc(var(--pz,0px) + 6px);left:calc(var(--pz,0px) + 6px);width:auto;min-width:172px;margin:0;font-size:11px;background:#fffdf6ec;border:1.5px solid #b9c48a;border-radius:8px;padding:3px 5px;box-shadow:0 1px 4px #0003;pointer-events:none;z-index:4}#poseSheet .ps-c[data-ck]>.vals td{padding:1px 4px}#poseSheet .ps-c.locked{outline:12px solid #2f9e44;outline-offset:-12px}   /* v98.811 · green frame of a locked pose 3 → 9 → 12 px, drawn inward */#poseSheet .ps-c.locked::after{content:'🔒';position:absolute;top:16px;left:16px;font-size:24px;line-height:1;pointer-events:none;filter:drop-shadow(0 1px 2px #0008)}body:not(.ps-sel) #poseSheet .ps-c.locked canvas{cursor:not-allowed}#poseSheet .ps-loupe{position:absolute;top:98px;right:98px;width:180px;height:180px;border:3px solid #8a4fff;border-radius:10px;background:#fff;box-shadow:0 3px 12px #0006;pointer-events:none;z-index:5}
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
#poseSheet .ps-c canvas{display:block;cursor:crosshair}body.ps-hand #poseSheet .ps-c canvas{cursor:grab}body.ps-sel #poseSheet .ps-c canvas{cursor:default}#poseSheet .ps-c .ctl{display:flex;flex-wrap:wrap;gap:4px;align-items:center;justify-content:center;padding:4px;font-size:12px}
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

  /* v98.748 · every scroll position that matters (page, every scrolling ancestor of the sheet, the zone, the side bar) — kept across a redraw, and across a moment where the sheet is emptied (no character selected for an instant) */
  let SCROLLMEM = null, ZOOMKEEP = null;
  function scrollNow(ps) { const g = ps.querySelector('.ps-grid'), k = { gl: g ? g.scrollLeft : 0, gt: g ? g.scrollTop : 0, arr: [], wx: scrollX, wy: scrollY, zl: $('psZone')?.scrollLeft || 0, zt: $('psZone')?.scrollTop || 0, st: $('psSide')?.scrollTop || 0 }; for (let n = ps; n; n = n.parentElement) k.arr.push([n, n.scrollTop, n.scrollLeft]); return k }
  function draw() {
    const ps = $('poseSheet'); if (!ps || !document.body.classList.contains('sheet-mode')) return;
    if (!cur) { if (ps.querySelector('.ps-app')) SCROLLMEM = scrollNow(ps); ps.innerHTML = '<div class="ps-msg">เลือกตัวละครจากแถว ⚖ Scale Lineup ด้านบน หรือจากรายการ Animation</div>'; return }
    const HID = hidSet(), cells = cur.cells, nd = draftCount(), moved = Object.keys(cells).filter(ck => off(ck)[0] || off(ck)[1]).length, W = cwid();
    /* v98.742 · LAYOUT: a sticky TOP BAR (name · next point · the tools used all the time) + a sticky SIDE BAR (the 12 points, the selected pose, the other tools) + the edit ZONE. ⛶ = full screen: only these three. */
    const mkDirty = marksDirty();
    const swatches = `${RUL.lines.map((l, i) => `<span class="sw" data-rc="l${i}" style="background:${l.c}" title="เปลี่ยนสี · ดับเบิลคลิกลบ"></span>`).join('')}${RUL.meas.map((m, i) => `<span class="sw" data-rc="m${i}" style="background:${m.c};border-radius:3px" title="ตัววัด · เปลี่ยนสี · ดับเบิลคลิกลบ"></span>`).join('')}`;
    let h = `<div class="ps-app"><div class="ps-top" id="psTop"><b class="ps-name">${esc(cur.name)}</b><div class="ps-next" id="psNext"></div><span class="sp" style="flex:1"></span>
        <button type="button" class="act" id="psUndo" ${UNDO.length ? '' : 'disabled'} title="ย้อน (Ctrl+Z)">↶ ย้อน</button><button type="button" class="act" id="psRedo" ${REDO.length ? '' : 'disabled'} title="ทำซ้ำ (Ctrl+Y / Ctrl+Shift+Z)">↷ ทำซ้ำ</button>
        <button type="button" class="act ${SHOW.pts ? 'on' : ''}" id="psShowPts" title="แสดง/ซ่อนจุด datum บนภาพ">● จุด</button><button type="button" class="act ${SHOW.zone ? 'on' : ''}" id="psShowZone" title="โซนสีแบ่งส่วน: หัว · ลำตัว · ขา (ท่าที่มี คาง + เส้นตัดขา แล้ว)">🎨 โซนสี</button>
        <button type="button" class="act ${tool === 'hand' ? 'on' : ''}" id="psHand" title="ลากภาพในช่อง (H)">✋ ย้ายภาพ</button><button type="button" class="act ${tool === 'dset' ? 'on' : ''}" id="psDset" title="ย้ายจุด datum ทั้งชุดของท่า — ภาพอยู่ที่เดิม ลากในช่องของท่านั้น (ท่าที่ล็อกอยู่ย้ายไม่ได้)">⬚ ย้าย Datum Set</button>
        <label style="font-size:12.5px">ซูม <input id="psZoom" type="range" min=".25" max="2.5" step=".05" value="${Z}"></label>
        <span id="psCartMsg" style="font-size:12.5px;color:#315d46"></span>
        <button type="button" class="act main" id="psCartAll" ${cartPlan().n ? '' : 'disabled'} title="ที่เปลี่ยนทั้งหมด (ปรับสัดส่วนท่าที่เลือก · ตำแหน่งภาพ · ขนาดเข้าเกม · จุด/ติ๊ก/ไม้บรรทัด) → 🛒 Cart รอ Push">${cartPlan().text}</button>
        <button type="button" class="act" id="psFull" title="เต็มจอ: เห็นแค่แถบบน + แถบข้าง + พื้นที่แก้ไข (Esc = ออก)">⛶ เต็มจอ</button></div>
      <div class="ps-side" id="psSide"><div class="ps-sh">จุดที่วาง (ตามลำดับ)</div><div class="ps-steps" role="group" aria-label="จุดที่วาง (ตามลำดับ)">${stepsHtml(act || 'idle@SW')}</div>
        <div class="ps-sh">ท่าที่เลือก</div><div id="psAdjBox"></div>
        <div class="ps-row"><button type="button" class="act" id="psHide" ${act ? '' : 'disabled'} title="ซ่อนท่าที่เลือกออกจากหน้ารวม (ไม่ลบจุด)">🙈 ซ่อนท่านี้</button><button type="button" class="act" id="psUnhideAll" ${HID.size ? '' : 'disabled'}>👁 แสดงทั้งหมด${HID.size ? ' (' + HID.size + ')' : ''}</button></div>
        <button type="button" class="act" id="psClear" ${act ? '' : 'disabled'}>ล้างจุดของท่าที่เลือก</button>
        <label><input type="checkbox" id="psCen" ${RUL.center ? 'checked' : ''}>เส้นกลางช่อง</label><label><input type="checkbox" id="psGho" ${RUL.ghost ? 'checked' : ''}>เงาท่ายืน SW</label><label title="แถวล่าง: ใช้ท่าเดียวกันของแถวบนเป็นเงา"><input type="checkbox" id="psGhoSame" ${RUL.ghostSame ? 'checked' : ''}>เงาแถวล่าง = ท่าเดียวกันแถวบน</label><label title="แถวล่าง: ใช้ท่ายืนหันหลัง (idle NE) เป็นเงา"><input type="checkbox" id="psGhoBack" ${RUL.ghostBack ? 'checked' : ''}>เงาแถวล่าง = ท่ายืนหันหลัง</label><label><input type="checkbox" id="psGhoFlip" ${RUL.ghostFlip ? 'checked' : ''}>⇆ เงาสลับด้าน</label>
        </div>
      <div class="ps-zone" id="psZone">`;
    h += `<div class="ps-grid" style="grid-template-columns:34px repeat(${POSES.length},${W}px)"><div class="ps-h"></div>${POSES.map(([, l]) => `<div class="ps-h">${l}</div>`).join('')}`;
    for (const [dir, rl] of ROWS) {
      h += `<div class="ps-rl">${rl}</div>`;
      for (const [pose] of POSES) {
        const ck = cellKey(pose, dir), c = cells[ck];
        if (!c) { h += `<div class="ps-c none" style="height:${W + 90}px">ไม่มีภาพ</div>`; continue }
        if (HID.has(ck)) { h += `<div class="ps-c hid" style="height:${W + 90}px;display:flex;align-items:center;justify-content:center;flex-direction:column;gap:6px;color:#8a8f7e;background:#efeee6">🙈 ซ่อนอยู่<br>${esc(pose)} ${dir}<button type="button" class="act" data-unhide="${ck}">👁 แสดง</button></div>`; continue }
        const k = kOf(c), ok = okOf(ck), chg = changed(ck), [ox, oy] = off(ck);
        h += `<div class="ps-c${act === ck ? ' act' : ''}${ok ? ' locked' : ''}" data-ck="${ck}" style="--pz:${Math.round(PAD * Z)}px"><canvas width="${W}" height="${W}" aria-label="${pose} ${dir}"></canvas><div class="ctl">
          <button type="button" data-k="-1" title="เล็กลง 1%" ${ok ? 'disabled' : ''}>−1%</button><input data-in type="number" step="0.5" min="30" max="250" value="${(k * 100).toFixed(1)}" aria-label="ขนาด %" ${ok ? 'disabled' : ''}><button type="button" data-k="1" title="ใหญ่ขึ้น 1%" ${ok ? 'disabled' : ''}>+1%</button>
          <label class="${ok ? 'ok' : ''}" title="${ok ? 'ท่านี้ล็อกอยู่ — เอาติ๊กออกเพื่อแก้' : 'ติ๊ก = ตรวจแล้ว และล็อกท่านี้กันแก้พลาด'}"><input type="checkbox" data-ok ${ok ? 'checked' : ''}>${ok ? '🔒 ล็อกแล้ว' : '🔓 ล็อก'}</label>${chg ? '<span class="chg" title="ภาพของท่านี้เปลี่ยนหลังวางจุด/ติ๊ก — ติ๊กหลุดแล้ว">ภาพเปลี่ยน</span>' : ''}
          <button type="button" data-b="snap" title="เลื่อนภาพให้จุดเท้าอยู่ที่จุดพื้น" ${ok ? 'disabled' : ''}>⤓ พื้น</button>${ox || oy ? `<span class="mv" title="ย้ายแล้ว ยังไม่บันทึก">ย้าย ${ox},${oy}</span>` : ''}</div>${valsHtml(ck)}</div>`;
      }
    }
    h += `</div><div class="ps-msg" id="psMsg" role="status">${tool === 'dset' ? 'โหมด ⬚: ลากในช่องเพื่อย้ายจุด datum ทั้งชุดของท่านั้น (ภาพอยู่ที่เดิม)' : tool === 'hand' ? 'โหมด ✋: ลากภาพในช่องเพื่อย้าย' : 'คลิกบนภาพเพื่อวาง <b>' + STEP[step][1] + '</b> · ลากจุดเพื่อย้าย · ลูกศร = ขยับจุดที่เลือก 1 px · Delete = ลบจุด'} · กรอบแดง = ภาพจริง 384×384 (ขอบนอกกรอบจะถูกตัดตอนบันทึก) · เส้นเขียว = เส้นพื้น</div></div></div>`;
    /* v98.742 · re-drawing the sheet must not move the view: every scroll position (page, the sheet, the zone, the side bar) is put back, so you stay on the pose you are working on */
    const keep = ZOOMKEEP || (ps.querySelector('.ps-app') ? scrollNow(ps) : (SCROLLMEM || scrollNow(ps))); SCROLLMEM = null; ZOOMKEEP = null;
    ps.innerHTML = h; document.body.classList.toggle('ps-hand', tool === 'hand' || tool === 'dset'); document.body.classList.toggle('ps-sel', selectMode());
    const back = () => { for (const [n, t, l] of keep.arr) { n.scrollTop = t; n.scrollLeft = l } scrollTo(keep.wx, keep.wy); const z = $('psZone'); if (z) { z.scrollLeft = keep.zl; z.scrollTop = keep.zt } const g = ps.querySelector('.ps-grid'); if (g) { g.scrollLeft = keep.gl; g.scrollTop = keep.gt } const s = $('psSide'); if (s) s.scrollTop = keep.st };
    back(); paintAll(); wire(ps); back();
  }
  /* v98.754 · the height you can really SEE: the nearest scrolling ancestor of the sheet (inside Asset Studio it is the grid area, NOT the whole window — the grid's scroll bar sat below its bottom edge), the sheet itself in full screen, else the window */
  function gridMaxH(ps, gd) {
    let sc = null; for (let n = ps; n && n !== document.documentElement && n !== document.body; n = n.parentElement) { if (/(auto|scroll)/.test(getComputedStyle(n).overflowY) && n.clientHeight > 100) { sc = n; break } }
    const g = gd.getBoundingClientRect();
    if (sc) { const s = sc.getBoundingClientRect(), startInContent = g.top - s.top + sc.scrollTop; return Math.max(240, Math.floor(sc.clientHeight - startInContent - 14)) }
    return Math.max(240, Math.floor(innerHeight - (g.top + scrollY) - 14));
  }
  function visibleH(ps) { for (let n = ps; n && n !== document.documentElement && n !== document.body; n = n.parentElement) { if (/(auto|scroll)/.test(getComputedStyle(n).overflowY) && n.clientHeight > 100) return n.clientHeight } return innerHeight }
  /* v98.755 · SELECT MODE: points hidden (● จุด off) and not moving the picture (✋ off) → the pointer is a plain arrow and a click only SELECTS the pose — nothing is placed */
  const selectMode = () => !SHOW.pts && tool !== 'hand';
  /* v98.753 · LOUPE: while you place / drag a point, a magnified view of the picture around the pointer + a cross-hair sits in the top-right corner of THAT pose's canvas */
  const LOUPE = 180, LZ = 6;
  function hideLoupes(except) { for (const l of document.querySelectorAll('#poseSheet .ps-loupe')) if (l.parentElement !== except) l.remove() }
  function paintLoupe(ck, fx, fy, el) {
    const c = cur?.cells[ck]; if (!c?.img) return; let L = el.querySelector('.ps-loupe');
    if (!L) { hideLoupes(el); L = document.createElement('canvas'); L.className = 'ps-loupe'; L.width = L.height = LOUPE; el.append(L) }
    const s0 = stepInfo(); L.style.borderColor = s0.col; const g = L.getContext('2d'), k = kOf(c), [ox, oy] = off(ck), x0 = GX + (ox - GX) * k, y0 = GY + (oy - GY) * k, s = SRC * k, src = (QA.ck === ck && QA.canvas) || c.img, flip = !(QA.ck === ck && QA.canvas) && c.flip;
    g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, LOUPE, LOUPE); g.fillStyle = '#fff'; g.fillRect(0, 0, LOUPE, LOUPE);
    g.save(); g.beginPath(); g.rect(0, 0, LOUPE, LOUPE); g.clip(); g.translate(LOUPE / 2, LOUPE / 2); g.scale(LZ, LZ); g.translate(-fx, -fy); g.imageSmoothingEnabled = false;
    if (flip) { g.save(); g.translate(x0 + s, y0); g.scale(-1, 1); g.drawImage(src, 0, 0, s, s); g.restore() } else g.drawImage(src, x0, y0, s, s);
    if (SHOW.pts) { const P = Pof(ck); for (const [key, , col] of stepsOf(ck)) { const lk = LINES[key], pts = lk && P[lk]; for (const v of (pts && pts.length ? pts : (P[key] ? [P[key]] : []))) { const [px, py] = toFrame(c, ck, v[0], v[1]); g.fillStyle = col; g.strokeStyle = '#fff'; g.lineWidth = 1 / LZ * 1.4; g.beginPath(); g.arc(px, py, 3.2 / LZ * 1.6, 0, 7); g.fill(); g.stroke() } } }
    g.restore();
    /* the cross-hair: the point goes exactly under the centre (v98.799 · ring and gap halved: radius 12 → 6) */
    const m = LOUPE / 2; g.save(); g.lineWidth = 1.5; g.strokeStyle = s0.col; for (const [a, b, c2, d] of [[m, 0, m, m - 6], [m, m + 6, m, LOUPE], [0, m, m - 6, m], [m + 6, m, LOUPE, m]]) { g.beginPath(); g.moveTo(a, b); g.lineTo(c2, d); g.stroke() } g.strokeStyle = '#fff'; g.lineWidth = 1; g.beginPath(); g.arc(m, m, 6, 0, 7); g.stroke(); g.strokeStyle = s0.col; g.beginPath(); g.arc(m, m, 6.8, 0, 7); g.stroke();
    g.font = '700 11px sans-serif'; g.textAlign = 'left'; g.fillStyle = '#000b'; g.fillRect(0, LOUPE - 17, LOUPE, 17); g.fillStyle = '#fff'; g.fillText(s0.n + '/' + s0.all + ' · ' + s0.short + ' · ' + Math.round(fx) + ',' + Math.round(fy), 6, LOUPE - 5); g.restore();
  }
  /* v98.739 · always say WHICH point comes next (before it is placed): a banner that stays at the top of the sheet + a small label that follows the pointer over a pose */
  const stepInfo = () => { const L = stepsOf(act); const i = L.findIndex(s => s[0] === step), s = L[Math.max(0, i)]; return { n: Math.max(0, i) + 1, all: L.length, label: s[1], short: s[1].split(' · ')[0], col: s[2] } };
  /* v98.745 · SHOW: points on/off · colour zones on/off (head pink · torso blue · legs green, cut at the chin and the crotch line) */
  const SHOW = (() => { try { return { pts: true, zone: false, ...(JSON.parse(localStorage.getItem('pose-sheet.show')) || {}) } } catch (e) { return { pts: true, zone: false } } })();
  const saveShow = () => { try { localStorage.setItem('pose-sheet.show', JSON.stringify(SHOW)) } catch (e) { } };
  /* v98.746 · hide a pose from the overview (per character): 🙈 hides the selected pose's cell (a small placeholder stays), 👁 shows them all again */
  const HKEY = 'pose-sheet.hidden', hidAll = () => { try { return JSON.parse(localStorage.getItem(HKEY)) || {} } catch (e) { return {} } };
  const hidSet = () => new Set(hidAll()[cur?.id] || []);
  const hidSave = set => { const o = hidAll(); if (set.size) o[cur.id] = [...set]; else delete o[cur.id]; try { localStorage.setItem(HKEY, JSON.stringify(o)) } catch (e) { } };
  /* v98.782 · LOCK: a pose with its tick ON ("🔒 ล็อก" = the old "ตรวจแล้ว") cannot be changed by accident — no points, no move, no size, no adjust, no clear, no copy / snap — until the tick is taken off */
  const isLocked = ck => !!ck && okOf(ck);
  let flashT = 0;
  function flash(text) { const el = $('psNext'); if (!el) return; el._h = ''; el.innerHTML = `<b style="background:#a4341c">🔒 ${esc(text)}</b>`; clearTimeout(flashT); flashT = setTimeout(() => { try { updNext() } catch (e) { } }, 2200) }
  function flashOk(text) { const el = $('psNext'); if (!el) return; el._h = ''; el.innerHTML = `<b style="background:#2e6b4f">✔ ${esc(text)}</b>`; clearTimeout(flashT); flashT = setTimeout(() => { try { updNext() } catch (e) { } }, 2600) }
  const LOCKMSG = 'ท่านี้ล็อกอยู่ — เอาติ๊ก “ล็อก” ออกก่อนจึงจะแก้ได้';
  /* v98.782 · no chin point: the cut rows come from the NECK LINE (its middle) and the CROTCH LINE (its middle); an old chin / crotch point is still honoured when a pose has one */
  const midOf = a => a && a.length ? [a.reduce((s, q) => s + q[0], 0) / a.length, a.reduce((s, q) => s + q[1], 0) / a.length] : null;
  const withChin = P => ({ ...P, chin: P.chin || midOf(P.neckLine) || P.neck || null, crotch: P.crotch || midOf(P.crotchLine) || null });
  const marksFor = (P0, mm) => { const P = withChin(P0); return { chin: Math.min(.9, Math.max(.04, (P.chin[1] - mm.top) / mm.H)), hip: Math.min(.95, Math.max(.2, (P.crotch[1] - mm.top) / mm.H)), headTop: 0, ankle: 1 } };
  const ZCACHE = new Map();
  function zoneOver(ck) {
    const c = cur?.cells[ck], P0 = peek(ck)?.p || {}, PAm = PA(); if (!c?.img || !PAm?.zoneWeights) return null;
    const mid2 = a => a && a.length ? [a.reduce((s, q) => s + q[0], 0) / a.length, a.reduce((s, q) => s + q[1], 0) / a.length] : null;
    const P = { ...P0, chin: P0.chin || mid2(P0.neckLine), crotch: P0.crotch || mid2(P0.crotchLine) };   /* zones need only the two lines; the old chin / crotch POINTS are the fallback */
    if (!P.chin || !P.crotch) return null;
    /* v98.782 · the zones are cut by the LINES you drew (ProportionAdjust 'cuts'): the head side of the neck line = head, the far side of the crotch line = ALL legs, whatever direction the lines run (a lying pose: they run up-down) */
    const lineOK = a => Array.isArray(a) && a.length >= 2, hp = P.top || (P.eyeL && P.eyeR ? [(P.eyeL[0] + P.eyeR[0]) / 2, (P.eyeL[1] + P.eyeR[1]) / 2] : null) || (lineOK(P.neckLine) && lineOK(P.crotchLine) ? (() => { const n = mid2(P.neckLine), h = mid2(P.crotchLine), dx = n[0] - h[0], dy = n[1] - h[1], l = Math.hypot(dx, dy) || 1; return [n[0] + dx / l * 12, n[1] + dy / l * 12] })() : P.chin), cuts = lineOK(P.neckLine) && lineOK(P.crotchLine) && hp ? { neck: P.neckLine, hip: P.crotchLine, head: hp } : null;
    const key = [c.fp, P.chin, P.crotch, cuts ? JSON.stringify([P.neckLine, P.crotchLine, hp]) : ''].join('|'); if (ZCACHE.has(key)) return ZCACHE.get(key); let out = null;
    try {
      const m = sil(c.img, c.flip); if (m) {
        const cv = document.createElement('canvas'); cv.width = cv.height = SRC; const q = cv.getContext('2d', { willReadFrequently: true }); if (c.flip) { q.translate(SRC, 0); q.scale(-1, 1) } q.drawImage(c.img, 0, 0, SRC, SRC); q.setTransform(1, 0, 0, 1, 0, 0);
        const d = q.getImageData(0, 0, SRC, SRC), seg = PAm.segments(m, marksFor(P, m)), z = PAm.zoneWeights(d.data, SRC, SRC, seg, { mode: 'band', soft: .06, grow: 10, ...(cuts ? { cuts } : {}) }, m.H), o = q.createImageData(SRC, SRC), rgb = PAm.ZONES.map(zz => zz && zz[1].slice(1).match(/../g).map(v => parseInt(v, 16)));
        for (let i = 0; i < z.labels.length; i++) { const col = rgb[z.labels[i] || 1]; o.data[i * 4] = col[0]; o.data[i * 4 + 1] = col[1]; o.data[i * 4 + 2] = col[2]; o.data[i * 4 + 3] = d.data[i * 4 + 3] * .42 } q.putImageData(o, 0, 0); out = cv
      }
    } catch (e) { out = null; console.error('pose-sheet zones', e) }
    ZCACHE.set(key, out); return out;
  }
  /* v98.745 · QUICK ADJUST (the old 🛠 ปรับสัดส่วน sliders as ± buttons, live on the selected pose): head · torso height / width · shoulders · legs length / width */
  const QD = () => ({ head: 100, torso: 100, wTorso: 100, shoulder: 100, legs: 100, wLegs: 100 });
  const QA = { ck: null, S: QD(), keep: true, canvas: null, P: null, t: 0, busy: false, msg: '' };
  const QROWS = [['head', 'หัว ใหญ่-เล็ก'], ['torso', 'ลำตัว สูง (แนวตั้ง)'], ['wTorso', 'ลำตัว หนา (แนวนอน)'], ['legs', 'ขา ยาว (แนวตั้ง)'], ['wLegs', 'ท่อนขา หนา (แนวนอน)']];
  const qaDirty = () => Object.values(QA.S).some(v => v !== 100);
  const qaScale = () => Object.fromEntries(Object.entries(QA.S).map(([k, v]) => [k, v / 100]));
  /* v98.782 · LYING pose (down): rotate the picture about its centre so that the line skull-top → feet points down, run the same re-proportion there (the head / torso / legs cut by the neck LINE and the crotch LINE, which turn with it), then rotate back */
  /* the picture is turned on a canvas 1.5× bigger than the frame (a long body turned by an angle that is not 90° sticks out of a 384 × 384 canvas: the ends of the arms / legs were cut off), so nothing is lost; the points turn the same way */
  const rotToD = (p, th, D) => { const c = Math.cos(th), s = Math.sin(th), x = p[0] - SRC / 2, y = p[1] - SRC / 2; return [D / 2 + x * c - y * s, D / 2 + x * s + y * c] };
  const rotFromD = (q, th, D) => { const c = Math.cos(-th), s = Math.sin(-th), x = q[0] - D / 2, y = q[1] - D / 2; return [SRC / 2 + x * c - y * s, SRC / 2 + x * s + y * c] };
  function bodyAxisAngle(P) { const f = P.footL && P.footR ? [(P.footL[0] + P.footR[0]) / 2, (P.footL[1] + P.footR[1]) / 2] : (P.footL || P.footR); const T = P.top || (P.headA && P.headB ? [(P.headA[0] + P.headB[0]) / 2, (P.headA[1] + P.headB[1]) / 2] : null); if (!T || !f) return null; const vx = f[0] - T[0], vy = f[1] - T[1]; if (Math.hypot(vx, vy) < 20) return null; return Math.PI / 2 - Math.atan2(vy, vx) }
  function silS(img, S) { const c = document.createElement('canvas'); c.width = c.height = S; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0, S, S); const d = g.getImageData(0, 0, S, S).data; let top = S, bot = -1; for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) if (d[(y * S + x) * 4 + 3] > 40) { top = Math.min(top, y); bot = Math.max(bot, y); break } if (bot < 0) return null; return { w: S, h: S, top, bottom: bot, H: bot - top + 1 } }
  function qaRenderDown(img, flip, P) {
    const th = bodyAxisAngle(P); if (th == null) return null; const D = Math.ceil(SRC * 1.5), mk = n => { const c = document.createElement('canvas'); c.width = c.height = n; return c };
    const src = mk(D), sg = src.getContext('2d'); sg.translate(D / 2, D / 2); sg.rotate(th); sg.translate(-SRC / 2, -SRC / 2); if (flip) { sg.translate(SRC, 0); sg.scale(-1, 1) } sg.drawImage(img, 0, 0, SRC, SRC);
    const P2 = {}; for (const [k, v] of Object.entries(P)) P2[k] = Array.isArray(v) && v.length === 2 && typeof v[0] === 'number' ? rotToD(v, th, D) : Array.isArray(v) && Array.isArray(v[0]) ? v.map(q => rotToD(q, th, D)) : v;
    const mm = silS(src, D); if (!mm) return null; const cuts = Array.isArray(P2.neckLine) && P2.neckLine.length >= 2 && Array.isArray(P2.crotchLine) && P2.crotchLine.length >= 2 && (P2.top || (P2.headA && P2.headB)) ? { neck: P2.neckLine, hip: P2.crotchLine, head: P2.top || [(P2.headA[0] + P2.headB[0]) / 2, (P2.headA[1] + P2.headB[1]) / 2] } : null;
    const r = PA().warp(src, mm, marksFor(P2, mm), qaScale(), { keepHeight: QA.keep, flip: false, grow: Math.round(mm.H * .03), sharpen: 'auto', ...(cuts ? { cuts } : {}) });
    const wo = mk(D); wo.getContext('2d').drawImage(r.canvas, -r.offset[0], -r.offset[1]);
    const out = mk(SRC), og = out.getContext('2d'); og.translate(SRC / 2, SRC / 2); og.rotate(-th); og.translate(-D / 2, -D / 2); og.drawImage(wo, 0, 0); out.res = r; out.rot = th; out.D = D; return out;
  }
  function qaRender(img, flip, P, down) { if (down) return qaRenderDown(img, flip, P); const mm = sil(img, flip); if (!mm) return null; const r = PA().warp(img, mm, marksFor(P, mm), qaScale(), { keepHeight: QA.keep, flip, grow: Math.round(mm.H * .03), sharpen: 'auto' }); const o = document.createElement('canvas'); o.width = o.height = SRC; o.getContext('2d').drawImage(r.canvas, -r.offset[0], -r.offset[1]); o.res = r; return o }
  /* where every datum point goes with the picture (PA.mapPoint of the warp, minus the offset the preview is drawn at) */
  function qaMovePoints(P, cv) {
    const r = cv.res, th = cv.rot, D = cv.D, mv = v => { const a = th != null ? rotToD(v, th, D) : v, q = PA().mapPoint(r, a[0], a[1]); let b = [q[0] - r.offset[0], q[1] - r.offset[1]]; if (th != null) b = rotFromD(b, th, D); return [Math.round(b[0] * 10) / 10, Math.round(b[1] * 10) / 10] }, out = {};
    for (const [k, v] of Object.entries(P)) out[k] = Array.isArray(v) && v.length === 2 && typeof v[0] === 'number' ? mv(v) : Array.isArray(v) && Array.isArray(v[0]) ? v.map(mv) : v;
    return out;
  }
  /* the numbers under a pose follow the moved points in real time */
  function refreshVals(ck) {
    const cell = document.querySelector(`#poseSheet .ps-c[data-ck="${ck}"]`); if (!cell) return; const html = valsHtml(ck), old = cell.querySelector('.vals');
    if (!html) { old?.remove(); return } const t = document.createElement('div'); t.innerHTML = html; const n = t.firstElementChild; if (old) old.replaceWith(n); else cell.append(n);
  }
  function qaSync() { if (act !== QA.ck) { const was = QA.ck; QA.ck = act; QA.S = QD(); QA.canvas = null; QA.P = null; QA.msg = ''; if (was) refreshVals(was) } }
  function qaLive() { clearTimeout(QA.t); QA.t = setTimeout(() => { const c = cur?.cells[QA.ck], P = peek(QA.ck)?.p; try { QA.canvas = c?.img && withChin(P || {}).chin && withChin(P || {}).crotch && qaDirty() ? qaRender(c.img, c.flip, P, c.pose === 'down') : null; QA.P = QA.canvas ? qaMovePoints(P, QA.canvas) : null } catch (e) { QA.canvas = null; QA.P = null; QA.msg = 'พรีวิวไม่สำเร็จ: ' + e.message; console.error('pose-sheet preview', e) } paintAll(); refreshVals(QA.ck) }, 90) }
  async function qaSave() {
    const ck = QA.ck, c = cur?.cells[ck], P = peek(ck)?.p; if (!c || !withChin(P || {}).chin || !qaDirty() || QA.busy) return false; QA.busy = true; const say = t => { QA.msg = t; const m = $('qaMsg'); if (m) m.textContent = t };
    try {
      const items = []; let n = 0; for (const f of c.clip.frames) { say('ปรับ ' + (++n) + '/' + c.clip.frames.length + '…'); const img = await frameImg(f); if (!img) throw new Error('โหลดภาพไม่ได้'); const fl = flipOf(c, f), cv = qaRender(img, fl, P, c.pose === 'down'); if (!cv) throw new Error('วางยอดกะโหลก + จุดเท้า + เส้นตัดหัว/ขา ให้ครบก่อน'); items.push({ file: f.file, dataUrl: toURL(fl ? mirrorCv(cv) : cv) }); await new Promise(r => setTimeout(r, 0)) }
      say('กำลังบันทึก…'); const moved = QA.P; await apply(items); const r = peek(ck); if (r) { if (moved) r.p = moved; r.ok = false; r.fp = null } write(KEY, DATA); QA.S = QD(); QA.canvas = null; QA.P = null; QA.busy = false; await load(); QA.msg = '✔ ใส่ Cart แล้ว (รอ Push) · ตรวจจุดอีกครั้ง'; updNext(); return true
    } catch (e) { QA.busy = false; say('ไม่สำเร็จ: ' + e.message); return false }
  }
  function qaClick(e) {
    const b = e.target.closest('[data-qd]'); if (b) { const [k, d] = b.dataset.qd.split(','); QA.S[k] = Math.max(60, Math.min(150, QA.S[k] + +d)); QA.msg = ''; qaLive(); updNext(); return }
    if (e.target.closest('#qaReset')) { QA.S = QD(); QA.canvas = null; QA.P = null; QA.msg = ''; paintAll(); refreshVals(QA.ck); return }
    if (e.target.closest('#qaSave')) return cartAll(); if (e.target.closest('#qaWin')) return openAdjust(act);
    if (e.target.id === 'qaKeep') { QA.keep = e.target.checked; qaLive() }
  }
  /* v98.741 · the selected pose (last clicked): once it has its chin + crotch line, the 🛠 re-proportion window (head · torso height / thickness · legs length / thickness) is one click away, right under the banner */
  function adjBar() {
    const c = act && cur?.cells[act]; if (!c) return '<div style="font-size:12.5px;color:#7a5a00">คลิกที่ภาพของท่าหนึ่งเพื่อเลือกท่า</div>';
    qaSync(); const P = peek(act)?.p || {}, name = (POSES.find(q => q[0] === c.pose) || [, c.pose])[1] + ' ' + c.dir;
    if (c.pose === 'down' && bodyAxisAngle(P) == null) return `<div style="font-size:13px;color:#7a5a00">ท่า <b>${esc(name)}</b> เป็นท่านอน — วาง <b>ยอดกะโหลก</b> กับ <b>จุดเท้า</b> ให้ครบก่อน (ใช้หาแกนลำตัว) ตัวปรับจะหมุนภาพให้ลำตัวตั้ง ปรับ แล้วหมุนกลับ</div>`;
    if (isLocked(act)) return `<div style="font-size:13px;color:#2f7a3a">🔒 ท่า <b>${esc(name)}</b> ล็อกอยู่ — เอาติ๊ก “ล็อก” ที่ใต้ภาพออกก่อนจึงจะปรับ/แก้จุดได้</div>`;
    if (!(withChin(P).chin && withChin(P).crotch)) return `<div style="font-size:13px;color:#7a5a00">ท่า <b>${esc(name)}</b> · วาง <b>เส้นตัดหัว (คอ)</b> กับ <b>เส้นตัดขา</b> ให้ครบก่อน จึงจะมีโซนสีและปุ่มปรับสัดส่วน</div>`;
    return `<div style="font-size:13.5px">ท่า <b style="background:#2e6b4f;color:#fff;padding:1px 8px;border-radius:6px">${esc(name)}</b> · 🛠 ปรับสัดส่วน (ดูผลสดบนภาพ)</div>`
      + QROWS.map(([k, l]) => `<div class="qa-r"><div class="qa-h"><span>${l}</span><b>${QA.S[k]}%</b></div><div class="qa-b">${[-5, -1, 1, 5].map(d => `<button type="button" data-qd="${k},${d}">${d > 0 ? '+' : '−'}${Math.abs(d)}</button>`).join('')}</div></div>`).join('')
      + `<label style="font-size:12.5px"><input type="checkbox" id="qaKeep" ${QA.keep ? 'checked' : ''}>คงความสูงตัวเท่าเดิม</label>`
      + `<div class="ps-row"><button type="button" class="act" id="qaReset" ${qaDirty() ? '' : 'disabled'}>↺ รีเซ็ต</button><button type="button" class="act main" id="qaSave" ${qaDirty() && !QA.busy ? '' : 'disabled'} title="เหมือนปุ่ม 🛒 ใส่ Cart ด้านบน — ใส่ทั้งหมดที่เปลี่ยน">🛒 ใส่ Cart</button><button type="button" class="act" id="qaWin" title="หน้าต่างใหญ่ก่อน/หลัง">🔍</button></div><div id="qaMsg" style="font-size:12px;color:#315d46">${esc(QA.msg)}</div>`;
  }
  function updNext() {
    const el = $('psNext'); if (!el) return;
    for (const id of ['psHide', 'psClear']) { const b = $(id); if (b) b.disabled = !act }
    { const box = $('poseSheet')?.querySelector('.ps-steps'), kind = String(isBack(act)); if (box && box.dataset.k !== kind) { if (!stepsOf(act).some(s => s[0] === step)) step = stepsOf(act)[0][0]; box.dataset.k = kind; box.innerHTML = stepsHtml(act || 'idle@SW'); bindSteps($('poseSheet')) } }
    { const cb = $('psCartAll'); if (cb && !cb.dataset.busy) { const pl = cartPlan(); cb.textContent = pl.text; cb.disabled = !pl.n } }
    { const u = $('psUndo'), r = $('psRedo'); if (u) u.disabled = !UNDO.length; if (r) r.disabled = !REDO.length }   /* follow the selected pose without a full redraw */
    const box = $('psAdjBox'); if (box) { const hh = adjBar(); if (box._h !== hh) { box._h = hh; box.innerHTML = hh } }
    if (box) box.onclick = qaClick;
    const top = $('psTop'), sd = $('psSide'); if (top && sd) { const hgt = top.offsetHeight, vh = visibleH($('poseSheet')); sd.style.top = hgt + 'px'; sd.style.maxHeight = Math.max(200, vh - hgt - 8) + 'px'
      const gd = $('poseSheet')?.querySelector('.ps-grid'); if (gd) gd.style.maxHeight = gridMaxH($('poseSheet'), gd) + 'px' }   /* v98.753 · the grid scrolls inside the screen: its sideways scroll bar is always visible (it sat below the fold at a high zoom) */
    if (tool === 'dset') { el.innerHTML = '⬚ โหมดย้าย Datum Set · ลากในช่องของท่า — จุดทั้งชุดเลื่อนตาม ภาพอยู่ที่เดิม'; el._h = ''; return }
    if (tool === 'hand') { el.innerHTML = '✋ โหมดย้ายภาพ · ลากภาพในช่อง'; el._h = ''; return } const s = stepInfo();
    const placed = (act && peek(act)?.p || {})[step] ? ' (วางแล้ว · คลิกใหม่ = ย้าย)' : '';
    const html = `👉 จุดถัดไป <b style="background:#555">${s.n}/${s.all}</b> วาง <b style="background:${s.col}">${esc(s.label)}</b>${placed}`;
    if (el._h !== html) { el._h = html; el.innerHTML = html }   /* only when it changed */
  }
  const paintAll = () => { updNext(); $('poseSheet')?.querySelectorAll('.ps-c[data-ck]').forEach(paint) };
  const ghostCache = new Map();
  function silhouette(img, flip) { const k = img.src + (flip ? 'f' : ''); let c = ghostCache.get(k); if (c) return c; c = document.createElement('canvas'); c.width = c.height = SRC; const g = c.getContext('2d'); if (flip) { g.translate(SRC, 0); g.scale(-1, 1) } g.drawImage(img, 0, 0, SRC, SRC); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = '#ff7a00'; g.fillRect(0, 0, SRC, SRC); ghostCache.set(k, c); return c }
  function paint(el) {
    try { updNext() } catch (e) { console.error('pose-sheet updNext', e) }
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
    /* v98.782 · the ghost = the standing SW pose (as before), or — on the lower row (NE) — the SAME pose of the row above (SW); "⇆ เงาสลับด้าน" mirrors it (flip about the ground point) */
    const gk = ghostKey(ck), gcell = cur.cells[gk];
    if (RUL.ghost && gcell?.img && ck !== gk) { const ia = anchorOf(gk) || [GX, GY], ki = kOf(gcell), mir = !!RUL.ghostFlip, iax = mir ? SRC - ia[0] : ia[0]; const ax = GX - iax * ki, ay = GY - ia[1] * ki; /* the ghost's origin so that its anchor sits on the ground point */ g.save(); const [dx, dy] = sc(ax, ay), s = SRC * ki * Z; g.globalAlpha = .38; g.drawImage(silhouette(gcell.img, !!gcell.flip !== mir), dx, dy, s, s); g.restore() }
    if (c.img) { const prev = QA.ck === ck && QA.canvas; if (prev) drawImg(prev, false, ox, oy, k, 1, false); else drawImg(c.img, c.flip, ox, oy, k, 1, false); if (SHOW.zone && !prev) { const zo = zoneOver(ck); if (zo) drawImg(zo, false, ox, oy, k, 1, false) } } else { g.fillStyle = '#9aa18f'; g.font = '12px sans-serif'; g.textAlign = 'center'; g.fillText('กำลังโหลด…', W / 2, W / 2) }
    /* the real 384 × 384 frame */ { const [x0, y0] = sc(0, 0); g.save(); g.strokeStyle = '#d9480f'; g.lineWidth = 1.5; g.strokeRect(x0 + .5, y0 + .5, SRC * Z, SRC * Z); g.restore() }
    /* rulers */
    if (RUL_UI && RUL.on) {
      RUL.lines.forEach((l, i) => { const [, y] = sc(0, l.y); line(0, y, W, y, l.c, rpick === 'l' + i ? 2.4 : 1.3) });
      RUL.meas.forEach((m, i) => { const [, ya] = sc(0, m.a), [, yb] = sc(0, m.b), idleV = vals('idle@SW'), d = Math.abs(m.b - m.a); line(0, ya, W, ya, m.c, 1.3); line(0, yb, W, yb, m.c, 1.3);
        g.fillStyle = m.c; for (const y of [ya, yb]) { g.beginPath(); g.arc(14, y, rpick === 'm' + i ? 6 : 4.5, 0, 7); g.fill() } line(34, ya, 34, yb, m.c, 1, [3, 3]);
        const lbl = Math.round(d) + 'px' + (idleV && !idleV.need ? ' · ' + (d / idleV.H * 100).toFixed(1) + '% ของสูงยืน SW' : ''); g.font = '11px sans-serif'; g.textAlign = 'left'; const tx = 40, ty = (ya + yb) / 2 + 4; g.fillStyle = '#fffd'; g.fillRect(tx - 2, ty - 11, g.measureText(lbl).width + 6, 15); g.fillStyle = m.c; g.fillText(lbl, tx, ty) });
    }
    /* the points of this pose (moved with the picture while the quick adjust is live) */
    const P = Pof(ck);
    const dot = (key, v, col, label, sel) => { const [fx, fy] = toFrame(c, ck, v[0], v[1]), [x, y] = sc(fx, fy);
      g.fillStyle = col; g.strokeStyle = '#fff'; g.lineWidth = 1.6; g.beginPath(); g.arc(x, y, sel ? 7 : 5, 0, 7); g.fill(); g.stroke();
      /* v98.743 · no text next to a point (it covered the picture) — the colour is enough, the side bar names the points */ };
    for (const [key, , col] of (SHOW.pts ? stepsOf(ck) : [])) {
      const lk = LINES[key], pts = lk && P[lk];
      if (pts && pts.length) {   /* a cut LINE: the points joined by a line (dashed while it is still open) */
        g.save(); g.strokeStyle = col; g.lineWidth = 1.8; if (P[key + 'Done'] === false) g.setLineDash([5, 4]); g.beginPath(); pts.forEach((q, i) => { const [x, y] = sc(...toFrame(c, ck, q[0], q[1])); i ? g.lineTo(x, y) : g.moveTo(x, y) }); g.stroke(); g.restore();
        pts.forEach((q, i) => dot(key + '#' + i, q, col, i === 0 ? STEP[key][1].replace(/ ·.*| \(.*/, '') : '', act === ck && pick === key + '#' + i)); continue }
      const v = P[key]; if (!v) continue; dot(key, v, col, STEP[key][1].replace(/ \(.*| ·.*/, ''), act === ck && pick === key);
    }
    /* the skull-top suggestion: a dashed head ellipse from the eyes + chin (click its top mark to take it, or click elsewhere to place the point yourself) */
    { const sg = SHOW.pts && skullGuess(P); if (sg && !P.top) { const [cx, cy] = sc(...toFrame(c, ck, sg.cx, sg.cy)), [tx, ty] = sc(...toFrame(c, ck, sg.x, sg.y)), k2 = kOf(c) * Z;
        g.save(); g.strokeStyle = '#8a4fff'; g.fillStyle = '#8a4fff22'; g.lineWidth = 1.6; g.setLineDash([5, 4]); g.beginPath(); g.ellipse(cx, cy, sg.rx * k2, sg.ry * k2, 0, 0, 7); g.fill(); g.stroke(); g.setLineDash([]);
        g.fillStyle = '#fff'; g.beginPath(); g.arc(tx, ty, 6, 0, 7); g.fill(); g.stroke(); g.fillStyle = '#8a4fff'; g.restore() } }
    const seg = (a, b, col) => { if (P[a] && P[b]) { const [x1, y1] = sc(...toFrame(c, ck, ...P[a])), [x2, y2] = sc(...toFrame(c, ck, ...P[b])); line(x1, y1, x2, y2, col, 1.4, [4, 3]) } };
    if (SHOW.pts) { seg('shL', 'shR', STEP.shL[2]); seg('legL', 'legR', STEP.legL[2]); seg('footL', 'footR', STEP.footL[2]) }
    const an = SHOW.pts && anchorOf(ck); if (an) { const [x, y] = sc(...toFrame(c, ck, ...an)); line(x - 9, y, x + 9, y, '#000', 2); line(x, y - 9, x, y + 9, '#000', 2); g.strokeStyle = '#fff'; g.lineWidth = 1; g.beginPath(); g.arc(x, y, 6, 0, 7); g.stroke() }
  }
  /* what is under the pointer, in priority: ruler line → point */
  /* the head ellipse that suggests the skull top: eyes in the middle of the head, so crown ≈ eye line − 1.1 × (eye line → chin) */
  function skullGuess(P) { return null;   /* v98.782 · no chin any more → no suggestion */
    if (!P.eyeL || !P.eyeR || !P.chin) return null; const ex = (P.eyeL[0] + P.eyeR[0]) / 2, ey = (P.eyeL[1] + P.eyeR[1]) / 2, f = P.chin[1] - ey; if (f < 6) return null; const y = ey - f * 1.1, x = (ex + P.chin[0]) / 2, ry = (P.chin[1] - y) / 2; return { x, y, cx: x, cy: (y + P.chin[1]) / 2, rx: ry * .78, ry } }
  function hitPoint(c, ck, P, sx, sy) {
    let best = null, bd = 9;
    for (const [key] of stepsOf(ck)) {
      const lk = LINES[key], pts = lk && P[lk];
      if (pts && pts.length) { pts.forEach((v, i) => { const [x, y] = sc(...toFrame(c, ck, ...v)), d = Math.hypot(x - sx, y - sy); if (d < bd) { bd = d; best = key + '#' + i } }); continue }
      const v = P[key]; if (!v) continue; const [x, y] = sc(...toFrame(c, ck, ...v)), d = Math.hypot(x - sx, y - sy); if (d < bd) { bd = d; best = key } }
    return best;
  }
  function hitRuler(sx, sy) {
    if (!RUL_UI || !RUL.on) return null;
    for (let i = 0; i < RUL.meas.length; i++) { const m = RUL.meas[i]; if (Math.abs(sc(0, m.a)[1] - sy) < 6) return { t: 'm', i, e: 'a' }; if (Math.abs(sc(0, m.b)[1] - sy) < 6) return { t: 'm', i, e: 'b' } }
    for (let i = 0; i < RUL.lines.length; i++) if (Math.abs(sc(0, RUL.lines[i].y)[1] - sy) < 5) return { t: 'l', i };
    return null;
  }
  const firstMissing = (P, ck) => stepsOf(ck || act).find(s => !P[s[0]] || (LINES[s[0]] && lineOpen(P, s[0])))?.[0];
  function bindSteps(ps) { ps.querySelectorAll('[data-step]').forEach(b => b.onclick = () => { step = b.dataset.step; pinned = true; tool = 'mark'; draw() }) }
  function wire(ps) {
    if (!ps.dataset.tip) { ps.dataset.tip = '1';   /* the label that follows the pointer */
      const tip = () => { let t = $('psTip'); if (!t) { t = document.createElement('div'); t.id = 'psTip'; t.hidden = true; document.body.append(t) } return t };
      ps.addEventListener('pointermove', ev => {
        const cvs = ev.target.closest?.('.ps-c canvas'), cell = cvs?.closest('.ps-c[data-ck]');
        if (cvs && cell && tool !== 'hand' && SHOW.pts && !isLocked(cell.dataset.ck) && cur?.cells[cell.dataset.ck]?.img) { const [sx, sy] = ptr(cvs, ev), [fx, fy] = unsc(sx, sy); paintLoupe(cell.dataset.ck, fx, fy, cell) } else if (!drag) hideLoupes(null);
      });
      ps.addEventListener('pointermove', ev => { const t = tip(), on = tool !== 'hand' && SHOW.pts && !drag && ev.target.closest?.('.ps-c canvas'); if (!on) { t.hidden = true; return } const s = stepInfo(); t.textContent = s.n + '/' + s.all + ' · ' + s.short; t.style.background = s.col; t.style.left = (ev.clientX + 16) + 'px'; t.style.top = (ev.clientY + 18) + 'px'; t.hidden = false });
      ps.addEventListener('pointerleave', () => { const t = $('psTip'); if (t) t.hidden = true; hideLoupes(null) }) }
    const msg = t => { const m = $('psMsg'); if (m) m.textContent = t };
    bindSteps(ps);
    const zm = $('psZoom'); if (zm) zm.onchange = () => {
      const oldZ = Z; Z = +zm.value; try { localStorage.setItem('pose-sheet.zoom', String(Z)) } catch (e) { }
      /* the cells grow / shrink with the zoom: scale the scroll positions by the same ratio so the pose you are looking at stays in view */
      const r = Z / oldZ, k = scrollNow(ps); for (const a of k.arr) { a[1] *= r; a[2] *= r } k.zl *= r; k.zt *= r; k.gl *= r; k.gt *= r; ZOOMKEEP = k; draw()
    };
    $('psHide').onclick = () => { if (!act) return; const s = hidSet(); s.add(act); hidSave(s); act = null; draw() };
    $('psUnhideAll').onclick = () => { hidSave(new Set()); draw() };
    ps.querySelectorAll('[data-unhide]').forEach(b => b.onclick = () => { const s = hidSet(); s.delete(b.dataset.unhide); hidSave(s); draw() });
    $('psUndo').onclick = undo; $('psRedo').onclick = redo;
    if (!ps._uk) { ps._uk = 1; document.addEventListener('keydown', ev => {
      if (!document.body.classList.contains('sheet-mode') || ev.target.closest?.('input,textarea,select,[contenteditable]')) return; const k = ev.key.toLowerCase();
      if ((ev.ctrlKey || ev.metaKey) && k === 'z' && !ev.shiftKey) { ev.preventDefault(); undo() } else if ((ev.ctrlKey || ev.metaKey) && (k === 'y' || (k === 'z' && ev.shiftKey))) { ev.preventDefault(); redo() } }, true) }
    $('psShowPts').onclick = () => { SHOW.pts = !SHOW.pts; saveShow(); draw() }; $('psShowZone').onclick = () => { SHOW.zone = !SHOW.zone; saveShow(); draw() };
    $('psFull').onclick = () => { const e = document.fullscreenElement; if (e === ps) document.exitFullscreen?.(); else (ps.requestFullscreen?.() || Promise.reject()).catch(() => msg('เปิดเต็มจอไม่ได้ในหน้านี้ — ลองกด F11 ของเบราว์เซอร์')) };
    if (!ps._rz) { ps._rz = 1; addEventListener('resize', () => { try { updNext() } catch (e) { } }) }
    if (!ps._fs) { ps._fs = 1; document.addEventListener('fullscreenchange', () => { const b = $('psFull'); if (b) b.textContent = document.fullscreenElement === ps ? '⛶ ออกจากเต็มจอ' : '⛶ เต็มจอ'; updNext() }) }
    $('psHand').onclick = () => { tool = tool === 'hand' ? 'mark' : 'hand'; draw() };
    $('psDset').onclick = () => { tool = tool === 'dset' ? 'mark' : 'dset'; draw() };
    $('psClear').onclick = () => { if (!act) return; if (isLocked(act)) { flash(LOCKMSG); return } const r = peek(act); if (r) { r.p = {}; r.ok = false; write(KEY, DATA) } pick = null; draw(); status(); reviewSync([act], false) };
    $('psCartAll').onclick = () => cartAll();
    $('psCen').onchange = ev => { RUL.center = ev.target.checked; saveRul(); paintAll() };
    $('psGho').onchange = ev => { RUL.ghost = ev.target.checked; saveRul(); paintAll() };
    $('psGhoSame').onchange = ev => { RUL.ghostSame = ev.target.checked; if (RUL.ghostSame) { RUL.ghost = true; RUL.ghostBack = false } saveRul(); draw() };
    $('psGhoBack').onchange = ev => { RUL.ghostBack = ev.target.checked; if (RUL.ghostBack) { RUL.ghost = true; RUL.ghostSame = false } saveRul(); draw() };
    $('psGhoFlip').onchange = ev => { RUL.ghostFlip = ev.target.checked; if (RUL.ghostFlip) RUL.ghost = true; saveRul(); draw() };
    ps.querySelectorAll('[data-rc]').forEach(b => { const t = b.dataset.rc[0], i = +b.dataset.rc.slice(1), a = t === 'l' ? RUL.lines : RUL.meas; b.onclick = () => { const o = a[i]; if (o) { o.c = RCOL[(RCOL.indexOf(o.c) + 1) % RCOL.length]; saveRul(); draw() } }; b.ondblclick = () => { a.splice(i, 1); saveRul(); draw() } });
    ps.querySelectorAll('.ps-c[data-ck]').forEach(el => {
      const ck = el.dataset.ck, c = cur.cells[ck], cv = el.querySelector('canvas');
      el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => setSize(cur.id, c.pose, c.dir, kOf(c) * (1 + (+b.dataset.k) / 100)));
      const inp = el.querySelector('[data-in]'); inp.onchange = () => { const v = +inp.value; if (v >= 30 && v <= 250) setSize(cur.id, c.pose, c.dir, v / 100) };
      el.querySelector('[data-ok]').onchange = ev => { const r = recOf(ck); r.ok = ev.target.checked; r.fp = c.fp; if (r.ok) mirrorToTwin(ck); write(KEY, DATA); draw(); status(); reviewSync([ck], r.ok) };
      el.querySelector('[data-b="snap"]').onclick = () => { if (snap(ck, true)) { write(KEY, DATA); draw(); msg('เข้าเส้นพื้นแล้ว (ยังไม่บันทึก) — กด 💾 บันทึกตำแหน่งภาพ') } else msg('วางจุดเท้าของท่านี้ก่อน' + (c.pose === 'down' ? ' (ท่านอน: เท้า ซ้าย = จุดแตะพื้นใต้กลางลำตัว)' : ' (เท้า ซ้าย + ขวา)')) };
      cv.ondblclick = ev => { const [sx, sy] = ptr(cv, ev), h = hitRuler(sx, sy); if (h) { (h.t === 'l' ? RUL.lines : RUL.meas).splice(h.i, 1); saveRul(); draw() } };
      cv.onpointerdown = ev => {
        if (isLocked(ck) && !selectMode()) { act = ck; ps.querySelectorAll('.ps-c[data-ck]').forEach(x => x.classList.toggle('act', x.dataset.ck === ck)); hideLoupes(null); paintAll(); flash(LOCKMSG); return }
        if (selectMode()) { act = ck; ps.querySelectorAll('.ps-c[data-ck]').forEach(x => x.classList.toggle('act', x.dataset.ck === ck)); hideLoupes(null); paintAll(); return }
        const [sx, sy] = ptr(cv, ev); act = ck; const rec = recOf(ck), P = rec.p;
        const hr = hitRuler(sx, sy); if (hr) { rpick = hr.t + hr.i; drag = { kind: 'rul', h: hr }; cv.setPointerCapture(ev.pointerId); paintAll(); return }
        if (tool === 'hand') { drag = { kind: 'hand', ck, sx, sy, ox: rec.ox || 0, oy: rec.oy || 0 }; cv.setPointerCapture(ev.pointerId); return }
        /* v98.816 · ⬚ ย้าย Datum Set: the picture stays, every point of the pose moves together */
        if (tool === 'dset') { const [fx0, fy0] = unsc(sx, sy); drag = { kind: 'dset', ck, from: fromFrame(c, ck, fx0, fy0), orig: JSON.parse(JSON.stringify(P)) }; cv.setPointerCapture(ev.pointerId); return }
        let key = hitPoint(c, ck, P, sx, sy);
        if (!key) {
          let k = pinned && stepsOf(ck).some(s => s[0] === step) ? step : (firstMissing(P, ck) || stepsOf(ck)[0][0]); pinned = false; const [fx, fy] = unsc(sx, sy), [x, y] = fromFrame(c, ck, fx, fy), q = [Math.round(x), Math.round(y)];
          if (LINES[k]) {   /* a cut line: this click is its next point; a click-and-HOLD (0.55 s) ends the line */
            const lk = LINES[k]; if (!P[lk] || P[k + 'Done'] !== false) { P[lk] = []; P[k + 'Done'] = false }   /* a finished line asked again starts a new one */
            P[lk].push(q); setLine(P, k, P[lk]); rec.fp = c.fp; write(KEY, DATA); key = k + '#' + (P[lk].length - 1); step = k;
            clearTimeout(holdT); holdT = setTimeout(() => { holdT = 0; const R = peek(ck)?.p; if (R && lineOpen(R, k)) { R[k + 'Done'] = true; write(KEY, DATA); drag = null; step = firstMissing(R, ck) || k; msg((STEP[k][1].replace(/ ·.*/, '')) + ' จบแล้ว'); draw() } }, 550);
          } else {
            const sg = k === 'top' ? skullGuess(P) : null, [gx, gy] = sg ? sc(...toFrame(c, ck, sg.x, sg.y)) : [0, 0];
            if (sg && Math.hypot(gx - sx, gy - sy) < 14) { P.top = [Math.round(sg.x), Math.round(sg.y)]; key = 'top' } else P[k] = q;
            if (k !== key) key = k; rec.fp = c.fp; write(KEY, DATA); step = firstMissing(P, ck) || key;
          }
        }
        pick = key; drag = { kind: 'pt', ck, key }; cv.setPointerCapture(ev.pointerId); draw();
      };
    });
    ps.onpointermove = ev => {
      if (!drag) return;
      if (drag.kind === 'rul') { const el = ps.querySelector('.ps-c canvas'); const [, sy] = ptr(el, ev), fy = Math.round(unsc(0, sy)[1]), h = drag.h, o = h.t === 'l' ? RUL.lines[h.i] : RUL.meas[h.i]; if (!o) return; if (h.t === 'l') o.y = fy; else o[h.e] = fy; paintAll(); return }
      const el = ps.querySelector(`.ps-c[data-ck="${drag.ck}"]`), cv = el?.querySelector('canvas'); if (!cv) return; const [sx, sy] = ptr(cv, ev), c = cur.cells[drag.ck];
      if (drag.kind === 'dset') { const [fx1, fy1] = unsc(sx, sy), q1 = fromFrame(c, drag.ck, fx1, fy1), dx = Math.round(q1[0] - drag.from[0]), dy = Math.round(q1[1] - drag.from[1]), mv = v => Array.isArray(v) && v.length === 2 && typeof v[0] === 'number' ? [v[0] + dx, v[1] + dy] : Array.isArray(v) && Array.isArray(v[0]) ? v.map(q => [q[0] + dx, q[1] + dy]) : v, np = {}; for (const [k, v] of Object.entries(drag.orig)) np[k] = mv(v); const r = recOf(drag.ck); r.p = np; r.fp = c.fp; paint(el); return }
      if (drag.kind === 'hand') { const k = kOf(c), r = peek(drag.ck) || recOf(drag.ck); r.ox = Math.round(drag.ox + (sx - drag.sx) / Z / k); r.oy = Math.round(drag.oy + (sy - drag.sy) / Z / k); paint(el); return }
      const [fx, fy] = unsc(sx, sy), [x, y] = fromFrame(c, drag.ck, fx, fy), q = [Math.round(x), Math.round(y)], R = recOf(drag.ck).p;
      if (holdT) { const last = drag.key.includes('#') && R[LINES[drag.key.split('#')[0]]]?.[+drag.key.split('#')[1]]; if (!last || Math.hypot(last[0] - q[0], last[1] - q[1]) > 4) { clearTimeout(holdT); holdT = 0 } }   /* moving cancels the hold */
      if (drag.key.includes('#')) { const [k, i] = drag.key.split('#'), pts = R[LINES[k]]; if (pts && pts[+i]) { pts[+i] = q; setLine(R, k, pts) } } else R[drag.key] = q; paint(el);
    };
    ps.onpointerup = () => { clearTimeout(holdT); holdT = 0; if (drag) { if (drag.kind === 'rul') saveRul(); write(KEY, DATA); const hand = drag.kind === 'hand' || drag.kind === 'dset'; drag = null; if (hand) draw() } };
  }
  addEventListener('keydown', ev => {
    if (!document.body.classList.contains('sheet-mode') || $('psAdj') || /INPUT|TEXTAREA|SELECT/.test(ev.target?.tagName || '')) return;
    if (ev.key === 'h' || ev.key === 'H') { tool = tool === 'hand' ? 'mark' : 'hand'; draw(); return }
    if (ev.key === 'Enter' && act) { const R = peek(act)?.p; const k = R && Object.keys(LINES).find(x => lineOpen(R, x)); if (k) { ev.preventDefault(); R[k + 'Done'] = true; write(KEY, DATA); step = firstMissing(R, act) || k; draw(); return } }
    if (act && isLocked(act) && (/^Arrow/.test(ev.key) || ev.key === 'Delete' || ev.key === 'Backspace' || ev.key === 'Enter')) { flash(LOCKMSG); return }
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
    for (const ck of (only ? [only] : Object.keys(cur.cells))) { if (ck === 'idle@SW' || ck === 'idle@NE') continue; const c = cur.cells[ck]; if (!c || isLocked(ck)) continue; const src = base(c.dir) || base('SW'); if (!src) continue; const r = recOf(ck); if (!only && Object.keys(r.p).length) continue;
      r.p = JSON.parse(JSON.stringify(src)); if (c.pose === 'down') r.p = { footL: src.footL ? [...src.footL] : [GX, GY] }; r.ok = false; r.fp = c.fp; n++ }
    write(KEY, DATA); return n;
  }
  function snap(ck, move) {
    const an = anchorOf(ck); if (!an) return false; const r = recOf(ck); r.ox = Math.round(GX - an[0]); r.oy = Math.round(GY - an[1]); return true;
  }

  /* ---------- baking moves / adjusts into new pictures (every frame of the pose) ---------- */
  const frameImg = async (f) => B().loadImage(f.file);
  const toURL = cv => cv.toDataURL('image/png');
  function apply(items) { if (!root.StudioApplyFrames) throw new Error('ยังไม่พร้อมบันทึกภาพ (เปิดหน้า Asset Studio ใหม่)'); return Promise.resolve(root.StudioApplyFrames(items)).then(r => { UNDO.length = 0; REDO.length = 0; HLAST = histSnap(); return r }) }
  const mirrorCv = cv => { const o = document.createElement('canvas'); o.width = cv.width; o.height = cv.height; const g = o.getContext('2d'); g.translate(cv.width, 0); g.scale(-1, 1); g.drawImage(cv, 0, 0); return o };
  const flipOf = (c, f) => !!f.flip !== !!c.mirror;   /* is this frame shown mirrored in the cell */
  /* v98.759 · each pose is baked ON ITS OWN: a pose that cannot be baked (picture missing, or the move would push part of the figure out of the 384 × 384 frame) is SKIPPED with its reason, the others still go to the Cart.
     Before, one bad pose stopped all of them ("ไม่สำเร็จ: ตำแหน่งภาพ" and the number never went down). Returns { ok, err, skipped:[…] } */
  async function bakeMoves() {
    const cells = Object.keys(cur.cells).filter(ck => { const [x, y] = off(ck); return x || y }); if (!cells.length) return { ok: true, skipped: [] };
    msg('กำลังเตรียมภาพ…'); const items = [], done = [], skipped = [], nameOf = ck => { const c = cur.cells[ck]; return ((POSES.find(q => q[0] === c.pose) || [, c.pose])[1]) + ' ' + c.dir };
    for (const ck of cells) {
      try {
        const c = cur.cells[ck], [ox, oy] = off(ck), sx = c.flip ? -ox : ox, clip = c.clip, frames = clip.frames, part = []; let lost = 0;
        for (const f of frames) {
          const img = await frameImg(f); if (!img) throw new Error('โหลดภาพไม่ได้');
          const cv = document.createElement('canvas'); cv.width = cv.height = SRC; const g = cv.getContext('2d'); g.drawImage(img, sx, oy, SRC, SRC);
          /* any clearly visible pixel of the picture that would leave the frame? (the nearly transparent fringe does not count) */
          const tc = document.createElement('canvas'); tc.width = tc.height = SRC; const tg = tc.getContext('2d'); tg.drawImage(img, 0, 0, SRC, SRC); const d = tg.getImageData(0, 0, SRC, SRC).data;
          for (let y = 0; y < SRC; y++) for (let x = 0; x < SRC; x++) if (d[(y * SRC + x) * 4 + 3] > 40) { const X = x + sx, Y = y + oy; if (X < 0 || X >= SRC || Y < 0 || Y >= SRC) lost++ }
          part.push({ file: f.file, dataUrl: toURL(cv) });
        }
        if (lost > 60) throw new Error(`เมื่อเลื่อนแล้วมีส่วนของตัว ${lost} พิกเซลหลุดนอกกรอบ 384×384`);
        items.push(...part); done.push(ck);
      } catch (e) { skipped.push(nameOf(ck) + ': ' + e.message) }
    }
    if (!done.length) { const err = 'ข้ามทุกท่าที่ย้าย — ' + skipped.join(' · '); msg('บันทึกตำแหน่งไม่สำเร็จ: ' + err); return { ok: false, err, skipped } }
    try {
      msg('กำลังบันทึก ' + items.length + ' ภาพ…'); await apply(items);
      for (const ck of done) { const r = peek(ck), [ox, oy] = [r.ox || 0, r.oy || 0]; for (const k of Object.keys(r.p || {})) { const v = r.p[k]; r.p[k] = Array.isArray(v) && Array.isArray(v[0]) ? v.map(q => [q[0] + ox, q[1] + oy]) : Array.isArray(v) && typeof v[0] === 'number' ? [v[0] + ox, v[1] + oy] : v } r.ox = r.oy = 0; r.ok = false; r.fp = null }
      write(KEY, DATA); msg('✔ บันทึกตำแหน่งภาพแล้ว ' + done.length + ' ท่า · รอกด “Push ที่แก้” / Cart' + (skipped.length ? ' · ข้าม ' + skipped.length + ' ท่า: ' + skipped.join(' · ') : '')); await new Promise(r => setTimeout(r, 400)); await load();
      return { ok: true, skipped };
    } catch (e) { const err = e.message || String(e); msg('บันทึกตำแหน่งไม่สำเร็จ: ' + err); return { ok: false, err, skipped } }
  }

  /* ---------- the adjust window (the old head / torso / legs sliders, live) ---------- */
  function sil(img, flip) { const c = document.createElement('canvas'); c.width = c.height = SRC; const g = c.getContext('2d', { willReadFrequently: true }); if (flip) { g.translate(SRC, 0); g.scale(-1, 1) } g.drawImage(img, 0, 0, SRC, SRC); const d = g.getImageData(0, 0, SRC, SRC).data; let top = SRC, bot = -1; for (let y = 0; y < SRC; y++) for (let x = 0; x < SRC; x++) if (d[(y * SRC + x) * 4 + 3] > 40) { top = Math.min(top, y); bot = Math.max(bot, y); break } if (bot < 0) return null; return { w: SRC, h: SRC, top, bottom: bot, H: bot - top + 1 } }
  function openAdjust(ck) {
    if (isLocked(ck)) { flash(LOCKMSG); return }
    if (cur?.cells[ck]?.pose === 'down') { flash('ท่านอนปรับสัดส่วนด้วยตัวปรับนี้ไม่ได้'); return }
    const c = cur.cells[ck], P = peek(ck)?.p || {}, PAm = PA(); if (!PAm) return msg('ไม่พบตัวปรับสัดส่วน');
    if (off(ck)[0] || off(ck)[1]) return msg('ท่านี้ย้ายภาพไว้ยังไม่บันทึก — กด 💾 บันทึกตำแหน่งภาพก่อน แล้วค่อยปรับสัดส่วน');
    if (!c.img || !withChin(P).chin || !withChin(P).crotch) return msg('วางเส้นตัดหัว (คอ) และเส้นตัดขา (ขาหนีบ) ของท่านี้ก่อน (ตัวปรับตัดภาพที่สองเส้นนี้)');
    const m = sil(c.img, c.flip); if (!m) return msg('ภาพว่าง');
    const S = { head: 100, torso: 100, legs: 100, shoulder: 100, wLegs: 100, wTorso: 100 }, O = { keep: true }, ref = peek('idle@' + c.dir)?.p || peek('idle@SW')?.p;
    const marksOf = mm => marksFor(P, mm);
    const box = document.createElement('div'); box.id = 'psAdj';
    const SL = [['head', 'หัว (ใหญ่-เล็ก)'], ['torso', 'ลำตัว (สูง)'], ['legs', 'ขา (ยาว)'], ['wTorso', 'ลำตัว หนา'], ['wLegs', 'ท่อนขา หนา']];
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
        say('กำลังบันทึก…'); let moved = null; try { const first = render(c.img, c.flip); moved = P && Object.keys(P).length ? qaMovePoints(P, { res: first.res }) : null } catch (e) { moved = null }   /* where the points go with the bent picture (PA.mapPoint) */
        await apply(items); const r = peek(ck); if (r) { if (moved) r.p = moved; r.ok = false; r.fp = null } write(KEY, DATA); say('✔ บันทึกแล้ว · รอกด “Push ที่แก้” / Cart · จุดย้ายตามภาพแล้ว ตรวจอีกครั้งในหน้าเรียงท่า'); setTimeout(async () => { box.remove(); await load() }, 900);
      } catch (e) { say('ไม่สำเร็จ: ' + e.message); busy = false; $('adjSave').disabled = false }
    };
  }

  /* ---------- push ---------- */
  /* v98.744 · ONE button: everything that changed goes into the 🛒 Cart (waits for Push) — moved pictures, pose sizes, and the points / ticks / rulers */
  function markSig() { try { return (localStorage.getItem(KEY) || '') + '|' + (localStorage.getItem(RKEY) || '') } catch (e) { return '' } }
  function sigOf(s) { let x = 2166136261; for (let i = 0; i < s.length; i++) x = Math.imul(x ^ s.charCodeAt(i), 16777619); return (x >>> 0).toString(36) }
  function marksDirty() { const s = markSig(); return s.length > 1 && sigOf(s) !== localStorage.getItem('pose-sheet.cart-sig') }
  function markSent() { try { localStorage.setItem('pose-sheet.cart-sig', sigOf(markSig())) } catch (e) { } }
  /* what the one Cart button will put in the Cart (live: the adjust on the selected pose counts too) */
  function cartPlan() {
    const moved = Object.keys(cur?.cells || {}).filter(ck => { const [x, y] = off(ck); return x || y }).length, nd = draftCount(), mk = marksDirty(), qa = !!(QA.ck && qaDirty());
    const parts = [qa ? 'ปรับสัดส่วน' : '', moved ? 'ตำแหน่ง ' + moved : '', nd ? 'ขนาด ' + nd : '', mk ? 'จุด/ติ๊ก' : ''].filter(Boolean), n = parts.length;
    return { moved, nd, mk, qa, n, text: '🛒 ใส่ Cart' + (n ? ' (' + parts.join(' · ') + ')' : ' · ไม่มีอะไรเปลี่ยน') };
  }
  async function cartAll() {
    const btn = $('psCartAll'); if (btn) btn.disabled = true; const done = [], fail = [], why = [], note = t => { const m = $('psCartMsg'); if (m) m.textContent = t };
    const movedNow = () => Object.keys(cur?.cells || {}).filter(ck => { const [x, y] = off(ck); return x || y }).length;
    /* v98.802 · saving a rebuilt / moved picture drops that pose's lock (its pixels changed) — but a pose that was ticked 🔒 when the Cart button was pressed stays locked: re-tick it on the NEW picture before the marks are pushed, so one press does it all */
    const wasOk = Object.keys(cur?.cells || {}).filter(okOf), relock = () => { const list = []; for (const ck of wasOk) { const r = peek(ck), c = cur?.cells[ck]; if (r && c?.fp && !(r.ok && r.fp === c.fp)) { r.ok = true; r.fp = c.fp; list.push(ck) } } if (list.length) write(KEY, DATA); return list };
    try {
      if (qaDirty() && QA.ck) { note('ปรับสัดส่วน…'); const okq = await qaSave(); (okq ? done : fail).push('ปรับสัดส่วน'); if (!okq && QA.msg) why.push(QA.msg) }
      if (movedNow()) { note('ตำแหน่งภาพ…'); const r = await bakeMoves(); if (r.ok) { done.push('ตำแหน่งภาพ' + (r.skipped.length ? ' (ข้าม ' + r.skipped.length + ')' : '')); if (r.skipped.length) why.push('ข้าม: ' + r.skipped.join(' · ')) } else { fail.push('ตำแหน่งภาพ'); why.push(r.err) } }
      if (draftCount()) { note('ขนาด…'); (await saveSizes() ? done : fail).push('ขนาด') }
      { const rl = relock(); if (rl.length) { for (const ck of rl) mirrorToTwin(ck); write(KEY, DATA); await reviewSync(rl, true) } }   /* the NEW picture's "ตรวจแล้ว" in the Animation grid too */
      if (marksDirty()) { note('จุด/ติ๊ก…'); (await pushMarks() ? done : fail).push('จุด/ติ๊ก') }
    } finally { draw(); const extra = why.length ? ' — ' + why.join(' · ') : ''; note(fail.length ? '⚠ ไม่สำเร็จ: ' + fail.join(' · ') + (done.length ? ' · ใส่ Cart แล้ว: ' + done.join(' · ') : '') + extra : done.length ? '✔ ใส่ Cart แล้ว: ' + done.join(' · ') + ' (รอ Push)' + extra : ''); const m = $('psCartMsg'); if (m) { m.style.cssText = 'font-size:12.5px;color:' + (fail.length || why.length ? '#a4341c' : '#315d46') + ';max-width:46ch;white-space:normal;line-height:1.25'; m.title = extra.slice(3) } }
  }
  async function pushMarks() {
    const G = root.GitHubPush; if (!G?.pushSettings) { msg('ไม่พบระบบ Push'); return false }
    try { msg('กำลังใส่จุด/ติ๊กลง Cart…'); const r = await G.pushSettings([KEY], '📐 เรียงท่า: จุด datum + ติ๊กตรวจ'); markSent(); msg('✔ ' + (r || 'บันทึกแล้ว')); return true } catch (e) { msg('ไม่สำเร็จ: ' + e.message); return false }
  }
  async function saveSizes() {
    const G = root.GitHubPush; if (!G?.commit) { msg('ไม่พบระบบ Push'); return false } if (!draftCount()) return null;
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
      draw(); msg('✔ ' + (r || 'บันทึกแล้ว') + ' · ขนาดท่าใช้ในเกมหลังเว็บอัปเดต'); return true
    } catch (e) { msg('บันทึกไม่สำเร็จ: ' + e.message); return false }
  }

  /* follow the character picked in the Animation tab / the lineup row */
  let lastEnt = null, lastGen = null;
  setInterval(() => { const st = B()?.state; if (!st) return; if (!$('poseSheet')) build(); const key = st.entity + '|' + (root.StudioVariants?.active || ''); if (key !== lastEnt || st.generation !== lastGen) { lastEnt = key; lastGen = st.generation; if (document.body.classList.contains('sheet-mode')) load(); else { const e = entity(); if (e) { cur = { id: e.id, name: e.name, cells: {} }; for (const [pose] of POSES) for (const [dir] of ROWS) { const ff = firstFrame(e, pose, dir); if (ff) cur.cells[cellKey(pose, dir)] = mkCell(pose, dir, ff) } status() } } } }, 500);
  addEventListener('studio-frames-changed', () => { lastGen = null });
  root.PoseSheet = { load, mode, counts: () => counts(), KEY, SKEY, RKEY };
})(globalThis);
