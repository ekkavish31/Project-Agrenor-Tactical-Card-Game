/* v98.408 · Detailed piece editor: independent drag modes for art/order/block,
   Studio-style three-point 2:1 base fit, and a walker using the real depth rule.
   All edits go through the map's existing save/checkpoint bridge. */
(function () {
  'use strict';
  let Z = 1.9, S = 28 * Z, T = 14 * Z; let CW = 620, CH = 500, CX = 310, CY = 330, Z0 = 1.9;   /* v98.522 · zoom per piece: a whole place (caps.zoom) is far bigger than a prop */
  let dlg = null, key = null, cv = null, gesture = null, mode = 'walk', points = [], undo = [], walker = { u: 0, v: 1.6 }, hover = null, erase = false;
  const pref = (k, d) => { try { const v = localStorage.getItem('pd-' + k); return v == null ? d : JSON.parse(v) } catch (e) { return d } }, setPref = (k, v) => { try { localStorage.setItem('pd-' + k, JSON.stringify(v)) } catch (e) { } };
  let snapOn = pref('snap', true), brush = pref('brush', 2);   /* brush = side in H cells (H = 0.5 unit) */
  const H = () => G().H || .5, isBrush = m => m === 'bo' || m === 'bb', propOf = m => m === 'bo' ? 'zo' : 'zb', offOf = (o, m) => m === 'bo' ? [o.orderU || 0, o.orderV || 0] : [o.blockU || 0, o.blockV || 0];
  const D = () => window.PlaceBuild?.detail || window.VillageAssetEdit?.detail, DS = () => window.DepthStyle, G = () => window.PieceGeometry;
  const P = (u, v) => ({ x: CX + (u - v) * S, y: CY + (u + v) * T });
  const inv = (x, y) => { const a = (x - CX) / S, b = (y - CY) / T; return { u: (a + b) / 2, v: (b - a) / 2 } };
  const caps = () => D()?.caps || {}, el = id => dlg.querySelector(/^[A-Za-z][\w-]*$/.test(id) ? '#' + id : '[id="' + id + '"]')   /* v98.522 · ids like pdBr+ / pdBr− are not valid #selectors: the whole window failed to open since v98.500 */, copy = o => JSON.parse(JSON.stringify(o));
  const limit = (v, n = 12) => Math.max(-n, Math.min(n, v)), round = v => Math.round(v * 100) / 100;
  function edit(fn, checkpoint = true) {
    if (checkpoint) { undo.push(copy(D().ov(key))); if (undo.length > 60) undo.shift() }
    D().edit(key, fn, checkpoint); paint(); readouts();
  }
  function poly(q, b, fill, line) {
    const pts = [[b.u0, b.v0], [b.u1, b.v0], [b.u1, b.v1], [b.u0, b.v1]].map(([u, v]) => P(u, v));
    q.beginPath(); pts.forEach((p, i) => q[i ? 'lineTo' : 'moveTo'](p.x, p.y)); q.closePath(); q.fillStyle = fill; q.fill(); q.strokeStyle = line; q.lineWidth = 2; q.stroke();
  }
  /* v98.691 · the test person is the male hero, idle SW (assets/tactics/imported/idle-sw-mwcast2-m/frame-01.webp) — the blue capsule stays as a fallback while the picture loads */
  const HERO = { im: null, box: null, white: null };
  /* hero canvas size in map pixels: AssetSize.heroPx (the lineup / char-size setting) × the map-character multiplier of the map this window was opened from (village map → 'village', sub-map → 'place') */
  function heroWorldPx() {
    const place = !!(window.PlaceBuild?.detail && D() === window.PlaceBuild.detail);
    /* v98.703 · sub-map: exactly the size village-place.html draws the hero at (hero px × the map's character scale × the lineup factor × PLACE_CHAR_K) · village map: AssetSize hero px × the village multiplier */
    if (place && window.CharSize && typeof window.placeHeroScale === 'function') { try { return CharSize.VILLAGE_HERO_PX * window.placeHeroScale() * (window.PLACE_CHAR_K || 1) } catch (e) { } }
    let base = 93.6, m = 1; try { base = window.AssetSize?.heroPx?.('village') || 93.6 } catch (e) { } try { m = window.MapScale ? MapScale.get('village') : 1 } catch (e) { } return base * (m || 1);
  }
  function heroSprite() {
    if (!HERO.im) { HERO.im = new Image(); HERO.im.onload = () => { try { if (dlg && cv) paint() } catch (e) { } }; HERO.im.src = 'assets/tactics/imported/idle-sw-mwcast2-m/frame-01.webp' }
    const im = HERO.im; if (!im.complete || !im.naturalWidth) return null;
    if (!HERO.box) {
      const c = document.createElement('canvas'); c.width = im.naturalWidth; c.height = im.naturalHeight; const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(im, 0, 0);
      const d = x.getImageData(0, 0, c.width, c.height).data; let x0 = c.width, x1 = 0, y0 = c.height, y1 = 0;
      for (let y = 0; y < c.height; y++) for (let xx = 0; xx < c.width; xx++) if (d[(y * c.width + xx) * 4 + 3] > 40) { if (xx < x0) x0 = xx; if (xx > x1) x1 = xx; if (y < y0) y0 = y; if (y > y1) y1 = y }
      HERO.box = { x0, x1, y0, y1 };
      const w = document.createElement('canvas'); w.width = c.width; w.height = c.height; const wq = w.getContext('2d'); wq.drawImage(im, 0, 0); wq.globalCompositeOperation = 'source-in'; wq.fillStyle = '#fff'; wq.fillRect(0, 0, w.width, w.height); HERO.white = w;
    }
    return HERO;
  }
  let walkerBox = null;
  function drawWalker(q, ghost, shadow = true) {
    const p = P(walker.u, walker.v), H = heroSprite(); q.save(); q.globalAlpha = ghost ? .7 : 1;
    if (shadow) { q.fillStyle = '#0006'; q.beginPath(); q.ellipse(p.x, p.y, 17, 7, 0, 0, 7); q.fill() }
    if (H) {
      const b = H.box, vis = (b.y1 - b.y0 + 1) / H.im.naturalHeight, hpx = heroWorldPx() * vis * Z, k = hpx / (b.y1 - b.y0 + 1), w = (b.x1 - b.x0 + 1) * k;   /* v98.701 · the figure is drawn at the hero's REAL size on this kind of map (canvas px × the map's character multiplier), feet on the walker's point */
      q.drawImage(ghost ? H.white : H.im, b.x0, b.y0, b.x1 - b.x0 + 1, b.y1 - b.y0 + 1, p.x - w / 2, p.y - hpx, w, hpx); if (!ghost) walkerBox = { x0: p.x - w / 2 - 6, x1: p.x + w / 2 + 6, y0: p.y - hpx - 6, y1: p.y + 14 };
    } else {
      if (!ghost) walkerBox = { x0: p.x - 16, x1: p.x + 16, y0: p.y - 80, y1: p.y + 12 };
      q.fillStyle = ghost ? '#fff' : '#3c6fb0'; q.strokeStyle = ghost ? '#fff' : '#142840'; q.lineWidth = 2;
      q.beginPath(); q.roundRect(p.x - 11, p.y - 60, 22, 52, 9); q.fill(); if (!ghost) q.stroke();
      q.fillStyle = ghost ? '#fff' : '#f0c9a0'; q.beginPath(); q.arc(p.x, p.y - 68, 9, 0, 7); q.fill(); if (!ghost) q.stroke();
    }
    q.restore();
  }
  function drawPiece(q, E, ov, alpha = 1) { q.save(); q.globalAlpha = alpha; q.translate(CX, CY); q.scale(Z, Z); D().drawTo(q, E, ov); q.restore() }
  /* is there picture (opaque pixel) under the canvas point p? */
  function artAt(p) { try { const E = D().item(key), ov = D().ov(key), c = document.createElement('canvas'); c.width = CW; c.height = CH; const q = c.getContext('2d', { willReadFrequently: true }); drawPiece(q, E, ov); const x = Math.round(p.x), y = Math.round(p.y); for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) if (x + dx >= 0 && y + dy >= 0 && x + dx < CW && y + dy < CH && q.getImageData(x + dx, y + dy, 1, 1).data[3] > 40) return true; return false } catch (e) { return true } }
  function overlaps(E, ov) {
    const c = document.createElement('canvas'); c.width = CW; c.height = CH; const q = c.getContext('2d', { willReadFrequently: true });
    try { const actor = document.createElement('canvas'); actor.width = CW; actor.height = CH; drawWalker(actor.getContext('2d'), false, false); drawPiece(q, E, ov); q.globalCompositeOperation = 'destination-in'; q.drawImage(actor, 0, 0); const d = q.getImageData(0, 0, CW, CH).data; for (let i = 3; i < d.length; i += 4) if (d[i] > 100) return true; return false } catch (_) { return true }
  }
  const hints = {
    walk: 'ชี้ที่คนแล้วลาก = ย้ายคนทดสอบ (ทดสอบการบัง/การชน ชนกรอบแดงแล้วเข้าไม่ได้) · ชี้ที่ภาพแล้วลาก = ย้ายภาพ · ลากพื้นโล่ง = เลื่อนมุมมอง · ย้ายกรอบต้องเลือกโหมดกรอบก่อน',
    art: 'ลากบนภาพเพื่อเลื่อนเฉพาะภาพ Asset เทียบกับฐาน · กรอบทั้งสองอยู่ที่เดิม',
    order: 'ลากเพื่อย้ายกรอบฟ้า · วางให้ครอบฐานที่แตะพื้น ใช้ตัดสินหน้า/หลัง',
    block: 'ลากเพื่อย้ายกรอบแดง · วางเฉพาะส่วนที่ไม่ให้คนเดินทะลุ',
    bo: 'แปรงฟ้า: ลาก/คลิกเพื่อทาสี่เหลี่ยมตามกริด (หัวแปรงปรับขนาดได้) · เลือก “ลบ” เพื่อลบ · ใช้วาดรูปร่างอิสระ เช่น ตัว L',
    bb: 'แปรงแดง: ลาก/คลิกเพื่อทาส่วนที่ห้ามเดินตามกริด · เลือก “ลบ” เพื่อลบ · วาดรูปร่างอิสระได้',
    fit: 'จิ้ม ① ซ้าย ② มุมหน้าสุด ③ ขวา ของฐานเดียวกัน · ลากจุดเพื่อแก้ · คลิกจุดเดิมเพื่อลบ'
  };
  /* painted cells → fill each cell, outline only the outer edges */
  function drawMask(q, cells, du, dv, fill, line) {
    const set = new Set(cells.map(c => c[0] + ',' + c[1])), h = H(); q.save(); q.fillStyle = fill; q.strokeStyle = line; q.lineWidth = 2; q.lineJoin = 'round';
    for (const [i, j] of cells) { const a = P(i * h + du, j * h + dv), b = P((i + 1) * h + du, j * h + dv), c = P((i + 1) * h + du, (j + 1) * h + dv), d = P(i * h + du, (j + 1) * h + dv); q.beginPath(); q.moveTo(a.x, a.y); q.lineTo(b.x, b.y); q.lineTo(c.x, c.y); q.lineTo(d.x, d.y); q.closePath(); q.fill() }
    q.beginPath(); for (const [i, j] of cells) { const e = (ii, jj) => !set.has(ii + ',' + jj), pt = (u, v) => P(u * h + du, v * h + dv);
      if (e(i, j - 1)) { const a = pt(i, j), b = pt(i + 1, j); q.moveTo(a.x, a.y); q.lineTo(b.x, b.y) } if (e(i, j + 1)) { const a = pt(i, j + 1), b = pt(i + 1, j + 1); q.moveTo(a.x, a.y); q.lineTo(b.x, b.y) }
      if (e(i - 1, j)) { const a = pt(i, j), b = pt(i, j + 1); q.moveTo(a.x, a.y); q.lineTo(b.x, b.y) } if (e(i + 1, j)) { const a = pt(i + 1, j), b = pt(i + 1, j + 1); q.moveTo(a.x, a.y); q.lineTo(b.x, b.y) } }
    q.stroke(); q.restore();
  }
  const zone = (q, ov, m, fill, line, b) => { const cells = G().cellsOf(ov[propOf(m)]); if (cells.length) { const [du, dv] = offOf(ov, m); drawMask(q, cells, du, dv, fill, line) } else poly(q, b, fill, line) };
  function brushCells(p, m) {   // the n×n cells under the pointer (local to the frame offset)
    const o = D().ov(key), [du, dv] = offOf(o, m), w = inv(p.x, p.y), h = H(), n = Math.max(1, brush), ci = Math.floor((w.u - du) / h), cj = Math.floor((w.v - dv) / h), s0 = -Math.floor((n - 1) / 2), out = [];
    for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) out.push([ci + s0 + a, cj + s0 + b]); return out;
  }
  function rectCells(ov, m) {   // the current rectangle, rounded onto the grid (start of a free-form shape)
    const f = G().footprint({ ...ov, zo: null, zb: null, orderU: 0, orderV: 0, blockU: 0, blockV: 0 }, 0, 0, m === 'bb'), h = H(), out = [];
    const i0 = Math.round(f.u0 / h), i1 = Math.max(i0 + 1, Math.round(f.u1 / h)), j0 = Math.round(f.v0 / h), j1 = Math.max(j0 + 1, Math.round(f.v1 / h)); for (let i = i0; i < i1; i++) for (let j = j0; j < j1; j++) out.push([i, j]); return out;
  }
  function paintCells(m, cells, first) {
    const prop = propOf(m), cur = G().cellsOf(D().ov(key)[prop]), set = new Set(cur.map(c => c[0] + ',' + c[1])); let ch = false;
    for (const [i, j] of cells) { const k = i + ',' + j; if (erase) { if (set.delete(k)) ch = true } else if (!set.has(k)) { set.add(k); ch = true } }
    if (!ch) return; points = [];
    edit(o => { const arr = [...set].map(k => k.split(',').map(Number)); if (arr.length) o[prop] = arr; else delete o[prop] }, first);
  }
  function paint() {
    const E = D().item(key); if (!E || !cv) return;
    const ov = D().ov(key), q = cv.getContext('2d'), b = G().footprint(ov), block = G().footprint(ov, 0, 0, true), ds = DS();
    q.clearRect(0, 0, CW, CH); q.fillStyle = '#26382d'; q.fillRect(0, 0, CW, CH); q.strokeStyle = '#ffffff1f'; q.lineWidth = 1;
    const R = Math.round(6 * 1.9 / Z); for (let i = -R; i <= R; i++) { let a = P(i, -R), c = P(i, R); q.beginPath(); q.moveTo(a.x, a.y); q.lineTo(c.x, c.y); q.stroke(); a = P(-R, i); c = P(R, i); q.beginPath(); q.moveTo(a.x, a.y); q.lineTo(c.x, c.y); q.stroke() }
    if (ov.block) zone(q, ov, 'bb', '#e0504040', '#e05040', block); zone(q, ov, 'bo', '#3c82ff2e', '#3c82ff', b);
    const front = ds.walkerInFront(b, walker.u, walker.v), low = ds.isLow({ label: E.label, tall: ov.tall }), set = ds.get(), hit = !front && overlaps(E, ov);
    const style = ds.styleFor({ label: E.label, tall: ov.tall });
    if (front) { drawPiece(q, E, ov); drawWalker(q, false) }
    else { drawWalker(q, false); drawPiece(q, E, ov, hit && (style === 'both' || style === 'fade') ? set.alpha : 1); if (hit && (style === 'both' || style === 'silhouette')) drawWalker(q, true) }
    // Selected frame remains visible over the artwork while it is being positioned.
    if (mode === 'order' || mode === 'bo') zone(q, ov, 'bo', '#3c82ff18', '#83b5ff', b); if ((mode === 'block' || mode === 'bb') && ov.block) zone(q, ov, 'bb', '#e0504018', '#ff9a8b', block);
    if (isBrush(mode) && hover) { const cs = brushCells(hover, mode), [du, dv] = offOf(ov, mode), h = H(), i0 = Math.min(...cs.map(c => c[0])), i1 = Math.max(...cs.map(c => c[0])) + 1, j0 = Math.min(...cs.map(c => c[1])), j1 = Math.max(...cs.map(c => c[1])) + 1; poly(q, { u0: i0 * h + du, u1: i1 * h + du, v0: j0 * h + dv, v1: j1 * h + dv }, erase ? '#ffffff22' : (mode === 'bo' ? '#3c82ff55' : '#e0504055'), erase ? '#fff' : (mode === 'bo' ? '#9cc5ff' : '#ff9a8b')) }
    q.fillStyle = '#ffe9a8'; q.beginPath(); q.arc(CX, CY, 4, 0, 7); q.fill();
    if (mode === 'fit') drawPoints(q);
    q.font = '12px AgThai,system-ui,sans-serif'; q.fillStyle = '#f7e8c5'; q.fillText('● จุดยึดชิ้นงาน · ' + ({ walk: 'ลากคนทดสอบ', art: 'ลากภาพ Asset', order: 'ลากกรอบฟ้า', block: 'ลากกรอบแดง', fit: 'วัดฐาน 3 จุด' }[mode]), 10, CH - 10);
    const inside = ov.block && (block.parts || [block]).some(r => walker.u > r.u0 && walker.u < r.u1 && walker.v > r.v0 && walker.v < r.v1);
    el('pdState').innerHTML = `คนอยู่ <b>${front ? 'หน้า' : 'หลัง'}</b>ชิ้นนี้${hit ? ' · ภาพซ้อนกัน' : ' · ไม่ได้โดนชิ้นนี้บัง'} · ชิ้นนี้นับเป็น <b>${low ? 'เตี้ย' : 'สูง'}</b>${ov.tall ? ' (ตั้งเอง)' : ' (จากชื่อ)'}${inside ? '<br>🟥 เท้าคนอยู่ในกรอบห้ามเดิน (ในเกมจะเดินเข้าตรงนี้ไม่ได้)' : ''}`;
    if (el('pdDragHint')) el('pdDragHint').textContent = hints[mode]; fitReadouts();
  }
  function drawPoints(q) {
    const E = G().edges(points); q.save(); q.lineWidth = 2;
    if (E) { q.strokeStyle = '#ff7181'; q.beginPath(); q.moveTo(E.L.x, E.L.y); q.lineTo(E.M.x, E.M.y); q.lineTo(E.R.x, E.R.y); q.stroke(); q.setLineDash([8, 6]); q.strokeStyle = '#79e7a2'; q.beginPath(); q.moveTo(E.M.x - 260, E.M.y - 130); q.lineTo(E.M.x, E.M.y); q.lineTo(E.M.x + 260, E.M.y - 130); q.stroke(); q.setLineDash([]) }
    points.forEach((p, i) => { q.fillStyle = '#fff'; q.strokeStyle = '#e04763'; q.beginPath(); q.arc(p.x, p.y, 7, 0, 7); q.fill(); q.stroke(); q.fillStyle = '#fff'; q.font = 'bold 15px sans-serif'; q.fillText(String(i + 1), p.x + 10, p.y - 10) }); q.restore();
  }
  function fitReadouts() {
    if (!el('pdFitMsg')) return; const E = G().edges(points);
    el('pdFitMsg').textContent = E ? `ซ้าย ${E.a1.toFixed(1)}° · ขวา ${E.a2.toFixed(1)}° → เป้า 26.57° ทั้งสองด้าน${E.ok ? '' : ' · จุดฐานไม่ถูกต้อง ลองวัดใหม่'}` : (points.length < 3 ? ['① คลิกมุมซ้ายของฐาน', '② คลิกมุมหน้าสุดของฐาน', '③ คลิกมุมขวาของฐาน'][points.length] : 'จุดชิดกันเกินไป ลองวัดใหม่');
    dlg.querySelectorAll('[data-fit]').forEach(b => b.disabled = !E?.ok);
    if (el('pdFrSave')) { el('pdFrSave').onclick = () => { D().frames.saveToArt(key); build(); paint(); readouts() }; el('pdFrUse').onclick = () => { D().frames.useArt(key); build(); paint(); readouts() }; if (el('pdFrAll')) el('pdFrAll').onclick = () => { if (confirm('ทิ้งกรอบที่แก้เฉพาะชิ้นของทุกชิ้นที่ใช้ภาพนี้บนแมพนี้ แล้วให้ตามค่าของภาพ?')) { const n = D().frames.applyAll(key); build(); paint(); readouts(); const m = el('pdFrState'); if (m) m.textContent += ' · ล้างค่าเฉพาะชิ้นแล้ว ' + n + ' ชิ้น' } } }
  }
  function frState() {   // v98.567 · where this piece's frame comes from
    const m = el('pdFrState'); if (!m) return; const st = D().frames?.state(key); if (!st) return;
    const base = st.own ? '✎ แก้เฉพาะชิ้นนี้ (ไม่ตามค่าของภาพ)' : st.tpl ? '🔗 ตามค่าของภาพนี้ (บันทึกไว้แล้ว)' : '🔗 ' + (D().frames.autoNote || 'ตามกรอบอัตโนมัติจากความกว้างภาพ') + ' (ยังไม่ได้บันทึกค่าของภาพ)';
    m.textContent = base + (st.tpl && st.uses != null ? ` · ตอนนี้ ${st.uses} ชิ้นบนแมพนี้ตามค่าของภาพ` : '');
    const u = el('pdFrUse'); if (u) u.disabled = !st.own;
    const all = el('pdFrAll'); if (all) all.disabled = !st.tpl;
  }
  function readouts() {
    if (!dlg) return; const o = D().ov(key);
    for (const f of ['sw', 'sh', 'fw', 'fh']) { const e = el('pd_' + f + 'V'); if (e) e.textContent = f === 'sw' ? (o.sw ?? o.fw ?? .5) : f === 'sh' ? (o.sh ?? o.fh ?? .5) : (o[f] ?? .5) }
    el('pdUndo').disabled = !undo.length;
    frState();
    el('pdOffsets').textContent = `ภาพ X ${round(o.artX || 0)} / Y ${round(o.artY || 0)} · ฟ้า ${round(o.orderU || 0)}, ${round(o.orderV || 0)} · แดง ${round(o.blockU || 0)}, ${round(o.blockV || 0)}`;
  }
  const brushLabel = () => (brush * (G()?.H || .5)).toFixed(1) + '×' + (brush * (G()?.H || .5)).toFixed(1) + ' ช่อง';
  function html(E, ov) {
    const row = (id, label, v, mn, mx, st, fmt) => `<label class="pdr"><span>${label}</span><input type="range" id="${id}" min="${mn}" max="${mx}" step="${st}" value="${v}"><b id="${id}V">${fmt(v)}</b></label>`;
    /* v98.712 · grow / shrink a frame ONE SIDE at a time (all 4 sides of the diamond): u+ = SE ↘ · v+ = SW ↙ · u− = NW ↖ · v− = NE ↗ — the opposite side stays where it is */
    const SIDES = [['ne', '↗ NE (v −)'], ['se', '↘ SE (u +)'], ['sw', '↙ SW (v +)'], ['nw', '↖ NW (u −)']];
    const sides = (pre, label, shaped) => shaped ? `<p class="pdhint">${label}: เป็นรูปร่างที่ระบายไว้ — ใช้แปรงเพิ่ม/ลบ หรือ "▦ เริ่มจากกรอบเดิม"</p>` : `<div class="pdr" style="display:block"><span>${label} ทีละด้าน</span>${SIDES.map(([sd, t]) => `<div class="pdr" style="grid-template-columns:1fr auto"><span>${t}</span><span><button data-sd="${pre},${sd},-0.25">−</button><button data-sd="${pre},${sd},0.25">＋</button></span></div>`).join('')}</div>`;
    const step = (f, label, cur) => `<div class="pdr"><span>${label} <b id="pd_${f}V">${cur}</b></span><span><button data-st="${f},-0.5">−</button><button data-st="${f},0.5">+</button></span></div>`;
    return `<div class="pdhead"><b>🔍 ${E.label || 'ชิ้นส่วน'}</b><div><button id="pdUndo">↶ ย้อน</button> <button id="pdClose">✓ ปิด</button></div></div>
<div class="pdbody"><div class="pdview"><div class="pdtools">${[['walk', '👆 ชี้ / ลาก (คนทดสอบ · ภาพ)'], ['order', '🟦 ย้ายกรอบฟ้า'], ['bo', '🖌 แปรงฟ้า'], ...(caps().block === false ? [] : [['block', '🟥 ย้ายกรอบแดง'], ['bb', '🖌 แปรงแดง']]), ['fit', '📐 ฐาน 3 จุด']].map(([k, n]) => `<button data-mode="${k}" aria-pressed="${mode === k}">${n}</button>`).join('')}<span class="pdzoom"><button id="pdZoomOut" title="ซูมออก (−)">−</button><b id="pdZoomV">${Math.round(Z / Z0 * 100)}%</b><button id="pdZoomIn" title="ซูมเข้า (+)">＋</button><button id="pdZoomReset" title="ขนาดเริ่มต้น">⟲</button></span></div><div id="pdBrushBar" class="pdtools" ${isBrush(mode) ? '' : 'hidden'}><button id="pdBr−" title="หัวแปรงเล็กลง">−</button><b id="pdBrN">${brushLabel()}</b><button id="pdBr+" title="หัวแปรงใหญ่ขึ้น">+</button><button id="pdBrDraw" aria-pressed="${!erase}">✏ วาด</button><button id="pdBrErase" aria-pressed="${erase}">🧽 ลบ</button><button id="pdBrFrom" title="เปลี่ยนกรอบสี่เหลี่ยมเดิมเป็นช่องกริด แล้วแก้ต่อได้">▦ เริ่มจากกรอบเดิม</button><button id="pdBrClear" title="ลบรูปร่างอิสระ กลับไปใช้กรอบสี่เหลี่ยมกว้าง/ลึก">↺ กลับเป็นสี่เหลี่ยม</button></div><label class="pdc"><input type="checkbox" id="pdSnap" ${snapOn ? 'checked' : ''}> 🧲 Snap เข้ากริด (ครึ่งช่อง) ตอนลากกรอบ</label><p id="pdDragHint" class="pdhint"></p><canvas id="pdCv" width="${CW}" height="${CH}" style="width:${CW}px!important;height:${CH}px!important;max-width:none!important"></canvas><small id="pdOffsets"></small></div><div class="pdside">
<details class="pdhelp" open><summary>วิธีตั้งให้บังตัวละครถูก</summary><ol><li>เลือก “ย้ายภาพ” จัดภาพเทียบฐาน</li><li>เลือก “ย้ายกรอบฟ้า” วางครอบฐานที่แตะพื้น แล้วปรับกว้าง/ลึก</li><li>กรอบแดง = ส่วนที่ห้ามเดิน วางและปรับแยกจากกรอบฟ้าได้</li><li>เลือก “ทดสอบคน” ลากคนไปหลังพนัก/หน้าขา ดูว่าใครบังใคร</li></ol><small>กรอบฟ้าตัดสินหน้า/หลัง · สูง/เตี้ยกำหนดวิธีแสดงเมื่อถูกบัง<br>ปิดแล้วกด ✓ เสร็จที่แผงเดิม · ⬆ Push เพื่อใช้ทุกเครื่อง</small></details>
<h4>รูปร่าง</h4>${row('pdS', 'ขนาด', Math.round((ov.s ?? 1) * 100), 30, 250, 1, v => v + '%')}${caps().rot === false ? '' : row('pdR', 'หมุน', ov.r || 0, -180, 180, 1, v => v + '°')}${caps().slant === false ? '' : row('pdIx', 'เฉียง ↗↙', Math.round((ov.ix ?? 1) * 100), 50, 200, 1, v => v + '%') + row('pdIy', 'เฉียง ↖↘', Math.round((ov.iy ?? 1) * 100), 50, 200, 1, v => v + '%')}
<label class="pdc"><input type="checkbox" id="pdF" ${ov.f ? 'checked' : ''}> กลับด้านซ้าย-ขวา</label><button id="pdArtReset">คืนตำแหน่งภาพ</button>
<section id="pdFitPanel" ${mode === 'fit' ? '' : 'hidden'}><h4>📐 ปรับมุมฐานแบบ Studio</h4><p class="pdhint">เลือกมุมฐานเดียวกัน ซ้าย → หน้าสุด → ขวา ไม่เลือกยอดพนักหรือจุดต่างระดับ</p><p id="pdFitMsg"></p><div class="pdtools"><button data-fit="balanced">ปรับ 2:1 (สมดุล)</button><button data-fit="height">รักษาความสูง</button><button data-fit="width">รักษาความกว้าง</button><button id="pdFitClear">วัดใหม่</button><button id="pdFitReset">คืนค่ามุมฐาน</button></div></section>
${D().frames ? `<h4>กรอบติดตัวภาพ</h4><p class="pdhint" id="pdFrState"></p><div class="pdr" style="display:flex;gap:6px;flex-wrap:wrap"><button id="pdFrSave" title="กรอบฟ้า/แดงนี้กลายเป็นค่าของภาพนี้ — ทุกแมพที่ใช้ภาพนี้และไม่ได้แก้เองจะตามทันที">💾 บันทึกลงภาพนี้ (ทุกแมพ)</button><button id="pdFrUse" title="ทิ้งกรอบที่แก้เฉพาะชิ้นนี้ แล้วตามค่าของภาพ">↩ ใช้ค่าของภาพ</button>${D().frames.applyAll ? '<button id="pdFrAll" title="ชิ้นอื่นบนแมพนี้ที่ใช้ภาพเดียวกันแต่เคยแก้เฉพาะชิ้นไว้ จะทิ้งกรอบเดิมแล้วตามค่าของภาพทั้งหมด">⤵ ให้ทุกชิ้นของภาพนี้ตามค่าของภาพ</button>' : ''}</div>` : ''}<h4>กรอบพื้น</h4>${sides('order', '🟦 ขยาย/ลดกรอบฟ้า', G().cellsOf(ov.zo).length > 0)}<button id="pdOrderReset">คืนตำแหน่งกรอบฟ้า</button>
${caps().block === false ? '' : `<button id="pdSzReset" title="กรอบแดง = กรอบฟ้า + ขยายด้าน SE และ SW อีก 0.5 (เท่ากด + สองที) แล้วแก้ต่อได้">🟥 ปรับกรอบแดงตามกรอบฟ้า</button><label class="pdc"><input type="checkbox" id="pdB" ${ov.block ? 'checked' : ''}> 🟥 บล็อกเดิน</label>${sides('block', '🟥 ขยาย/ลดกรอบแดง', G().cellsOf(ov.zb).length > 0)}<button id="pdBlockReset">คืนตำแหน่งกรอบแดง</button>`}${caps().note ? `<p class="pdst">${caps().note}</p>` : ''}
<h4>การบัง</h4><label class="pdc">ความสูง <select id="pdT"><option value="">อัตโนมัติ (จากชื่อ)</option><option value="tall"${ov.tall === 'tall' ? ' selected' : ''}>สูง</option><option value="low"${ov.tall === 'low' ? ' selected' : ''}>เตี้ย</option></select></label><p id="pdState" class="pdst"></p></div></div>`;
  }
  function css() {
    if (document.getElementById('pdCss')) return; const s = document.createElement('style'); s.id = 'pdCss';
    s.textContent = `#pieceDetail{width:100vw;height:100vh;max-width:100vw;max-height:100vh;margin:0;box-sizing:border-box;border:0;border-radius:0;background:#1b2a23;color:#f1e6c4;padding:0;font:13px AgThai,system-ui,sans-serif;overflow:hidden;display:flex;flex-direction:column}#pieceDetail:not([open]){display:none}#pieceDetail::backdrop{background:#0008}#pieceDetail [hidden]{display:none!important}.pdhead{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;border-bottom:1px solid #4d6656}.pdbody{display:flex;align-items:flex-start;gap:14px;padding:10px 14px;flex:1 1 auto;min-height:0;overflow:hidden}.pdview{flex:1 1 auto;min-width:0;overflow:auto}#pdCv{display:block;border-radius:10px;border:1px solid #4d6656;box-sizing:content-box;touch-action:none;cursor:grab}.pdside{width:340px;flex:0 0 340px;height:100%;overflow:auto;padding-right:6px}.pdzoom{display:flex;align-items:center;gap:6px;margin-left:auto}.pdzoom b{min-width:46px;text-align:center}.pdhead b{font-size:15px}#pieceDetail button{width:auto!important}#pieceDetail input[type=range]{width:100%}#pieceDetail label{display:grid}#pieceDetail label.pdc{display:flex}.pdside h4{margin:12px 0 4px;color:#f4dc9f;font-size:13px}.pdr{display:grid;grid-template-columns:78px 1fr 48px;gap:6px;align-items:center;margin:5px 0}.pdr:has(button){grid-template-columns:1fr auto}.pdc{display:flex;gap:6px;align-items:center;margin:6px 0}#pieceDetail button{background:#2c4437;color:#f1e6c4;border:1px solid #6f8b5b;border-radius:7px;padding:5px 8px;cursor:pointer}#pieceDetail button:disabled{opacity:.45;cursor:default}#pieceDetail button[aria-pressed=true]{background:#e6c77e;color:#221b0d;border-color:#ffe1a2}.pdst,.pdhelp,#pdFitPanel{margin:10px 0 0;padding:8px;background:#0003;border-radius:8px;line-height:1.5}.pdhelp ol{padding-left:22px;margin:6px 0}.pdtools{display:flex;gap:5px;flex-wrap:wrap}.pdhint{font-size:12px;line-height:1.5;margin:6px 0;min-height:36px}#pdOffsets{display:block;opacity:.8;margin-top:5px}@media(max-width:900px){.pdbody{flex-direction:column;overflow:auto}.pdside{width:100%;flex:0 0 auto;height:auto}}`;
    document.head.append(s);
  }
  function open(k) {
    const d = D(); if (!d || !G() || !DS()) return; const E = d.item(k); if (!E) return;
    key = k; Z = d.caps?.zoom || 1.9; Z0 = Z; S = 28 * Z; T = 14 * Z; fitCanvas(); css(); walker = { u: 0, v: 1.6 }; points = []; undo = []; mode = 'walk'; gesture = null;
    if (!dlg) { dlg = document.createElement('dialog'); dlg.id = 'pieceDetail'; document.body.append(dlg) }
    build(); if (!dlg.open) dlg.showModal();
  }
  function setMode(m) {
    gesture = null; mode = m; hover = null; if (el('pdBrushBar')) el('pdBrushBar').hidden = !isBrush(m); if ((m === 'block' || m === 'bb') && !D().ov(key).block) { edit(o => { o.block = true }); if (el('pdB')) el('pdB').checked = true }
    dlg.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', b.dataset.mode === m)); el('pdFitPanel').hidden = m !== 'fit'; cv.style.cursor = m === 'fit' || isBrush(m) ? 'crosshair' : 'grab'; paint();
  }
  /* v98.705 · FULL-SCREEN window: the canvas fills the space left of the side panel (1 canvas px = 1 screen px) · zoom with − / + / ⟲ or the mouse wheel */
  function fitCanvas() { const sideW = innerWidth < 900 ? 0 : 360; CW = Math.max(480, innerWidth - sideW - 56); CH = Math.max(360, innerHeight - (innerWidth < 900 ? 330 : 190)); CX = Math.round(CW / 2); CY = Math.round(CH * .66) }
  function setZoom(z) { Z = Math.max(.5, Math.min(6, z)); S = 28 * Z; T = 14 * Z; paint(); const l = el('pdZoomV'); if (l) l.textContent = Math.round(Z / Z0 * 100) + '%' }
  function build() {
    const E = D().item(key), ov = D().ov(key), keepY = dlg.querySelector('.pdside')?.scrollTop || 0, keepV = dlg.querySelector('.pdview')?.scrollTop || 0; dlg.innerHTML = html(E, ov); cv = el('pdCv');   /* v98.715 · re-drawing the panel keeps its scroll position (it used to jump back to the top after every click) */
    { const sd = dlg.querySelector('.pdside'), vw = dlg.querySelector('.pdview'); if (sd) sd.scrollTop = keepY; if (vw) vw.scrollTop = keepV }
    if (caps().shape === false) { /* v98.522 · a whole place: only the order frame is edited here (size / flip / base-fit belong to the place panel) */
      for (const id of ['pdS', 'pdF', 'pdT']) { const e = el(id); const c = e && e.closest('label'); if (c) c.style.display = 'none' }
      for (const id of ['pdArtReset', 'pdSzReset']) { const e = el(id); if (e) e.style.display = 'none' }
      for (const b of dlg.querySelectorAll('[data-st]')) { const r = b.closest('.pdr'); if (r) r.style.display = 'none' }
      for (const m of ['art', 'fit']) { const e = dlg.querySelector('[data-mode="' + m + '"]'); if (e) e.style.display = 'none' }
      for (const h of dlg.querySelectorAll('h4')) if (h.textContent === 'รูปร่าง' || h.textContent === 'การบัง' || h.textContent === 'กรอบพื้น') h.style.display = 'none'
    }
    const rng = (id, fn, fmt) => { const e = el(id); if (!e) return; let checkpoint = true; e.onpointerdown = () => { checkpoint = true }; e.onkeydown = () => { checkpoint = true }; e.oninput = () => { points = []; el(id + 'V').textContent = fmt(+e.value); edit(o => fn(o, +e.value), checkpoint); checkpoint = false } };
    rng('pdS', (o, v) => { o.s = v / 100 }, v => v + '%'); rng('pdR', (o, v) => { o.r = v }, v => v + '°'); rng('pdIx', (o, v) => { o.ix = v / 100 }, v => v + '%'); rng('pdIy', (o, v) => { o.iy = v / 100 }, v => v + '%');
    /* v98.693 · flipping a piece mirrors ITS OWN frames too (blue + red: offsets, widths, painted cells). A piece that follows its picture's template needs nothing: the template is mirrored for it automatically */
    el('pdF').onchange = e => {
      points = []; const own = D().frames ? !!D().frames.state(key)?.own : true, to = e.target.checked;
      edit(o => {
        const was = !!o.f; o.f = to;
        if (own && was !== to) {
          const sw = (a, b) => { const t = o[a]; if (o[b] === undefined) delete o[a]; else o[a] = o[b]; if (t === undefined) delete o[b]; else o[b] = t };
          sw('orderU', 'orderV'); sw('blockU', 'blockV'); sw('sw', 'sh'); sw('fw', 'fh');
          if (o.zo) o.zo = window.PieceGeometry.swapCells(o.zo); if (o.zb) o.zb = window.PieceGeometry.swapCells(o.zb);
        }
      }, true); build(); paint(); readouts();
    };
    if (el('pdB')) el('pdB').onchange = e => edit(o => { o.block = e.target.checked });
    el('pdT').onchange = e => edit(o => { o.tall = e.target.value });
    dlg.querySelectorAll('[data-st]').forEach(b => b.onclick = () => { const [f, d] = b.dataset.st.split(','); edit(o => { const base = f === 'sw' ? (o.sw ?? o.fw ?? .5) : f === 'sh' ? (o.sh ?? o.fh ?? .5) : (o[f] ?? .5); o[f] = Math.max(.5, Math.min(12, base + +d)) }) });
    /* v98.692 · "ปรับกรอบแดงตามกรอบฟ้า": the red frame is PAINTED over the whole blue area (the opposite of the old "blue = red"): blue cells (or the blue rectangle rounded onto the grid) are copied into the red zone, same offset, block turned on */
    if (el('pdSzReset')) el('pdSzReset').onclick = () => { edit(o => { /* v98.716 · red = the blue frame, then 2 × "＋" (0.5) further on the SE (u+) and SW (v+) sides — the sides the hero walks up to; NE / NW stay on the blue edge */ const zo = G().cellsOf(o.zo), X = .5;
      if (zo.length) { const set = new Set(zo.map(c => c[0] + ',' + c[1])), out = zo.map(c => [c[0], c[1]]); for (const [i, j] of zo) { if (!set.has((i + 1) + ',' + j)) { set.add((i + 1) + ',' + j); out.push([i + 1, j]) } if (!set.has(i + ',' + (j + 1))) { set.add(i + ',' + (j + 1)); out.push([i, j + 1]) } } o.zb = out; o.blockU = o.orderU || 0; o.blockV = o.orderV || 0 }
      else { const w = o.sw ?? o.fw ?? .5, h = o.sh ?? o.fh ?? .5; delete o.zb; o.fw = Math.round((w + X) * 1000) / 1000; o.fh = Math.round((h + X) * 1000) / 1000; o.blockU = Math.round(((o.orderU || 0) + X / 2) * 1000) / 1000; o.blockV = Math.round(((o.orderV || 0) + X / 2) * 1000) / 1000 }
      o.block = true }, true); build(); paint(); readouts() };
    el('pdArtReset').onclick = () => { points = []; edit(o => { delete o.artX; delete o.artY }) };
    el('pdOrderReset').onclick = () => edit(o => { delete o.orderU; delete o.orderV });
    if (el('pdBlockReset')) el('pdBlockReset').onclick = () => edit(o => { delete o.blockU; delete o.blockV });
    dlg.querySelectorAll('[data-sd]').forEach(b => b.onclick = () => { const [pre, sd, dd] = b.dataset.sd.split(','), d = +dd; edit(o => {
      const bl = pre === 'block', w = bl ? 'fw' : 'sw', h = bl ? 'fh' : 'sh', U = bl ? 'blockU' : 'orderU', V = bl ? 'blockV' : 'orderV';
      const W = o[w] ?? o.fw ?? .5, Hh = o[h] ?? o.fh ?? .5; let nw = W, nh = Hh, du = o[U] || 0, dv = o[V] || 0;
      if (sd === 'se' || sd === 'nw') { nw = Math.max(.25, W + d); const k = (nw - W) / 2; du += sd === 'se' ? k : -k }
      else { nh = Math.max(.25, Hh + d); const k = (nh - Hh) / 2; dv += sd === 'sw' ? k : -k }
      const r3 = x => Math.round(x * 1000) / 1000; o[w] = r3(nw); o[h] = r3(nh); o[U] = r3(du); o[V] = r3(dv); if (bl) o.block = true
    }, true); build(); paint(); readouts() });
    el('pdZoomIn').onclick = () => setZoom(Z * 1.2); el('pdZoomOut').onclick = () => setZoom(Z / 1.2); el('pdZoomReset').onclick = () => { fitCanvas(); setZoom(Z0) };
    cv.addEventListener('wheel', e => { e.preventDefault(); setZoom(Z * (e.deltaY < 0 ? 1.1 : 1 / 1.1)) }, { passive: false });
    if (!dlg._rz) { dlg._rz = true; addEventListener('resize', () => { if (dlg.open) { const z = Z; fitCanvas(); build(); setZoom(z) } }) }
    el('pdUndo').onclick = () => { const prev = undo.pop(); if (!prev) return; D().edit(key, o => { Object.keys(o).forEach(k => delete o[k]); Object.assign(o, prev) }, true); points = []; build() };
    el('pdSnap').onchange = e => { snapOn = e.target.checked; setPref('snap', snapOn) };
    el('pdBr−').onclick = () => { brush = Math.max(1, brush - 1); setPref('brush', brush); el('pdBrN').textContent = brushLabel(); paint() }; el('pdBr+').onclick = () => { brush = Math.min(12, brush + 1); setPref('brush', brush); el('pdBrN').textContent = brushLabel(); paint() };
    const em = v => { erase = v; el('pdBrDraw').setAttribute('aria-pressed', !v); el('pdBrErase').setAttribute('aria-pressed', v); paint() }; el('pdBrDraw').onclick = () => em(false); el('pdBrErase').onclick = () => em(true);
    el('pdBrFrom').onclick = () => { const m = mode === 'bb' ? 'bb' : 'bo', ov = D().ov(key); edit(o => { o[propOf(m)] = rectCells(ov, m) }) };
    el('pdBrClear').onclick = () => { const m = mode === 'bb' ? 'bb' : 'bo'; edit(o => { delete o[propOf(m)] }) };
    el('pdClose').onclick = () => dlg.close(); dlg.onclose = () => { gesture = null };
    dlg.querySelectorAll('[data-mode]').forEach(b => b.onclick = () => setMode(b.dataset.mode));
    el('pdFitClear').onclick = () => { points = []; paint() }; el('pdFitReset').onclick = () => { points = []; edit(o => { delete o.pm }) };
    dlg.querySelectorAll('[data-fit]').forEach(b => b.onclick = () => { const result = G().fit(points, b.dataset.fit, G().matrix(D().ov(key))); if (!result) return; points = []; edit(o => { o.pm = result.matrix }); setMode('walk') });
    const at = e => { const r = cv.getBoundingClientRect(); return { x: (e.clientX - r.left) * CW / r.width, y: (e.clientY - r.top) * CH / r.height } };
    /* v98.691 · the test person cannot walk into the RED (blocked) frame: the move is made in small steps; a step that would enter the frame slides along its edge (u only, then v only) or stops */
    const blockedAt = (u, v) => { const ov = D().ov(key); if (!ov.block) return false; const bl = G().footprint(ov, 0, 0, true); return (bl.parts || [bl]).some(r => u > r.u0 && u < r.u1 && v > r.v0 && v < r.v1) };
    const moveWalker = p => {
      const w = inv(p.x, p.y), wl = Math.round(5.5 * 1.9 / Z * 2) / 2, tu = limit(w.u, wl), tv = limit(w.v, wl);
      let u = walker.u, v = walker.v; const dist = Math.hypot(tu - u, tv - v), n = Math.max(1, Math.ceil(dist / .08)), du = (tu - u) / n, dv = (tv - v) / n;
      if (blockedAt(u, v)) { u = tu; v = tv }                 /* already inside (the frame was just painted over the person): let it leave freely */
      else for (let i = 0; i < n; i++) { if (!blockedAt(u + du, v + dv)) { u += du; v += dv } else if (!blockedAt(u + du, v)) u += du; else if (!blockedAt(u, v + dv)) v += dv; else break }
      walker = { u, v }; paint();
    };
    cv.onpointerdown = e => {
      if (e.button !== 0) return; e.preventDefault(); const p = at(e); cv.setPointerCapture(e.pointerId);
      if (mode === 'fit') { const i = points.findIndex(q => Math.hypot(q.x - p.x, q.y - p.y) <= 12); if (i >= 0) gesture = { kind: 'point', i, start: p, moved: false }; else if (points.length < 3) { points.push(p); paint() } return }
      if (isBrush(mode)) { const ov = D().ov(key), prop = propOf(mode); gesture = { kind: 'brush', first: true }; if (!G().cellsOf(ov[prop]).length && !erase) { const seed = rectCells(ov, mode); edit(o => { o[prop] = seed }, true); gesture.first = false } paintCells(mode, brushCells(p, mode), gesture.first); gesture.first = false; return }
      /* v98.708 · one pointer mode: press on the test person → move the person (collision / occlusion test) · press anywhere else on the picture → move the picture */
      let kind = mode; if (mode === 'walk') { const b = walkerBox; kind = b && p.x >= b.x0 && p.x <= b.x1 && p.y >= b.y0 && p.y <= b.y1 ? 'walk' : artAt(p) ? 'art' : 'pan' }   /* person → person · on the picture → picture · empty ground → move the view */
      gesture = { kind, start: p, before: copy(D().ov(key)), moved: false, cx: CX, cy: CY }; if (kind === 'walk') moveWalker(p);
    };
    cv.onpointermove = e => {
      const hp = at(e); if (isBrush(mode)) { hover = hp; if (gesture?.kind === 'brush') paintCells(mode, brushCells(hp, mode), false); else paint() }
      if (!gesture || gesture.kind === 'brush') return; const p = hp, d = gesture, dx = p.x - d.start.x, dy = p.y - d.start.y;
      if (d.kind === 'walk') { moveWalker(p); return } if (d.kind === 'pan') { CX = d.cx + dx; CY = d.cy + dy; paint(); return } if (!d.moved && Math.hypot(dx, dy) < 4) return;
      if (d.kind === 'point') { d.moved = true; points[d.i] = p; paint(); return }
      const first = !d.moved; d.moved = true; const a = inv(d.start.x, d.start.y), b = inv(p.x, p.y), before = d.before; points = [];
      edit(o => {
        if (d.kind === 'art') { o.artX = round(limit((before.artX || 0) + dx / Z, 600)); o.artY = round(limit((before.artY || 0) + dy / Z, 600)) }
        else { const prefix = d.kind === 'order' ? 'order' : 'block', f = prefix === 'order' ? ['sw', 'sh'] : ['fw', 'fh'], masked = G().cellsOf(before[prefix === 'order' ? 'zo' : 'zb']).length > 0, wU = masked ? 0 : (before[f[0]] ?? before.fw ?? .5), wV = masked ? 0 : (before[f[1]] ?? before.fh ?? .5);
          o[prefix + 'U'] = round(limit(G().snapOff((before[prefix + 'U'] || 0) + b.u - a.u, wU, snapOn))); o[prefix + 'V'] = round(limit(G().snapOff((before[prefix + 'V'] || 0) + b.v - a.v, wV, snapOn))); if (d.kind === 'order') { o.sw = before.sw ?? before.fw ?? .5; o.sh = before.sh ?? before.fh ?? .5 } }
      }, first);
    };
    const finish = (e, cancelled) => { const d = gesture; gesture = null; if (!cancelled && d?.kind === 'point' && !d.moved) { points.splice(d.i, 1); paint() } if (cv.hasPointerCapture(e.pointerId)) cv.releasePointerCapture(e.pointerId) };
    cv.onpointerleave = () => { hover = null; if (isBrush(mode)) paint() };
    cv.onpointerup = e => finish(e, false); cv.onpointercancel = e => finish(e, true); cv.onlostpointercapture = () => { gesture = null };
    paint(); readouts();
  }
  window.PieceDetail = { open };
})();
