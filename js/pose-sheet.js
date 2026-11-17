/* v98.656 · 📐 เรียงท่า — the new proportion tool of Asset Studio (Animation tab), replacing 📐 สัดส่วน / 📍 Datum of scale-lineup.html.
   ONE character at a time: every pose (idle · walk · windup · strike · guard · hit · down) of SW and NE side by side, first frame of each pose,
   all on the same ruler (same pixels-per-pixel, feet on the same ground line), so heads can be compared by eye on one screen.
   SE / NW are the mirror copies of SW / NE (they use the same marks, size and tick).
   • Marks, in this order: eye · chin · skull top · head cut (neck) · shoulder L/R · leg cut (crotch) · leg edge L/R — click to place, drag to move,
     arrows nudge the picked mark by 1 px, Delete removes it. The SW standing pose is the reference: its head lines run across every cell (dashed).
   • Size: −1 % / +1 % per pose × direction → CHARACTER_SCALE_ADJUST.pose[character]['<pose>@SW|NE'] (js/character-scale-adjust-data.js),
     read by CharScaleAdjust.poseFactor(id, pose, data, dir) — the game draws that pose at that size as soon as the file is saved.
     Map factors (village / inside / world) multiply everybody alike, so they never change who is taller than whom.
   • Tick ✓ = "checked by eye". A tick drops back to unchecked by itself when the picture of that pose changes (file / revision / mirror).
     The ⚖ Scale Lineup title shows ✔ ครบ / ยังไม่ครบ n/m for the character on show.
   Stores: localStorage 'pose-sheet-v1' (marks + ticks, pushed with the editor settings → js/game-settings.js) · 'pose-sheet.scaleDraft' (sizes not saved yet).
   Cross-character comparison stays in ⚖ Scale Lineup (height). */
(function (root) {
  'use strict';
  const POSES = [['idle', 'ยืน'], ['walk', 'เดิน'], ['windup', 'เตรียมโจมตี'], ['strike', 'โจมตี'], ['guard', 'ป้องกัน'], ['hit', 'โดนโจมตี'], ['down', 'นอน / ล้ม']];
  const ROWS = [['SW', 'SW (SE = กลับด้าน)'], ['NE', 'NE (NW = กลับด้าน)']], MIR = { SW: 'SE', NE: 'NW' };
  const KEY = 'pose-sheet-v1', SKEY = 'pose-sheet.scaleDraft';
  /* the order marks are placed in (y = a level line · p = a point) */
  const STEPS = [['eye', 'ตา', 'y', '#d63384'], ['chin', 'คาง', 'y', '#d62d2d'], ['top', 'ยอดกะโหลก', 'y', '#8a4fff'], ['neck', 'เส้นตัดหัว', 'y', '#e07b00'],
    ['shL', 'ไหล่ ซ้ายภาพ', 'p', '#1f7a4d'], ['shR', 'ไหล่ ขวาภาพ', 'p', '#1f7a4d'], ['crotch', 'เส้นตัดขา', 'y', '#1d5fbf'], ['legL', 'ขอบขา ซ้าย', 'p', '#0d8f99'], ['legR', 'ขอบขา ขวา', 'p', '#0d8f99']];
  const STEP = Object.fromEntries(STEPS.map(s => [s[0], s]));
  const FEET_X = 192, FEET_Y = 360, SRC = 384;   /* every character frame: 384 × 384, feet at (192, 360) */
  const $ = id => document.getElementById(id), esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const read = (k, d) => { try { return JSON.parse(localStorage.getItem(k) || 'null') || d } catch (e) { return d } };
  const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch (e) { } };
  let DATA = read(KEY, {}), DRAFT = read(SKEY, {});
  const B = () => root.StudioBrowser;
  /* the key the size table uses: hero (male look) · hero-female · kier · berg … */
  const akey = id => { id = String(id || ''); if (id === 'hero') return root.StudioVariants?.active === 'female' ? 'hero-female' : 'hero'; return id.replace(/^(ally|npc):/, '') };
  const cellKey = (pose, dir) => pose + '@' + dir;

  /* ---------- sizes ---------- */
  const committed = () => root.CHARACTER_SCALE_ADJUST || {};
  function sizeOf(id, pose, dir) {
    const k = akey(id), d = DRAFT[k]?.[cellKey(pose, dir)]; if (typeof d === 'number') return d;
    const m = committed().pose?.[k]; const v = m?.[cellKey(pose, dir)] ?? m?.[pose]; return typeof v === 'number' && v > .2 && v < 3 ? v : 1;
  }
  function setSize(id, pose, dir, v) { const k = akey(id); v = Math.max(.3, Math.min(2.5, Math.round(v * 1000) / 1000)); (DRAFT[k] ||= {})[cellKey(pose, dir)] = v; write(SKEY, DRAFT); draw(); status() }
  const draftCount = () => Object.values(DRAFT).reduce((n, m) => n + Object.keys(m || {}).length, 0);

  /* ---------- the pictures of the character on show ---------- */
  let cur = null;   /* { id, name, cells: { 'idle@SW': { pose, dir, file, flip, fp, img } } } */
  function entity() { const st = B()?.state; return st?.model?.find(e => e.id === st.entity) || null }
  function firstFrame(e, pose, dir) {
    const clips = (e.clips || []).filter(c => c.action === pose && c.frames?.length);
    let c = clips.find(c => c.view === dir); if (c) return { f: c.frames[0], mirror: false };
    c = clips.find(c => c.view === MIR[dir]); if (c) return { f: c.frames[0], mirror: true };
    return null;
  }
  async function load() {
    const e = entity(); if (!e) { cur = null; draw(); return }
    const id = e.id, c = { id, name: e.name, cells: {} }; cur = c;
    for (const [pose] of POSES) for (const [dir] of ROWS) {
      const ff = firstFrame(e, pose, dir); if (!ff) continue;
      const flip = !!ff.f.flip !== ff.mirror, fp = [ff.f.file, ff.f.revision || '', flip ? 'm' : ''].join('|');
      c.cells[cellKey(pose, dir)] = { pose, dir, file: ff.f.file, flip, fp, img: null };
    }
    importOld(c); draw(); status();
    await Promise.all(Object.values(c.cells).map(async x => { try { x.img = await B().loadImage(x.file) } catch (er) { x.img = null } }));
    if (cur === c) { draw(); status() }
  }
  /* the first time a character opens here, its 📍 Datum points from the old tool (proportion-datum-v1, frame 0) become the starting marks */
  function importOld(c) {
    const k = akey(c.id), have = DATA[k] ||= {}; let old = null; try { old = JSON.parse(localStorage.getItem('proportion-datum-v1') || 'null') } catch (e) { }
    const src = old?.[k] || old?.[c.id]; if (!src) return; let n = 0;
    for (const [ck, cell] of Object.entries(c.cells)) {
      if (have[ck]) continue; const pts = src[cell.pose]?.[0]?.pts; if (!pts) continue;
      let P = pts[cell.dir], mir = false; if (!P && pts[MIR[cell.dir]]) { P = pts[MIR[cell.dir]]; mir = true } if (!P) continue;
      const X = v => (mir ? 1 - v : v) * SRC, Y = v => v * SRC, pick = (a, b) => mir ? P[b] : P[a], p = {};
      if (P.eyeL && P.eyeR) p.eye = Y((P.eyeL[1] + P.eyeR[1]) / 2); if (P.chin) p.chin = Y(P.chin[1]); if (P.crown) p.top = Y(P.crown[1]); if (P.crotch) p.crotch = Y(P.crotch[1]);
      const sl = pick('shL', 'shR'), sr = pick('shR', 'shL'); if (sl) p.shL = [X(sl[0]), Y(sl[1])]; if (sr) p.shR = [X(sr[0]), Y(sr[1])];
      if (Object.keys(p).length) { have[ck] = { fp: cell.fp, p, ok: false, from: 'datum-v1' }; n++ }
    }
    if (n) write(KEY, DATA);
  }
  const recOf = ck => (DATA[akey(cur?.id)] ||= {})[ck] ||= { fp: cur.cells[ck]?.fp, p: {}, ok: false };
  const okOf = ck => { const r = DATA[akey(cur?.id)]?.[ck], c = cur?.cells[ck]; return !!(r?.ok && c && r.fp === c.fp) };
  const changed = ck => { const r = DATA[akey(cur?.id)]?.[ck], c = cur?.cells[ck]; return !!(r && c && r.fp && r.fp !== c.fp) };
  function counts() { if (!cur) return { ok: 0, all: 0 }; const ks = Object.keys(cur.cells); return { ok: ks.filter(okOf).length, all: ks.length } }

  /* ---------- UI ---------- */
  let Z = +(localStorage.getItem('pose-sheet.zoom') || .5), step = 'eye', pinned = false, act = null, pick = null, drag = null;   /* pinned = a mark chip was clicked: the next click places THAT mark */
  function css() {
    if ($('poseSheetCss')) return; const s = document.createElement('style'); s.id = 'poseSheetCss';
    s.textContent = `#sheetSwitch{display:none;gap:6px;margin:0 0 10px}body.anim-mode #sheetSwitch{display:flex}
#sheetSwitch button{border:1px solid #b9c48a;background:#fffdf6;border-radius:9px;padding:6px 14px;font:inherit;cursor:pointer}#sheetSwitch button.on{background:#2f5d46;color:#fff;border-color:#2f5d46}
body.anim-mode main{grid-template-rows:auto minmax(0,1fr)}body.anim-mode main>#lineupDock{grid-column:1/-1;grid-row:1;margin:10px 12px 0}body.anim-mode main>#cats,body.anim-mode main>#gridWrap,body.anim-mode main>#detail{grid-row:2}
body.sheet-mode #filters,body.sheet-mode #grid{display:none!important}body.sheet-mode main>#cats,body.sheet-mode main>#detail{display:none}body.sheet-mode main>#gridWrap{grid-column:1/-1}
#poseSheet{display:none}body.sheet-mode #poseSheet{display:block}
#poseSheet .ps-bar{display:flex;flex-wrap:wrap;gap:6px;align-items:center;margin:0 0 8px}#poseSheet .ps-bar b{font-size:16px;margin-right:6px}
#poseSheet .ps-steps{display:flex;flex-wrap:wrap;gap:4px}#poseSheet .ps-steps button{border:1px solid #ccd3bd;background:#fff;border-radius:999px;padding:3px 10px;font:inherit;font-size:12.5px;cursor:pointer}
#poseSheet .ps-steps button.on{outline:2px solid #2f5d46;font-weight:700}#poseSheet .ps-steps i{display:inline-block;width:9px;height:9px;border-radius:50%;margin-right:5px;vertical-align:middle}
#poseSheet .ps-bar .sp{flex:1}#poseSheet .ps-bar button.act{border:1px solid #b9c48a;background:#fffdf6;border-radius:8px;padding:5px 11px;font:inherit;cursor:pointer}#poseSheet .ps-bar button.act.main{background:#2f5d46;color:#fff;border-color:#2f5d46}
#poseSheet .ps-grid{display:grid;gap:0;overflow:auto;border:1px solid #d6dccb;border-radius:10px;background:#fbfaf5}
#poseSheet .ps-h{position:sticky;top:0;z-index:2;background:#edf0e6;padding:5px 8px;font-weight:700;font-size:13px;text-align:center;border-bottom:1px solid #d6dccb}
#poseSheet .ps-rl{background:#edf0e6;font-weight:700;font-size:12.5px;padding:8px;writing-mode:vertical-rl;transform:rotate(180deg);text-align:center;border-right:1px solid #d6dccb}
#poseSheet .ps-c{position:relative;border-right:1px solid #e6e9df;border-bottom:1px solid #e6e9df}#poseSheet .ps-c.act{box-shadow:inset 0 0 0 2px #2f5d46}
#poseSheet .ps-c canvas{display:block;cursor:crosshair}#poseSheet .ps-c .ctl{display:flex;flex-wrap:wrap;gap:4px;align-items:center;justify-content:center;padding:4px;font-size:12px}
#poseSheet .ps-c .ctl button{border:1px solid #ccd3bd;background:#fff;border-radius:6px;padding:1px 7px;font:inherit;cursor:pointer}#poseSheet .ps-c .ctl input{width:54px;font:inherit;text-align:right}
#poseSheet .ps-c .ctl label{display:flex;gap:3px;align-items:center;cursor:pointer}#poseSheet .ps-c .ctl .ok{color:#1f7a4d;font-weight:700}#poseSheet .ps-c .ctl .chg{color:#b5530b}
#poseSheet .ps-c .none{display:grid;place-items:center;color:#9aa18f;font-size:12px}
#poseSheet .ps-msg{min-height:18px;color:#315d46;margin:6px 2px;font-size:13px}
#lineupDock .ps-check{font-size:12px;border-radius:999px;padding:2px 9px;font-weight:700}#lineupDock .ps-check.full{background:#d8f0dd;color:#1f6b3d}#lineupDock .ps-check.part{background:#fdecd2;color:#8a4b06}`;
    document.head.append(s);
  }
  function build() {
    const wrap = $('gridWrap'), dock = $('lineupDock'), main = wrap?.parentElement; if (!wrap || !dock || $('poseSheet')) return;
    css(); main.insertBefore(dock, main.firstChild);   /* ⚖ Scale Lineup = the top row across the whole width */
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
  const cw = () => Math.round(SRC * Z), ch = () => Math.round(SRC * Z) + 6;
  function toScreen(cell, x, y) { const k = sizeOf(cur.id, cell.pose, cell.dir); return [cw() / 2 + (x - FEET_X) * Z * k, FEET_Y * Z + (y - FEET_Y) * Z * k] }
  function toSource(cell, sx, sy) { const k = sizeOf(cur.id, cell.pose, cell.dir); return [FEET_X + (sx - cw() / 2) / (Z * k), FEET_Y + (sy - FEET_Y * Z) / (Z * k)] }
  function draw() {
    const ps = $('poseSheet'); if (!ps || !document.body.classList.contains('sheet-mode')) return;
    if (!cur) { ps.innerHTML = '<div class="ps-msg">เลือกตัวละครจากแถว ⚖ Scale Lineup ด้านบน หรือจากรายการ Animation</div>'; return }
    const cells = cur.cells, nd = draftCount();
    let h = `<div class="ps-bar"><b>${esc(cur.name)}</b><span class="ps-steps" role="group" aria-label="จุดที่วาง (ตามลำดับ)">${STEPS.map(([k, l, , col]) => `<button type="button" data-step="${k}" class="${k === step ? 'on' : ''}"><i style="background:${col}"></i>${l}</button>`).join('')}</span><span class="sp"></span>
      <label style="font-size:12.5px">ซูม <input id="psZoom" type="range" min=".3" max="1" step=".05" value="${Z}"></label>
      <button type="button" class="act" id="psClear" ${act ? '' : 'disabled'}>ล้างจุดของท่าที่เลือก</button>
      <button type="button" class="act" id="psCart" title="จุด + ติ๊กตรวจ → 🛒 Cart (js/game-settings.js)">🛒 จุด/ติ๊ก ใส่ Cart</button>
      <button type="button" class="act main" id="psSave" ${nd ? '' : 'disabled'} title="ขนาดที่ปรับ → js/character-scale-adjust-data.js (ผ่าน Cart ถ้าเปิดไว้)">💾 บันทึกขนาดเข้าเกม${nd ? ' (' + nd + ')' : ''}</button></div>`;
    h += `<div class="ps-grid" style="grid-template-columns:34px repeat(${POSES.length},${cw()}px)"><div class="ps-h"></div>${POSES.map(([, l]) => `<div class="ps-h">${l}</div>`).join('')}`;
    for (const [dir, rl] of ROWS) {
      h += `<div class="ps-rl">${rl}</div>`;
      for (const [pose] of POSES) {
        const ck = cellKey(pose, dir), c = cells[ck];
        if (!c) { h += `<div class="ps-c none" style="height:${ch() + 34}px">ไม่มีภาพ</div>`; continue }
        const k = sizeOf(cur.id, pose, dir), ok = okOf(ck), chg = changed(ck);
        h += `<div class="ps-c${act === ck ? ' act' : ''}" data-ck="${ck}"><canvas width="${cw()}" height="${ch()}" aria-label="${pose} ${dir}"></canvas><div class="ctl">
          <button type="button" data-k="-1" title="เล็กลง 1%">−1%</button><input data-in type="number" step="0.5" min="30" max="250" value="${(k * 100).toFixed(1)}" aria-label="ขนาด %"><button type="button" data-k="1" title="ใหญ่ขึ้น 1%">+1%</button>
          <label class="${ok ? 'ok' : ''}"><input type="checkbox" data-ok ${ok ? 'checked' : ''}>${ok ? '✓ ตรวจแล้ว' : 'ตรวจ'}</label>${chg ? '<span class="chg" title="ภาพของท่านี้เปลี่ยนหลังวางจุด/ติ๊ก — ติ๊กหลุดแล้ว ตรวจใหม่">ภาพเปลี่ยน</span>' : ''}</div></div>`;
      }
    }
    h += `</div><div class="ps-msg" id="psMsg" role="status">คลิกบนภาพเพื่อวาง <b>${STEP[step][1]}</b> · ลากจุดเพื่อย้าย · ลูกศร = ขยับจุดที่เลือก 1 px · Delete = ลบจุด · เส้นประ = หัวของท่ายืน SW (ตัวอ้างอิง)</div>`;
    ps.innerHTML = h;
    ps.querySelectorAll('.ps-c[data-ck]').forEach(el => paint(el));
    wire(ps);
  }
  function paint(el) {
    const ck = el.dataset.ck, c = cur.cells[ck], cv = el.querySelector('canvas'), g = cv.getContext('2d'), W = cv.width, H = cv.height, k = sizeOf(cur.id, c.pose, c.dir);
    g.clearRect(0, 0, W, H); for (let y = 0; y < H; y += 12) for (let x = (y / 12) % 2 ? 12 : 0; x < W; x += 24) { g.fillStyle = '#f1efe6'; g.fillRect(x, y, 12, 12) }
    g.strokeStyle = '#9fb28f'; g.lineWidth = 1; g.beginPath(); g.moveTo(0, FEET_Y * Z + .5); g.lineTo(W, FEET_Y * Z + .5); g.stroke();   /* the ground */
    if (c.img) { const s = SRC * Z * k, x0 = W / 2 - FEET_X * Z * k, y0 = FEET_Y * Z - FEET_Y * Z * k; g.save(); if (c.flip) { g.translate(W, 0); g.scale(-1, 1) } g.drawImage(c.img, c.flip ? W - x0 - s : x0, y0, s, s); g.restore() }
    else { g.fillStyle = '#9aa18f'; g.font = '12px sans-serif'; g.textAlign = 'center'; g.fillText('กำลังโหลด…', W / 2, H / 2) }
    /* the reference: the SW standing pose's head lines, on the same ruler */
    const R = DATA[akey(cur.id)]?.['idle@SW']?.p, rc = cur.cells['idle@SW'];
    if (R && rc) { g.save(); g.setLineDash([5, 4]); g.lineWidth = 1; for (const key of ['top', 'eye', 'chin']) if (R[key] != null) { const [, y] = toScreen(rc, 0, R[key]); g.strokeStyle = STEP[key][3] + '99'; g.beginPath(); g.moveTo(0, y + .5); g.lineTo(W, y + .5); g.stroke() } g.restore() }
    /* the marks of this pose */
    const P = DATA[akey(cur.id)]?.[ck]?.p || {};
    for (const [key, , kind, col] of STEPS) {
      const v = P[key]; if (v == null) continue; const sel = act === ck && pick === key;
      if (kind === 'y') { const [, y] = toScreen(c, 0, v); g.strokeStyle = col; g.lineWidth = sel ? 2.5 : 1.5; g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); g.fillStyle = col; g.font = '10px sans-serif'; g.textAlign = 'left'; g.fillText(STEP[key][1], 3, y - 3) }
      else { const [x, y] = toScreen(c, v[0], v[1]); g.fillStyle = col; g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.beginPath(); g.arc(x, y, sel ? 6 : 4.5, 0, 7); g.fill(); g.stroke() }
    }
    for (const [a, b] of [['shL', 'shR'], ['legL', 'legR']]) if (P[a] && P[b]) { const [x1, y1] = toScreen(c, ...P[a]), [x2, y2] = toScreen(c, ...P[b]); g.strokeStyle = STEP[a][3]; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke() }
  }
  function hit(c, P, sx, sy) {
    let best = null, bd = 8;
    for (const [key, , kind] of STEPS) { const v = P[key]; if (v == null) continue; let d; if (kind === 'y') { const [, y] = toScreen(c, 0, v); d = Math.abs(y - sy) + 2 } else { const [x, y] = toScreen(c, v[0], v[1]); d = Math.hypot(x - sx, y - sy) } if (d < bd) { bd = d; best = key } }
    return best;
  }
  function wire(ps) {
    ps.querySelectorAll('[data-step]').forEach(b => b.onclick = () => { step = b.dataset.step; pinned = true; draw() });
    const zm = $('psZoom'); if (zm) zm.oninput = () => { Z = +zm.value; try { localStorage.setItem('pose-sheet.zoom', String(Z)) } catch (e) { } draw() };
    $('psClear') && ($('psClear').onclick = () => { if (!act) return; const r = DATA[akey(cur.id)]?.[act]; if (r) { r.p = {}; r.ok = false; write(KEY, DATA) } pick = null; draw(); status() });
    $('psCart') && ($('psCart').onclick = () => pushMarks());
    $('psSave') && ($('psSave').onclick = () => saveSizes());
    ps.querySelectorAll('.ps-c[data-ck]').forEach(el => {
      const ck = el.dataset.ck, c = cur.cells[ck], cv = el.querySelector('canvas');
      el.querySelectorAll('[data-k]').forEach(b => b.onclick = () => setSize(cur.id, c.pose, c.dir, sizeOf(cur.id, c.pose, c.dir) * (1 + (+b.dataset.k) / 100)));
      const inp = el.querySelector('[data-in]'); inp.onchange = () => { const v = +inp.value; if (v >= 30 && v <= 250) setSize(cur.id, c.pose, c.dir, v / 100) };
      el.querySelector('[data-ok]').onchange = ev => { const r = recOf(ck); r.ok = ev.target.checked; r.fp = c.fp; write(KEY, DATA); draw(); status() };
      cv.onpointerdown = ev => {
        const r = cv.getBoundingClientRect(), sx = (ev.clientX - r.left) * cv.width / r.width, sy = (ev.clientY - r.top) * cv.height / r.height, rec = recOf(ck), P = rec.p;
        act = ck; let key = hit(c, P, sx, sy);
        if (!key) { key = pinned ? step : (STEPS.find(s => P[s[0]] == null)?.[0] || step); pinned = false; const [x, y] = toSource(c, sx, sy); P[key] = STEP[key][2] === 'y' ? Math.round(y) : [Math.round(x), Math.round(y)]; rec.fp = c.fp; write(KEY, DATA); step = STEPS.find(s => P[s[0]] == null)?.[0] || key }
        pick = key; drag = { ck, key }; cv.setPointerCapture(ev.pointerId); draw();
      };
    });
    ps.onpointermove = ev => {
      if (!drag) return; const el = ps.querySelector(`.ps-c[data-ck="${drag.ck}"]`), cv = el?.querySelector('canvas'); if (!cv) return;
      const r = cv.getBoundingClientRect(), sx = (ev.clientX - r.left) * cv.width / r.width, sy = (ev.clientY - r.top) * cv.height / r.height, c = cur.cells[drag.ck], P = recOf(drag.ck).p, [x, y] = toSource(c, sx, sy);
      P[drag.key] = STEP[drag.key][2] === 'y' ? Math.round(y) : [Math.round(x), Math.round(y)]; paint(el);
    };
    ps.onpointerup = () => { if (drag) { write(KEY, DATA); drag = null } };
  }
  addEventListener('keydown', ev => {
    if (!document.body.classList.contains('sheet-mode') || !act || !pick || /INPUT|TEXTAREA|SELECT/.test(ev.target?.tagName || '')) return;
    const P = recOf(act).p, v = P[pick]; if (v == null) return; const d = { ArrowUp: [0, -1], ArrowDown: [0, 1], ArrowLeft: [-1, 0], ArrowRight: [1, 0] }[ev.key];
    if (d) { ev.preventDefault(); if (STEP[pick][2] === 'y') P[pick] = v + d[1]; else P[pick] = [v[0] + d[0], v[1] + d[1]]; write(KEY, DATA); draw() }
    else if (ev.key === 'Delete' || ev.key === 'Backspace') { ev.preventDefault(); delete P[pick]; pick = null; write(KEY, DATA); draw() }
  });
  const msg = t => { const m = $('psMsg'); if (m) m.textContent = t };
  async function pushMarks() {
    const G = root.GitHubPush; if (!G?.pushSettings) return msg('ไม่พบระบบ Push');
    try { msg('กำลังใส่จุด/ติ๊กลง Cart…'); const r = await G.pushSettings([KEY], '📐 เรียงท่า: จุด datum + ติ๊กตรวจ'); msg('✔ ' + (r || 'บันทึกแล้ว')) } catch (e) { msg('ไม่สำเร็จ: ' + e.message) }
  }
  /* the size draft → js/character-scale-adjust-data.js (re-read from GitHub at save time and merged, so sizes set in ⚖ Scale Lineup are kept) */
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
      try { const f = $('lineupDockFrame'); if (f?.src) f.contentWindow.location.reload() } catch (e) { }   /* the lineup re-reads the committed sizes */
      draw(); msg('✔ ' + (r || 'บันทึกแล้ว') + ' · ขนาดท่าใช้ในเกมหลังเว็บอัปเดต');
    } catch (e) { msg('บันทึกไม่สำเร็จ: ' + e.message) }
  }
  /* follow the character picked in the Animation tab / the lineup row */
  let lastEnt = null, lastGen = null;
  setInterval(() => { const st = B()?.state; if (!st) return; if (!$('poseSheet')) build(); const key = st.entity + '|' + (root.StudioVariants?.active || ''); if (key !== lastEnt || st.generation !== lastGen) { lastEnt = key; lastGen = st.generation; if (document.body.classList.contains('sheet-mode')) load(); else { const e = entity(); if (e) { cur = { id: e.id, name: e.name, cells: {} }; for (const [pose] of POSES) for (const [dir] of ROWS) { const ff = firstFrame(e, pose, dir); if (ff) { const flip = !!ff.f.flip !== ff.mirror; cur.cells[cellKey(pose, dir)] = { pose, dir, file: ff.f.file, flip, fp: [ff.f.file, ff.f.revision || '', flip ? 'm' : ''].join('|') } } } status() } } } }, 500);
  addEventListener('studio-frames-changed', () => { lastGen = null });
  root.PoseSheet = { load, mode, counts: () => counts(), KEY, SKEY };
})(globalThis);
